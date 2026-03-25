import { firecrawl } from "./client";
import { createClient } from "@/lib/supabase/server";

interface FamiliarWorldParams {
  patientId: string;
  churchName?: string | null;
  hometown?: string | null;
  state?: string | null;
  favoriteTeam?: string | null;
}

// Searches the web for patient-specific context and saves talking points.
// Called in the background after caregiver profile is saved.
export async function fetchFamiliarWorld({
  patientId,
  churchName,
  hometown,
  state,
  favoriteTeam,
}: FamiliarWorldParams): Promise<void> {
  const queries: { query: string; label: string }[] = [];

  if (churchName) {
    queries.push({
      query: `"${churchName}" church service schedule this week`,
      label: `${churchName}`,
    });
  }

  if (hometown && state) {
    queries.push({
      query: `${hometown} ${state} local community events this week`,
      label: `${hometown} events`,
    });
  } else if (hometown) {
    queries.push({
      query: `${hometown} local community events this week`,
      label: `${hometown} events`,
    });
  }

  if (favoriteTeam) {
    queries.push({
      query: `${favoriteTeam} latest game recap news`,
      label: `${favoriteTeam}`,
    });
  }

  if (queries.length === 0) return;

  const talkingPoints: string[] = [];

  // Run searches in parallel
  const results = await Promise.allSettled(
    queries.map(({ query }) =>
      firecrawl.search(query, { limit: 2, scrapeOptions: { formats: ["markdown"] } })
    )
  );

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && (result.value.data ?? []).length > 0) {
      const label = queries[index].label;
      const firstResult = result.value.data[0];
      const snippet = (firstResult.description ?? firstResult.markdown)
        ?.slice(0, 300)
        .replace(/\n+/g, " ")
        .trim();

      if (snippet) {
        talkingPoints.push(`${label}: ${snippet}`);
      }
    }
  });

  if (talkingPoints.length === 0) return;

  // Save to patient_profiles
  const supabase = await createClient();

  await supabase
    .from("patient_profiles")
    .update({ talking_points: talkingPoints })
    .eq("patient_id", patientId);
}
