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
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <a
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Dashboard
            </a>
            <h1 className="text-3xl font-bold text-foreground mt-1">
              Care Intelligence
            </h1>
            <p className="text-muted-foreground mt-1">
              Evidence-based dementia communication protocols, extracted live from
              the Alzheimer's Association and National Institute on Aging.
            </p>
          </div>
          <RefreshProtocolsButton />
        </div>

        {!chunks || chunks.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center space-y-3">
            <p className="text-muted-foreground">No protocols loaded yet.</p>
            <p className="text-sm text-muted-foreground">
              Click "Refresh Protocols" to fetch the latest guidance from dementia
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
                <div key={chunk.id} className="rounded-xl border bg-card p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-foreground">{chunk.title}</h2>
                      <a
                        href={chunk.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {chunk.source_name} ↗
                      </a>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium capitalize">
                      {chunk.category}
                    </span>
                  </div>

                  {structured?.summary_for_agent && (
                    <div className="rounded-lg bg-muted px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Agent instruction
                      </p>
                      <p className="text-sm text-foreground">
                        {structured.summary_for_agent}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    {structured?.communication_do?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                          Do
                        </p>
                        <ul className="space-y-1">
                          {structured.communication_do.map((item, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className="text-green-600 shrink-0">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {structured?.communication_dont?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">
                          Don't
                        </p>
                        <ul className="space-y-1">
                          {structured.communication_dont.map((item, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className="text-red-500 shrink-0">✗</span>
                              <span>{item}</span>
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
