import { firecrawl } from "./client";
import { createClient } from "@/lib/supabase/server";

interface FamiliarWorldParams {
  patientId: string;
  churchName?: string | null;
  hometown?: string | null;
  state?: string | null;
  favoriteTeam?: string | null;
  diagnosisStage?: string | null;
}

// Searches the web for patient-specific context and saves talking points.
// Called in the background after caregiver profile is saved.
export async function fetchFamiliarWorld({
  patientId,
  churchName,
  hometown,
  state,
  favoriteTeam,
  diagnosisStage,
}: FamiliarWorldParams): Promise<void> {
  const queries: { query: string; label: string }[] = [];

  if (churchName) {
    // Specific church bulletin search — Sunny can mention upcoming services
    queries.push({
      query: `"${churchName}" church bulletin announcements this week`,
      label: `${churchName} church`,
    });
  }

  if (hometown && state) {
    queries.push({
      query: `${hometown} ${state} local news community events this week`,
      label: `${hometown} news`,
    });
  } else if (hometown) {
    queries.push({
      query: `${hometown} local news community events this week`,
      label: `${hometown} news`,
    });
  }

  if (favoriteTeam) {
    // Latest game recap — Sunny can celebrate or commiserate naturally
    queries.push({
      query: `${favoriteTeam} latest game result recap highlights`,
      label: `${favoriteTeam}`,
    });
  }

  // Add a stage-appropriate care tip as a talking point for Sunny
  if (diagnosisStage) {
    queries.push({
      query: `dementia ${diagnosisStage} stage daily activities comfort tips`,
      label: "care tip",
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
