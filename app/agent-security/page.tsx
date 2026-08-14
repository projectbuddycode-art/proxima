'use client';

import React from 'react';
import { ShieldCheck, Lock, AlertTriangle, Cpu, Terminal, CheckCircle2 } from 'lucide-react';

export default function AgentSecurityCenter() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-cyan-400" /> Agent Security & Safety Firewall
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitors prompt injection defense, untrusted content isolation, and outbound action permissions across all 27 agents.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-bold text-xs rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Prompt Injection Protection ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 font-bold text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Web Content Sanitizer
          </div>
          <p className="text-slate-400 leading-relaxed">
            Scraped website text is strictly treated as untrusted data, never as system instructions.
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 font-bold text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero-Fabrication Firewall
          </div>
          <p className="text-slate-400 leading-relaxed">
            Strips synthetic contact values in REAL MODE and enforces source traceability.
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 font-bold text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Outbound Firewall
          </div>
          <p className="text-slate-400 leading-relaxed">
            Requires explicit contact verification level before sending messages via live channels.
          </p>
        </div>
      </div>
    </div>
  );
}
