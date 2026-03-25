# Sundown

> A voice-first dementia companion that extends caregivers — not replaces them.

Sundown reduces confusion during sundowning episodes by providing a personalized AI voice companion that knows each patient intimately. Caregivers onboard their loved one through a warm guided voice conversation, and the agent uses that knowledge to have meaningful, grounding interactions — calling the patient by their preferred name, asking about their church, their grandchildren, their garden. When distress rises, the system escalates to caregivers in real time.

---

## The Problem

Sundowning affects up to 20% of people with dementia. Episodes of confusion, anxiety, and agitation typically peak in the late afternoon and evening — exactly when caregivers are most exhausted and least available. There is no scalable, personalized solution that bridges this gap.

## The Solution

**Three layers working together:**

1. **Personalized Voice Companion** — An ElevenLabs voice agent dynamically configured with each patient's memories, routines, trusted people, and calming strategies. Speaks slowly and warmly. Knows when to escalate.

2. **Guided Caregiver Onboarding** — A voice conversation with Sunny replaces cold forms. Caregivers talk naturally; the system extracts a structured care profile automatically using Claude.

3. **Live Care Intelligence** — Firecrawl continuously monitors trusted dementia-care sources (NIA, Alzheimer's Association) and extracts structured protocols. The agent's guidance stays current without manual updates.

---

## Demo

> *"It's not just voice plus web scraping. It's a personalized, continuously refreshed, state-aware care system."*

**Demo flow:**
1. Caregiver signs up and speaks with Sunny to onboard their patient
2. Claude extracts a structured profile — routines, triggers, talking points pulled from the patient's real church and hometown via Firecrawl
3. Patient opens their personal kiosk link and starts talking — agent calls them by name, references their life
4. Care Intelligence panel shows live Firecrawl protocol extraction from alz.org and NIA
5. Patient expresses distress — risk score fires — real-time alert appears on caregiver dashboard instantly

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Database | Supabase (PostgreSQL + Auth + Realtime) |
| Voice AI | ElevenLabs Conversational AI |
| LLM | Claude API (claude-sonnet-4-6) |
| Web Intelligence | Firecrawl (search + map + extract) |
| Styling | Tailwind CSS + shadcn/ui, Nunito font |

---

## ElevenLabs Features Used

| Feature | How We Use It |
|---|---|
| **Dynamic Variables** | Inject patient name, memories, church, calming strategies at runtime — one agent, infinitely personalized |
| **25s Turn Timeout** | Dementia patients speak slowly. This makes Sunny wait instead of interrupting — feels genuinely caring |
| **90s Silence End-Call Timeout** | Won't hang up on long pauses — critical for patients who need time to gather thoughts |
| **Expressive Mode + Audio Tags** | `[slow]` `[warm]` `[gentle]` tags in system prompt shape vocal tone. Shifts to `[calm]` `[reassuring]` on distress |
| **Stage-Aware Pacing** | Severe = 3–5 word sentences. Moderate = short + slow. Mild = natural warmth. Configured via prompt |
| **Post-Call Webhook + Auto-Analysis** | ElevenLabs fires transcript + AI summary after every session. Powers dashboard session cards automatically — no extra Claude call |
| **Dynamic Variable Echoing** | `patient_id` echoed back in webhook payload — reliable session-to-patient linking without fragile metadata |
| **Signed Session URLs** | Server-side session creation with overridden system prompt per patient |

## Firecrawl Features Used

| Feature | How We Use It |
|---|---|
| **Map Endpoint** | Discovers relevant subpages from `alz.org` / `nia.nih.gov` programmatically before crawling — no hardcoded URLs |
| **Extract with Schema + Confidence Score** | Turns medical pages into typed care protocol objects with `communication_do`, `communication_dont`, `summary_for_agent`, `stage_relevance`, `confidence_score`. Low-confidence extracts filtered out (<0.4) |
| **Familiar World Reconstruction** | Searches for patient's actual church bulletin, hometown events, favorite team recap — creates personalized talking points injected into every session |
| **Diagnosis-Stage Search** | Fetches stage-appropriate daily activity tips as an additional talking point based on patient's diagnosis |
| **Search Endpoint** | Powers all familiar-world queries: `"First Baptist Church bulletin schedule"`, `"{hometown} local news this week"`, etc. |

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
supabase/migrations/0004_access_token.sql
```

### 4. Configure ElevenLabs

See [docs/elevenlabs-setup.md](docs/elevenlabs-setup.md) for agent configuration, prompt override, webhook setup, and tool definitions.

### 5. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

For webhook testing (ElevenLabs post-call, Firecrawl), run ngrok in a separate terminal:

```bash
ngrok http 3000
```

Update the post-call webhook URL in your ElevenLabs agent settings to the ngrok URL.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                   # Login, signup, email confirmation
│   ├── onboarding/
│   │   └── caregiver/            # Voice intake → profile preview
│   ├── dashboard/
│   │   ├── page.tsx              # Incident feed + patient cards
│   │   ├── patients/[id]/        # Patient profile + session history
│   │   └── care-intelligence/    # Firecrawl protocol panel
│   ├── patient/[id]/             # Token-authenticated patient kiosk
│   └── api/
│       ├── auth/callback/        # Supabase OAuth callback
│       ├── incidents/            # Create + acknowledge incidents
│       ├── patients/[id]/        # Update patient profile
│       ├── voice/
│       │   ├── session/          # Build prompt + return signed ElevenLabs URL
│       │   └── webhook/          # Post-call webhook → save transcript + risk score
│       ├── onboarding/
│       │   ├── chat/             # Stream Claude intake responses
│       │   ├── generate-profile/ # Extract structured profile + create patient
│       │   └── voice-token/      # Signed URL for caregiver voice intake
│       └── firecrawl/
│           └── crawl-protocols/  # Fetch + extract care protocols
├── components/
│   ├── onboarding/
│   │   ├── CaregiverVoiceIntake.tsx  # Voice intake UI (mic button, orb, transcript)
│   │   └── ProfilePreview.tsx         # Review generated profile before saving
│   ├── voice/
│   │   └── PatientVoiceKiosk.tsx     # Animated orb, voice session, state display
│   └── dashboard/
│       ├── AlertBanner.tsx            # Realtime distress alert via Supabase
│       ├── AcknowledgeButton.tsx
│       ├── CopyLinkButton.tsx
│       ├── PatientProfileEditForm.tsx
│       └── RefreshProtocolsButton.tsx
└── lib/
    ├── supabase/          # Browser + server clients
    ├── elevenlabs/
    │   └── prompt-builder.ts    # Stage-aware personalized system prompt
    ├── firecrawl/
    │   ├── client.ts
    │   ├── protocols.ts         # Map discovery + schema extraction
    │   ├── familiar-world.ts    # Church / team / hometown search
    │   └── weather.ts           # Firecrawl-powered weather lookup
    └── claude/
        ├── client.ts
        └── onboarding.ts        # Intake system prompt + extraction prompt
```

---

## Architecture

```
Caregiver                          Patient
    │                                  │
    ▼                                  ▼
Voice Intake (ElevenLabs)         Patient Kiosk (ElevenLabs)
    │                              signed URL + system prompt
    ▼                                  │
Claude (extract profile)        prompt-builder.ts
    │                              (talking points, triggers,
    ▼                               church, team, weather)
patient_profiles ─────────────────►   │
    ▲                                  │
    │ talking_points              tool call: notify_caregiver
Firecrawl                              │
(church, hometown, team,               ▼
 care protocols)              incidents table (Supabase)
                                       │
                               Supabase Realtime
                                       │
                                       ▼
                              Caregiver Dashboard
                              (AlertBanner, incident feed)
```

---

## Docs

- [Setup Guide](docs/setup.md) — Step-by-step account and environment setup
- [ElevenLabs Agent Config](docs/elevenlabs-setup.md) — Agent creation, tools, webhooks, dynamic variables
- [Database Schema](docs/schema.md) — All tables, columns, RLS policies

---

## Built with

ElevenLabs Conversational AI · Firecrawl · Claude API · Supabase
