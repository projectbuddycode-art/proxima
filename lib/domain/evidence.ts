import crypto from 'crypto';

/**
 * PROXIMA Unified Truth and Evidence Model
 * Every claim, signal, audit, and execution record is traceable to concrete evidence.
 */

export type EntityType =
  | 'prospect'
  | 'company'
  | 'signal'
  | 'agent_run'
  | 'deployment'
  | 'research'
  | 'system_health';

export interface EvidenceRecord {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  claim_type: string;
  source: string;
  source_url?: string | null;
  observed_at: string; // ISO string
  expires_at?: string | null; // ISO string
  confidence: number; // 0 - 100
  freshness_score: number; // 0 - 100 with deterministic decay
  payload?: Record<string, any> | string | null;
  content_hash: string;
  created_at: string;
}

/**
 * Deterministically calculates evidence freshness decaying over time.
 * Freshness = 100 * exp(-lambda * daysElapsed)
 * Half-life default = 45 days (after 45 days freshness is 50%, after 90 days ~25%).
 */
export function calculateEvidenceFreshness(observedAt: string, halfLifeDays = 45): number {
  if (!observedAt) return 0;
  const observedTime = new Date(observedAt).getTime();
  if (isNaN(observedTime)) return 0;

  const now = Date.now();
  const elapsedMs = Math.max(0, now - observedTime);
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

  const lambda = Math.LN2 / halfLifeDays;
  const freshness = 100 * Math.exp(-lambda * elapsedDays);

  return Math.max(0, Math.min(100, Math.round(freshness)));
}

/**
 * Determines whether an evidence record is stale.
 * Stale if freshness < 30 or observed > 90 days ago or expired past expires_at.
 */
export function isEvidenceStale(record: { observed_at: string; expires_at?: string | null; freshness_score?: number }): boolean {
  if (record.expires_at && new Date(record.expires_at).getTime() <= Date.now()) {
    return true;
  }
  const freshness = record.freshness_score !== undefined
    ? record.freshness_score
    : calculateEvidenceFreshness(record.observed_at);

  if (freshness < 30) return true;

  const ageDays = (Date.now() - new Date(record.observed_at).getTime()) / (1000 * 60 * 60 * 24);
  return ageDays > 90;
}

/**
 * Computes deterministic SHA-256 hash for content validation and deduplication
 */
export function generateEvidenceContentHash(entityType: string, entityId: string, claimType: string, source: string, payload: any): string {
  const normalizedPayload = typeof payload === 'object' ? JSON.stringify(payload) : String(payload || '');
  const dataToHash = `${entityType}:${entityId}:${claimType}:${source}:${normalizedPayload}`;
  return crypto.createHash('sha256').update(dataToHash).digest('hex');
}

/**
 * Strict canonical URL and domain normalization
 */
export function normalizeCanonicalUrl(rawUrl?: string): { url: string; domain: string } | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let clean = rawUrl.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }

  try {
    const parsed = new URL(clean);
    let hostname = parsed.hostname.toLowerCase().replace(/^(www|m|mobile)\./, '');

    // Discard non-commercial / invalid domains
    if (!hostname || hostname === 'localhost' || hostname === 'example.com' || hostname.includes('openstreetmap.org')) {
      return null;
    }

    const cleanUrl = `${parsed.protocol}//${hostname}${parsed.pathname.replace(/\/+$/, '') || '/'}`;
    return { url: cleanUrl, domain: hostname };
  } catch {
    return null;
  }
}
