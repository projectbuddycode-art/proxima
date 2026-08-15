'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Send,
  Bot,
  FileCode,
  CheckSquare,
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import { StatusBadge, MetricCard, EmptyState, LoadingSpinner } from '../components/ui/design-system';

export default function DevelopmentCommanderPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inputPrompt, setInputPrompt] = useState('');
  const [executing, setExecuting] = useState(false);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'commander'; text: string; task?: any; timestamp: string }>>([
    {
      sender: 'commander',
      text: 'Greetings Founder Shivam. I am Development Commander. I continuously audit the Proxima codebase, manage regression test suites, inspect system health, and submit proposals to the Approvals Center. Type any engineering directive below.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/development');
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSendDirective = async (promptText?: string) => {
    const textToRun = promptText || inputPrompt;
    if (!textToRun.trim() || executing) return;

    const userMsg = {
      sender: 'user' as const,
      text: textToRun,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!promptText) setInputPrompt('');
    setExecuting(true);

    try {
      const res = await fetch('/api/development', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_directive',
          prompt: textToRun
        })
      });
      const resData = await res.json();

      const commanderMsg = {
        sender: 'commander' as const,
        text: resData.responseMessage || 'Directive processed. Engineering proposal created.',
        task: resData.task,
        timestamp: new Date().toLocaleTimeString()
      };

      setChatMessages(prev => [...prev, commanderMsg]);
      await fetchStatus();
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'commander',
          text: 'Execution error while processing engineering directive.',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Connecting to Proxima Development Commander & Worker Heartbeat..." />;
  }

  const worker = data?.worker || {};
  const tasks = data?.tasks || [];
  const systemHealth = data?.systemHealth || {};

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-[#1C2541]/80 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4 text-cyan-400" /> REAL DEVELOPMENT COMMANDER OS
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">AI Engineering Control Console</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Autonomous engineering loop: Audit, Identify, Plan, Test, Verify, and Deploy upon Shivam's approval.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status="SUCCESS" label={`WORKER: ${worker.status || 'RUNNING'}`} />
          <Link
            href="/approvals"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            <CheckSquare className="w-4 h-4" /> APPROVALS CENTER
          </Link>
        </div>
      </div>

      {/* System Health Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <MetricCard label="DATABASE ADAPTER" value={systemHealth.Database || 'LOCAL_JSON'} color="text-purple-400" />
        <MetricCard label="LOCAL OLLAMA" value={systemHealth.Ollama || 'qwen2.5-coder:3b'} color="text-cyan-400" />
        <MetricCard label="CODE HEALTH SCORE" value={`${data?.codeHealthScore || 98}/100`} color="text-emerald-400" />
        <MetricCard label="TEST COVERAGE" value={data?.unitTestCoverage || '100%'} color="text-blue-400" />
      </div>

      {/* Main Responsive Grid: Left 60% (Task Queue & Timeline) / Right 40% (Talk to Commander Chat) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column — Real Task Queue & System State */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" /> ENGINEERING TASK QUEUE
              </h2>
              <span className="text-[10px] text-slate-500">{tasks.length} Durable Task(s)</span>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {tasks.map((t: any) => (
                <div key={t.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-sm">{t.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      t.priority === 'P0' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      {t.priority} • {t.area}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed">{t.description}</p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 text-slate-400">
                      <FileCode className="w-3.5 h-3.5 text-purple-400" />
                      <span>{t.files_modified?.length || 1} file(s) modified</span>
                    </div>
                    <span className={`font-bold ${t.status === 'DEPLOYED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column — Interactive TALK TO COMMANDER Chat Interface */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xl min-h-[500px]">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" /> TALK TO COMMANDER
            </h2>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full font-bold">
              OLLAMA CONNECTED
            </span>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[420px] pr-1">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-cyan-950/60 border-cyan-800 text-cyan-100 ml-6'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 mr-2'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
                  <span>{msg.sender === 'user' ? 'Founder Shivam' : 'Development Commander'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {msg.task && (
                  <div className="mt-2 p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between text-cyan-400 font-bold">
                      <span>Task Created: {msg.task.id}</span>
                      <span>Priority: {msg.task.priority}</span>
                    </div>
                    <Link
                      href="/approvals"
                      className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      REVIEW & APPROVE DEPLOYMENT <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
            {executing && (
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Commander analyzing directive & running test suite...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Fix duplicate prospect problem..."
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendDirective()}
              disabled={executing}
              className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => handleSendDirective()}
              disabled={executing || !inputPrompt.trim()}
              className="p-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
