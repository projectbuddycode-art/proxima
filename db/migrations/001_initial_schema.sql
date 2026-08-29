-- ========================================================================
-- PROXIMA BY PROJECT BUDDY — PRODUCTION POSTGRESQL SCHEMA
-- Migration 001: Initial Schema
-- Compatible with Neon, Vercel Postgres, Supabase, Cloud SQL
-- ========================================================================
-- Tables are created in dependency order:
--   1. Independent tables (no FK references)
--   2. Tables that reference only independent tables
--   3. Tables that reference second-level tables

-- ========================================================================
-- INFRASTRUCTURE TABLES (no FK dependencies)
-- ========================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proxima_logs (
  id VARCHAR(255) PRIMARY KEY,
  stage VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proxima_activity_logs (
  id VARCHAR(255) PRIMARY KEY,
  action VARCHAR(255) NOT NULL,
  details TEXT,
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

-- ========================================================================
-- CAMPAIGN & COMPANY (independent domain tables)
-- ========================================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  objective TEXT,
  industry VARCHAR(255),
  location VARCHAR(255),
  ideal_customer_profile TEXT,
  company_size VARCHAR(100),
  target_role VARCHAR(255),
  target_roles JSONB,
  offer TEXT,
  discovery_sources JSONB,
  min_intent INTEGER DEFAULT 70,
  min_fit INTEGER DEFAULT 70,
  status VARCHAR(50) DEFAULT 'CREATED',
  pipeline_stage VARCHAR(50) DEFAULT 'CAMPAIGN_CREATED',
  error_code VARCHAR(100),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
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
  source VARCHAR(100),
  source_id VARCHAR(255),
  normalized_name VARCHAR(255),
  normalized_domain VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================
-- PROSPECT (references campaigns and companies)
-- ========================================================================

CREATE TABLE IF NOT EXISTS prospects (
  id VARCHAR(255) PRIMARY KEY,
  campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE SET NULL,
  company_id VARCHAR(255) REFERENCES companies(id) ON DELETE SET NULL,

  -- Canonical contact fields
  contact_name VARCHAR(255),
  contact_role VARCHAR(255),
  title VARCHAR(255),

  -- Contact info with provenance
  email VARCHAR(255),
  email_verification_status VARCHAR(50) DEFAULT 'UNKNOWN',
  email_source VARCHAR(255),
  email_source_url TEXT,
  email_confidence NUMERIC(5,2),

  phone VARCHAR(50),
  phone_verification_status VARCHAR(50) DEFAULT 'UNKNOWN',
  phone_source VARCHAR(255),
  phone_source_url TEXT,
  phone_confidence NUMERIC(5,2),

  -- Scoring
  fit_score INTEGER DEFAULT 0,
  intent_score INTEGER DEFAULT 0,
  data_quality_score INTEGER DEFAULT 0,
  opportunity_score INTEGER DEFAULT 0,
  priority_score INTEGER DEFAULT 0,
  intent_level VARCHAR(50),
  confidence NUMERIC(5,2),
  score_breakdown_json JSONB,

  -- Lifecycle
  status VARCHAR(50) DEFAULT 'DISCOVERED',
  discovery_status VARCHAR(50) DEFAULT 'DISCOVERED',
  verification_status VARCHAR(50) DEFAULT 'UNKNOWN',
  pipeline_stage VARCHAR(50) DEFAULT 'DISCOVERED',

  -- Human takeover
  human_takeover INTEGER DEFAULT 0,
  takeover_reason TEXT,

  -- AI agent outputs (stored as JSON)
  research_summary_json JSONB,
  fit_breakdown_json JSONB,
  opportunity_angle_json JSONB,
  outreach_draft_json JSONB,
  cross_check_qa_json JSONB,

  -- Discovery provenance
  source VARCHAR(100),
  source_id VARCHAR(255),
  source_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================
-- RESEARCH, INTELLIGENCE & OPPORTUNITIES (reference companies/prospects)
-- ========================================================================

CREATE TABLE IF NOT EXISTS research (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) REFERENCES companies(id) ON DELETE CASCADE,
  prospect_id VARCHAR(255) REFERENCES prospects(id) ON DELETE CASCADE,
  company_summary TEXT,
  products_services JSONB,
  target_market JSONB,
  digital_presence JSONB,
  observable_signals JSONB,
  observable_website_findings JSONB,
  social_signals JSONB,
  hiring_signals JSONB,
  expansion_signals JSONB,
  review_signals JSONB,
  buying_signals JSONB,
  pain_hypotheses JSONB,
  identified_problem TEXT,
  evidence JSONB,
  business_impact TEXT,
  confidence NUMERIC(5,2),
  source_links JSONB,
  recommended_project_buddy_capability TEXT,
  recommended_offer TEXT,
  reason_to_contact_now TEXT,
  ai_provider VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
  id VARCHAR(255) PRIMARY KEY,
  prospect_id VARCHAR(255) REFERENCES prospects(id) ON DELETE CASCADE,
  observation TEXT,
  evidence TEXT,
  potential_business_impact TEXT,
  hypothesis TEXT,
  discovery_question TEXT,
  problem TEXT,
  business_impact TEXT,
  recommended_solution_category TEXT,
  recommended_offer TEXT,
  why_this_offer TEXT,
  estimated_commercial_band TEXT,
  confidence NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_observations (
  id VARCHAR(255) PRIMARY KEY,
  target_domain VARCHAR(255),
  prospect_id VARCHAR(255) REFERENCES prospects(id) ON DELETE SET NULL,
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

-- ========================================================================
-- OUTREACH, MESSAGES & RESPONSES (reference prospects/campaigns)
-- ========================================================================

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(255) PRIMARY KEY,
  prospect_id VARCHAR(255) REFERENCES prospects(id) ON DELETE CASCADE,
  campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  subject TEXT,
  body TEXT,
  score NUMERIC(5,2),
  qa_passed INTEGER DEFAULT 0,
  qa_reasons_json JSONB,
  status VARCHAR(50) DEFAULT 'DRAFT',
  approval_status VARCHAR(50) DEFAULT 'PENDING',
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  ai_provider VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outreach_messages (
  id VARCHAR(255) PRIMARY KEY,
  prospect_id VARCHAR(255) REFERENCES prospects(id) ON DELETE CASCADE,
  campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PREPARED',
  approval_status VARCHAR(50) DEFAULT 'PENDING',
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS responses (
  id VARCHAR(255) PRIMARY KEY,
  prospect_id VARCHAR(255) REFERENCES prospects(id) ON DELETE CASCADE,
  message_id VARCHAR(255) REFERENCES messages(id) ON DELETE SET NULL,
  channel VARCHAR(50) NOT NULL,
  raw_text TEXT,
  classification VARCHAR(50),
  confidence NUMERIC(5,2),
  reason TEXT,
  recommended_action TEXT,
  automation_allowed INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS followups (
  id VARCHAR(255) PRIMARY KEY,
  prospect_id VARCHAR(255) REFERENCES prospects(id) ON DELETE CASCADE,
  message_id VARCHAR(255) REFERENCES messages(id) ON DELETE SET NULL,
  step INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================
-- EVIDENCE & SOURCES (reference research/prospects)
-- ========================================================================

CREATE TABLE IF NOT EXISTS sources (
  id VARCHAR(255) PRIMARY KEY,
  research_id VARCHAR(255) REFERENCES research(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source_type VARCHAR(100),
  reliability_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence_claims (
  id VARCHAR(255) PRIMARY KEY,
  prospect_id VARCHAR(255) REFERENCES prospects(id) ON DELETE CASCADE,
  claim TEXT NOT NULL,
  source VARCHAR(255),
  source_url TEXT,
  captured_at TIMESTAMP WITH TIME ZONE,
  verification_status VARCHAR(50) DEFAULT 'UNVERIFIED',
  confidence VARCHAR(20) DEFAULT 'MEDIUM',
  agent VARCHAR(100),
  evidence_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================
-- JOBS & ORCHESTRATION
-- ========================================================================

CREATE TABLE IF NOT EXISTS ai_jobs (
  id VARCHAR(255) PRIMARY KEY,
  request_id VARCHAR(255) UNIQUE NOT NULL,
  job_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  payload JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
  result JSONB,
  latency_ms INTEGER,
  bridge_id VARCHAR(255),
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_code VARCHAR(100),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE
);

-- ========================================================================
-- DISCOVERY CACHE (map intelligence)
-- ========================================================================

CREATE TABLE IF NOT EXISTS map_businesses (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  city VARCHAR(255),
  country VARCHAR(255),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  address TEXT,
  osm_id VARCHAR(255),
  website VARCHAR(255),
  phone VARCHAR(50),
  source VARCHAR(255),
  source_url TEXT,
  tags_json JSONB,
  company_id VARCHAR(255) REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS map_regions (
  id VARCHAR(255) PRIMARY KEY,
  region VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  current_offset INTEGER DEFAULT 0,
  total_indexed INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================
-- STRATEGIES & EXPERIMENTS
-- ========================================================================

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
  strategy_id VARCHAR(255) REFERENCES strategies(id) ON DELETE SET NULL,
  sample_size INTEGER DEFAULT 0,
  qualified_rate NUMERIC(5,2),
  reply_rate NUMERIC(5,2),
  conversion_rate NUMERIC(5,2),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================
-- INTEGRATIONS & SOCIAL
-- ========================================================================

CREATE TABLE IF NOT EXISTS integrations (
  id VARCHAR(255) PRIMARY KEY,
  provider VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'DISCONNECTED',
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  scopes JSONB,
  metadata JSONB,
  connected_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_integrations (
  id VARCHAR(255) PRIMARY KEY,
  platform VARCHAR(100) NOT NULL,
  account_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'DISCONNECTED',
  access_token_encrypted TEXT,
  capabilities JSONB,
  connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oauth_states (
  id VARCHAR(255) PRIMARY KEY,
  provider VARCHAR(100) NOT NULL,
  state VARCHAR(255) UNIQUE NOT NULL,
  redirect_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- ========================================================================
-- PROPOSALS & LEARNING
-- ========================================================================

CREATE TABLE IF NOT EXISTS proposals (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  version VARCHAR(50),
  previous_behavior TEXT,
  new_behavior TEXT,
  expected_impact TEXT,
  tests_summary TEXT,
  risk_level VARCHAR(50) DEFAULT 'LOW',
  files_changed TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS learning_lessons (
  id VARCHAR(255) PRIMARY KEY,
  lesson_type VARCHAR(100),
  original_output TEXT,
  corrected_output TEXT,
  correction_reason TEXT,
  agent VARCHAR(100),
  campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Record this migration
INSERT INTO schema_migrations (version, name) VALUES (1, '001_initial_schema')
ON CONFLICT (version) DO NOTHING;
