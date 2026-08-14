import http from 'http';
import os from 'os';
import { exec } from 'child_process';

const PORT = process.env.BRIDGE_PORT || 11435;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const CLOUD_GATEWAY_URL = process.env.CLOUD_GATEWAY_URL || 'http://localhost:3000/api/gateway';
const BRIDGE_TOKEN = process.env.PROXIMA_BRIDGE_TOKEN || 'prx_bridge_token_default_2026';

// Local Command Allowlist for security protection
const ALLOWED_COMMANDS = new Set([
  'ollama_start',
  'ollama_stop',
  'ollama_status',
  'ollama_models',
  'ollama_generate',
  'ollama_pull_model',
  'health'
]);

console.log('====================================================');
console.log('🚀 PROXIMA LOCAL BRIDGE SERVICE STARTING...');
console.log(`  Bridge Port: ${PORT}`);
console.log(`  Ollama Target: ${OLLAMA_BASE_URL}`);
console.log(`  Cloud Gateway: ${CLOUD_GATEWAY_URL}`);
console.log('====================================================');

// Send 15-second heartbeat outbound to Cloud Gateway
async function sendOutboundHeartbeat() {
  try {
    let ollamaStatus = 'UNREACHABLE';
    let models = [];

    try {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        models = data.models?.map(m => m.name) || [];
        ollamaStatus = 'REACHABLE';
      }
    } catch (e) {
      ollamaStatus = 'UNREACHABLE';
    }

    const payload = {
      bridge_id: 'bridge_shivam_laptop',
      machine_id: os.hostname(),
      os: os.type(),
      arch: os.arch(),
      ollama_version: '0.3.0',
      models,
      active_model: models.length > 0 ? models[0] : 'qwen2.5-coder:7b',
      status: ollamaStatus === 'REACHABLE' ? 'CONNECTED' : 'DEGRADED',
      token: BRIDGE_TOKEN
    };

    await fetch(`${CLOUD_GATEWAY_URL}?action=heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    // Gateway connection notice (resilient background retry)
  }
}

// Start persistent 15-second heartbeat
setInterval(sendOutboundHeartbeat, 15000);
sendOutboundHeartbeat();

// Local HTTP listener for local UI control calls
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health Endpoint: GET /health
  if (req.method === 'GET' && req.url === '/health') {
    try {
      const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { method: 'GET' });
      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        const models = data.models?.map(m => m.name) || [];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'CONNECTED',
          bridge: 'ONLINE',
          ollama: 'REACHABLE',
          models,
          activeModel: models.length > 0 ? models[0] : 'qwen2.5-coder:7b',
          timestamp: new Date().toISOString()
        }));
        return;
      }
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'OFFLINE',
        bridge: 'ONLINE',
        ollama: 'UNREACHABLE',
        models: [],
        message: 'Ollama local server offline. Run `ollama serve` on local PC.',
        timestamp: new Date().toISOString()
      }));
      return;
    }
  }

  // Start Local Ollama OS Action: POST /api/command
  if (req.method === 'POST' && req.url === '/api/command') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
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
