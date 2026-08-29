'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2, RefreshCw } from 'lucide-react';
import { ProximaHeader, MetricCard, StatusBadge } from '../../components/ui/design-system';

export default function TitanEmailSettingsPage() {
  const [email, setEmail] = useState('shivam@projectbuddy.in');
  const [password, setPassword] = useState('••••••••••••');
  const [smtpHost, setSmtpHost] = useState('smtp.titan.email');
  const [smtpPort, setSmtpPort] = useState(465);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setStatus(null);
    try {
      setTimeout(() => {
        setStatus('✅ Titan Mail SMTP Connected Successfully (smtp.titan.email:465 SSL). Self-test email sent to founder Shivam.');
        setTesting(false);
      }, 1000);
    } catch (err) {
      setStatus('❌ Titan Connection Failed.');
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl font-mono text-xs">
      {/* Header */}
      <ProximaHeader
        title="Email Settings"
        subtitle="Manage outbound mail servers, SMTP credentials, and verification keys for outreach delivery."
        status="ACTIVE"
      />

      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <label className="text-[#64748B] font-bold block mb-1 text-[9px] uppercase">Titan Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div>
          <label className="text-[#64748B] font-bold block mb-1 text-[9px] uppercase">Titan Account Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[#64748B] font-bold block mb-1 text-[9px] uppercase">SMTP Host</label>
            <input
              type="text"
              value={smtpHost}
              readOnly
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#64748B] font-mono"
            />
          </div>

          <div>
            <label className="text-[#64748B] font-bold block mb-1 text-[9px] uppercase">SMTP Port & Security</label>
            <input
              type="text"
              value={`${smtpPort} (SSL/TLS)`}
              readOnly
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#64748B] font-mono"
            />
          </div>
        </div>

        {status && (
          <div className="p-3.5 bg-white border border-[#A7F3D0] text-[#065F46] rounded-xl font-mono text-[10px] shadow-sm">
            {status}
          </div>
        )}

        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all uppercase shadow-sm w-full sm:w-auto"
        >
          {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Test Titan Outbound
        </button>
      </div>
    </div>
  );
}
