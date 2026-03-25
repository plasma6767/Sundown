import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: caregiver } = await supabase
    .from("caregivers")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: patients } = await supabase
    .from("patients")
    .select("id, full_name, preferred_name, access_token, diagnosis_stage, onboarding_status")
    .eq("caregiver_id", user.id)
    .order("created_at", { ascending: false });

  // No patients yet — send caregiver to onboarding
  if (!patients || patients.length === 0) {
    redirect("/onboarding");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {caregiver?.full_name ?? "Caregiver"}
          </h1>
          <p className="text-muted-foreground mt-1">Full dashboard coming in Step 6.</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Your patients</h2>
          {patients.map((p) => {
            const name = p.preferred_name ?? p.full_name;
            const patientUrl = `${appUrl}/patient/${p.id}?token=${p.access_token}`;
            return (
              <div key={p.id} className="rounded-xl border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{name}</p>
                    {p.diagnosis_stage && (
                      <p className="text-sm text-muted-foreground capitalize">
                        {p.diagnosis_stage} stage
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {p.onboarding_status}
                  </span>
                </div>
                <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground break-all">
                  {patientUrl}
                </div>
                <div className="flex gap-2">
                  <a
                    href={patientUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Open patient kiosk →
                  </a>
                  <a
                    href={`/dashboard/patients/${p.id}/edit`}
                    className="inline-block rounded-lg border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Edit profile
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
