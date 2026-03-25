import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { AcknowledgeButton } from "@/components/dashboard/AcknowledgeButton";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, preferred_name, diagnosis_stage, city, state, onboarding_status, access_token")
    .eq("id", id)
    .eq("caregiver_id", user.id)
    .single();

  if (!patient) notFound();

  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("*")
    .eq("patient_id", id)
    .single();

  const { data: sessions } = await supabase
    .from("voice_sessions")
    .select("id, started_at, ended_at, status, risk_score, escalated, session_summary")
    .eq("patient_id", id)
    .order("started_at", { ascending: false })
    .limit(10);

  const { data: incidents } = await supabase
    .from("incidents")
    .select("id, title, description, severity, status, created_at")
    .eq("patient_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const name = patient.preferred_name ?? patient.full_name;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const patientUrl = `${appUrl}/patient/${patient.id}?token=${patient.access_token}`;

  return (
    <main className="sundown-bg relative min-h-screen text-white overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <a
              href="/dashboard"
              className="text-xs text-yellow-400/45 hover:text-white/60 transition-colors tracking-wide"
            >
              ← Dashboard
            </a>
            <h1 className="text-3xl font-light text-white tracking-tight mt-1">{name}</h1>
            {patient.diagnosis_stage && (
              <p className="text-yellow-400/50 capitalize mt-0.5 text-sm">
                {patient.diagnosis_stage} stage
              </p>
            )}
          </div>
          <a
            href={`/dashboard/patients/${id}/edit`}
            className="shrink-0 rounded-xl border border-yellow-400/20 px-4 py-2 text-sm font-medium text-yellow-400/70 hover:text-white hover:border-yellow-400/30 transition-all"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            Edit profile
          </a>
        </div>

        {/* Profile */}
        <section
          className="rounded-2xl border border-yellow-400/15 p-5 space-y-4"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-yellow-400/50">
            Profile
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {patient.city && (
              <Info label="Location" value={`${patient.city}${patient.state ? `, ${patient.state}` : ""}`} />
            )}
            {profile?.church_name && <Info label="Church" value={profile.church_name} />}
            {profile?.hometown && <Info label="Hometown" value={profile.hometown} />}
            {profile?.favorite_team && <Info label="Favorite team" value={profile.favorite_team} />}
          </div>
          {profile?.distress_triggers?.length ? (
            <TagList label="Distress triggers" items={profile.distress_triggers} color="red" />
          ) : null}
          {profile?.calming_strategies?.length ? (
            <TagList label="Calming strategies" items={profile.calming_strategies} color="green" />
          ) : null}
          {profile?.never_say_items?.length ? (
            <TagList label="Never mention" items={profile.never_say_items} color="orange" />
          ) : null}
          {profile?.escalation_threshold && (
            <div>
              <p className="text-xs font-medium text-yellow-400/50 mb-1">Escalation threshold</p>
              <p className="text-sm text-white/60">{profile.escalation_threshold}</p>
            </div>
          )}
          {profile?.talking_points?.length ? (
            <TagList label="Talking points (Firecrawl)" items={profile.talking_points} color="amber" />
          ) : null}
          <div className="pt-1">
            <a
              href={patientUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-xl bg-white text-[#1A0800] px-4 py-2 text-sm font-semibold hover:bg-white/90 transition-all"
            >
              Open patient kiosk →
            </a>
          </div>
        </section>

        {/* Incidents */}
        {incidents && incidents.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-yellow-400/50">
              Incidents
            </h2>
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className={`rounded-xl border p-4 flex items-start gap-3 ${
                  inc.status === "open"
                    ? "border-red-500/20"
                    : "border-yellow-400/10 opacity-50"
                }`}
                style={{
                  background: inc.status === "open"
                    ? "rgba(239,68,68,0.06)"
                    : "rgba(255,255,255,0.02)",
                }}
              >
                <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full flex items-center justify-center ${
                  inc.status === "open" ? "border border-red-500/30" : "border border-yellow-400/20"
                }`}>
                  {inc.status === "open"
                    ? <span className="block h-1.5 w-1.5 rounded-full bg-red-500" />
                    : <span className="block h-1.5 w-1.5 rounded-full bg-white/20" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{inc.title}</p>
                  {inc.description && (
                    <p className="text-sm text-yellow-400/55 mt-0.5">{inc.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-yellow-400/35">
                      {formatDistanceToNow(new Date(inc.created_at), { addSuffix: true })}
                    </p>
                    {inc.status === "open" && (
                      <AcknowledgeButton incidentId={inc.id} />
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    inc.severity === "critical"
                      ? "bg-red-500/20 text-red-400 border border-red-500/25"
                      : "bg-yellow-400/15 text-yellow-400 border border-yellow-400/20"
                  }`}
                >
                  {inc.severity}
                </span>
              </div>
            ))}
          </section>
        )}

        {/* Session history */}
        {sessions && sessions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-yellow-400/50">
              Recent sessions
            </h2>
            {sessions.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-yellow-400/15 p-4 space-y-1"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white/70">
                    {formatDistanceToNow(new Date(s.started_at), { addSuffix: true })}
                  </p>
                  <div className="flex items-center gap-2">
                    {s.escalated && (
                      <span className="rounded-full bg-red-500/15 text-red-400 border border-red-500/20 px-2.5 py-0.5 text-xs font-medium">
                        Escalated
                      </span>
                    )}
                    {s.risk_score !== null && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                          s.risk_score > 60
                            ? "bg-yellow-400/15 text-yellow-400 border-yellow-400/20"
                            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        Risk {s.risk_score}/100
                      </span>
                    )}
                  </div>
                </div>
                {s.session_summary && (
                  <p className="text-sm text-yellow-400/55">{s.session_summary}</p>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-yellow-400/45">{label}</p>
      <p className="font-medium text-white/70 mt-0.5">{value}</p>
    </div>
  );
}

function TagList({
  label,
  items,
  color,
}: {
  label: string;
  items: string[];
  color: "red" | "green" | "orange" | "amber" | "blue";
}) {
  const colorMap = {
    red: "bg-red-500/15 text-red-400/80 border border-red-500/20",
    green: "bg-emerald-500/15 text-emerald-400/80 border border-emerald-500/20",
    orange: "bg-yellow-400/15 text-white/60 border border-yellow-400/20",
    amber: "bg-yellow-500/15 text-white/60 border border-yellow-500/20",
    blue: "bg-blue-500/15 text-blue-400/80 border border-blue-500/20",
  };
  return (
    <div>
      <p className="text-xs font-medium text-yellow-400/45 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[color]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
