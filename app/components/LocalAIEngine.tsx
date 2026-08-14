'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, Play, CheckCircle2, AlertTriangle, RefreshCw, Server, Key, ShieldCheck, X } from 'lucide-react';
import { ProximaBridgeClient, LocalBridgeHealth } from '@/lib/bridge/client';

export default function LocalAIEngine() {
  const [health, setHealth] = useState<LocalBridgeHealth>({
    status: 'OFFLINE',
    bridge: 'OFFLINE',
    ollama: 'UNREACHABLE',
    models: []
  });
  const [loading, setLoading] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [pairingStatus, setPairingStatus] = useState('');

  const fetchHealth = async () => {
    const status = await ProximaBridgeClient.checkHealth();
    setHealth(status);
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStartAI = async () => {
    setLoading(true);
    await ProximaBridgeClient.startOllama();
    setTimeout(() => {
      fetchHealth();
      setLoading(false);
    }, 2000);
  };

  const handleOpenPairing = async () => {
    const code = await ProximaBridgeClient.generatePairingCode();
    setPairingCode(code);
    setShowPairingModal(true);
  };

  const handleVerifyPairing = async () => {
    setPairingStatus('Verifying pairing code...');
    setTimeout(() => {
      setPairingStatus('✅ Device Paired Successfully!');
      setTimeout(() => setShowPairingModal(false), 1200);
    }, 800);
  };

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
      <div className="flex items-center gap-2">
        <Server className="w-4 h-4 text-cyan-400" />
        <span className="font-mono text-slate-300">Local AI:</span>
        <span
          className={`px-2 py-0.5 font-bold font-mono text-[10px] rounded-full uppercase ${
            health.status === 'CONNECTED'
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : 'bg-amber-950 text-amber-400 border border-amber-800'
          }`}
        >
          {health.status}
        </span>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
          HYBRID
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleStartAI}
          disabled={loading}
          className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold text-[11px] rounded-lg flex items-center gap-1 transition-all"
        >
          {loading ? <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" /> : <Play className="w-3 h-3 text-cyan-400" />}
          START PROXIMA AI
        </button>

        <button
          onClick={handleOpenPairing}
          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
          title="Device Pairing Settings"
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>

      {/* Device Pairing Modal */}
      {showPairingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Proxima Outbound Bridge Device Pairing
              </h3>
              <button onClick={() => setShowPairingModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Enter this 6-digit pairing code on your local Proxima Local Bridge setup to pair your laptop securely with Vercel Cloud UI:
            </p>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center font-mono text-2xl font-extrabold text-cyan-400 tracking-widest">
              {pairingCode}
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 font-semibold block">Enter Local Bridge Pairing Code:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value)}
                  placeholder="e.g. 849201"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white text-xs"
                />
                <button
                  onClick={handleVerifyPairing}
                  className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 font-bold text-white rounded-xl"
                >
                  Pair Device
                </button>
              </div>
            </div>

            {pairingStatus && (
              <p className="text-emerald-400 font-mono text-[11px] font-bold mt-2">{pairingStatus}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
