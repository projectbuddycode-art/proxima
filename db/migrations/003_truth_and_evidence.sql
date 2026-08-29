-- ========================================================================
-- PROXIMA BY PROJECT BUDDY — PRODUCTION POSTGRESQL SCHEMA
-- Migration 003: Truth, Evidence, Opportunities Mesh & Real Agent Runtime
-- ========================================================================

-- 1. Unified Evidence Table
CREATE TABLE IF NOT EXISTS prospect_evidence (
  id VARCHAR(255) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'prospect', 'company', 'signal', 'agent_run', 'deployment', 'research', 'system_health'
  entity_id VARCHAR(255) NOT NULL,
  claim_type VARCHAR(100) NOT NULL,
  source VARCHAR(100) NOT NULL,
  source_url TEXT,
  observed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  confidence INTEGER NOT NULL DEFAULT 80, -- 0-100
  freshness_score INTEGER NOT NULL DEFAULT 100, -- 0-100
  payload JSONB,
  content_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prospect_evidence_entity ON prospect_evidence(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_prospect_evidence_hash ON prospect_evidence(content_hash);
CREATE INDEX IF NOT EXISTS idx_prospect_evidence_claim ON prospect_evidence(claim_type);

-- 2. Prospect Signals Table
CREATE TABLE IF NOT EXISTS prospect_signals (
  id VARCHAR(255) PRIMARY KEY,
  prospect_id VARCHAR(255) REFERENCES prospects(id) ON DELETE CASCADE,
  company_id VARCHAR(255) REFERENCES companies(id) ON DELETE CASCADE,
  signal_type VARCHAR(50) NOT NULL, -- 'HIRING', 'EXPANSION', 'WEBSITE_GAP', 'TECH_STACK', 'REVIEW', 'LEAD_FLOW'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  evidence_id VARCHAR(255) REFERENCES prospect_evidence(id) ON DELETE SET NULL,
  source_url TEXT,
  confidence INTEGER DEFAULT 80,
  freshness_score INTEGER DEFAULT 100,
  observed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prospect_signals_prospect ON prospect_signals(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_signals_type ON prospect_signals(signal_type);

-- 3. Website Audits Table
CREATE TABLE IF NOT EXISTS website_audits (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) REFERENCES companies(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status_code INTEGER,
  load_time_ms INTEGER,
  has_https BOOLEAN DEFAULT TRUE,
  has_mobile_viewport BOOLEAN DEFAULT TRUE,
  has_contact_form BOOLEAN DEFAULT FALSE,
  has_whatsapp_flow BOOLEAN DEFAULT FALSE,
  has_email_link BOOLEAN DEFAULT FALSE,
  has_phone_link BOOLEAN DEFAULT FALSE,
  has_lead_capture BOOLEAN DEFAULT FALSE,
  tech_stack JSONB,
  observations JSONB,
  evidence_ids JSONB,
  audit_summary TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_website_audits_company ON website_audits(company_id);

-- 4. Partnerships Pipeline Table
CREATE TABLE IF NOT EXISTS partnerships (
  id VARCHAR(255) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'MARKETING_AGENCY', 'BRANDING_STUDIO', 'DESIGN_STUDIO', 'SOFTWARE_CONSULTANCY', 'ERP_CONSULTANT', 'SAAS_COMPANY', 'OVERSEAS_AGENCY'
  website VARCHAR(255),
  location VARCHAR(255),
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  synergy_summary TEXT,
  partnership_model VARCHAR(100), -- 'WHITE_LABEL_EXECUTION', 'REVENUE_SHARE', 'REFERRAL', 'INTEGRATION'
  status VARCHAR(50) DEFAULT 'IDENTIFIED', -- 'IDENTIFIED', 'OUTREACH_PENDING', 'CONTACTED', 'DISCUSSION', 'AGREEMENT', 'ACTIVE', 'INACTIVE'
  estimated_monthly_value INTEGER DEFAULT 0,
  evidence_ids JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partnerships_status ON partnerships(status);
CREATE INDEX IF NOT EXISTS idx_partnerships_category ON partnerships(category);

-- 5. Referral Opportunities Table
CREATE TABLE IF NOT EXISTS referrals (
  id VARCHAR(255) PRIMARY KEY,
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  organization VARCHAR(255),
  relationship VARCHAR(100), -- 'CLIENT', 'PARTNER', 'ALUMNI', 'INDUSTRY_PEER', 'ADVISOR'
  source_contact_id VARCHAR(255),
  target_prospect_id VARCHAR(255) REFERENCES prospects(id) ON DELETE SET NULL,
  introduction_status VARCHAR(50) DEFAULT 'REQUESTED', -- 'REQUESTED', 'INTRODUCED', 'FOLLOWED_UP', 'CONVERTED', 'DECLINED'
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  cooldown_until TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  outcome VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(introduction_status);

-- 6. Real Agent Execution Runtime Tables
CREATE TABLE IF NOT EXISTS agent_definitions (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  goal TEXT,
  capabilities JSONB,
  model_tier VARCHAR(50) DEFAULT 'deterministic_first',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_workers (
  worker_id VARCHAR(255) PRIMARY KEY,
  agent_id VARCHAR(255) REFERENCES agent_definitions(id) ON DELETE CASCADE,
  machine_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'IDLE', -- 'IDLE', 'RUNNING', 'STALE', 'OFFLINE', 'DISABLED'
  current_run_id VARCHAR(255),
  current_task TEXT,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_runs (
  run_id VARCHAR(255) PRIMARY KEY,
  agent_id VARCHAR(255) REFERENCES agent_definitions(id) ON DELETE CASCADE,
  worker_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'STALE'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  input JSONB,
  output_summary TEXT,
  output_payload JSONB,
  tools_used JSONB,
  evidence_ids JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);

CREATE TABLE IF NOT EXISTS agent_events (
  id VARCHAR(255) PRIMARY KEY,
  run_id VARCHAR(255) REFERENCES agent_runs(run_id) ON DELETE CASCADE,
  agent_id VARCHAR(255) REFERENCES agent_definitions(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_events_run ON agent_events(run_id);

-- 7. Commander & Execution Audit Tables
CREATE TABLE IF NOT EXISTS commander_tasks (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  priority VARCHAR(10) NOT NULL DEFAULT 'P1',
  area VARCHAR(50) NOT NULL DEFAULT 'Backend',
  category VARCHAR(50) DEFAULT 'ENGINEERING',
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'PROPOSED', -- 'BACKLOG', 'PROPOSED', 'APPROVED', 'RUNNING', 'TESTING', 'DEPLOYED', 'REJECTED', 'FAILED'
  assigned_agent VARCHAR(100),
  files_json JSONB,
  tests_json JSONB,
  proposed_change TEXT,
  root_cause TEXT,
  rollback_plan TEXT,
  evidence_ids JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commander_tasks_status ON commander_tasks(status);

CREATE TABLE IF NOT EXISTS commander_workers (
  worker_id VARCHAR(255) PRIMARY KEY,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  current_task TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'RUNNING',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS execution_events (
  id VARCHAR(255) PRIMARY KEY,
  task_id VARCHAR(255) REFERENCES commander_tasks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  summary TEXT NOT NULL,
  evidence_id VARCHAR(255) REFERENCES prospect_evidence(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approvals (
  id VARCHAR(255) PRIMARY KEY,
  action_type VARCHAR(100) NOT NULL, -- 'SEND_EMAIL', 'SEND_WHATSAPP', 'PUBLISH_POST', 'DEPLOY_CODE', 'MIGRATE_DB'
  entity_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  payload JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'FAILED'
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  execution_evidence_id VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);

-- Record this migration
INSERT INTO schema_migrations (version, name) VALUES (3, '003_truth_and_evidence')
ON CONFLICT (version) DO NOTHING;
