"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded-xl border border-yellow-400/20 px-3 py-1.5 text-xs font-medium text-yellow-400/60 hover:text-white/70 hover:border-yellow-400/30 transition-colors"
    >
      {copied ? "Copied ✓" : "Copy link"}
    </button>
  );
}
