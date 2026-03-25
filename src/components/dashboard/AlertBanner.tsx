"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Incident {
  id: string;
  title: string;
  severity: string;
  created_at: string;
  patient_id: string;
  patientName?: string;
}

export function AlertBanner() {
  const [incident, setIncident] = useState<Incident | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("incidents-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "incidents" },
        async (payload) => {
          const row = payload.new as Incident;

          // Fetch patient name for the banner
          const { data: patient } = await supabase
            .from("patients")
            .select("preferred_name, full_name")
            .eq("id", row.patient_id)
            .single();

          const name =
            patient?.preferred_name ?? patient?.full_name ?? "A patient";

          setIncident({ ...row, patientName: name });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!incident) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg">
      <div className="mx-auto max-w-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xl" aria-hidden>
            🚨
          </span>
          <div>
            <p className="font-semibold leading-tight">
              {incident.patientName} needs attention
            </p>
            <p className="text-sm text-red-100">{incident.title}</p>
          </div>
        </div>
        <button
          onClick={() => setIncident(null)}
          aria-label="Dismiss alert"
          className="shrink-0 text-white/70 hover:text-white text-2xl font-bold leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
