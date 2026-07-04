import React, { useEffect, useState } from "react";

export default function CountdownTimer({ endTime, onComplete, size = "md" }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0 && onComplete) onComplete();
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime, onComplete]);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  const isLow = remaining <= 300;

  const sizes = {
    sm: "text-lg",
    md: "text-3xl",
    lg: "text-5xl",
  };

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className={`font-mono font-bold tabular-nums ${sizes[size]} ${isLow ? "text-red-400 animate-pulse" : "text-foreground"}`}>
      {hours > 0 && <span>{pad(hours)}:</span>}
      {pad(minutes)}:{pad(seconds)}
    </div>
  );
}