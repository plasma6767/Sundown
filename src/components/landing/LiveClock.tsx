"use client";

import { useEffect, useState } from "react";

export function LiveClock() {
  const [time, setTime] = useState("");
  const [isSundownHour, setIsSundownHour] = useState(false);

  useEffect(() => {
    function tick() {
      const now = new Date();
      const h = now.getHours();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
      setIsSundownHour(h >= 17 && h < 21);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center space-y-1">
      <p className="text-[11px] uppercase tracking-[0.2em] text-yellow-400/45 font-medium">
        Right now it is
      </p>
      <p className="text-6xl font-light text-white tabular-nums tracking-tight">
        {time || "—"}
      </p>
      {isSundownHour && (
        <p className="text-[11px] uppercase tracking-[0.15em] text-yellow-400/70 font-medium">
          The highest-risk hour
        </p>
      )}
    </div>
  );
}
