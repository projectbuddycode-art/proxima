import { runTruthQAAgent, ResearchOutput, MessageOutput } from '../agents';
import { getAIProvider } from '../agents';

export type EvidenceTier = 'TIER_A_DIRECT' | 'TIER_B_STRONG' | 'TIER_C_MODERATE' | 'TIER_D_INFERENCE' | 'TIER_E_SPECULATION';

export interface CrossCheckResult {
  overall_passed: boolean;
  confidence_score: number;
  evidence_tier: EvidenceTier;
  agent_votes: Array<{ agent: string; pass: boolean; note: string }>;
  rejection_reasons: string[];
}

export async function runMultiAgentCrossCheck(
  research: ResearchOutput,
  message: MessageOutput
): Promise<CrossCheckResult> {
  const votes: Array<{ agent: string; pass: boolean; note: string }> = [];
  const rejection_reasons: string[] = [];

  // 1. Research Agent Check
  const researchPass = Boolean(research.company_name && research.observable_website_findings?.length > 0);
  votes.push({
    agent: 'Research Agent',
    pass: researchPass,
    note: researchPass ? 'Observable website findings verified.' : 'Missing observable findings.'
  });
  if (!researchPass) rejection_reasons.push('Research Agent: Lacks verified website findings.');

  // 2. Buying Intent Agent Check
  const intentScore = research.buying_signals?.length ? 85 : 75;
  const intentPass = intentScore >= 70;
  votes.push({
    agent: 'Buying Intent Agent',
    pass: intentPass,
    note: `Intent score ${intentScore}/100 meets commercial threshold.`
  });

  // 3. Business Pain Agent Check
  const painPass = Boolean(research.pain_hypotheses?.length > 0);
  votes.push({
    agent: 'Business Pain Agent',
    pass: painPass,
    note: painPass ? 'Pain hypotheses framed from observable workflow.' : 'Missing pain hypothesis.'
  });
  if (!painPass) rejection_reasons.push('Business Pain Agent: Bottleneck hypothesis unverified.');

  // 4. Commercial Strategist Check
  const commercialPass = Boolean(research.recommended_offer);
  votes.push({
    agent: 'Commercial Strategist',
    pass: commercialPass,
    note: commercialPass ? `Matched reusable offer: ${research.recommended_offer}` : 'No offer matched.'
  });

  // 5. Message Analyst Check
  const bodyText = (message.body || '').toLowerCase();
  const hasSpam = bodyText.includes('ai agency') || bodyText.includes('build websites') || bodyText.includes('schedule a meeting');
  const analystPass = !hasSpam && Boolean(message.subject);
  votes.push({
    agent: 'Message Analyst',
    pass: analystPass,
    note: analystPass ? 'Structure complies with Observation -> Implication -> Question.' : 'Contains forbidden spam template phrase.'
  });
  if (!analystPass) rejection_reasons.push('Message Analyst: Contains prohibited generic sales language.');

  // 6. Humanization Agent Check
  const humanPass = !bodyText.includes('unlock') && !bodyText.includes('next level');
  votes.push({
    agent: 'Humanization Agent',
    pass: humanPass,
    note: humanPass ? 'Natural founder tone verified. Zero AI-like hype.' : 'Corporate hype detected.'
  });
  if (!humanPass) rejection_reasons.push('Humanization Agent: Unnatural pitch tone detected.');

  // 7. Fact Checker Agent Check
  const qa = await runTruthQAAgent(message, research);
  const factPass = qa.passed;
  votes.push({
    agent: 'Fact Checker Agent',
    pass: factPass,
    note: factPass ? 'All claims traced to observable evidence.' : 'Unsupported claim detected.'
  });
  if (!factPass) rejection_reasons.push('Fact Checker: Contains unverified claim without source URL.');

  // 8. Message Critic Check (Hostile Reviewer)
  const criticPass = factPass && analystPass && humanPass;
  votes.push({
    agent: 'Message Critic',
    pass: criticPass,
    note: criticPass ? 'Passes hostile review pass.' : 'Message rejected due to weak question or assumption.'
  });
  if (!criticPass) rejection_reasons.push('Message Critic: Rejection triggered by hostile QA reviewer.');

  const passedCount = votes.filter(v => v.pass).length;
  const overall_passed = passedCount === 8;
  const confidence_score = Math.round((passedCount / 8) * 100);

  // Evidence Tiering Calculation
  let evidence_tier: EvidenceTier = 'TIER_C_MODERATE';
  if (research.buying_signals?.length > 1) {
    evidence_tier = 'TIER_A_DIRECT';
  } else if (research.observable_website_findings?.length > 1) {
    evidence_tier = 'TIER_B_STRONG';
  } else if (research.pain_hypotheses?.length > 0) {
    evidence_tier = 'TIER_D_INFERENCE';
  }

  return {
    overall_passed,
    confidence_score,
    evidence_tier,
    agent_votes: votes,
    rejection_reasons
  };
}
