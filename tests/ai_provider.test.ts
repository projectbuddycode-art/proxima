import { initDb, getDb } from '../lib/db';
import { ProviderCredentialsVault } from '../lib/security/credentials';
import { getAIProvider, setActiveAIProvider, initializeAIProvider } from '../lib/ai/agents';
import { ClaudeProvider, OllamaProvider, MockProvider } from '../lib/ai/provider';
import { AICapabilityRouter } from '../lib/ai/router';

// Save original fetch
const originalFetch = global.fetch;

async function runAIProviderTestSuite() {
  console.log('========================================================================');
  console.log('🔥 PROXIMA MULTI-PROVIDER AI RUNTIME TEST SUITE');
  console.log('========================================================================\n');

  initDb();
  const db = getDb();
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [AI PROVIDER TEST ${total}] ${desc}: PASS`);
      passed++;
    } else {
      console.error(`  ❌ [AI PROVIDER TEST ${total}] ${desc}: FAIL`);
      process.exit(1);
    }
  }

  try {
    // Clean up test database records
    await db.executeAsync("DELETE FROM provider_credentials WHERE provider = 'CLAUDE'");

    // 1. Secure credentials encryption and decryption
    const testKey = 'sk-ant-testkey1234567890abcdefghijklmnopqrstuv';
    const providerName = 'CLAUDE';
    const model = 'claude-3-5-sonnet-20241022';

    const saveRes = await ProviderCredentialsVault.saveCredential(providerName, testKey, model);
    assert(saveRes.success === true, 'Save credential returns success');
    assert(Boolean(saveRes.fingerprint), 'Save credential returns key fingerprint');
    assert(saveRes.fingerprint.length === 16, 'Key fingerprint length is derived and 16 characters');
    assert(!testKey.includes(saveRes.fingerprint), 'Key fingerprint does not expose raw key');

    const decrypted = await ProviderCredentialsVault.retrieveCredential(providerName);
    assert(decrypted === testKey, 'Decrypted key matches original saved key');

    const masked = ProviderCredentialsVault.maskApiKey(testKey);
    assert(masked.startsWith('sk-ant-'), 'API key is masked and starts with prefix');
    assert(!masked.includes('testkey123'), 'API key masking does not leak raw body of key');

    // 2. Connection test validation logic with mocked HTTP response
    const provider = new ClaudeProvider(testKey);
    global.fetch = (() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ content: [{ text: 'Connection Success' }] })
      })) as any;

    const testConnRes = await provider.testConnection();
    assert(testConnRes.ok === true, 'Claude test connection passes for valid mock key');
    assert(testConnRes.models?.includes('claude-3-5-sonnet-20241022') ?? false, 'Claude test connection returns list of models');

    // 3. Failed connection test validation
    global.fetch = (() =>
      Promise.resolve({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized Key')
      })) as any;

    const testConnFailRes = await provider.testConnection();
    assert(testConnFailRes.ok === false, 'Claude test connection fails for invalid key (401)');
    assert(testConnFailRes.message?.includes('AUTH_FAILED') ?? false, 'Failed connection returns AUTH_FAILED category');

    // 4. Dynamic registry initialization
    await initializeAIProvider();
    const fallbackProvider = getAIProvider();
    assert(fallbackProvider instanceof OllamaProvider, 'Registry falls back to OllamaProvider when Claude is not configured');

    await ProviderCredentialsVault.updateStatus('CLAUDE', 'AVAILABLE');
    await initializeAIProvider();
    const activeProvider = getAIProvider();
    assert(activeProvider instanceof ClaudeProvider, 'Registry returns ClaudeProvider when status is AVAILABLE');
    assert(activeProvider.name === 'Claude', 'Active provider name is Claude');

    // 5. AI Capability Routing to active provider
    const mock = new MockProvider();
    setActiveAIProvider(mock);

    const taskType = 'RESPONSE_CLASSIFICATION';
    const payload = { message: 'Tell me more about your pricing' };

    const routerRes = await AICapabilityRouter.routeTask(taskType, payload);
    assert(routerRes.success === true, 'Capability router executes reasoning task successfully');
    assert(routerRes.data?.classification === 'INTERESTED', 'Router returns correct mock classification');

    // Restore global fetch
    global.fetch = originalFetch;

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passed}/${total} AI PROVIDER UPGRADE TESTS PASSED CLEANLY!`);
    console.log('========================================================================\n');
    process.exit(0);

  } catch (err: any) {
    console.error('Fatal test execution error:', err.message);
    process.exit(1);
  }
}

runAIProviderTestSuite();
