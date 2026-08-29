/**
 * PROXIMA Discovery Provider Interface & Router Contracts
 * Multi-source, fault-tolerant discovery architecture.
 */

export interface DiscoveryCandidate {
  source: string;
  sourceId?: string;
  businessName: string;
  category?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  website?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  contactRole?: string;
  sourceUrl?: string;
  evidence?: {
    claim: string;
    source: string;
    sourceUrl?: string;
    confidence: number;
  };
  rawSourceData?: unknown;
}

export interface DiscoveryProviderResult {
  provider: string;
  success: boolean;
  candidates: DiscoveryCandidate[];
  totalAvailable?: number;
  offset: number;
  batchSize: number;
  latencyMs?: number;
  error?: string;
  retryable?: boolean;
}

export interface DiscoveryProvider {
  name: string;

  /**
   * Discover businesses matching criteria.
   * Returns normalized candidates with source attribution — does NOT write directly to database.
   */
  discover(params: {
    industry: string;
    location: string;
    offset?: number;
    batchSize?: number;
  }): Promise<DiscoveryProviderResult>;

  /**
   * Check if provider is available, reachable, and operational.
   */
  isAvailable(): Promise<boolean>;
}

export interface MultiSourceDiscoveryResult {
  candidates: DiscoveryCandidate[];
  successfulProviders: string[];
  failedProviders: Array<{ provider: string; error: string; retryable: boolean }>;
  totalFound: number;
  deduplicatedCount: number;
  verifiedCount: number;
}
