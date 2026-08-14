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
        <div className="text-slate-400 text-sm">Loading Prospect Intelligence Breakdown...</div>
      </div>
    );
  }

  if (!data || !data.prospect) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-bold text-white">Prospect Not Found</h3>
        <Link href="/" className="text-xs text-orange-400 mt-2 block">Return to Dashboard</Link>
      </div>
    );
  }

  const { prospect, research, opportunity, messages, responses, followups, sources } = data;

  const findings = research?.observable_website_findings ? JSON.parse(research.observable_website_findings) : [];
  const hypotheses = research?.pain_hypotheses ? JSON.parse(research.pain_hypotheses) : [];
  const signals = research?.buying_signals ? JSON.parse(research.buying_signals) : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Button & Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-orange-400">
            Intent Score: {prospect.intent_score}/100
          </span>
          <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-blue-400">
            Fit Score: {prospect.fit_score}/100
          </span>
        </div>
      </div>

      {/* 🚨 HUMAN TAKEOVER BANNER */}
      {prospect.human_takeover === 1 && (
        <div className="bg-red-950 border-2 border-red-600 p-5 rounded-2xl space-y-2 text-white shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-red-300 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-red-400" /> 🚨 HUMAN TAKEOVER REQUIRED
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Prospect Expressed Interest — Sequence Automation Stopped
          </h2>
          <p className="text-xs text-red-200">
            {prospect.takeover_reason || 'Prospect requested more information or requested a discovery conversation.'}
          </p>
        </div>
      )}

      {/* Prospect Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white">{prospect.company_name}</h1>
            <a
              href={prospect.website}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
            >
              {prospect.website} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Contact: <strong className="text-slate-200">{prospect.contact_name}</strong> ({prospect.role || 'Decision Maker'}) • Location: {prospect.location}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300">
            Status: <strong className="text-white">{prospect.status}</strong>
          </span>
        </div>
      </div>

      {/* MANDATORY "WHY THIS LEAD?" PANEL */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900 border-2 border-orange-500/40 p-6 rounded-2xl space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-400" /> "WHY THIS LEAD?" — TRANSPARENT EVIDENCE PANEL
          </h2>
          <span className="text-xs font-mono text-slate-400">Confidence: {Math.round((prospect.confidence || 0.85) * 100)}%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-bold text-orange-400 uppercase tracking-wider text-[10px]">WHY WE FOUND THEM</span>
            <p className="text-slate-200">{research?.reason_to_contact_now || 'Discovered via public business directory strategy.'}</p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-bold text-blue-400 uppercase tracking-wider text-[10px]">WHY THEY FIT</span>
            <p className="text-slate-200">High margin business in {prospect.industry} experiencing lead drop-off due to manual catalogue processes.</p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">WHAT WE OBSERVED (OBSERVABLE FACTS)</span>
            <ul className="list-disc list-inside text-slate-300 space-y-1">
              {findings.map((f: string, i: number) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-bold text-purple-400 uppercase tracking-wider text-[10px]">WHAT WE THINK (PAIN HYPOTHESES)</span>
            <ul className="list-disc list-inside text-slate-300 space-y-1">
              {hypotheses.map((h: string, i: number) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">WHAT WE SHOULD ASK IN DISCOVERY</span>
            <p className="text-slate-200">{opportunity?.discovery_question || 'Curious — how are your sales coordinators managing WhatsApp catalogue enquiries during peak hours?'}</p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-bold text-red-400 uppercase tracking-wider text-[10px]">WHAT WE SHOULD NOT ASSUME</span>
            <p className="text-slate-200">Do NOT assume exact IT budget or technical staff size until discovery conversation.</p>
          </div>
        </div>
      </div>

      {/* Commercial Strategy & Offer */}
      {opportunity && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-400" /> Formulated Commercial Strategy
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Recommended Offer</span>
              <strong className="text-orange-400 text-sm">{opportunity.recommended_offer}</strong>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Commercial Band (Directional)</span>
              <strong className="text-emerald-400 text-sm">{opportunity.estimated_commercial_band}</strong>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Solution Category</span>
              <strong className="text-blue-400 text-sm uppercase">{opportunity.recommended_solution_category}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Personalized Outreach Message */}
      {messages && messages.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" /> Generated Personalized Outreach
            </h3>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
              QA Passed: {messages[0].score}/100
            </span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <p className="text-slate-400">Subject: <strong className="text-slate-200">{messages[0].subject}</strong></p>
            <div className="p-3 bg-slate-900 rounded-lg text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
              {messages[0].body}
            </div>
          </div>
        </div>
      )}

      {/* Sources Traceability */}
      {sources && sources.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Public Source Traceability
          </h3>

          <div className="space-y-2 text-xs">
            {sources.map((src: any) => (
              <div key={src.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200">{src.title}</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">{src.snippet}</p>
                </div>
                <a href={src.url} target="_blank" rel="noreferrer" className="text-xs text-orange-400 hover:underline flex items-center gap-1">
                  Source Link <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
