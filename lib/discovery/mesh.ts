/**
 * PROXIMA Opportunity Discovery Mesh
 * Comprehensive discovery engine combining Local Maps, Public Web, Website Intelligence,
 * Hiring Signals, Expansion Signals, and Partnership Pipeline routing.
 */

import { DiscoveryProviderRouter } from './router';
import { DiscoveryCandidate } from './providers/interface';
import { WebsiteIntelligenceEngine, WebsiteAuditResult } from '../intelligence/website';
import { HiringSignalEngine } from './signals/hiring';
import { ExpansionSignalEngine } from './signals/expansion';
import { EvidenceEngine } from '../verification/evidence';
import { CanonicalDeduplicationEngine } from '../verification/dedup';

export interface EnrichedOpportunityCandidate extends DiscoveryCandidate {
  websiteAudit?: WebsiteAuditResult;
  hiringSignals?: any[];
  expansionSignals?: any[];
  evidenceIds: string[];
}

export class OpportunityDiscoveryMesh {
  private router: DiscoveryProviderRouter;

  constructor() {
    this.router = new DiscoveryProviderRouter();
  }

  /**
   * Runs the full Opportunity Discovery Mesh for a given industry and location
   */
  async sweepOpportunities(params: {
    industry: string;
    location: string;
    offset?: number;
    batchSize?: number;
    performWebsiteAudit?: boolean;
  }): Promise<{
    candidates: EnrichedOpportunityCandidate[];
    successfulProviders: string[];
    failedProviders: Array<{ provider: string; error: string; retryable: boolean }>;
    totalFound: number;
    deduplicatedCount: number;
  }> {
    const { industry, location, offset = 0, batchSize = 25, performWebsiteAudit = true } = params;
    console.log(`[OPPORTUNITY MESH] Launching multi-dimensional sweep for ${industry} in ${location}...`);

    // 1. Multi-source candidate discovery
    const discoveryResult = await this.router.discoverAll({
      industry,
      location,
      offset,
      batchSize
    });

    const enrichedCandidates: EnrichedOpportunityCandidate[] = [];

    // 2. Enrich candidates with Website Intelligence, Hiring & Expansion Signals
    for (const cand of discoveryResult.candidates) {
      const evidenceIds: string[] = [];
      let websiteAudit: WebsiteAuditResult | undefined;
      let hiringSignals: any[] = [];
      let expansionSignals: any[] = [];

      // Record base discovery evidence
      if (cand.sourceUrl || cand.source) {
        const evid = await EvidenceEngine.recordEvidence({
          entity_type: 'company',
          entity_id: cand.sourceId || cand.businessName,
          claim_type: 'business_existence',
          source: cand.source,
          source_url: cand.sourceUrl,
          confidence: cand.evidence?.confidence || 80,
          payload: cand.rawSourceData || { name: cand.businessName, category: cand.category, address: cand.address }
        });
        evidenceIds.push(evid.id);
      }

      // Website audit if website available
      if (performWebsiteAudit && cand.website && cand.website.startsWith('http')) {
        try {
          websiteAudit = await WebsiteIntelligenceEngine.auditWebsite(cand.website);
          if (websiteAudit.evidenceIds) {
            evidenceIds.push(...websiteAudit.evidenceIds);
          }

          // Check text for hiring / expansion signals
          const rawFindingsText = websiteAudit.findings.map(f => `${f.observation} ${f.evidence}`).join(' ');
          const detectedHiring = HiringSignalEngine.detectHiringSignals(rawFindingsText, cand.website);
          const detectedExpansion = ExpansionSignalEngine.detectExpansionSignals(rawFindingsText);

          hiringSignals = detectedHiring;
          expansionSignals = detectedExpansion;
        } catch (e: any) {
          console.warn(`[OPPORTUNITY MESH] Website audit error for ${cand.website}:`, e.message);
        }
      }

      enrichedCandidates.push({
        ...cand,
        websiteAudit,
        hiringSignals,
        expansionSignals,
        evidenceIds
      });
    }

    return {
      candidates: enrichedCandidates,
      successfulProviders: discoveryResult.successfulProviders,
      failedProviders: discoveryResult.failedProviders,
      totalFound: discoveryResult.totalFound,
      deduplicatedCount: discoveryResult.deduplicatedCount
    };
  }
}
