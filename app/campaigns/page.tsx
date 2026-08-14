'use client';

import React, { useEffect, useState } from 'react';
import { Target, Play, PlusCircle, Building2, CheckCircle2 } from 'lucide-react';

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
      alert(data.message || 'Pipeline executed!');
      fetchCampaigns();
    } catch (e) {
      alert('Pipeline execution failed');
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-400" /> Active Prospecting Campaigns
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage local target campaigns, research rules, intent thresholds, and daily limits.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-xs py-8">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
          <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No campaigns found. Return to Dashboard to click "FIND CLIENTS".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <div key={c.id} className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">{c.name}</h3>
                <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 font-bold text-[10px] rounded-full border border-emerald-800 uppercase">
                  {c.status}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <p>Industry: <strong className="text-slate-100">{c.industry}</strong></p>
                <p>Location: <strong className="text-slate-100">{c.location}</strong></p>
                <p>Offer: <strong className="text-orange-400">{c.offer}</strong></p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Min Intent: {c.min_intent} | Min Fit: {c.min_fit}</span>
                <button
                  onClick={() => handleRunPipeline(c.id)}
                  disabled={executing === c.id}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow"
                >
                  <Play className="w-3.5 h-3.5" />
                  {executing === c.id ? 'Running...' : 'Run Discovery & Pipeline'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
