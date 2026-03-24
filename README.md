# Sundown

> A voice-first dementia companion that extends caregivers — not replaces them.

Sundown reduces confusion during sundowning episodes by providing a personalized AI voice companion that knows each patient intimately. Caregivers onboard their loved one through a warm guided conversation, and the agent uses that knowledge to have meaningful, grounding interactions — calling the patient by their preferred name, asking about their church, their grandchildren, their garden. When distress rises, the system escalates to caregivers in real time.

---

## The Problem

Sundowning affects up to 20% of people with dementia. Episodes of confusion, anxiety, and agitation typically peak in the late afternoon and evening — exactly when caregivers are most exhausted and least available. There is no scalable, personalized solution that bridges this gap.

## The Solution

**Three layers working together:**

1. **Personalized Voice Companion** — An ElevenLabs voice agent dynamically configured with each patient's memories, routines, trusted people, and calming strategies. Speaks slowly, warmly, and knows when to escalate.

2. **Guided Caregiver Onboarding** — A natural conversation-based intake that replaces cold forms. Caregivers tell stories; the system extracts structured care profiles automatically.

3. **Live Care Intelligence** — Firecrawl continuously monitors trusted dementia-care sources (NIA, Alzheimer's Association) and extracts structured protocols. The agent's guidance stays current without manual updates.

---

## Demo

> *"It's not just voice plus web scraping. It's a personalized, continuously refreshed, state-aware care system."*

**Demo flow:**
1. Caregiver onboards a patient through a warm guided conversation
2. Dashboard shows generated profile — routines, memories, talking points pulled from patient's real church and hometown via Firecrawl
3. Patient opens the kiosk and talks — agent calls them by name, references their life
4. Care Intelligence panel shows live Firecrawl protocol extraction
5. Patient expresses distress — escalation fires — real-time alert appears on caregiver dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | Supabase (PostgreSQL + Auth + Realtime) |
| Voice AI | ElevenLabs Conversational AI |
| LLM | Claude API (claude-sonnet-4-6) |
| Web Intelligence | Firecrawl |
| Styling | Tailwind CSS + shadcn/ui |

---

## ElevenLabs Features Used

| Feature | How We Use It |
|---|---|
| **Dynamic Variables** | Inject patient name, memories, church, calming strategies at runtime — one agent, infinitely personalized |
| **Patient Turn Eagerness + 25s Timeout** | Dementia patients speak slowly. This config makes the agent feel genuinely caring, not rushed |
| **LLM-Generated Soft Timeouts** | Never leaves the patient in silence — contextual filler: *"I'm here with you..."* |
| **Expressive Mode + Audio Tags** | `[slow]` `[warm]` `[gentle]` tags shift tone with patient state |
| **Post-Call Webhooks + Success Evaluation** | Auto-scores every session: *"Did patient seem calm at end?"* Powers dashboard summaries |
| **Agent-to-Agent Transfer** | Three specialized agents: Companion → Grounding → Escalation. Patient hears one coherent voice |
| **Pronunciation Dictionary** | Patient's family names and church always pronounced correctly |

## Firecrawl Features Used

| Feature | How We Use It |
|---|---|
| **Extract with Schema** | Turns messy NIA/Alzheimer's pages into typed care protocol objects (`communication_do`, `communication_dont`, `summary_for_agent`) |
| **Familiar World Reconstruction** | Searches for patient's actual church bulletin, hometown events, favorite team — creates personalized talking points |
| **Map Endpoint** | Discovers relevant subpages from `alz.org` programmatically before crawling |
| **Async Crawl + Webhook** | Crawl fires → webhook updates care protocols in real time — no manual refresh |
| **Search Endpoint** | Finds patient-specific context: `"First Baptist Church bulletin schedule"` |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Accounts: [Supabase](https://supabase.com), [ElevenLabs](https://elevenlabs.io), [Firecrawl](https://firecrawl.dev), [Anthropic](https://console.anthropic.com)

### 1. Clone and install

```bash
git clone https://github.com/plasma6767/Sundown.git
cd Sundown
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in all values — see [docs/setup.md](docs/setup.md) for step-by-step instructions for each service.

### 3. Set up the database

Run the migrations in order in your Supabase SQL editor:

```
supabase/migrations/0001_schema.sql
supabase/migrations/0002_rls.sql
supabase/migrations/0003_functions.sql
```

### 4. Configure ElevenLabs agents

See [docs/elevenlabs-setup.md](docs/elevenlabs-setup.md) for agent configuration, webhook setup, and tool definitions.

### 5. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

For webhook testing (ElevenLabs + Firecrawl), run ngrok in a separate terminal:

```bash
ngrok http 3000
```

Update your webhook URLs in ElevenLabs and Firecrawl to use the ngrok URL.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/             # Login, signup, callback
│   ├── onboarding/         # Guided patient intake
│   ├── dashboard/          # Caregiver dashboard
│   ├── patient/[id]/       # Patient-facing kiosk voice UI
│   └── api/                # All API routes
├── components/
│   ├── onboarding/         # Streaming chat UI, profile preview
│   ├── voice/              # Voice interface, waveform, escalation overlay
│   └── dashboard/          # Incident feed, patient cards, care intelligence
└── lib/
    ├── supabase/            # DB client (browser + server)
    ├── elevenlabs/          # Dynamic prompt builder, tool definitions
    ├── firecrawl/           # Familiar world search, protocol extraction
    └── claude/              # Intake prompts, profile generation
```

---

## Architecture

```
Caregiver                    Patient
    │                            │
    ▼                            ▼
Guided Onboarding          ElevenLabs Voice Agent
(streaming chat)           (dynamic system prompt)
    │                            │
    ▼                            │
patient_profiles ───────────────►  Personalized context
    │                            │
    │                  tool call: notify_caregiver
    │                            │
    ▼                            ▼
Supabase ◄─────────── incidents table
    │
    ▼ Realtime
Caregiver Dashboard
(alert banner)
    │
    ▼
Firecrawl
(care protocols)
```

---

## Docs

- [Setup Guide](docs/setup.md) — Step-by-step account and environment setup
- [ElevenLabs Agent Config](docs/elevenlabs-setup.md) — Agent creation, tools, webhooks
- [Database Schema](docs/schema.md) — All tables, columns, RLS policies
- [Architecture](docs/architecture.md) — System design and data flow

---

## Built for

[Hackathon] — Built in 2 days using ElevenLabs Conversational AI and Firecrawl.
