'use client';

import React, { useState } from 'react';
import { Instagram, Linkedin, Facebook, ShieldAlert, CheckCircle2, Lock, Eye, Send } from 'lucide-react';
import { InstagramAdapter, FacebookAdapter } from '@/lib/channels/social';

export default function SocialIntelligenceWorkspace() {
  const igStatus = InstagramAdapter.getStatus();
  const fbStatus = FacebookAdapter.getStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Eye className="w-6 h-6 text-purple-400" /> Split-Screen Social Intelligence Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Public post inspection, business signal extraction, and handle cross-verification with explicit connection status gates.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-950/60 border border-purple-800 text-purple-300 font-bold text-xs rounded-full font-mono">
          <Lock className="w-3.5 h-3.5 text-purple-400" /> Public Signal Inspection Active
        </div>
      </div>

      {/* Split-Screen Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Screen: Instagram Workspace */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Instagram className="w-5 h-5 text-pink-400" /> Instagram Intelligence Workspace
            </div>
            <span className="px-2.5 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-mono font-bold rounded-full">
              {igStatus.status}
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Allowed Permissions:</span>
              <div className="flex gap-1">
                <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded">READ</span>
                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">DRAFT</span>
                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-500 line-through">SEND</span>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">{igStatus.message}</p>
          </div>

          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white text-xs">Recent Inspected Business Posts</h4>
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-mono text-pink-400 font-bold">
                <span>@bangalore_lighting_showroom</span>
                <span>3 days ago</span>
              </div>
              <p className="text-slate-300">"Showcase of 50 new architectural LED lighting designs."</p>
              <p className="text-orange-400 text-[11px] font-semibold">Signal: Large catalogue expansion without instant web RFQ flow.</p>
            </div>
          </div>
        </div>

        {/* Right Screen: LinkedIn & Facebook Workspace */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Linkedin className="w-5 h-5 text-blue-400" /> LinkedIn & Facebook Workspace
            </div>
            <span className="px-2.5 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-mono font-bold rounded-full">
              {fbStatus.status}
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Allowed Permissions:</span>
              <div className="flex gap-1">
                <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded">READ</span>
                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">DRAFT</span>
                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-500 line-through">POST</span>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">{fbStatus.message}</p>
          </div>

          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white text-xs">Recent Inspected Company Announcements</h4>
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-mono text-blue-400 font-bold">
                <span>Bangalore Luxe Architectural Lighting</span>
                <span>5 days ago</span>
              </div>
              <p className="text-slate-300">"Announced new 5,000 sq ft showroom opening in Indiranagar Bangalore."</p>
              <p className="text-emerald-400 text-[11px] font-semibold">Signal: Hiring 2 BD Executives & expanding commercial division.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
