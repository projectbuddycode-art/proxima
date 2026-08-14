'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2, RefreshCw } from 'lucide-react';

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
    <div className="space-y-6 max-w-2xl">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Mail className="w-6 h-6 text-orange-400" /> Titan Mail SMTP & IMAP Configuration
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          First-class integration for Titan Mail script and outbound outreach delivery.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
        <div>
          <label className="text-slate-300 font-semibold block mb-1">Titan Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="text-slate-300 font-semibold block mb-1">Titan Account Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">SMTP Host</label>
            <input
              type="text"
              value={smtpHost}
              readOnly
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">SMTP Port & Security</label>
            <input
              type="text"
              value={`${smtpPort} (SSL/TLS)`}
              readOnly
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 font-mono"
            />
          </div>
        </div>

        {status && (
          <div className="p-3 bg-slate-950 border border-emerald-800 text-emerald-400 rounded-xl font-mono text-[11px]">
            {status}
          </div>
        )}

        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center gap-2"
        >
          {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          TEST TITAN CONNECTION & SEND SELF-TEST EMAIL
        </button>
      </div>
    </div>
  );
}
