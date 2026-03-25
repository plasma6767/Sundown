import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: caregiver } = await supabase
    .from("caregivers")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: patients } = await supabase
    .from("patients")
    .select("id")
    .eq("caregiver_id", user.id)
    .limit(1);

  // No patients yet — send caregiver to onboarding
  if (!patients || patients.length === 0) {
    redirect("/onboarding");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {caregiver?.full_name ?? "Caregiver"}
        </h1>
        <p className="text-muted-foreground">
          Full dashboard coming in Step 6.
        </p>
      </div>
    </main>
  );
}
