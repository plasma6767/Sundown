import Link from "next/link";
import { SunnyFace } from "@/components/ui/SunnyFace";

export default function Home() {
  return (
    <main className="sundown-bg relative min-h-screen flex flex-col text-white overflow-hidden">

      {/* Subtle top glow */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-yellow-400/5 to-transparent" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 pt-7">
        <div className="flex items-center gap-2.5">
          <SunnyFace size={22} />
          <span className="text-sm font-black text-yellow-400 tracking-widest uppercase">
            Sundown
          </span>
        </div>
        <Link
          href="/login"
          className="text-sm font-semibold text-white/60 hover:text-white transition-colors"
        >
          Sign in →
        </Link>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16">

        {/* Sunny mascot */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="sunny-float">
            <SunnyFace size={120} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-yellow-400">
            Meet Sunny
          </p>
        </div>

        {/* Catchphrase */}
        <p className="text-base font-bold uppercase tracking-[0.2em] text-yellow-400 mb-4">
          The sun goes down. Sunny shows up.
        </p>

        {/* Headline — white for max contrast against yellow */}
        <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight max-w-3xl">
          A voice companion that{" "}
          <span className="text-yellow-400">knows your loved one</span>
          <br />
          and stays when you can&apos;t.
        </h1>

        <p className="mt-5 text-base text-white/60 max-w-sm text-center leading-relaxed font-medium">
          Built for the 6 million Americans living with Alzheimer&apos;s —
          and the caregivers who love them.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/signup"
            className="rounded-2xl bg-yellow-400 text-black px-7 py-3 text-sm font-black hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/20"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-white/50 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          <FeatureCard
            step="01"
            title="You tell us who they are"
            detail="Onboard through a voice conversation. Tell Sunny about your loved one — their routines, memories, church, what calms them, what not to say."
          />
          <FeatureCard
            step="02"
            title="Sunny becomes their companion"
            detail="Every evening, Sunny greets them by name with personal talking points and the patience they need. Calm, warm, always present."
            highlight
          />
          <FeatureCard
            step="03"
            title="You know the moment it matters"
            detail="When Sunny detects distress, you get an instant alert. One tap to see what happened and act."
          />
        </div>

        {/* Tech stack */}
        <div className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-2">
          {[
            ["Voice AI", "ElevenLabs"],
            ["Intelligence", "Claude"],
            ["Live context", "Firecrawl"],
            ["Realtime alerts", "Supabase"],
          ].map(([label, tech]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="h-px w-3 bg-yellow-400/30" />
              <span className="text-[10px] text-yellow-400/40 uppercase tracking-widest font-bold">
                {label}
              </span>
              <span className="text-[10px] text-white/50 font-bold">{tech}</span>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}

// ── Feature card ───────────────────────────────────────────────────────────────

function FeatureCard({
  step,
  title,
  detail,
  highlight = false,
}: {
  step: string;
  title: string;
  detail: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 space-y-3 ${
        highlight
          ? "border-yellow-400/60 bg-yellow-400/8"
          : "border-yellow-400/15 bg-yellow-400/[0.03]"
      }`}
    >
      <p className="text-xs font-black tracking-widest text-yellow-400 uppercase">
        Step {step}
      </p>
      <p className={`text-sm font-bold leading-snug ${highlight ? "text-white" : "text-white"}`}>
        {title}
      </p>
      <p className="text-xs text-white/50 leading-relaxed font-medium">{detail}</p>
    </div>
  );
}

