"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefreshProtocolsButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  async function handleRefresh() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/firecrawl/crawl-protocols", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed");
      setStatus(`Loaded ${data.count} protocol${data.count !== 1 ? "s" : ""}`);
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shrink-0 text-right space-y-1">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="rounded-xl bg-white text-[#1A0800] px-4 py-2 text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-50"
      >
        {loading ? "Fetching…" : "Refresh Protocols"}
      </button>
      {status && (
        <p className="text-xs text-yellow-400/55">{status}</p>
      )}
    </div>
  );
}
