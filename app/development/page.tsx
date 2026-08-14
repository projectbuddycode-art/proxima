'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, Terminal, CheckCircle2, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';

export default function DevelopmentCommanderPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/development')
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
            <Cpu className="w-6 h-6 text-purple-400" /> Development Commander & Bug Hunter Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous codebase inspection, low-risk bug fixes, regression testing, and feature discovery.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-xs py-8">Loading Development Commander Diagnostics...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bug Hunter Reports */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" /> Bug Hunter Reports & Patches
            </h3>

            <div className="space-y-3 text-xs">
              {data?.bugs?.map((b: any) => (
                <div key={b.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-cyan-400 font-bold">{b.source}</span>
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[10px] rounded-full">
                      {b.status}
                    </span>
                  </div>
                  <p className="text-white text-xs">{b.description}</p>
                  <p className="text-slate-500 text-[11px]">Reproduction: {b.reproduction_steps}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Discovery & Tool Builder */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Feature Discovery & Tool Builder
            </h3>

            <div className="space-y-3 text-xs">
              {data?.features?.map((f: any) => (
                <div key={f.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{f.title}</span>
                    <span className="px-2 py-0.5 bg-purple-950 text-purple-400 border border-purple-800 font-mono text-[10px] rounded-full">
                      {f.status}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{f.business_impact}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
