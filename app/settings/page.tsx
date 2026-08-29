'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Bot, ShieldCheck, CheckCircle2, RefreshCw, Server, AlertCircle, Key, Cpu, Zap } from 'lucide-react';
import { ProximaHeader, StatusBadge } from '../components/ui/design-system';

export default function SettingsPage() {
  const [setup, setSetup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Claude input states
  const [claudeKey, setClaudeKey] = useState('');
  const [claudeModel, setClaudeModel] = useState('claude-3-5-sonnet-20241022');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/setup');
      const data = await res.json();
      setSetup(data);
      if (data.claude) {
        setClaudeModel(data.claude.configuredModel || 'claude-3-5-sonnet-20241022');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSaveClaude = async () => {
    if (!claudeKey.trim()) return;
    setSaving(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_provider_credentials',
          provider: 'CLAUDE',
          apiKey: claudeKey,
          model: claudeModel
        })
      });
      const data = await res.json();
      if (data.success) {
        setClaudeKey('');
        setTestResult({ success: true, message: 'Claude API key saved and validated successfully.' });
      } else {
        setTestResult({ success: false, message: data.message || 'Key validation failed.' });
      }
      await fetchStatus();
    } catch (err: any) {
      setTestResult({ success: false, message: 'Failed to connect to backend server endpoint.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDisableClaude = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disable_provider',
          provider: 'CLAUDE'
        })
      });
      setClaudeKey('');
      setTestResult({ success: true, message: 'Claude provider successfully disabled. Falling back to Ollama.' });
      await fetchStatus();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestClaude = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_provider_credentials',
          provider: 'CLAUDE'
        })
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Validation test succeeded.' : 'Validation test failed.')
      });
    } catch (err: any) {
      setTestResult({ success: false, message: 'Failed to execute credentials validation test.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-mono text-xs">
      {/* Header */}
      <ProximaHeader
        title="Settings & Diagnostics"
        subtitle="Manage cloud and local LLM runtime parameters, database configurations, and active safeguards."
        status="ACTIVE"
        actions={
          <button
            onClick={fetchStatus}
            className="px-3.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#EDF2F7] text-[#64748B] hover:text-[#0F172A] font-bold text-xs rounded-xl flex items-center gap-1 transition-all duration-200"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-diagnose
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#64748B] gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
          <span>Synchronizing settings parameters...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Claude Provider Settings Section */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-[#CBD5E1]">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 className="text-xs font-black text-[#0F172A] flex items-center gap-2 uppercase tracking-wider">
                <Zap className="w-5 h-5 text-[#D97706]" /> Claude Cloud Reasoning Provider
              </h3>
              <StatusBadge
                status={setup?.claude?.status === 'AVAILABLE' ? 'SUCCESS' : setup?.claude?.status === 'DISABLED' ? 'WARNING' : 'ERROR'}
                label={setup?.claude?.status || 'NOT_CONFIGURED'}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-[#64748B] flex items-center gap-1">
                  <Key className="w-3 h-3 text-[#64748B]" /> Anthropic API Key
                </label>
                <input
                  type="password"
                  placeholder={setup?.claude?.status === 'NOT_CONFIGURED' ? 'Paste your sk-ant- api key...' : '••••••••••••••••••••••••'}
                  value={claudeKey}
                  onChange={(e) => setClaudeKey(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-mono text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6] transition-all"
                />
                <span className="text-[9px] text-[#64748B] block font-sans">
                  Active Fingerprint: <code className="font-mono text-[#475569]">{setup?.claude?.maskedKey || 'None'}</code>
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-[#64748B] flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#64748B]" /> Configured Claude Model
                </label>
                <select
                  value={claudeModel}
                  onChange={(e) => setClaudeModel(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-mono text-[#0F172A] focus:outline-none focus:border-[#3B82F6] transition-all"
                >
                  <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022</option>
                  <option value="claude-3-5-haiku-20241022">claude-3-5-haiku-20241022</option>
                </select>
              </div>
            </div>

            {/* Capabilities Info */}
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1.5">
              <span className="text-[#64748B] text-[9px] uppercase font-black block">Capabilities Detected</span>
              <div className="flex flex-wrap gap-2">
                {setup?.claude?.capabilities?.map((cap: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] rounded-md font-sans text-[9px] font-bold">
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* Test Results Banner */}
            {testResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${testResult.success ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' : 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'}`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={handleSaveClaude}
                disabled={saving || !claudeKey}
                className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Securely'}
              </button>

              {setup?.claude?.status !== 'NOT_CONFIGURED' && (
                <>
                  <button
                    onClick={handleTestClaude}
                    disabled={testing}
                    className="px-4 py-2 bg-[#F8FAFC] hover:bg-[#EDF2F7] border border-[#E2E8F0] text-[#0F172A] font-extrabold rounded-xl transition-all"
                  >
                    {testing ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={handleDisableClaude}
                    className="px-4 py-2 bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#991B1B] font-extrabold rounded-xl transition-all"
                  >
                    Disable Provider
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Core AI Model: Local Ollama Fallback Section */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-sm hover:border-[#CBD5E1] transition-all duration-300">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 className="text-xs font-black text-[#0F172A] flex items-center gap-2 uppercase tracking-wider">
                <Bot className="w-5 h-5 text-[#2563EB]" /> Core AI Model: Local Ollama Fallback
              </h3>
              <StatusBadge status="SUCCESS" label="Online Fallback Ready" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block mb-1 text-[9px] uppercase font-bold">API HOST</span>
                <code className="text-[#0F172A] font-mono">{setup?.ollama_url || 'http://127.0.0.1:11434'}</code>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block mb-1 text-[9px] uppercase font-bold">LLM MODEL</span>
                <code className="text-[#2563EB] font-mono">{setup?.ollama_model || 'qwen2.5-coder:3b'}</code>
              </div>
            </div>
          </div>

          {/* Grounded Knowledge Base Status */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-[#0F172A] flex items-center gap-2 uppercase tracking-wider border-b border-[#F1F5F9] pb-3">
              <Server className="w-5 h-5 text-[#2563EB]" /> Grounded Knowledge Base Status
            </h3>
            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-[#475569]">GTM Playbook Markdown Rules</span>
              <StatusBadge status="SUCCESS" label="Loaded & Active" />
            </div>
          </div>

          {/* Safety Guardrails */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-[#0F172A] flex items-center gap-2 uppercase tracking-wider border-b border-[#F1F5F9] pb-3">
              <ShieldCheck className="w-5 h-5 text-[#10B981]" /> Outbound Protection Guardrails
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block mb-1 text-[9px] uppercase font-bold">Daily Limit</span>
                <strong className="text-[#0F172A]">50 messages / day</strong>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block mb-1 text-[9px] uppercase font-bold"> Takeover Trigger</span>
                <strong className="text-[#EF4444]">IMMEDIATE ON INTEREST</strong>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block mb-1 text-[9px] uppercase font-bold">API Invoicing</span>
                <strong className="text-[#10B981]">PAY-PER-USE SECURITY</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
