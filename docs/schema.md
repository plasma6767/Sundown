# Database Schema

Sundown uses 6 tables in Supabase PostgreSQL. All tables have Row Level Security (RLS) enabled so caregivers can only access their own patients' data.

---

## Tables

### `caregivers`
Linked 1:1 to Supabase Auth users. Created automatically on first login.

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
| `preferred_name` | text | What the companion calls them |
| `city` / `state` | text | For Firecrawl local context |
| `diagnosis_stage` | text | mild / moderate / severe |
| `elevenlabs_agent_id` | text | Per-patient agent override (optional) |
| `voice_id` | text | ElevenLabs voice ID |
| `system_prompt_snapshot` | text | Last generated system prompt |
| `onboarding_status` | text | pending / in_progress / complete |
| `created_at` / `updated_at` | timestamptz | |

---

### `patient_profiles`
Structured data extracted from the Claude onboarding conversation. One per patient.

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
| `hometown` | text | For Firecrawl local context |
| `church_name` | text | For Firecrawl bulletin search |
| `favorite_team` | text | For Firecrawl game recap |
| `meaningful_places` | text[] | |
| `career` | text | |
| `life_highlights` | text[] | Safe memories to reference |
| `distress_triggers` | text[] | Things to avoid |
| `calming_strategies` | text[] | What helps when upset |
| `never_say_items` | text[] | Hard rules |
| `deceased_relatives_handling` | text | How to handle if patient mentions them |
| `humor_level` | text | none / warm / playful |
| `onboarding_transcript` | jsonb | Raw Claude conversation |
| `ai_summary` | text | Claude-generated profile summary |
| `talking_points` | text[] | Populated by Firecrawl after onboarding |
| `created_at` / `updated_at` | timestamptz | |

---

### `voice_sessions`
One row per ElevenLabs conversation session.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `patient_id` | uuid | FK to `patients` |
| `elevenlabs_session_id` | text | unique |
| `started_at` / `ended_at` | timestamptz | |
| `status` | text | active / ended / escalated / error |
| `transcript` | jsonb | `[{role, content, timestamp}]` |
| `session_summary` | text | From ElevenLabs post-call analysis |
| `dominant_emotion` | text | From post-call webhook |
| `risk_score` | integer | 0–100, from post-call evaluation |
| `escalated` | boolean | |
| `escalation_reason` | text | |

---

### `incidents`
Created when the ElevenAgent calls `notify_caregiver` or risk score exceeds threshold.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `patient_id` | uuid | FK to `patients` |
| `session_id` | uuid | FK to `voice_sessions` (nullable) |
| `severity` | text | low / medium / high / critical |
| `title` | text | |
| `description` | text | |
| `status` | text | open / acknowledged / resolved |
| `acknowledged_at` | timestamptz | |
| `created_at` | timestamptz | |

---

### `knowledge_chunks`
Care protocol content extracted by Firecrawl from trusted sources.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `source_name` | text | e.g. `'NIA'`, `'Alzheimers Association'` |
| `source_url` | text | |
| `category` | text | sundowning_interventions / communication_tips / safety / calming_techniques |
| `title` | text | |
| `content` | text | Raw extracted text |
| `structured` | jsonb | Firecrawl extract schema output |
| `crawled_at` | timestamptz | |

---

## RLS Policies

All tables use simple caregiver-scoped policies:

- `caregivers`: can only read/update their own row
- `patients`: can only access patients where `caregiver_id = auth.uid()`
- `patient_profiles`, `voice_sessions`, `incidents`: access through patient's caregiver check
- `knowledge_chunks`: public read (no PII)
