import Link from "next/link";
import { SunnyFace } from "@/app/page";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sundown-bg relative min-h-screen flex flex-col text-white overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
      <header className="relative z-10 flex items-center gap-2 px-8 pt-7 pb-4 border-b border-yellow-400/10">
        <SunnyFace size={20} />
        <Link href="/" className="text-xs font-black text-yellow-400 tracking-widest uppercase hover:text-yellow-300 transition-colors">
          Sundown
        </Link>
      </header>
      <main className="relative z-10 flex flex-1 flex-col">{children}</main>
    </div>
  );
}
