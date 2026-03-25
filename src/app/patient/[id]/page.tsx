import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

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

  // Use service role to bypass RLS — patient has no auth session
  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, preferred_name, access_token, onboarding_status")
    .eq("id", id)
    .single();

  if (!patient) {
    notFound();
  }

  // Verify token matches
  if (patient.access_token !== token) {
    return <InvalidLink />;
  }

  const displayName = patient.preferred_name ?? patient.full_name;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <h1 className="text-3xl font-bold text-foreground">
          Hello, {displayName}
        </h1>
        <p className="text-muted-foreground">
          Your companion is ready to talk with you.
        </p>

        {/* Voice interface will be built in Step 4 */}
        <div className="rounded-2xl border-2 border-dashed border-border p-12">
          <p className="text-sm text-muted-foreground">
            Voice interface — coming in Step 4
          </p>
        </div>
      </div>
    </main>
  );
}

function InvalidLink() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold text-foreground">Link not valid</h1>
        <p className="text-sm text-muted-foreground">
          This link may have expired or is incorrect. Please ask your caregiver for a new one.
        </p>
      </div>
    </main>
  );
}
