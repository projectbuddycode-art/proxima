# PROXIMA by Project Buddy — Central AI Autonomous Client Acquisition Operating System

[![System Version](https://img.shields.io/badge/version-2.0.0--production-cyan.svg)](https://github.com/projectbuddycode-art/proxima)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/projectbuddycode-art/proxima)
[![Local AI Engine](https://img.shields.io/badge/ollama-qwen2.5--coder:3b-purple.svg)](http://127.0.0.1:11434)
[![Database Adapter](https://img.shields.io/badge/database-PostgreSQL%20%7C%20LocalJSON-blue.svg)](file:///lib/db.ts)

PROXIMA is Project Buddy's central AI operating system responsible for autonomous prospect discovery, 5-level contact provenance verification, consultative outreach, meeting preparation, commercial intelligence, and revenue objective tracking against a ₹10,00,000 monthly target.

---

## 🚀 ARCHITECTURE & LOCAL OLLAMA BRIDGE

```
              VERCEL CLOUD (Frontend & Gateway API)
                              │
                    /api/gateway (PostgreSQL DB)
                              │
                    [Outbound Job Queue]
                              │
                     Authorization: Bearer <token>
                              │
               PROXIMA LOCAL BRIDGE (Port 11435)
                              │
                     Strict 127.0.0.1 Binding
                              │
               LOCAL OLLAMA (http://127.0.0.1:11434)
                              │
                   qwen2.5-coder:3b Model
```

Zero ports exposed on your local PC. Zero port forwarding required. All Local Bridge traffic is outbound to Vercel via authenticated Bearer token.

---

## ⚡ SETUP & DEPLOYMENT GUIDE

### 1. Clone Repository & Install Dependencies
```bash
git clone git@github.com:projectbuddycode-art/proxima.git
cd proxima
npm install
```

### 2. Configure Local vs Production Database
- **Local Development**: Uses `db.json` automatically. No setup needed.
- **Production Deployment (Vercel)**:
  Set `DATABASE_URL` in your Vercel environment variables:
  ```env
  DATABASE_URL=postgresql://user:password@ep-cool-db.us-east-1.aws.neon.tech/proxima?sslmode=require
  ```
  Run schema migration:
  ```bash
  npm run db:migrate
  ```

### 3. Deploy to Vercel
Push `main` branch or connect repository directly to Vercel. Configure standard environment variables in `.env.example`.

### 4. Install Local Ollama Engine
1. Download Ollama from [ollama.com](https://ollama.com).
2. Pull the preferred coding model:
   ```bash
   ollama pull qwen2.5-coder:3b
   ```

### 5. Launch Proxima Local Bridge
- **Windows**: Run `proxima-local-bridge/start-windows.bat`
- **macOS / Linux**: Run `proxima-local-bridge/start-unix.sh`

### 6. Pair Device & Test Remote Inference
1. Open Proxima UI -> Click **Device Pairing**.
2. Copy 6-digit code -> Enter in Local Bridge setup.
3. Click **`TEST LOCAL OLLAMA`** to run end-to-end Vercel Cloud -> Bridge -> Ollama inference test.

---

## 🛡️ ZERO SYNTHETIC DATA & HUMAN TAKEOVER
- **Zero-Synthetic Firewall**: Missing emails or phone numbers are set to `NULL` / `NOT_VERIFIED`. Proxima NEVER invents fake contact details.
- **Shivam Takeover Trigger**: Once positive buying intent is detected (*"Tell me more"*, *"How much does this cost?"*), automated messaging stops immediately and alerts:
  **🚨 HUMAN TAKEOVER REQUIRED — SHIVAM, THIS ONE IS YOURS!**
