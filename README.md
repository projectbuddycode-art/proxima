# PROXIMA by Project Buddy — Autonomous Client Acquisition & Growth OS

> **PROXIMA COMMANDER**: AI CEO + GTM Commander + Development Commander for Project Buddy.

PROXIMA is a local-first, autonomous client acquisition, business intelligence, and growth operating system built specifically for Project Buddy. It combines local reasoning (**Ollama**), zero-native file database storage, 27 specialized agents, multi-agent cross-check panels, passive security intelligence, OpenStreetMap offline discovery, and Titan Mail integration.

---

## 🚀 Key Features & Architecture

### 1. Hybrid Vercel + Local Bridge Architecture
- **Vercel Cloud UI**: Hosts the Next.js 14 Web Command Center and dashboard.
- **Proxima Local Bridge (`proxima-local-bridge/`)**: Lightweight local Node.js service running on user's PC (Port `11435`) bridging Vercel UI to local Ollama (`http://127.0.0.1:11434`) and local tools securely.

### 2. PROXIMA COMMANDER (AI CEO)
- Top-level commander overseeing Monthly Objectives (₹10,00,000 Revenue Target), Target Gap Analysis, Daily Command Briefs, City Auto-Expansion (15+ hubs), and Shivam Takeover Alerts (*"Shivam, this one is yours!"*).

### 3. Strict REAL MODE Zero-Fabrication Policy
- Enforces strict zero-synthetic data. Unverified contacts return `NULL` or `NOT_FOUND`. Dummy fallback emails like `info@company.com` are strictly forbidden unless observed directly on official source URLs.

### 4. 5-Level Contact Provenance System
- Classifies contact details from `LEVEL 0: UNKNOWN` up to `LEVEL 4: DELIVERY_VERIFIED` with source URL provenance.

### 5. Visible Contact Intelligence Panel & Social Workspace
- UI view (`/contacts`) displaying verified Email, Phone, WhatsApp, LinkedIn, Instagram, Facebook, Website, Contact Form with direct action buttons.
- Split-Screen Social Workspace (`/social-workspace`) for public post inspection and handle cross-verification.

### 6. Titan Mail Integration
- Titan Mail SMTP (`smtp.titan.email:465` SSL) and IMAP listener (`imap.titan.email:993` SSL) for outreach delivery and thread matching.

---

## 🛠 Local Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Proxima Local Bridge
```bash
node proxima-local-bridge/index.mjs
```

### 3. Start Next.js Local Server
```bash
npm run dev
```

### 4. Run System Verification Suite
```bash
npm test
```

---

## 📦 Production Deployment

### Git Repository Setup
```bash
git init
git add .
git commit -m "production: PROXIMA COMMANDER Autonomous Growth OS v2.0"
git branch -M main
git remote add origin git@github.com:projectbuddycode-art/proxima.git
git push -u origin main
```
