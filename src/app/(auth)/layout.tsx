import Link from "next/link";
import { SunnyFace } from "@/components/ui/SunnyFace";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sundown-bg relative flex min-h-screen flex-col items-center justify-center px-4 text-white overflow-hidden">
      {/* Horizon glow */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />

      {/* Nav */}
      <div className="absolute top-7 left-8 flex items-center gap-2">
        <SunnyFace size={20} />
        <Link
          href="/"
          className="text-xs font-black text-yellow-400 tracking-widest uppercase hover:text-yellow-300 transition-colors"
        >
          Sundown
        </Link>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl border border-yellow-400/20 p-8 space-y-6"
        style={{
          background: "rgba(250,204,21,0.03)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 0 1px rgba(250,204,21,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
