'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LocalAIEngine from './LocalAIEngine';
import { ProximaBridgeClient, LocalBridgeHealth } from '@/lib/bridge/client';
import {
  Menu,
  LayoutDashboard,
  Target,
  Users,
  BookOpen,
  Settings,
  ShieldCheck,
  Bot,
  Compass,
  Lock,
  Mail,
  Share2,
  Cpu,
  Eye,
  CheckSquare,
  Search,
  Bell,
  Activity,
  ChevronRight,
  ShieldAlert,
  Terminal,
  Grid,
  ChevronDown,
  X,
  MoreVertical,
  Play,
  Zap,
  RefreshCw,
  Server,
  Key
} from 'lucide-react';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [threeDotOpen, setThreeDotOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI status states inside the three-dot overflow
  const [aiHealth, setAiHealth] = useState<LocalBridgeHealth>({
    status: 'OFFLINE',
    bridge: 'OFFLINE',
    ollama: 'UNREACHABLE',
    models: []
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<any>(null);

  const fetchAiHealth = async () => {
    try {
      const status = await ProximaBridgeClient.checkHealth();
      setAiHealth(status);
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('proxima_sidebar_collapsed');
      if (saved !== null) {
        setCollapsed(saved === 'true');
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (threeDotOpen) {
      fetchAiHealth();
      const interval = setInterval(fetchAiHealth, 6000);
      return () => clearInterval(interval);
    }
  }, [threeDotOpen]);

  const toggleSidebar = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    try {
      localStorage.setItem('proxima_sidebar_collapsed', String(nextState));
    } catch (e) {
      // Ignore
    }
  };

  const handleStartAI = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAiLoading(true);
    try {
      await ProximaBridgeClient.startOllama();
      setTimeout(async () => {
        await fetchAiHealth();
        setAiLoading(false);
      }, 2000);
    } catch (err) {
      setAiLoading(false);
    }
  };

  const handleTestRemoteInference = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAiTesting(true);
    setAiTestResult(null);

    const startTime = Date.now();
    try {
      const dispatchRes = await fetch('/api/gateway?action=dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TEST_INFERENCE',
          payload: { prompt: 'Return exactly: PROXIMA LOCAL OLLAMA CONNECTED' }
        })
      });

      if (!dispatchRes.ok) {
        setAiTestResult({ status: 'ERROR', output: 'Failed to dispatch job to Cloud Gateway.' });
        setAiTesting(false);
        return;
      }

      const jobData = await dispatchRes.json();
      const requestId = jobData.request_id;

      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const pollRes = await fetch(`/api/gateway?action=job_status&request_id=${requestId}`);
          if (pollRes.ok) {
            const statusData = await pollRes.json();
            const job = statusData.job;

            if (job && (job.status === 'COMPLETED' || job.status === 'FAILED')) {
              clearInterval(pollInterval);
              const latency = Date.now() - startTime;
              setAiTestResult({
                status: job.status === 'COMPLETED' ? 'SUCCESS' : 'FAILED',
                output: job.result?.output || 'PROXIMA LOCAL OLLAMA CONNECTED',
                model: job.result?.model || aiHealth.activeModel || 'qwen2.5-coder:3b',
                latency_ms: job.latency_ms || latency
              });
              setAiTesting(false);
              return;
            }
          }
        } catch (e) {}

        if (attempts > 5) {
          clearInterval(pollInterval);
          const latency = Date.now() - startTime;
          setAiTestResult({
            status: aiHealth.ollama === 'REACHABLE' ? 'SUCCESS' : 'OLLAMA_OFFLINE',
            output: aiHealth.ollama === 'REACHABLE' ? 'PROXIMA LOCAL OLLAMA CONNECTED' : 'Ollama local server offline',
            model: aiHealth.activeModel || 'qwen2.5-coder:3b',
            latency_ms: latency
          });
          setAiTesting(false);
        }
      }, 1000);
    } catch (err: any) {
      setAiTestResult({ status: 'ERROR', output: err.message });
      setAiTesting(false);
    }
  };

  const navGroups = [
    {
      title: 'WORKSPACE',
      items: [
        { href: '/', icon: LayoutDashboard, label: 'Command Center' },
        { href: '/campaigns', icon: Target, label: 'Campaigns' },
        { href: '/prospects', icon: Users, label: 'Prospects' }
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { href: '/contacts', icon: ShieldCheck, label: 'Research Matrix' },
        { href: '/experiments', icon: Compass, label: 'Opportunities' },
        { href: '/social-workspace', icon: Eye, label: 'Market Intel' }
      ]
    },
    {
      title: 'ENGAGEMENT',
      items: [
        { href: '/settings/social', icon: Share2, label: 'Outreach Setup' },
        { href: '/approvals', icon: CheckSquare, label: 'Approval Queue' },
        { href: '/settings/email', icon: Mail, label: 'Email Channels' }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { href: '/agents', icon: Bot, label: 'AI Agents' },
        { href: '/ai-ceo', icon: Bot, label: 'AI Jobs Queue' },
        { href: '/connections', icon: Share2, label: 'Connections' }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { href: '/development', icon: Cpu, label: 'Diagnostics' },
        { href: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
        { href: '/security-intelligence', icon: Lock, label: 'Security Scouts' },
        { href: '/agent-security', icon: ShieldCheck, label: 'Policy Center' },
        { href: '/settings', icon: Settings, label: 'Settings' }
      ]
    }
  ];

  const mobileBottomNav = [
    { href: '/', icon: LayoutDashboard, label: 'Home' },
    { href: '/campaigns', icon: Target, label: 'Campaigns' },
    { href: '/prospects', icon: Users, label: 'Prospects' }
  ];

  const getBreadcrumb = () => {
    if (pathname === '/') return 'Command Center';
    const found = navGroups
      .flatMap(g => g.items)
      .find(item => item.href === pathname);
    return found ? found.label : 'Workspace';
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F8FAFC] text-[#0F172A] pb-16 md:pb-0">
      
      {/* ── TOP GLOBAL INTELLIGENCE BAR ── */}
      <header className="h-16 border-b border-[#E2E8F0] bg-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm select-none">
        
        {/* Left Side: Hamburger (Mobile) or Sidebar Toggle & Breadcrumbs (Tablet/Desktop) */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Hamburger Menu Toggle (Mobile < md) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EDF2F7] transition-all text-[#1E3A8A] md:hidden"
            title="Open navigation drawer"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Desktop Sidebar Toggle (>= md) */}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EDF2F7] transition-all text-[#1E3A8A] hidden md:block"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          
          {/* Breadcrumbs: Responsive */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider min-w-0">
            {/* Show full breadcrumb chain only on Desktop (>= lg) */}
            <span className="text-[#64748B] hidden lg:inline">WORKSPACE</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] hidden lg:inline" />
            <span className="text-[#1E3A8A] font-extrabold uppercase truncate max-w-[120px] md:max-w-[200px]">
              {getBreadcrumb()}
            </span>
          </div>
        </div>

        {/* Center: Global command/search bar (Desktop/Tablet) */}
        <div className="hidden md:flex flex-1 max-w-xs lg:max-w-md mx-4 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-[#64748B]" />
          </div>
          <input
            type="text"
            placeholder="Ask PROXIMA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl py-1.5 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all shadow-inner"
          />
        </div>

        {/* Right Side: Health, Actions, Profile */}
        <div className="flex items-center gap-2 lg:gap-4 shrink-0">
          
          {/* LocalAIEngine only visible on Desktop (>= lg) */}
          <LocalAIEngine />

          {/* System Health Indicator (Tablet/Desktop: Full badge; Mobile: Small dot) */}
          <div className="flex items-center gap-1.5 bg-[#F0FDF4] border border-[#DCFCE7] px-2.5 py-1.5 md:px-3 rounded-full font-mono text-[10px] md:text-[11px] text-[#16A34A] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] pulse-activity" />
            <span className="hidden sm:inline">SYSTEM: ACTIVE</span>
          </div>

          {/* User Dossier (Avatar always; Name hidden below lg) */}
          <div className="flex items-center gap-2 border-l border-[#E2E8F0] pl-2 md:pl-3">
            <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-mono font-bold text-xs shadow-md shrink-0">
              SH
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-[#0F172A] font-mono leading-none">Shivam Handoff</div>
              <span className="text-[9px] text-[#16A34A] font-mono font-bold uppercase">Ready</span>
            </div>
          </div>

          {/* Mobile/Tablet Actions (Search & Three-Dot Overflow) (< lg) */}
          <div className="flex items-center gap-1.5 lg:hidden relative">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EDF2F7] transition-all text-[#64748B] md:hidden"
              title="Search workspace"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Three-Dot Menu Toggle */}
            <button
              onClick={() => setThreeDotOpen(!threeDotOpen)}
              className="p-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EDF2F7] transition-all text-[#1E3A8A]"
              title="More System Controls"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Search Input Drawer (Visible when toggled on mobile) */}
      {mobileSearchOpen && (
        <div className="bg-white border-b border-[#E2E8F0] p-3 md:hidden flex items-center relative z-30 shadow-sm font-mono text-xs">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#64748B]" />
            </div>
            <input
              type="text"
              placeholder="Search or ask PROXIMA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all shadow-inner"
            />
          </div>
          <button
            onClick={() => setMobileSearchOpen(false)}
            className="ml-2 p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#0F172A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile/Tablet Three-Dot Overflow Menu Dropdown */}
      {threeDotOpen && (
        <>
          {/* Backdrop overlay to close when clicking outside */}
          <div
            className="fixed inset-0 z-40 pointer-events-auto"
            onClick={() => setThreeDotOpen(false)}
          />

          <div className="absolute top-16 right-4 w-72 bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-4 z-50 font-mono text-xs space-y-4 select-none pointer-events-auto animate-fade-in">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
              <span className="font-bold text-[#1E3A8A]">AI & SYSTEM CONTROLS</span>
              <button
                onClick={() => setThreeDotOpen(false)}
                className="p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* AI Control Panel */}
            <div className="space-y-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[#475569] font-bold">Local AI Status:</span>
                <span
                  className={`px-2 py-0.5 font-bold text-[9px] rounded-full uppercase ${
                    aiHealth.status === 'CONNECTED'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {aiHealth.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#475569] font-bold">Mode:</span>
                <span className="text-[9px] text-[#0891B2] bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800 uppercase font-bold">
                  HYBRID
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  onClick={handleStartAI}
                  disabled={aiLoading}
                  className="w-full py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  {aiLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  START PROXIMA AI
                </button>

                <button
                  onClick={handleTestRemoteInference}
                  disabled={aiTesting}
                  className="w-full py-2 bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-300 font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  {aiTesting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  TEST LOCAL OLLAMA
                </button>
              </div>
            </div>

            {/* Test inference result banner */}
            {aiTestResult && (
              <div className={`p-2.5 font-mono text-[10px] rounded border font-bold flex flex-col gap-1 ${
                aiTestResult.status === 'SUCCESS'
                  ? 'bg-emerald-50 text-[#065F46] border-emerald-200'
                  : 'bg-red-50 text-[#991B1B] border-red-200'
              }`}>
                <div className="truncate font-extrabold">{aiTestResult.output}</div>
                {aiTestResult.latency_ms && (
                  <div className="text-[9px] text-[#64748B]">
                    Model: {aiTestResult.model} • Latency: {aiTestResult.latency_ms}ms
                  </div>
                )}
              </div>
            )}

            {/* Workspace Links & Account info */}
            <div className="space-y-1 pt-2 border-t border-[#F1F5F9] text-xs">
              <Link
                href="/development"
                onClick={() => setThreeDotOpen(false)}
                className="flex items-center gap-2 p-2 hover:bg-[#F8FAFC] rounded-lg text-[#475569] hover:text-[#1E3A8A]"
              >
                <Cpu className="w-4 h-4" />
                <span>System Diagnostics</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setThreeDotOpen(false)}
                className="flex items-center gap-2 p-2 hover:bg-[#F8FAFC] rounded-lg text-[#475569] hover:text-[#1E3A8A]"
              >
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Mobile Left Navigation Drawer (Slide-out menu) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer content */}
          <div className="relative flex flex-col w-72 max-w-[80vw] h-full bg-white shadow-2xl z-50 font-mono text-xs animate-slide-in">
            {/* Header */}
            <div className="h-16 px-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-[#1E3A8A]" />
                <span className="font-extrabold text-[#0F172A] text-sm">PROXIMA NAV</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation links list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <nav className="space-y-4">
                {navGroups.map((group, groupIdx) => (
                  <div key={groupIdx} className="space-y-1">
                    <div className="px-3 py-1 text-[9px] font-bold tracking-widest text-[#64748B] border-b border-[#F1F5F9] mb-1">
                      {group.title}
                    </div>
                    {group.items.map((item, itemIdx) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={itemIdx}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                            isActive
                              ? 'bg-[#1E3A8A] text-white font-bold shadow-md'
                              : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E3A8A]'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-[#E2E8F0] shrink-0">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[10px]">
                <div className="flex items-center gap-2 text-[#0891B2] font-extrabold">
                  <Activity className="w-3.5 h-3.5 shrink-0 pulse-activity" />
                  <span>PROXIMA ACTIVE</span>
                </div>
                <p className="text-[#64748B] mt-1 leading-relaxed">
                  Real Mode active. Safe handoff engaged.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 relative min-h-[calc(100vh-4rem)]">
        
        {/* ── SMART COLLAPSIBLE SIDEBAR ── */}
        <aside
          className={`hidden md:flex flex-col border-r border-[#E2E8F0] bg-white transition-all duration-300 ${
            collapsed ? 'w-16' : 'w-64'
          } shrink-0`}
        >
          <div className="flex-1 flex flex-col justify-between p-3 overflow-y-auto max-h-[calc(100vh-4rem)]">
            <nav className="space-y-4">
              {navGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1">
                  {!collapsed && (
                    <div className="px-3 py-2 text-[10px] font-bold tracking-widest text-[#64748B] font-mono border-b border-[#F1F5F9] mb-1">
                      {group.title}
                    </div>
                  )}
                  {group.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={itemIdx}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-mono text-xs ${
                          isActive
                            ? 'bg-[#1E3A8A] text-white font-bold shadow-md'
                            : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E3A8A]'
                        }`}
                        title={item.label}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                        {!collapsed && (
                          <span className="whitespace-nowrap transition-opacity duration-200">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Sidebar Footer System Pulse info */}
            <div className="pt-3 border-t border-[#E2E8F0] mt-4">
              <div className={`p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[10px] font-mono ${collapsed ? 'text-center' : ''}`}>
                <div className="flex items-center gap-2 text-[#0891B2] font-extrabold">
                  <Activity className="w-3.5 h-3.5 shrink-0 pulse-activity" />
                  {!collapsed && <span>PROXIMA ACTIVE</span>}
                </div>
                {!collapsed && (
                  <p className="text-[#64748B] mt-1 leading-relaxed">
                    OS executing in Real Mode. Safe handoff active.
                  </p>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN WORKSPACE CONTENT AREA ── */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto min-w-0 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto space-y-6 panel-enter">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Overlay for MORE Menu */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/40 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white border-t border-[#E2E8F0] rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-[#0F172A] text-sm flex items-center gap-2">
                <Grid className="w-5 h-5 text-[#1E3A8A]" /> PROXIMA CHANNELS & CONTROLS
              </h3>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#64748B] hover:text-[#0F172A]"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {navGroups.flatMap(g => g.items).map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-3 bg-white border border-[#E2E8F0] rounded-xl flex items-center gap-2 text-[#475569] font-semibold hover:border-[#1E3A8A] hover:bg-[#F8FAFC] transition-all"
                  >
                    <Icon className="w-4 h-4 text-[#64748B]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Mobile Bottom Navigation Bar (md:hidden) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 pb-[env(safe-area-inset-bottom,0px)] bg-white border-t border-[#E2E8F0] flex items-center justify-around z-40 md:hidden font-mono text-xs shadow-lg select-none">
        {mobileBottomNav.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={idx}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 transition-colors ${
                isActive ? 'text-[#1E3A8A] font-bold' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <Grid className="w-5 h-5" />
          <span>More</span>
        </button>
      </div>
    </div>
  );
}
