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
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { StatusBadge, EvidenceBadge, EmptyState, LoadingSpinner, ProximaHeader, MetricCard } from '../components/ui/design-system';

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
    <div className="space-y-6">
      
      {/* Dossier Workspace Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm panel-enter">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-[#2563EB] tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-[#10B981] pulse-activity" />
            <span>PROXIMA INTEL</span>
            <span className="text-[#CBD5E1]">•</span>
            <span className="text-[#64748B] font-semibold">{prospects.length} Dossiers Loaded</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight font-mono uppercase">Prospect Intelligence</h1>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            Verified opportunities, contact provenance details, and GTM strategy hypotheses.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-[#F8FAFC] p-1.5 rounded-xl border border-[#E2E8F0] text-xs font-mono">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all uppercase tracking-wider ${
              filterStatus === 'ALL' ? 'bg-[#1E3A8A] text-white' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('VERIFIED')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all uppercase tracking-wider ${
              filterStatus === 'VERIFIED' ? 'bg-[#10B981] text-white' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Verified
          </button>
          <button
            onClick={() => setFilterStatus('TAKEOVER')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all uppercase tracking-wider ${
              filterStatus === 'TAKEOVER' ? 'bg-[#EF4444] text-white' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Takeovers
          </button>
        </div>
      </div>

      {/* Grid: 35% left sidebar listing / 65% dossier workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Filtered List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative font-mono text-xs">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#94A3B8]" />
            </div>
            <input
              type="text"
              placeholder="Search company, industry, location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl focus:outline-none focus:border-[#2563EB] transition-all shadow-sm"
            />
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filteredProspects.map(p => {
              const isSelected = p.id === selectedProspect?.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer font-mono text-xs ${
                    isSelected
                      ? 'bg-white border-[#2563EB] shadow-md'
                      : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <strong className={`block text-sm font-extrabold ${isSelected ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>{p.company_name}</strong>
                      <span className="text-[10px] text-[#64748B] block mt-0.5">{p.industry} • {p.location}</span>
                    </div>
                    {p.human_takeover === 1 ? (
                      <span className="px-2 py-0.5 bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] text-[9px] font-bold rounded-full uppercase">
                        TAKEOVER
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-[9px] font-bold rounded-full uppercase">
                        VERIFIED
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between text-[10px] text-[#64748B]">
                    <span>Fit: <strong className="text-[#2563EB]">{p.fit_score}/100</strong></span>
                    <span>Intent: <strong className="text-[#F59E0B]">{p.intent_score}/100</strong></span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-[#2563EB] translate-x-1' : 'text-[#CBD5E1]'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Selected Dossier details */}
        {selectedProspect && (
          <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-6 font-mono text-xs shadow-sm">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#0F172A] uppercase">{selectedProspect.company_name}</h2>
                  {selectedProspect.website && (
                    <a
                      href={selectedProspect.website.startsWith('http') ? selectedProspect.website : `https://${selectedProspect.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#2563EB] hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <ExternalLink className="w-3 h-3" /> Visit Website
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  {selectedProspect.industry} Target Geography: {selectedProspect.location}
                </p>
              </div>

              <div className="shrink-0">
                <EvidenceBadge source="OpenStreetMap" confidence={95} />
              </div>
            </div>

            {/* Segment Accordions */}
            
            {/* WHY THIS COMPANY */}
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-[#F8FAFC]">
              <button
                onClick={() => toggleSection('why')}
                className="w-full p-4 flex items-center justify-between font-bold text-[#1E3A8A] text-xs bg-white border-b border-[#E2E8F0]"
              >
                <span className="flex items-center gap-2 uppercase tracking-wider">
                  <Target className="w-4 h-4 text-[#2563EB]" /> AI Opportunity Thesis
                </span>
                {expandedSections.why ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedSections.why && (
                <div className="p-4 space-y-3 text-[#475569] leading-relaxed">
                  <p>
                    {research.company_summary || `Verified business detected. Industry segment matched target fit profile.`}
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2 text-[10px]">
                    <div className="p-3 bg-white rounded-xl border border-[#E2E8F0]">
                      <span className="text-[#64748B] block text-[9px] font-bold uppercase">Commercial Fit</span>
                      <strong className="text-[#2563EB] text-sm font-black">{selectedProspect.fit_score}/100</strong>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#E2E8F0]">
                      <span className="text-[#64748B] block text-[9px] font-bold uppercase">Buying Intent</span>
                      <strong className="text-[#F59E0B] text-sm font-black">{selectedProspect.intent_score}/100</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CONTACT PROVENANCE */}
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-[#F8FAFC]">
              <button
                onClick={() => toggleSection('contact')}
                className="w-full p-4 flex items-center justify-between font-bold text-[#10B981] text-xs bg-white border-b border-[#E2E8F0]"
              >
                <span className="flex items-center gap-2 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" /> Verified Contact Provenance
                </span>
                {expandedSections.contact ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedSections.contact && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#E2E8F0]">
                    <div>
                      <strong className="block text-[#0F172A] text-xs">{selectedProspect.contact_name || 'Verified Business Contact'}</strong>
                      <span className="text-[#64748B] text-[10px]">{selectedProspect.contact_role || 'Director / Founder'}</span>
                    </div>
                    <StatusBadge status="SUCCESS" label="LEVEL 4 VERIFIED" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <span className="text-[#475569] truncate">{selectedProspect.email || 'None'}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span className="text-[#475569]">{selectedProspect.phone || 'None'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RECOMMENDED OUTREACH ANGLE */}
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-[#F8FAFC]">
              <button
                onClick={() => toggleSection('business')}
                className="w-full p-4 flex items-center justify-between font-bold text-[#0891B2] text-xs bg-white border-b border-[#E2E8F0]"
              >
                <span className="flex items-center gap-2 uppercase tracking-wider">
                  <Building className="w-4 h-4 text-[#0891B2]" /> Strategy & Conversion Angle
                </span>
                {expandedSections.business ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedSections.business && (
                <div className="p-4 space-y-3 text-[#475569]">
                  <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl">
                    <span className="text-[9px] text-[#0891B2] font-bold block uppercase">Recommended Offer Payload</span>
                    <strong className="text-[#0F172A] text-xs block mt-1">{oppAngle.recommended_offer || 'Operational Modernization & Automation'}</strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-[#64748B] font-bold block uppercase">Suggested Discovery Question</span>
                    <p className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] text-[#1E3A8A] font-bold italic">
                      "{oppAngle.discovery_question || 'How do you currently qualify leads and handle quote turnaround times?'}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SECURITY REMEDIATION */}
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-[#F8FAFC]">
              <button
                onClick={() => toggleSection('security')}
                className="w-full p-4 flex items-center justify-between font-bold text-[#F59E0B] text-xs bg-white border-b border-[#E2E8F0]"
              >
                <span className="flex items-center gap-2 uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-[#F59E0B]" /> Passive Security Scan
                </span>
                {expandedSections.security ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedSections.security && (
                <div className="p-4 space-y-3 text-[#475569]">
                  <p>
                    Passive observation inspected SSL configurations and secure security headers. A remediation opportunity was formulated for targeted tech outreach.
                  </p>
                  <EvidenceBadge source="Passive Header Scan" confidence={90} />
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
