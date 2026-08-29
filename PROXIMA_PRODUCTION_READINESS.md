# Proxima Production Readiness Checklist

## Environment Variables Audit Matrix

| Variable Name | Purpose | Required | Local Status | Production Status | Secret | Verified |
|---|---|---|---|---|---|---|
| `DATABASE_URL` | PostgreSQL Production Connection String | YES | Configured (`postgresql://...`) | Configured (Vercel Postgres / Neon) | YES | VERIFIED |
| `OLLAMA_BASE_URL` | Local Ollama API URL | YES | `http://127.0.0.1:11434` | Managed by Local Bridge | NO | VERIFIED |
| `OLLAMA_MODEL` | Local LLM Model Identifier | YES | `qwen2.5-coder:3b` | `qwen2.5-coder:3b` | NO | VERIFIED |
| `PROXIMA_BRIDGE_TOKEN` | SHA-256 Authenticated Bridge Token | YES | Configured | Configured | YES | VERIFIED |
| `TITAN_SMTP_USER` | Titan Email Outbound Username | YES | `shivam@projectbuddy.in` | `shivam@projectbuddy.in` | NO | VERIFIED |
| `TITAN_SMTP_PASS` | Titan Email Outbound Password | YES | Configured | Configured | YES | VERIFIED |
| `ENCRYPTION_SECRET` | AES-256-GCM Token Secret | YES | Configured | Configured | YES | VERIFIED |

## Security & Architectural Safeguards
1. **Zero Synthetic Data Firewall**: All candidates passing through discovery are checked against `RealProspectFirewall`. Synthetic records are rejected prior to persistence.
2. **SSRF Network Protection**: URL parsing restricts requests to public HTTP/HTTPS domains and blocks private IP ranges (`127.0.0.1`, `localhost`, `10.0.0.0/8`, `192.168.0.0/16`).
3. **Database Parameterization**: All PostgreSQL queries use parameterized positional arguments (`$1`, `$2`, `$3`) with strict table allowlist enforcement (`ALLOWED_TABLES`).
4. **Token Encryption**: All third-party OAuth access/refresh tokens are encrypted at rest using AES-256-GCM (`lib/security/crypto.ts`).
