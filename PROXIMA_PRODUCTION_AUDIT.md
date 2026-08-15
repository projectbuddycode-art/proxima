# PROXIMA Final Database Adapter Migration Audit

**Date**: 2026-08-15  
**Product**: PROXIMA by Project Buddy (v2.0 Production Hardened)  
**Target Repository**: `git@github.com:projectbuddycode-art/proxima.git`  

---

## 1. COMPREHENSIVE REPOSITORY CALLER AUDIT

The following table documents every database access site in the application and its target async migration state:

| File Path | Synchronous Code | Migrated Async Call | Status |
| :--- | :--- | :--- | :--- |
| `app/api/agents/route.ts` | `db.prepare('SELECT * FROM agents').all()` | `await db.queryAllAsync('SELECT * FROM agents')` | `MIGRATING` |
| `app/api/campaigns/route.ts` | `db.prepare(...).all()` / `.run()` | `await db.queryAllAsync(...)` / `await db.executeAsync(...)` | `MIGRATING` |
| `app/api/experiments/route.ts` | `db.prepare(...).all()` | `await db.queryAllAsync(...)` | `MIGRATING` |
| `app/api/prospects/route.ts` | `db.prepare(...).get()` / `.all()` | `await db.queryOneAsync(...)` / `await db.queryAllAsync(...)` | `MIGRATING` |
| `app/api/reports/daily/route.ts` | `db.prepare(...).all()` | `await db.queryAllAsync(...)` | `MIGRATING` |
| `app/api/responses/route.ts` | `db.prepare(...).get()` | `await db.queryOneAsync(...)` | `MIGRATING` |
| `app/api/security/route.ts` | `db.prepare(...).all()` | `await db.queryAllAsync(...)` | `MIGRATING` |
| `app/api/setup/route.ts` | `db.prepare(...).get()` | `await db.queryOneAsync(...)` | `MIGRATING` |
| `lib/ai/agents.ts` | `db.prepare(...).get()` | `await db.queryOneAsync(...)` | `MIGRATING` |
| `lib/ai/agents/registry.ts` | `db.prepare(...).get()` / `.run()` | `await db.queryOneAsync(...)` / `await db.executeAsync(...)` | `MIGRATING` |
| `lib/discovery/strategies.ts` | `db.prepare(...).get()` / `.run()` | `await db.queryOneAsync(...)` / `await db.executeAsync(...)` | `MIGRATING` |
| `lib/orchestrator/pipeline.ts` | `db.prepare(...).get()` / `.run()` | `await db.queryOneAsync(...)` / `await db.executeAsync(...)` | `MIGRATING` |
| `tests/system.test.ts` | `db.prepare(...).get()` / `.run()` | `await db.queryOneAsync(...)` / `await db.executeAsync(...)` | `MIGRATING` |

---

## 2. Dynamic Next.js API Routes Matrix
All database-backed API routes will export `export const dynamic = 'force-dynamic';` to ensure Next.js does not attempt static build-time prerendering without database connection context.
