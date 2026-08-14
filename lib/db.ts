import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');

export interface AgentRecord {
  id: string;
  name: string;
  role: string;
  goal: string;
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'ERROR';
  tasks_completed: number;
  tasks_rejected: number;
  success_rate: number;
  last_run?: string;
  confidence_avg: number;
}

export interface StrategyRecord {
  id: string;
  name: string;
  target: string;
  search_pattern: string;
  source: string;
  last_used?: string;
  success_rate: number;
  prospects_found: number;
  qualified_prospects: number;
  meetings: number;
}

export interface ExperimentRecord {
  id: string;
  hypothesis: string;
  target_industry: string;
  sample_size: number;
  qualified_rate: number;
  reply_rate: number;
  status: 'ACTIVE' | 'PASSED' | 'REJECTED';
  recommendation: string;
}

export interface ProximaActivityLog {
  id: string;
  timestamp: string;
  stage: string;
  message: string;
}

interface StoreData {
  companies: any[];
  contacts: any[];
  prospects: any[];
  research: any[];
  signals: any[];
  opportunities: any[];
  campaigns: any[];
  campaign_prospects: any[];
  messages: any[];
  followups: any[];
  conversations: any[];
  responses: any[];
  tasks: any[];
  sources: any[];
  decisions: any[];
  audit_logs: any[];
  agents: AgentRecord[];
  strategies: StrategyRecord[];
  experiments: ExperimentRecord[];
  security_observations: any[];
  proxima_logs: ProximaActivityLog[];
  settings: Record<string, string>;
  suppression_list: any[];
}

function loadStore(): StoreData {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        companies: parsed.companies || [],
        contacts: parsed.contacts || [],
        prospects: parsed.prospects || [],
        research: parsed.research || [],
        signals: parsed.signals || [],
        opportunities: parsed.opportunities || [],
        campaigns: parsed.campaigns || [],
        campaign_prospects: parsed.campaign_prospects || [],
        messages: parsed.messages || [],
        followups: parsed.followups || [],
        conversations: parsed.conversations || [],
        responses: parsed.responses || [],
        tasks: parsed.tasks || [],
        sources: parsed.sources || [],
        decisions: parsed.decisions || [],
        audit_logs: parsed.audit_logs || [],
        agents: parsed.agents || [],
        strategies: parsed.strategies || [],
        experiments: parsed.experiments || [],
        security_observations: parsed.security_observations || [],
        proxima_logs: parsed.proxima_logs || [],
        settings: parsed.settings || {
          app_name: 'PROXIMA',
          app_mode: 'REAL',
          ollama_base_url: 'http://localhost:11434',
          ollama_model: 'llama3',
          titan_email: 'shivam@projectbuddy.in',
          titan_enabled: 'true',
          map_offline: 'true'
        },
        suppression_list: parsed.suppression_list || []
      };
    } catch (e) {
      console.warn('Failed to load db.json, creating new store.');
    }
  }
  return {
    companies: [],
    contacts: [],
    prospects: [],
    research: [],
    signals: [],
    opportunities: [],
    campaigns: [],
    campaign_prospects: [],
    messages: [],
    followups: [],
    conversations: [],
    responses: [],
    tasks: [],
    sources: [],
    decisions: [],
    audit_logs: [],
    agents: [],
    strategies: [],
    experiments: [],
    security_observations: [],
    proxima_logs: [],
    settings: {
      app_name: 'PROXIMA',
      app_mode: 'REAL',
      ollama_base_url: 'http://localhost:11434',
      ollama_model: 'llama3',
      titan_email: 'shivam@projectbuddy.in',
      titan_enabled: 'true',
      map_offline: 'true'
    },
    suppression_list: []
  };
}

function saveStore(store: StoreData) {
  fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

class LocalDatabase {
  private getStore(): StoreData {
    return loadStore();
  }

  public prepare(sql: string) {
    const self = this;

    return {
      get: (...args: any[]) => {
        const store = self.getStore();
        const sqlLower = sql.toLowerCase().replace(/\s+/g, ' ');

        if (sqlLower.includes('from settings where key')) {
          const key = args[0];
          const val = store.settings[key];
          return val ? { key, value: val } : undefined;
        }

        if (sqlLower.includes('from campaigns where id')) {
          return store.campaigns.find(c => c.id === args[0]);
        }

        if (sqlLower.includes('from companies where id')) {
          return store.companies.find(c => c.id === args[0]);
        }

        if (sqlLower.includes('from companies where name') || sqlLower.includes('website =')) {
          return store.companies.find(c => c.name === args[0] || c.website === args[1]);
        }

        if (sqlLower.includes('from prospects p join companies c')) {
          const p = args[0] ? store.prospects.find(pr => pr.id === args[0]) : store.prospects[0];
          if (!p) return undefined;
          const c = store.companies.find(comp => comp.id === p.company_id) || {};
          return { ...p, company_name: c.name, website: c.website, industry: c.industry, location: c.location, company_summary: c.company_summary };
        }

        if (sqlLower.includes('from prospects where id')) {
          return store.prospects.find(pr => pr.id === args[0]);
        }

        if (sqlLower.includes('from research where company_id')) {
          return store.research.find(r => r.company_id === args[0]);
        }

        if (sqlLower.includes('from opportunities where prospect_id')) {
          return store.opportunities.find(o => o.prospect_id === args[0]);
        }

        if (sqlLower.includes('from messages where prospect_id')) {
          return store.messages.find(m => m.prospect_id === args[0]);
        }

        if (sqlLower.includes('from agents where id')) {
          return store.agents.find(a => a.id === args[0]);
        }

        if (sqlLower.includes('count(*) as cnt from prospects where human_takeover = 1')) {
          return { cnt: store.prospects.filter(p => p.human_takeover === 1).length };
        }

        if (sqlLower.includes('count(*) as cnt from prospects where intent_score >=')) {
          return { cnt: store.prospects.filter(p => p.intent_score >= 70).length };
        }

        if (sqlLower.includes('count(*) as cnt from prospects')) {
          return { cnt: store.prospects.length };
        }

        if (sqlLower.includes('count(*) as cnt from followups where prospect_id') && sqlLower.includes("status = 'scheduled'")) {
          return { cnt: store.followups.filter(f => f.prospect_id === args[0] && f.status === 'SCHEDULED').length };
        }

        if (sqlLower.includes('count(*) as cnt from campaigns where status')) {
          return { cnt: store.campaigns.filter(c => c.status === 'ACTIVE').length };
        }

        if (sqlLower.includes('count(*) as cnt from campaigns')) {
          return { cnt: store.campaigns.length };
        }

        if (sqlLower.includes('count(*) as cnt from messages')) {
          return { cnt: store.messages.length };
        }

        if (sqlLower.includes('count(*) as cnt from responses')) {
          return { cnt: store.responses.length };
        }

        return undefined;
      },
      all: (...args: any[]) => {
        const store = self.getStore();
        const sqlLower = sql.toLowerCase().replace(/\s+/g, ' ');

        if (sqlLower.includes('from agents')) {
          return store.agents;
        }

        if (sqlLower.includes('from strategies')) {
          return store.strategies;
        }

        if (sqlLower.includes('from experiments')) {
          return store.experiments;
        }

        if (sqlLower.includes('from security_observations')) {
          return store.security_observations;
        }

        if (sqlLower.includes('from proxima_logs')) {
          return store.proxima_logs;
        }

        if (sqlLower.includes('from campaigns')) {
          return [...store.campaigns].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        }

        if (sqlLower.includes('from prospects p join companies c')) {
          let list = store.prospects.map(p => {
            const c = store.companies.find(comp => comp.id === p.company_id) || {};
            return { ...p, company_name: c.name, website: c.website, industry: c.industry, location: c.location };
          });
          if (sqlLower.includes('human_takeover = 1')) {
            list = list.filter(p => p.human_takeover === 1);
          }
          return list.sort((a, b) => b.intent_score - a.intent_score);
        }

        if (sqlLower.includes('from messages where prospect_id')) {
          return store.messages.filter(m => m.prospect_id === args[0]);
        }

        if (sqlLower.includes('from responses where prospect_id')) {
          return store.responses.filter(r => r.prospect_id === args[0]);
        }

        if (sqlLower.includes('from followups where prospect_id')) {
          return store.followups.filter(f => f.prospect_id === args[0]);
        }

        if (sqlLower.includes('from sources where research_id')) {
          return store.sources.filter(s => s.research_id === args[0]);
        }

        if (sqlLower.includes('from messages')) {
          return store.messages;
        }

        return [];
      },
      run: (...args: any[]) => {
        const store = self.getStore();
        const sqlLower = sql.toLowerCase().replace(/\s+/g, ' ');

        if (sqlLower.includes('insert into proxima_logs')) {
          const [id, stage, message] = args;
          store.proxima_logs.unshift({ id, timestamp: new Date().toLocaleTimeString(), stage, message });
          if (store.proxima_logs.length > 50) store.proxima_logs.pop();
          saveStore(store);
          return;
        }

        if (sqlLower.includes('insert into security_observations')) {
          const obs = args[0];
          store.security_observations.push(obs);
          saveStore(store);
          return;
        }

        if (sqlLower.includes('insert or ignore into settings')) {
          const [key, value] = args;
          if (!store.settings[key]) {
            store.settings[key] = value;
            saveStore(store);
          }
          return;
        }

        if (sqlLower.includes('upsert into agents') || sqlLower.includes('insert into agents')) {
          const agent = args[0] as AgentRecord;
          const idx = store.agents.findIndex(a => a.id === agent.id);
          if (idx >= 0) {
            store.agents[idx] = { ...store.agents[idx], ...agent };
          } else {
            store.agents.push(agent);
          }
          saveStore(store);
          return;
        }

        if (sqlLower.includes('insert into strategies')) {
          const strat = args[0] as StrategyRecord;
          store.strategies.push(strat);
          saveStore(store);
          return;
        }

        if (sqlLower.includes('insert into experiments')) {
          const exp = args[0] as ExperimentRecord;
          store.experiments.push(exp);
          saveStore(store);
          return;
        }

        if (sqlLower.includes('insert into companies')) {
          const [id, name, website, industry, location, company_summary, decision_makers_json, products_services_json] = args;
          store.companies.push({ id, name, website, industry, location, company_summary, decision_makers_json, products_services_json, created_at: new Date().toISOString() });
          saveStore(store);
          return;
        }

        if (sqlLower.includes('insert into prospects')) {
          const [id, company_id, contact_name, role, email, phone, status] = args;
          store.prospects.push({
            id, company_id, contact_name, role, email, phone, status,
            fit_score: 0, intent_score: 0, intent_level: 'low', confidence: 0.85,
            human_takeover: 0, created_at: new Date().toISOString()
          });
          saveStore(store);
          return;
        }

        if (sqlLower.includes('update prospects set human_takeover = 1')) {
          const [takeover_reason, prospectId] = args;
          const p = store.prospects.find(pr => pr.id === prospectId);
          if (p) {
            p.human_takeover = 1;
            p.takeover_reason = takeover_reason;
            p.status = 'HUMAN_TAKEOVER';
            saveStore(store);
          }
          return;
        }

        if (sqlLower.includes('update prospects set fit_score')) {
          const [fit_score, intent_score, intent_level, confidence, status, prospectId] = args;
          const p = store.prospects.find(pr => pr.id === prospectId);
          if (p) {
            p.fit_score = fit_score;
            p.intent_score = intent_score;
            p.intent_level = intent_level;
            p.confidence = confidence;
            p.status = status;
            saveStore(store);
          }
          return;
        }

        if (sqlLower.includes('update prospects set status =')) {
          const [status, prospectId] = args;
          const p = store.prospects.find(pr => pr.id === prospectId);
          if (p) {
            p.status = status;
            saveStore(store);
          }
          return;
        }

        if (sqlLower.includes('insert into research')) {
          const [id, company_id, observable_website_findings, social_signals, hiring_signals, expansion_signals, review_signals, buying_signals, pain_hypotheses, capability, offer, reason, confidence] = args;
          store.research.push({ id, company_id, observable_website_findings, social_signals, hiring_signals, expansion_signals, review_signals, buying_signals, pain_hypotheses, recommended_project_buddy_capability: capability, recommended_offer: offer, reason_to_contact_now: reason, confidence });
          saveStore(store);
          return;
        }

        if (sqlLower.includes('insert into sources')) {
          const [id, research_id, url, title, type, snippet, confidence] = args;
          store.sources.push({ id, research_id, url, title, type, snippet, confidence });
          saveStore(store);
          return;
        }

        if (sqlLower.includes('insert into opportunities')) {
          const [id, prospect_id, problem, business_impact, solution_cat, offer, why_offer, band, disc_q] = args;
          store.opportunities.push({ id, prospect_id, problem, business_impact, recommended_solution_category: solution_cat, recommended_offer: offer, why_this_offer: why_offer, estimated_commercial_band: band, discovery_question: disc_q });
          saveStore(store);
          return;
        }

        if (sqlLower.includes('insert into messages')) {
          const [id, prospect_id, campaign_id, channel, subject, body, score, qa_passed, qa_reasons_json, status] = args;
          store.messages.push({ id, prospect_id, campaign_id, channel, subject, body, score, qa_passed, qa_reasons_json, status, created_at: new Date().toISOString() });
          saveStore(store);
          return;
        }

        if (sqlLower.includes('insert into campaigns')) {
          const [id, name, industry, location, target_role, offer, min_intent, min_fit, status] = args;
          store.campaigns.push({ id, name, industry, location, target_role, offer, min_intent, min_fit, status, created_at: new Date().toISOString() });
          saveStore(store);
          return;
        }

        if (sqlLower.includes('insert into campaign_prospects')) {
          const [id, campaign_id, prospect_id, status] = args;
          store.campaign_prospects.push({ id, campaign_id, prospect_id, status, added_at: new Date().toISOString() });
          saveStore(store);
          return;
        }

        if (sqlLower.includes('insert into followups')) {
          const [id, prospect_id, message_id, step, scheduled_at, status, reason] = args;
          store.followups.push({ id, prospect_id, message_id, step, scheduled_at, status, reason });
          saveStore(store);
          return;
        }

        if (sqlLower.includes('insert into responses')) {
          const [id, prospect_id, channel, raw_text, classification, confidence, reason, rec_action, auto_allowed] = args;
          store.responses.push({ id, prospect_id, channel, raw_text, classification, confidence, reason, recommended_action: rec_action, automation_allowed: auto_allowed, received_at: new Date().toISOString() });
          saveStore(store);
          return;
        }

        if (sqlLower.includes('insert into tasks')) {
          const [id, title, type, payload_json, status] = args;
          store.tasks.push({ id, title, type, payload_json, status, created_at: new Date().toISOString() });
          saveStore(store);
          return;
        }

        if (sqlLower.includes('update followups set status =')) {
          const [status, reason, prospect_id] = args;
          store.followups.filter(f => f.prospect_id === prospect_id).forEach(f => {
            f.status = status;
            f.reason = reason;
          });
          saveStore(store);
          return;
        }
      }
    };
  }

  public exec(sql: string) {}
}

let dbInstance: LocalDatabase | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new LocalDatabase();
  }
  return dbInstance;
}

export function initDb() {
  getDb();
  console.log('✅ Local Database Initialized Successfully.');
}

if (require.main === module) {
  initDb();
}
