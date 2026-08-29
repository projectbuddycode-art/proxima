'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, Lock, Terminal, Cpu } from 'lucide-react';
import { ProximaHeader, MetricCard, StatusBadge } from '../components/ui/design-system';

export default function SecurityIntelligencePage() {
  const [observations, setObservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/security')
      .then(res => res.json())
      .then(data => setObservations(data.observations || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <ProximaHeader
        title="Security Scouts Panel"
        subtitle="Passive validation of public SSL certificate integrity, security headers, and technical stack layouts."
        status="ACTIVE"
      />

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#64748B] gap-2">
          <Terminal className="w-4 h-4 animate-spin text-[#2563EB]" />
          <span>Synchronizing security metrics...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {observations.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
              <ShieldAlert className="w-10 h-10 text-[#64748B] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#0F172A] uppercase">No passive security anomalies recorded</p>
            </div>
          ) : (
            observations.map(obs => (
              <div key={obs.id} className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-3 hover:border-[#CBD5E1] transition-all shadow-sm">
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                  <span className="font-extrabold text-[#0891B2] text-sm uppercase">{obs.target_domain}</span>
                  <StatusBadge status="SUCCESS" label="HTTPS ACTIVE" />
                </div>

                <p className="text-xs text-[#475569] leading-relaxed">{obs.observation_summary}</p>

                <div className="p-4 bg-[#FFFBEB] rounded-xl border border-[#FDE68A] text-xs text-[#92400E]">
                  <strong className="block text-[9px] uppercase tracking-wider mb-1">Project Buddy Solution Hook:</strong>
                  <p className="leading-relaxed">{obs.project_buddy_remediation_opportunity}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
