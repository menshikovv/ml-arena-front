import React from "react";
import { getLeague } from "@/lib/ml-arena";
import { Shield } from "lucide-react";

export default function LeagueBadge({ rating, size = "md", showName = true }) {
  const league = getLeague(rating || 1000);
  const sizes = {
    sm: { box: "px-2 py-0.5 text-[10px] gap-1", icon: 10 },
    md: { box: "px-2.5 py-1 text-xs gap-1.5", icon: 12 },
    lg: { box: "px-3 py-1.5 text-sm gap-1.5", icon: 14 },
  };
  const s = sizes[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold text-black dark:text-white ${s.box} ${league.class}`}
      style={{ boxShadow: `0 0 12px -2px ${league.glow}` }}
    >
      <Shield size={s.icon} className="fill-black/20 dark:fill-white/15" />
      {showName && league.name}
    </span>
  );
}
