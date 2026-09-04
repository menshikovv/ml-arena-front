import React from "react";
import { Shield } from "lucide-react";

export default function LeagueBadge({ rating, size = "md", showName = true }) {
  const numericRating = Number(rating);
  if (!Number.isFinite(numericRating)) return null;
  const sizes = {
    sm: { box: "px-2 py-0.5 text-[10px] gap-1", icon: 10 },
    md: { box: "px-2.5 py-1 text-xs gap-1.5", icon: 12 },
    lg: { box: "px-3 py-1.5 text-sm gap-1.5", icon: 14 },
  };
  const s = sizes[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border border-primary/20 bg-primary/10 font-semibold text-primary ${s.box}`}
    >
      <Shield size={s.icon} className="fill-black/20 dark:fill-white/15" />
      {showName && `Рейтинг ${numericRating.toLocaleString("ru-RU")}`}
    </span>
  );
}
