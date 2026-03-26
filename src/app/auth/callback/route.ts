import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Auto-create caregiver row on first login if it doesn't exist
  const { error: upsertError } = await supabase.from("caregivers").upsert(
    {
      id: data.user.id,
      full_name: data.user.user_metadata?.full_name ?? "Caregiver",
      email: data.user.email!,
    },
    {
      onConflict: "id",
      ignoreDuplicates: true,
    }
  );

  // upsertError is non-fatal — user is authenticated, let them through

  return NextResponse.redirect(`${origin}${next}`);
}
