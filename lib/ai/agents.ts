import { AIProvider, OllamaProvider, MockProvider } from './provider';
import { getDb } from '../db';
import fs from 'fs';
import path from 'path';

function getAIProvider(): AIProvider {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'ollama_base_url'").get() as { value: string } | undefined;
  const modelRow = db.prepare("SELECT value FROM settings WHERE key = 'ollama_model'").get() as { value: string } | undefined;

  const baseUrl = row?.value || 'http://localhost:11434';
  const model = modelRow?.value || 'llama3';

  return new OllamaProvider(baseUrl, model);
}

function loadKnowledgeContext(): string {
  try {
    const knowledgeDir = path.join(process.cwd(), 'knowledge');
    if (!fs.existsSync(knowledgeDir)) return '';
    const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith('.md'));
    let context = '';
    for (const f of files) {
      const content = fs.readFileSync(path.join(knowledgeDir, f), 'utf-8');
      context += `\n--- FILE: ${f} ---\n${content}\n`;
    }
    return context;
  } catch (err) {
    return '';
  }
}

// 1. RESEARCH AGENT
export interface ResearchOutput {
  company_name: string;
  website: string;
  industry: string;
  location: string;
  company_summary: string;
  decision_makers: Array<{ name: string; role: string; email?: string; phone?: string; linkedin?: string }>;
  products_services: string[];
  target_customers: string[];
  business_model: string;
  observable_website_findings: string[];
  social_signals: string[];
  hiring_signals: string[];
  expansion_signals: string[];
  review_signals: string[];
  buying_signals: string[];
  pain_hypotheses: string[];
  commercial_opportunities: string[];
  recommended_project_buddy_capability: string;
  recommended_offer: string;
  reason_to_contact_now: string;
  confidence: number;
}

export async function runResearchAgent(companyData: { name: string; website: string; industry: string; location: string; rawContent?: string }): Promise<ResearchOutput> {
  const ai = getAIProvider();
  const knowledge = loadKnowledgeContext();

  const systemPrompt = `You are Project Buddy's specialized Research Agent.
Your job is to analyze raw public information about a company and produce structured JSON research findings according to Project Buddy's commercial methodology.
Strict rules: Do NOT invent facts. Include observable findings, pain hypotheses, and reasons to contact now.
${knowledge}`;

  const prompt = `Research Target:
Company Name: ${companyData.name}
Website: ${companyData.website}
Industry: ${companyData.industry}
Location: ${companyData.location}
Raw Observed Content / Signals: ${companyData.rawContent || 'Website contains catalogue PDF download, generic contact form, hiring sales reps.'}

Output JSON schema matching ResearchOutput with fields:
company_name, website, industry, location, company_summary, decision_makers, products_services, target_customers, business_model, observable_website_findings, social_signals, hiring_signals, expansion_signals, review_signals, buying_signals, pain_hypotheses, commercial_opportunities, recommended_project_buddy_capability, recommended_offer, reason_to_contact_now, confidence.`;

  return ai.generateStructuredJSON<ResearchOutput>(prompt, systemPrompt);
}

// 2. BUYING INTENT AGENT
export interface IntentOutput {
  intent_score: number;
  intent_level: 'high' | 'medium' | 'low';
  signals: string[];
  negative_signals: string[];
  reason: string;
  confidence: number;
}

export async function runBuyingIntentAgent(research: ResearchOutput): Promise<IntentOutput> {
  const ai = getAIProvider();
  const systemPrompt = `You are Project Buddy's Buying Intent Agent.
Score intent 0-100 based on signals:
+30 explicit requirement, +20 relevant hiring, +15 expansion, +15 new product/service, +10 clear operational friction, +10 lead opportunity, +10 modernization signal, +10 decision maker found.
Deductions: -20 no meaningful signal, -10 unverified assumption.
Return JSON with intent_score, intent_level, signals, negative_signals, reason, confidence.`;

  const prompt = `Evaluate Buying Intent Agent for ${research?.company_name || 'Prospect'}:
Industry: ${research?.industry || 'General'}
Hiring signals: ${JSON.stringify(research?.hiring_signals || [])}
Expansion signals: ${JSON.stringify(research?.expansion_signals || [])}
Observable friction: ${JSON.stringify(research?.observable_website_findings || [])}
Buying signals: ${JSON.stringify(research?.buying_signals || [])}
Review signals: ${JSON.stringify(research?.review_signals || [])}`;

  return ai.generateStructuredJSON<IntentOutput>(prompt, systemPrompt);
}

// 3. FIT SCORE AGENT
export interface FitOutput {
  fit_score: number;
  reason: string;
  confidence: number;
}

export async function runFitScoreAgent(research: ResearchOutput): Promise<FitOutput> {
  const ai = getAIProvider();
  const prompt = `Evaluate Project Buddy Commercial Fit Score Agent (0-100) for ${research?.company_name || 'Prospect'} in ${research?.industry || 'General'}.
Consider company maturity, budget potential, technical need, capability fit, decision maker accessibility.
Return JSON { fit_score: number, reason: string, confidence: number }.`;

  return ai.generateStructuredJSON<FitOutput>(prompt);
}

// 4. OPPORTUNITY STRATEGIST AGENT
export interface OpportunityOutput {
  problem: string;
  business_impact: string;
  recommended_solution_category: string;
  recommended_offer: string;
  why_this_offer: string;
  estimated_commercial_band: string;
  discovery_question: string;
}

export async function runOpportunityStrategist(research: ResearchOutput, intent: IntentOutput): Promise<OpportunityOutput> {
  const ai = getAIProvider();
  const knowledge = loadKnowledgeContext();

  const systemPrompt = `You are Project Buddy's Opportunity Strategist Agent.
Determine WHAT Project Buddy should talk about. Choose between: custom software, automation, AI integration, CRM/ERP, reporting, digital showroom, conversion system, mobile application, operational intelligence, technical implementation partnership.
${knowledge}`;

  const prompt = `Formulate Commercial Strategy Opportunity Strategist for Company: ${research?.company_name || 'Prospect'} (${research?.industry || 'General'})
Pain Hypotheses: ${JSON.stringify(research?.pain_hypotheses || [])}
Website Findings: ${JSON.stringify(research?.observable_website_findings || [])}
Intent Signals: ${JSON.stringify(intent?.signals || [])}

Formulate commercial strategy JSON: problem, business_impact, recommended_solution_category, recommended_offer, why_this_offer, estimated_commercial_band, discovery_question.`;

  return ai.generateStructuredJSON<OpportunityOutput>(prompt, systemPrompt);
}

// 5. MESSAGE STRATEGIST AGENT
export interface MessageOutput {
  subject: string;
  body: string;
  score: number;
  qa_passed: boolean;
  qa_reasons: string[];
}

export async function runMessageStrategist(research: ResearchOutput, opportunity: OpportunityOutput): Promise<MessageOutput> {
  const ai = getAIProvider();
  const knowledge = loadKnowledgeContext();

  const systemPrompt = `You are Project Buddy's Message Strategist Agent.
STRICT RULES:
- Never use generic hype ("We build websites", "We are an AI agency", "Take your business to the next level", "Hope you are doing well", "Can we schedule a meeting").
- Structure MUST follow:
  1. Specific observation about their business/website/hiring.
  2. Business implication / hypothesis.
  3. One thoughtful question.
First objective is a REPLY, not a sale.
${knowledge}`;

  const contactName = research?.decision_makers?.[0]?.name || 'Founder';
  const companyName = research?.company_name || 'Prospect Company';
  const observation = research?.observable_website_findings?.[0] || 'catalogue enquiry flow';

  const prompt = `Message Strategist Agent crafting unique personalized outreach email:
Prospect Contact: ${contactName} at ${companyName}
Industry: ${research?.industry || 'Lighting Showroom'}
Observable detail: ${observation}
Problem: ${opportunity?.problem || 'Manual quotation delays'}
Discovery Question: ${opportunity?.discovery_question || 'How are you managing enquiry drop-off?'}

Craft unique personalized outreach email. Output JSON: { subject: string, body: string, score: number, qa_passed: boolean, qa_reasons: string[] }.`;

  return ai.generateStructuredJSON<MessageOutput>(prompt, systemPrompt);
}

// 6. TRUTH / QA AGENT
export async function runTruthQAAgent(message: MessageOutput, research: ResearchOutput): Promise<{ passed: boolean; reasons: string[] }> {
  const ai = getAIProvider();
  const prompt = `Truth / QA Agent verification pass on message:
Subject: ${message?.subject}
Body: ${message?.body}

Observed Evidence:
${JSON.stringify(research?.observable_website_findings || [])}

Check:
1. Did we actually observe the mentioned detail?
2. Are there any forbidden spam phrases?
3. Is there any fabricated metric or claim?

Return JSON: { passed: boolean, reasons: string[] }`;

  return ai.generateStructuredJSON<{ passed: boolean; reasons: string[] }>(prompt);
}

// 7. RESPONSE CLASSIFIER AGENT
export interface ResponseClassification {
  classification:
    | 'NOT_INTERESTED'
    | 'NO_RESPONSE'
    | 'OUT_OF_OFFICE'
    | 'WRONG_PERSON'
    | 'CURIOUS'
    | 'MAYBE'
    | 'NEEDS_MORE_INFORMATION'
    | 'INTERESTED'
    | 'BUYING_INTENT'
    | 'MEETING_REQUEST'
    | 'PRICE_REQUEST'
    | 'PROPOSAL_REQUEST'
    | 'PARTNERSHIP_INTEREST'
    | 'UNSUBSCRIBE'
    | 'NEGATIVE'
    | 'UNKNOWN';
  confidence: number;
  reason: string;
  recommended_action: string;
  automation_allowed: boolean;
}

export async function runResponseClassifier(rawText: string): Promise<ResponseClassification> {
  const ai = getAIProvider();
  const systemPrompt = `You are Project Buddy's Response Classifier Agent.
Classify prospect reply into one of 16 categories:
NOT_INTERESTED, NO_RESPONSE, OUT_OF_OFFICE, WRONG_PERSON, CURIOUS, MAYBE, NEEDS_MORE_INFORMATION, INTERESTED, BUYING_INTENT, MEETING_REQUEST, PRICE_REQUEST, PROPOSAL_REQUEST, PARTNERSHIP_INTEREST, UNSUBSCRIBE, NEGATIVE, UNKNOWN.

CRITICAL RULE: INTERESTED, BUYING_INTENT, MEETING_REQUEST, PROPOSAL_REQUEST, PRICE_REQUEST, PARTNERSHIP_INTEREST MUST set automation_allowed = false and trigger HUMAN TAKEOVER.`;

  const prompt = `Response Classifier Agent: Classify this prospect message:
"${rawText}"

Return JSON { classification, confidence, reason, recommended_action, automation_allowed }.`;

  return ai.generateStructuredJSON<ResponseClassification>(prompt, systemPrompt);
}

// 8. AI RESPONSE COPILOT (HUMAN TAKEOVER ASSISTANT)
export interface ResponseCopilotOutput {
  what_they_said: string;
  what_it_probably_means: string;
  what_we_know: string[];
  what_we_dont_know: string[];
  what_not_to_assume: string[];
  recommended_response: string;
  next_discovery_question: string;
  commercial_implication: string;
}

export async function runResponseCopilot(rawText: string, research: ResearchOutput): Promise<ResponseCopilotOutput> {
  const ai = getAIProvider();
  const knowledge = loadKnowledgeContext();

  const prompt = `Prospect Reply: "${rawText}"
Company: ${research?.company_name} (${research?.industry})
Research Summary: ${research?.company_summary}
Observed Friction: ${JSON.stringify(research?.observable_website_findings || [])}

${knowledge}

Generate founder takeover guidance JSON:
what_they_said, what_it_probably_means, what_we_know, what_we_dont_know, what_not_to_assume, recommended_response, next_discovery_question, commercial_implication.`;

  return ai.generateStructuredJSON<ResponseCopilotOutput>(prompt);
}
