import './globals.css';
import React from 'react';
import Link from 'next/link';
import LocalAIEngine from './components/LocalAIEngine';
import {
  LayoutDashboard,
  Target,
  Users,
  BookOpen,
  Settings,
  ShieldCheck,
  Flame,
  Bot,
  Compass,
  Lock,
  Mail,
  Activity,
  Globe,
  Cpu,
  Eye
} from 'lucide-react';

export const metadata = {
  title: 'PROXIMA COMMANDER — Autonomous Growth Operating System',
  description: 'PROXIMA COMMANDER — AI CEO + GTM Commander + Development Commander for Project Buddy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B132B] text-slate-100 min-h-screen flex flex-col font-sans">
        {/* Top Cyber Intelligence Header */}
        <header className="h-16 border-b border-slate-800 bg-[#1C2541]/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl text-white font-bold tracking-wider shadow-lg shadow-cyan-500/20">
              PRX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-tight text-white font-mono">PROXIMA COMMANDER</h1>
                <span className="text-[10px] px-2 py-0.5 bg-orange-950 text-orange-400 font-bold border border-orange-800 rounded-full">
                  AI CEO OPERATING SYSTEM
                </span>
              </div>
              <p className="text-[11px] text-cyan-400 font-medium tracking-wide">AUTONOMOUS GROWTH & DEVELOPMENT OPERATING SYSTEM</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Local AI Engine Control Panel Component */}
            <LocalAIEngine />

            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-slate-300">Takeover Target: <strong className="text-slate-100">Founder Shivam</strong></span>
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          {/* Proxima Navigation Sidebar */}
          <aside className="w-64 border-r border-slate-800 bg-[#1C2541]/40 p-4 flex flex-col justify-between">
            <nav className="space-y-1 text-xs">
              <div className="px-3 py-2 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Commander & Strategy</div>
              <Link href="/ai-ceo" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 hover:bg-slate-800 transition-colors">
                <Bot className="w-4 h-4 text-cyan-400" />
                PROXIMA COMMANDER (AI CEO)
              </Link>
              <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-200 hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                Command Center
              </Link>
              <Link href="/contacts" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-200 hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Contact Intelligence Panel
              </Link>

              <div className="px-3 py-2 pt-3 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Operations & Engineering</div>
              <Link href="/agents" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-200 hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <Bot className="w-4 h-4 text-blue-400" />
                Virtual Sales Team (27)
              </Link>
              <Link href="/social-workspace" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-200 hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <Eye className="w-4 h-4 text-purple-400" />
                Social Workspace
              </Link>
              <Link href="/development" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-200 hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <Cpu className="w-4 h-4 text-purple-400" />
                Development Commander
              </Link>
              <Link href="/security-intelligence" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-200 hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <Lock className="w-4 h-4 text-emerald-400" />
                Security Intelligence
              </Link>
              <Link href="/agent-security" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-200 hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Agent Security Center
              </Link>
              <Link href="/experiments" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-200 hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <Compass className="w-4 h-4 text-amber-400" />
                Strategy Experiments
              </Link>
              <Link href="/campaigns" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-200 hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <Target className="w-4 h-4 text-cyan-400" />
                Campaigns
              </Link>
              <Link href="/prospects" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-200 hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <Users className="w-4 h-4 text-emerald-400" />
                Verified Prospects
              </Link>
              <Link href="/knowledge" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-200 hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Knowledge Base
              </Link>

              <div className="px-3 py-2 pt-3 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Settings & Channels</div>
              <Link href="/settings/email" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-200 hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <Mail className="w-4 h-4 text-orange-400" />
                Titan Email Settings
              </Link>
              <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-200 hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <Settings className="w-4 h-4 text-slate-400" />
                System Settings
              </Link>
            </nav>

            <div className="p-3 bg-[#0B132B] rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold font-mono text-[11px]">
                <Globe className="w-3.5 h-3.5" /> PROXIMA COMMANDER
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Target: ₹10,00,000 Revenue (August 2026).
              </p>
            </div>
          </aside>

          {/* Main Workspace Viewport */}
          <main className="flex-1 bg-[#0B132B] p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
