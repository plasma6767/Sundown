# ElevenLabs Agent Setup

Sundown uses 3 specialized agents that hand off to each other. The patient hears one coherent voice throughout.

---

## Agent Overview

| Agent | Purpose | Key Setting |
|---|---|---|
| **Companion Agent** | Daily conversation, memory prompts, routine check-ins | Patient turn eagerness, 25s timeout |
| **Grounding Agent** | Confusion handling, reorientation, short calming scripts | Even slower pacing, yes/no questions |
| **Escalation Agent** | Distress handling, calls `notify_caregiver` tool | Calls server tool, ends session safely |

---

## Creating the Companion Agent

1. Go to **elevenlabs.io → Conversational AI → Agents → + New Agent**
2. **Name**: `Sundown Companion`
3. **Voice**: Choose a warm, calm voice (recommended: Sarah or Aria)
4. **Model**: Select `Eleven v3` (enables Expressive Mode and audio tags)

### System Prompt (leave mostly blank — your API injects this at runtime)

```
You are a warm, patient companion. Speak slowly and gently.
Use [slow] and [warm] tone throughout.
If the person seems confused or distressed, use the transfer_to_grounding tool.
```

### Conversation Settings
- **Turn eagerness**: Patient
- **Turn timeout**: 25 seconds
- **Soft timeout**: Enable → set to `use_llm_generated_message: true`
  - This makes filler phrases contextually appropriate (*"I'm here with you..."*)
- **Interruptions**: Disabled (let the patient finish their thought)

### System Prompt Override
- Go to **Advanced** → enable **Allow system prompt override**
- This lets your `/api/voice/session` route inject the full personalized prompt at runtime

### Tools — Add these:

**Server Tool: `notify_caregiver`**
- Type: Server tool (webhook)
- URL: `https://YOUR_NGROK_URL/api/incidents`
- Method: POST
- Description: *"Call this when the patient expresses distress, fear, pain, or asks for their family. Include the reason in the 'reason' field."*
- Body schema:
  ```json
  {
    "reason": "string",
    "severity": "string (low|medium|high|critical)"
  }
  ```

**Server Tool: `transfer_to_grounding`**
- Type: Agent Transfer
- Target: Grounding Agent (set after creating it)
- Description: *"Transfer to grounding agent when patient seems confused about where they are or who people are."*

### Post-Call Webhook
- Go to **Webhooks** tab
- Add webhook URL: `https://YOUR_NGROK_URL/api/voice/webhook`
- Enable: Transcript, Analysis

### Success Evaluation
- Go to **Analysis** tab → add criteria:
  1. *"Patient seemed calm or content at the end of the conversation"*
  2. *"Patient engaged meaningfully (responded to questions, shared memories)"*
  3. *"No escalation was needed"*

### Pronunciation Dictionary
- Go to **Voice** tab → **Pronunciation Dictionary**
- Upload a `.pls` file or add alias rules for the patient's family names after onboarding (you can update this via API)

---

## Creating the Grounding Agent

Same setup as Companion, with these differences:

- **Name**: `Sundown Grounding`
- **System Prompt**:
  ```
  You are a gentle, grounding presence. The person you're speaking with may be confused.
  Use [slow] [calm] tone. Ask only one short question at a time.
  Use yes/no questions when possible. Gently remind them of familiar, comforting facts.
  If distress escalates, use the transfer_to_escalation tool.
  ```
- **Turn timeout**: 30 seconds
- Add **Server Tool: `transfer_to_escalation`** → Agent Transfer to Escalation Agent

---

## Creating the Escalation Agent

- **Name**: `Sundown Escalation`
- **System Prompt**:
  ```
  You are a calm, reassuring presence in a moment of distress.
  Speak very [slow] and [gentle]. Tell the person help is on the way.
  Use the notify_caregiver tool immediately. Then stay on the line with comforting words.
  ```
- Add **Server Tool: `notify_caregiver`** (same as Companion Agent, severity: "critical")

---

## Dynamic Variables Reference

Your API injects these at session start via the system prompt override. Reference them with `{{ variable_name }}` syntax.

| Variable | Source | Example |
|---|---|---|
| `patient_preferred_name` | `patients.preferred_name` | `"Maggie"` |
| `favorite_topics` | `patient_profiles.favorite_topics` | `"gardening, her grandchildren"` |
| `church_name` | `patient_profiles.church_name` | `"First Baptist Church"` |
| `favorite_team` | `patient_profiles.favorite_team` | `"the Cubs"` |
| `calming_strategies` | `patient_profiles.calming_strategies` | `"humming hymns, talking about her garden"` |
| `never_say_items` | `patient_profiles.never_say_items` | `"her late husband Harold"` |
| `talking_points` | `patient_profiles.talking_points` | `"First Baptist has choir this Sunday"` |
| `important_people` | `patient_profiles.important_people` | `"her daughter Sarah"` |

---

## Getting Agent IDs

After creating each agent:
1. Go to the agent's settings page
2. The Agent ID is in the URL: `elevenlabs.io/app/conversational-ai/agents/AGENT_ID_HERE`
3. Copy each into `.env.local`
