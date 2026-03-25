import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { AcknowledgeButton } from "@/components/dashboard/AcknowledgeButton";
import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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

  if (!patients || patients.length === 0) redirect("/onboarding");

  const patientIds = patients.map((p) => p.id);
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
  const firstName = caregiver?.full_name?.split(" ")[0] ?? "there";

  return (
    <main className="sundown-bg relative min-h-screen text-white overflow-hidden">
      {/* Horizon glow */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-12 space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-yellow-400/60 font-medium mb-1">
              Sundown Companion
            </p>
            <h1 className="text-3xl font-light text-white tracking-tight">
              Hello, {firstName}
            </h1>
          </div>
          <a
            href="/dashboard/care-intelligence"
            className="shrink-0 rounded-xl border border-yellow-400/20 px-4 py-2.5 text-sm font-medium text-yellow-400/70 hover:text-white hover:border-yellow-400/30 transition-all"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            Care Intelligence →
          </a>
        </div>

        {/* Open incidents */}
        {incidents && incidents.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-red-400/80">
                Needs attention
              </h2>
            </div>
            {incidents.map((inc) => {
              const patient = patients.find((p) => p.id === inc.patient_id);
              const name = patient?.preferred_name ?? patient?.full_name ?? "Patient";
              return (
                <div
                  key={inc.id}
                  className="rounded-2xl border border-red-500/20 p-4 flex items-start gap-3"
                  style={{ background: "rgba(239,68,68,0.06)" }}
                >
                  <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full border border-red-500/30 flex items-center justify-center">
                    <span className="block h-2 w-2 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{name}</p>
                    {inc.description && (
                      <p className="text-sm text-yellow-400/70 mt-0.5 leading-snug">{inc.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-xs text-yellow-400/35">
                        {formatDistanceToNow(new Date(inc.created_at), { addSuffix: true })}
                      </p>
                      <AcknowledgeButton incidentId={inc.id} />
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                      inc.severity === "critical"
                        ? "bg-red-500/20 text-red-400 border border-red-500/25"
                        : "bg-yellow-400/15 text-yellow-400 border border-yellow-400/20"
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>
              );
            })}
          </section>
        )}

        {/* Patient cards */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-400/45">
            Your patients
          </h2>
          {patients.map((p) => {
            const name = p.preferred_name ?? p.full_name;
            const patientUrl = `${appUrl}/patient/${p.id}?token=${p.access_token}`;
            const hasOpenIncident = incidents?.some(
              (i) => i.patient_id === p.id && i.status === "open"
            );

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-yellow-400/15 p-6 space-y-4 transition-all hover:border-yellow-400/25"
                style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)" }}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2.5 w-2.5 rounded-full shrink-0 mt-0.5 ${
                        hasOpenIncident
                          ? "bg-red-500 animate-pulse"
                          : p.onboarding_status === "complete"
                          ? "bg-emerald-400"
                          : "bg-yellow-400"
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-white text-lg leading-tight">{name}</p>
                      <p className="text-sm text-yellow-400/50 capitalize mt-0.5">
                        {p.diagnosis_stage ? `${p.diagnosis_stage} stage` : "Stage not set"}
                      </p>
                    </div>
                  </div>
                  <CopyLinkButton url={patientUrl} />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <a
                    href={patientUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-white text-[#1A0800] px-4 py-2 text-sm font-semibold hover:bg-white/90 transition-all"
                  >
                    Open kiosk →
                  </a>
                  <a
                    href={`/dashboard/patients/${p.id}`}
                    className="rounded-xl border border-yellow-400/20 px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:border-yellow-400/30 transition-all"
                  >
                    View profile
                  </a>
                  <a
                    href={`/dashboard/patients/${p.id}/edit`}
                    className="rounded-xl border border-yellow-400/15 px-4 py-2 text-sm font-medium text-yellow-400/50 hover:text-white/60 hover:border-yellow-400/25 transition-all"
                  >
                    Edit
                  </a>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
