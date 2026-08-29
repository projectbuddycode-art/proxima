'use client';

import React, { useEffect, useState } from 'react';
import { CheckSquare, CheckCircle2, XCircle, AlertTriangle, Cpu, ArrowRight, ShieldCheck, RefreshCw, FileText } from 'lucide-react';
import Link from 'next/link';
import { ProximaHeader, MetricCard, StatusBadge } from '../components/ui/design-system';

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

  const pendingCount = proposals.filter(p => p.status === 'PENDING').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-mono text-xs">
      
      {/* Page Header */}
      <ProximaHeader
        title="Approvals Control Plane"
        subtitle="Review, audit, and authorize self-improvement patches and outbound campaigns. Automation is held until human sign-off."
        status="ACTIVE"
      />

      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Pending Releases" value={pendingCount} color="text-[#F59E0B]" />
        <MetricCard label="Total Processed Proposals" value={proposals.length} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#64748B] gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
          <span>Synchronizing queue...</span>
        </div>
      ) : proposals.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#E2E8F0] shadow-sm text-[#64748B]">
          No release candidates or campaigns currently pending authorization.
        </div>
      ) : (
        <div className="space-y-6">
          {proposals.map((p) => (
            <div
              key={p.id}
              className={`p-6 rounded-2xl border transition-all bg-white ${
                p.status === 'APPROVED'
                  ? 'border-[#A7F3D0] shadow-sm'
                  : p.status === 'REJECTED'
                  ? 'border-[#FCA5A5] shadow-sm'
                  : 'border-[#E2E8F0] shadow-md'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#1E40AF] text-[10px] font-bold rounded border border-[#BFDBFE]">
                      {p.version}
                    </span>
                    <h3 className="font-extrabold text-[#0F172A] text-sm uppercase">{p.title}</h3>
                  </div>
                  <span className="text-[10px] text-[#94A3B8] mt-0.5 block">Release ID: {p.id}</span>
                </div>

                <div>
                  <StatusBadge
                    status={p.status === 'APPROVED' ? 'SUCCESS' : p.status === 'REJECTED' ? 'ERROR' : 'WARNING'}
                    label={p.status}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                  <span className="text-[#64748B] text-[9px] uppercase block font-bold">PREVIOUS BEHAVIOR</span>
                  <p className="text-[#475569]">{p.previous_behavior}</p>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                  <span className="text-[#64748B] text-[9px] uppercase block font-bold">PROPOSED RELEASE DEPLOYMENT</span>
                  <p className="text-[#10B981] font-bold">{p.new_behavior}</p>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                  <span className="text-[#64748B] text-[9px] uppercase block font-bold">EXPECTED IMPACT METRIC</span>
                  <p className="text-[#2563EB] font-bold">{p.expected_impact}</p>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                  <span className="text-[#64748B] text-[9px] uppercase block font-bold">AUTOMATED BENCHMARK SUITE</span>
                  <p className="text-[#475569]">{p.tests_summary}</p>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] mt-3 flex items-center justify-between">
                <div>
                  <span className="text-[#64748B] text-[9px] uppercase block">TARGET FILES</span>
                  <span className="text-[#0F172A] text-[11px] font-bold">{p.files_changed}</span>
                </div>
                <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] font-bold text-[9px] rounded">
                  RISK: {p.risk_level}
                </span>
              </div>

              {p.status === 'PENDING' && (
                <div className="flex items-center gap-3 pt-4 border-t border-[#F1F5F9] mt-4">
                  <button
                    onClick={() => handleAction(p.id, 'approve')}
                    disabled={actioningId === p.id}
                    className="flex-1 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    {actioningId === p.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    APPROVE & DEPLOY TO PRODUCTION
                  </button>

                  <button
                    onClick={() => handleAction(p.id, 'reject')}
                    disabled={actioningId === p.id}
                    className="px-5 py-2.5 bg-white border border-[#E2E8F0] hover:bg-[#FEF2F2] hover:text-[#991B1B] text-[#64748B] font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
                  >
                    <XCircle className="w-4 h-4 text-[#EF4444]" /> REJECT
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
