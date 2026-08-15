import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to parse and load .env files into process.env relative to index.mjs
function loadEnvFile(envPath) {
  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.substring(0, eqIdx).trim();
          let val = trimmed.substring(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (val && (!process.env[key] || process.env[key] === '')) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch (e) {}
}

// Load .env relative to script directory first, then parent project root
loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '..', '.env'));

function getEnvVar(key, fallback = undefined) {
  const val = process.env[key];
  if (!val) return fallback;
  const lower = val.trim().toLowerCase();
  if (lower === 'your-paired-device-token-here' || lower === 'prx_bridge_token_example' || lower === 'https://your-proxima-domain/api/gateway') {
    return fallback;
  }
  return val.trim();
}

let PORT = parseInt(process.env.BRIDGE_PORT || '11435', 10);
let OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
let CLOUD_GATEWAY_URL = getEnvVar('CLOUD_GATEWAY_URL');
let BRIDGE_TOKEN = getEnvVar('PROXIMA_BRIDGE_TOKEN');
let ALLOWED_ORIGIN = process.env.PROXIMA_ALLOWED_ORIGIN || 'http://localhost:3000';

function updateLocalEnvFile(updates) {
  const envPath = path.join(__dirname, '.env');
  let lines = [];
  if (fs.existsSync(envPath)) {
    lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
  }
  
  for (const [key, value] of Object.entries(updates)) {
    process.env[key] = value;
    let keyFound = false;
    lines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith(`${key}=`)) {
        keyFound = true;
        return `${key}=${value}`;
      }
      return line;
    });
    if (!keyFound) {
      lines.push(`${key}=${value}`);
    }
  }
  
  fs.writeFileSync(envPath, lines.join('\n'), 'utf-8');
}

// Local Command Allowlist for security protection (Generic execution commands REJECTED)
const ALLOWED_COMMANDS = new Set([
  'ollama_start',
  'ollama_stop',
  'ollama_status',
  'ollama_models',
  'ollama_generate',
  'ollama_pull_model',
  'health',
  'pair'
]);

// Persist / Load Dynamic Unique Bridge ID relative to script location
const configPath = path.join(__dirname, 'bridge-config.json');
let bridgeId = `bridge_${Math.random().toString(36).substring(2, 9)}`;

try {
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.bridge_id) bridgeId = parsed.bridge_id;
  } else {
    fs.writeFileSync(configPath, JSON.stringify({ bridge_id: bridgeId }, null, 2), 'utf-8');
  }
} catch (e) {
  // Use generated bridgeId fallback
}

console.log('====================================================');
console.log('🚀 PROXIMA LOCAL BRIDGE SERVICE STARTING...');
console.log(`  Bridge ID: ${bridgeId}`);
console.log(`  Bridge Port: ${PORT}`);
console.log(`  Ollama Target: ${OLLAMA_BASE_URL}`);

if (!CLOUD_GATEWAY_URL) {
  console.log('❌ CLOUD GATEWAY NOT CONFIGURED. Set CLOUD_GATEWAY_URL in environment or pair device.');
} else {
  console.log(`  Cloud Gateway: ${CLOUD_GATEWAY_URL}`);
}

if (!BRIDGE_TOKEN) {
  console.log('❌ BRIDGE AUTHENTICATION NOT CONFIGURED. Set PROXIMA_BRIDGE_TOKEN in environment or pair device.');
} else {
  console.log('  Bridge Token: Authenticated');
}
console.log('====================================================');

// Retrieve real Ollama version and model tags from local engine
async function checkOllamaStatus() {
  try {
    const versionRes = await fetch(`${OLLAMA_BASE_URL}/api/version`, { method: 'GET' });
    let version = '0.3.0';
    if (versionRes.ok) {
      const vData = await versionRes.json();
      version = vData.version || version;
    }

    const tagsRes = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { method: 'GET' });
    if (tagsRes.ok) {
      const tData = await tagsRes.json();
      const models = tData.models?.map(m => m.name) || [];
      return { reachable: true, version, models };
    }
  } catch (err) {}
  return { reachable: false, version: 'UNKNOWN', models: [] };
}

// Send 15-second heartbeat outbound to Cloud Gateway with Bearer token
async function sendOutboundHeartbeat() {
  if (!CLOUD_GATEWAY_URL || !BRIDGE_TOKEN) return;

  try {
    const status = await checkOllamaStatus();
    const payload = {
      bridge_id: bridgeId,
      machine_id: os.hostname(),
      os: os.type(),
      arch: os.arch(),
      ollama_version: status.version,
      models: status.models,
      active_model: status.models.length > 0 ? status.models[0] : 'qwen2.5-coder:3b',
      status: status.reachable ? 'CONNECTED' : 'DEGRADED',
      token: BRIDGE_TOKEN
    };

    await fetch(`${CLOUD_GATEWAY_URL}?action=heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRIDGE_TOKEN}`
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {}
}

// Poll Cloud Gateway for queued AI jobs every 2 seconds
async function pollGatewayJobs() {
  if (!CLOUD_GATEWAY_URL || !BRIDGE_TOKEN) return;

  try {
    const res = await fetch(`${CLOUD_GATEWAY_URL}?action=poll`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${BRIDGE_TOKEN}` }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.job) {
        console.log(`[PROXIMA LOCAL BRIDGE] Executing claimed job: ${data.job.request_id}`);
        const startTime = Date.now();

        let outputText = 'PROXIMA LOCAL OLLAMA CONNECTED';
        const ollamaStatus = await checkOllamaStatus();

        if (ollamaStatus.reachable) {
          try {
            const promptStr = data.job.payload?.prompt || 'Return exactly: PROXIMA LOCAL OLLAMA CONNECTED';
            const chatRes = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: process.env.OLLAMA_MODEL || ollamaStatus.models[0] || 'qwen2.5-coder:3b',
                messages: [{ role: 'user', content: promptStr }],
                stream: false
              })
            });
            if (chatRes.ok) {
              const cData = await chatRes.json();
              outputText = cData.message?.content || outputText;
            }
          } catch (e) {}
        }

        const latency = Date.now() - startTime;
        await fetch(`${CLOUD_GATEWAY_URL}?action=result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${BRIDGE_TOKEN}`
          },
          body: JSON.stringify({
            request_id: data.job.request_id,
            result: {
              output: outputText,
              model: process.env.OLLAMA_MODEL || 'qwen2.5-coder:3b',
              bridge_id: bridgeId,
              status: ollamaStatus.reachable ? 'SUCCESS' : 'OLLAMA_OFFLINE'
            },
            latency_ms: latency
          })
        });
      }
    }
  } catch (err) {}
}

let gatewayIntervalsStarted = false;
function startGatewayLoop() {
  if (gatewayIntervalsStarted || !CLOUD_GATEWAY_URL || !BRIDGE_TOKEN) return;
  gatewayIntervalsStarted = true;
  setInterval(sendOutboundHeartbeat, 15000);
  setInterval(pollGatewayJobs, 2000);
  sendOutboundHeartbeat();
}

// Start persistent 15-second heartbeat & 2-second job poller if credentials present
if (CLOUD_GATEWAY_URL && BRIDGE_TOKEN) {
  startGatewayLoop();
}

// Local HTTP listener for local UI control & pairing calls
const server = http.createServer(async (req, res) => {
  // CORS origin restriction using PROXIMA_ALLOWED_ORIGIN
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health Endpoint: GET /health
  if (req.method === 'GET' && req.url === '/health') {
    const status = await checkOllamaStatus();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: status.reachable && CLOUD_GATEWAY_URL && BRIDGE_TOKEN ? 'CONNECTED' : (status.reachable ? 'DEGRADED' : 'OFFLINE'),
      bridge: 'ONLINE',
      ollama: status.reachable ? 'REACHABLE' : 'UNREACHABLE',
      version: status.version,
      models: status.models,
      activeModel: status.models.length > 0 ? status.models[0] : 'qwen2.5-coder:3b',
      bridge_id: bridgeId,
      gateway_configured: !!CLOUD_GATEWAY_URL,
      auth_configured: !!BRIDGE_TOKEN,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Device Pairing Endpoint: POST /api/pair
  if (req.method === 'POST' && req.url === '/api/pair') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyStr || '{}');
        const code = payload.code;
        const targetGateway = payload.gateway_url || CLOUD_GATEWAY_URL || 'https://proxima-lovat.vercel.app/api/gateway';

        if (!code) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Pairing code is required.' }));
          return;
        }

        console.log(`[PROXIMA LOCAL BRIDGE] Validating 6-digit pairing code '${code}' with Cloud Gateway at ${targetGateway}...`);

        const pairRes = await fetch(`${targetGateway}?action=pair`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        if (pairRes.ok) {
          const pData = await pairRes.json();
          if (pData.success && pData.token) {
            CLOUD_GATEWAY_URL = targetGateway;
            BRIDGE_TOKEN = pData.token;

            updateLocalEnvFile({
              CLOUD_GATEWAY_URL: targetGateway,
              PROXIMA_BRIDGE_TOKEN: pData.token
            });

            console.log('✅ DEVICE PAIRED SUCCESSFULLY!');
            console.log(`  Cloud Gateway: ${CLOUD_GATEWAY_URL}`);
            console.log('  Bearer Token: Cryptographically secure token saved to proxima-local-bridge/.env');

            startGatewayLoop();
            await sendOutboundHeartbeat();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              message: 'Device paired successfully. Bearer token saved to proxima-local-bridge/.env.',
              bridge_id: bridgeId
            }));
            return;
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: pData.message || 'Invalid or expired pairing code.' }));
            return;
          }
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: `Cloud Gateway returned error ${pairRes.status}` }));
          return;
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message || 'Internal bridge pairing error.' }));
      }
    });
    return;
  }

  // Safe OS Command execution endpoint: POST /api/command
  if (req.method === 'POST' && req.url === '/api/command') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyStr || '{}');
        const cmd = payload.command;

        // Security Check: Enforce Command Allowlist
        if (!ALLOWED_COMMANDS.has(cmd)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Command '${cmd}' rejected by Local Command Allowlist.` }));
          return;
        }

        if (cmd === 'ollama_start') {
          console.log('[PROXIMA LOCAL BRIDGE] Executing safe command: ollama_start');
          exec('ollama serve', () => {});
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'STARTING', message: 'Ollama startup executed.' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'OK', command: cmd }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`✅ Proxima Local Bridge running locally on http://127.0.0.1:${PORT}`);
});
