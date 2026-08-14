# PROJECT PLAN — PROJECT BUDDY CLIENT ACQUISITION OS

## Overview
Project Buddy Client Acquisition OS is a local-first, autonomous sales intelligence system designed specifically for Project Buddy (AI Software Modernization & Operational Intelligence partner). It runs locally without requiring paid API keys, utilizing local Ollama LLM models, SQLite local storage, and passive public web research.

## Core Milestones

### Phase 1: Local Core Architecture & Database Setup
- Next.js 14+ (App Router) + TypeScript + Tailwind CSS / Modern CSS design system.
- SQLite database schema initialization via `better-sqlite3`.
- Project Buddy Knowledge Base initialization (`/knowledge/*.md`).
- Ollama AI Provider client & abstraction layer (`AIProvider`).
- Initial Setup Wizard & System Diagnostic suite.

### Phase 2: Prospect Discovery & Research Engine
- Web Scraping & Public Business Search module (Local business search, hiring signals, expansion signals, website friction analyzer).
- Specialized Multi-Agent Intelligence Pipeline:
  - Discovery Agent
  - Research Agent (JSON output with source traceability)
  - Buying Intent Agent (0-100 scoring with weight config)
  - Fit Score Agent (Commercial fit vs Intent separation)
  - Opportunity Strategist Agent (Pain hypothesis & solution matching)

### Phase 3: Outreach Generation, QA & Channel Strategy
- Message Strategist Agent (Observation → Implication → Question).
- Truth / QA Agent (Verification pass, hallucination prevention).
- Channel Strategist (Email, LinkedIn workflow, WhatsApp adapter).
- Follow-up Scheduler (Day 0, Day 2, Day 5, Day 8 cadence).

### Phase 4: Response Classification & Human Takeover Enforcer
- Response Agent (Classifies incoming replies into 16 intent categories).
- Human Takeover Enforcer (🚨 Stops automation on INTERESTED / BUYING_INTENT / MEETING_REQUEST).
- AI Response Assistant (Copilot for founder takeover).

### Phase 5: Dashboard, Analytics & Learning System
- Enterprise Dark Navy & Orange UI design.
- "Find Me Clients" Campaign Generator & Auto Mode.
- "Why This Lead?" Panel (Transparent evidence breakdown).
- Commercial Intelligence & Learning Engine.
- Daily Report Generator & Automated Tests.
