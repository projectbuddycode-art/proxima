'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Eye, Flame, AlertTriangle } from 'lucide-react';

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProspects = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/prospects');
        const data = await res.json();
        setProspects(data.prospects || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProspects();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" /> Prospects & Opportunity Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            All discovered, qualified, and researched prospects across local campaigns.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-xs py-8">Loading prospects...</div>
      ) : prospects.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
          <p className="text-sm text-slate-400">No prospects available. Launch a campaign from the Dashboard.</p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Company</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Industry / Location</th>
                <th className="p-4">Intent Score</th>
                <th className="p-4">Fit Score</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {prospects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-white">
                    {p.company_name}
                    {p.human_takeover === 1 && (
                      <span className="ml-2 px-2 py-0.5 bg-red-600 text-white font-bold text-[9px] rounded-full uppercase">
                        TAKEOVER
                      </span>
                    )}
                  </td>
                  <td className="p-4">{p.contact_name} ({p.role || 'Contact'})</td>
                  <td className="p-4">{p.industry} • {p.location}</td>
                  <td className="p-4 font-bold text-orange-400">{p.intent_score}/100</td>
                  <td className="p-4 font-bold text-blue-400">{p.fit_score}/100</td>
                  <td className="p-4 font-semibold text-slate-200">{p.status}</td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/prospects/${p.id}`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> WHY THIS LEAD?
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
