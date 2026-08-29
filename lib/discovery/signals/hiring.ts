/**
 * PROXIMA Hiring Signals Discovery
 * Identifies public hiring indicators for software, sales, marketing, and operations.
 */

import { getDb } from '../../db';
import { EvidenceEngine } from '../../verification/evidence';

export interface HiringSignal {
  id: string;
  prospect_id?: string;
  company_id?: string;
  role_category: 'SOFTWARE' | 'MARKETING' | 'SALES' | 'OPERATIONS' | 'EXECUTIVE';
  job_title: string;
  location?: string;
  source_url?: string;
  observed_at: string;
  evidence_id?: string;
  implication: string;
}

export class HiringSignalEngine {
  static detectHiringSignals(text: string, sourceUrl?: string): Array<{
    category: 'SOFTWARE' | 'MARKETING' | 'SALES' | 'OPERATIONS' | 'EXECUTIVE';
    job_title: string;
    implication: string;
  }> {
    const signals: Array<{
      category: 'SOFTWARE' | 'MARKETING' | 'SALES' | 'OPERATIONS' | 'EXECUTIVE';
      job_title: string;
      implication: string;
    }> = [];

    const lower = text.toLowerCase();

    if (lower.includes('hiring software') || lower.includes('developer') || lower.includes('engineer')) {
      signals.push({
        category: 'SOFTWARE',
        job_title: 'Software Engineer / Developer',
        implication: 'Scaling internal technical capabilities; high receptivity to technical architecture & delivery partnership.'
      });
    }

    if (lower.includes('sales executive') || lower.includes('business development') || lower.includes('sales coordinator') || lower.includes('bde')) {
      signals.push({
        category: 'SALES',
        job_title: 'Business Development / Sales Coordinator',
        implication: 'Expanding client acquisition capacity; needs automated lead qualification and quotation turnaround.'
      });
    }

    if (lower.includes('digital marketing') || lower.includes('seo specialist') || lower.includes('marketing manager') || lower.includes('content')) {
      signals.push({
        category: 'MARKETING',
        job_title: 'Marketing Specialist / Manager',
        implication: 'Investing in brand and demand generation; opportunities in custom digital showrooms and landing page systems.'
      });
    }

    if (lower.includes('operations manager') || lower.includes('warehouse') || lower.includes('procurement') || lower.includes('logistics')) {
      signals.push({
        category: 'OPERATIONS',
        job_title: 'Operations Coordinator / Manager',
        implication: 'Handling operational bottlenecks in inventory or order fulfillment; target for internal workflow automation.'
      });
    }

    return signals;
  }

  static async recordHiringSignal(params: {
    prospect_id?: string;
    company_id?: string;
    role_category: 'SOFTWARE' | 'MARKETING' | 'SALES' | 'OPERATIONS' | 'EXECUTIVE';
    job_title: string;
    source_url?: string;
    implication: string;
  }): Promise<HiringSignal> {
    const db = getDb();
    const id = `sig_hire_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const observed_at = new Date().toISOString();

    let evidence_id: string | undefined;
    if (params.company_id || params.prospect_id) {
      const evid = await EvidenceEngine.recordEvidence({
        entity_type: params.company_id ? 'company' : 'prospect',
        entity_id: params.company_id || params.prospect_id!,
        claim_type: 'hiring_signal',
        source: 'Public Career / Hiring Notice',
        source_url: params.source_url,
        confidence: 85,
        payload: { job_title: params.job_title, role_category: params.role_category, implication: params.implication }
      });
      evidence_id = evid.id;
    }

    const signal: HiringSignal = {
      id,
      prospect_id: params.prospect_id,
      company_id: params.company_id,
      role_category: params.role_category,
      job_title: params.job_title,
      source_url: params.source_url,
      observed_at,
      evidence_id,
      implication: params.implication
    };

    try {
      await db.executeAsync(
        `INSERT INTO prospect_signals (id, prospect_id, company_id, signal_type, title, description, evidence_id, source_url, confidence, freshness_score, observed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          signal.id,
          signal.prospect_id || null,
          signal.company_id || null,
          'HIRING',
          `Hiring: ${signal.job_title} (${signal.role_category})`,
          signal.implication,
          signal.evidence_id || null,
          signal.source_url || null,
          85,
          100,
          signal.observed_at,
          signal.observed_at
        ]
      );
    } catch (e: any) {
      console.warn('[HIRING SIGNAL] DB record warning:', e.message);
    }

    return signal;
  }
}
