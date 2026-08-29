import React from 'react';
import { ShieldCheck, Activity, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export function ProximaHeader({
  title,
  subtitle,
  status = 'ONLINE',
  badgeText = 'REAL MODE',
  actions
}: {
  title: string;
  subtitle?: string;
  status?: 'ONLINE' | 'ACTIVE' | 'DISCOVERING' | 'PAUSED' | 'OFFLINE';
  badgeText?: string;
  actions?: React.ReactNode;
}) {
  const statusColors = {
    ONLINE: 'bg-[#10B981] shadow-[#10B981]/50',
    ACTIVE: 'bg-[#2563EB] shadow-[#2563EB]/50',
    DISCOVERING: 'bg-[#0891B2] animate-pulse shadow-[#0891B2]/50',
    PAUSED: 'bg-[#F59E0B] shadow-[#F59E0B]/50',
    OFFLINE: 'bg-[#64748B] shadow-[#64748B]/50'
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm panel-enter">
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-[#2563EB] tracking-widest uppercase">
          <span className={`w-2 h-2 rounded-full shadow-md ${statusColors[status]}`} />
          <span>PROXIMA SYSTEM</span>
          <span className="text-[#CBD5E1]">•</span>
          <span className="text-[#64748B] font-semibold">{badgeText}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight font-mono uppercase">{title}</h1>
        {subtitle && <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  icon: Icon,
  action
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4 font-mono">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[#1E3A8A]" />}
        <div>
          <h2 className="text-xs font-extrabold text-[#0F172A] tracking-wider uppercase">{title}</h2>
          {description && <p className="text-[10px] text-[#64748B] mt-0.5">{description}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  subtext,
  color = 'text-[#0F172A]'
}: {
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between space-y-1 hover:border-[#CBD5E1] transition-all">
      <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest font-mono">{label}</span>
      <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${color}`}>{value}</div>
      {subtext && <span className="text-[9px] text-[#94A3B8] font-mono">{subtext}</span>}
    </div>
  );
}

export function EvidenceBadge({
  source,
  confidence = 95,
  verifiedDate = 'Today'
}: {
  source: string;
  confidence?: number;
  verifiedDate?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] font-mono text-[10px] text-[#475569]">
      <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
      <span>{source}</span>
      <span className="text-[#E2E8F0]">|</span>
      <span className="text-[#10B981] font-bold">{confidence}% Confirmed</span>
      <span className="text-[#E2E8F0]">|</span>
      <span className="text-[#64748B]">{verifiedDate}</span>
    </div>
  );
}

export function StatusBadge({
  status,
  label
}: {
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO' | 'PENDING';
  label: string;
}) {
  const styles = {
    SUCCESS: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
    WARNING: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    ERROR: 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]',
    INFO: 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]',
    PENDING: 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border font-mono uppercase tracking-widest ${styles[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Activity,
  action
}: {
  title: string;
  description: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-[#E2E8F0] space-y-4 shadow-sm">
      <div className="p-3 bg-[#F0F5FF] rounded-xl text-[#2563EB]">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-xs font-bold text-[#0F172A] font-mono uppercase tracking-wider">{title}</h3>
        <p className="text-[11px] text-[#64748B] max-w-sm leading-relaxed mt-1">{description}</p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

export function LoadingSpinner({ label = 'Executing operational workflow...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center p-8 text-[#64748B] font-mono text-xs gap-3">
      <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBanner({ title, message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl flex items-start justify-between gap-3 text-xs font-mono text-[#991B1B]">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
        <div>
          {title && <strong className="block text-[#7F1D1D] uppercase font-bold tracking-wider">{title}</strong>}
          <p className="mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-lg text-[10px] font-bold tracking-wider transition-colors shrink-0"
        >
          RETRY
        </button>
      )}
    </div>
  );
}
