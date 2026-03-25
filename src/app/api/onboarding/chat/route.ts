import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/claude/client";
import { CAREGIVER_INTAKE_SYSTEM_PROMPT } from "@/lib/claude/onboarding";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Verify caregiver is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { messages } = body as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Stream Claude response
  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: CAREGIVER_INTAKE_SYSTEM_PROMPT,
    messages,
  });

  // Return a readable stream to the client
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
