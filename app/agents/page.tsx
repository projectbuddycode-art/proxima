'use client';

import React, { useEffect, useState } from 'react';
import { Bot, CheckCircle2, ShieldCheck, Play, Pause, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { ProximaHeader, MetricCard, StatusBadge } from '../components/ui/design-system';

export default function AgentControlCenter() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => setAgents(data.agents || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalAgentsCount = agents.length;
  const avgSuccessRate = agents.length > 0 
    ? Math.round(agents.reduce((acc, a) => acc + (a.success_rate || 0), 0) / agents.length)
    : 95;

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <ProximaHeader
        title="Autonomous AI Agent Registry"
        subtitle="Manage active agent personas across discovery, enrichment, verification, opportunity synthesis, QA review, and takeover layers."
        status="ACTIVE"
      />

      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Configured Agents" value={totalAgentsCount} color="text-[#2563EB]" />
        <MetricCard label="Average Success Rate" value={`${avgSuccessRate}%`} color="text-[#10B981]" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#64748B] gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
          <span>Synchronizing agents...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((a) => (
            <div key={a.id} className="p-5 bg-white rounded-2xl border border-[#E2E8F0] flex flex-col justify-between space-y-4 hover:border-[#CBD5E1] transition-all shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                  <span className="font-extrabold text-[#0F172A] text-sm uppercase truncate max-w-[150px]">{a.name}</span>
                  <span className="px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[9px] font-bold text-[#64748B] rounded">
                    {a.model_tier === 'strong' ? 'QWEN-3B' : 'LLAMA-FAST'}
                  </span>
                </div>
                <p className="text-[10px] text-[#2563EB] font-bold mt-2 uppercase">{a.role}</p>
                <p className="text-[#64748B] mt-2 leading-relaxed text-[11px]">{a.goal}</p>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <span className="text-[#64748B] block font-bold text-[8px] uppercase">TASKS</span>
                  <strong className="text-[#0F172A] font-bold text-xs">{a.tasks_completed}</strong>
                </div>
                <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <span className="text-[#64748B] block font-bold text-[8px] uppercase">SUCCESS</span>
                  <strong className="text-[#10B981] font-bold text-xs">{a.success_rate}%</strong>
                </div>
                <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <span className="text-[#64748B] block font-bold text-[8px] uppercase">CONF</span>
                  <strong className="text-[#F59E0B] font-bold text-xs">{a.confidence_threshold}%</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
