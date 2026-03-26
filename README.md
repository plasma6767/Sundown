# Sundown

Sundown is a voice-first care platform that pairs each dementia patient with a personalized AI companion named Sunny. Caregivers onboard their loved one through a guided voice conversation; Sunny uses that knowledge to have meaningful, grounding interactions — calling the patient by their preferred name, asking about their church, their grandchildren, their favorite team. When distress rises, the caregiver is alerted in real time.

---

## The Problem

Sundowning affects up to 20% of people with dementia. Confusion, anxiety, and agitation typically peak in the late afternoon and evening — exactly when caregivers are most exhausted and least available. There is no scalable, personalized solution that bridges this gap.

## The Solution

**Three layers working together:**

1. **Personalized Voice Companion** — An ElevenLabs conversational agent dynamically configured with each patient's memories, routines, trusted people, and calming strategies. Speaks slowly and warmly. Knows when to escalate.

2. **Guided Caregiver Onboarding** — A voice conversation with Sunny replaces cold intake forms. Caregivers talk naturally; Claude automatically extracts a structured care profile from the transcript.

3. **Live Care Intelligence** — Firecrawl continuously maps and extracts structured protocols from the Alzheimer's Association and National Institute on Aging. The agent's guidance stays current without any manual updates.

---

## Demo

**Full flow:**
1. Caregiver signs up and completes a voice intake with Sunny
2. Claude extracts a structured profile — routines, triggers, church, hometown, favorite team — from the conversation transcript
3. Firecrawl searches for real talking points: the patient's actual church bulletin, local hometown news, recent team recap
4. Patient opens their personal kiosk link and starts talking — Sunny calls them by name and references their life
5. Patient expresses distress — risk score fires — caregiver dashboard alerts in real time via Supabase Realtime
6. Care Intelligence panel shows Firecrawl scraping alz.org and nia.nih.gov live, populating structured do/don't protocol cards

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Database | Supabase (PostgreSQL + Auth + Realtime) |
| Voice AI | ElevenLabs Conversational AI |
| LLM | Claude API (claude-sonnet-4-6) |
| Web Intelligence | Firecrawl (search, map, extract) |
| Styling | Tailwind CSS + shadcn/ui |

---

## ElevenLabs Features Used

| Feature | How It's Used |
|---|---|
| **Conversational AI** | Powers both the caregiver voice intake (Sunny collects care profile) and the patient kiosk (Sunny holds the companion conversation) |
| **Dynamic Variables** | Patient name, church, hometown, favorite team, and calming strategies injected at session start — one agent, infinitely personalized |
| **Signed Session URLs** | Server-side session creation overrides the system prompt per patient at runtime |
| **25s Turn Timeout** | Dementia patients speak slowly — Sunny waits instead of interrupting |
| **90s Silence Timeout** | Won't end the call on long pauses, which are common and normal for this population |
| **Audio Expression Tags** | `[slow]` `[warm]` `[gentle]` shape vocal tone throughout; shifts to `[calm]` `[reassuring]` when distress is detected |
| **Stage-Aware Pacing** | Severe stage: 3–5 word sentences, frequent repetition. Moderate: short and slow. Mild: natural warmth. All configured via system prompt |
| **Post-Call Webhook + Auto-Analysis** | ElevenLabs sends transcript and AI-generated summary after every session — powers session cards on the dashboard with no extra Claude call |
| **Dynamic Variable Echoing** | `patient_id` echoed back in the webhook payload for reliable session-to-patient linking without fragile metadata |

## Firecrawl Features Used

| Feature | How It's Used |
|---|---|
| **Map Endpoint** | Discovers relevant subpages from `alz.org` and `nia.nih.gov` programmatically before crawling — no hardcoded URLs |
| **Extract with Schema** | Turns medical pages into typed protocol objects with `communication_do`, `communication_dont`, `summary_for_agent`, `stage_relevance`, and `confidence_score`. Extracts below 0.4 confidence are discarded |
| **Search Endpoint** | Powers familiar-world reconstruction: searches for the patient's actual church bulletin, hometown events, and recent team recap to create personalized talking points |
| **Diagnosis-Stage Search** | Fetches stage-appropriate daily activity tips as an additional talking point injected into every session |

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

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

See [docs/setup.md](docs/setup.md) for step-by-step instructions for each service.

### 3. Run database migrations

Run these in order in your Supabase SQL editor:

```
supabase/migrations/0001_schema.sql
supabase/migrations/0002_rls.sql
supabase/migrations/0003_functions.sql
supabase/migrations/0004_access_token.sql
```

### 4. Configure the ElevenLabs agent

See [docs/elevenlabs-setup.md](docs/elevenlabs-setup.md) for agent settings, system prompt, webhook configuration, and tool definitions.

### 5. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

For webhook testing, run ngrok in a separate terminal:

```bash
ngrok http 3000
```

Update the post-call webhook URL and incidents tool URL in your ElevenLabs agent settings to the ngrok forwarding address.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                   # Login, signup, email confirmation
│   ├── onboarding/
│   │   └── caregiver/            # Voice intake → profile preview → dashboard
│   ├── dashboard/
│   │   ├── page.tsx              # Incident feed + patient cards
│   │   ├── patients/[id]/        # Patient profile + session history
│   │   └── care-intelligence/    # Firecrawl protocol panel
│   ├── patient/[id]/             # Token-authenticated patient kiosk
│   └── api/
│       ├── auth/callback/        # Supabase OAuth callback
│       ├── incidents/            # Create + acknowledge incidents (ElevenLabs tool)
│       ├── patients/[id]/        # Update patient profile
│       ├── voice/
│       │   ├── session/          # Build personalized prompt + return signed ElevenLabs URL
│       │   └── webhook/          # Post-call webhook → save transcript + compute risk score
│       ├── onboarding/
│       │   ├── generate-profile/ # Extract structured profile from transcript + create patient
│       │   └── voice-token/      # Signed URL for caregiver voice intake session
│       └── firecrawl/
│           └── crawl-protocols/  # Map + extract care protocols from alz.org and nia.nih.gov
├── components/
│   ├── onboarding/
│   │   ├── CaregiverVoiceIntake.tsx  # Mic button, animated orb, conversation state
│   │   └── ProfilePreview.tsx        # Review extracted profile before saving
│   ├── voice/
│   │   └── PatientVoiceKiosk.tsx     # Patient-facing animated orb and voice session
│   └── dashboard/
│       ├── AlertBanner.tsx            # Real-time distress alert via Supabase Realtime
│       ├── AcknowledgeButton.tsx
│       ├── CopyLinkButton.tsx
│       ├── PatientProfileEditForm.tsx
│       └── RefreshProtocolsButton.tsx
└── lib/
    ├── supabase/                  # Browser + server clients
    ├── elevenlabs/
    │   └── prompt-builder.ts      # Stage-aware personalized system prompt construction
    ├── firecrawl/
    │   ├── client.ts
    │   ├── protocols.ts           # Map URL discovery + schema extraction pipeline
    │   ├── familiar-world.ts      # Church, team, hometown talking point search
    │   └── weather.ts             # Live weather lookup for session context
    └── claude/
        ├── client.ts
        └── onboarding.ts          # Caregiver intake system prompt + extraction prompt
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

## Documentation

- [Setup Guide](docs/setup.md) — Step-by-step account and environment configuration
- [ElevenLabs Agent Config](docs/elevenlabs-setup.md) — Agent creation, system prompt, tools, webhooks, dynamic variables
- [Database Schema](docs/schema.md) — Tables, columns, RLS policies, and relationships

---

## Built With

[ElevenLabs](https://elevenlabs.io) · [Firecrawl](https://firecrawl.dev) · [Anthropic Claude](https://anthropic.com) · [Supabase](https://supabase.com) · [Next.js](https://nextjs.org)
