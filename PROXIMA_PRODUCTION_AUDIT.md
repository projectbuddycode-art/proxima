# PROXIMA Production Vercel Gateway & Local Bridge Audit

**Date**: 2026-08-15  
**Product**: PROXIMA by Project Buddy (v2.0 Final Production Release)  
**Target Repository**: `git@github.com:projectbuddycode-art/proxima.git`  
**Purpose**: Vercel Serverless Persistent Job Queue & Dynamic Outbound Local Bridge Production Audit  

---

## 1. PRODUCTION REALITY CHECKLIST

| Component | Status | Operational Notes |
| :--- | :--- | :--- |
| **Vercel Gateway Job Queue** | `UPGRADE_REQUIRED` | Migrate in-memory gateway queue to persistent database table (`ai_jobs` & `bridge_sessions` in `lib/db.ts`) to support Vercel serverless functions. |
| **Outbound Bridge Polling Protocol** | `UPGRADE_REQUIRED` | Implement DB-backed polling queue (`QUEUED` -> `CLAIMED` -> `RUNNING` -> `COMPLETED` / `FAILED` / `TIMEOUT`) for Local Bridge execution. |
| **Local Bridge Config Fallbacks** | `UPGRADE_REQUIRED` | Remove hardcoded `http://localhost:3000` and `prx_bridge_token_default_2026`. Report `CLOUD GATEWAY NOT CONFIGURED` and `BRIDGE AUTHENTICATION NOT CONFIGURED` if missing. |
| **Bearer Token Authentication** | `UPGRADE_REQUIRED` | Transmit gateway credentials via `Authorization: Bearer <token>` header on heartbeats and job polls. |
| **Dynamic Bridge ID Generator** | `UPGRADE_REQUIRED` | Generate and persist unique `bridge_<uuid>` in `proxima-local-bridge/bridge-config.json`. Remove hardcoded `bridge_shivam_laptop`. |
| **Real Ollama Version & Model Check** | `UPGRADE_REQUIRED` | Fetch `/api/version` and `/api/tags` from `http://127.0.0.1:11434`. Do NOT report `qwen2.5-coder:7b` as available unless confirmed by Ollama API. |
| **TEST LOCAL OLLAMA UI Action** | `UPGRADE_REQUIRED` | Add dedicated button in `app/components/LocalAIEngine.tsx` executing full Vercel -> Gateway -> Local Bridge -> Ollama -> Vercel end-to-end inference test. |
| **Local Bridge Startup Scripts** | `UPGRADE_REQUIRED` | Build `proxima-local-bridge/.env.example`, `proxima-local-bridge/start-windows.bat`, and `proxima-local-bridge/start-unix.sh`. |
| **Local Command Allowlist & CORS** | `REAL` | Retain strict command allowlist (`ollama_start`, `ollama_stop`, `ollama_status`, `ollama_models`, `ollama_generate`, `health`) and restrict CORS origins. |
| **System Verification Suite** | `REAL` | 10 end-to-end automated verification tests passing cleanly in `tests/system.test.ts`. |

---

## 2. IMMEDIATE ACTION PLAN FOR FINAL PRODUCTION RELEASE
1. Update database schema in `lib/db.ts` to include `bridge_sessions` and `ai_jobs` tables.
2. Upgrade `lib/gateway/server.ts` to persist sessions, pairing tokens, job states (`QUEUED`, `CLAIMED`, `RUNNING`, `COMPLETED`, `FAILED`, `TIMEOUT`), and Bearer token auth.
3. Update `app/api/gateway/route.ts` to handle polling (`action=poll`), job completion (`action=result`), and pairing.
4. Refactor `proxima-local-bridge/index.mjs` to remove hardcoded defaults, send Bearer tokens, poll jobs, retrieve real Ollama `/api/version`, and load/save local `bridge-config.json`.
5. Create helper files: `proxima-local-bridge/.env.example`, `proxima-local-bridge/start-windows.bat`, and `proxima-local-bridge/start-unix.sh`.
6. Upgrade UI in `app/components/LocalAIEngine.tsx` with **`TEST LOCAL OLLAMA`** action button and pairing workflow.
7. Run `npm test` and `npm run build` to verify clean compilation.
8. Commit and push fix to `git push origin main`.
