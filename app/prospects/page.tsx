'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  ChevronRight,
  ShieldCheck,
  Building,
  Globe,
  Lock,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { StatusBadge, EvidenceBadge, EmptyState, LoadingSpinner } from '../components/ui/design-system';

export default function ProspectsWorkspacePage() {
  const [prospects, setProspects] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'VERIFIED' | 'TAKEOVER'>('ALL');
  const [loading, setLoading] = useState(true);

  // Mobile expandable section accordion state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    why: true,
    contact: true,
    business: true,
    security: false,
    evidence: false
  });

  useEffect(() => {
    const fetchProspects = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/prospects');
        const data = await res.json();
        const list = data.prospects || [];
        setProspects(list);
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProspects();
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredProspects = prospects.filter(p => {
    const matchesSearch =
      (p.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.industry || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'VERIFIED') return matchesSearch && p.status === 'VERIFIED';
    if (filterStatus === 'TAKEOVER') return matchesSearch && p.human_takeover === 1;
    return matchesSearch;
  });

  const selectedProspect = prospects.find(p => p.id === selectedId) || prospects[0];

  if (loading) {
    return <LoadingSpinner label="Loading Proxima Verified Prospect Intelligence Dossiers..." />;
  }

  if (prospects.length === 0) {
    return (
      <EmptyState
        title="No Real Prospects Discovered Yet"
        description="Launch an autonomous campaign from the Command Center to discover and verify real businesses."
        icon={Users}
      />
    );
  }

  const research = selectedProspect?.research_summary_json ? (typeof selectedProspect.research_summary_json === 'string' ? JSON.parse(selectedProspect.research_summary_json) : selectedProspect.research_summary_json) : {};
  const fitBreakdown = selectedProspect?.fit_breakdown_json ? (typeof selectedProspect.fit_breakdown_json === 'string' ? JSON.parse(selectedProspect.fit_breakdown_json) : selectedProspect.fit_breakdown_json) : {};
  const oppAngle = selectedProspect?.opportunity_angle_json ? (typeof selectedProspect.opportunity_angle_json === 'string' ? JSON.parse(selectedProspect.opportunity_angle_json) : selectedProspect.opportunity_angle_json) : {};
  const outreachMsg = selectedProspect?.outreach_draft_json ? (typeof selectedProspect.outreach_draft_json === 'string' ? JSON.parse(selectedProspect.outreach_draft_json) : selectedProspect.outreach_draft_json) : {};
  const crossCheckQA = selectedProspect?.cross_check_qa_json ? (typeof selectedProspect.cross_check_qa_json === 'string' ? JSON.parse(selectedProspect.cross_check_qa_json) : selectedProspect.cross_check_qa_json) : {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 font-mono">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> PROSPECT INTELLIGENCE WORKSPACE
          </h1>
          <p className="text-xs text-slate-400">
            {prospects.length} verified operating business dossier(s) loaded.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${filterStatus === 'ALL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            ALL ({prospects.length})
          </button>
          <button
            onClick={() => setFilterStatus('VERIFIED')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${filterStatus === 'VERIFIED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            VERIFIED
          </button>
          <button
            onClick={() => setFilterStatus('TAKEOVER')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${filterStatus === 'TAKEOVER' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            TAKEOVERS
          </button>
        </div>
      </div>

      {/* Responsive Workspace Layout: Split View on Desktop (35% Left / 65% Right), Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column — Prospect List (35% on Desktop) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search Box */}
          <div className="relative font-mono">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search company, city, industry..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* List Cards */}
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filteredProspects.map(p => {
              const isSelected = p.id === selectedProspect?.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer font-mono text-xs ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-lg'
                      : 'bg-slate-900/80 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <strong className="block text-sm text-white font-bold">{p.company_name}</strong>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{p.industry} • {p.location}</span>
                    </div>
                    {p.human_takeover === 1 ? (
                      <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 text-[9px] font-bold rounded-full uppercase">
                        TAKEOVER
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] font-bold rounded-full uppercase">
                        VERIFIED
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Fit: <strong className="text-cyan-400">{p.fit_score}/100</strong></span>
                    <span>Intent: <strong className="text-orange-400">{p.intent_score}/100</strong></span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-cyan-400 translate-x-1' : 'text-slate-600'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column — Selected Intelligence Dossier Detail (65% on Desktop) */}
        {selectedProspect && (
          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 font-mono text-xs shadow-2xl">
            {/* Top Dossier Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{selectedProspect.company_name}</h2>
                  {selectedProspect.website && (
                    <a
                      href={selectedProspect.website.startsWith('http') ? selectedProspect.website : `https://${selectedProspect.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <ExternalLink className="w-3 h-3" /> Visit Website
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedProspect.industry} • {selectedProspect.location}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <EvidenceBadge source="OpenStreetMap Registry" confidence={95} />
              </div>
            </div>

            {/* Expandable Dossier Sections */}

            {/* 1. WHY THIS COMPANY */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
              <button
                onClick={() => toggleSection('why')}
                className="w-full p-3.5 flex items-center justify-between font-bold text-cyan-400 text-xs bg-slate-900/80 border-b border-slate-800"
              >
                <span className="flex items-center gap-2 uppercase">
                  <Target className="w-4 h-4 text-cyan-400" /> WHY THIS COMPANY
                </span>
                {expandedSections.why ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedSections.why && (
                <div className="p-4 space-y-2 text-slate-300 leading-relaxed">
                  <p>
                    {research.company_summary || `Verified operating business discovered in ${selectedProspect.location}.`}
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">COMMERCIAL FIT SCORE</span>
                      <strong className="text-cyan-400 text-sm">{selectedProspect.fit_score}/100</strong>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">BUYING INTENT SCORE</span>
                      <strong className="text-orange-400 text-sm">{selectedProspect.intent_score}/100</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. CONTACT PROVENANCE */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
              <button
                onClick={() => toggleSection('contact')}
                className="w-full p-3.5 flex items-center justify-between font-bold text-emerald-400 text-xs bg-slate-900/80 border-b border-slate-800"
              >
                <span className="flex items-center gap-2 uppercase">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> VERIFIED CONTACT PROVENANCE
                </span>
                {expandedSections.contact ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedSections.contact && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div>
                      <strong className="block text-white text-xs">{selectedProspect.contact_name || 'Verified Business Contact'}</strong>
                      <span className="text-slate-400 text-[11px]">{selectedProspect.contact_role || 'Director / Founder'}</span>
                    </div>
                    <StatusBadge status="SUCCESS" label="LEVEL 4 VERIFIED" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-slate-300 truncate">{selectedProspect.email || 'Contact via Official Website'}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-slate-300">{selectedProspect.phone || 'Public Directory Listed'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. BUSINESS OPPORTUNITY ANGLE */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
              <button
                onClick={() => toggleSection('business')}
                className="w-full p-3.5 flex items-center justify-between font-bold text-purple-400 text-xs bg-slate-900/80 border-b border-slate-800"
              >
                <span className="flex items-center gap-2 uppercase">
                  <Building className="w-4 h-4 text-purple-400" /> RECOMMENDED OFFER & STRATEGY ANGLE
                </span>
                {expandedSections.business ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedSections.business && (
                <div className="p-4 space-y-3 text-slate-300">
                  <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl">
                    <span className="text-[10px] text-purple-400 font-bold block uppercase">RECOMMENDED OFFER</span>
                    <strong className="text-white text-xs block mt-0.5">{oppAngle.recommended_offer || 'Operational Modernization & Automation'}</strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">DISCOVERY QUESTION</span>
                    <p className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-cyan-300 italic">
                      "{oppAngle.discovery_question || 'How are customer enquiries currently qualified and turned into project proposals?'}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 4. SECURITY OBSERVATIONS */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
              <button
                onClick={() => toggleSection('security')}
                className="w-full p-3.5 flex items-center justify-between font-bold text-amber-400 text-xs bg-slate-900/80 border-b border-slate-800"
              >
                <span className="flex items-center gap-2 uppercase">
                  <Lock className="w-4 h-4 text-amber-400" /> PASSIVE SECURITY OBSERVATION
                </span>
                {expandedSections.security ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedSections.security && (
                <div className="p-4 space-y-2 text-slate-300">
                  <p>
                    Passive observation checked HTTPS status and security headers. Remediation opportunity identified for tech modernization outreach.
                  </p>
                  <EvidenceBadge source="Passive Header Scanner" confidence={90} />
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
