'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Bot, ShieldCheck, CheckCircle2, RefreshCw, Server, AlertCircle } from 'lucide-react';
import { ProximaHeader, MetricCard, StatusBadge } from '../components/ui/design-system';

export default function SettingsPage() {
  const [setup, setSetup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-6 max-w-4xl mx-auto font-mono text-xs">
      {/* Header */}
      <ProximaHeader
        title="Settings & Diagnostics"
        subtitle="Manage LLM orchestration parameters, database settings, and active compliance safeguards."
        status="ACTIVE"
        actions={
          <button
            onClick={fetchStatus}
            className="px-3.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#EDF2F7] text-[#64748B] hover:text-[#0F172A] font-bold text-xs rounded-xl flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-diagnose
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#64748B] gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
          <span>Synchronizing settings parameters...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Step 1: AI Provider (Ollama) */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 className="text-xs font-black text-[#0F172A] flex items-center gap-2 uppercase tracking-wider">
                <Bot className="w-5 h-5 text-[#2563EB]" /> Core AI Model: Local Ollama
              </h3>
              {setup?.ollama?.connected ? (
                <StatusBadge status="SUCCESS" label="Connected" />
              ) : (
                <StatusBadge status="WARNING" label="Mock Fallback Engine" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block mb-1 text-[9px] uppercase font-bold">API HOST</span>
                <code className="text-[#0F172A] font-mono">{setup?.ollama?.baseUrl || 'http://localhost:11434'}</code>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block mb-1 text-[9px] uppercase font-bold">LLM MODEL</span>
                <code className="text-[#2563EB] font-mono">{setup?.ollama?.model || 'llama3'}</code>
              </div>
            </div>

            {!setup?.ollama?.connected && (
              <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs space-y-2 text-[#92400E]">
                <p className="font-extrabold uppercase">Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-[#92400E]">
                  <li>Download and launch Ollama locally.</li>
                  <li>In terminal, execute: <code className="font-bold">ollama serve</code></li>
                  <li>Pull the default model: <code className="font-bold">ollama pull llama3</code></li>
                </ol>
              </div>
            )}
          </div>

          {/* Step 2: Knowledge Base Diagnostics */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-[#0F172A] flex items-center gap-2 uppercase tracking-wider border-b border-[#F1F5F9] pb-3">
              <Server className="w-5 h-5 text-[#2563EB]" /> Grounded Knowledge Base Status
            </h3>
            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-[#475569]">15 Playbook Markdown Files</span>
              <StatusBadge status="SUCCESS" label="Loaded & Active" />
            </div>
          </div>

          {/* Step 3: Safety Guardrails */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-[#0F172A] flex items-center gap-2 uppercase tracking-wider border-b border-[#F1F5F9] pb-3">
              <ShieldCheck className="w-5 h-5 text-[#10B981]" /> Outbound Protection Guardrails
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block mb-1 text-[9px] uppercase font-bold">Daily Limit</span>
                <strong className="text-[#0F172A]">10 messages / day</strong>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block mb-1 text-[9px] uppercase font-bold"> शिवम Takeover Trigger</span>
                <strong className="text-[#EF4444]">IMMEDIATE ON INTERACTION</strong>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block mb-1 text-[9px] uppercase font-bold">API Invoicing</span>
                <strong className="text-[#10B981]">FREE SELF-HOSTED MODEL</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
