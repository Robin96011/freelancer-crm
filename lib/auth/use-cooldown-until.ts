"use client";

import { useEffect, useState } from "react";

/** Seconds remaining until `until` timestamp; updates every second. */
export function useCooldownSecondsUntil(until: number | null): number {
  const [remainingSec, setRemainingSec] = useState(0);

  useEffect(() => {
    if (!until || until <= Date.now()) {
      setRemainingSec(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setRemainingSec(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);

  return remainingSec;
}
