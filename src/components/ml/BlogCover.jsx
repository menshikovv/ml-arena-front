import { Brain, CheckSquare2, Code2, Gauge, SearchCheck, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { API_URL } from "@/api/client";

const ICONS = {
  brain: Brain,
  checklist: CheckSquare2,
  code: Code2,
  gauge: Gauge,
  search: SearchCheck,
  shield: ShieldCheck,
  sparkles: Sparkles,
  trophy: Trophy,
};

const TONES = {
  blue: "bg-[#102d5d] text-white [--cover-accent:#45d6ff]",
  teal: "bg-[#0b4142] text-white [--cover-accent:#5eead4]",
  amber: "bg-[#422f12] text-white [--cover-accent:#facc4d]",
  violet: "bg-[#30224f] text-white [--cover-accent:#c4b5fd]",
  slate: "bg-[#252f3f] text-white [--cover-accent:#7dd3fc]",
  rose: "bg-[#462438] text-white [--cover-accent:#f9a8d4]",
  red: "bg-[#4a2027] text-white [--cover-accent:#fb7185]",
  green: "bg-[#153b31] text-white [--cover-accent:#6ee7b7]",
};

function absoluteMediaUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

export function blogCoverVisual(post) {
  const cover = post?.cover;
  const imageUrl = absoluteMediaUrl(cover?.url)
    || (cover?.id ? `${API_URL}/api/v1/blog/media/${cover.id}` : null);
  return imageUrl
    ? { imageUrl, alt: cover?.alt || post?.title || "Обложка материала ML-Арены" }
    : { type: "grid", title: post?.title };
}

export default function BlogCover({ visual, compact = false, className = "" }) {
  if (visual?.imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-secondary ${className}`}>
        {!compact && <img src={visual.imageUrl} alt="" aria-hidden="true" className="absolute -inset-8 h-[calc(100%+4rem)] w-[calc(100%+4rem)] scale-110 object-cover opacity-40 blur-3xl saturate-75" />}
        <img
          src={visual.imageUrl}
          alt={visual.alt || ""}
          loading={compact ? "lazy" : "eager"}
          className={compact ? "h-full w-full object-cover" : "relative z-[1] h-full w-full object-contain"}
        />
      </div>
    );
  }

  const Icon = ICONS[visual.icon] || Code2;

  return (
    <div className={`relative isolate overflow-hidden ${TONES[visual.tone] || TONES.blue} ${className}`}>
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.45)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute inset-y-0 left-0 w-1.5 bg-[var(--cover-accent)]" />
      <div className="absolute right-0 top-0 h-24 w-24 border-b border-l border-white/15" />
      <div className={`relative flex h-full flex-col justify-between ${compact ? "p-5" : "p-6 sm:p-8"}`}>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase text-white/70">
            <img src="/logo.svg" alt="" className="h-6 w-6 object-contain" />
            ML-Арена
          </span>
          <span className="flex h-10 w-10 items-center justify-center border border-white/20 bg-white/10 text-[var(--cover-accent)] backdrop-blur-sm">
            <Icon size={20} />
          </span>
        </div>
        <div className={compact ? "mt-8" : "mt-14"}>
          <p className="text-[11px] font-bold uppercase text-[var(--cover-accent)]">{visual.label}</p>
          <p className={`${compact ? "mt-2 text-xl" : "mt-3 text-2xl sm:text-3xl"} max-w-md font-heading font-extrabold leading-tight`}>{visual.detail}</p>
        </div>
      </div>
    </div>
  );
}
