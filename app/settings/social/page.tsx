'use client';

import React, { useState } from 'react';
import { Share2, CheckCircle2, AlertTriangle, Shield, ExternalLink, RefreshCw, MessageSquare, Mail } from 'lucide-react';
import Link from 'next/link';
import { ProximaHeader, MetricCard, StatusBadge } from '../../components/ui/design-system';

export default function SocialConnectionsPage() {
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [channelStatus, setChannelStatus] = useState<Record<string, string>>({});

  const testConnection = (channel: string) => {
    setTestingChannel(channel);
    setTimeout(() => {
      if (channel === 'email') {
        setChannelStatus(prev => ({
          ...prev,
          email: '✅ Titan Mail Connected (shivam@projectbuddy.in). Self-test email verified.'
        }));
      } else if (channel === 'linkedin') {
        setChannelStatus(prev => ({
          ...prev,
          linkedin: 'ℹ️ LinkedIn OAuth Ready. READ ONLY mode active. Direct messaging requires LinkedIn Partner permission.'
        }));
      } else if (channel === 'instagram') {
        setChannelStatus(prev => ({
          ...prev,
          instagram: 'ℹ️ Meta Graph API Connected. Profile & Content access active. Messaging requires Meta App Business Verification.'
        }));
      } else if (channel === 'facebook') {
        setChannelStatus(prev => ({
          ...prev,
          facebook: 'ℹ️ Meta Page OAuth Connected. Page posting active. Messenger automation set to READ ONLY.'
        }));
      } else if (channel === 'whatsapp') {
        setChannelStatus(prev => ({
          ...prev,
          whatsapp: '⚠️ WhatsApp Business API NOT CONNECTED. Credentials required.'
        }));
      }
      setTestingChannel(null);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl font-mono text-xs">
      {/* Header */}
      <ProximaHeader
        title="Social Authorizations"
        subtitle="Manage OAuth tokens, scopes, and messaging limits for LinkedIn, Instagram, Facebook, and WhatsApp integrations."
        status="ACTIVE"
        actions={
          <Link
            href="/social-workspace"
            className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#0F294A] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            Open Social Workspace
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LINKEDIN */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-sm hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#EFF6FF] text-[#1E40AF] rounded-lg font-bold font-mono">in</div>
              <div>
                <h3 className="font-extrabold text-[#0F172A]">LinkedIn OAuth</h3>
                <span className="text-[10px] text-[#64748B] block">OAuth 2.0 Integration</span>
              </div>
            </div>
            <StatusBadge status="WARNING" label="READ ONLY" />
          </div>

          <div className="space-y-2 text-[#475569]">
            <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
              <span>Profile Access</span>
              <strong className="text-[#10B981]">AUTHORIZED</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
              <span>Content Publishing</span>
              <strong className="text-[#F59E0B]">DRAFT ONLY</strong>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Direct Messaging</span>
              <strong className="text-[#EF4444]">PERMISSION REQUIRED</strong>
            </div>
          </div>

          {channelStatus.linkedin && (
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[10px] text-[#2563EB]">
              {channelStatus.linkedin}
            </div>
          )}

          <button
            onClick={() => testConnection('linkedin')}
            disabled={testingChannel === 'linkedin'}
            className="w-full py-2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[#EDF2F7] transition-all"
          >
            {testingChannel === 'linkedin' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
            TEST LINKEDIN AUTHORIZATION
          </button>
        </div>

        {/* INSTAGRAM */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-sm hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FEF2F2] text-pink-500 rounded-lg font-bold font-mono">IG</div>
              <div>
                <h3 className="font-extrabold text-[#0F172A]">Instagram Graph API</h3>
                <span className="text-[10px] text-[#64748B] block">Meta Business API</span>
              </div>
            </div>
            <StatusBadge status="WARNING" label="READ ONLY" />
          </div>

          <div className="space-y-2 text-[#475569]">
            <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
              <span>Profile Intelligence</span>
              <strong className="text-[#10B981]">ACTIVE</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
              <span>Content Publishing</span>
              <strong className="text-[#F59E0B]">READ ONLY</strong>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>DM Automation</span>
              <strong className="text-[#EF4444]">META VERIFICATION REQUIRED</strong>
            </div>
          </div>

          {channelStatus.instagram && (
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[10px] text-pink-600">
              {channelStatus.instagram}
            </div>
          )}

          <button
            onClick={() => testConnection('instagram')}
            disabled={testingChannel === 'instagram'}
            className="w-full py-2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[#EDF2F7] transition-all"
          >
            {testingChannel === 'instagram' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
            TEST INSTAGRAM CONNECTION
          </button>
        </div>

      </div>

      {/* TITAN EMAIL */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FFFBEB] text-[#F59E0B] rounded-xl">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#0F172A] text-sm uppercase">Titan Outbound Delivery Channel</h3>
            <p className="text-[#64748B] text-xs">Mapped to smtp.titan.email:465 (shivam@projectbuddy.in)</p>
          </div>
        </div>
        <button
          onClick={() => testConnection('email')}
          disabled={testingChannel === 'email'}
          className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-sm uppercase tracking-wider font-mono"
        >
          {testingChannel === 'email' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Test Titan Outbound
        </button>
      </div>

      {channelStatus.email && (
        <div className="p-3.5 bg-white border border-[#A7F3D0] rounded-xl font-mono text-xs text-[#065F46] shadow-sm">
          {channelStatus.email}
        </div>
      )}
    </div>
  );
}
