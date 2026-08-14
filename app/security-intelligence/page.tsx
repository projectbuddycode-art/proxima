'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, Lock, Terminal, Cpu } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" /> Passive Security Intelligence Agent
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorized, passive observations of public HTTPS, security headers, DNS, and technology stack signatures.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/60 border border-cyan-800 text-cyan-300 font-bold text-xs rounded-full">
          <Lock className="w-3.5 h-3.5 text-cyan-400" /> Authorized Passive Observation Only
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-xs py-8">Loading Security Observations...</div>
      ) : (
        <div className="space-y-4">
          {observations.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No passive security observations recorded yet.</p>
            </div>
          ) : (
            observations.map(obs => (
              <div key={obs.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-cyan-400">{obs.target_domain}</span>
                  <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold rounded-full">
                    HTTPS ACTIVE
                  </span>
                </div>

                <p className="text-xs text-slate-300">{obs.observation_summary}</p>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <span className="text-orange-400 font-bold block mb-1">Project Buddy Remediation Opportunity:</span>
                  <p className="text-slate-300 leading-relaxed">{obs.project_buddy_remediation_opportunity}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
