import { getDb } from '../db';
import {
  EvidenceRecord,
  EntityType,
  calculateEvidenceFreshness,
  isEvidenceStale,
  generateEvidenceContentHash,
  normalizeCanonicalUrl
} from '../domain/evidence';

export interface EvidenceClaim {
  id: string;
  prospect_id?: string;
  claim: string;
  source: string;
  source_url: string;
  captured_at: string;
  verification_status: 'VERIFIED' | 'UNVERIFIED' | 'VERIFICATION_REQUIRED';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  agent: string;
  evidence_type: string;
}

export class EvidenceEngine {
  /**
   * Registers a unified evidence record in the database
   */
  static async recordEvidence(params: {
    entity_type: EntityType;
    entity_id: string;
    claim_type: string;
    source: string;
    source_url?: string | null;
    confidence?: number;
    payload?: Record<string, any> | string | null;
    expires_in_days?: number;
  }): Promise<EvidenceRecord> {
    const db = getDb();
    const id = `evid_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const observed_at = new Date().toISOString();
    const expires_at = params.expires_in_days
      ? new Date(Date.now() + params.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const confidence = params.confidence !== undefined ? Math.min(100, Math.max(0, params.confidence)) : 80;
    const freshness_score = calculateEvidenceFreshness(observed_at);
    const content_hash = generateEvidenceContentHash(
      params.entity_type,
      params.entity_id,
      params.claim_type,
      params.source,
      params.payload
    );

    const record: EvidenceRecord = {
      id,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      claim_type: params.claim_type,
      source: params.source,
      source_url: params.source_url || null,
      observed_at,
      expires_at,
      confidence,
      freshness_score,
      payload: params.payload || null,
      content_hash,
      created_at: observed_at
    };

    try {
      await db.executeAsync(
        `INSERT INTO prospect_evidence (id, entity_type, entity_id, claim_type, source, source_url, observed_at, expires_at, confidence, freshness_score, payload, content_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.entity_type,
          record.entity_id,
          record.claim_type,
          record.source,
          record.source_url,
          record.observed_at,
          record.expires_at,
          record.confidence,
          record.freshness_score,
          typeof record.payload === 'object' ? JSON.stringify(record.payload) : record.payload,
          record.content_hash,
          record.created_at
        ]
      );
      return {
        ...record,
        persisted: true
      };
    } catch (err: any) {
      console.warn('[EVIDENCE] Record error in prospect_evidence table:', err.message);
      return {
        ...record,
        persisted: false,
        persistence_error: err.message
      };
    }
  }

  /**
   * Retrieves all verified evidence for a given entity, with dynamic freshness calculation
   */
  static async getEvidenceForEntity(entityType: EntityType, entityId: string): Promise<EvidenceRecord[]> {
    const db = getDb();
    try {
      const rows = await db.queryAllAsync(
        'SELECT * FROM prospect_evidence WHERE entity_type = ? AND entity_id = ?',
        [entityType, entityId]
      );

      return (rows || []).map((r: any) => {
        const freshness = calculateEvidenceFreshness(r.observed_at);
        return {
          ...r,
          payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload,
          freshness_score: freshness,
          is_stale: isEvidenceStale({ observed_at: r.observed_at, expires_at: r.expires_at, freshness_score: freshness })
        };
      });
    } catch (err) {
      return [];
    }
  }

  /**
   * Registers a factual claim with verifiable source evidence (Legacy / Compatibility layer)
   */
  static async registerClaim(claimData: {
    prospect_id?: string;
    claim: string;
    source: string;
    source_url: string;
    confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
    agent?: string;
    evidence_type?: string;
  }): Promise<EvidenceClaim> {
    const db = getDb();
    const claimId = `evid_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const capturedAt = new Date().toISOString();
    const confidence = claimData.confidence || 'HIGH';
    const status = confidence === 'HIGH' ? 'VERIFIED' : 'VERIFICATION_REQUIRED';

    const claim: EvidenceClaim = {
      id: claimId,
      prospect_id: claimData.prospect_id,
      claim: claimData.claim,
      source: claimData.source,
      source_url: claimData.source_url,
      captured_at: capturedAt,
      verification_status: status,
      confidence,
      agent: claimData.agent || 'Discovery Agent',
      evidence_type: claimData.evidence_type || 'Public Registry'
    };

    try {
      await db.executeAsync(
        `INSERT INTO evidence_claims (id, prospect_id, claim, source, source_url, captured_at, verification_status, confidence, agent, evidence_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          claim.id,
          claim.prospect_id || null,
          claim.claim,
          claim.source,
          claim.source_url,
          claim.captured_at,
          claim.verification_status,
          claim.confidence,
          claim.agent,
          claim.evidence_type
        ]
      );
    } catch (err: any) {
      console.warn('Evidence claim register warning:', err.message);
    }

    // Also record into unified prospect_evidence table
    if (claimData.prospect_id) {
      await this.recordEvidence({
        entity_type: 'prospect',
        entity_id: claimData.prospect_id,
        claim_type: claimData.evidence_type || 'claim',
        source: claimData.source,
        source_url: claimData.source_url,
        confidence: confidence === 'HIGH' ? 95 : confidence === 'MEDIUM' ? 70 : 40,
        payload: { claim: claimData.claim, agent: claimData.agent }
      });
    }

    return claim;
  }

  /**
   * Retrieves all verified evidence claims for a given prospect
   */
  static async getClaimsForProspect(prospectId: string): Promise<EvidenceClaim[]> {
    const db = getDb();
    try {
      const claims = await db.queryAllAsync('SELECT * FROM evidence_claims WHERE prospect_id = ?', [prospectId]);
      return claims || [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Returns source reliability weight (0-100) based on source provenance hierarchy
   */
  static getSourceReliabilityScore(sourceType: string): number {
    const s = (sourceType || '').toLowerCase();
    if (s.includes('government') || s.includes('registry') || s.includes('corporate filing')) return 100;
    if (s.includes('official website') || s.includes('domain') || s.includes('direct http')) return 95;
    if (s.includes('authorized api') || s.includes('oauth')) return 95;
    if (s.includes('company filing')) return 95;
    if (s.includes('verified social')) return 90;
    if (s.includes('directory') || s.includes('openstreetmap') || s.includes('osm') || s.includes('public web')) return 70;
    if (s.includes('search result')) return 60;
    if (s.includes('unverified directory')) return 35;
    if (s.includes('ai inference') || s.includes('model') || s.includes('llm')) return 0;
    return 60;
  }

  /**
   * Evaluates claim confidence based on provenance evidence availability
   */
  static evaluateClaimConfidence(sourceUrl?: string, hasPublicEvidence?: boolean): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (sourceUrl && sourceUrl.startsWith('http') && hasPublicEvidence) {
      return 'HIGH';
    }
    if (sourceUrl && sourceUrl.startsWith('http')) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Normalizes URLs and checks freshness
   */
  static normalizeUrl(rawUrl?: string): { url: string; domain: string } | null {
    return normalizeCanonicalUrl(rawUrl);
  }

  /**
   * Deterministic freshness calculation helper
   */
  static calculateFreshness(observedAt: string, halfLifeDays = 45): number {
    return calculateEvidenceFreshness(observedAt, halfLifeDays);
  }

  /**
   * Stale evidence detection helper
   */
  static isStale(record: { observed_at: string; expires_at?: string | null; freshness_score?: number }): boolean {
    return isEvidenceStale(record);
  }
}
