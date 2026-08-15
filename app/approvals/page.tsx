'use client';

import React, { useEffect, useState } from 'react';
import { CheckSquare, CheckCircle2, XCircle, AlertTriangle, Cpu, ArrowRight, ShieldCheck, RefreshCw, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ApprovalsCenterPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/approvals');
      const data = await res.json();
      setProposals(data.proposals || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActioningId(id);
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      const data = await res.json();
      setProposals(prev =>
        prev.map(p => (p.id === id ? { ...p, status: data.status } : p))
      );
    } catch (err) {
      alert('Failed to process approval action');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1 font-mono">
            <CheckSquare className="w-4 h-4 text-emerald-400" /> PROXIMA CONTROL PLANE & APPROVALS
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Development Commander Release Proposals</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Review, audit, and approve self-improvement release candidates prepared by Development Commander. Proxima never deploys to production without explicit Shivam approval.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-mono text-xs rounded-full font-bold">
          <ShieldCheck className="w-4 h-4" /> Shivam Approval Required
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-xs py-8 font-mono">Loading Release Candidates...</div>
      ) : proposals.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 font-mono text-xs text-slate-400">
          No release candidates currently pending review. Development Commander operating baseline cycle.
        </div>
      ) : (
        <div className="space-y-5">
          {proposals.map((p) => (
            <div
              key={p.id}
              className={`p-6 rounded-2xl border transition-all ${
                p.status === 'APPROVED'
                  ? 'bg-emerald-950/20 border-emerald-700/60'
                  : p.status === 'REJECTED'
                  ? 'bg-red-950/20 border-red-700/60'
                  : 'bg-slate-900 border-slate-800 shadow-xl'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-950 text-purple-300 font-mono text-[10px] font-bold rounded border border-purple-800">
                      {p.version}
                    </span>
                    <h3 className="font-bold text-white text-base">{p.title}</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">ID: {p.id}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                    p.status === 'APPROVED'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : p.status === 'REJECTED'
                      ? 'bg-red-950 text-red-400 border-red-800'
                      : 'bg-amber-950 text-amber-400 border-amber-800'
                  }`}>
                    STATUS: {p.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase block font-bold">PREVIOUS BEHAVIOR</span>
                  <p className="text-slate-300">{p.previous_behavior}</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase block font-bold">PROPOSED NEW BEHAVIOR</span>
                  <p className="text-emerald-400 font-bold">{p.new_behavior}</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase block font-bold">EXPECTED MEASURED IMPACT</span>
                  <p className="text-cyan-300">{p.expected_impact}</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase block font-bold">AUTOMATED TESTS & BENCHMARK</span>
                  <p className="text-slate-300">{p.tests_summary}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 mt-3 text-xs font-mono flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">AFFECTED FILES</span>
                  <span className="text-slate-300 text-[11px]">{p.files_changed}</span>
                </div>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-emerald-400 font-bold text-[10px] rounded">
                  RISK: {p.risk_level}
                </span>
              </div>

              {p.status === 'PENDING' && (
                <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80 mt-4">
                  <button
                    onClick={() => handleAction(p.id, 'approve')}
                    disabled={actioningId === p.id}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg"
                  >
                    {actioningId === p.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    APPROVE & DEPLOY TO PRODUCTION
                  </button>

                  <button
                    onClick={() => handleAction(p.id, 'reject')}
                    disabled={actioningId === p.id}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> REJECT
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
