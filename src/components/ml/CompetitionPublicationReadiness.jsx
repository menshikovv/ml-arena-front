import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PUBLICATION_BLOCKERS, publicationError, publicationReady } from "@/lib/competitionPublication";

function date(value) {
  return value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString("ru-RU") : null;
}

export function PublicationBlockers({ blockers }) {
  if (!Array.isArray(blockers) || !blockers.length) return null;
  return <ul className="mt-3 space-y-3">{blockers.map((blocker, index) => <li key={`${blocker.code}-${index}`} className="break-words border-l-2 border-amber-500 pl-3 text-sm leading-6">
    <p>{PUBLICATION_BLOCKERS[blocker.code] || blocker.message || "Публикация заблокирована сервером."}</p>
    {!PUBLICATION_BLOCKERS[blocker.code] && blocker.code && <p className="text-xs text-muted-foreground">Код: {blocker.code}</p>}
    {blocker.code === "finalization_in_progress" && <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground">{[["unfinished_submissions", "Отправки"], ["unfinished_scoring_jobs", "Задачи оценки"], ["unfinished_recalculations", "Пересчёты"]].map(([key, label]) => Number.isFinite(blocker.details?.[key]) && <span key={key}>{label}: {blocker.details[key]}</span>)}</div>}
    {blocker.code === "source_code_window_open" && date(blocker.details?.source_code_deadline) && <p className="mt-1 text-xs text-muted-foreground">До {date(blocker.details.source_code_deadline)}</p>}
  </li>)}</ul>;
}

export default function CompetitionPublicationReadiness({ competition, data, loading = false, error, onRefresh }) {
  const valid = data?.competition_id === competition.id && data?.status === competition.status && typeof data?.publication_ready === "boolean" && Array.isArray(data?.publication_blockers);
  return <div className="mt-4 border-t border-border pt-4" aria-live="polite">
    <div className="flex flex-wrap items-center justify-between gap-3"><h4 className="text-sm font-bold">Готовность публикации</h4>{onRefresh && <Button type="button" variant="ghost" size="icon" aria-label="Обновить готовность публикации" disabled={loading} onClick={onRefresh}><RefreshCw size={15} className={loading ? "animate-spin" : ""} /></Button>}</div>
    {loading ? <p role="status" className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={15} className="animate-spin" />Проверяем состояние…</p> : error ? <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">{publicationError(error)}</p> : !valid ? <p className="mt-2 text-sm text-muted-foreground">Сервер не подтвердил готовность публикации.</p> : <>
      <p className="mt-2 text-sm font-semibold">{publicationReady(competition, data) ? "Можно публиковать" : "Публикация пока недоступна"}</p>
      <PublicationBlockers blockers={data.publication_blockers} />
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">{Number.isFinite(data.eligible_participants_count) && <span>Допущено: {data.eligible_participants_count}</span>}{Number.isFinite(data.excluded_participants_count) && <span>Не допущено: {data.excluded_participants_count}</span>}</div>
      {data.source_code_required && <p className="mt-2 text-xs leading-5 text-muted-foreground">Для итогового рейтинга требуется привязанный код решения.</p>}
    </>}
  </div>;
}
