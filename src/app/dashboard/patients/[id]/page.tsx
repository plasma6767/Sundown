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
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <a
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Dashboard
            </a>
            <h1 className="text-3xl font-bold text-foreground mt-1">{name}</h1>
            {patient.diagnosis_stage && (
              <p className="text-muted-foreground capitalize mt-0.5">
                {patient.diagnosis_stage} stage
              </p>
            )}
          </div>
          <a
            href={`/dashboard/patients/${id}/edit`}
            className="shrink-0 rounded-lg border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Edit profile
          </a>
        </div>

        {/* Profile */}
        <section className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
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
              <p className="text-xs font-medium text-muted-foreground mb-1">Escalation threshold</p>
              <p className="text-sm">{profile.escalation_threshold}</p>
            </div>
          )}
          {profile?.talking_points?.length ? (
            <TagList label="Talking points (Firecrawl)" items={profile.talking_points} color="blue" />
          ) : null}
          <div className="pt-1">
            <a
              href={patientUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Open patient kiosk →
            </a>
          </div>
        </section>

        {/* Incidents */}
        {incidents && incidents.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Incidents
            </h2>
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className={`rounded-xl border p-4 flex items-start gap-3 ${
                  inc.status === "open"
                    ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900"
                    : "border-border bg-card opacity-60"
                }`}
              >
                <span className="text-lg mt-0.5" aria-hidden>
                  {inc.status === "open" ? "🚨" : "✓"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{inc.title}</p>
                  {inc.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{inc.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-muted-foreground">
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
                      ? "bg-red-600 text-white"
                      : "bg-orange-100 text-orange-700"
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
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recent sessions
            </h2>
            {sessions.map((s) => (
              <div key={s.id} className="rounded-xl border bg-card p-4 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {formatDistanceToNow(new Date(s.started_at), { addSuffix: true })}
                  </p>
                  <div className="flex items-center gap-2">
                    {s.escalated && (
                      <span className="rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-medium">
                        Escalated
                      </span>
                    )}
                    {s.risk_score !== null && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          s.risk_score > 60
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        Risk {s.risk_score}/100
                      </span>
                    )}
                  </div>
                </div>
                {s.session_summary && (
                  <p className="text-sm text-muted-foreground">{s.session_summary}</p>
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
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
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
  color: "red" | "green" | "orange" | "blue";
}) {
  const colorMap = {
    red: "bg-red-100 text-red-700",
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
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
