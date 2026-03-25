import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/claude/client";
import { CAREGIVER_INTAKE_EXTRACTION_PROMPT } from "@/lib/claude/onboarding";
import { fetchFamiliarWorld } from "@/lib/firecrawl/familiar-world";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ExtractedProfile {
  full_name: string | null;
  preferred_name: string | null;
  diagnosis_stage: "mild" | "moderate" | "severe" | null;
  diagnosis_duration: string | null;
  sundown_window_start: string | null;
  sundown_window_end: string | null;
  sundown_behaviors: string[];
  distress_triggers: string[];
  calming_strategies: string[];
  dangerous_behaviors: string[];
  never_say_items: string[];
  deceased_relatives_handling: string | null;
  escalation_threshold: string | null;
  church_name: string | null;
  hometown: string | null;
  state: string | null;
  favorite_team: string | null;
  medications_notes: string | null;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { transcript } = body as {
    transcript: { role: string; content: string }[];
  };

  if (!transcript || transcript.length === 0) {
    return NextResponse.json(
      { error: "Transcript is required" },
      { status: 400 }
    );
  }

  // Format transcript as plain text for extraction
  const transcriptText = transcript
    .map((m) => `${m.role === "user" ? "Caregiver" : "Agent"}: ${m.content}`)
    .join("\n");

  // Ask Claude to extract structured profile from transcript
  let extraction;
  try {
    extraction = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: CAREGIVER_INTAKE_EXTRACTION_PROMPT + transcriptText,
        },
      ],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Claude API error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const rawText =
    extraction.content[0].type === "text" ? extraction.content[0].text : "";

  // Extract the JSON object from Claude's response (handles fences + surrounding text)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  const cleanedText = jsonMatch ? jsonMatch[0] : rawText.trim();

  let profile: ExtractedProfile;

  try {
    profile = JSON.parse(cleanedText) as ExtractedProfile;
  } catch {
    console.error("[generate-profile] Claude raw response:", rawText);
    return NextResponse.json(
      { error: "Failed to parse profile. Please try again." },
      { status: 500 }
    );
  }

  // Create patient row
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .insert({
      caregiver_id: user.id,
      full_name: profile.full_name ?? "Unknown",
      preferred_name: profile.preferred_name,
      diagnosis_stage: profile.diagnosis_stage,
      city: profile.hometown,
      state: profile.state,
      onboarding_status: "caregiver_complete",
    })
    .select("id, access_token")
    .single();

  if (patientError || !patient) {
    return NextResponse.json(
      { error: "Failed to create patient record." },
      { status: 500 }
    );
  }

  // Create patient profile row
  const { error: profileError } = await supabase
    .from("patient_profiles")
    .insert({
      patient_id: patient.id,
      sundown_window_start: profile.sundown_window_start,
      sundown_window_end: profile.sundown_window_end,
      distress_triggers: profile.distress_triggers ?? [],
      calming_strategies: profile.calming_strategies ?? [],
      never_say_items: [
        ...(profile.never_say_items ?? []),
        ...(profile.dangerous_behaviors ?? []),
      ],
      deceased_relatives_handling: profile.deceased_relatives_handling,
      church_name: profile.church_name,
      hometown: profile.hometown,
      favorite_team: profile.favorite_team,
      onboarding_transcript: transcript,
      ai_summary: [
        profile.diagnosis_stage
          ? `Diagnosis: ${profile.diagnosis_stage} stage`
          : null,
        profile.diagnosis_duration
          ? `Duration: ${profile.diagnosis_duration}`
          : null,
        profile.escalation_threshold
          ? `Escalate when: ${profile.escalation_threshold}`
          : null,
        profile.medications_notes
          ? `Medications: ${profile.medications_notes}`
          : null,
      ]
        .filter(Boolean)
        .join(". "),
    });

  if (profileError) {
    // Clean up patient row if profile insert fails
    await supabase.from("patients").delete().eq("id", patient.id);
    return NextResponse.json(
      { error: "Failed to save patient profile." },
      { status: 500 }
    );
  }

  // Fire Firecrawl familiar world search in the background (non-blocking)
  fetchFamiliarWorld({
    patientId: patient.id,
    churchName: profile.church_name,
    hometown: profile.hometown,
    state: profile.state,
    favoriteTeam: profile.favorite_team,
    diagnosisStage: profile.diagnosis_stage,
  }).catch((err) =>
    console.error("[familiar-world] Background search failed:", err)
  );

  // Build the patient kiosk URL with token
  const patientUrl = `${process.env.NEXT_PUBLIC_APP_URL}/patient/${patient.id}?token=${patient.access_token}`;

  return NextResponse.json({
    success: true,
    patientId: patient.id,
    patientUrl,
    profile,
  });
}
