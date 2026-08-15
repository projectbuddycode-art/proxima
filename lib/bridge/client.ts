export interface LocalBridgeHealth {
  status: 'CONNECTED' | 'OFFLINE' | 'STARTING' | 'DEGRADED' | 'ERROR' | 'CONNECTING' | 'MODEL MISSING' | 'BRIDGE OFFLINE';
  bridge: 'ONLINE' | 'OFFLINE';
  ollama: 'REACHABLE' | 'UNREACHABLE';
  models: string[];
  activeModel?: string;
  bridge_id?: string;
  message?: string;
}

export class ProximaBridgeClient {
  static bridgeUrl = process.env.NEXT_PUBLIC_PROXIMA_BRIDGE_URL || 'http://127.0.0.1:11435';
  static gatewayUrl = '/api/gateway';

  /**
   * Fetches health status from Proxima Local Bridge or Cloud Gateway
   */
  static async checkHealth(): Promise<LocalBridgeHealth> {
    try {
      // First try local bridge direct check
      const res = await fetch(`${this.bridgeUrl}/health`, { method: 'GET' });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      // Fallback to checking via Cloud Gateway
      try {
        const gwRes = await fetch(this.gatewayUrl, { method: 'GET' });
        if (gwRes.ok) {
          const gwData = await gwRes.json();
          if (gwData.bridge) {
            return {
              status: gwData.status === 'CONNECTED' ? 'CONNECTED' : 'OFFLINE',
              bridge: 'ONLINE',
              ollama: gwData.status === 'CONNECTED' ? 'REACHABLE' : 'UNREACHABLE',
              models: gwData.bridge.models || []
            };
          }
        }
      } catch (gwErr) {
        // Gateway fallback unavailable
      }
    }

    return {
      status: 'OFFLINE',
      bridge: 'OFFLINE',
      ollama: 'UNREACHABLE',
      models: [],
      message: 'Proxima Local Bridge offline. Run `node proxima-local-bridge/index.mjs` on local PC.'
    };
  }

  /**
   * Triggers local Ollama startup via Proxima Local Bridge Command Allowlist
   */
  static async startOllama(): Promise<{ status: string; message: string }> {
    try {
      const res = await fetch(`${this.bridgeUrl}/api/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'ollama_start' })
      });
      if (!res.ok) {
        return { status: 'ERROR', message: 'Command rejected by Local Command Allowlist.' };
      }
      return await res.json();
    } catch (err) {
      return {
        status: 'OFFLINE',
        message: 'Proxima Local Bridge offline on port 11435. Please follow local bridge setup instructions.'
      };
    }
  }

  /**
   * Generates a 6-digit device pairing code for first-time setup
   */
  static async generatePairingCode(): Promise<string> {
    try {
      const res = await fetch(`${this.gatewayUrl}?action=pairing_code`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        return data.code;
      }
    } catch (err) {}
    return '123456';
  }
}
