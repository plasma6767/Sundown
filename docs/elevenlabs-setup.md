# ElevenLabs Agent Setup

Sundown uses a Companion Agent as its primary voice interface. The Companion handles daily conversation, detects distress, and can transfer to specialized Grounding and Escalation agents (optional for MVP).

---

## Agent Overview

| Agent | Purpose | Required? |
|---|---|---|
| **Companion Agent** | Daily conversation, memory prompts, familiar-world topics | Required |
| **Grounding Agent** | Confusion/disorientation handling, yes/no questions, reorientation | Optional |
| **Escalation Agent** | High-distress handling, calls `notify_caregiver`, stays on the line | Optional |

---

## Creating the Companion Agent

1. Go to **elevenlabs.io → Conversational AI → Agents → + New Agent**
2. **Name**: `Sundown Companion`
3. **Voice**: Choose a warm, calm voice (recommended: Sarah or Aria)
4. **LLM Model**: Select `Eleven v3` — required for Expressive Mode and audio expression tags (`[slow]`, `[warm]`, etc.)

### System Prompt

Leave this mostly minimal — the full personalized prompt is injected at runtime by `/api/voice/session`:

```
You are a warm, patient companion. Speak slowly and gently.
Use [slow] and [warm] tone throughout.
If the person seems confused or distressed, use the notify_caregiver tool.
```

### Conversation Settings

| Setting | Value | Why |
|---|---|---|
| **Turn timeout** | 25 seconds | Dementia patients speak slowly — wait before replying |
| **Silence end-call timeout** | 90 seconds | Don't hang up on long pauses |
| **Soft timeout message** | LLM-generated | Contextual filler: *"I'm right here with you..."* |
| **Interruptions** | Disabled | Let the patient finish their thought |

### System Prompt Override (Required)

Go to **Security** tab → enable **Allow system prompt override**.

This lets `/api/voice/session` inject a fully personalized prompt per patient at session start — covering their name, talking points, triggers, church, calming strategies, and stage-appropriate pacing.

### Tools

**Server Tool: `notify_caregiver`**
- Type: Server tool (webhook)
- URL: `https://YOUR_NGROK_URL/api/incidents?secret=YOUR_INCIDENTS_WEBHOOK_SECRET`
- Method: POST
- Description: *"Call this when the patient expresses distress, fear, pain, confusion about where they are, or asks for their family. Include a brief reason."*
- Body schema:
  ```json
  {
    "reason": "string",
    "severity": "string — one of: low, medium, high, critical"
  }
  ```

**Optional: Agent Transfer Tools**

If you create the Grounding and Escalation agents:
- `transfer_to_grounding` — Agent Transfer → Grounding Agent
  - Trigger: patient seems confused about location or people
- `transfer_to_escalation` — Agent Transfer → Escalation Agent
  - Trigger: patient expresses severe distress

### Post-Call Webhook

Go to **Webhooks** tab:
- Webhook URL: `https://YOUR_NGROK_URL/api/voice/webhook`
- Enable: **Transcript**, **Analysis**

The webhook fires after every conversation ends. Sundown uses it to save the transcript, read the AI-generated session summary, and compute a distress risk score.

### Success Evaluation Criteria (Optional but recommended)

Go to **Analysis** tab → add criteria:
1. *"Patient seemed calm or content at the end of the conversation"*
2. *"Patient engaged meaningfully — responded to questions, shared memories"*
3. *"No escalation was needed"*

These are included in the post-call webhook payload and saved as part of the session record.

---

## Creating the Grounding Agent (Optional)

Same setup as Companion, with these differences:

- **Name**: `Sundown Grounding`
- **System Prompt**:
  ```
  You are a gentle, grounding presence. The person may be confused.
  Use [slow] [calm] tone. Ask only one short question at a time.
  Prefer yes/no questions. Gently remind them of comforting, familiar facts.
  If distress escalates, use the transfer_to_escalation tool.
  ```
- **Turn timeout**: 30 seconds
- Add **Server Tool: `transfer_to_escalation`** → Agent Transfer to Escalation Agent

---

## Creating the Escalation Agent (Optional)

- **Name**: `Sundown Escalation`
- **System Prompt**:
  ```
  You are a calm, reassuring presence. The person is in distress.
  Speak very [slow] and [gentle]. Tell them help is on the way.
  Use the notify_caregiver tool immediately with severity: critical.
  Then stay on the line and repeat comforting words.
  ```
- Add **Server Tool: `notify_caregiver`** — same config as Companion Agent, severity always `critical`

---

## Dynamic Variables

The system prompt injected at runtime uses these variables (passed as `dynamicVariables` at session start):

| Variable | Source | Example |
|---|---|---|
| `patient_name` | `patients.preferred_name` or `full_name` | `"Maggie"` |
| `patient_id` | `patients.id` | UUID — echoed back in post-call webhook for reliable session linking |

The full personalized context (talking points, triggers, church, team, calming strategies, pacing instructions) is written directly into the system prompt string by `src/lib/elevenlabs/prompt-builder.ts` — not as `{{ variable }}` syntax — to avoid ElevenLabs template parsing issues.

---

## Audio Expression Tags (Eleven v3)

These tags are embedded in the system prompt and first message to shape Sunny's vocal tone:

| Tag | When Used |
|---|---|
| `[warm]` | Default tone throughout |
| `[slow]` | Default pacing — gives patients time to process |
| `[gentle]` | Severe diagnosis stage — very short sentences |
| `[calm]` | Distress detected — shifts to reassuring mode |
| `[reassuring]` | Combined with `[calm]` on distress |

The system prompt includes: *"If they become distressed, shift tone: [calm] [reassuring] — lower your pace, repeat their name, say 'You're safe. I'm right here with you.'"*

---

## Getting Agent IDs

After creating each agent:
1. Go to the agent's settings page
2. The Agent ID appears in the URL: `elevenlabs.io/app/conversational-ai/agents/AGENT_ID_HERE`
3. Copy each into `.env.local`

---

## Testing the Integration

1. Start dev server: `pnpm dev`
2. Start ngrok: `ngrok http 3000` → update webhook URLs in ElevenLabs
3. Open a patient kiosk: `/patient/[id]?token=[token]`
4. Tap the orb → Sunny should greet the patient by name
5. Say something distressing (e.g., "I'm scared, I don't know where I am")
6. Check Supabase → `incidents` table for a new row
7. Check caregiver dashboard for the real-time alert banner
8. End the session → wait ~30s → check `voice_sessions` for transcript + session_summary
