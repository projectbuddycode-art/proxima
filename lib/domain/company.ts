/**
 * PROXIMA Company Domain Model
 */

export interface Company {
  id: string;
  name: string;
  website?: string;
  domain?: string;
  industry?: string;
  location?: string;
  company_summary?: string;
  decision_makers_json?: unknown;
  products_services_json?: unknown;
  source?: string;
  source_id?: string;
  normalized_name?: string;
  normalized_domain?: string;
  created_at: string;
}

export function generateCompanyId(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Normalize domain name from URL
 */
export function normalizeDomain(url?: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  let clean = url.trim().toLowerCase();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  try {
    const parsed = new URL(clean);
    let hostname = parsed.hostname.replace(/^www\./, '');
    if (hostname === 'localhost' || hostname === 'example.com' || hostname.includes('openstreetmap.org')) {
      return undefined;
    }
    return hostname;
  } catch {
    return undefined;
  }
}

/**
 * Normalize company name for dedup matching
 */
export function normalizeCompanyName(name: string, city?: string): string {
  if (!name) return '';
  let clean = name.trim().toLowerCase();
  clean = clean.split(',')[0].trim();
  clean = clean
    .replace(/\b(pvt|ltd|private|limited|inc|corp|llp|co|company|enterprises|store|shop)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean;
}
