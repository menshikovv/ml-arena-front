import { Download, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ResultCard({ report, onDownload, downloading = false, className }) {
  return (
    <section className={cn("min-w-0 overflow-hidden rounded-lg border border-border bg-card", className)} aria-label={report.type}>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/logo.svg" alt="" className="h-10 w-10 shrink-0 object-contain" />
          <div className="min-w-0"><p className="font-heading text-base font-bold">ML-Арена</p><p className="text-xs text-muted-foreground">{report.type}</p></div>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary"><Trophy size={15} className="shrink-0" />{report.eyebrow}</span>
      </header>
      <div className="p-5 sm:p-6">
        <h2 className="break-words font-heading text-xl font-bold leading-snug sm:text-2xl">{report.title}</h2>
        <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">{report.subtitle}</p>
      </div>
      <dl className="grid grid-cols-1 border-t border-border sm:grid-cols-2 xl:grid-cols-4">
        {report.stats.map((item) => <div key={item.label} className="min-w-0 border-b border-border px-5 py-4 sm:px-6">
          <dt className="text-xs leading-5 text-muted-foreground">{item.label}</dt>
          <dd className={cn("mt-2 break-words font-heading text-xl font-bold leading-snug tabular-nums", item.tone === "green" ? "text-accent" : "text-foreground")}>{item.value}</dd>
          {item.detail && <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{item.detail}</p>}
        </div>)}
      </dl>
      {onDownload && <footer className="flex justify-end p-4 sm:px-6"><Button type="button" variant="outline" className="h-auto min-h-10 w-full whitespace-normal sm:w-auto" onClick={onDownload} disabled={downloading}>{downloading ? <Loader2 size={16} className="shrink-0 animate-spin" /> : <Download size={16} className="shrink-0" />} Скачать карточку PDF</Button></footer>}
    </section>
  );
}
