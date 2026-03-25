import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// ElevenLabs post-call webhook — fires after every conversation ends.
// Configure in ElevenLabs dashboard → Agent → Post-call webhook → URL:
//   https://<your-ngrok>.ngrok.io/api/voice/webhook
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ received: true });
  }

  const conversationId = body.conversation_id as string | undefined;
  const transcript = Array.isArray(body.transcript) ? body.transcript : [];
  // ElevenLabs includes metadata we injected when starting the session
  const metadata = (body.metadata ?? {}) as Record<string, unknown>;
  const patientId = (metadata.patientId ?? body.patientId) as string | undefined;

  if (!patientId) {
    // No patientId — likely a test ping from ElevenLabs; acknowledge and move on
    console.warn("[voice/webhook] No patientId in payload");
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceClient();

  const riskScore = computeRiskScore(transcript as { role: string; message: string }[]);
  const escalated = riskScore > 60;

  // Upsert session row (may already exist if the session was tracked earlier)
  const { data: session, error: sessionError } = await supabase
    .from("voice_sessions")
    .upsert(
      {
        elevenlabs_session_id: conversationId ?? null,
        patient_id: patientId,
        status: "ended",
        ended_at: new Date().toISOString(),
        transcript,
        risk_score: riskScore,
        escalated,
      },
      { onConflict: "elevenlabs_session_id" }
    )
    .select("id")
    .single();

  if (sessionError) {
    console.error("[voice/webhook] session upsert error:", sessionError);
  }

  // Auto-create incident if risk is elevated
  if (escalated) {
    const { error: incidentError } = await supabase.from("incidents").insert({
      patient_id: patientId,
      session_id: session?.id ?? null,
      severity: riskScore > 80 ? "critical" : "high",
      title: "Distress detected in session",
      description: `Risk score: ${riskScore}/100. Session ended at ${new Date().toLocaleTimeString()}.`,
      status: "open",
    });

    if (incidentError) {
      console.error("[voice/webhook] incident insert error:", incidentError);
    }
  }

  return NextResponse.json({ received: true });
}

const DISTRESS_WORDS = [
  "help",
  "scared",
  "afraid",
  "pain",
  "hurts",
  "lost",
  "confused",
  "don't know where",
  "i don't know",
  "please",
  "crying",
  "get me out",
  "i'm dying",
  "leave me alone",
  "stop",
  "no no",
];

function computeRiskScore(
  transcript: { role: string; message: string }[]
): number {
  const userMessages = transcript
    .filter((m) => m.role === "user")
    .map((m) => m.message.toLowerCase());

  let score = 0;
  for (const msg of userMessages) {
    for (const word of DISTRESS_WORDS) {
      if (msg.includes(word)) score += 12;
    }
  }
  return Math.min(score, 100);
}
