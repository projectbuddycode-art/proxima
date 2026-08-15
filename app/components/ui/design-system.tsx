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
    ONLINE: 'bg-emerald-500 shadow-emerald-500/50',
    ACTIVE: 'bg-cyan-500 shadow-cyan-500/50',
    DISCOVERING: 'bg-blue-500 animate-pulse shadow-blue-500/50',
    PAUSED: 'bg-amber-500 shadow-amber-500/50',
    OFFLINE: 'bg-slate-500 shadow-slate-500/50'
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-[#1C2541]/80 rounded-2xl border border-slate-800 shadow-xl">
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-cyan-400 tracking-wider uppercase">
          <span className={`w-2 h-2 rounded-full shadow-lg ${statusColors[status]}`} />
          <span>PROXIMA OS</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300 font-semibold">{badgeText}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-mono">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">{subtitle}</p>}
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
    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="w-4 h-4 text-cyan-400" />}
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight uppercase font-mono">{title}</h2>
          {description && <p className="text-[11px] text-slate-400">{description}</p>}
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
  color = 'text-white'
}: {
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800/80 flex flex-col justify-between space-y-1">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">{label}</span>
      <div className={`text-lg sm:text-xl font-black font-mono tracking-tight ${color}`}>{value}</div>
      {subtext && <span className="text-[10px] text-slate-500 font-mono">{subtext}</span>}
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
    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-950/80 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300">
      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
      <span>{source}</span>
      <span className="text-slate-600">|</span>
      <span className="text-emerald-400 font-semibold">{confidence}% Conf</span>
      <span className="text-slate-600">|</span>
      <span className="text-slate-400">{verifiedDate}</span>
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
    SUCCESS: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
    WARNING: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
    ERROR: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
    INFO: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80',
    PENDING: 'bg-slate-900 text-slate-300 border-slate-800'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono uppercase tracking-wider ${styles[status]}`}>
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
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-3">
      <div className="p-3 bg-slate-800/80 rounded-2xl text-cyan-400">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-white font-mono">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function LoadingSpinner({ label = 'Processing real pipeline execution...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center p-8 text-slate-400 font-mono text-xs gap-3">
      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBanner({ title, message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl flex items-start justify-between gap-3 text-xs font-mono text-rose-300">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div>
          {title && <strong className="block text-rose-200">{title}</strong>}
          <p>{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 bg-rose-900/80 hover:bg-rose-800 text-white rounded-lg text-[11px] font-semibold transition-colors shrink-0"
        >
          RETRY
        </button>
      )}
    </div>
  );
}
