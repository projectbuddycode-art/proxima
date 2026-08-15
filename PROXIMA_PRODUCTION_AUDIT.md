# PROXIMA Surgical Production Database Hardening Audit

**Date**: 2026-08-15  
**Product**: PROXIMA by Project Buddy (v2.0 Production Release)  
**Target Repository**: `git@github.com:projectbuddycode-art/proxima.git`  
**Scope**: Surgical Hardening of `lib/db/postgres.ts` and `lib/gateway/server.ts`  

---

## 1. SURGICAL HARDENING MATRIX

| Requirement / Item | Previous Implementation | Hardened Target State |
| :--- | :--- | :--- |
| **1. Cryptographic Pairing Code** | `Math.random()` integer | **Cryptographically Secure**: `crypto.randomInt(100000, 1000000).toString()`. |
| **2. Neutral Pairing Machine Data** | Hardcoded `'Windows'`, `'x64'`, `'0.3.0'` | **Neutral Defaults at Pairing**: Set to `'UNKNOWN'` / `NULL` until actual Local Bridge sends authenticated heartbeat payload. |
| **3. Session Heartbeat Upsert** | `ON CONFLICT (id)` | **Unique Constraint Upsert**: `ON CONFLICT (token_hash) DO UPDATE` or `ON CONFLICT (bridge_id) DO UPDATE`. |
| **4. Prepare Stub Removal** | Fake synchronous `prepare()` returning `null` | **Cleaned Production Adapter**: Removed fake `prepare()` stub from `PostgresProductionDatabase`. All production queries use async methods. |
| **5. Count Method Hardening** | Fake `count()` returning `0` | **Async Table Counter (`countAsync`)**: Validates `tableName` against an explicit table allowlist before executing PostgreSQL queries. |
| **6. SQL Identifier Safety** | Unchecked table name string | **Strict Table Allowlist**: Restricted to known schema tables (`prospects`, `campaigns`, `bridge_sessions`, etc.). Rejects unlisted table names. |
| **7. Error Handling** | Swallowed errors | **Explicit Server-Side Error Logging & Propagation**: Throws real errors without swallowing or returning fake fallbacks. Redacts credentials. |
| **8. Smoke Test & System Tests** | Smoke test & test suite | **Smoke Test Harness**: `scripts/production-smoke-test.mjs` verifies cryptographic pairing code, neutral defaults, upsert heartbeat, and SQL safety. |

---

## 2. SURGICAL ROADMAP
1. Update `lib/db/postgres.ts` to use `crypto.randomInt(100000, 1000000)`, set neutral defaults (`'UNKNOWN'`) during pairing, enforce table allowlist in `countAsync()`, and remove fake `prepare()` / `count()` stubs.
2. Update `lib/db/schema.sql` to add `UNIQUE (token_hash)` constraint to `bridge_sessions` table.
3. Update `lib/db.ts` to remove unnecessary synchronous `prepare` on production adapter interface.
4. Update `scripts/production-smoke-test.mjs` and `tests/system.test.ts` to verify cryptographic pairing codes and neutral defaults.
5. Run `npx tsx scripts/production-smoke-test.mjs`, `npm test`, and `npm run build`.
6. Commit changes with `git commit -m "fix: harden production postgres bridge state"` and push to `git push origin main`.
