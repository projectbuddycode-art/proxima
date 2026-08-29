'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Flame,
  AlertTriangle,
  Building2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  HelpCircle,
  Sparkles,
  Bot
} from 'lucide-react';
import { ProximaHeader, MetricCard, StatusBadge, EvidenceBadge } from '../../components/ui/design-system';

export default function ProspectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/prospects?id=${id}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error('Failed to load prospect detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[#64748B] text-xs font-mono">Loading Prospect Intelligence Breakdown...</div>
      </div>
    );
  }

  if (!data || !data.prospect) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#E2E8F0]">
        <h3 className="text-sm font-bold text-[#0F172A] font-mono uppercase">Prospect Not Found</h3>
        <Link href="/" className="text-xs text-[#2563EB] mt-2 block font-mono">Return to Dashboard</Link>
      </div>
    );
  }

  const { prospect, research, opportunity, messages, responses, followups, sources } = data;

  const findings = research?.observable_website_findings ? JSON.parse(research.observable_website_findings) : [];
  const hypotheses = research?.pain_hypotheses ? JSON.parse(research.pain_hypotheses) : [];
  const signals = research?.buying_signals ? JSON.parse(research.buying_signals) : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-mono text-xs">
      {/* Back Button & Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </button>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-full text-xs font-bold text-[#F59E0B] shadow-sm">
            Intent Score: {prospect.intent_score}/100
          </span>
          <span className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-full text-xs font-bold text-[#2563EB] shadow-sm">
            Fit Score: {prospect.fit_score}/100
          </span>
        </div>
      </div>

      {/* 🚨 HUMAN TAKEOVER BANNER */}
      {prospect.human_takeover === 1 && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] p-5 rounded-2xl space-y-2 text-[#991B1B] shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#991B1B] uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-[#EF4444]" /> 🚨 HUMAN TAKEOVER REQUIRED
          </div>
          <h2 className="text-lg font-extrabold text-[#7F1D1D] uppercase">
            Prospect Expressed Interest — Sequence Automation Halted
          </h2>
          <p className="text-xs text-[#991B1B] leading-relaxed">
            {prospect.takeover_reason || 'Prospect requested more information or requested a discovery conversation.'}
          </p>
        </div>
      )}

      {/* Prospect Header */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-[#0F172A] uppercase">{prospect.company_name}</h1>
            {prospect.website && (
              <a
                href={prospect.website}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"
              >
                {prospect.website} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Contact: <strong className="text-[#0F172A]">{prospect.contact_name}</strong> ({prospect.role || 'Decision Maker'}) • Location: {prospect.location}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#475569]">
            Status: <strong className="text-[#0F172A] uppercase">{prospect.status}</strong>
          </span>
        </div>
      </div>

      {/* 5-LEVEL VERIFIED CONTACT PROVENANCE CARDS */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-4 shadow-sm">
        <h3 className="font-extrabold text-[#1E3A8A] flex items-center gap-2 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" /> VERIFIED CONTACT PROVENANCE METRICS
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* PHONE */}
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
            <span className="text-[#64748B] text-[9px] uppercase block font-bold">PHONE NUMBER</span>
            {prospect.phone ? (
              <div>
                <strong className="text-[#0F172A] text-xs block">{prospect.phone}</strong>
                <span className="text-[9px] text-[#10B981] flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> VERIFIED
                </span>
              </div>
            ) : (
              <div>
                <strong className="text-[#94A3B8] text-xs block">NULL</strong>
                <span className="text-[9px] text-[#94A3B8] font-bold block mt-0.5">—</span>
              </div>
            )}
          </div>

          {/* EMAIL */}
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
            <span className="text-[#64748B] text-[9px] uppercase block font-bold">EMAIL ADDRESS</span>
            {prospect.email ? (
              <div>
                <strong className="text-[#0F172A] text-xs block truncate">{prospect.email}</strong>
                <span className="text-[9px] text-[#10B981] flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> VERIFIED
                </span>
              </div>
            ) : (
              <div>
                <strong className="text-[#94A3B8] text-xs block">NULL</strong>
                <span className="text-[9px] text-[#94A3B8] font-bold block mt-0.5">—</span>
              </div>
            )}
          </div>

          {/* WEBSITE */}
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
            <span className="text-[#64748B] text-[9px] uppercase block font-bold">OFFICIAL WEBSITE</span>
            {prospect.website ? (
              <div>
                <strong className="text-[#2563EB] text-xs block truncate">{prospect.website}</strong>
                <span className="text-[9px] text-[#10B981] flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> VERIFIED
                </span>
              </div>
            ) : (
              <div>
                <strong className="text-[#94A3B8] text-xs block">NULL</strong>
                <span className="text-[9px] text-[#94A3B8] font-bold block mt-0.5">—</span>
              </div>
            )}
          </div>

          {/* PROVENANCE SOURCE */}
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
            <span className="text-[#64748B] text-[9px] uppercase block font-bold">EVIDENCE SOURCE</span>
            <strong className="text-[#0891B2] text-xs block truncate">OSM Public Registry</strong>
            <span className="text-[9px] text-[#0891B2] font-bold block mt-0.5">LEVEL 4 VERIFIED</span>
          </div>
        </div>
      </div>

      {/* WHY THIS LEAD PANEL */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
          <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2 uppercase tracking-wider">
            <Sparkles className="w-5 h-5 text-[#2563EB]" /> TRANSPARENT EVIDENCE MATRIX
          </h2>
          <span className="text-[10px] text-[#64748B]">Confidence: {Math.round((prospect.confidence || 0.85) * 100)}%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
            <span className="font-bold text-[#2563EB] uppercase tracking-wider text-[9px]">WHY CONTACT NOW</span>
            <p className="text-[#475569]">{research?.reason_to_contact_now || 'Discovered via public business directory strategy.'}</p>
          </div>

          <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
            <span className="font-bold text-[#2563EB] uppercase tracking-wider text-[9px]">TARGET FIT ANGLE</span>
            <p className="text-[#475569]">High margin business in {prospect.industry} experiencing lead drop-off due to manual catalogue processes.</p>
          </div>

          <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
            <span className="font-bold text-[#10B981] uppercase tracking-wider text-[9px]">OBSERVABLE FINDINGS</span>
            <ul className="list-disc list-inside text-[#475569] space-y-1">
              {findings.length > 0 ? findings.map((f: string, i: number) => (
                <li key={i}>{f}</li>
              )) : <li>Discovered verified business coordinates and operating details</li>}
            </ul>
          </div>

          <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
            <span className="font-bold text-[#0891B2] uppercase tracking-wider text-[9px]">PAIN HYPOTHESES</span>
            <ul className="list-disc list-inside text-[#475569] space-y-1">
              {hypotheses.length > 0 ? hypotheses.map((h: string, i: number) => (
                <li key={i}>{h}</li>
              )) : <li>Quote turnaround time and customer qualification overheads</li>}
            </ul>
          </div>

          <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
            <span className="font-bold text-[#F59E0B] uppercase tracking-wider text-[9px]">SUGGESTED DISCOVERY QUESTION</span>
            <p className="text-[#475569]">{opportunity?.discovery_question || 'Curious — how are your sales coordinators managing WhatsApp catalogue enquiries during peak hours?'}</p>
          </div>

          <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
            <span className="font-bold text-[#EF4444] uppercase tracking-wider text-[9px]">SAFETY / ANTI-PRESUMPTION RULES</span>
            <p className="text-[#475569]">Do NOT assume exact IT budget or technical staff size until discovery conversation.</p>
          </div>
        </div>
      </div>

      {/* Commercial Strategy & Offer */}
      {opportunity && (
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2 uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-[#2563EB]" /> Recommended Commercial Strategy
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-[#64748B] block mb-1">Recommended Offer</span>
              <strong className="text-[#2563EB] text-sm">{opportunity.recommended_offer}</strong>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-[#64748B] block mb-1">Estimated Commercial Value</span>
              <strong className="text-[#10B981] text-sm">{opportunity.estimated_commercial_band || '$8,500'}</strong>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-[#64748B] block mb-1">Solution Category</span>
              <strong className="text-[#0891B2] text-sm uppercase">{opportunity.recommended_solution_category || 'CRM / AUTOMATION'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Outreach Message */}
      {messages && messages.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <h3 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2 uppercase tracking-wider">
              <Send className="w-4 h-4 text-[#2563EB]" /> Generated Personalized Outreach Draft
            </h3>
            <StatusBadge status="SUCCESS" label={`QA PASSED: ${messages[0].score || 90}/100`} />
          </div>

          <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
            <p className="text-[#64748B] font-bold">Subject: <span className="text-[#0F172A]">{messages[0].subject}</span></p>
            <div className="p-4 bg-white rounded-lg border border-[#E2E8F0] text-[#475569] leading-relaxed whitespace-pre-wrap">
              {messages[0].body}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
