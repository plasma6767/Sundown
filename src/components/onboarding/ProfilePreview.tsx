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
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-yellow-400/50">
        {title}
      </h3>
      <div
        className="rounded-xl border border-yellow-400/15 p-4 text-sm text-white/80"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="min-w-[140px] text-yellow-400/50 shrink-0">{label}</span>
      <span className="text-white/80">{value}</span>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (!items?.length) return <span className="text-yellow-400/35">None noted</span>;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-yellow-400/50" />
          <span>{item}</span>
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
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-light text-white">
          {profile.preferred_name ?? profile.full_name ?? "Patient"}&apos;s Care Profile
        </h2>
        <p className="mt-1 text-sm text-yellow-400/50">
          Review the profile below. The companion will use this to support your loved one safely.
        </p>
      </div>

      <Section title="Identity">
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
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
            <p className="mb-1.5 text-yellow-400/50 text-xs">Behaviors during episodes:</p>
            <TagList items={profile.sundown_behaviors} />
          </div>
        )}
      </Section>

      <Section title="Triggers & Calming">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-yellow-400/70 uppercase tracking-wider">Known triggers</p>
            <TagList items={profile.distress_triggers} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-yellow-400/70 uppercase tracking-wider">What helps</p>
            <TagList items={profile.calming_strategies} />
          </div>
        </div>
      </Section>

      <Section title="Safety Rules">
        <div className="space-y-3">
          {profile.dangerous_behaviors?.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-red-400/70 uppercase tracking-wider">Dangerous behaviors</p>
              <TagList items={profile.dangerous_behaviors} />
            </div>
          )}
          {profile.never_say_items?.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-yellow-400/70 uppercase tracking-wider">Never mention</p>
              <TagList items={profile.never_say_items} />
            </div>
          )}
          {profile.deceased_relatives_handling && (
            <div>
              <p className="mb-1 text-xs font-medium text-yellow-400/70 uppercase tracking-wider">Deceased relatives</p>
              <p className="text-white/60">{profile.deceased_relatives_handling}</p>
            </div>
          )}
          {profile.escalation_threshold && (
            <div>
              <p className="mb-1 text-xs font-medium text-yellow-400/70 uppercase tracking-wider">Alert caregiver when</p>
              <p className="text-white/60">{profile.escalation_threshold}</p>
            </div>
          )}
        </div>
      </Section>

      {profile.medications_notes && (
        <Section title="Medications">
          <p className="text-white/60">{profile.medications_notes}</p>
        </Section>
      )}

      {/* Patient link */}
      <div
        className="rounded-xl border border-yellow-400/20 p-4 space-y-3"
        style={{ background: "rgba(251,191,36,0.04)" }}
      >
        <p className="text-sm font-medium text-white">
          Patient&apos;s companion link
        </p>
        <p className="text-xs text-yellow-400/50">
          Share this link with your loved one. It opens directly to their companion — no login needed.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={patientUrl}
            className="flex-1 rounded-lg border border-yellow-400/15 bg-yellow-400/5 px-3 py-1.5 text-xs text-yellow-400/55 outline-none"
          />
          <button
            onClick={copyLink}
            className="shrink-0 rounded-lg bg-white text-[#1A0800] px-3 py-1.5 text-xs font-semibold hover:bg-white/90 transition-all"
          >
            Copy
          </button>
        </div>
      </div>

      <button
        onClick={onStartOver}
        className="text-xs text-yellow-400/35 underline underline-offset-2 hover:text-yellow-400/70 transition-colors"
      >
        Something looks wrong — start over
      </button>
    </div>
  );
}
