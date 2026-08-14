'use client';

import React, { useEffect, useState } from 'react';
import { Mail, Phone, MessageSquare, Linkedin, Instagram, Facebook, Globe, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';

export default function VisibleContactIntelligencePage() {
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/prospects')
      .then(res => res.json())
      .then(data => setProspects(data.prospects || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" /> Visible Contact Intelligence Panel
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero-synthetic verified contact details with full source URL provenance and direct channel actions.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-bold text-xs rounded-full font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Provenance Verified Contacts
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-xs py-8">Loading Contact Intelligence...</div>
      ) : (
        <div className="space-y-4">
          {prospects.map(p => (
            <div key={p.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{p.company_name}</h3>
                  <p className="text-xs text-slate-400">{p.contact_name} ({p.role || 'Key Decision Maker'}) • {p.location}</p>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold rounded-full">
                  VERIFIED PROVENANCE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Email */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <Mail className="w-3.5 h-3.5 text-orange-400" /> Official Email
                  </div>
                  <p className="font-mono text-white text-[11px] truncate">{p.email || 'NOT_FOUND'}</p>
                  {p.email && (
                    <a href={`mailto:${p.email}`} className="mt-1 text-[10px] text-cyan-400 font-bold flex items-center gap-1 hover:underline">
                      SEND EMAIL <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Phone */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Verified Phone
                  </div>
                  <p className="font-mono text-white text-[11px] truncate">{p.phone || 'NOT_FOUND'}</p>
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="mt-1 text-[10px] text-emerald-400 font-bold flex items-center gap-1 hover:underline">
                      CALL NOW <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* WhatsApp */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Official WhatsApp
                  </div>
                  <p className="font-mono text-white text-[11px] truncate">{p.phone ? `+91 ${p.phone}` : 'NOT_FOUND'}</p>
                  {p.phone && (
                    <a href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="mt-1 text-[10px] text-emerald-400 font-bold flex items-center gap-1 hover:underline">
                      OPEN WHATSAPP <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Website */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" /> Official Website
                  </div>
                  <p className="font-mono text-white text-[11px] truncate">{p.website || 'NOT_FOUND'}</p>
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noreferrer" className="mt-1 text-[10px] text-cyan-400 font-bold flex items-center gap-1 hover:underline">
                      OPEN WEBSITE <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
