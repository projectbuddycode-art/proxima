import { getDb, AgentRecord } from '../../db';

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  goal: string;
  inputs: string[];
  outputs: string[];
  confidence_threshold: number;
  model_tier: 'fast' | 'strong';
}

export const SYSTEM_AGENTS: AgentDefinition[] = [
  {
    id: 'ORCHESTRATOR',
    name: 'Sales Team Orchestrator',
    role: 'Virtual Sales Team Manager',
    goal: 'Coordinates tasks, prioritizes opportunities, resolves agent disagreements, and enforces truthfulness & takeover rules.',
    inputs: ['Campaign Objectives', 'Agent Outputs', 'Confidence Scores'],
    outputs: ['Task Assignments', 'Lead Authorization', 'Handoff Triggers'],
    confidence_threshold: 80,
    model_tier: 'strong'
  },
  {
    id: 'MARKET_SCOUT',
    name: 'Market Scout Agent',
    role: 'Vertical & Market Discovery Specialist',
    goal: 'Discovers new business categories, workflow bottlenecks, and modernization opportunities beyond standard industries.',
    inputs: ['Public Directories', 'Industry Trends', 'Expansion Signals'],
    outputs: ['Market Opportunity Briefs', 'Target Signals'],
    confidence_threshold: 75,
    model_tier: 'strong'
  },
  {
    id: 'PROSPECT_HUNTER',
    name: 'Prospect Hunter Agent',
    role: 'Company Discovery Specialist',
    goal: 'Generates dynamic search query variations across industry, hiring, expansion, and partner signals to find companies.',
    inputs: ['Search Queries', 'Business Listings', 'Directory Datasets'],
    outputs: ['Discovered Company Records'],
    confidence_threshold: 70,
    model_tier: 'fast'
  },
  {
    id: 'SIGNAL_HUNTER',
    name: 'Signal Hunter Agent',
    role: 'Buying Signal Detective',
    goal: 'Finds verified reasons to contact now (hiring, expansion, quote friction, project announcements) with URL provenance.',
    inputs: ['Web Signals', 'Hiring Posts', 'Public Announcements'],
    outputs: ['Verified Signal Records with Sources'],
    confidence_threshold: 80,
    model_tier: 'fast'
  },
  {
    id: 'COMPANY_RESEARCHER',
    name: 'Company Researcher Agent',
    role: 'Corporate Business Intelligence Analyst',
    goal: 'Analyzes business model, offerings, customer type, maturity, and contact mechanisms.',
    inputs: ['Company Website', 'Public Metadata'],
    outputs: ['Structured Company Intelligence'],
    confidence_threshold: 75,
    model_tier: 'fast'
  },
  {
    id: 'DECISION_MAKER_FINDER',
    name: 'Decision-Maker Finder Agent',
    role: 'Key Executive Investigator',
    goal: 'Identifies verified founders, CEOs, MDs, or ops heads. Marks UNKNOWN if unverified.',
    inputs: ['Company Leadership Data', 'Public Profiles'],
    outputs: ['Verified Decision-Maker Contact'],
    confidence_threshold: 85,
    model_tier: 'fast'
  },
  {
    id: 'WEBSITE_ANALYST',
    name: 'Website Customer Journey Analyst',
    role: 'Digital Friction Auditor',
    goal: 'Evaluates observable website lead capture, catalogue presentation, RFQ flow, and mobile experience friction.',
    inputs: ['Website Content', 'Forms & CTAs'],
    outputs: ['Observable Website Findings'],
    confidence_threshold: 80,
    model_tier: 'fast'
  },
  {
    id: 'REVIEW_ANALYST',
    name: 'Review Intelligence Agent',
    role: 'Public Reputation & Complaints Analyst',
    goal: 'Identifies recurring customer complaints (quote turnaround delays, support friction) across public reviews.',
    inputs: ['Public Reviews', 'Customer Feedback'],
    outputs: ['Recurring Friction Patterns'],
    confidence_threshold: 75,
    model_tier: 'fast'
  },
  {
    id: 'BUYING_INTENT_ANALYST',
    name: 'Buying-Intent Analyst Agent',
    role: 'Commercial Intent Evaluator',
    goal: 'Distinguishes explicit project demand from weak signals, assigning intent score 0-100 and rationale.',
    inputs: ['Verified Signals', 'Research Data'],
    outputs: ['Intent Score (High/Med/Low) & Rationale'],
    confidence_threshold: 80,
    model_tier: 'strong'
  },
  {
    id: 'BUSINESS_PAIN_ANALYST',
    name: 'Business-Pain Analyst Agent',
    role: 'Process & Bottleneck Formulator',
    goal: 'Formulates Observation -> Process -> Bottleneck -> Impact -> Discovery Question hypotheses.',
    inputs: ['Website Findings', 'Review Signals'],
    outputs: ['Business Pain Hypotheses'],
    confidence_threshold: 75,
    model_tier: 'strong'
  },
  {
    id: 'COMMERCIAL_STRATEGIST',
    name: 'Commercial Strategist Agent',
    role: 'Solution Scope Architect',
    goal: 'Selects the smallest effective commercial intervention (Digital Showroom, Automation, CRM/ERP, Technical Partnership).',
    inputs: ['Pain Hypotheses', 'PB Capability Library'],
    outputs: ['Commercial Strategy & Discovery Question'],
    confidence_threshold: 85,
    model_tier: 'strong'
  },
  {
    id: 'OFFER_MATCHER',
    name: 'Offer Matcher Agent',
    role: 'Project Buddy Offer Specialist',
    goal: 'Matches prospect category and bottleneck to standardized PB offer playbooks.',
    inputs: ['Commercial Strategy', 'Offer Library'],
    outputs: ['Matched Offer & Value Angle'],
    confidence_threshold: 85,
    model_tier: 'fast'
  },
  {
    id: 'MESSAGE_ANALYST',
    name: 'Message Analyst Agent',
    role: 'Outreach Brief Creator',
    goal: 'Formulates comprehensive Message Brief before drafting.',
    inputs: ['Research', 'Intent', 'Pain', 'Offer'],
    outputs: ['Message Brief Document'],
    confidence_threshold: 80,
    model_tier: 'fast'
  },
  {
    id: 'MESSAGE_WRITER',
    name: 'Message Writer Agent',
    role: 'Personalized Copywriter',
    goal: 'Drafts unique personalized outreach adhering strictly to Observation -> Implication -> Question.',
    inputs: ['Message Brief'],
    outputs: ['Draft Outreach Copy'],
    confidence_threshold: 80,
    model_tier: 'strong'
  },
  {
    id: 'HUMANIZATION_AGENT',
    name: 'Humanization Agent',
    role: 'Tone & Polishing Editor',
    goal: 'Strips AI-like fluff, corporate jargon, and sales pitchiness while preserving factual claims.',
    inputs: ['Draft Outreach Copy'],
    outputs: ['Humanized Copy'],
    confidence_threshold: 85,
    model_tier: 'strong'
  },
  {
    id: 'MESSAGE_CRITIC',
    name: 'Message Critic Agent',
    role: 'Hostile QA Reviewer',
    goal: 'Attempts to reject messages containing generic hype, unsupported assumptions, or weak questions.',
    inputs: ['Humanized Copy', 'Message Brief'],
    outputs: ['Critic Pass/Fail & Rejection Reasons'],
    confidence_threshold: 90,
    model_tier: 'strong'
  },
  {
    id: 'FACT_CHECKER',
    name: 'Fact Check Agent',
    role: 'Source Traceability Auditor',
    goal: 'Verifies every claim against observable evidence and source URLs. Strips unverified claims.',
    inputs: ['Draft Copy', 'Sources Store'],
    outputs: ['Fact Check Report & Clean Copy'],
    confidence_threshold: 95,
    model_tier: 'fast'
  },
  {
    id: 'CHANNEL_STRATEGIST',
    name: 'Channel Strategist Agent',
    role: 'Outreach Channel Optimizer',
    goal: 'Selects optimal channel (Email, LinkedIn workflow, WhatsApp adapter).',
    inputs: ['Prospect Contact Data', 'Channel Constraints'],
    outputs: ['Primary & Secondary Channel Choice'],
    confidence_threshold: 80,
    model_tier: 'fast'
  },
  {
    id: 'FOLLOW_UP_AGENT',
    name: 'Follow-Up Cadence Scheduler',
    role: 'Value Cadence Specialist',
    goal: 'Schedules Day 2, Day 5, Day 8 value-added follow-up cadences without generic fluff.',
    inputs: ['Sent Outreach', 'Cadence Rules'],
    outputs: ['Scheduled Value Follow-ups'],
    confidence_threshold: 85,
    model_tier: 'fast'
  },
  {
    id: 'RESPONSE_CLASSIFIER',
    name: 'Response Classifier Agent',
    role: 'Reply Intent Categorizer',
    goal: 'Classifies incoming prospect replies into 16 categories.',
    inputs: ['Raw Reply Text'],
    outputs: ['Classification & Automation Flag'],
    confidence_threshold: 85,
    model_tier: 'fast'
  },
  {
    id: 'POSITIVE_INTEREST_DETECTOR',
    name: 'Positive Interest Detector Agent',
    role: 'High-Sensitivity Intent Detector',
    goal: 'Detects genuine commercial interest or buying signals in prospect messages.',
    inputs: ['Reply Classification', 'Context'],
    outputs: ['Positive Interest Alert'],
    confidence_threshold: 90,
    model_tier: 'strong'
  },
  {
    id: 'CONVERSATION_MANAGER',
    name: 'Conversation Manager Agent',
    role: 'Pre-Interest Dialogue Guide',
    goal: 'Handles preliminary curiosity questions using low-friction discovery questions.',
    inputs: ['Prospect Question', 'Knowledge Base'],
    outputs: ['Guided Pre-Interest Reply'],
    confidence_threshold: 80,
    model_tier: 'strong'
  },
  {
    id: 'HUMAN_HANDOFF_AGENT',
    name: 'Human Handoff Agent',
    role: 'Founder Takeover Enforcer',
    goal: 'Halts automation, creates HOT LEAD, and notifies Shivam: "Shivam, this one is yours."',
    inputs: ['Positive Interest Signal', 'Prospect Context'],
    outputs: ['Human Takeover Notification & Brief'],
    confidence_threshold: 95,
    model_tier: 'fast'
  },
  {
    id: 'LEARNING_AGENT',
    name: 'Learning & Feedback Agent',
    role: 'Commercial Outcome Analyst',
    goal: 'Analyzes differences between AI drafts and founder edits to refine system rules.',
    inputs: ['Original vs Edited Copy', 'Outreach Outcomes'],
    outputs: ['System Style & Rule Recommendations'],
    confidence_threshold: 80,
    model_tier: 'strong'
  },
  {
    id: 'STRATEGY_GENERATOR',
    name: 'Strategy Generator Agent',
    role: 'Prospecting Innovation Specialist',
    goal: 'Proposes new discovery strategy experiments based on response patterns.',
    inputs: ['Campaign Analytics', 'Signal Outcomes'],
    outputs: ['New Strategy Experiments'],
    confidence_threshold: 75,
    model_tier: 'strong'
  },
  {
    id: 'PERFORMANCE_ANALYST',
    name: 'Agent Performance Analyst',
    role: 'System Quality Controller',
    goal: 'Tracks agent scorecards, rejection rates, false positive rates, and execution compute.',
    inputs: ['Agent Execution Logs'],
    outputs: ['Agent Scorecards & Health Metrics'],
    confidence_threshold: 85,
    model_tier: 'fast'
  },
  {
    id: 'SYSTEM_AUDITOR',
    name: 'System Auditor Agent',
    role: 'Safety & Self-Audit Guard',
    goal: 'Runs daily audits to ensure zero unverified claims, zero over-contacting, and active takeover enforcement.',
    inputs: ['Audit Logs', 'Database State'],
    outputs: ['Daily Health & Audit Report'],
    confidence_threshold: 90,
    model_tier: 'strong'
  }
];

export async function initializeAgentRegistry() {
  const db = getDb();
  for (const agentDef of SYSTEM_AGENTS) {
    // 1. Insert into legacy agents table for UI/API compatibility
    const existing = await db.queryOneAsync<AgentRecord>('SELECT * FROM agents WHERE id = ?', [agentDef.id]);
    if (!existing) {
      await db.executeAsync(
        'INSERT INTO agents (id, name, role, goal, status, tasks_completed, tasks_rejected, success_rate, confidence_avg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          agentDef.id,
          agentDef.name,
          agentDef.role,
          agentDef.goal,
          'IDLE',
          0,
          0,
          100,
          agentDef.confidence_threshold
        ]
      );
    }

    // 2. Insert into agent_definitions table
    try {
      const existingDef = await db.queryOneAsync('SELECT * FROM agent_definitions WHERE id = ?', [agentDef.id]);
      if (!existingDef) {
        await db.executeAsync(
          `INSERT INTO agent_definitions (id, name, role, category, goal, capabilities, model_tier, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            agentDef.id,
            agentDef.name,
            agentDef.role,
            'Acquisition',
            agentDef.goal,
            JSON.stringify({ inputs: agentDef.inputs, outputs: agentDef.outputs }),
            agentDef.model_tier === 'strong' ? 'strong' : 'deterministic_first',
            1
          ]
        );
      }
    } catch (e: any) {
      console.warn('[AGENT REGISTRY] agent_definitions write error:', e.message);
    }

    // 3. Insert into agent_workers table
    try {
      const existingWorker = await db.queryOneAsync('SELECT * FROM agent_workers WHERE agent_id = ?', [agentDef.id]);
      if (!existingWorker) {
        const workerId = `worker_${agentDef.id.toLowerCase()}_1`;
        await db.executeAsync(
          `INSERT INTO agent_workers (worker_id, agent_id, machine_id, status, current_run_id, current_task, last_heartbeat, started_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            workerId,
            agentDef.id,
            'local_bridge_machine',
            'IDLE',
            null,
            'Awaiting campaign trigger',
            new Date().toISOString(),
            new Date().toISOString()
          ]
        );
      }
    } catch (e: any) {
      console.warn('[AGENT REGISTRY] agent_workers write error:', e.message);
    }
  }
}

