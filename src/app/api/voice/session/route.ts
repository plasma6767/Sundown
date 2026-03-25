import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { buildPatientSystemPrompt } from "@/lib/elevenlabs/prompt-builder";
import { fetchCurrentWeather } from "@/lib/firecrawl/weather";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const token = searchParams.get("token");

  if (!patientId || !token) {
    return NextResponse.json(
      { error: "patientId and token are required" },
      { status: 400 }
    );
  }

  // Service role bypasses RLS — patient has no auth session; token is the auth
  const supabase = createServiceClient();

  // Verify patient + token
  const { data: patient } = await supabase
    .from("patients")
    .select(
      "id, full_name, preferred_name, diagnosis_stage, city, state, access_token, onboarding_status"
    )
    .eq("id", patientId)
    .single();

  if (!patient || patient.access_token !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Fetch patient profile
  const { data: profile } = await supabase
    .from("patient_profiles")
    .select(
      "distress_triggers, calming_strategies, never_say_items, deceased_relatives_handling, escalation_threshold, church_name, hometown, favorite_team, talking_points"
    )
    .eq("patient_id", patientId)
    .single();

  // Fetch live weather (non-blocking — null if it fails)
  const weather = await fetchCurrentWeather(
    patient.city ?? profile?.hometown ?? null,
    patient.state ?? null
  );

  // Build personalized system prompt
  const systemPrompt = buildPatientSystemPrompt(patient, profile ?? {
    distress_triggers: null,
    calming_strategies: null,
    never_say_items: null,
    deceased_relatives_handling: null,
    escalation_threshold: null,
    church_name: null,
    hometown: null,
    favorite_team: null,
    talking_points: null,
  }, weather);

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_COMPANION_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!agentId || !apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs not configured" },
      { status: 500 }
    );
  }

  // Get signed URL from ElevenLabs
  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
    { headers: { "xi-api-key": apiKey } }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `ElevenLabs error: ${text}` },
      { status: res.status }
    );
  }

  const { signed_url } = await res.json();
  const name = patient.preferred_name ?? patient.full_name;

  return NextResponse.json({
    signedUrl: signed_url,
    systemPrompt,
    patientName: name,
  });
}
