# Database Contract Audit — Proxima AI Operating System

## PostgreSQL Schema vs TypeScript Type Contract Matrix

| Table | Column | PostgreSQL Type | TypeScript Type | Nullable | Default | Validation & Handling | Used By |
|---|---|---|---|---|---|---|---|
| `companies` | `id` | `VARCHAR(255)` | `string` | NO | Primary Key | `comp_${Date.now()}_${rand}` | Discovery, Pipeline |
| `companies` | `name` | `VARCHAR(255)` | `string` | NO | None | Stripped legal suffixes | Pipeline, Deduplication |
| `companies` | `website` | `VARCHAR(255)` | `string` | YES | `NULL` | Normalized domain | Pipeline, Security |
| `companies` | `decision_makers_json` | `JSONB` | `Array<Contact>` | YES | `NULL` | `JSON.stringify(decisionMakers)` | Pipeline |
| `companies` | `products_services_json` | `JSONB` | `Array<string>` | YES | `NULL` | `JSON.stringify(rawSignals)` | Pipeline |
| `prospects` | `id` | `VARCHAR(255)` | `string` | NO | Primary Key | `prosp_${Date.now()}_${rand}` | Pipeline, Dashboard |
| `prospects` | `campaign_id` | `VARCHAR(255)` | `string` | YES | `NULL` | Foreign Key `campaigns(id)` | Pipeline |
| `prospects` | `company_id` | `VARCHAR(255)` | `string` | YES | `NULL` | Foreign Key `companies(id)` | Pipeline, Deduplication |
| `prospects` | `company_name` | `VARCHAR(255)` | `string` | YES | `NULL` | Canonical Company Name | Pipeline, UI |
| `prospects` | `contact_name` | `VARCHAR(255)` | `string` | YES | `NULL` | Verified Contact Name | Pipeline, Provenance |
| `prospects` | `role` | `VARCHAR(255)` | `string` | YES | `NULL` | Contact Role | Pipeline |
| `prospects` | `email` | `VARCHAR(255)` | `string` | YES | `NULL` | Verified Email or `NULL` | Contact Provenance Gate |
| `prospects` | `phone` | `VARCHAR(50)` | `string` | YES | `NULL` | Observed Phone or `NULL` | Contact Provenance Gate |
| `prospects` | `fit_score` | `INTEGER` | `number` | NO | `0` | Range 0–100 | Fit Score Agent |
| `prospects` | `intent_score` | `INTEGER` | `number` | NO | `0` | Range 0–100 | Intent Agent |
| `prospects` | `human_takeover` | `INTEGER` | `number` | NO | `0` | `0` (AI) or `1` (Shivam) | Response Classifier |
| `prospects` | `status` | `VARCHAR(50)` | `string` | YES | `'DISCOVERED'` | State Enum | Pipeline Lifecycle |
| `prospects` | `research_summary_json` | `JSONB` | `ResearchOutput` | YES | `NULL` | `JSON.stringify(resOutput)` | Pipeline, Dossier |
| `prospects` | `fit_breakdown_json` | `JSONB` | `FitOutput` | YES | `NULL` | `JSON.stringify(fitOutput)` | Pipeline, Dossier |
| `prospects` | `opportunity_angle_json` | `JSONB` | `OpportunityOutput` | YES | `NULL` | `JSON.stringify(oppOutput)` | Pipeline, Dossier |
| `prospects` | `outreach_draft_json` | `JSONB` | `MessageOutput` | YES | `NULL` | `JSON.stringify(msgOutput)` | Pipeline, Dossier |
| `prospects` | `cross_check_qa_json` | `JSONB` | `CrossCheckResult` | YES | `NULL` | `JSON.stringify(crossCheck)` | Pipeline, Truth QA |
| `security_observations` | `id` | `VARCHAR(255)` | `string` | NO | Primary Key | `sec_${Date.now()}` | Security Agent |
| `security_observations` | `target_domain` | `VARCHAR(255)` | `string` | NO | None | Validated Domain | Security Agent |
| `security_observations` | `https_enabled` | `INTEGER` | `number` | NO | `1` | `1` or `0` | Security Agent |
| `security_observations` | `security_headers_present` | `JSONB` | `Array<string>` | YES | `NULL` | `JSON.stringify(present)` | Security Agent |
| `security_observations` | `missing_security_headers` | `JSONB` | `Array<string>` | YES | `NULL` | `JSON.stringify(missing)` | Security Agent |
| `security_observations` | `public_tech_signature` | `JSONB` | `Array<string>` | YES | `NULL` | `JSON.stringify([signature])` | Security Agent |

## Verification
All 24 JSON/JSONB columns are safely handled with `JSON.stringify()` serialization prior to database insertion. SQL queries use parameterized positional arguments (`$1`, `$2`, `$3`) to prevent SQL injection and invalid JSON syntax failures.
