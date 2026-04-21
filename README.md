# Orion — Personal AI Agent

> An intelligent personal agent that centralizes my life — finances, habits, and career — using Claude AI.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square)](https://nodejs.org/)
[![Claude API](https://img.shields.io/badge/Claude-API-D97757?style=flat-square)](https://docs.anthropic.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## What is Orion?

Orion is my personal learning project to deeply understand AI agents, LLMs, and modern backend development. Instead of building a toy app, I'm building something I actually use every day: a conversational agent that understands natural language, extracts structured data, and remembers context across sessions.

**Example interactions:**
```
You → "Gasté 45 soles en almuerzo hoy"
Orion → "Registrado. Llevas S/. 230 en alimentación esta semana, 46% de tu presupuesto semanal."

You → "¿Cómo voy con mis hábitos de estudio esta semana?"
Orion → "3 de 5 días completados. Tu racha actual es de 12 días. ¿Quieres que te muestre el detalle?"
```

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Client Layer                   │
│         CLI (1a) → Web UI (1c)              │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│         API Gateway — Express + TS          │
│    POST /chat  ·  POST /memory  ·  GET /ctx │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│              Agent Core                     │
│  Orchestrator → Context Builder → Tools     │
└──────┬──────────────────────────┬───────────┘
       │                          │
┌──────▼──────┐          ┌────────▼────────┐
│Memory Layer │          │  Domain Layer   │
│Short + Long │          │Finance · Habits │
│   term      │          │    · Career     │
└──────┬──────┘          └────────┬────────┘
       │                          │
┌──────▼──────────────────────────▼──────────┐
│     PostgreSQL + Prisma ORM                 │
└─────────────────────────────────────────────┘
```

### Key design decisions

- **Two-layer memory:** Short-term holds the last N conversation messages in-process. Long-term persists extracted facts about me (goals, preferences, patterns) across sessions — injected into every system prompt.
- **Domain-driven structure:** Each life area (finance, habits, career) is an independent module with its own service and repository. The agent orchestrates them without coupling.
- **Tool use over plain chat:** Claude's `tool_use` feature lets the agent decide when to call structured functions vs. respond conversationally. This is what makes it feel like an agent, not a chatbot.

---

## Project Phases

| Phase | Description | Status |
|-------|-------------|--------|
| **1a** | CLI agent · Claude API · entity extraction · PostgreSQL | 🔄 In progress |
| **1b** | REST API · two-layer memory · context personalization | ⏳ Planned |
| **1c** | Web UI (Vue.js) · Docker · Railway deploy | ⏳ Planned |
| **2** | Robust backend · full domain coverage · testing | ⏳ Planned |
| **3** | Data dashboard · Power BI / D3.js integration | ⏳ Planned |
| **4** | Custom workflow automation engine | ⏳ Planned |
| **5** | SaaS · multi-user · auth | ⏳ Planned |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Node.js 20 + TypeScript 5 | Strong typing, modern JS ecosystem |
| Framework | Express.js | Lightweight, well-documented, industry standard |
| AI | Anthropic Claude API (claude-sonnet-4) | Best-in-class reasoning + tool use |
| ORM | Prisma | Type-safe DB access, great DX with TypeScript |
| Database | PostgreSQL 16 | Relational integrity for financial data |
| Containers | Docker + docker-compose | Reproducible local environment |
| Deploy | Railway | Simple Node.js + PostgreSQL deployment |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker + Docker Compose
- An [Anthropic API key](https://console.anthropic.com/)

### Local setup

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/orion.git
cd orion
npm install

# 2. Environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Start PostgreSQL
docker-compose up -d

# 4. Run database migrations
npx prisma migrate dev

# 5. Start the agent (CLI mode)
npm run dev
```

---

## Project Structure

```
orion/
├── src/
│   ├── agent/              # Agent brain: orchestrator, context, tools
│   ├── memory/             # Short-term and long-term memory
│   ├── domains/            # Finance, habits, career modules
│   │   ├── finance/
│   │   ├── habits/
│   │   └── career/
│   ├── api/                # Express routes and middleware
│   ├── config/             # Environment and logger setup
│   └── database/           # Prisma client instance
├── prisma/
│   └── schema.prisma       # Database schema
├── tests/
├── docker-compose.yml      # Local PostgreSQL
├── Dockerfile
└── .env.example
```

---

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(agent): add orchestrator with intent detection
fix(memory): prevent context overflow on long sessions
docs(readme): update architecture diagram
chore(docker): add healthcheck to postgres service
```

---

## Author

**Yaku** — Software Engineering student at UPC (7th cycle), Peru.
Building Orion to learn AI agents, Node.js, and modern backend practices in depth.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=flat-square)](https://linkedin.com/in/YOUR_PROFILE)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat-square)](https://github.com/YOUR_USERNAME)
