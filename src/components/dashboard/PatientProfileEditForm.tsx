"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PatientProfileEditFormProps {
  patientId: string;
  initial: {
    preferred_name: string;
    diagnosis_stage: string;
    city: string;
    state: string;
    distress_triggers: string[];
    calming_strategies: string[];
    never_say_items: string[];
    deceased_relatives_handling: string;
    escalation_threshold: string;
    church_name: string;
    hometown: string;
    favorite_team: string;
  };
}

export function PatientProfileEditForm({
  patientId,
  initial,
}: PatientProfileEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    preferred_name: initial.preferred_name ?? "",
    diagnosis_stage: initial.diagnosis_stage ?? "",
    city: initial.city ?? "",
    state: initial.state ?? "",
    distress_triggers: (initial.distress_triggers ?? []).join("\n"),
    calming_strategies: (initial.calming_strategies ?? []).join("\n"),
    never_say_items: (initial.never_say_items ?? []).join("\n"),
    deceased_relatives_handling: initial.deceased_relatives_handling ?? "",
    escalation_threshold: initial.escalation_threshold ?? "",
    church_name: initial.church_name ?? "",
    hometown: initial.hometown ?? "",
    favorite_team: initial.favorite_team ?? "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_name: form.preferred_name || null,
          diagnosis_stage: form.diagnosis_stage || null,
          city: form.city || null,
          state: form.state || null,
          distress_triggers: toArray(form.distress_triggers),
          calming_strategies: toArray(form.calming_strategies),
          never_say_items: toArray(form.never_say_items),
          deceased_relatives_handling: form.deceased_relatives_handling || null,
          escalation_threshold: form.escalation_threshold || null,
          church_name: form.church_name || null,
          hometown: form.hometown || null,
          favorite_team: form.favorite_team || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to save");
      toast.success("Profile updated.");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Basic info */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Basic Info
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preferred name" value={form.preferred_name} onChange={(v) => set("preferred_name", v)} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Diagnosis stage</label>
            <select
              value={form.diagnosis_stage}
              onChange={(e) => set("diagnosis_stage", e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Unknown</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
          <Field label="City" value={form.city} onChange={(v) => set("city", v)} />
          <Field label="State" value={form.state} onChange={(v) => set("state", v)} />
        </div>
      </section>

      {/* Personalisation */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Personalisation
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Church / place of worship" value={form.church_name} onChange={(v) => set("church_name", v)} />
          <Field label="Hometown" value={form.hometown} onChange={(v) => set("hometown", v)} />
          <Field label="Favorite sports team" value={form.favorite_team} onChange={(v) => set("favorite_team", v)} />
        </div>
      </section>

      {/* Safety */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Safety & Behaviour
        </h2>
        <p className="text-xs text-muted-foreground">
          For lists, put each item on its own line.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextArea label="Distress triggers" hint="One per line" value={form.distress_triggers} onChange={(v) => set("distress_triggers", v)} />
          <TextArea label="Calming strategies" hint="One per line" value={form.calming_strategies} onChange={(v) => set("calming_strategies", v)} />
          <TextArea label="Never say / never mention" hint="One per line" value={form.never_say_items} onChange={(v) => set("never_say_items", v)} />
          <TextArea label="How to handle deceased relatives" hint="Free text" value={form.deceased_relatives_handling} onChange={(v) => set("deceased_relatives_handling", v)} rows={3} />
        </div>
        <TextArea
          label="Escalation threshold — when should the caregiver be notified?"
          hint="Free text"
          value={form.escalation_threshold}
          onChange={(v) => set("escalation_threshold", v)}
          rows={2}
        />
      </section>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          onClick={() => router.back()}
          className="rounded-lg border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toArray(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

function TextArea({
  label,
  hint,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />
    </div>
  );
}
