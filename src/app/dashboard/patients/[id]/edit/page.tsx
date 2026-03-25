import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PatientProfileEditForm } from "@/components/dashboard/PatientProfileEditForm";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPatientPage({ params }: EditPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, preferred_name, diagnosis_stage, city, state, caregiver_id")
    .eq("id", id)
    .eq("caregiver_id", user.id)
    .single();

  if (!patient) notFound();

  const { data: profile } = await supabase
    .from("patient_profiles")
    .select(
      "distress_triggers, calming_strategies, never_say_items, deceased_relatives_handling, escalation_threshold, church_name, hometown, favorite_team"
    )
    .eq("patient_id", id)
    .single();

  const displayName = patient.preferred_name ?? patient.full_name;

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to dashboard
          </a>
          <h1 className="mt-3 text-3xl font-bold text-foreground">
            Edit profile — {displayName}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Changes here are reflected in Sunny&apos;s next session immediately.
          </p>
        </div>

        <PatientProfileEditForm
          patientId={id}
          initial={{
            preferred_name: patient.preferred_name ?? "",
            diagnosis_stage: patient.diagnosis_stage ?? "",
            city: patient.city ?? "",
            state: patient.state ?? "",
            distress_triggers: profile?.distress_triggers ?? [],
            calming_strategies: profile?.calming_strategies ?? [],
            never_say_items: profile?.never_say_items ?? [],
            deceased_relatives_handling: profile?.deceased_relatives_handling ?? "",
            escalation_threshold: profile?.escalation_threshold ?? "",
            church_name: profile?.church_name ?? "",
            hometown: profile?.hometown ?? "",
            favorite_team: profile?.favorite_team ?? "",
          }}
        />
      </div>
    </main>
  );
}
