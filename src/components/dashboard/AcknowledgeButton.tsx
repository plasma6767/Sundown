"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AcknowledgeButton({ incidentId }: { incidentId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAcknowledge() {
    setLoading(true);
    await fetch(`/api/incidents/${incidentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "acknowledged" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleAcknowledge}
      disabled={loading}
      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 disabled:opacity-50"
    >
      {loading ? "Acknowledging…" : "Acknowledge"}
    </button>
  );
}
