'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Bot, ShieldCheck, CheckCircle2, RefreshCw, Server, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [setup, setSetup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testingOllama, setTestingOllama] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/setup');
      const data = await res.json();
      setSetup(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-400" /> Settings & System Diagnostics Wizard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure local Ollama LLM provider, view system status, and verify privacy safeguards.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="px-3 py-1.5 bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1 hover:bg-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-test Diagnostic
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 text-xs py-8">Checking local system configuration...</div>
      ) : (
        <div className="space-y-6">
          {/* Step 1: AI Provider (Ollama) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-400" /> Primary AI Engine: Local Ollama
              </h3>
              {setup?.ollama?.connected ? (
                <span className="px-3 py-1 bg-emerald-950 text-emerald-400 font-bold text-xs rounded-full border border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-950 text-amber-400 font-bold text-xs rounded-full border border-amber-800 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Offline (Mock Fallback Engine Active)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Base URL</span>
                <code className="text-white font-mono">{setup?.ollama?.baseUrl || 'http://localhost:11434'}</code>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Configured Model</span>
                <code className="text-orange-400 font-mono">{setup?.ollama?.model || 'llama3'}</code>
              </div>
            </div>

            {!setup?.ollama?.connected && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
                <p className="font-bold text-amber-400">Ollama Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Install Ollama locally from <code className="text-slate-200">https://ollama.com</code></li>
                  <li>Run command in terminal: <code className="text-orange-400">ollama serve</code></li>
                  <li>Pull recommended model: <code className="text-orange-400">ollama pull llama3</code></li>
                </ol>
                <p className="text-[11px] text-slate-500 pt-1">
                  * Note: System will seamlessly use local rule fallback engine while Ollama is offline or downloading models.
                </p>
              </div>
            )}
          </div>

          {/* Step 2: Knowledge Base Diagnostics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-400" /> Knowledge Base Status
            </h3>
            <div className="flex items-center justify-between text-xs p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-300">15 Playbook Markdown Files</span>
              <span className="text-emerald-400 font-bold">Loaded & Active</span>
            </div>
          </div>

          {/* Step 3: Safety Guardrails & Limits */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Outreach Safety & Conservative Rate Limits
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Daily Outreach Limit</span>
                <strong className="text-white">10 messages / day</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Human Takeover Trigger</span>
                <strong className="text-red-400">INSTANT ON HIGH-INTENT</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">API Key Requirement</span>
                <strong className="text-emerald-400">$0 / ZERO PAID APIS</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
