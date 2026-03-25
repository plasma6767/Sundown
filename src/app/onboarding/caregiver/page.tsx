"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CaregiverVoiceIntake } from "@/components/onboarding/CaregiverVoiceIntake";
import { ProfilePreview } from "@/components/onboarding/ProfilePreview";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface GeneratedResult {
  profile: Record<string, unknown>;
  patientUrl: string;
}

type Stage = "voice" | "preview";

export default function CaregiverOnboardingPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("voice");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);

  async function handleChatComplete(transcript: Message[]) {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/onboarding/generate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error("Server error — please try again.");
      }

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to generate profile");
      }

      setResult({ profile: data.profile, patientUrl: data.patientUrl });
      setStage("preview");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleStartOver() {
    setStage("voice");
    setResult(null);
  }

  if (stage === "preview" && result) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <ProfilePreview
          profile={result.profile as unknown as Parameters<typeof ProfilePreview>[0]["profile"]}
          patientUrl={result.patientUrl}
          onStartOver={handleStartOver}
        />
        <div className="mt-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">
          Tell us about your loved one
        </h1>
        <p className="text-sm text-muted-foreground">
          This helps the companion understand how to keep them safe and comfortable.
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <CaregiverVoiceIntake
          onComplete={handleChatComplete}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}
