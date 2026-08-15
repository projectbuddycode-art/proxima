-- ========================================================================
-- PROXIMA BY PROJECT BUDDY — PRODUCTION POSTGRESQL DDL MIGRATION SCHEMA
-- Compatible with Neon, Vercel Postgres, Supabase, Cloud SQL
-- ========================================================================

CREATE TABLE IF NOT EXISTS pairing_codes (
  id VARCHAR(255) PRIMARY KEY,
  pairing_code VARCHAR(10) NOT NULL,
  expires_at BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS bridge_sessions (
  id VARCHAR(255) PRIMARY KEY,
  bridge_id VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  machine_id VARCHAR(255),
  os VARCHAR(50),
  arch VARCHAR(50),
  ollama_version VARCHAR(50),
  models JSONB,
  active_model VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'CONNECTED',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id VARCHAR(255) PRIMARY KEY,
  request_id VARCHAR(255) UNIQUE NOT NULL,
  job_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  payload JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
  result JSONB,
  latency_ms INTEGER,
  bridge_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  domain VARCHAR(255),
  industry VARCHAR(255),
  location VARCHAR(255),
  company_summary TEXT,
  decision_makers_json JSONB,
  products_services_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prospects (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) REFERENCES companies(id) ON DELETE SET NULL,
  name VARCHAR(255),
  contact_name VARCHAR(255),
  role VARCHAR(255),
  title VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  fit_score INTEGER DEFAULT 0,
  intent_score INTEGER DEFAULT 0,
  intent_level VARCHAR(50),
  confidence NUMERIC(5,2),
  human_takeover INTEGER DEFAULT 0,
  takeover_reason TEXT,
  status VARCHAR(50) DEFAULT 'DISCOVERED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(255),
  location VARCHAR(255),
  target_role VARCHAR(255),
  offer TEXT,
  min_intent INTEGER DEFAULT 70,
  min_fit INTEGER DEFAULT 70,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS research (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) REFERENCES companies(id) ON DELETE CASCADE,
  observable_website_findings JSONB,
  social_signals JSONB,
  hiring_signals JSONB,
  expansion_signals JSONB,
  review_signals JSONB,
  buying_signals JSONB,
  pain_hypotheses JSONB,
  recommended_project_buddy_capability TEXT,
  recommended_offer TEXT,
  reason_to_contact_now TEXT,
  confidence NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
  id VARCHAR(255) PRIMARY KEY,
  prospect_id VARCHAR(255) REFERENCES prospects(id) ON DELETE CASCADE,
  problem TEXT,
  business_impact TEXT,
  recommended_solution_category TEXT,
  recommended_offer TEXT,
  why_this_offer TEXT,
  estimated_commercial_band TEXT,
  discovery_question TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(255) PRIMARY KEY,
  prospect_id VARCHAR(255) REFERENCES prospects(id) ON DELETE CASCADE,
  campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  score NUMERIC(5,2),
  qa_passed INTEGER DEFAULT 0,
  qa_reasons_json JSONB,
  status VARCHAR(50) DEFAULT 'QUEUED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outreach_messages (
  id VARCHAR(255) PRIMARY KEY,
  prospect_id VARCHAR(255) REFERENCES prospects(id) ON DELETE CASCADE,
  campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PREPARED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS responses (
  id VARCHAR(255) PRIMARY KEY,
  prospect_id VARCHAR(255) REFERENCES prospects(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  raw_text TEXT NOT NULL,
  classification VARCHAR(50) NOT NULL,
  confidence NUMERIC(5,2),
  reason TEXT,
  recommended_action TEXT,
  automation_allowed INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS followups (
  id VARCHAR(255) PRIMARY KEY,
  prospect_id VARCHAR(255) REFERENCES prospects(id) ON DELETE CASCADE,
  step INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sources (
  id VARCHAR(255) PRIMARY KEY,
  research_id VARCHAR(255) REFERENCES research(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proxima_logs (
  id VARCHAR(255) PRIMARY KEY,
  stage VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_observations (
  id VARCHAR(255) PRIMARY KEY,
  target_domain VARCHAR(255) NOT NULL,
  https_enabled INTEGER DEFAULT 1,
  security_headers_present JSONB,
  missing_security_headers JSONB,
  public_tech_signature JSONB,
  robots_txt_status VARCHAR(50),
  sitemap_status VARCHAR(50),
  observation_summary TEXT,
  project_buddy_remediation_opportunity TEXT,
  confidence NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS proxima_activity_logs (
  id VARCHAR(255) PRIMARY KEY,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS strategies (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  target VARCHAR(255),
  search_pattern TEXT,
  source VARCHAR(255),
  success_rate NUMERIC(5,2),
  prospects_found INTEGER DEFAULT 0,
  qualified_prospects INTEGER DEFAULT 0,
  meetings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS experiments (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  hypothesis TEXT,
  target_industry VARCHAR(255),
  sample_size INTEGER DEFAULT 0,
  qualified_rate NUMERIC(5,2),
  reply_rate NUMERIC(5,2),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  recommendation TEXT,
  conversion_rate NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS strategy_experiments (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  hypothesis TEXT,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agents (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  goal TEXT,
  status VARCHAR(50) DEFAULT 'IDLE',
  tasks_completed INTEGER DEFAULT 0,
  tasks_rejected INTEGER DEFAULT 0,
  success_rate INTEGER DEFAULT 100,
  confidence_avg INTEGER DEFAULT 85,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_pairing_codes_code ON pairing_codes(pairing_code);
CREATE INDEX IF NOT EXISTS idx_bridge_sessions_token ON bridge_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_request ON ai_jobs(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
