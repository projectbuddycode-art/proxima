'use client';

import React, { useEffect, useState } from 'react';
import { Bot, Target, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, MessageSquare, RefreshCw, Compass } from 'lucide-react';

export default function AICEOPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; text: string }>>([
    {
      role: 'commander',
      text: 'Greetings Shivam. I am PROXIMA COMMANDER, your AI CEO & Growth Commander. Target: ₹10,00,000 for August 2026. How can I assist target execution today?'
    }
  ]);

  useEffect(() => {
    fetch('/api/commander')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);

    setTimeout(() => {
      let reply = 'PROXIMA COMMANDER Recommendation: Prioritize Hyderabad Agency Execution Partnerships campaign and run Titan Mail follow-up cadence for Bangalore Lighting leads.';
      if (userMsg.toLowerCase().includes('behind') || userMsg.toLowerCase().includes('target')) {
        reply = `Target Gap Analysis: Current Revenue is ₹2.1L against ₹10L target (18 days remaining). Required daily pace: ₹43,888/day. Recommendation: Launch high-intent outreach in Hyderabad & Chennai hubs.`;
      }
      setChatHistory(prev => [...prev, { role: 'commander', text: reply }]);
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400 font-mono text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
          <span>PROXIMA COMMANDER AI CEO Analyzing Monthly Objectives...</span>
        </div>
      </div>
    );
  }

  const target = data?.target;
  const gap = data?.gapAnalysis;
  const tasks = data?.tasks || [];
  const cityMatrix = data?.cityMatrix || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-cyan-400" /> PROXIMA COMMANDER (AI CEO)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Central Growth & Execution Commander responsible for Revenue Targets, City Expansion, Dev Planning, and Shivam Handoffs.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/60 border border-cyan-800 text-cyan-300 font-bold text-xs rounded-full font-mono">
          <Target className="w-3.5 h-3.5 text-cyan-400" /> Target: ₹{target?.revenue_target?.toLocaleString()} ({target?.month})
        </div>
      </div>

      {/* Target Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-slate-400 block">Monthly Target</span>
          <strong className="text-xl text-white block mt-1">₹{target?.revenue_target?.toLocaleString()}</strong>
          <span className="text-[10px] text-slate-500">August 2026</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-slate-400 block">Current Revenue</span>
          <strong className="text-xl text-emerald-400 block mt-1">₹{gap?.current_revenue?.toLocaleString()}</strong>
          <span className="text-[10px] text-emerald-500">Verified Pipeline</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-slate-400 block">Revenue Gap</span>
          <strong className="text-xl text-red-400 block mt-1">₹{gap?.revenue_gap?.toLocaleString()}</strong>
          <span className="text-[10px] text-red-500">{gap?.days_remaining} Days Remaining</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-slate-400 block">Required Daily Pace</span>
          <strong className="text-xl text-orange-400 block mt-1">₹{gap?.required_daily_pipeline?.toLocaleString()}/day</strong>
          <span className="text-[10px] text-orange-500">Execution Target</span>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Priorities & City Matrix */}
        <div className="lg:col-span-2 space-y-6">
          {/* Commander Priority Tasks */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" /> Commander Execution Priorities
            </h3>

            <div className="space-y-3">
              {tasks.map((t: any) => (
                <div key={t.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{t.title}</span>
                      <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono text-[10px] rounded-full">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">{t.expected_impact}</p>
                  </div>
                  <span className="font-mono text-orange-400 font-bold">Score: {t.priority_score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Geographic Expansion Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" /> Geographic Auto-Expansion Matrix (India)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {cityMatrix.map((c: any) => (
                <div key={c.city} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{c.city}</span>
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono rounded">
                      {c.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Found: {c.prospects_found} | Qualified: {c.verified_prospects}</p>
                  <p className="text-emerald-400 text-[11px] font-bold">Revenue: ₹{c.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI CEO Interactive Chat */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-[500px]">
          <div>
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" /> Interactive AI CEO Chat
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[360px] pr-2 text-xs">
              {chatHistory.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl ${
                    m.role === 'commander'
                      ? 'bg-slate-950 border border-slate-800 text-slate-200'
                      : 'bg-cyan-950/60 border border-cyan-800 text-cyan-200 ml-4'
                  }`}
                >
                  <strong className="block text-[10px] uppercase font-mono mb-1 text-cyan-400">
                    {m.role === 'commander' ? 'PROXIMA COMMANDER (AI CEO)' : 'Shivam (Founder)'}
                  </strong>
                  <p className="leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              placeholder="Ask Commander: 'What should we do today?'"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleSendChat}
              className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded-xl"
            >
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
