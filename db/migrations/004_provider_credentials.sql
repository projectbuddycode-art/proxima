-- ========================================================================
-- PROXIMA BY PROJECT BUDDY — PRODUCTION POSTGRESQL SCHEMA
-- Migration 004: Secure AI Provider Credentials Storage
-- ========================================================================

CREATE TABLE IF NOT EXISTS provider_credentials (
  provider VARCHAR(100) PRIMARY KEY,
  encrypted_secret TEXT NOT NULL,
  key_fingerprint VARCHAR(100) NOT NULL,
  configured_model VARCHAR(100) DEFAULT 'claude-3-5-sonnet-20241022',
  validation_status VARCHAR(50) DEFAULT 'NOT_CONFIGURED',
  last_validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Record this migration
INSERT INTO schema_migrations (version, name) VALUES (4, '004_provider_credentials')
ON CONFLICT (version) DO NOTHING;
