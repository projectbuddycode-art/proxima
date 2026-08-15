'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Share2
} from 'lucide-react';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('proxima_sidebar_collapsed');
      if (saved !== null) {
        setCollapsed(saved === 'true');
      }
    } catch (e) {
      // Ignore localStorage errors
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

  const isExpanded = !collapsed || isHovered || mobileOpen;

  const navItems = [
    { section: 'Commander & Strategy' },
    { href: '/ai-ceo', icon: Bot, label: 'PROXIMA COMMANDER (AI CEO)', highlight: true, color: 'text-cyan-400' },
    { href: '/', icon: LayoutDashboard, label: 'Command Center', color: 'text-cyan-400' },
    { href: '/contacts', icon: ShieldCheck, label: 'Contact Intelligence Panel', color: 'text-emerald-400' },

    { section: 'Operations & Engineering' },
    { href: '/agents', icon: Bot, label: 'Virtual Sales Team (20)', color: 'text-blue-400' },
    { href: '/social-workspace', icon: Eye, label: 'Social Workspace', color: 'text-purple-400' },
    { href: '/development', icon: Cpu, label: 'Development Commander', color: 'text-purple-400' },
    { href: '/security-intelligence', icon: Lock, label: 'Security Intelligence', color: 'text-emerald-400' },
    { href: '/agent-security', icon: ShieldCheck, label: 'Agent Security Center', color: 'text-purple-400' },
    { href: '/experiments', icon: Compass, label: 'Strategy Experiments', color: 'text-amber-400' },
    { href: '/campaigns', icon: Target, label: 'Campaigns', color: 'text-cyan-400' },
    { href: '/prospects', icon: Users, label: 'Verified Prospects', color: 'text-emerald-400' },
    { href: '/knowledge', icon: BookOpen, label: 'Knowledge Base', color: 'text-indigo-400' },

    { section: 'Settings & Channels' },
    { href: '/settings/social', icon: Share2, label: 'Social Connections', color: 'text-purple-400' },
    { href: '/settings/email', icon: Mail, label: 'Titan Email Settings', color: 'text-orange-400' },
    { href: '/settings', icon: Settings, label: 'System Settings', color: 'text-slate-400' }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0B132B] text-slate-100">
      {/* Top Cyber Intelligence Header */}
      <header className="h-16 border-b border-slate-800 bg-[#1C2541]/90 backdrop-blur px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Menu Toggle Button ☰ */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
            title="Toggle Sidebar (☰)"
          >
            <Menu className="w-5 h-5 text-cyan-400" />
          </button>

          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl text-white font-bold tracking-wider shadow-lg shadow-cyan-500/20 text-xs">
            PRX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base md:text-lg tracking-tight text-white font-mono">PROXIMA COMMANDER</h1>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 bg-orange-950 text-orange-400 font-bold border border-orange-800 rounded-full">
                AUTONOMOUS MODE
              </span>
            </div>
            <p className="text-[10px] md:text-[11px] text-cyan-400 font-medium tracking-wide">AUTONOMOUS GROWTH & REAL PROSPECT INTELLIGENCE</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <LocalAIEngine />

          <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-300">Takeover Target: <strong className="text-slate-100">Founder Shivam</strong></span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          />
        )}

        {/* Collapsible Sidebar */}
        <aside
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`fixed md:relative z-40 h-[calc(100vh-4rem)] border-r border-slate-800 bg-[#1C2541]/60 backdrop-blur-md p-3 flex flex-col justify-between transition-all duration-300 ${
            isExpanded ? 'w-64' : 'w-16'
          } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          <nav className="space-y-1 text-xs overflow-y-auto max-h-[80vh] scrollbar-none">
            {navItems.map((item, idx) => {
              if (item.section) {
                return (
                  <div
                    key={idx}
                    className={`px-3 py-2 font-semibold text-slate-400 uppercase tracking-wider text-[10px] ${
                      !isExpanded ? 'hidden' : 'block'
                    }`}
                  >
                    {item.section}
                  </div>
                );
              }

              const Icon = item.icon!;
              return (
                <Link
                  key={idx}
                  href={item.href!}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    item.highlight
                      ? 'bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/60'
                      : 'text-slate-200 hover:bg-slate-800/80 hover:text-cyan-400'
                  }`}
                  title={item.label}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                  <span className={`whitespace-nowrap transition-opacity duration-200 ${!isExpanded ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-800">
            <div className={`p-2 bg-[#0B132B] rounded-xl border border-slate-800 text-xs space-y-1 font-mono ${!isExpanded ? 'text-center' : ''}`}>
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-[11px]">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span className={!isExpanded ? 'hidden' : 'inline'}>PROXIMA COMMANDER</span>
              </div>
              {isExpanded && (
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Autonomous Target: ₹10,00,000 (August 2026).
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
    </div>
  );
}
