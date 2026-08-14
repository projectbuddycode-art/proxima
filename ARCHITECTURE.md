# ARCHITECTURE — PROJECT BUDDY CLIENT ACQUISITION OS

## Architectural Overview

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                         Project Buddy Dashboard                        │
 │           Next.js 14 App Router / React / Tailwind / Lucide UI         │
 └──────────────────────────────────┬─────────────────────────────────────┘
                                    │ HTTP / REST API
 ┌──────────────────────────────────▼─────────────────────────────────────┐
 │                         Next.js Backend Server                         │
 │                                                                        │
 │  ┌───────────────────────┐  ┌───────────────────────┐                  │
 │  │   Discovery Engine    │  │   Research Pipeline   │                  │
 │  │ (Maps, Hiring, Web)   │  │  (Puppeteer/Fetch)    │                  │
 │  └───────────┬───────────┘  └───────────┬───────────┘                  │
 │              │                          │                              │
 │  ┌───────────▼──────────────────────────▼───────────┐                  │
 │  │           Multi-Agent Intelligence Core           │                  │
 │  │  - Research Agent        - Buying Intent Agent   │                  │
 │  │  - Fit Agent             - Opportunity Agent     │                  │
 │  │  - Message Agent         - Truth/QA Agent        │                  │
 │  │  - Channel Agent         - Response Agent        │                  │
 │  └───────────────────────┬──────────────────────────┘                  │
 │                          │                                             │
 │  ┌───────────────────────▼──────────────────────────┐                  │
 │  │                Local Ollama AI Client            │                  │
 │  │          (Fallback to Mock/Rule Engine)          │                  │
 │  └───────────────────────┬──────────────────────────┘                  │
 └──────────────────────────┼─────────────────────────────────────────────┘
                            │
 ┌──────────────────────────▼─────────────────────────────────────────────┐
 │                         Local Storage Layer                            │
 │  ┌────────────────────────┐         ┌───────────────────────────────┐  │
 │  │  SQLite DB (sqlite.db) │         │ Local Knowledge Base          │  │
 │  │  (better-sqlite3)      │         │ (/knowledge/*.md)             │  │
 │  └────────────────────────┘         └───────────────────────────────┘  │
 └────────────────────────────────────────────────────────────────────────┘
```

## System Components

1. **AI Provider Abstraction (`AIProvider`)**:
   - `OllamaProvider`: Connects to `http://localhost:11434` for LLM inference (Llama3 / Qwen / Mistral / DeepSeek).
   - `MockProvider`: Fallback provider with deterministic rule-based output when Ollama is offline or downloading models.

2. **Knowledge Engine**:
   - Parses local `/knowledge/*.md` markdown files.
   - Provides company positioning, capabilities, offer playbooks, and sales rules to system prompts.

3. **Multi-Agent Orchestrator**:
   - Executes specialized prompts with structured JSON output enforcement.
   - Includes Truth / QA Agent for verification before queueing outreach.

4. **Response Classifier & Human Takeover Enforcer**:
   - Classifies replies into 16 categories.
   - Triggering high-intent categories immediately halts sequence automation and flags `HUMAN_TAKEOVER_REQUIRED`.

5. **Storage Layer**:
   - SQLite (`sqlite.db`) storing companies, prospects, research, signals, opportunities, campaigns, messages, followups, responses, audit logs, and settings.
