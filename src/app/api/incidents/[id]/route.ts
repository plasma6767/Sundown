import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { status } = body;

  // Verify the incident belongs to one of this caregiver's patients
  const { data: patientRows } = await supabase
    .from("patients")
    .select("id")
    .eq("caregiver_id", user.id);

  const patientIds = (patientRows ?? []).map((p) => p.id);

  const { error } = await supabase
    .from("incidents")
    .update({
      status,
      acknowledged_at: status === "acknowledged" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .in("patient_id", patientIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
