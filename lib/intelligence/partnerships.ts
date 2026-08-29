/**
 * PROXIMA Strategic Partnership Pipeline
 * Dedicated pipeline for agency execution, software consultancies, ERP partners,
 * and overseas agencies needing implementation partners.
 */

import { getDb } from '../db';
import { EvidenceEngine } from '../verification/evidence';

export type PartnershipCategory =
  | 'MARKETING_AGENCY'
  | 'BRANDING_STUDIO'
  | 'DESIGN_STUDIO'
  | 'SOFTWARE_CONSULTANCY'
  | 'ERP_CONSULTANT'
  | 'SAAS_COMPANY'
  | 'OVERSEAS_AGENCY';

export type PartnershipStatus =
  | 'IDENTIFIED'
  | 'OUTREACH_PENDING'
  | 'CONTACTED'
  | 'DISCUSSION'
  | 'AGREEMENT'
  | 'ACTIVE'
  | 'INACTIVE';

export interface PartnershipPartner {
  id: string;
  company_name: string;
  category: PartnershipCategory;
  website?: string;
  location?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  synergy_summary: string;
  partnership_model: string;
  status: PartnershipStatus;
  estimated_monthly_value: number;
  evidence_ids?: string[];
  created_at: string;
  updated_at: string;
}

export class PartnershipPipelineEngine {
  static async registerPartner(params: {
    company_name: string;
    category: PartnershipCategory;
    website?: string;
    location?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    synergy_summary: string;
    partnership_model?: string;
    estimated_monthly_value?: number;
  }): Promise<PartnershipPartner> {
    const db = getDb();
    const id = `ptnr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();

    const partner: PartnershipPartner = {
      id,
      company_name: params.company_name,
      category: params.category,
      website: params.website,
      location: params.location,
      contact_name: params.contact_name,
      contact_email: params.contact_email,
      contact_phone: params.contact_phone,
      synergy_summary: params.synergy_summary,
      partnership_model: params.partnership_model || 'WHITE_LABEL_EXECUTION',
      status: 'IDENTIFIED',
      estimated_monthly_value: params.estimated_monthly_value || 150000,
      evidence_ids: [],
      created_at: now,
      updated_at: now
    };

    try {
      await db.executeAsync(
        `INSERT INTO partnerships (id, company_name, category, website, location, contact_name, contact_email, contact_phone, synergy_summary, partnership_model, status, estimated_monthly_value, evidence_ids, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          partner.id,
          partner.company_name,
          partner.category,
          partner.website || null,
          partner.location || null,
          partner.contact_name || null,
          partner.contact_email || null,
          partner.contact_phone || null,
          partner.synergy_summary,
          partner.partnership_model,
          partner.status,
          partner.estimated_monthly_value,
          JSON.stringify(partner.evidence_ids),
          partner.created_at,
          partner.updated_at
        ]
      );
    } catch (e: any) {
      console.warn('[PARTNERSHIPS] DB record warning:', e.message);
    }

    return partner;
  }

  static async getPartners(category?: PartnershipCategory): Promise<PartnershipPartner[]> {
    const db = getDb();
    try {
      let partners: any[] = [];
      if (category) {
        partners = await db.queryAllAsync('SELECT * FROM partnerships WHERE category = ?', [category]);
      } else {
        partners = await db.queryAllAsync('SELECT * FROM partnerships ORDER BY created_at DESC');
      }
      return partners || [];
    } catch (e) {
      return [];
    }
  }
}
