"use client";

import { useCallback, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";

interface PatientVoiceKioskProps {
  patientId: string;
  token: string;
  patientName: string;
}

export function PatientVoiceKiosk({
  patientId,
  token,
  patientName,
}: PatientVoiceKioskProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEndingRef = useRef(false);

  const conversation = useConversation({
    onError: useCallback((err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : "Connection lost. Please tap to try again.";
      setError(msg);
      setHasStarted(false);
    }, []),
    onDisconnect: useCallback(() => {
      if (!isEndingRef.current) {
        setHasStarted(false);
      }
    }, []),
  });

  async function handleStart() {
    setHasStarted(true);
    setError(null);
    isEndingRef.current = false;

    try {
      const res = await fetch(
        `/api/voice/session?patientId=${patientId}&token=${encodeURIComponent(token)}`
      );
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? "Could not start session");
      }
      const { signedUrl, systemPrompt } = await res.json();

      await conversation.startSession({
        signedUrl,
        overrides: {
          agent: {
            prompt: { prompt: systemPrompt },
            firstMessage: `Hello, ${patientName}. It's so nice to talk with you today. How are you feeling?`,
          },
        },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not connect. Please try again."
      );
      setHasStarted(false);
    }
  }

  const isConnected = conversation.status === "connected";
  const agentSpeaking = isConnected && conversation.isSpeaking;

  // ── Not started ──────────────────────────────────────────────────────────
  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center gap-8">
        {error && (
          <p className="max-w-xs rounded-xl bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
            {error}
          </p>
        )}
        <button
          onClick={handleStart}
          className="flex h-36 w-36 items-center justify-center rounded-full bg-primary shadow-2xl transition-transform hover:scale-105 active:scale-95"
          aria-label="Talk to Sunny"
        >
          <MicIcon className="h-14 w-14 text-primary-foreground" />
        </button>
        <p className="text-lg text-muted-foreground">
          {error ? "Tap to try again" : "Tap to talk"}
        </p>
      </div>
    );
  }

  // ── Connecting ───────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-lg text-muted-foreground">Connecting…</p>
      </div>
    );
  }

  // ── Active ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-8">
      <div
        className={`flex h-36 w-36 items-center justify-center rounded-full transition-all duration-500 ${
          agentSpeaking
            ? "animate-pulse bg-primary/20 ring-8 ring-primary/20"
            : "bg-muted"
        }`}
      >
        <SoundwaveIcon
          className={`h-12 w-12 transition-colors duration-300 ${
            agentSpeaking ? "text-primary" : "text-muted-foreground"
          }`}
        />
      </div>
      <p className="text-xl font-medium text-foreground">
        {agentSpeaking ? "Sunny is speaking…" : "Listening…"}
      </p>
    </div>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function SoundwaveIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12h2" />
      <path d="M6 8v8" />
      <path d="M10 5v14" />
      <path d="M14 8v8" />
      <path d="M18 10v4" />
      <path d="M22 12h-2" />
    </svg>
  );
}
