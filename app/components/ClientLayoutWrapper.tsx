'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LocalAIEngine from './LocalAIEngine';
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
  Globe,
  Cpu,
  Eye,
  Share2,
  CheckSquare,
  MoreHorizontal,
  X,
  Activity
} from 'lucide-react';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  const toggleSidebar = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    try {
      localStorage.setItem('proxima_sidebar_collapsed', String(nextState));
    } catch (e) {
      // Ignore
    }
  };

  const isExpanded = !collapsed || isHovered;

  const navItems = [
    { section: 'Commander & Strategy' },
    { href: '/', icon: LayoutDashboard, label: 'Command Center', color: 'text-cyan-400' },
    { href: '/ai-ceo', icon: Bot, label: 'PROXIMA COMMANDER (AI CEO)', highlight: true, color: 'text-cyan-400' },
    { href: '/development', icon: Cpu, label: 'Development Commander', color: 'text-purple-400' },
    { href: '/approvals', icon: CheckSquare, label: 'Approvals Center', color: 'text-emerald-400' },
    { href: '/contacts', icon: ShieldCheck, label: 'Contact Intelligence Panel', color: 'text-emerald-400' },

    { section: 'Operations & Engineering' },
    { href: '/prospects', icon: Users, label: 'Verified Prospects', color: 'text-emerald-400' },
    { href: '/agents', icon: Bot, label: 'Virtual Sales Team (20)', color: 'text-blue-400' },
    { href: '/social-workspace', icon: Eye, label: 'Social Workspace', color: 'text-purple-400' },
    { href: '/security-intelligence', icon: Lock, label: 'Security Intelligence', color: 'text-emerald-400' },
    { href: '/agent-security', icon: ShieldCheck, label: 'Agent Security Center', color: 'text-purple-400' },
    { href: '/experiments', icon: Compass, label: 'Strategy Experiments', color: 'text-amber-400' },
    { href: '/campaigns', icon: Target, label: 'Campaigns', color: 'text-cyan-400' },
    { href: '/knowledge', icon: BookOpen, label: 'Knowledge Base', color: 'text-indigo-400' },

    { section: 'Settings & Channels' },
    { href: '/connections', icon: Share2, label: 'Connections Center', color: 'text-purple-400' },
    { href: '/settings/social', icon: Share2, label: 'Social Connections', color: 'text-purple-400' },
    { href: '/settings/email', icon: Mail, label: 'Titan Email Settings', color: 'text-orange-400' },
    { href: '/settings', icon: Settings, label: 'System Settings', color: 'text-slate-400' }
  ];

  // Primary 5 Mobile Destinations
  const mobileBottomNav = [
    { href: '/', icon: LayoutDashboard, label: 'Home' },
    { href: '/prospects', icon: Users, label: 'Prospects' },
    { href: '/agents', icon: Bot, label: 'Agents' },
    { href: '/development', icon: Cpu, label: 'Command' }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0B132B] text-slate-100 pb-16 md:pb-0 overflow-x-hidden">
      {/* Top Cyber Intelligence Header */}
      <header className="h-16 border-b border-slate-800 bg-[#1C2541]/90 backdrop-blur px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Menu Toggle Button ☰ */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
            title="Toggle Sidebar (☰)"
          >
            <Menu className="w-5 h-5 text-cyan-400" />
          </button>

          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl text-white font-bold tracking-wider shadow-lg shadow-cyan-500/20 text-xs font-mono">
            PRX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base md:text-lg tracking-tight text-white font-mono">PROXIMA</h1>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 font-bold border border-emerald-800 rounded-full font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <p className="hidden sm:block text-[10px] md:text-[11px] text-cyan-400 font-medium tracking-wide font-mono">PROXIMA AI REVENUE OPERATING SYSTEM</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <LocalAIEngine />

          <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-300">Shivam Handoff: <strong className="text-slate-100">READY</strong></span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Desktop Collapsible Sidebar (Icon-First Collapsed by Default) */}
        <aside
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`hidden md:flex h-[calc(100vh-4rem)] border-r border-slate-800 bg-[#1C2541]/60 backdrop-blur-md p-3 flex-col justify-between transition-all duration-300 ${
            isExpanded ? 'w-64' : 'w-16'
          }`}
        >
          <nav className="space-y-1 text-xs overflow-y-auto max-h-[80vh] scrollbar-none">
            {navItems.map((item, idx) => {
              if (item.section) {
                return (
                  <div
                    key={idx}
                    className={`px-3 py-2 font-semibold text-slate-400 uppercase tracking-wider text-[10px] font-mono ${
                      !isExpanded ? 'hidden' : 'block'
                    }`}
                  >
                    {item.section}
                  </div>
                );
              }

              const Icon = item.icon!;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={idx}
                  href={item.href!}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-bold'
                      : item.highlight
                      ? 'bg-purple-950/40 border border-purple-800/40 text-purple-300 hover:bg-purple-900/40'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-cyan-400'
                  }`}
                  title={item.label}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                  <span className={`whitespace-nowrap font-mono transition-opacity duration-200 ${!isExpanded ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-800">
            <div className={`p-2 bg-[#0B132B] rounded-xl border border-slate-800 text-xs space-y-1 font-mono ${!isExpanded ? 'text-center' : ''}`}>
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-[11px]">
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span className={!isExpanded ? 'hidden' : 'inline'}>PROXIMA OS</span>
              </div>
              {isExpanded && (
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Real Operations Active.
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area — Occupies Available Viewport */}
        <main className="flex-1 bg-[#0B132B] p-4 md:p-6 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Overlay for MORE Menu */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[80vh] overflow-y-auto font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <MoreHorizontal className="w-5 h-5 text-cyan-400" /> PROXIMA OS MODULES & CHANNELS
              </h3>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <Link
                href="/approvals"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-slate-200 font-semibold hover:border-emerald-500"
              >
                <CheckSquare className="w-4 h-4 text-emerald-400" /> Approvals Center
              </Link>
              <Link
                href="/connections"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-slate-200 font-semibold hover:border-purple-500"
              >
                <Share2 className="w-4 h-4 text-purple-400" /> Connections Center
              </Link>
              <Link
                href="/ai-ceo"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-slate-200 font-semibold hover:border-cyan-500"
              >
                <Bot className="w-4 h-4 text-cyan-400" /> AI CEO Commander
              </Link>
              <Link
                href="/security-intelligence"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-slate-200 font-semibold hover:border-emerald-500"
              >
                <Lock className="w-4 h-4 text-emerald-400" /> Security Intelligence
              </Link>
              <Link
                href="/social-workspace"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-slate-200 font-semibold hover:border-purple-500"
              >
                <Eye className="w-4 h-4 text-purple-400" /> Social Workspace
              </Link>
              <Link
                href="/settings/email"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-slate-200 font-semibold hover:border-orange-500"
              >
                <Mail className="w-4 h-4 text-orange-400" /> Titan Email
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Mobile Bottom Navigation Bar (md:hidden) with iOS Safe-Area Padding */}
      <div className="fixed bottom-0 left-0 right-0 h-16 pb-[env(safe-area-inset-bottom,0px)] bg-[#1C2541]/95 backdrop-blur border-t border-slate-800 flex items-center justify-around z-40 md:hidden font-mono text-xs">
        {mobileBottomNav.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={idx}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 transition-colors ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 text-slate-400 hover:text-slate-200 transition-colors font-mono"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>More</span>
        </button>
      </div>
    </div>
  );
}
