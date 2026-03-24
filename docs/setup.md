# Setup Guide

Step-by-step instructions for every service Sundown Companion needs.

---

## 1. Supabase (~20 min)

1. Go to [supabase.com](https://supabase.com) → **Sign up** (GitHub is fastest)
2. Click **New Project** → give it a name (e.g., `sundown-companion`) → pick a region close to you → set a database password (save it somewhere)
3. Wait ~2 min for project to provision
4. Go to **Project Settings → API**:
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — server only)
5. Go to **SQL Editor** → run each migration file in order:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_functions.sql`
6. Go to **Authentication → URL Configuration**:
   - Set **Site URL** to `http://localhost:3000`
   - Add to **Redirect URLs**: `http://localhost:3000/auth/callback`

---

## 2. Anthropic (Claude) (~5 min)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in
3. Go to **API Keys → Create Key**
4. Copy key → `ANTHROPIC_API_KEY`

> **Cost**: ~$0.10 for the entire hackathon at typical usage.

---

## 3. ElevenLabs (~30 min)

See the dedicated [ElevenLabs Setup Guide](elevenlabs-setup.md) for full agent configuration.

**Quick steps:**
1. Go to [elevenlabs.io](https://elevenlabs.io) → Sign up (free tier)
2. Create 3 agents (Companion, Grounding, Escalation) — see full guide
3. Copy each Agent ID → `.env.local`
4. Go to **Profile → API Keys** → copy key → `ELEVENLABS_API_KEY`

> **Cost**: Free tier. If you run out of minutes, Starter plan is $5/month.

---

## 4. Firecrawl (~5 min)

1. Go to [firecrawl.dev](https://www.firecrawl.dev) → **Sign up**
2. Dashboard → copy **API Key** → `FIRECRAWL_API_KEY`
3. Webhooks are configured per-request in the API (no dashboard setup needed)

> **Cost**: Free tier includes 500 credits/month. Each page = 1 credit.

---

## 5. ngrok — Local Webhook Testing

ElevenLabs and Firecrawl need to send webhooks to your local server. ngrok creates a public tunnel.

```bash
# Install
brew install ngrok

# Run (in a separate terminal while developing)
ngrok http 3000
```

Copy the `https://xxxx.ngrok.io` URL.

- In ElevenLabs agent settings → set post-call webhook to `https://xxxx.ngrok.io/api/voice/webhook`
- In Firecrawl requests → set webhook to `https://xxxx.ngrok.io/api/firecrawl/webhook`

> **Note**: The ngrok URL changes every time you restart it (on the free plan). Update webhook URLs accordingly.

---

## 6. Final .env.local

Your completed `.env.local` should look like:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

ANTHROPIC_API_KEY=sk-ant-...

ELEVENLABS_API_KEY=sk_...
NEXT_PUBLIC_ELEVENLABS_COMPANION_AGENT_ID=agent_...
NEXT_PUBLIC_ELEVENLABS_GROUNDING_AGENT_ID=agent_...
NEXT_PUBLIC_ELEVENLABS_ESCALATION_AGENT_ID=agent_...

FIRECRAWL_API_KEY=fc-...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```
