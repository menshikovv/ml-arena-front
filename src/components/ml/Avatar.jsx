import React from "react";

export default function Avatar({ name, src, size = 40, className = "" }) {
  const initials = (name || "?")
    .split(/\s|_/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const colors = ["#7C3AED", "#06B6D4", "#EC4899", "#F59E0B", "#10B981", "#8B5CF6"];
  const colorIdx = (name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const color = colors[colorIdx];

  if (src) {
    return <img src={src} alt={name} width={size} height={size} className={`rounded-full object-cover ${className}`} style={{ width: size, height: size }} />;
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${className}`}
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}, ${color}99)`, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}