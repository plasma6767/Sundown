"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { CAREGIVER_INTAKE_SYSTEM_PROMPT } from "@/lib/claude/onboarding";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CaregiverVoiceIntakeProps {
  onComplete: (transcript: Message[]) => void;
  isGenerating: boolean;
}

const FIRST_MESSAGE =
  "Hi, I'm Sunny. I'm here to help set up the companion for your loved one. " +
  "I'll ask you a few questions so I can understand how best to support them. " +
  "Can you start by telling me their name and what stage of dementia they've been diagnosed with?";

const MIN_MESSAGES = 8;

export function CaregiverVoiceIntake({
  onComplete,
  isGenerating,
}: CaregiverVoiceIntakeProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef<Message[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const isEndingRef = useRef(false);

  function showError(msg: string) {
    setError(msg);
    setHasStarted(false);
    setIsEnding(false);
    isEndingRef.current = false;
  }

  const conversation = useConversation({
    onMessage: useCallback(
      ({ role, message }: { role: "user" | "agent"; message: string }) => {
        const mapped: Message = {
          role: role === "agent" ? "assistant" : "user",
          content: message,
        };
        transcriptRef.current = [...transcriptRef.current, mapped];
        setMessageCount(transcriptRef.current.length);
      },
      []
    ),
    onError: useCallback((err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Connection failed. Please try again.";
      showError(msg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    transcriptRef.current = [];
    setMessageCount(0);
    isEndingRef.current = false;
    try {
      const tokenRes = await fetch("/api/onboarding/voice-token");
      if (!tokenRes.ok) {
        const { error } = await tokenRes.json();
        throw new Error(error ?? "Failed to get voice token");
      }
      const { signedUrl } = await tokenRes.json();

      await conversation.startSession({
        signedUrl,
        overrides: {
          agent: {
            prompt: { prompt: CAREGIVER_INTAKE_SYSTEM_PROMPT },
            firstMessage: FIRST_MESSAGE,
          },
        },
      });
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Could not connect. Please try again."
      );
    }
  }

  async function handleEndAndGenerate() {
    isEndingRef.current = true;
    setIsEnding(true);
    try {
      await conversation.endSession();
    } catch {
      // ignore — session may already be closed
    }
    onComplete(transcriptRef.current);
  }

  useEffect(() => {
    if (!isGenerating && isEnding) {
      setIsEnding(false);
      isEndingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating]);

  const isConnected = conversation.status === "connected";
  const canGenerate = isConnected && messageCount >= MIN_MESSAGES;
  const agentSpeaking = isConnected && conversation.isSpeaking;

  // ── Not started yet (or after error) ────────────────────────────────────
  if (!hasStarted) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
        {error && (
          <p className="max-w-sm rounded-xl border border-red-500/20 px-4 py-2 text-center text-sm text-red-400/80"
            style={{ background: "rgba(239,68,68,0.06)" }}>
            {error}
          </p>
        )}
        <p className="max-w-sm text-center text-sm text-yellow-400/50 leading-relaxed">
          Sunny will ask you about your loved one&apos;s condition, routines, and
          needs. Speak naturally — there are no wrong answers.
        </p>
        <button
          onClick={handleStart}
          className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/10 border border-yellow-400/25 shadow-lg transition hover:bg-white/15 active:scale-95"
          aria-label="Start conversation"
        >
          <MicIcon className="h-9 w-9 text-white" />
        </button>
        <p className="text-xs text-yellow-400/35">
          {error ? "Tap to try again" : "Tap to start"}
        </p>
      </div>
    );
  }

  // ── Connecting ───────────────────────────────────────────────────────────
  if (!isConnected && !isEnding && conversation.status !== "disconnected") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-yellow-400/60 border-t-transparent" />
        <p className="text-sm text-yellow-400/50">Connecting to Sunny…</p>
      </div>
    );
  }

  // ── Generating / ending ──────────────────────────────────────────────────
  if (isGenerating || isEnding) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-yellow-400/60 border-t-transparent" />
        <p className="text-sm text-yellow-400/50">
          {isGenerating ? "Building care profile…" : "Ending conversation…"}
        </p>
      </div>
    );
  }

  // ── Active conversation ──────────────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col items-center justify-between px-6 py-10">
      {/* Orb */}
      <div className="flex flex-col items-center gap-3">
        <div
          className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-500 ${
            agentSpeaking
              ? "bg-yellow-400/20 ring-4 ring-yellow-400/25 shadow-lg shadow-yellow-400/10"
              : "bg-yellow-400/6 border border-yellow-400/20"
          }`}
        >
          {agentSpeaking && (
            <div className="absolute inset-0 rounded-full animate-ping bg-yellow-400/10" />
          )}
          <SoundwaveIcon
            className={`h-8 w-8 transition-colors duration-300 ${
              agentSpeaking ? "text-white/60" : "text-yellow-400/35"
            }`}
          />
        </div>
        <p className="text-sm font-medium text-white/70">
          {agentSpeaking ? "Sunny is speaking…" : "Your turn — speak freely"}
        </p>
        <p className="text-xs text-yellow-400/35">
          {messageCount} message{messageCount !== 1 ? "s" : ""} so far
        </p>
      </div>

      {/* End button */}
      <div className="flex w-full flex-col items-center gap-3">
        {!canGenerate && (
          <p className="text-xs text-yellow-400/35 text-center max-w-xs">
            Keep talking — the button will appear when Sunny has enough information.
          </p>
        )}
        <button
          onClick={handleEndAndGenerate}
          disabled={!canGenerate}
          className="w-full max-w-xs rounded-xl bg-white text-[#1A0800] px-4 py-3 text-sm font-semibold transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          End &amp; Generate Profile
        </button>
      </div>
    </div>
  );
}

// ── Inline icons ─────────────────────────────────────────────────────────────

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
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
      strokeWidth={2}
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
