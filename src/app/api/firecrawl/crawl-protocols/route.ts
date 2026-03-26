import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { crawlCareProtocols } from "@/lib/firecrawl/protocols";

export const maxDuration = 60;

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const protocols = await crawlCareProtocols();

  if (protocols.length === 0) {
    return NextResponse.json({ error: "No protocols extracted" }, { status: 500 });
  }

  // Clear old entries and insert fresh ones
  await supabase.from("knowledge_chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const { error } = await supabase.from("knowledge_chunks").insert(
    protocols.map((p) => ({
      source_name: p.source_name,
      source_url: p.source_url,
      category: p.category,
      title: p.title,
      content: p.summary_for_agent,
      structured: {
        communication_do: p.communication_do,
        communication_dont: p.communication_dont,
        summary_for_agent: p.summary_for_agent,
        stage_relevance: p.stage_relevance ?? "all",
        confidence_score: p.confidence_score ?? null,
      },
    }))
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: protocols.length });
}
