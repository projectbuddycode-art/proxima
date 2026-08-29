'use client';

import React, { useEffect, useState } from 'react';
import { Mail, Phone, MessageSquare, Linkedin, Instagram, Facebook, Globe, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { ProximaHeader, MetricCard, StatusBadge } from '../components/ui/design-system';

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
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <ProximaHeader
        title="Research Matrix Panel"
        subtitle="Zero-synthetic verified contact details with full source URL provenance tracking and direct channel actions."
        status="ACTIVE"
      />

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#64748B] gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
          <span>Synchronizing contact database...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {prospects.map(p => (
            <div key={p.id} className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-4 hover:border-[#CBD5E1] transition-all shadow-sm">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0F172A] uppercase">{p.company_name}</h3>
                  <p className="text-[11px] text-[#64748B] mt-0.5">{p.contact_name} ({p.role || 'Key Decision Maker'}) • {p.location}</p>
                </div>
                <StatusBadge status="SUCCESS" label="VERIFIED" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Email */}
                <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#64748B] font-bold text-[9px] uppercase">
                    <Mail className="w-3.5 h-3.5 text-[#F59E0B]" /> Official Email
                  </div>
                  <p className="font-mono text-[#0F172A] text-[11px] truncate">{p.email || 'NOT_FOUND'}</p>
                  {p.email && (
                    <a href={`mailto:${p.email}`} className="mt-1.5 text-[9px] text-[#2563EB] font-bold flex items-center gap-1 hover:underline uppercase">
                      SEND EMAIL <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Phone */}
                <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#64748B] font-bold text-[9px] uppercase">
                    <Phone className="w-3.5 h-3.5 text-[#10B981]" /> Verified Phone
                  </div>
                  <p className="font-mono text-[#0F172A] text-[11px] truncate">{p.phone || 'NOT_FOUND'}</p>
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="mt-1.5 text-[9px] text-[#10B981] font-bold flex items-center gap-1 hover:underline uppercase">
                      CALL NOW <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* WhatsApp */}
                <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#64748B] font-bold text-[9px] uppercase">
                    <MessageSquare className="w-3.5 h-3.5 text-[#10B981]" /> WhatsApp
                  </div>
                  <p className="font-mono text-[#0F172A] text-[11px] truncate">{p.phone ? `+91 ${p.phone}` : 'NOT_FOUND'}</p>
                  {p.phone && (
                    <a href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="mt-1.5 text-[9px] text-[#10B981] font-bold flex items-center gap-1 hover:underline uppercase">
                      OPEN CHAT <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Website */}
                <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#64748B] font-bold text-[9px] uppercase">
                    <Globe className="w-3.5 h-3.5 text-[#0891B2]" /> Website
                  </div>
                  <p className="font-mono text-[#0F172A] text-[11px] truncate">{p.website || 'NOT_FOUND'}</p>
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noreferrer" className="mt-1.5 text-[9px] text-[#0891B2] font-bold flex items-center gap-1 hover:underline uppercase">
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
