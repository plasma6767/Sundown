import Link from "next/link";

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

// ── Sunny mascot ───────────────────────────────────────────────────────────────

export function SunnyFace({ size = 64 }: { size?: number }) {
  const r = 30;
  const cx = 50;
  const cy = 50;

  const rays = [
    [50, 6,  50, 14],
    [73, 12, 68, 19],
    [88, 31, 81, 35],
    [94, 50, 86, 50],
    [88, 69, 81, 65],
    [73, 88, 68, 81],
    [50, 94, 50, 86],
    [27, 88, 32, 81],
    [12, 69, 19, 65],
    [6,  50, 14, 50],
    [12, 31, 19, 35],
    [27, 12, 32, 19],
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Rays */}
      {rays.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#FACC15"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      ))}

      {/* Face circle */}
      <circle cx={cx} cy={cy} r={r} fill="#FACC15" />

      {/* Eyes */}
      <circle cx="40" cy="44" r="4" fill="#000" />
      <circle cx="60" cy="44" r="4" fill="#000" />

      {/* Eye shine */}
      <circle cx="42" cy="42" r="1.5" fill="white" />
      <circle cx="62" cy="42" r="1.5" fill="white" />

      {/* Smile */}
      <path
        d="M 37 58 Q 50 70 63 58"
        stroke="#000"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Rosy cheeks */}
      <circle cx="34" cy="57" r="5" fill="#f97316" fillOpacity="0.3" />
      <circle cx="66" cy="57" r="5" fill="#f97316" fillOpacity="0.3" />
    </svg>
  );
}

// ── Sunset nav icon (kept for auth layout) ────────────────────────────────────

export function SunsetIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className={className}
    >
      <path d="M2 14 Q2 4 12 4 Q22 4 22 14" />
      <line x1="0" y1="14" x2="24" y2="14" />
      <line x1="12" y1="1" x2="12" y2="0" />
      <line x1="18.5" y1="3.5" x2="19.5" y2="2.5" />
      <line x1="5.5" y1="3.5" x2="4.5" y2="2.5" />
    </svg>
  );
}
