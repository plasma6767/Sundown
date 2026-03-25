import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Called by ElevenLabs as a server tool (notify_caregiver) when agent detects distress.
// Secured via ?secret= query param — set INCIDENTS_WEBHOOK_SECRET in .env.local
// and add the same value as a query param in the ElevenLabs server tool URL.
export async function POST(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.INCIDENTS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const patientId = body.patientId ?? body.patientID;
  const { reason, severity = "high" } = body;

  if (!patientId) {
    return NextResponse.json({ error: "patientId required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { error } = await supabase.from("incidents").insert({
    patient_id: patientId,
    severity,
    title: "Distress detected",
    description: reason ?? "ElevenLabs agent flagged patient distress during conversation.",
    status: "open",
  });

  if (error) {
    console.error("[incidents POST] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
