/**
 * PROXIMA Referral Opportunities Engine
 * Tracks referral relationships, introduction statuses, follow-ups,
 * and enforces cooldowns to prevent repeated referral fatigue.
 */

import { getDb } from '../db';

export interface ReferralRecord {
  id: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  organization?: string;
  relationship: 'CLIENT' | 'PARTNER' | 'ALUMNI' | 'INDUSTRY_PEER' | 'ADVISOR';
  source_contact_id?: string;
  target_prospect_id?: string;
  introduction_status: 'REQUESTED' | 'INTRODUCED' | 'FOLLOWED_UP' | 'CONVERTED' | 'DECLINED';
  last_contacted_at?: string;
  cooldown_until?: string;
  notes?: string;
  outcome?: string;
  created_at: string;
  updated_at: string;
}

export class ReferralEngine {
  /**
   * Registers a new referral request or intro with cooldown enforcement
   */
  static async registerReferral(params: {
    contact_name: string;
    contact_email?: string;
    contact_phone?: string;
    organization?: string;
    relationship: 'CLIENT' | 'PARTNER' | 'ALUMNI' | 'INDUSTRY_PEER' | 'ADVISOR';
    source_contact_id?: string;
    target_prospect_id?: string;
    notes?: string;
  }): Promise<{ success: boolean; referral?: ReferralRecord; message?: string }> {
    const db = getDb();
    const cleanEmail = (params.contact_email || '').toLowerCase().trim();

    // Check for existing referrals to this contact within cooldown period (e.g. 60 days)
    if (cleanEmail) {
      try {
        const existing = await db.queryAllAsync('SELECT * FROM referrals WHERE contact_email = ?', [cleanEmail]);
        const inCooldown = existing.find((r: any) => {
          if (!r.cooldown_until) return false;
          return new Date(r.cooldown_until).getTime() > Date.now();
        });

        if (inCooldown) {
          return {
            success: false,
            message: `Contact ${params.contact_name} (${cleanEmail}) is in referral cooldown until ${inCooldown.cooldown_until}. Repeated outreach blocked.`
          };
        }
      } catch {
        // Fall through
      }
    }

    const id = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();
    const cooldownDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days cooldown

    const referral: ReferralRecord = {
      id,
      contact_name: params.contact_name,
      contact_email: cleanEmail || undefined,
      contact_phone: params.contact_phone,
      organization: params.organization,
      relationship: params.relationship,
      source_contact_id: params.source_contact_id,
      target_prospect_id: params.target_prospect_id,
      introduction_status: 'REQUESTED',
      last_contacted_at: now,
      cooldown_until: cooldownDate,
      notes: params.notes,
      created_at: now,
      updated_at: now
    };

    try {
      await db.executeAsync(
        `INSERT INTO referrals (id, contact_name, contact_email, contact_phone, organization, relationship, source_contact_id, target_prospect_id, introduction_status, last_contacted_at, cooldown_until, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          referral.id,
          referral.contact_name,
          referral.contact_email || null,
          referral.contact_phone || null,
          referral.organization || null,
          referral.relationship,
          referral.source_contact_id || null,
          referral.target_prospect_id || null,
          referral.introduction_status,
          referral.last_contacted_at || null,
          referral.cooldown_until || null,
          referral.notes || null,
          referral.created_at,
          referral.updated_at
        ]
      );
    } catch (e: any) {
      console.warn('[REFERRALS] DB record warning:', e.message);
    }

    return {
      success: true,
      referral,
      message: `Referral contact ${referral.contact_name} registered with 60-day frequency protection.`
    };
  }

  static async getReferrals(): Promise<ReferralRecord[]> {
    const db = getDb();
    try {
      const rows = await db.queryAllAsync('SELECT * FROM referrals ORDER BY created_at DESC');
      return rows || [];
    } catch {
      return [];
    }
  }
}
