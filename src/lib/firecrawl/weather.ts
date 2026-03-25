import { firecrawl } from "./client";

// Fetches current weather for a location using Firecrawl search.
// Returns a short human-readable weather string, or null if unavailable.
export async function fetchCurrentWeather(
  city: string | null,
  state: string | null
): Promise<string | null> {
  const location = [city, state].filter(Boolean).join(", ");
  if (!location) return null;

  try {
    const result = await firecrawl.search(`current weather ${location} today`, {
      limit: 1,
    });

    const first = result.data?.[0];
    if (!first) return null;

    // Use description if available — usually contains temperature + conditions
    const description = (first.description ?? first.markdown) as string | null;

    if (!description) return null;

    return description.slice(0, 200).replace(/\n+/g, " ").trim();
  } catch {
    return null;
  }
}
