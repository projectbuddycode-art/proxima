'use client';

import React, { useState } from 'react';
import { Instagram, Linkedin, Facebook, ShieldAlert, CheckCircle2, Lock, Eye, Send } from 'lucide-react';
import { InstagramAdapter, FacebookAdapter } from '@/lib/channels/social';
import { ProximaHeader, MetricCard, StatusBadge } from '../components/ui/design-system';

export default function SocialIntelligenceWorkspace() {
  const igStatus = InstagramAdapter.getStatus();
  const fbStatus = FacebookAdapter.getStatus();

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <ProximaHeader
        title="Market Intelligence Panel"
        subtitle="Passive inspection of business announcements, signal extraction pipelines, and multi-channel cross-validation status."
        status="ACTIVE"
      />

      {/* Split-Screen Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Screen: Instagram Workspace */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div className="flex items-center gap-2 font-extrabold text-[#0F172A] text-sm uppercase">
              <Instagram className="w-5 h-5 text-pink-500" /> Instagram Intelligence
            </div>
            <StatusBadge status="PENDING" label={igStatus.status} />
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-[#64748B] font-bold">Allowed Permissions:</span>
              <div className="flex gap-1 text-[9px] font-bold">
                <span className="px-1.5 py-0.5 bg-[#ECFDF5] text-[#065F46] rounded border border-[#A7F3D0]">READ</span>
                <span className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#1E40AF] rounded border border-[#BFDBFE]">DRAFT</span>
                <span className="px-1.5 py-0.5 bg-[#F8FAFC] text-[#94A3B8] rounded border border-[#E2E8F0] line-through">SEND</span>
              </div>
            </div>
            <p className="text-[#64748B] leading-relaxed text-[11px]">{igStatus.message}</p>
          </div>

          <div className="space-y-3 text-xs">
            <h4 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider">Recent Inspected Business Posts</h4>
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1.5">
              <div className="flex items-center justify-between font-mono text-pink-500 font-extrabold">
                <span>@bangalore_lighting_showroom</span>
                <span>3 days ago</span>
              </div>
              <p className="text-[#475569]">"Showcase of 50 new architectural LED lighting designs."</p>
              <p className="text-[#F59E0B] text-[11px] font-bold">Signal: Large catalogue expansion without instant web RFQ flow.</p>
            </div>
          </div>
        </div>

        {/* Right Screen: LinkedIn & Facebook Workspace */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div className="flex items-center gap-2 font-extrabold text-[#0F172A] text-sm uppercase">
              <Linkedin className="w-5 h-5 text-blue-500" /> LinkedIn & Facebook
            </div>
            <StatusBadge status="PENDING" label={fbStatus.status} />
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-[#64748B] font-bold">Allowed Permissions:</span>
              <div className="flex gap-1 text-[9px] font-bold">
                <span className="px-1.5 py-0.5 bg-[#ECFDF5] text-[#065F46] rounded border border-[#A7F3D0]">READ</span>
                <span className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#1E40AF] rounded border border-[#BFDBFE]">DRAFT</span>
                <span className="px-1.5 py-0.5 bg-[#F8FAFC] text-[#94A3B8] rounded border border-[#E2E8F0] line-through">POST</span>
              </div>
            </div>
            <p className="text-[#64748B] leading-relaxed text-[11px]">{fbStatus.message}</p>
          </div>

          <div className="space-y-3 text-xs">
            <h4 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider">Recent Inspected Company Announcements</h4>
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1.5">
              <div className="flex items-center justify-between font-mono text-[#2563EB] font-extrabold">
                <span>Bangalore Luxe Architectural Lighting</span>
                <span>5 days ago</span>
              </div>
              <p className="text-[#475569]">"Announced new 5,000 sq ft showroom opening in Indiranagar Bangalore."</p>
              <p className="text-[#10B981] text-[11px] font-bold">Signal: Hiring 2 BD Executives & expanding commercial division.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
