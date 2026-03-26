import { firecrawl } from "./client";

export interface CareProtocol {
  source_name: string;
  source_url: string;
  category: string;
  title: string;
  communication_do: string[];
  communication_dont: string[];
  summary_for_agent: string;
  stage_relevance?: string;
  confidence_score?: number;
}

// Seed domains — we use Firecrawl's map endpoint to discover subpages
// programmatically instead of hardcoding URLs.
const SEED_DOMAINS = [
  { domain: "https://www.alz.org", name: "Alzheimer's Association", category: "communication" },
  { domain: "https://www.nia.nih.gov", name: "National Institute on Aging", category: "communication" },
];

// Path keywords that indicate relevant care protocol content
const RELEVANT_PATH_KEYWORDS = [
  "communicat", "caregiv", "daily-care", "behavior", "confusion",
  "dementia", "alzheimer", "sundown", "agitation", "tips",
];

const EXTRACT_PROMPT = `
Extract dementia caregiver communication guidance from this page.
Return a JSON object with:
- title: short descriptive title for this guidance (string)
- communication_do: array of specific things a companion SHOULD do when communicating with a dementia patient (string[], at least 3 items)
- communication_dont: array of specific things a companion should NOT do (string[], at least 3 items)
- summary_for_agent: one sentence suitable for injecting directly into an AI companion's system prompt (string)
- stage_relevance: which dementia stage this guidance applies to — "mild", "moderate", "severe", or "all" (string)
- confidence_score: how confident you are this page contains actionable guidance, 0.0 to 1.0 (number)
`;

// Use Firecrawl's map endpoint to discover relevant subpages on a domain,
// then run schema extraction only on the most relevant ones.
async function discoverRelevantUrls(domain: string): Promise<string[]> {
  try {
    const mapResult = await firecrawl.mapUrl(domain, { limit: 50 });
    if (!mapResult.success || !Array.isArray(mapResult.links)) return [domain];

    const relevant = mapResult.links.filter((url: string) =>
      RELEVANT_PATH_KEYWORDS.some((kw) => url.toLowerCase().includes(kw))
    );

    // Cap at 4 per domain to stay within rate limits
    return relevant.slice(0, 4).length > 0 ? relevant.slice(0, 4) : [domain];
  } catch {
    // Map failed — fall back to the seed domain itself
    return [domain];
  }
}

export async function crawlCareProtocols(): Promise<CareProtocol[]> {
  const results: CareProtocol[] = [];

  for (const seed of SEED_DOMAINS) {
    // Step 1: discover relevant URLs via map endpoint
    const urls = await discoverRelevantUrls(seed.domain);

    // Step 2: extract structured protocol from each discovered URL
    for (const url of urls) {
      try {
        const response = await firecrawl.extract([url], {
          prompt: EXTRACT_PROMPT,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              communication_do: { type: "array", items: { type: "string" } },
              communication_dont: { type: "array", items: { type: "string" } },
              summary_for_agent: { type: "string" },
              stage_relevance: { type: "string" },
              confidence_score: { type: "number" },
            },
            required: ["title", "communication_do", "communication_dont", "summary_for_agent"],
          },
        });

        if (response.success && response.data) {
          const d = response.data as {
            title: string;
            communication_do: string[];
            communication_dont: string[];
            summary_for_agent: string;
            stage_relevance?: string;
            confidence_score?: number;
          };

          // Skip low-confidence extracts
          if ((d.confidence_score ?? 1) < 0.4) continue;

          results.push({
            source_name: seed.name,
            source_url: url,
            category: seed.category,
            title: d.title ?? "Care Protocol",
            communication_do: d.communication_do ?? [],
            communication_dont: d.communication_dont ?? [],
            summary_for_agent: d.summary_for_agent ?? "",
            stage_relevance: d.stage_relevance ?? "all",
            confidence_score: d.confidence_score,
          });
        }
      } catch {
        // Skip URLs that fail extraction
      }
    }
  }

  return results;
}
