import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify this patient belongs to the caregiver
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("id", id)
    .eq("caregiver_id", user.id)
    .single();

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const body = await request.json();

  // Update patients table fields
  const { preferred_name, diagnosis_stage, city, state } = body;
  const { error: patientError } = await supabase
    .from("patients")
    .update({ preferred_name, diagnosis_stage, city, state })
    .eq("id", id);

  if (patientError) {
    return NextResponse.json({ error: patientError.message }, { status: 500 });
  }

  // Upsert patient_profiles — handles missing row gracefully
  const {
    distress_triggers,
    calming_strategies,
    never_say_items,
    deceased_relatives_handling,
    escalation_threshold,
    church_name,
    hometown,
    favorite_team,
  } = body;

  const { error: profileError } = await supabase
    .from("patient_profiles")
    .upsert({
      patient_id: id,
      distress_triggers,
      calming_strategies,
      never_say_items,
      deceased_relatives_handling,
      escalation_threshold,
      church_name,
      hometown,
      favorite_team,
    }, { onConflict: "patient_id" });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
