'use client';

import React, { useEffect, useState } from 'react';
import { Compass, Sparkles, CheckCircle2, TrendingUp, Target, RefreshCw } from 'lucide-react';
import { ProximaHeader, MetricCard, StatusBadge } from '../components/ui/design-system';

export default function ExperimentsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/experiments')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <ProximaHeader
        title="Opportunities & Strategy Engine"
        subtitle="Continuous GTM prospecting innovation, automated strategic hypotheses, and conversion yield validation."
        status="ACTIVE"
      />

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#64748B] gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
          <span>Synchronizing strategy registry...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Experiments */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="text-xs font-black text-[#0F172A] flex items-center gap-2 uppercase tracking-wider border-b border-[#F1F5F9] pb-3">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" /> GTM Strategy Hypotheses
            </h2>

            <div className="space-y-3">
              {data?.experiments?.map((exp: any) => (
                <div key={exp.id} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#0F172A] text-sm uppercase">{exp.target_industry}</span>
                    <StatusBadge
                      status={exp.status === 'PASSED' ? 'SUCCESS' : 'PENDING'}
                      label={exp.status}
                    />
                  </div>
                  <p className="text-xs text-[#475569]">Hypothesis: <em className="text-[#0F172A]">"{exp.hypothesis}"</em></p>
                  <p className="text-xs text-[#10B981] font-bold">Recommendation: {exp.recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Discovery Strategy Registry */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="text-xs font-black text-[#0F172A] flex items-center gap-2 uppercase tracking-wider border-b border-[#F1F5F9] pb-3">
              <Target className="w-4 h-4 text-[#2563EB]" /> Market Discovery Registry
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.strategies?.map((strat: any) => (
                <div key={strat.id} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2 hover:border-[#CBD5E1] transition-all">
                  <div className="flex items-center justify-between font-extrabold text-[#0F172A]">
                    <span className="uppercase">{strat.name}</span>
                    <span className="text-[#10B981]">{strat.success_rate}% Success</span>
                  </div>
                  <p className="text-[#64748B]">Target ICP: <strong className="text-[#0F172A]">{strat.target}</strong></p>
                  <p className="text-[#64748B] text-[10px]">OSM Pattern: {strat.search_pattern}</p>
                  <div className="pt-2 border-t border-[#E2E8F0] text-[10px] text-[#64748B] flex justify-between font-bold">
                    <span>Indexed: {strat.prospects_found}</span>
                    <span>Qualified: {strat.qualified_prospects}</span>
                    <span className="text-[#10B981]">Opportunities: {strat.meetings}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
