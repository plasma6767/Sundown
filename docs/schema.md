# Database Schema

Sundown uses 6 tables in Supabase PostgreSQL. All tables have Row Level Security (RLS) enabled — caregivers can only access their own patients' data.

---

## Tables

### `caregivers`
Linked 1:1 to Supabase Auth users. Created automatically on signup via the auth callback route.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | FK to `auth.users` |
| `full_name` | text | |
| `email` | text | unique |
| `created_at` | timestamptz | |

---

### `patients`
One caregiver can have multiple patients.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `caregiver_id` | uuid | FK to `caregivers` |
| `full_name` | text | |
| `preferred_name` | text | What Sunny calls them |
| `city` / `state` | text | Used by Firecrawl for local news + weather |
| `diagnosis_stage` | text | `mild` / `moderate` / `severe` |
| `elevenlabs_agent_id` | text | Per-patient agent override (optional) |
| `voice_id` | text | ElevenLabs voice ID (optional) |
| `system_prompt_snapshot` | text | Last generated system prompt (for debug) |
| `onboarding_status` | text | `pending` / `in_progress` / `complete` |
| `access_token` | uuid | Token for patient kiosk URL — no Supabase auth required |
| `created_at` / `updated_at` | timestamptz | |

Patient kiosk URL format: `/patient/[id]?token=[access_token]`

---

### `patient_profiles`
Structured data extracted by Claude from the caregiver voice intake. One row per patient.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `patient_id` | uuid | FK to `patients` (unique) |
| `wake_time` / `sleep_time` | time | Daily routine |
| `sundown_window_start/end` | time | Typical episode window |
| `favorite_topics` | text[] | e.g. `['gardening', 'grandchildren']` |
| `favorite_music_era` | text | e.g. `'1960s'` |
| `hobbies` | text[] | |
| `important_people` | jsonb | `[{name, relation}]` |
| `hometown` | text | Firecrawl local news search |
| `church_name` | text | Firecrawl bulletin search |
| `favorite_team` | text | Firecrawl game recap search |
| `meaningful_places` | text[] | |
| `career` | text | |
| `life_highlights` | text[] | Safe memories Sunny can reference |
| `distress_triggers` | text[] | Topics/situations to avoid |
| `calming_strategies` | text[] | What helps when the patient is upset |
| `never_say_items` | text[] | Hard rules — Sunny never mentions these |
| `deceased_relatives_handling` | text | How to respond if patient asks about deceased family |
| `escalation_threshold` | text | When Sunny should call notify_caregiver |
| `humor_level` | text | `none` / `warm` / `playful` |
| `onboarding_transcript` | jsonb | Raw caregiver intake transcript |
| `ai_summary` | text | Claude-generated profile summary |
| `talking_points` | text[] | Populated by Firecrawl after onboarding (church bulletin, local events, team score) |
| `created_at` / `updated_at` | timestamptz | |

---

### `voice_sessions`
One row per ElevenLabs conversation session. Created/upserted by the post-call webhook.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `patient_id` | uuid | FK to `patients` |
| `elevenlabs_session_id` | text | unique — used for upsert deduplication |
| `started_at` / `ended_at` | timestamptz | |
| `status` | text | `active` / `ended` / `escalated` / `error` |
| `transcript` | jsonb | `[{role, message}]` array from ElevenLabs |
| `session_summary` | text | AI-generated summary from ElevenLabs post-call analysis |
| `dominant_emotion` | text | From post-call analysis (optional) |
| `risk_score` | integer | 0–100, computed from distress keyword frequency |
| `escalated` | boolean | `true` if risk_score > 60 |
| `escalation_reason` | text | |
| `created_at` | timestamptz | |

---

### `incidents`
Created when ElevenLabs calls the `notify_caregiver` server tool, or when a session's risk score exceeds 60.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `patient_id` | uuid | FK to `patients` |
| `session_id` | uuid | FK to `voice_sessions` (nullable) |
| `severity` | text | `low` / `medium` / `high` / `critical` |
| `title` | text | |
| `description` | text | |
| `status` | text | `open` / `acknowledged` / `resolved` |
| `acknowledged_at` | timestamptz | Set when caregiver clicks Acknowledge |
| `created_at` | timestamptz | |

---

### `knowledge_chunks`
Care protocol content extracted by Firecrawl from trusted sources (alz.org, nia.nih.gov).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `source_name` | text | e.g. `'Alzheimer's Association'`, `'National Institute on Aging'` |
| `source_url` | text | The specific page that was extracted |
| `category` | text | e.g. `'communication'` |
| `title` | text | Protocol title |
| `content` | text | Raw extracted text |
| `structured` | jsonb | Typed Firecrawl extract: `{communication_do[], communication_dont[], summary_for_agent, stage_relevance, confidence_score}` |
| `crawled_at` | timestamptz | |

---

## RLS Policies

All tables use caregiver-scoped policies:

| Table | Policy |
|---|---|
| `caregivers` | Read/update own row only (`id = auth.uid()`) |
| `patients` | All operations where `caregiver_id = auth.uid()` |
| `patient_profiles` | Access via patient's caregiver check |
| `voice_sessions` | Access via patient's caregiver check |
| `incidents` | Access via patient's caregiver check |
| `knowledge_chunks` | Public read (no PII — care protocols only) |

The `patient` kiosk route uses the `access_token` UUID for authentication — no Supabase session required. The token is validated server-side before any patient data is returned.
