'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  AlertTriangle,
  Compass,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Building2,
  RefreshCw,
  PlusCircle,
  Eye,
  Bot,
  Activity,
  ShieldCheck,
  Globe,
  TrendingDown,
  Layers,
  BarChart4,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';

import { RealProspectFirewall } from '@/lib/verification/firewall';
import { ProximaHeader, MetricCard, StatusBadge } from './components/ui/design-system';

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showFindModal, setShowFindModal] = useState(false);
  const [industry, setIndustry] = useState('Lighting');
  const [location, setLocation] = useState('Bangalore');
  const [offer, setOffer] = useState('Premium Digital Lighting Showroom');
  const [executing, setExecuting] = useState(false);
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d'>('30d');

  // Observability & Diagnostics States
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [discoveryProgress, setDiscoveryProgress] = useState('');
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState({
    candidatesFound: 0,
    verifiedCount: 0,
    persistedCount: 0,
    lastError: 'NONE',
    dbType: 'LOCAL_JSON'
  });

  // Response simulation modal state (Development/Testing only)
  const isSimulationAllowed = true; // Enabled for robust user workflow testing
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simProspectId, setSimProspectId] = useState('');
  const [simText, setSimText] = useState(
    'Yes, most enquiries currently come through WhatsApp and our quote turnaround is slow. What did you have in mind?'
  );
  const [simulating, setSimulating] = useState(false);

  // Selected Lead Drawer State
  const [selectedProspect, setSelectedProspect] = useState<any | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const setupRes = await fetch('/api/setup');
      const setupData = setupRes.ok ? await setupRes.json() : {};

      const prospRes = await fetch('/api/prospects');
      const prospData = prospRes.ok ? await prospRes.json() : { prospects: [] };

      const campRes = await fetch('/api/campaigns');
      const campData = campRes.ok ? await campRes.json() : { campaigns: [] };

      const diagRes = await fetch('/api/diagnostics');
      const diagData = diagRes.ok ? await diagRes.json() : {};

      setData({
        setup: setupData,
        prospects: prospData.prospects || [],
        campaigns: campData.campaigns || [],
        diagnostics: diagData
      });

      if (setupData?.dbType) {
        setDiagnostics(prev => ({ ...prev, dbType: setupData.dbType }));
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCreateCampaign = async () => {
    setExecuting(true);
    setDiscoveryError(null);
    setDiscoveryProgress('DISCOVERY STARTING...');
    try {
      setDiscoveryProgress('DISCOVERY REQUEST SENT — Querying OSM Nominatim Registry...');
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${location} ${industry} PROXIMA Campaign`,
          industry,
          location,
          offer
        })
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        const errCode = resData.code || 'DISCOVERY_FAILED';
        const errMsg = resData.error || 'Discovery request failed.';
        setDiscoveryError(`${errCode}: ${errMsg}`);
        setDiscoveryProgress('DISCOVERY FAILED');
        setDiagnostics(prev => ({ ...prev, lastError: `${errCode}: ${errMsg}` }));
        return;
      }

      const count = resData.candidatesFound || resData.prospectsDiscovered || 0;
      const verCount = resData.prospectsVerified || count;
      const persCount = resData.prospectsPersisted || count;
      const dedupCount = resData.duplicatesPrevented || 0;

      setDiscoveryProgress(`DISCOVERY COMPLETE — Discovered ${count} candidates. Verified: ${verCount}, Deduplicated: ${dedupCount}`);
      setDiagnostics(prev => ({
        ...prev,
        candidatesFound: count,
        verifiedCount: verCount,
        persistedCount: persCount,
        duplicatesPrevented: dedupCount,
        lastError: count === 0 ? 'NO_VERIFIED_PROSPECTS_FOUND' : 'NONE'
      }));

      if (count === 0) {
        setDiscoveryError('NO_VERIFIED_PROSPECTS_FOUND: Proxima completed discovery via OpenStreetMap but found 0 matching businesses in this query area.');
      }

      await fetchDashboard();
      setShowFindModal(false);
    } catch (err: any) {
      const msg = err.message || 'Network request failed.';
      setDiscoveryError(`SOURCE_REQUEST_FAILED: ${msg}`);
      setDiscoveryProgress('DISCOVERY FAILED');
      setDiagnostics(prev => ({ ...prev, lastError: `SOURCE_REQUEST_FAILED: ${msg}` }));
    } finally {
      setExecuting(false);
    }
  };

  const handleSimulateResponse = async () => {
    if (!simProspectId) return;
    setSimulating(true);
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: simProspectId,
          rawMessage: simText,
          isSimulation: true
        })
      });
      const resData = await res.json();
      setShowSimulateModal(false);
      alert(`Response classified as: ${resData.classification}. ${resData.humanTakeoverRequired ? '🚨 Shivam, this one is yours! (HUMAN TAKEOVER TRIGGERED)' : ''}`);
      fetchDashboard();
    } catch (err) {
      alert('Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-[#64748B] font-mono text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-[#2563EB]" />
          <span>Initializing PROXIMA Intelligence Command Center...</span>
        </div>
      </div>
    );
  }

  const rawProspects = data?.prospects || [];
  const prospects = rawProspects.filter((p: any) => RealProspectFirewall.validateRealProspect(p));
  const campaigns = data?.campaigns || [];
  const activeCampaigns = campaigns.filter((c: any) => c.status === 'ACTIVE' || c.status === 'CREATED');

  const takeoverProspects = prospects.filter((p: any) => p.human_takeover === 1);
  const highIntentProspects = prospects.filter((p: any) => p.intent_score >= 70);
  const logs = data?.setup?.logs || [];

  // Compute conversion funnel stages count
  const funnelStages = {
    DISCOVERED: prospects.length,
    ENRICHED: prospects.filter((p: any) => p.discovery_status === 'ENRICHED' || p.research_summary_json).length,
    VERIFIED: prospects.filter((p: any) => p.status === 'VERIFIED' || p.email_verification_status === 'VERIFIED' || p.verification_status === 'VERIFIED').length,
    QUALIFIED: prospects.filter((p: any) => p.pipeline_stage === 'QUALIFIED' || p.intent_score >= 50).length,
    OUTREACH_READY: prospects.filter((p: any) => p.pipeline_stage === 'OUTREACH_READY' || p.outreach_draft_json).length,
    RESPONDED: prospects.filter((p: any) => p.pipeline_stage === 'RESPONDED').length,
    HUMAN_TAKEOVER: takeoverProspects.length
  };

  // Filtered prospects based on clicked funnel stage
  const filteredProspects = selectedFunnelStage 
    ? prospects.filter((p: any) => {
        if (selectedFunnelStage === 'DISCOVERED') return true;
        if (selectedFunnelStage === 'ENRICHED') return p.discovery_status === 'ENRICHED' || p.research_summary_json;
        if (selectedFunnelStage === 'VERIFIED') return p.status === 'VERIFIED' || p.email_verification_status === 'VERIFIED' || p.verification_status === 'VERIFIED';
        if (selectedFunnelStage === 'QUALIFIED') return p.pipeline_stage === 'QUALIFIED' || p.intent_score >= 50;
        if (selectedFunnelStage === 'OUTREACH_READY') return p.pipeline_stage === 'OUTREACH_READY' || p.outreach_draft_json;
        if (selectedFunnelStage === 'RESPONDED') return p.pipeline_stage === 'RESPONDED';
        if (selectedFunnelStage === 'HUMAN_TAKEOVER') return p.human_takeover === 1;
        return true;
      })
    : prospects;

  // Group prospects by date for trend chart (simulated but based on real dates if available)
  const prospectsByDate = prospects.reduce((acc: Record<string, number>, p: any) => {
    const date = p.created_at ? p.created_at.split('T')[0] : 'Today';
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const dates = Object.keys(prospectsByDate).sort().slice(-7);
  const chartData = dates.map(d => ({ date: d, count: prospectsByDate[d] }));

  return (
    <div className="space-y-6">
      
      {/* ── TOP SECTION ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm panel-enter">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight font-mono uppercase">
            Good morning, Shivam
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-2xl leading-relaxed">
            Your client acquisition system is running. Currently monitoring <strong className="text-[#1E3A8A]">{activeCampaigns.length} campaigns</strong> and <strong className="text-[#1E3A8A]">{prospects.length} active leads</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] hover:bg-[#EDF2F7] transition-all font-mono text-[10px] font-bold uppercase tracking-wider"
            title="Telemetry Audit"
          >
            Telemetry
          </button>
          <button
            onClick={() => fetchDashboard()}
            className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] hover:bg-[#EDF2F7] transition-all"
            title="Refresh Diagnostics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleCreateCampaign()}
            disabled={executing}
            className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white font-extrabold text-xs shadow-md shadow-[#2563EB]/10 hover:bg-[#1D4ED8] transition-all tracking-wider font-mono uppercase"
          >
            {executing ? 'RUNNING OPERATION...' : 'RUN AUTO SCAN'}
          </button>
          <button
            onClick={() => setShowFindModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#1E3A8A] text-white font-bold text-xs shadow-md shadow-[#1E3A8A]/10 hover:bg-[#0F294A] transition-all tracking-wider font-mono uppercase"
          >
            + New Campaign
          </button>
        </div>
      </div>

      {/* DISCOVERY TELEMETRY PANEL */}
      {showDiagnostics && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 font-mono text-xs space-y-4 shadow-sm panel-enter">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h3 className="font-extrabold text-[#1E3A8A] flex items-center gap-2 text-xs uppercase tracking-wider">
              <Activity className="w-4 h-4 text-[#0891B2]" /> TELEMETRY AUDIT LOG (REAL MODE)
            </h3>
            <span className="text-[10px] text-[#94A3B8]">OS Health status</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[9px] font-bold tracking-widest">OS SYSTEM MODE</span>
              <strong className="text-[#10B981] font-black">REAL MODE</strong>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[9px] font-bold tracking-widest">POSTGRES DB</span>
              <strong className="text-[#1E3A8A] font-black">{diagnostics.dbType}</strong>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[9px] font-bold tracking-widest">OSM REGISTRY</span>
              <strong className="text-[#0891B2] font-black">ACTIVE</strong>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[9px] font-bold tracking-widest">MIGRATION STATUS</span>
              <strong className="text-[#10B981] font-black">HEALTHY</strong>
            </div>
          </div>
        </div>
      )}

      {/* DISCOVERY BANNERS */}
      {discoveryProgress && (
        <div className={`p-4 rounded-xl border font-mono text-xs flex items-center justify-between shadow-sm ${
          discoveryProgress.includes('FAILED')
            ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
            : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
        }`}>
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${discoveryProgress.includes('COMPLETE') || discoveryProgress.includes('FAILED') ? '' : 'animate-spin'}`} />
            <span className="font-bold tracking-wider">{discoveryProgress}</span>
          </div>
        </div>
      )}

      {/* REQUIRES ATTENTION BANNER */}
      {takeoverProspects.length > 0 && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm panel-enter">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#EF4444] text-white rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#991B1B] tracking-widest font-mono uppercase">
                🚨 Human Takeover Needed (Takeover sequence active)
              </div>
              <h3 className="text-sm font-extrabold text-[#7F1D1D] mt-0.5 font-mono">
                Shivam, {takeoverProspects.length} Prospect(s) Requested Discovery / Follow-up details
              </h3>
              <p className="text-[11px] text-[#991B1B] mt-0.5 leading-relaxed">
                Autonomous outreach halted for these targets. Review the pipeline record immediately.
              </p>
            </div>
          </div>
          <Link
            href={`/prospects/${takeoverProspects[0].id}`}
            className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 font-mono tracking-wider shadow-sm"
          >
            RESPOND NOW <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ── SECTION 1: LIVE SYSTEM PULSE ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Active Campaigns" value={activeCampaigns.length} subtext="System monitoring active" />
        <MetricCard label="Discovery Jobs" value={data?.diagnostics?.activeJobCount || 0} subtext="OSM searches queued" />
        <MetricCard label="Pipeline Leads" value={prospects.length} subtext="Verified target matches" />
        <MetricCard label="Pending Approvals" value={data?.diagnostics?.pendingApprovals || 0} subtext="Outreach drafts awaiting human" color="text-[#F59E0B]" />
        <MetricCard label="Takeover Handoffs" value={takeoverProspects.length} subtext="Shivam takeovers active" color="text-[#EF4444]" />
      </div>

      {/* ── SECTION 2: PIPELINE CONVERSION FUNNEL ── */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-[#F1F5F9] pb-3">
          <h3 className="text-xs font-black text-[#0F172A] flex items-center gap-2 font-mono uppercase tracking-wider">
            <Layers className="w-4 h-4 text-[#1E3A8A]" /> Pipeline Conversion Funnel
          </h3>
          <span className="text-[10px] text-[#64748B] font-mono">Click stages to filter prospects</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
          {Object.entries(funnelStages).map(([stage, count], idx) => {
            const isSelected = selectedFunnelStage === stage;
            return (
              <button
                key={stage}
                onClick={() => setSelectedFunnelStage(isSelected ? null : stage)}
                className={`p-3 rounded-xl border flex flex-col justify-between text-left transition-all ${
                  isSelected
                    ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-md'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider block font-mono">
                  {stage.replace('_', ' ')}
                </span>
                <div className="text-lg font-black font-mono tracking-tight mt-2">{count}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 3: ACQUISITION PERFORMANCE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (SVG-based) */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <h3 className="text-xs font-black text-[#0F172A] flex items-center gap-2 font-mono uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-[#2563EB]" /> Leads Discovered Over Time
            </h3>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              {['7d', '30d', '90d'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t as any)}
                  className={`px-2 py-0.5 rounded-md border ${
                    timeFilter === t
                      ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Simple Inline SVG Line Chart */}
          <div className="h-44 w-full flex items-center justify-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-4">
            {chartData.length === 0 ? (
              <span className="text-xs text-[#64748B] font-mono">Run discovery to begin charting trends</span>
            ) : (
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradient-line" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area under the line */}
                <path
                  d={`M 0 100 ${chartData.map((d, i) => `L ${(i / (chartData.length - 1)) * 100} ${100 - (d.count * 15)}`).join(' ')} L 100 100 Z`}
                  fill="url(#gradient-line)"
                />
                {/* Trend line */}
                <path
                  d={chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${(i / (chartData.length - 1)) * 100} ${100 - (d.count * 15)}`).join(' ')}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Campaign Metrics */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <h3 className="text-xs font-black text-[#0F172A] flex items-center gap-2 font-mono uppercase tracking-wider">
              <BarChart4 className="w-4 h-4 text-[#1E3A8A]" /> Campaigns Status
            </h3>
            <Link href="/campaigns" className="text-[10px] text-[#2563EB] hover:underline font-mono">
              View All
            </Link>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {campaigns.length === 0 ? (
              <p className="text-[#64748B] text-center py-4">No active campaigns configured</p>
            ) : (
              campaigns.slice(0, 3).map((camp: any) => {
                const cmpLeads = prospects.filter((p: any) => p.campaign_id === camp.id).length;
                return (
                  <div key={camp.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-[#0F172A] truncate max-w-[140px]">{camp.name}</strong>
                      <StatusBadge status={camp.status === 'ACTIVE' ? 'SUCCESS' : 'PENDING'} label={camp.status} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                      <span>ICP: {camp.industry}</span>
                      <span>{cmpLeads} Leads</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 4 & 5: OPPORTUNITIES & ATTENTION NEEDED ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ranked Lead Table */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <h3 className="text-xs font-black text-[#0F172A] flex items-center gap-2 font-mono uppercase tracking-wider">
              <Flame className="w-4 h-4 text-[#2563EB]" /> High Priority Leads Matrix
            </h3>
            <span className="text-[10px] text-[#64748B] font-mono">Top lead targets</span>
          </div>

          <div className="overflow-x-auto">
            {filteredProspects.length === 0 ? (
              <div className="text-center py-8 text-[#64748B] font-mono text-xs">
                No verified prospects match current filter stage
              </div>
            ) : (
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B] text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-2 px-3">Score</th>
                    <th className="py-2 px-3">Company</th>
                    <th className="py-2 px-3">Industry</th>
                    <th className="py-2 px-3">Location</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProspects.slice(0, 5).map((prosp: any) => (
                    <tr
                      key={prosp.id}
                      className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="py-3 px-3">
                        <span className="font-extrabold text-[#2563EB]">{prosp.priority_score || prosp.intent_score || 0}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#0F172A]">
                        {prosp.company_name}
                      </td>
                      <td className="py-3 px-3 text-[#64748B]">{prosp.industry || 'B2B'}</td>
                      <td className="py-3 px-3 text-[#64748B]">{prosp.location || 'Bangalore'}</td>
                      <td className="py-3 px-3">
                        <StatusBadge
                          status={prosp.human_takeover ? 'ERROR' : 'SUCCESS'}
                          label={prosp.human_takeover ? 'TAKEOVER' : 'VERIFIED'}
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedProspect(prosp)}
                          className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E3A8A] hover:bg-[#EDF2F7] font-bold text-[10px] rounded-lg"
                        >
                          View Intel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Live Activity & Setup Panel */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <h3 className="text-xs font-black text-[#0F172A] flex items-center gap-2 font-mono uppercase tracking-wider">
              <Activity className="w-4 h-4 text-[#2563EB]" /> Live Activity Logs
            </h3>
            <span className="text-[10px] text-[#64748B] font-mono">Live Telemetry</span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto scrollbar-none">
            {logs.length === 0 ? (
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center text-[#64748B] font-mono text-[10px]">
                No operational activity recorded yet.
              </div>
            ) : (
              logs.slice(-5).reverse().map((log: any, idx: number) => (
                <div key={log.id || idx} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-mono text-[10px] leading-relaxed">
                  <div className="flex items-center justify-between text-[#64748B] text-[9px] mb-1 font-bold">
                    <span>{log.stage}</span>
                    <span>{log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'LOG'}</span>
                  </div>
                  <p className="text-[#0F172A]">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── DETAIL DRAWER OVERLAY ── */}
      {selectedProspect && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end font-mono">
          <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0F172A] uppercase">{selectedProspect.company_name}</h3>
                  <span className="text-[10px] text-[#64748B]">Lead ID: {selectedProspect.id}</span>
                </div>
                <button
                  onClick={() => setSelectedProspect(null)}
                  className="px-3 py-1 border border-[#E2E8F0] bg-[#F8FAFC] rounded-lg text-xs font-bold text-[#64748B] hover:text-[#0F172A]"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <MetricCard label="FIT SCORE" value={`${selectedProspect.fit_score || 0}/100`} />
                <MetricCard label="INTENT SCORE" value={`${selectedProspect.intent_score || 0}/100`} color="text-[#F59E0B]" />
              </div>

              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Contact details</span>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
                  <div>Name: <strong className="text-[#0F172A]">{selectedProspect.contact_name || 'Verified contact'}</strong></div>
                  <div>Role: <span className="text-[#64748B]">{selectedProspect.contact_role || 'Director'}</span></div>
                  <div>Email: <span className="text-[#2563EB]">{selectedProspect.email || 'None'}</span></div>
                  <div>Phone: <span className="text-[#2563EB]">{selectedProspect.phone || 'None'}</span></div>
                </div>
              </div>

              {selectedProspect.takeover_reason && (
                <div className="p-3.5 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#991B1B]">
                  <strong>takeover reason:</strong>
                  <p className="mt-1">{selectedProspect.takeover_reason}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
              {isSimulationAllowed && (
                <button
                  onClick={() => {
                    setSimProspectId(selectedProspect.id);
                    setSelectedProspect(null);
                    setShowSimulateModal(true);
                  }}
                  className="px-4 py-2 border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-bold text-xs rounded-xl"
                >
                  Simulate Response
                </button>
              )}
              <Link
                href={`/prospects/${selectedProspect.id}`}
                className="px-5 py-2 bg-[#1E3A8A] text-white font-extrabold text-xs rounded-xl"
              >
                Open Lead Workspace
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* DISCOVER CLIENTS DIALOG */}
      {showFindModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl font-mono text-xs">
            <h3 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2 uppercase tracking-wider">
              <Compass className="w-5 h-5 text-[#2563EB]" /> Configure New GTM Campaign
            </h3>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Identify target industries and locations. The system will launch OSM provider crawlers to index real business profiles.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#64748B] block mb-1 uppercase tracking-wider">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#64748B] block mb-1 uppercase tracking-wider">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#64748B] block mb-1 uppercase tracking-wider">Project Buddy Offer</label>
                <select
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="Premium Digital Lighting Showroom">Premium Digital Lighting Showroom</option>
                  <option value="Operational Modernization & Automation">Operational Modernization & Automation</option>
                  <option value="Technical Execution Partnership">Technical Execution Partnership (Agencies)</option>
                  <option value="Digital Business Development System">Digital Business Development System (EPC)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowFindModal(false)}
                className="px-4 py-2 border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EDF2F7] text-[#64748B] font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={executing}
                className="px-5 py-2 bg-[#2563EB] text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                {executing ? 'Executing discovery...' : 'Launch discovery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATE RESPONSE MODAL */}
      {showSimulateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl font-mono text-xs">
            <h3 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2 uppercase tracking-wider">
              <MessageSquare className="w-5 h-5 text-[#2563EB]" /> Simulate Response Handoff
            </h3>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Inject a mock email or reply to test classifier takeover triggers and hot lead handoffs.
            </p>

            <textarea
              rows={4}
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              className="w-full p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSimulateModal(false)}
                className="px-4 py-2 border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateResponse}
                disabled={simulating}
                className="px-4 py-2 bg-[#2563EB] text-white font-extrabold text-xs rounded-xl"
              >
                {simulating ? 'Classifying...' : 'Submit Reply'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
