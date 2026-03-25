import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RefreshProtocolsButton } from "@/components/dashboard/RefreshProtocolsButton";

export default async function CareIntelligencePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: chunks } = await supabase
    .from("knowledge_chunks")
    .select("*")
    .order("crawled_at", { ascending: false });

  return (
    <main className="min-h-screen sundown-bg px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <a
              href="/dashboard"
              className="text-sm text-yellow-400/60 hover:text-yellow-400 transition-colors"
            >
              ← Dashboard
            </a>
            <h1 className="text-3xl font-bold text-white mt-1">
              Care Intelligence
            </h1>
            <p className="text-white/50 mt-1">
              Evidence-based dementia communication protocols, extracted live from
              the Alzheimer&apos;s Association and National Institute on Aging.
            </p>
          </div>
          <RefreshProtocolsButton />
        </div>

        {!chunks || chunks.length === 0 ? (
          <div
            className="rounded-xl border border-yellow-400/15 p-8 text-center space-y-3"
            style={{ background: "rgba(250,204,21,0.03)" }}
          >
            <p className="text-white/50">No protocols loaded yet.</p>
            <p className="text-sm text-white/35">
              Click &ldquo;Refresh Protocols&rdquo; to fetch the latest guidance from dementia
              care authorities.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {chunks.map((chunk) => {
              const structured = chunk.structured as {
                communication_do?: string[];
                communication_dont?: string[];
                summary_for_agent?: string;
              } | null;

              return (
                <div
                  key={chunk.id}
                  className="rounded-xl border border-yellow-400/15 p-5 space-y-4"
                  style={{ background: "rgba(250,204,21,0.03)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-white">{chunk.title}</h2>
                      <a
                        href={chunk.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-yellow-400/50 hover:text-yellow-400 transition-colors"
                      >
                        {chunk.source_name} ↗
                      </a>
                    </div>
                    <span className="shrink-0 rounded-full border border-yellow-400/30 text-yellow-400 px-2.5 py-0.5 text-xs font-medium capitalize">
                      {chunk.category}
                    </span>
                  </div>

                  {structured?.summary_for_agent && (
                    <div
                      className="rounded-lg border border-yellow-400/10 px-4 py-3"
                      style={{ background: "rgba(250,204,21,0.06)" }}
                    >
                      <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-1">
                        Agent instruction
                      </p>
                      <p className="text-sm text-white/80">
                        {structured.summary_for_agent}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    {structured?.communication_do?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">
                          Do
                        </p>
                        <ul className="space-y-1.5">
                          {structured.communication_do.map((item, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className="text-emerald-400 shrink-0">✓</span>
                              <span className="text-white/75">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {structured?.communication_dont?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">
                          Don&apos;t
                        </p>
                        <ul className="space-y-1.5">
                          {structured.communication_dont.map((item, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className="text-red-400 shrink-0">✗</span>
                              <span className="text-white/75">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
