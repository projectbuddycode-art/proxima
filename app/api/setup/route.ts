import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { AutonomousOrchestrator, PipelineOrchestrator } from '@/lib/orchestrator/pipeline';
import { OfflineMapIntelligenceEngine } from '@/lib/discovery/map';
import { ProviderCredentialsVault } from '@/lib/security/credentials';
import { ClaudeProvider, OllamaProvider } from '@/lib/ai/provider';
import { initializeAIProvider } from '@/lib/ai/agents';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    initDb();
    const db = getDb();

    const ollamaUrlRow = await db.queryOneAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'ollama_base_url'");
    const ollamaModelRow = await db.queryOneAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'ollama_model'");

    const ollamaUrl = ollamaUrlRow?.value || 'http://127.0.0.1:11434';
    const ollamaModel = ollamaModelRow?.value || 'qwen2.5-coder:3b';

    const autonomous = await AutonomousOrchestrator.getAutonomousStatus();
    const mapIndex = await OfflineMapIntelligenceEngine.getIndexStatus('Bangalore');
    const bridgeInfo = await db.getBridgeStatusAsync();
    const logs = await db.queryAllAsync('SELECT * FROM proxima_logs ORDER BY created_at DESC LIMIT 15');

    // Fetch Claude Configuration (masked for browser safety)
    let claudeConfig: any = {
      maskedKey: 'Not Configured',
      configuredModel: 'claude-3-5-sonnet-20241022',
      status: 'NOT_CONFIGURED',
      lastValidatedAt: null,
      capabilities: ['Reasoning', 'Structured Output', 'Tool Orchestration', 'Streaming']
    };

    try {
      const cred = await db.queryOneAsync<{ key_fingerprint: string; configured_model: string; validation_status: string; last_validated_at: string }>(
        "SELECT key_fingerprint, configured_model, validation_status, last_validated_at FROM provider_credentials WHERE provider = 'CLAUDE'"
      );
      if (cred) {
        claudeConfig = {
          maskedKey: cred.key_fingerprint ? `sk-ant-***-${cred.key_fingerprint}` : 'Not Configured',
          configuredModel: cred.configured_model,
          status: cred.validation_status,
          lastValidatedAt: cred.last_validated_at,
          capabilities: ['Reasoning', 'Structured Output', 'Tool Orchestration', 'Streaming']
        };
      }
    } catch (e: any) {
      console.error('[SETUP GET] Failed to query Claude config:', e.message);
    }

    return NextResponse.json({
      status: 'READY',
      dbType: db.type,
      ollama_url: ollamaUrl,
      ollama_model: ollamaModel,
      autonomous,
      mapIndex,
      bridge: bridgeInfo,
      logs,
      claude: claudeConfig,
      message: 'System fully initialized in production mode.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    initDb();
    const db = getDb();
    const body = await request.json();

    if (body.action === 'toggle_autonomous') {
      const res = await AutonomousOrchestrator.setAutonomousMode(body.active);
      return NextResponse.json(res);
    }

    if (body.action === 'run_discovery') {
      const campaignId = body.campaignId || 'cmp_default_1';
      const offset = body.offset || 0;
      const batchSize = body.batchSize || 25;

      const result = await PipelineOrchestrator.runCampaignPipeline(campaignId, offset, batchSize);
      return NextResponse.json({
        success: true,
        offset,
        batchSize,
        ...result
      });
    }

    // Secure Save Claude Credentials API Key Command
    if (body.action === 'save_provider_credentials') {
      const { provider, apiKey, model } = body;
      if (!apiKey || apiKey.trim().length === 0) {
        return NextResponse.json({ error: 'API key cannot be empty' }, { status: 400 });
      }

      // Save credential securely
      const saveRes = await ProviderCredentialsVault.saveCredential(provider, apiKey, model);
      if (!saveRes.success) {
        return NextResponse.json({ error: 'Failed to encrypt and store credentials' }, { status: 500 });
      }

      // Validate provider immediately
      const testProvider = new ClaudeProvider(apiKey, model);
      const testRes = await testProvider.testConnection();
      const finalStatus = testRes.ok ? 'AVAILABLE' : 'AUTH_FAILED';
      await ProviderCredentialsVault.updateStatus(provider, finalStatus);

      // Re-initialize active reasoning provider instance
      await initializeAIProvider();

      return NextResponse.json({
        success: testRes.ok,
        status: finalStatus,
        message: testRes.message
      });
    }

    // Disable Claude Provider Command
    if (body.action === 'disable_provider') {
      const { provider } = body;
      await ProviderCredentialsVault.updateStatus(provider, 'DISABLED');
      await initializeAIProvider();
      return NextResponse.json({ success: true, status: 'DISABLED' });
    }

    // Test connection via saved API key
    if (body.action === 'test_provider_credentials') {
      const { provider } = body;
      const apiKey = await ProviderCredentialsVault.retrieveCredential(provider);
      if (!apiKey) {
        return NextResponse.json({ error: 'No stored credentials found to test' }, { status: 404 });
      }
      const modelRow = await db.queryOneAsync<{ configured_model: string }>(
        "SELECT configured_model FROM provider_credentials WHERE provider = ?",
        [provider]
      );
      const model = modelRow?.configured_model || 'claude-3-5-sonnet-20241022';
      const testProvider = new ClaudeProvider(apiKey, model);
      const testRes = await testProvider.testConnection();
      return NextResponse.json({
        success: testRes.ok,
        message: testRes.message
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
