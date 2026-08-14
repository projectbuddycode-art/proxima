'use client';

import React, { useEffect, useState } from 'react';
import { Compass, Sparkles, CheckCircle2, TrendingUp, Target } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-amber-400" /> Discovery Strategy Registry & Experiments Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Continuous prospecting strategy innovation and commercial hypothesis validation.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-xs py-8">Loading Prospecting Strategy Registry...</div>
      ) : (
        <div className="space-y-6">
          {/* Active Experiments */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Strategy Experiments (Hypothesis Testing)
            </h2>

            <div className="space-y-3">
              {data?.experiments?.map((exp: any) => (
                <div key={exp.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{exp.target_industry}</span>
                    <span className={`px-2.5 py-0.5 font-bold text-[10px] rounded-full uppercase ${
                      exp.status === 'PASSED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}>
                      {exp.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">Hypothesis: <em className="text-slate-200">"{exp.hypothesis}"</em></p>
                  <p className="text-xs text-emerald-400 font-semibold">{exp.recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Discovery Strategy Registry */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" /> Discovery Strategy Registry (17+ Patterns)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {data?.strategies?.map((strat: any) => (
                <div key={strat.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{strat.name}</span>
                    <span className="text-orange-400 font-mono">{strat.success_rate}% Success</span>
                  </div>
                  <p className="text-slate-400">Target: <strong className="text-slate-200">{strat.target}</strong></p>
                  <p className="text-slate-400 font-mono text-[11px]">Pattern: {strat.search_pattern}</p>
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
                    <span>Found: {strat.prospects_found}</span>
                    <span>Qualified: {strat.qualified_prospects}</span>
                    <span className="text-emerald-400 font-bold">Meetings: {strat.meetings}</span>
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
