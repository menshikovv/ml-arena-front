import { useEffect, useState } from "react";
import { getCompetitionDeadlineTime } from "@/lib/ml-arena";

export function useCompetitionClock(competitions) {
  const [now, setNow] = useState(() => Date.now());
  const deadlines = competitions.filter((competition) => competition?.status === "active")
    .map(getCompetitionDeadlineTime).filter((deadline) => deadline !== null && deadline > now);
  const nextTick = Math.min(now + 60000, ...deadlines);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const onVisible = () => { if (document.visibilityState === "visible") update(); };
    const timer = window.setTimeout(update, Math.max(1, nextTick - Date.now() + 1));
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [nextTick]);

  return now;
}
