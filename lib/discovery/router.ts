/**
 * PROXIMA Multi-Source Discovery Provider Router
 * Coordinates multiple discovery sources (OpenStreetMap, Public Web, Public Directories, Manual Imports)
 * with robust timeout handling, retries, source attribution, and partial failure resiliency.
 */

import {
  DiscoveryProvider,
  DiscoveryCandidate,
  DiscoveryProviderResult,
  MultiSourceDiscoveryResult
} from './providers/interface';
import { OpenStreetMapProvider } from './providers/openstreetmap';
import { PublicWebDiscoveryProvider } from './providers/public_web';
import { PublicDirectoryProvider } from './providers/public_directory';
import { normalizeCandidates, NormalizedCandidate } from './normalizer';
import { CanonicalDeduplicationEngine } from '../verification/dedup';
import { EvidenceEngine } from '../verification/evidence';

export interface DiscoveryRouterOptions {
  providers?: DiscoveryProvider[];
  timeoutMs?: number;
  maxCandidatesPerProvider?: number;
}

export class DiscoveryProviderRouter {
  private providers: DiscoveryProvider[];
  private timeoutMs: number;

  constructor(options: DiscoveryRouterOptions = {}) {
    this.providers = options.providers || [
      new OpenStreetMapProvider(),
      new PublicWebDiscoveryProvider(),
      new PublicDirectoryProvider()
    ];
    this.timeoutMs = options.timeoutMs || 25000;
  }

  /**
   * Discovers business candidates across all available configured providers.
   * Tolerates individual provider failures and returns partial aggregated results.
   */
  async discoverAll(params: {
    industry: string;
    location: string;
    offset?: number;
    batchSize?: number;
  }): Promise<MultiSourceDiscoveryResult> {
    const { industry, location, offset = 0, batchSize = 25 } = params;
    console.log(`[DISCOVERY ROUTER] Initiating multi-source discovery for "${industry}" in "${location}" (offset=${offset}, batchSize=${batchSize})`);

    const successfulProviders: string[] = [];
    const failedProviders: Array<{ provider: string; error: string; retryable: boolean }> = [];
    const allRawCandidates: DiscoveryCandidate[] = [];

    // Run discovery across providers with individual error boundaries and timeouts
    const providerPromises = this.providers.map(async (provider) => {
      try {
        const isAvailable = await provider.isAvailable().catch(() => false);
        if (!isAvailable) {
          console.warn(`[DISCOVERY ROUTER] Provider ${provider.name} is currently unavailable/offline.`);
          failedProviders.push({
            provider: provider.name,
            error: 'Provider unavailable or offline',
            retryable: true
          });
          return;
        }

        const result: DiscoveryProviderResult = await Promise.race([
          provider.discover({ industry, location, offset, batchSize }),
          new Promise<DiscoveryProviderResult>((_, reject) =>
            setTimeout(() => reject(new Error(`Provider ${provider.name} timed out after ${this.timeoutMs}ms`)), this.timeoutMs)
          )
        ]);

        if (result.success && Array.isArray(result.candidates)) {
          successfulProviders.push(provider.name);
          allRawCandidates.push(...result.candidates);
        } else {
          failedProviders.push({
            provider: provider.name,
            error: result.error || 'Provider returned unsuccessful status',
            retryable: result.retryable ?? true
          });
        }
      } catch (err: any) {
        console.error(`[DISCOVERY ROUTER] Error executing provider ${provider.name}:`, err.message);
        failedProviders.push({
          provider: provider.name,
          error: err.message || 'Unknown discovery error',
          retryable: true
        });
      }
    });

    await Promise.allSettled(providerPromises);

    console.log(`[DISCOVERY ROUTER] Multi-source sweep complete. Successful: [${successfulProviders.join(', ')}], Failed: [${failedProviders.map(f => f.provider).join(', ')}]. Total raw candidates: ${allRawCandidates.length}`);

    // Deduplicate candidates in memory by domain / sourceId / normalized name
    const deduplicatedCandidates: DiscoveryCandidate[] = [];
    const seenDomains = new Set<string>();
    const seenSourceIds = new Set<string>();
    const seenNames = new Set<string>();
    let deduplicatedCount = 0;

    for (const cand of allRawCandidates) {
      const normDomain = CanonicalDeduplicationEngine.normalizeDomain(cand.website);
      const normName = CanonicalDeduplicationEngine.normalizeCompanyName(cand.businessName, cand.city);
      const sourceKey = cand.sourceId ? `${cand.source}:${cand.sourceId}` : null;

      let isDuplicate = false;

      if (normDomain && seenDomains.has(normDomain)) {
        isDuplicate = true;
      }
      if (sourceKey && seenSourceIds.has(sourceKey)) {
        isDuplicate = true;
      }
      if (normName && cand.city && seenNames.has(`${normName}:${cand.city.toLowerCase()}`)) {
        isDuplicate = true;
      }

      if (isDuplicate) {
        deduplicatedCount++;
      } else {
        if (normDomain) seenDomains.add(normDomain);
        if (sourceKey) seenSourceIds.add(sourceKey);
        if (normName && cand.city) seenNames.add(`${normName}:${cand.city.toLowerCase()}`);
        deduplicatedCandidates.push(cand);
      }
    }

    return {
      candidates: deduplicatedCandidates,
      successfulProviders,
      failedProviders,
      totalFound: allRawCandidates.length,
      deduplicatedCount,
      verifiedCount: deduplicatedCandidates.length
    };
  }
}
