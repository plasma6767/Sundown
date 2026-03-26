"use client";

import { useCallback, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";

type OrbState = "idle" | "connecting" | "listening" | "speaking";

interface PatientVoiceKioskProps {
  patientId: string;
  token: string;
  patientName: string;
}

function getTimeContext(): { greeting: string; bg: string } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { greeting: "Good morning", bg: "kiosk-morning" };
  if (h >= 12 && h < 17) return { greeting: "Good afternoon", bg: "kiosk-afternoon" };
  if (h >= 17 && h < 21) return { greeting: "Good evening", bg: "kiosk-evening" };
  return { greeting: "Good evening", bg: "kiosk-night" };
}

export function PatientVoiceKiosk({
  patientId,
  token,
  patientName,
}: PatientVoiceKioskProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [timeCtx] = useState(getTimeContext);
  const isEndingRef = useRef(false);

  const conversation = useConversation({
    onMessage: useCallback(
      ({ role, message }: { role: string; message: string }) => {
        if (role === "agent") setLastMessage(message.replace(/\[[^\]]+\]/g, "").trim());
      },
      []
    ),
    onError: useCallback((err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : "Connection lost. Please tap to try again.";
      setError(msg);
      setHasStarted(false);
    }, []),
    onDisconnect: useCallback(() => {
      if (!isEndingRef.current) setHasStarted(false);
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
            firstMessage: `${timeCtx.greeting}, ${patientName}. It's so wonderful to talk with you. How are you feeling today?`,
          },
          // turn_timeout (25s) and silence_end_call_timeout (90s) are configured
          // in the ElevenLabs agent dashboard — not overridable via the client SDK.
        },
        // metadata is echoed back in the post-call webhook — reliable patientId recovery
        clientTools: {},
        dynamicVariables: {
          patient_name: patientName,
          patient_id: patientId,
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

  let orbState: OrbState = "idle";
  if (hasStarted && !isConnected) orbState = "connecting";
  else if (isConnected && agentSpeaking) orbState = "speaking";
  else if (isConnected) orbState = "listening";

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-6 select-none ${timeCtx.bg}`}
    >
      {/* Greeting */}
      <div className="text-center mb-14 space-y-1.5">
        <p className="text-base text-stone-400 tracking-widest uppercase text-xs font-medium">
          {timeCtx.greeting}
        </p>
        <h1 className="text-5xl font-light text-stone-700 tracking-tight">
          {patientName}
        </h1>
        <p className="text-stone-400 text-sm">Sunny is here with you.</p>
      </div>

      {/* Orb */}
      <OrbButton orbState={orbState} onTap={!hasStarted ? handleStart : undefined} />

      {/* Status + last message */}
      <div className="mt-10 text-center max-w-xs space-y-3">
        <StatusLabel orbState={orbState} error={error} />
        {lastMessage && isConnected && (
          <p className="text-stone-400 text-sm leading-relaxed italic px-2">
            &ldquo;
            {lastMessage.length > 130
              ? lastMessage.slice(0, 130) + "…"
              : lastMessage}
            &rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

// ── Orb ───────────────────────────────────────────────────────────────────────

const ORB_COLOR: Record<OrbState, string> = {
  idle: "#5B8FA8",
  connecting: "#94A3B8",
  listening: "#C4955A",
  speaking: "#5A9E8F",
};

const ORB_GLOW: Record<OrbState, string> = {
  idle: "0 0 55px rgba(91,143,168,0.35)",
  connecting: "none",
  listening: "0 0 55px rgba(196,149,90,0.35)",
  speaking: "0 0 65px rgba(90,158,143,0.45)",
};

const ORB_ANIM: Record<OrbState, string | undefined> = {
  idle: "orb-breathe 4s ease-in-out infinite",
  connecting: undefined,
  listening: "orb-breathe 2.5s ease-in-out infinite",
  speaking: "orb-speak 1.2s ease-in-out infinite",
};

function OrbButton({
  orbState,
  onTap,
}: {
  orbState: OrbState;
  onTap?: () => void;
}) {
  const color = ORB_COLOR[orbState];

  return (
    <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
      {/* Ripple rings */}
      {orbState === "speaking" && (
        <>
          <div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: `${color}22`, animation: "ripple-out 2s ease-out infinite" }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: `${color}15`, animation: "ripple-out-delayed 2s ease-out 0.6s infinite" }}
          />
        </>
      )}
      {orbState === "listening" && (
        <div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: `${color}18`, animation: "ripple-out 3s ease-out infinite" }}
        />
      )}
      {orbState === "idle" && (
        <div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: `${color}10`, animation: "orb-breathe 4s ease-in-out 0.5s infinite" }}
        />
      )}

      {/* Main orb */}
      <button
        onClick={onTap}
        disabled={orbState === "connecting" || (!onTap && orbState !== "idle")}
        aria-label={orbState === "idle" ? "Talk to Sunny" : "Sunny is active"}
        className="relative z-10 w-44 h-44 rounded-full flex items-center justify-center transition-transform duration-300"
        style={{
          backgroundColor: color,
          boxShadow: ORB_GLOW[orbState],
          animation: ORB_ANIM[orbState],
          cursor: onTap ? "pointer" : "default",
        }}
        onMouseEnter={(e) => { if (onTap) (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      >
        {orbState === "connecting" && (
          <div className="w-8 h-8 border-2 border-yellow-400/100 border-t-white rounded-full animate-spin" />
        )}
        {orbState === "idle" && <MicIcon />}
        {(orbState === "listening" || orbState === "speaking") && <Waveform active={orbState === "speaking"} />}
      </button>
    </div>
  );
}

function StatusLabel({ orbState, error }: { orbState: OrbState; error: string | null }) {
  if (error) {
    return (
      <p className="text-red-400 text-sm px-4 py-2 bg-red-50 rounded-xl border border-red-100">
        {error}
      </p>
    );
  }
  const labels: Record<OrbState, string> = {
    idle: "Tap to talk with Sunny",
    connecting: "Connecting to Sunny…",
    listening: "Sunny is listening…",
    speaking: "Sunny is speaking…",
  };
  const colors: Record<OrbState, string> = {
    idle: "text-stone-400",
    connecting: "text-stone-300",
    listening: "text-yellow-500",
    speaking: "text-teal-600",
  };
  return <p className={`text-base ${colors[orbState]}`}>{labels[orbState]}</p>;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function MicIcon() {
  return (
    <svg
      className="w-12 h-12 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-1.5" style={{ height: 28 }}>
      {["bar-1", "bar-2", "bar-3", "bar-4", "bar-5"].map((cls, i) => (
        <div
          key={i}
          className={`w-1.5 bg-white/85 rounded-full ${active ? cls : ""}`}
          style={{ height: active ? undefined : 5, transition: "height 0.3s ease" }}
        />
      ))}
    </div>
  );
}
