'use client';

import React, { useEffect, useState } from 'react';
import { Target, Play, PlusCircle, Building2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ProximaHeader, MetricCard, StatusBadge } from '../components/ui/design-system';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleRunPipeline = async (campaignId: string) => {
    setExecuting(campaignId);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EXECUTE', campaignId })
      });
      const data = await res.json();
      alert(data.message || 'Pipeline completed successfully!');
      fetchCampaigns();
    } catch (e) {
      alert('Pipeline execution failed');
    } finally {
      setExecuting(null);
    }
  };

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE' || c.status === 'CREATED').length;
  const failedCampaigns = campaigns.filter(c => c.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <ProximaHeader
        title="Prospecting Campaigns"
        subtitle="Manage GTM acquisition targets, location scanning parameters, and outreach offer payloads."
        status="ACTIVE"
      />

      {/* Top Overview metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total Campaigns" value={totalCampaigns} />
        <MetricCard label="Active / Queued" value={activeCampaigns} color="text-[#2563EB]" />
        <MetricCard label="Failed Runs" value={failedCampaigns} color="text-[#EF4444]" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#64748B] font-mono text-xs gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
          <span>Synchronizing campaigns...</span>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
          <Building2 className="w-10 h-10 text-[#64748B] mx-auto mb-2" />
          <p className="text-sm font-bold text-[#0F172A] font-mono uppercase">No active campaigns configured</p>
          <p className="text-xs text-[#64748B] mt-1">Configure your first GTM segment on the Command Center home page to start discovery.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((c) => (
            <div key={c.id} className="p-6 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4 hover:border-[#CBD5E1] transition-all">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <h3 className="font-extrabold text-[#0F172A] text-sm font-mono uppercase truncate max-w-[200px]">{c.name}</h3>
                <StatusBadge
                  status={c.status === 'FAILED' ? 'ERROR' : c.status === 'ACTIVE' || c.status === 'CREATED' ? 'SUCCESS' : 'PENDING'}
                  label={c.status}
                />
              </div>

              <div className="text-xs font-mono text-[#475569] space-y-2">
                <div>Industry: <strong className="text-[#0F172A]">{c.industry}</strong></div>
                <div>Location Target: <strong className="text-[#0F172A]">{c.location}</strong></div>
                <div>Configured Offer: <strong className="text-[#2563EB]">{c.offer}</strong></div>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] font-mono">
                <span className="text-[#64748B]">
                  INTENT THRESHOLD: {c.min_intent} | FIT: {c.min_fit}
                </span>
                
                <button
                  onClick={() => handleRunPipeline(c.id)}
                  disabled={executing === c.id}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 text-white font-extrabold rounded-xl flex items-center gap-1.5 transition-colors uppercase tracking-wider shadow-sm ml-auto sm:ml-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  {executing === c.id ? 'Processing...' : 'Run Discovery Run'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
