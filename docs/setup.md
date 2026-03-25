# Setup Guide

Step-by-step instructions for every service Sundown needs.

---

## 1. Supabase (~20 min)

1. Go to [supabase.com](https://supabase.com) → **Sign up** (GitHub is fastest)
2. Click **New Project** → give it a name (e.g., `sundown`) → pick a region close to you → set a database password
3. Wait ~2 min for project to provision
4. Go to **Project Settings → API**:
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose to the client)
5. Go to **SQL Editor** → run each migration file in order:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_functions.sql`
   - `supabase/migrations/0004_access_token.sql`
6. Go to **Authentication → URL Configuration**:
   - Set **Site URL** to `http://localhost:3000`
   - Add to **Redirect URLs**: `http://localhost:3000/auth/callback`

---

## 2. Anthropic (Claude) (~5 min)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in
3. Go to **API Keys → Create Key**
4. Copy key → `ANTHROPIC_API_KEY`

> **Model used:** `claude-sonnet-4-6` — for caregiver intake streaming and profile extraction.

---

## 3. ElevenLabs (~30 min)

See the dedicated [ElevenLabs Setup Guide](elevenlabs-setup.md) for full agent configuration.

**Quick steps:**
1. Go to [elevenlabs.io](https://elevenlabs.io) → Sign up (free tier works)
2. Create a **Companion Agent** — see full guide for settings, tools, and webhook
3. Copy the Agent ID → `NEXT_PUBLIC_ELEVENLABS_COMPANION_AGENT_ID`
4. Go to **Profile → API Keys** → copy key → `ELEVENLABS_API_KEY`

> **Optional:** Create Grounding and Escalation agents for multi-agent transfer (see elevenlabs-setup.md).

> **Cost:** Free tier. Starter plan is $5/month if you exhaust free minutes.

---

## 4. Firecrawl (~5 min)

1. Go to [firecrawl.dev](https://www.firecrawl.dev) → **Sign up**
2. Dashboard → copy **API Key** → `FIRECRAWL_API_KEY`

> **Cost:** Free tier includes 500 credits/month. Each page crawled = 1 credit.

> Firecrawl is used for: care protocol extraction (alz.org, nia.nih.gov), patient familiar-world searches (church, hometown, team), and weather lookup. All triggered server-side — no webhook config needed.

---

## 5. ngrok — Local Webhook Testing

ElevenLabs sends a post-call webhook to your server after every conversation ends. ngrok creates a public tunnel to your local dev server.

```bash
# Install
brew install ngrok

# Run (in a separate terminal while developing)
ngrok http 3000
```

Copy the `https://xxxx.ngrok.io` URL.

In your ElevenLabs Companion Agent settings → **Webhooks** tab:
- Post-call webhook URL: `https://xxxx.ngrok.io/api/voice/webhook`

For the `notify_caregiver` server tool:
- Tool URL: `https://xxxx.ngrok.io/api/incidents?secret=YOUR_INCIDENTS_WEBHOOK_SECRET`

> **Note:** The ngrok URL changes every restart on the free plan. Update ElevenLabs webhook URLs accordingly.

---

## 6. Final .env.local

Your completed `.env.local` should look like:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# ElevenLabs
ELEVENLABS_API_KEY=sk_...
NEXT_PUBLIC_ELEVENLABS_COMPANION_AGENT_ID=agent_...

# Optional: multi-agent transfer
NEXT_PUBLIC_ELEVENLABS_GROUNDING_AGENT_ID=agent_...
NEXT_PUBLIC_ELEVENLABS_ESCALATION_AGENT_ID=agent_...

# Firecrawl
FIRECRAWL_API_KEY=fc-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Webhook security (any random string — set the same value in ElevenLabs tool URL)
INCIDENTS_WEBHOOK_SECRET=your-secret-here
```

---

## 7. Verify Everything Works

```bash
pnpm dev
```

1. Go to `http://localhost:3000` → landing page with Sunny mascot
2. Click **Sign Up** → create account → confirm email → redirected to dashboard
3. Dashboard shows empty state → click **Add Patient** or go to `/onboarding/caregiver`
4. Speak with Sunny through the intake → profile generates → patient kiosk link appears
5. Open the patient link → kiosk loads → tap the orb → Sunny greets the patient by name
6. After the session ends, check Supabase → `voice_sessions` for transcript + summary
