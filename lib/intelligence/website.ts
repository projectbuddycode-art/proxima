/**
 * PROXIMA Website Intelligence Engine
 * Deterministic website inspection, contact/conversion path audit, mobile structure checks,
 * and evidence-backed commercial signal extraction without hallucination.
 */

import { getDb } from '../db';
import { EvidenceEngine } from '../verification/evidence';
import { normalizeCanonicalUrl } from '../domain/evidence';

export interface WebsiteAuditFinding {
  category: 'CONVERSION' | 'CONTACT_FLOW' | 'MOBILE' | 'TECHNOLOGY' | 'SECURITY';
  observation: string;
  evidence: string;
  potential_business_impact: string;
  confidence: number; // 0 - 100
  recommended_discovery_question: string;
}

export interface WebsiteAuditResult {
  url: string;
  domain: string;
  statusCode?: number;
  loadTimeMs?: number;
  accessible: boolean;
  hasHttps: boolean;
  hasMobileViewport: boolean;
  hasContactForm: boolean;
  hasWhatsAppFlow: boolean;
  hasEmailLink: boolean;
  hasPhoneLink: boolean;
  hasLeadCapture: boolean;
  meta: {
    title?: string;
    description?: string;
    generator?: string;
  };
  techSignatures: string[];
  findings: WebsiteAuditFinding[];
  evidenceIds: string[];
  error?: string;
}

export class WebsiteIntelligenceEngine {
  /**
   * Audits a publicly accessible business website deterministically
   */
  static async auditWebsite(targetUrl: string, companyId?: string): Promise<WebsiteAuditResult> {
    const normalized = normalizeCanonicalUrl(targetUrl);
    const url = normalized ? normalized.url : targetUrl;
    const domain = normalized ? normalized.domain : (new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`).hostname);

    const startTime = Date.now();
    const findings: WebsiteAuditFinding[] = [];
    const evidenceIds: string[] = [];
    const techSignatures: string[] = [];

    let statusCode: number | undefined;
    let htmlContent = '';
    let accessible = false;
    let hasHttps = url.startsWith('https://');
    let hasMobileViewport = false;
    let hasContactForm = false;
    let hasWhatsAppFlow = false;
    let hasEmailLink = false;
    let hasPhoneLink = false;
    let hasLeadCapture = false;
    let metaTitle: string | undefined;
    let metaDescription: string | undefined;
    let metaGenerator: string | undefined;
    let error: string | undefined;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (Proxima Public Audit)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000)
      });

      statusCode = response.status;
      accessible = response.ok;

      if (response.ok) {
        htmlContent = await response.text();
      }
    } catch (err: any) {
      error = err.message || 'HTTP fetch failed';
      console.warn(`[WEBSITE INTELLIGENCE] Fetch warning for ${url}:`, error);
    }

    const loadTimeMs = Date.now() - startTime;

    if (accessible && htmlContent) {
      const lower = htmlContent.toLowerCase();

      // 1. Meta Inspections
      const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) metaTitle = titleMatch[1].trim();

      const descMatch = htmlContent.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
      if (descMatch) metaDescription = descMatch[1].trim();

      const genMatch = htmlContent.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i);
      if (genMatch) metaGenerator = genMatch[1].trim();

      // 2. Mobile Viewport Check
      hasMobileViewport = /<meta[^>]+name=["']viewport["'][^>]*>/i.test(htmlContent);
      if (!hasMobileViewport) {
        findings.push({
          category: 'MOBILE',
          observation: 'Missing standard mobile viewport meta tag.',
          evidence: '<meta name="viewport"> tag not found in HTML head.',
          potential_business_impact: 'Mobile visitors may experience unscaled desktop rendering, increasing bounce rates on smartphone visits.',
          confidence: 90,
          recommended_discovery_question: 'How does your team currently monitor mobile vs desktop visitor drop-off on your product pages?'
        });
      }

      // 3. Contact and Conversion Flows
      hasContactForm = /<form[^>]*>[\s\S]*?<\/form>/i.test(htmlContent);
      hasWhatsAppFlow = /wa\.me\/|api\.whatsapp\.com|whatsapp/i.test(htmlContent);
      hasEmailLink = /href=["']mailto:/i.test(htmlContent);
      hasPhoneLink = /href=["']tel:/i.test(htmlContent);
      hasLeadCapture = hasContactForm || hasWhatsAppFlow || /(rfq|request a quote|get in touch|book consultation|inquire)/i.test(htmlContent);

      if (!hasWhatsAppFlow) {
        findings.push({
          category: 'CONTACT_FLOW',
          observation: 'No instant WhatsApp business chat link observed on website.',
          evidence: 'No wa.me or WhatsApp API links detected in page markup.',
          potential_business_impact: 'High-intent prospects seeking instant product specifications or quote inquiries may abandon instead of filling static forms.',
          confidence: 85,
          recommended_discovery_question: 'Do you find high-value architects and commercial buyers prefer requesting quick product quotes over WhatsApp rather than traditional email forms?'
        });
      }

      if (!hasContactForm && !hasWhatsAppFlow) {
        findings.push({
          category: 'CONVERSION',
          observation: 'No structured lead capture or instant quote inquiry flow observed.',
          evidence: 'Absence of web forms and direct chat integration.',
          potential_business_impact: 'Lack of automated lead capture routes inquiries solely through unformatted manual emails or missed calls.',
          confidence: 80,
          recommended_discovery_question: 'When prospective clients land on your website, what is your primary mechanism for capturing their project requirements before they leave?'
        });
      }

      // 4. Technology Signals
      if (lower.includes('wp-content') || lower.includes('wordpress')) techSignatures.push('WordPress');
      if (lower.includes('shopify')) techSignatures.push('Shopify');
      if (lower.includes('wix.com') || lower.includes('wixsite')) techSignatures.push('Wix');
      if (lower.includes('squarespace')) techSignatures.push('Squarespace');
      if (lower.includes('webflow')) techSignatures.push('Webflow');
      if (lower.includes('next.js') || lower.includes('__next')) techSignatures.push('Next.js');
      if (lower.includes('react')) techSignatures.push('React');
      if (metaGenerator) techSignatures.push(metaGenerator);

      if (techSignatures.length > 0) {
        findings.push({
          category: 'TECHNOLOGY',
          observation: `Public technology signature identified: ${techSignatures.join(', ')}.`,
          evidence: `Detectable framework scripts and asset paths in HTML source.`,
          potential_business_impact: 'Indicates current digital architecture tier and potential integration capabilities.',
          confidence: 85,
          recommended_discovery_question: `How seamlessly does your current ${techSignatures[0]} setup handle custom catalogue workflows and dynamic client quotes?`
        });
      }
    } else {
      findings.push({
        category: 'CONVERSION',
        observation: `Website is not currently reachable or returned HTTP status ${statusCode || 'OFFLINE'}.`,
        evidence: `Direct HTTP probe to ${url} failed with ${error || `status ${statusCode}`}.`,
        potential_business_impact: 'Prospective clients searching online cannot access your company portfolio or services.',
        confidence: 95,
        recommended_discovery_question: 'Were you aware that your primary website domain is currently returning connection errors for new visitors?'
      });
    }

    // Register evidence records in database if companyId is provided
    if (companyId) {
      try {
        const evidenceRecord = await EvidenceEngine.recordEvidence({
          entity_type: 'company',
          entity_id: companyId,
          claim_type: 'website_audit',
          source: 'Direct HTTP Website Inspection',
          source_url: url,
          confidence: accessible ? 90 : 95,
          payload: {
            url,
            statusCode,
            loadTimeMs,
            accessible,
            hasHttps,
            hasMobileViewport,
            hasContactForm,
            hasWhatsAppFlow,
            techSignatures,
            findingsCount: findings.length
          }
        });
        evidenceIds.push(evidenceRecord.id);

        const db = getDb();
        const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        await db.executeAsync(
          `INSERT INTO website_audits (id, company_id, url, status_code, load_time_ms, has_https, has_mobile_viewport, has_contact_form, has_whatsapp_flow, has_email_link, has_phone_link, has_lead_capture, tech_stack, observations, evidence_ids, audit_summary, scanned_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            auditId,
            companyId,
            url,
            statusCode || null,
            loadTimeMs,
            hasHttps ? 1 : 0,
            hasMobileViewport ? 1 : 0,
            hasContactForm ? 1 : 0,
            hasWhatsAppFlow ? 1 : 0,
            hasEmailLink ? 1 : 0,
            hasPhoneLink ? 1 : 0,
            hasLeadCapture ? 1 : 0,
            JSON.stringify(techSignatures),
            JSON.stringify(findings),
            JSON.stringify(evidenceIds),
            `${findings.length} observable findings discovered across conversion and contact flows.`,
            new Date().toISOString()
          ]
        );
      } catch (e: any) {
        console.warn('[WEBSITE INTELLIGENCE] Database recording warning:', e.message);
      }
    }

    return {
      url,
      domain,
      statusCode,
      loadTimeMs,
      accessible,
      hasHttps,
      hasMobileViewport,
      hasContactForm,
      hasWhatsAppFlow,
      hasEmailLink,
      hasPhoneLink,
      hasLeadCapture,
      meta: {
        title: metaTitle,
        description: metaDescription,
        generator: metaGenerator
      },
      techSignatures,
      findings,
      evidenceIds,
      error
    };
  }

  /**
   * Safe Redirect URL follow and Domain/Identity verification check
   */
  static async verifyOfficialDomain(
    targetUrl: string,
    candidateName: string
  ): Promise<{
    verification_status: 'VERIFIED' | 'LIKELY' | 'UNVERIFIED' | 'REJECTED';
    canonical_url: string;
    company_name?: string;
    evidence: string;
  }> {
    const normalized = normalizeCanonicalUrl(targetUrl);
    if (!normalized) {
      return {
        verification_status: 'REJECTED',
        canonical_url: targetUrl,
        evidence: 'Invalid canonical URL formatting.'
      };
    }

    try {
      const response = await fetch(normalized.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (Proxima Verification Router)'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(8000)
      });

      const finalUrl = response.url || normalized.url;
      const htmlContent = response.ok ? await response.text() : '';

      if (!response.ok) {
        return {
          verification_status: 'UNVERIFIED',
          canonical_url: finalUrl,
          evidence: `Website responded with HTTP ${response.status}. Domain could not be verified.`
        };
      }

      // 1. Inspect title
      const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
      const pageTitle = titleMatch ? titleMatch[1].trim() : '';

      // 2. Organization Schema Check
      const hasOrgSchema = htmlContent.includes('"@type": "Organization"') || htmlContent.includes('"@type":"Organization"');

      // Compare candidateName against page title & markup tokens
      const cleanName = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanTitle = pageTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

      let score = 0;
      if (cleanTitle.includes(cleanName) || cleanName.includes(cleanTitle)) {
        score += 50;
      }
      if (hasOrgSchema) {
        score += 30;
      }
      if (htmlContent.toLowerCase().includes(candidateName.toLowerCase())) {
        score += 20;
      }

      const status = score >= 70 ? 'VERIFIED' : score >= 30 ? 'LIKELY' : 'UNVERIFIED';
      const evidenceStr = `Domain redirection verified: ${normalized.url} -> ${finalUrl}. Page Title: "${pageTitle}". Org Schema: ${hasOrgSchema}. Alignment Score: ${score}/100.`;

      return {
        verification_status: status,
        canonical_url: finalUrl,
        company_name: pageTitle || candidateName,
        evidence: evidenceStr
      };
    } catch (err: any) {
      return {
        verification_status: 'UNVERIFIED',
        canonical_url: normalized.url,
        evidence: `Domain check timed out or failed: ${err.message}`
      };
    }
  }
}
