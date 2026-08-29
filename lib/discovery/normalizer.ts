/**
 * PROXIMA Discovery Normalizer
 * Normalizes raw discovery candidates into a canonical form for deduplication and storage.
 */

import { DiscoveryCandidate } from './providers/interface';
import { normalizeDomain, normalizeCompanyName } from '../domain/company';

export interface NormalizedCandidate extends DiscoveryCandidate {
  normalizedName: string;
  normalizedDomain?: string;
}

/**
 * Normalize a single discovery candidate
 */
export function normalizeCandidate(candidate: DiscoveryCandidate): NormalizedCandidate {
  return {
    ...candidate,
    businessName: candidate.businessName.trim(),
    normalizedName: normalizeCompanyName(candidate.businessName, candidate.city),
    normalizedDomain: normalizeDomain(candidate.website),
    city: (candidate.city || '').trim(),
    country: (candidate.country || '').trim(),
    phone: sanitizePhone(candidate.phone),
    email: sanitizeEmail(candidate.email),
    website: sanitizeUrl(candidate.website)
  };
}

/**
 * Normalize a batch of candidates
 */
export function normalizeCandidates(candidates: DiscoveryCandidate[]): NormalizedCandidate[] {
  return candidates
    .map(normalizeCandidate)
    .filter(c => c.normalizedName.length >= 2); // Filter out junk
}

function sanitizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/[^0-9+]/g, '');
  return digits.length >= 8 ? digits : undefined;
}

function sanitizeEmail(email?: string): string | undefined {
  if (!email) return undefined;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes('@') || !trimmed.includes('.')) return undefined;
  if (trimmed.includes('example.com') || trimmed.includes('test@')) return undefined;
  return trimmed;
}

function sanitizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (trimmed.includes('example.com') || trimmed.includes('openstreetmap.org')) return undefined;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}
