-- ========================================================================
-- Migration 002: Add indexes and performance constraints
-- ========================================================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_pairing_codes_code ON pairing_codes(pairing_code);
CREATE INDEX IF NOT EXISTS idx_bridge_sessions_token ON bridge_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_request ON ai_jobs(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_entity ON ai_jobs(entity_type, entity_id);

-- Campaign indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_pipeline ON campaigns(pipeline_stage);

-- Prospect indexes
CREATE INDEX IF NOT EXISTS idx_prospects_campaign ON prospects(campaign_id);
CREATE INDEX IF NOT EXISTS idx_prospects_company ON prospects(company_id);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_pipeline ON prospects(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_prospects_priority ON prospects(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_prospects_takeover ON prospects(human_takeover);

-- Company indexes
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(normalized_domain);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(normalized_name);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_prospect ON messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_messages_campaign ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_approval ON messages(approval_status);
CREATE INDEX IF NOT EXISTS idx_outreach_prospect ON outreach_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_outreach_approval ON outreach_messages(approval_status);

-- Response indexes
CREATE INDEX IF NOT EXISTS idx_responses_prospect ON responses(prospect_id);
CREATE INDEX IF NOT EXISTS idx_responses_classification ON responses(classification);

-- Research indexes
CREATE INDEX IF NOT EXISTS idx_research_company ON research(company_id);
CREATE INDEX IF NOT EXISTS idx_research_prospect ON research(prospect_id);

-- Evidence indexes
CREATE INDEX IF NOT EXISTS idx_evidence_prospect ON evidence_claims(prospect_id);

-- Map indexes
CREATE INDEX IF NOT EXISTS idx_map_businesses_osm ON map_businesses(osm_id);
CREATE INDEX IF NOT EXISTS idx_map_businesses_city ON map_businesses(city);
CREATE INDEX IF NOT EXISTS idx_map_businesses_company ON map_businesses(company_id);

-- Security indexes
CREATE INDEX IF NOT EXISTS idx_security_domain ON security_observations(target_domain);

-- Record this migration
INSERT INTO schema_migrations (version, name) VALUES (2, '002_add_indexes')
ON CONFLICT (version) DO NOTHING;
