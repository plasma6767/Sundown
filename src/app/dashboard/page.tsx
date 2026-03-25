import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { AcknowledgeButton } from "@/components/dashboard/AcknowledgeButton";

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

  // Fetch recent open incidents across all this caregiver's patients
  const patientIds = (patients ?? []).map((p) => p.id);
  const { data: incidents } = patientIds.length
    ? await supabase
        .from("incidents")
        .select("id, title, description, severity, status, created_at, patient_id")
        .in("patient_id", patientIds)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [] };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {caregiver?.full_name ?? "Caregiver"}
          </h1>
          <p className="text-muted-foreground mt-1">Caregiver dashboard</p>
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
                    href={`/dashboard/patients/${p.id}`}
                    className="inline-block rounded-lg border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    View profile
                  </a>
                  <a
                    href={`/dashboard/patients/${p.id}/edit`}
                    className="inline-block rounded-lg border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Edit
                  </a>
                </div>
              </div>
            );
          })}
        </div>
        {/* Incidents feed */}
        {incidents && incidents.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Open incidents
            </h2>
            {incidents.map((inc) => {
              const patient = patients.find((p) => p.id === inc.patient_id);
              const name =
                patient?.preferred_name ?? patient?.full_name ?? "Patient";
              return (
                <div
                  key={inc.id}
                  className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4 flex items-start gap-3"
                >
                  <span className="text-lg mt-0.5" aria-hidden>
                    🚨
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                      {name}
                    </p>
                    <p className="text-sm text-muted-foreground">{inc.title}</p>
                    {inc.description && (
                      <p className="text-sm text-foreground mt-0.5">{inc.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(inc.created_at), { addSuffix: true })}
                      </p>
                      <AcknowledgeButton incidentId={inc.id} />
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      inc.severity === "critical"
                        ? "bg-red-600 text-white"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
