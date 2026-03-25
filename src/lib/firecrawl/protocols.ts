import { firecrawl } from "./client";

export interface CareProtocol {
  source_name: string;
  source_url: string;
  category: string;
  title: string;
  communication_do: string[];
  communication_dont: string[];
  summary_for_agent: string;
}

const SOURCES = [
  {
    url: "https://www.alz.org/help-support/caregiving/daily-care/communications",
    name: "Alzheimer's Association",
    category: "communication",
  },
  {
    url: "https://www.nia.nih.gov/health/alzheimers-caregiving/tips-communicating-confused-person",
    name: "National Institute on Aging",
    category: "communication",
  },
];

const EXTRACT_PROMPT = `
Extract dementia caregiver communication guidance from this page.
Return a JSON object with:
- title: short title for this guidance (string)
- communication_do: array of things caregivers/companions SHOULD do when communicating (string[])
- communication_dont: array of things caregivers/companions should NOT do (string[])
- summary_for_agent: one sentence summary suitable for injecting into an AI companion's instructions (string)
`;

export async function crawlCareProtocols(): Promise<CareProtocol[]> {
  const results: CareProtocol[] = [];

  for (const source of SOURCES) {
    try {
      const response = await firecrawl.extract([source.url], {
        prompt: EXTRACT_PROMPT,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            communication_do: { type: "array", items: { type: "string" } },
            communication_dont: { type: "array", items: { type: "string" } },
            summary_for_agent: { type: "string" },
          },
          required: ["title", "communication_do", "communication_dont", "summary_for_agent"],
        },
      });

      if (response.success && response.data) {
        const extracted = response.data as {
          title: string;
          communication_do: string[];
          communication_dont: string[];
          summary_for_agent: string;
        };
        results.push({
          source_name: source.name,
          source_url: source.url,
          category: source.category,
          title: extracted.title ?? "Care Protocol",
          communication_do: extracted.communication_do ?? [],
          communication_dont: extracted.communication_dont ?? [],
          summary_for_agent: extracted.summary_for_agent ?? "",
        });
      }
    } catch (err) {
      console.error(`[protocols] Failed to extract ${source.url}:`, err);
    }
  }

  return results;
}
