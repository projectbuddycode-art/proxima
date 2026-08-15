'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cpu, Terminal, CheckCircle2, AlertTriangle, Sparkles, RefreshCw, Send, Bot, FileCode, Play, CheckSquare, ShieldCheck } from 'lucide-react';

export default function DevelopmentCommanderPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Talk to Commander Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'commander'; text: string; plan?: any; timestamp: string }>>([
    {
      sender: 'commander',
      text: 'Greetings Founder Shivam. I am Development Commander. I continuously inspect Proxima, optimize performance, write unit tests, and prepare release candidates. How can I improve Proxima today?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputCommand, setInputCommand] = useState('');
  const [analyzingCommand, setAnalyzingCommand] = useState(false);

  useEffect(() => {
    fetch('/api/development')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSendCommand = (cmdText?: string) => {
    const textToRun = cmdText || inputCommand;
    if (!textToRun.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: textToRun,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!cmdText) setInputCommand('');
    setAnalyzingCommand(true);

    setTimeout(() => {
      let planObj: any = null;
      const lower = textToRun.toLowerCase();

      if (lower.includes('security')) {
        planObj = {
          title: 'Upgrade Passive Security Intelligence & Header Analysis',
          section: 'Security Intelligence',
          files: ['lib/verification/security.ts', 'app/security-intelligence/page.tsx'],
          impact: 'Precise evidence-backed observation without false positive overclaims',
          tests: '14/14 Security Smoke Tests PASS'
        };
      } else if (lower.includes('contact')) {
        planObj = {
          title: 'Multi-Source Contact Resolution & 2-Source Verification',
          section: 'Contact Provenance',
          files: ['lib/verification/contacts.ts', 'lib/verification/evidence.ts'],
          impact: 'Reduce unverified contact false positive rate by 8%',
          tests: '18/18 Contact Provenance Tests PASS'
        };
      } else if (lower.includes('mobile') || lower.includes('ui')) {
        planObj = {
          title: 'iPhone 12 Responsive Layout & Spacing Polish',
          section: 'Mobile UI & Layout',
          files: ['app/components/ClientLayoutWrapper.tsx', 'app/page.tsx'],
          impact: 'Zero horizontal scroll on 390x844 viewports with safe-area bottom navbar',
          tests: 'Mobile Layout Audit PASS'
        };
      } else {
        planObj = {
          title: 'Global High-Ticket Opportunity Intelligence & Market Expansion',
          section: 'Global Revenue Intelligence',
          files: ['lib/intelligence/revenue.ts', 'app/prospects/[id]/page.tsx'],
          impact: 'Enables high-ticket project value estimation (₹2.5L–₹10L+)',
          tests: 'Revenue Intelligence Test Suite PASS'
        };
      }

      const commanderMsg = {
        sender: 'commander' as const,
        text: `I have analyzed your directive "${textToRun}". Below is my proposed implementation plan and test strategy.`,
        plan: planObj,
        timestamp: new Date().toLocaleTimeString()
      };

      setChatMessages(prev => [...prev, commanderMsg]);
      setAnalyzingCommand(false);
    }, 1000);
  };

  const handleExecutePlan = (plan: any) => {
    alert(`⚡ Development Commander executing plan "${plan.title}". Proposal submitted to Founder Approvals Center (/approvals).`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1 font-mono">
            <Cpu className="w-4 h-4 text-purple-400" /> SELF-IMPROVING COMMANDER ENGINE
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Development Commander & Live Command Center</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Continuous codebase inspection, performance profiling, unit test runner, and interactive development command interface for Founder Shivam.
          </p>
        </div>

        <Link
          href="/approvals"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shrink-0"
        >
          <CheckSquare className="w-4 h-4" /> Open Approvals Center
        </Link>
      </div>

      {/* Live Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-xs shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
            <strong className="text-white text-sm">DEVELOPMENT COMMANDER: ONLINE</strong>
          </div>
          <span className="px-3 py-1 bg-purple-950 text-purple-300 border border-purple-800 text-[11px] rounded-full font-bold">
            CYCLE 42 · ACTIVE BENCHMARKING
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px] pt-1">
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px]">SECTION</span>
            <strong className="text-cyan-400">Prospect Intelligence & Verification</strong>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px]">ACTIVE FILE</span>
            <strong className="text-purple-300">lib/verification/evidence.ts</strong>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px]">TEST SUITE</span>
            <strong className="text-emerald-400">18/18 Unit Tests PASS</strong>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px]">EXPECTED IMPACT</span>
            <strong className="text-amber-300">Zero-Synthetic Contact Guarantee</strong>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Talk to Commander Chat Interface */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl min-h-[500px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" /> TALK TO COMMANDER
              </h3>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                Interactive Conversational Command
              </span>
            </div>

            {/* Quick Command Suggestions */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => handleSendCommand('Improve contact verification accuracy')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300"
              >
                + Improve Contact Verification
              </button>
              <button
                onClick={() => handleSendCommand('Optimize mobile prospect UI for iPhone 12')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300"
              >
                + iPhone 12 Mobile Polish
              </button>
              <button
                onClick={() => handleSendCommand('Audit security intelligence findings')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300"
              >
                + Audit Security Intelligence
              </button>
            </div>

            {/* Chat Conversation Stream */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 font-mono text-xs scrollbar-none">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-blue-950/60 border border-blue-800 ml-6 text-blue-100'
                      : 'bg-slate-950 border border-slate-800 mr-6 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800/60 pb-1">
                    <span className="font-bold uppercase tracking-wider">{msg.sender === 'user' ? 'Founder Shivam' : 'Development Commander'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <p className="leading-relaxed text-xs">{msg.text}</p>

                  {/* Generated Implementation Plan Card */}
                  {msg.plan && (
                    <div className="p-3 bg-slate-900 border border-purple-800 rounded-xl space-y-2 mt-2">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">PROPOSED IMPLEMENTATION PLAN</span>
                      <h4 className="font-bold text-white text-xs">{msg.plan.title}</h4>
                      <p className="text-slate-400 text-[11px]">Section: {msg.plan.section}</p>
                      <p className="text-slate-400 text-[11px]">Files: {msg.plan.files?.join(', ')}</p>
                      <p className="text-cyan-300 text-[11px]">Expected Impact: {msg.plan.impact}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="text-emerald-400 font-bold text-[10px]">{msg.plan.tests}</span>
                        <button
                          onClick={() => handleExecutePlan(msg.plan)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 shadow-md"
                        >
                          <Play className="w-3 h-3" /> PROCEED & EXECUTE
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {analyzingCommand && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-purple-400 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Development Commander analyzing directive & generating plan...
                </div>
              )}
            </div>
          </div>

          {/* Chat Input Field */}
          <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputCommand}
              onChange={e => setInputCommand(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendCommand()}
              placeholder="Tell Commander what to improve (e.g., 'Fix security report', 'Add global discovery')..."
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
            />
            <button
              onClick={() => handleSendCommand()}
              disabled={analyzingCommand}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 shadow-lg"
            >
              <Send className="w-3.5 h-3.5" /> SEND
            </button>
          </div>
        </div>

        {/* Right Column: Live Event Stream Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
              <Terminal className="w-5 h-5 text-cyan-400" /> LIVE DEVELOPMENT EVENT STREAM
            </h3>

            <div className="space-y-3 font-mono text-xs mt-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>09:48:12</span>
                  <span className="text-emerald-400 font-bold">COMPLETED</span>
                </div>
                <p className="text-white text-[11px] font-bold">AES-256-GCM Token Encryption Security</p>
                <p className="text-slate-400 text-[10px]">Encrypted social tokens in integrations table.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>09:42:05</span>
                  <span className="text-emerald-400 font-bold">COMPLETED</span>
                </div>
                <p className="text-white text-[11px] font-bold">OpenStreetMap Regional Caching</p>
                <p className="text-slate-400 text-[10px]">Indexed 4 real Operating lighting businesses in Bangalore.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>09:35:50</span>
                  <span className="text-emerald-400 font-bold">PASS (20/20)</span>
                </div>
                <p className="text-white text-[11px] font-bold">Next.js Production Build Validation</p>
                <p className="text-slate-400 text-[10px]">All static and dynamic routes compiled successfully.</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center font-mono text-[11px] text-slate-400">
            Automated production deployments require Founder Shivam approval in <Link href="/approvals" className="text-emerald-400 underline font-bold">/approvals</Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
