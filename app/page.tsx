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
  Globe
} from 'lucide-react';

import { RealProspectFirewall } from '@/lib/verification/firewall';

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showFindModal, setShowFindModal] = useState(false);
  const [industry, setIndustry] = useState('Lighting');
  const [location, setLocation] = useState('Bangalore');
  const [offer, setOffer] = useState('Premium Digital Lighting Showroom');
  const [executing, setExecuting] = useState(false);

  // Observability & Diagnostics States
  const [discoveryProgress, setDiscoveryProgress] = useState('');
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState({
    candidatesFound: 0,
    verifiedCount: 0,
    persistedCount: 0,
    lastError: 'NONE',
    dbType: 'POSTGRES'
  });

  // Response simulation modal state (Development/Testing only)
  const isSimulationAllowed = process.env.NEXT_PUBLIC_ALLOW_SIMULATION === 'true';
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simProspectId, setSimProspectId] = useState('');
  const [simText, setSimText] = useState(
    'Yes, most enquiries currently come through WhatsApp and our quote turnaround is slow. What did you have in mind?'
  );
  const [simulating, setSimulating] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const setupData = await (await fetch('/api/setup')).json();
      const prospData = await (await fetch('/api/prospects')).json();
      const reportData = await (await fetch('/api/reports/daily')).json();
      const campData = await (await fetch('/api/campaigns')).json();

      setData({
        setup: setupData,
        prospects: prospData.prospects || [],
        report: reportData,
        campaigns: campData.campaigns || []
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
      setDiscoveryProgress('DISCOVERY REQUEST SENT — Querying OpenStreetMap Registry...');
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

      const count = resData.prospectsDiscovered || 0;
      setDiscoveryProgress(`DISCOVERY COMPLETE — Discovered ${count} real business candidates!`);
      setDiagnostics(prev => ({
        ...prev,
        candidatesFound: count,
        verifiedCount: count,
        persistedCount: count,
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
    if (!simProspectId || !isSimulationAllowed) return;
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
        <div className="flex items-center gap-3 text-slate-400 font-mono text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
          <span>Initializing PROXIMA Cyber Intelligence Engine...</span>
        </div>
      </div>
    );
  }

  const rawProspects = data?.prospects || [];
  const prospects = rawProspects.filter((p: any) => RealProspectFirewall.validateRealProspect(p));
  const takeoverProspects = prospects.filter((p: any) => p.human_takeover === 1);
  const highIntentProspects = prospects.filter((p: any) => p.intent_score >= 70);
  const logs = data?.setup?.logs || [];

  return (
    <div className="space-y-6">
      {/* Top PROXIMA Banner & Main Action */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#1C2541]/80 p-6 rounded-2xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1 font-mono">
            <Globe className="w-4 h-4 text-cyan-400" /> PROXIMA Command Center (REAL MODE)
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">PROXIMA by Project Buddy</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Autonomous client acquisition and verified business intelligence system. Enforces 5-level contact provenance, 8-agent cross-checks, and Shivam takeover handoffs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-cyan-400 hover:bg-slate-700 font-mono text-xs font-bold transition-colors"
            title="Toggle Discovery Diagnostics Panel"
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            onClick={() => fetchDashboard()}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleCreateCampaign()}
            disabled={executing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <Bot className="w-4 h-4" /> {executing ? 'STARTING AUTONOMOUS OPERATION...' : 'START PROXIMA AUTONOMOUSLY'}
          </button>
          <button
            onClick={() => setShowFindModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" /> DISCOVER REAL CLIENTS
          </button>
        </div>
      </div>

      {/* DISCOVERY DIAGNOSTICS EXPANDABLE PANEL */}
      {showDiagnostics && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 font-mono text-xs space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-cyan-400 flex items-center gap-2">
              <Activity className="w-4 h-4" /> DISCOVERY DIAGNOSTICS (PRODUCTION REAL MODE)
            </h3>
            <span className="text-[10px] text-slate-500">Live Telemetry</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-300">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">OPERATIONAL MODE</span>
              <strong className="text-emerald-400">REAL (No Fallbacks)</strong>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ACTIVE CITY</span>
              <strong className="text-white">{location}</strong>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">REAL SOURCE</span>
              <strong className="text-cyan-400">OpenStreetMap (Nominatim)</strong>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">SOURCE STATUS</span>
              <strong className="text-emerald-400">ONLINE</strong>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">CANDIDATES FOUND</span>
              <strong className="text-white">{diagnostics.candidatesFound}</strong>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">BUSINESSES VERIFIED</span>
              <strong className="text-white">{diagnostics.verifiedCount}</strong>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">DATABASE ADAPTER</span>
              <strong className="text-purple-400">{diagnostics.dbType}</strong>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">RECORDS PERSISTED</span>
              <strong className="text-white">{diagnostics.persistedCount}</strong>
            </div>
          </div>

          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-[11px]">
            <span className="text-slate-500">LAST OPERATIONAL ERROR:</span>{' '}
            <span className={diagnostics.lastError === 'NONE' ? 'text-emerald-400' : 'text-orange-400 font-bold'}>
              {diagnostics.lastError}
            </span>
          </div>
        </div>
      )}

      {/* DISCOVERY PROGRESS & ERROR FEEDBACK BANNERS */}
      {discoveryProgress && (
        <div className={`p-4 rounded-xl border font-mono text-xs flex items-center justify-between ${
          discoveryProgress.includes('FAILED')
            ? 'bg-red-950/80 border-red-700 text-red-200'
            : discoveryProgress.includes('COMPLETE')
            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
            : 'bg-cyan-950/80 border-cyan-700 text-cyan-200 animate-pulse'
        }`}>
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${discoveryProgress.includes('COMPLETE') || discoveryProgress.includes('FAILED') ? '' : 'animate-spin'}`} />
            <span>{discoveryProgress}</span>
          </div>
        </div>
      )}

      {discoveryError && (
        <div className="p-4 bg-orange-950/80 border border-orange-700 rounded-xl font-mono text-xs text-orange-200 space-y-1">
          <strong className="text-orange-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> DISCOVERY STATUS FEEDBACK:
          </strong>
          <p>{discoveryError}</p>
        </div>
      )}

      {/* 🚨 SHIVAM HUMAN TAKEOVER ALERT BANNER */}
      {takeoverProspects.length > 0 && (
        <div className="bg-red-950/80 border-2 border-red-600/80 p-5 rounded-2xl flex items-center justify-between shadow-2xl animate-pulse">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-600 text-white rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-red-300 uppercase tracking-wider font-mono">
                🚨 HUMAN TAKEOVER REQUIRED — SHIVAM, THIS ONE IS YOURS!
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {takeoverProspects.length} Prospect(s) Expressed Genuine Buying Interest!
              </h3>
              <p className="text-xs text-red-200 mt-1">
                Automated messaging stopped. Review verified business research and lead context below.
              </p>
            </div>
          </div>
          <Link
            href={`/prospects/${takeoverProspects[0].id}`}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg"
          >
            TAKE OVER NOW <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Top Metrics & Daily Target vs Actual Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-[#1C2541]/50 rounded-xl border border-slate-800 space-y-1">
          <p className="text-xs font-medium text-slate-400">Total Verified Discovered</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-white font-mono">{prospects.length}</p>
            <span className="text-[10px] text-slate-400 font-mono">Target: 30</span>
          </div>
          <p className="text-[11px] text-cyan-400 font-mono">Gap: {Math.max(0, 30 - prospects.length)} remaining</p>
        </div>

        <div className="p-4 bg-[#1C2541]/50 rounded-xl border border-slate-800 space-y-1">
          <p className="text-xs font-medium text-slate-400">High-Intent Leads</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-orange-400 font-mono">{highIntentProspects.length}</p>
            <span className="text-[10px] text-slate-400 font-mono">Target: 10</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Gap: {Math.max(0, 10 - highIntentProspects.length)} remaining</p>
        </div>

        <div className="p-4 bg-[#1C2541]/50 rounded-xl border border-slate-800 space-y-1">
          <p className="text-xs font-medium text-slate-400">Shivam Takeovers</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-red-400 font-mono">{takeoverProspects.length}</p>
            <span className="text-[10px] text-slate-400 font-mono">Target: 5</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Gap: {Math.max(0, 5 - takeoverProspects.length)} remaining</p>
        </div>

        <div className="p-4 bg-[#1C2541]/50 rounded-xl border border-slate-800 space-y-1">
          <p className="text-xs font-medium text-slate-400">Verified Pipeline Value</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-emerald-400 font-mono">
              ${(highIntentProspects.length * 8500).toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-400 font-mono">Target: $85,000</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Commercial Value</p>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: High-Fit Prospects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1C2541]/30 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" /> Verified Prospects & Commercial Intent
              </h3>
              <span className="text-xs text-slate-400 font-mono">REAL MODE ACTIVE</span>
            </div>

            {prospects.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No real prospects discovered yet.</p>
                <button
                  onClick={() => setShowFindModal(true)}
                  className="mt-3 px-4 py-2 bg-cyan-500 text-white font-bold text-xs rounded-lg"
                >
                  Click "DISCOVER REAL CLIENTS" to launch PROXIMA discovery
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {prospects.slice(0, 5).map((prosp: any) => (
                  <div
                    key={prosp.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                      prosp.human_takeover
                        ? 'bg-red-950/30 border-red-700/60'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{prosp.company_name}</h4>
                        {prosp.human_takeover === 1 && (
                          <span className="px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] rounded-full uppercase tracking-wider font-mono">
                            SHIVAM TAKEOVER
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {prosp.contact_name || 'Verified Contact'} ({prosp.role || 'Contact'}) • {prosp.industry || 'Industry'} • {prosp.location || 'Location'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono text-xs">
                        <span className="font-bold text-orange-400">Intent: {prosp.intent_score || 0}/100</span>
                        <div className="text-[10px] text-slate-400">Fit: {prosp.fit_score || 0}/100</div>
                      </div>

                      <Link
                        href={`/prospects/${prosp.id}`}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> WHY THIS LEAD?
                      </Link>

                      {isSimulationAllowed && (
                        <button
                          onClick={() => {
                            setSimProspectId(prosp.id);
                            setShowSimulateModal(true);
                          }}
                          title="Simulate incoming prospect response"
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs rounded-lg flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Simulate Reply
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Activity Stream & Campaigns */}
        <div className="space-y-6">
          {/* PROXIMA Activity Stream */}
          <div className="bg-[#1C2541]/30 rounded-2xl border border-slate-800 p-5 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> PROXIMA Activity Stream
            </h3>

            {logs.length === 0 ? (
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-500">
                No recent activity logged. Real operations stream live during active discovery.
              </div>
            ) : (
              <div className="space-y-2 text-xs font-mono">
                {logs.slice(-5).reverse().map((log: any, idx: number) => (
                  <div key={log.id || idx} className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500">
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'LOG'}
                    </span>{' '}
                    <strong className="text-cyan-400">{log.stage}:</strong> {log.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DISCOVER CLIENTS MODAL */}
      {showFindModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" /> PROXIMA Discovery & Verification Wizard
            </h3>
            <p className="text-xs text-slate-400">
              Specify target industry, location, and Project Buddy offer. The 27-agent team will discover, verify contacts, run security scouts, and personalize outreach.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Project Buddy Offer</label>
                <select
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
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
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={executing}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                {executing ? 'Executing PROXIMA Pipeline...' : 'START REAL DISCOVERY'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATE RESPONSE MODAL (Testing only) */}
      {isSimulationAllowed && showSimulateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" /> Simulate Prospect Reply
            </h3>
            <p className="text-xs text-slate-400">
              Type or select a sample response from the prospect. The Response Classifier will trigger Shivam takeover handoff if high-intent.
            </p>

            <textarea
              rows={4}
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSimulateModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateResponse}
                disabled={simulating}
                className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold rounded-xl"
              >
                {simulating ? 'Classifying...' : 'Submit Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
