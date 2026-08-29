'use client';

import React from 'react';
import { ShieldCheck, Lock, AlertTriangle, Cpu, Terminal, CheckCircle2 } from 'lucide-react';
import { ProximaHeader, MetricCard, StatusBadge } from '../components/ui/design-system';

export default function AgentSecurityCenter() {
  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <ProximaHeader
        title="Agent Security Policy Center"
        subtitle="Monitors and enforces safety rules, prompt injection defenses, and strict data leakage bounds."
        status="ACTIVE"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-3 hover:border-[#CBD5E1] transition-all shadow-sm">
          <div className="flex items-center gap-2 font-extrabold text-[#0F172A] uppercase">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Web Input Sanitizer
          </div>
          <p className="text-[#64748B] leading-relaxed">
            Scraped website text is strictly isolated and validated as raw context, preventing indirect instructions.
          </p>
        </div>

        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-3 hover:border-[#CBD5E1] transition-all shadow-sm">
          <div className="flex items-center gap-2 font-extrabold text-[#0F172A] uppercase">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Zero-Synthetic Firewall
          </div>
          <p className="text-[#64748B] leading-relaxed">
            Flags and removes synthetic placeholders, enforcing Level 4 real public source traceability.
          </p>
        </div>

        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-3 hover:border-[#CBD5E1] transition-all shadow-sm">
          <div className="flex items-center gap-2 font-extrabold text-[#0F172A] uppercase">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Channel Access Firewall
          </div>
          <p className="text-[#64748B] leading-relaxed">
            Requires strict OAuth verification levels before loading active channel interfaces.
          </p>
        </div>
      </div>
    </div>
  );
}
