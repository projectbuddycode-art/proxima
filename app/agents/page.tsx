'use client';

import React, { useEffect, useState } from 'react';
import { Bot, CheckCircle2, ShieldCheck, Play, Pause, AlertCircle, Sparkles } from 'lucide-react';

export default function AgentControlCenter() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => setAgents(data.agents || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-400" /> Virtual Sales Team Control Center (27 Agents)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor, inspect, and manage specialized agents across Orchestrator, Scouts, Analysts, Copywriting, QA Panel, and Handoff layers.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-950/60 border border-blue-800 text-blue-300 font-bold text-xs rounded-full">
          <Sparkles className="w-4 h-4 text-blue-400" /> 27 Active Agents
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-xs py-8">Loading Virtual Sales Team Scorecards...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((a) => (
            <div key={a.id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{a.name}</span>
                  <span className="px-2 py-0.5 bg-slate-800 text-xs font-mono font-bold text-orange-400 rounded">
                    {a.model_tier === 'strong' ? 'Strong LLM' : 'Fast LLM'}
                  </span>
                </div>
                <p className="text-xs text-blue-400 font-medium mt-0.5">{a.role}</p>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{a.goal}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="p-1.5 bg-slate-950 rounded-lg">
                  <span className="text-slate-400 block">Completed</span>
                  <strong className="text-slate-100 font-bold">{a.tasks_completed}</strong>
                </div>
                <div className="p-1.5 bg-slate-950 rounded-lg">
                  <span className="text-slate-400 block">Success</span>
                  <strong className="text-emerald-400 font-bold">{a.success_rate}%</strong>
                </div>
                <div className="p-1.5 bg-slate-950 rounded-lg">
                  <span className="text-slate-400 block">Min Conf</span>
                  <strong className="text-orange-400 font-bold">{a.confidence_threshold}%</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
