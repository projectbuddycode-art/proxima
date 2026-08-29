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
import { StatusBadge, MetricCard, EmptyState, LoadingSpinner, ProximaHeader } from '../components/ui/design-system';

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
    <div className="space-y-6 font-mono text-xs">
      
      {/* Page Header */}
      <ProximaHeader
        title="AI Engineering Console"
        subtitle="Autonomous software maintenance loop: Audits codebase, runs regression validation tests, and prepares pull proposals."
        status="ACTIVE"
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status="SUCCESS" label={`WORKER: ${worker.status || 'RUNNING'}`} />
            <Link
              href="/approvals"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all uppercase"
            >
              <CheckSquare className="w-4 h-4" /> Approvals Center
            </Link>
          </div>
        }
      />

      {/* System Health Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="DATABASE TYPE" value={systemHealth.Database || 'LOCAL_JSON'} color="text-[#2563EB]" />
        <MetricCard label="LOCAL INFERENCE" value={systemHealth.Ollama || 'Ollama Connect'} color="text-[#0891B2]" />
        <MetricCard label="INTEGRITY SCORE" value={`${data?.codeHealthScore || 98}/100`} color="text-[#10B981]" />
        <MetricCard label="REGRESSION SUITE" value={data?.unitTestCoverage || '100% PASS'} color="text-[#2563EB]" />
      </div>

      {/* Main Grid: Left 60% Task list / Right 40% Chat Command panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Tasks */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h2 className="text-xs font-extrabold text-[#0F172A] uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#2563EB]" /> Active Engineering Queue
              </h2>
              <span className="text-[10px] text-[#64748B]">{tasks.length} task(s) active</span>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-center py-6 text-[#64748B]">No engineering tasks active.</p>
              ) : (
                tasks.map((t: any) => (
                  <div key={t.id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-[#0F172A] text-sm truncate max-w-[220px]">{t.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        t.priority === 'P0' ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]' : 'bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]'
                      }`}>
                        {t.priority} • {t.area}
                      </span>
                    </div>

                    <p className="text-[#64748B] leading-relaxed text-[11px]">{t.description}</p>

                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[10px] text-[#64748B]">
                      <div className="flex items-center gap-1">
                        <FileCode className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>{t.files_modified?.length || 1} file(s) modified</span>
                      </div>
                      <span className="font-bold text-[#10B981]">{t.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Chat terminal */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm min-h-[500px]">
          <div className="border-b border-[#F1F5F9] pb-3 flex items-center justify-between">
            <h2 className="text-xs font-black text-[#0F172A] uppercase flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#2563EB]" /> Talk to Commander
            </h2>
            <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] rounded-full font-bold text-[9px]">
              ONLINE
            </span>
          </div>

          {/* Chat message logs */}
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px] pr-1">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-[11px] space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF] ml-6'
                    : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#334155] mr-6'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] text-[#94A3B8] font-bold uppercase">
                  <span>{msg.sender === 'user' ? 'Founder Shivam' : 'Dev Commander'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {msg.task && (
                  <div className="mt-2 p-3 bg-white rounded-xl border border-[#E2E8F0] space-y-2 text-[10px]">
                    <div className="flex items-center justify-between text-[#2563EB] font-bold">
                      <span>Task: {msg.task.id}</span>
                      <span>Priority: {msg.task.priority}</span>
                    </div>
                    <Link
                      href="/approvals"
                      className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#10B981] hover:bg-[#059669] text-white font-extrabold rounded-lg text-xs transition-colors shadow-sm"
                    >
                      REVIEW RELEASE CANDIDATE <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
            {executing && (
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#64748B] flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
                <span>Running diagnostic analysis & tests...</span>
              </div>
            )}
          </div>

          {/* Input control */}
          <div className="pt-2 border-t border-[#E2E8F0] flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Audit campaign pipeline stability..."
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendDirective()}
              disabled={executing}
              className="flex-1 px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
            <button
              onClick={() => handleSendDirective()}
              disabled={executing || !inputPrompt.trim()}
              className="p-2.5 bg-[#1E3A8A] hover:bg-[#0F294A] text-white font-bold rounded-xl transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
