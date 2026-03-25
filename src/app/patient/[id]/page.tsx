import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PatientVoiceKiosk } from "@/components/voice/PatientVoiceKiosk";

interface PatientPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function PatientPage({
  params,
  searchParams,
}: PatientPageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token) {
    return <InvalidLink />;
  }

  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, preferred_name, access_token")
    .eq("id", id)
    .single();

  if (!patient) {
    notFound();
  }

  if (patient.access_token !== token) {
    return <InvalidLink />;
  }

  const displayName = patient.preferred_name ?? patient.full_name;

  return (
    <PatientVoiceKiosk
      patientId={patient.id}
      token={token}
      patientName={displayName}
    />
  );
}

function InvalidLink() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="space-y-3 text-center">
        <h1 className="text-2xl font-bold text-foreground">Link not valid</h1>
        <p className="text-sm text-muted-foreground">
          This link may have expired or is incorrect. Please ask your caregiver
          for a new one.
        </p>
      </div>
    </main>
  );
}
