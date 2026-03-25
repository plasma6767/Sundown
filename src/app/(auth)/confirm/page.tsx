import Link from "next/link";

export default function ConfirmPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/10 border border-yellow-400/20">
          <svg
            className="h-8 w-8 text-yellow-400/70"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Check your email
        </h1>
        <p className="text-sm text-yellow-400/50 leading-relaxed">
          We sent a confirmation link to your email address. Click the link to
          activate your account and get started.
        </p>
      </div>

      <p className="text-xs text-yellow-400/45">
        Already confirmed?{" "}
        <Link href="/login" className="text-white/60 hover:text-white transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
