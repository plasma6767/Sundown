interface ExtractedProfile {
  full_name: string | null;
  preferred_name: string | null;
  diagnosis_stage: string | null;
  diagnosis_duration: string | null;
  sundown_window_start: string | null;
  sundown_window_end: string | null;
  sundown_behaviors: string[];
  distress_triggers: string[];
  calming_strategies: string[];
  dangerous_behaviors: string[];
  never_say_items: string[];
  deceased_relatives_handling: string | null;
  escalation_threshold: string | null;
  church_name: string | null;
  hometown: string | null;
  state: string | null;
  favorite_team: string | null;
  medications_notes: string | null;
}

interface ProfilePreviewProps {
  profile: ExtractedProfile;
  patientUrl: string;
  onStartOver: () => void;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="rounded-lg border bg-card p-4 text-sm text-foreground">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="min-w-[140px] text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (!items?.length) return <span className="text-muted-foreground">None noted</span>;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ProfilePreview({ profile, patientUrl, onStartOver }: ProfilePreviewProps) {
  function copyLink() {
    navigator.clipboard.writeText(patientUrl);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {profile.preferred_name ?? profile.full_name ?? "Patient"}&apos;s Care Profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the profile below. The companion will use this to support your loved one safely.
        </p>
      </div>

      <Section title="Identity">
        <div className="space-y-1">
          <Row label="Full name" value={profile.full_name} />
          <Row label="Preferred name" value={profile.preferred_name} />
          <Row label="Diagnosis stage" value={profile.diagnosis_stage} />
          <Row label="How long" value={profile.diagnosis_duration} />
          <Row label="Hometown" value={[profile.hometown, profile.state].filter(Boolean).join(", ")} />
          <Row label="Church" value={profile.church_name} />
          <Row label="Favorite team" value={profile.favorite_team} />
        </div>
      </Section>

      <Section title="Sundowning Window">
        <div className="space-y-1">
          <Row
            label="Typical window"
            value={
              profile.sundown_window_start && profile.sundown_window_end
                ? `${profile.sundown_window_start} – ${profile.sundown_window_end}`
                : null
            }
          />
        </div>
        {profile.sundown_behaviors?.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-muted-foreground">Behaviors during episodes:</p>
            <TagList items={profile.sundown_behaviors} />
          </div>
        )}
      </Section>

      <Section title="Triggers & Calming">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 font-medium">Known triggers</p>
            <TagList items={profile.distress_triggers} />
          </div>
          <div>
            <p className="mb-2 font-medium">What helps</p>
            <TagList items={profile.calming_strategies} />
          </div>
        </div>
      </Section>

      <Section title="Safety Rules">
        <div className="space-y-3">
          {profile.dangerous_behaviors?.length > 0 && (
            <div>
              <p className="mb-1 font-medium text-destructive">Dangerous behaviors</p>
              <TagList items={profile.dangerous_behaviors} />
            </div>
          )}
          {profile.never_say_items?.length > 0 && (
            <div>
              <p className="mb-1 font-medium">Never mention</p>
              <TagList items={profile.never_say_items} />
            </div>
          )}
          {profile.deceased_relatives_handling && (
            <div>
              <p className="mb-1 font-medium">Deceased relatives</p>
              <p>{profile.deceased_relatives_handling}</p>
            </div>
          )}
          {profile.escalation_threshold && (
            <div>
              <p className="mb-1 font-medium">Alert caregiver when</p>
              <p>{profile.escalation_threshold}</p>
            </div>
          )}
        </div>
      </Section>

      {profile.medications_notes && (
        <Section title="Medications">
          <p>{profile.medications_notes}</p>
        </Section>
      )}

      {/* Patient link */}
      <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">
          Patient&apos;s companion link
        </p>
        <p className="text-xs text-muted-foreground">
          Share this link with your loved one. It opens directly to their companion — no login needed.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={patientUrl}
            className="flex-1 rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground"
          />
          <button
            onClick={copyLink}
            className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Copy
          </button>
        </div>
      </div>

      <button
        onClick={onStartOver}
        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Something looks wrong — start over
      </button>
    </div>
  );
}
