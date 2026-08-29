/**
 * PROXIMA Contact Verification Engine & Data Model
 * Tracks contact values, types, sources, verification levels, and confidence.
 * Zero email-guessing or synthetic completions allowed.
 */

import { RealProspectFirewall } from './firewall';

export type ContactType =
  | 'OFFICIAL_EMAIL'
  | 'OFFICIAL_PHONE'
  | 'CONTACT_FORM'
  | 'BUSINESS_WHATSAPP'
  | 'PUBLIC_PROFESSIONAL_PROFILE'
  | 'DECISION_MAKER_EMAIL'
  | 'OTHER';

export type VerificationPipelineLevel =
  | 'LEVEL_1_OFFICIAL_CONTACT_PAGE'
  | 'LEVEL_2_OFFICIAL_WEBSITE'
  | 'LEVEL_3_VERIFIED_PUBLIC_PROFILE'
  | 'LEVEL_4_CREDIBLE_PUBLIC_DIRECTORY'
  | 'LEVEL_5_UNVERIFIED_DISCOVERED';

export interface ContactModel {
  id: string;
  company_id: string;
  name?: string;
  role?: string;
  contact_type: ContactType;
  contact_value: string;
  source: string;
  source_url: string;
  observed_at: string;
  verification_status: 'VERIFIED' | 'LIKELY' | 'UNVERIFIED' | 'INVALID' | 'STALE';
  confidence: number; // 0 - 100
  freshness_score: number; // 0 - 100
  pipeline_level: VerificationPipelineLevel;
}

export class ContactVerificationEngine {
  /**
   * Overloaded verifyContact method supporting both new structured models and legacy tests
   */
  static verifyContact(
    paramsOrType: any,
    value?: string,
    sourceUrl?: string,
    sourceType?: string,
    isCorroborated = false,
    deliveryConfirmed = false
  ): any | null {
    if (typeof paramsOrType === 'object' && paramsOrType !== null) {
      // New structured pipeline verification
      const params = paramsOrType as {
        company_id: string;
        contact_type: ContactType;
        contact_value: string | undefined;
        source: string;
        source_url: string;
        name?: string;
        role?: string;
        pipeline_level: VerificationPipelineLevel;
      };

      const cleanVal = RealProspectFirewall.sanitizeContactValue(params.contact_value);
      if (!cleanVal) return null;

      if (params.contact_type === 'DECISION_MAKER_EMAIL' || params.contact_type === 'OFFICIAL_EMAIL') {
        if (cleanVal.includes('dummy') || cleanVal.includes('test') || cleanVal.includes('example.com') || cleanVal.includes('yourcompany')) {
          return null;
        }
      }

      const id = `cont_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const observed_at = new Date().toISOString();

      let confidence = 40;
      let verification_status: ContactModel['verification_status'] = 'UNVERIFIED';

      if (params.pipeline_level === 'LEVEL_1_OFFICIAL_CONTACT_PAGE') {
        confidence = 95;
        verification_status = 'VERIFIED';
      } else if (params.pipeline_level === 'LEVEL_2_OFFICIAL_WEBSITE') {
        confidence = 88;
        verification_status = 'VERIFIED';
      } else if (params.pipeline_level === 'LEVEL_3_VERIFIED_PUBLIC_PROFILE') {
        confidence = 80;
        verification_status = 'VERIFIED';
      } else if (params.pipeline_level === 'LEVEL_4_CREDIBLE_PUBLIC_DIRECTORY') {
        confidence = 70;
        verification_status = 'LIKELY';
      } else if (params.pipeline_level === 'LEVEL_5_UNVERIFIED_DISCOVERED') {
        confidence = 45;
        verification_status = 'UNVERIFIED';
      }

      return {
        id,
        company_id: params.company_id,
        name: params.name || 'Business Contact',
        role: params.role || 'Representative',
        contact_type: params.contact_type,
        contact_value: cleanVal,
        source: params.source,
        source_url: params.source_url,
        observed_at,
        verification_status,
        confidence,
        freshness_score: 100,
        pipeline_level: params.pipeline_level
      };
    } else {
      // Legacy signature verification
      const type = paramsOrType as 'email' | 'phone' | 'whatsapp' | 'linkedin' | 'instagram' | 'facebook' | 'contact_form';
      const cleanVal = RealProspectFirewall.sanitizeContactValue(value);
      if (!cleanVal) return null;

      let pLevel: VerificationPipelineLevel = 'LEVEL_5_UNVERIFIED_DISCOVERED';
      let cType: ContactType = 'OTHER';

      if (type === 'email') cType = 'OFFICIAL_EMAIL';
      else if (type === 'phone') cType = 'OFFICIAL_PHONE';
      else if (type === 'whatsapp') cType = 'BUSINESS_WHATSAPP';
      else if (type === 'linkedin') cType = 'PUBLIC_PROFESSIONAL_PROFILE';

      if (sourceType === 'official_website') {
        pLevel = (sourceUrl || '').includes('contact') ? 'LEVEL_1_OFFICIAL_CONTACT_PAGE' : 'LEVEL_2_OFFICIAL_WEBSITE';
      } else if (sourceType === 'verified_listing') {
        pLevel = 'LEVEL_3_VERIFIED_PUBLIC_PROFILE';
      } else if (sourceType === 'public_directory') {
        pLevel = 'LEVEL_4_CREDIBLE_PUBLIC_DIRECTORY';
      }

      const verified = this.verifyContact({
        company_id: 'comp_legacy_1',
        contact_type: cType,
        contact_value: cleanVal,
        source: sourceType || 'legacy',
        source_url: sourceUrl || 'legacy',
        pipeline_level: pLevel
      });

      if (!verified) return null;

      return {
        type,
        value: verified.contact_value,
        source_url: verified.source_url,
        source_type: sourceType,
        verification_level: deliveryConfirmed ? 'LEVEL_4_DELIVERY_VERIFIED' : isCorroborated ? 'LEVEL_3_CORROBORATED_BY_SECOND_SOURCE' : 'LEVEL_2_FOUND_ON_OFFICIAL_COMPANY_SOURCE',
        domain_valid: verified.contact_value.includes('@') && verified.contact_value.includes('.'),
        mailbox_delivery_confirmed: deliveryConfirmed,
        confidence: verified.confidence,
        last_verified: verified.observed_at
      };
    }
  }
}
