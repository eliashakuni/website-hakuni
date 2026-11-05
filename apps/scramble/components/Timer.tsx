"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

function secondsUntil(deadline: number) {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

interface TimerProps {
  deadline: number;
  onExpire: () => void;
}

export function Timer({ deadline, onExpire }: TimerProps) {
  const t = useTranslations("game");
  const [seconds, setSeconds] = useState(() => secondsUntil(deadline));

  useEffect(() => {
    const tick = () => {
      const left = secondsUntil(deadline);
      setSeconds(left);
      if (left === 0) onExpire();
    };
    // Faster than once a second so the display stays in step with the deadline.
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const rest = String(seconds % 60).padStart(2, "0");

  return (
    <div role="timer" aria-label={t("timeLeft")} className="font-digital text-3xl tabular-nums sm:text-4xl">
      {minutes}:{rest}
    </div>
  );
}
