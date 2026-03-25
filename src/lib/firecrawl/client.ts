import { FirecrawlAppV1 } from "@mendable/firecrawl-js";

// Singleton Firecrawl client — server-side only
export const firecrawl = new FirecrawlAppV1({
  apiKey: process.env.FIRECRAWL_API_KEY!,
});
