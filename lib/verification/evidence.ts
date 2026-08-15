import { getDb } from '../db';

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
   * Registers a factual claim with verifiable source evidence
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
    if (s.includes('government') || s.includes('registry')) return 100;
    if (s.includes('official website') || s.includes('domain')) return 95;
    if (s.includes('authorized api') || s.includes('oauth')) return 95;
    if (s.includes('company filing')) return 95;
    if (s.includes('verified social')) return 90;
    if (s.includes('directory') || s.includes('openstreetmap') || s.includes('osm')) return 70;
    if (s.includes('search result')) return 60;
    if (s.includes('unverified directory')) return 35;
    if (s.includes('ai inference') || s.includes('model')) return 0;
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
}
