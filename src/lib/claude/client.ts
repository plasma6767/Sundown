import Anthropic from "@anthropic-ai/sdk";

// Singleton Anthropic client — server-side only
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
