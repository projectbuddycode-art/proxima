/**
 * PROXIMA Expansion Signals Discovery
 * Identifies public indicators of new offices, locations, products, markets, funding, or partnerships.
 */

import { getDb } from '../../db';
import { EvidenceEngine } from '../../verification/evidence';

export interface ExpansionSignal {
  id: string;
  prospect_id?: string;
  company_id?: string;
  expansion_type: 'NEW_LOCATION' | 'NEW_PRODUCT' | 'NEW_MARKET' | 'FUNDING' | 'GROWTH' | 'PARTNERSHIP';
  title: string;
  details: string;
  source_url?: string;
  observed_at: string;
  evidence_id?: string;
}

export class ExpansionSignalEngine {
  static detectExpansionSignals(text: string): Array<{
    expansion_type: 'NEW_LOCATION' | 'NEW_PRODUCT' | 'NEW_MARKET' | 'FUNDING' | 'GROWTH' | 'PARTNERSHIP';
    title: string;
    details: string;
  }> {
    const signals: Array<{
      expansion_type: 'NEW_LOCATION' | 'NEW_PRODUCT' | 'NEW_MARKET' | 'FUNDING' | 'GROWTH' | 'PARTNERSHIP';
      title: string;
      details: string;
    }> = [];

    const lower = text.toLowerCase();

    if (lower.includes('new showroom') || lower.includes('new office') || lower.includes('opened in') || lower.includes('launching in')) {
      signals.push({
        expansion_type: 'NEW_LOCATION',
        title: 'Physical Location / Showroom Expansion',
        details: 'Announced opening of new showroom or regional office.'
      });
    }

    if (lower.includes('new product line') || lower.includes('launching catalogue') || lower.includes('new collection')) {
      signals.push({
        expansion_type: 'NEW_PRODUCT',
        title: 'Product Line Launch',
        details: 'Expanded catalogue or introduced new product division.'
      });
    }

    if (lower.includes('partnering with') || lower.includes('partnership with') || lower.includes('strategic alliance')) {
      signals.push({
        expansion_type: 'PARTNERSHIP',
        title: 'Strategic Partnership Announcement',
        details: 'Formed alliance with external channel or technology partners.'
      });
    }

    if (lower.includes('funded by') || lower.includes('raised') || lower.includes('series a') || lower.includes('seed round')) {
      signals.push({
        expansion_type: 'FUNDING',
        title: 'Capital Investment / Funding',
        details: 'Secured growth funding to accelerate expansion.'
      });
    }

    return signals;
  }

  static async recordExpansionSignal(params: {
    prospect_id?: string;
    company_id?: string;
    expansion_type: 'NEW_LOCATION' | 'NEW_PRODUCT' | 'NEW_MARKET' | 'FUNDING' | 'GROWTH' | 'PARTNERSHIP';
    title: string;
    details: string;
    source_url?: string;
  }): Promise<ExpansionSignal> {
    const db = getDb();
    const id = `sig_exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const observed_at = new Date().toISOString();

    let evidence_id: string | undefined;
    if (params.company_id || params.prospect_id) {
      const evid = await EvidenceEngine.recordEvidence({
        entity_type: params.company_id ? 'company' : 'prospect',
        entity_id: params.company_id || params.prospect_id!,
        claim_type: 'expansion_signal',
        source: 'Public Company Growth Announcement',
        source_url: params.source_url,
        confidence: 90,
        payload: { expansion_type: params.expansion_type, title: params.title, details: params.details }
      });
      evidence_id = evid.id;
    }

    const signal: ExpansionSignal = {
      id,
      prospect_id: params.prospect_id,
      company_id: params.company_id,
      expansion_type: params.expansion_type,
      title: params.title,
      details: params.details,
      source_url: params.source_url,
      observed_at,
      evidence_id
    };

    try {
      await db.executeAsync(
        `INSERT INTO prospect_signals (id, prospect_id, company_id, signal_type, title, description, evidence_id, source_url, confidence, freshness_score, observed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          signal.id,
          signal.prospect_id || null,
          signal.company_id || null,
          'EXPANSION',
          signal.title,
          signal.details,
          signal.evidence_id || null,
          signal.source_url || null,
          90,
          100,
          signal.observed_at,
          signal.observed_at
        ]
      );
    } catch (e: any) {
      console.warn('[EXPANSION SIGNAL] DB record warning:', e.message);
    }

    return signal;
  }
}
