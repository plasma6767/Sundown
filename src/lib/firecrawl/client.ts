import FirecrawlApp from "@mendable/firecrawl-js";

// Singleton Firecrawl client — server-side only
export const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY!,
});
