'use client';

import React, { useEffect, useState } from 'react';
import { Bot, Target, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, MessageSquare, RefreshCw, Compass } from 'lucide-react';
import { ProximaHeader, MetricCard, StatusBadge } from '../components/ui/design-system';

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
        <div className="flex items-center gap-3 text-[#64748B] font-mono text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-[#2563EB]" />
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
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <ProximaHeader
        title="PROXIMA COMMANDER (AI CEO)"
        subtitle="Central Growth & Execution Commander responsible for Revenue Targets, City Expansion, Dev Planning, and Shivam Handoffs."
        status="ACTIVE"
      />

      {/* Target Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Monthly Target" value={`₹${target?.revenue_target?.toLocaleString()}`} subtext="August 2026 Objective" />
        <MetricCard label="Current Revenue" value={`₹${gap?.current_revenue?.toLocaleString()}`} subtext="Verified Pipeline Val" color="text-[#10B981]" />
        <MetricCard label="Revenue Gap" value={`₹${gap?.revenue_gap?.toLocaleString()}`} subtext={`${gap?.days_remaining} Days Remaining`} color="text-[#EF4444]" />
        <MetricCard label="Required Daily Pace" value={`₹${gap?.required_daily_pipeline?.toLocaleString()}/day`} subtext="Outbound Conversion Rate" color="text-[#F59E0B]" />
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Priorities & City Matrix */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Commander Priority Tasks */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-[#0F172A] flex items-center gap-2 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-[#2563EB]" /> Commander Execution Priorities
            </h3>

            <div className="space-y-3">
              {tasks.map((t: any) => (
                <div key={t.id} className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#0F172A]">{t.title}</span>
                      <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] text-[9px] rounded-full">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-[#64748B] text-[10px] mt-1">{t.expected_impact}</p>
                  </div>
                  <span className="text-[#F59E0B] font-bold">Priority: {t.priority_score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Geographic Expansion Matrix */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-[#0F172A] flex items-center gap-2 uppercase tracking-wider">
              <Compass className="w-4 h-4 text-[#F59E0B]" /> Geographic Auto-Expansion Matrix
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {cityMatrix.map((c: any) => (
                <div key={c.city} className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-[#0F172A]">
                    <span>{c.city}</span>
                    <StatusBadge status={c.status === 'KEEP' || c.status === 'EXPAND' ? 'SUCCESS' : 'PENDING'} label={c.status} />
                  </div>
                  <p className="text-[#64748B] text-[10px]">Found: {c.prospects_found} | Qualified: {c.verified_prospects}</p>
                  <p className="text-[#10B981] text-[10px] font-bold">Revenue: ₹{c.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI CEO Interactive Chat */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col justify-between h-[500px] shadow-sm">
          <div>
            <h3 className="text-xs font-black text-[#0F172A] mb-3 flex items-center gap-2 uppercase tracking-wider border-b border-[#F1F5F9] pb-3">
              <MessageSquare className="w-4 h-4 text-[#2563EB]" /> Interactive AI CEO Chat
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
              {chatHistory.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl ${
                    m.role === 'commander'
                      ? 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#334155]'
                      : 'bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF]'
                  }`}
                >
                  <strong className="block text-[9px] uppercase mb-1 text-[#2563EB]">
                    {m.role === 'commander' ? 'PROXIMA COMMANDER (AI CEO)' : 'Shivam (Founder)'}
                  </strong>
                  <p className="leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-[#E2E8F0]">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              placeholder="Ask: 'What is our target gap today?'"
              className="flex-1 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
            <button
              onClick={handleSendChat}
              className="px-4 py-2 bg-[#1E3A8A] text-white font-bold rounded-xl transition-all"
            >
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
