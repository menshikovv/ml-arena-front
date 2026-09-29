import { useEffect, useRef, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import { Activity, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Check, ChevronDown, Download, FileText, History, Layers3, Loader2, RefreshCw, ShieldCheck, Swords, Target, TrendingUp, Trophy } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/api/mlArenaApi";
import { Button } from "@/components/ui/button";
import { allPages, directionEvidence, isFinalCompetition, isOfficialResult, numberOrNull, resultDate, safeArtifactUrl, submissionStatistics, topPercent } from "@/lib/passport";
import { ActivityChart } from "./ProfilePractice";
import "./ProfileDirection.css";

const numeric = (value, digits = 2) => numberOrNull(value) == null ? "—" : Number(value).toLocaleString("ru-RU", { maximumFractionDigits: digits });
const top = (value) => numberOrNull(value) == null ? "—" : `Топ-${numeric(value, 1)}%`;
const date = (value) => !value || !Number.isFinite(Date.parse(value)) ? "—" : new Date(value).toLocaleDateString("ru-RU");
const statuses = { scored: "Рассчитано", evaluated: "Рассчитано", invalid: "Некорректный файл", failed: "Ошибка", rejected: "Отклонено", queued: "В очереди", scoring: "Расчёт", uploaded: "Загружено", cancelled: "Отменено" };

function Metric({ label, value, note, compact = false }) {
  return <div className="passport-evidence-metric"><span>{label}</span><strong className={compact ? "is-compact" : undefined}>{value}</strong>{note && <small>{note}</small>}</div>;
}

function PerformanceMetric({ icon: Icon, tone, label, value, note }) {
  return <article className={`passport-performance passport-performance--${tone}`}>
    <div className="passport-performance__heading"><span><Icon size={20} aria-hidden="true" /></span><h4>{label}</h4></div>
    <strong>{value}</strong><p>{note}</p>
  </article>;
}

function ScoreChart({ submissions }) {
  const points = submissions.map((item, index) => ({ attempt: index + 1, score: Number(item.public_score), date: date(item.created_at) }));
  if (!points.length) return <p className="passport-evidence-empty">Пока нет рассчитанных отправок.</p>;
  return <div className="passport-score-chart" role="img" aria-label={`Динамика публичного результата: ${points.map((item) => `отправка ${item.attempt} — ${item.score}`).join(", ")}`}>
    <ResponsiveContainer width="100%" height="100%"><AreaChart data={points} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" vertical={false} />
      <XAxis dataKey="attempt" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
      <YAxis domain={["auto", "auto"]} width={55} tickFormatter={(value) => numeric(value, 3)} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
      <Tooltip formatter={(value) => [numeric(value, 5), "Публичный результат"]} labelFormatter={(value) => `Отправка ${value}`} contentStyle={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))", fontSize: 13 }} />
      <Area type="linear" dataKey="score" stroke="#356cf2" fill="#356cf2" fillOpacity={0.12} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
    </AreaChart></ResponsiveContainer>
  </div>;
}

function Verification({ result }) {
  const levels = [
    ["Результат рассчитан", numberOrNull(result.score) != null],
    ["Закрытые данные", result.leaderboard_kind === "private" || result.hidden_verified === true],
    ["Код проверен", result.code_reviewed],
    ["Воспроизведено", result.reproduced],
    ["Решение защищено", result.expert_defended],
  ];
  return <ul className="passport-verification" aria-label="Проверка результата">{levels.map(([label, confirmed]) => { const status = confirmed === true ? "Подтверждено" : confirmed === false ? "Не подтверждено" : "Нет данных о проверке"; return <li key={label} title={status} className={confirmed === true ? "is-confirmed" : ""}><span aria-hidden="true">{confirmed === true ? <Check size={15} /> : "—"}</span><div>{label}<span className="sr-only">: {status}</span></div></li>; })}</ul>;
}

function SubmissionRow({ submission }) {
  const url = safeArtifactUrl(submission.file_url);
  return <details className="passport-submission">
    <summary><FileText size={18} /><span><strong>{submission.original_filename || `Отправка ${submission.attempt_number || ""}`}</strong><small>{date(submission.created_at)} · {statuses[submission.status] || "Статус уточняется"}</small></span><strong>{numeric(submission.public_score, 5)}</strong><ChevronDown size={16} /></summary>
    <div className="passport-submission__body"><div className="passport-evidence-metrics">
      <Metric label="Публичный результат" value={numeric(submission.public_score, 5)} />
      <Metric label="Закрытый результат" value={submission.private_score_revealed === true ? numeric(submission.private_score, 5) : "Скрыт"} />
      <Metric label="Номер попытки" value={numeric(submission.attempt_number, 0)} />
    </div>{submission.error_message && <p className="passport-evidence-notice">{submission.error_message}</p>}
    {url ? <a className="passport-evidence-link" href={url} target="_blank" rel="noreferrer"><Download size={16} />Открыть файл решения</a> : <p className="passport-evidence-muted">Файл решения не передан сервером.</p>}</div>
  </details>;
}

function CompetitionEvidence({ item, metrics }) {
  const { competition, result } = item;
  const [open, setOpen] = useState(false);
  const query = useQuery({ queryKey: ["passport-submissions", competition.id, result.user_id], queryFn: () => allPages((params) => api.competitions.submissions(competition.id, params)), enabled: open, staleTime: 60000, retry: 1 });
  const official = isOfficialResult(item);
  const metric = metrics.find((entry) => entry.code === competition.metric);
  const stats = submissionStatistics(query.data || [], competition, metric?.direction);
  const finalSubmission = stats.valid.find((entry) => entry.private_score_revealed === true && numberOrNull(entry.private_score) != null && Math.abs(Number(entry.private_score) - Number(result.score)) < 1e-9);
  const scoreGap = finalSubmission ? Number(finalSubmission.public_score) - Number(finalSubmission.private_score) : null;
  const tech = Array.isArray(result.verified_technologies) ? result.verified_technologies : [];
  const final = isFinalCompetition(competition) && result.leaderboard_kind === "private";
  return <details className="passport-result" onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary><span className={`passport-evidence-source ${official ? "is-official" : "is-community"}`}>{official ? "Официальное" : "Сообщество"}</span><span className="passport-result__title"><strong>{competition.title}</strong><small>{date(resultDate(item))} · {competition.metric_name || competition.metric} · {final ? "Финальный результат" : "Промежуточный результат"}</small></span><span className="passport-result__rank">#{numeric(result.rank, 0)}<small>из {numeric(result.participants_count, 0)}</small></span><strong className="passport-result__score">{numeric(result.score, 5)}</strong><ChevronDown size={18} /></summary>
    <div className="passport-result__body">
      <div className="passport-evidence-metrics"><Metric label="Место" value={`#${numeric(result.rank, 0)}`} note={`${numeric(result.participants_count, 0)} валидных участников`} /><Metric label="Результат в выборке" value={top(topPercent(item))} /><Metric label={final ? "Финальный результат" : "Публичный результат"} value={numeric(result.score, 5)} note={competition.metric} /><Metric label="Сложность / домен" value={competition.difficulty || "—"} note={competition.domain || "Домен не указан"} /></div>
      {official ? <Verification result={result} /> : <p className="passport-evidence-notice">Сообщество · код не проверен ML-Ареной. Этот результат не повышает подтверждённый уровень направления.</p>}
      <div className="passport-result__links"><Link className="passport-evidence-link" to={`/competitions/${competition.id}`}><ArrowUpRight size={16} />Открыть соревнование</Link>{safeArtifactUrl(result.repository_url) && <a className="passport-evidence-link" href={safeArtifactUrl(result.repository_url)} target="_blank" rel="noreferrer">Репозиторий решения<ArrowUpRight size={16} /></a>}</div>
      {tech.length > 0 && <p className="passport-evidence-muted">Подтверждённые технологии: {tech.map((value) => typeof value === "string" ? value : value.technology).filter(Boolean).join(", ")}</p>}
      <h4>История решений</h4>
      {query.isLoading ? <p className="passport-evidence-loading"><Loader2 size={18} className="animate-spin" />Загружаем отправки…</p> : query.isError ? <div className="passport-evidence-notice">Не удалось загрузить решения.<Button size="sm" variant="outline" onClick={() => query.refetch()}><RefreshCw size={14} />Повторить</Button></div> : <>
        <div className="passport-evidence-metrics"><Metric label="Отправок" value={query.data?.length || 0} /><Metric label="Рассчитано" value={stats.valid.length} /><Metric label="Лучший публичный результат" value={numeric(stats.best?.public_score, 5)} /><Metric label="Превышение базового решения" value={stats.beaten ? "Да" : !stats.baselineKnown ? "Нет данных" : "Пока нет"} note={stats.beaten ? `${stats.attemptsToBaseline} отправок · ${numeric(stats.minutes, 0)} мин от старта` : undefined} /></div>
        <ScoreChart submissions={stats.valid} />
        <details className="passport-evidence-extra"><summary><BarChart3 size={17} aria-hidden="true" />Подробная статистика отправок<ChevronDown size={16} /></summary><div className="passport-evidence-metrics"><Metric label="Улучшение базового решения" value={numeric(stats.improvement, 5)} note={stats.improvementPercent == null ? "Базовое решение или направление метрики не передано" : `${numeric(stats.improvementPercent)}% относительно базового решения`} /><Metric label="Первое принятое решение" value={date(stats.valid[0]?.created_at)} compact /><Metric label="Лучшее публичное решение" value={date(stats.best?.created_at)} compact /><Metric label="Разница публичного и закрытого результата" value={numeric(scoreGap, 5)} note="Для одной и той же финальной отправки" /></div></details>
        <div className="passport-submissions">{stats.ordered.slice().reverse().map((submission) => <SubmissionRow key={submission.id} submission={submission} />)}{!stats.ordered.length && <p className="passport-evidence-empty">История отправок пуста.</p>}</div>
      </>}
    </div>
  </details>;
}

function DuelEvidence({ duel, ownerId }) {
  const ownFirst = String(duel.player1?.user_id) === String(ownerId);
  const own = ownFirst ? duel.player1 : duel.player2;
  const opponent = ownFirst ? duel.player2 : duel.player1;
  const outcome = duel.is_draw ? "Ничья" : String(duel.winner_id) === String(ownerId) ? "Победа" : "Поражение";
  const started = Date.parse(duel.started_at);
  const submitted = Date.parse(own?.submitted_at);
  const minutes = Number.isFinite(started) && Number.isFinite(submitted) && submitted >= started ? (submitted - started) / 60000 : null;
  const delta = numberOrNull(duel.rating_change?.[ownerId]);
  return <details className="passport-result">
    <summary><span className="passport-evidence-source is-duel">Дуэль</span><span className="passport-result__title"><strong>{duel.task_title || "Рейтинговый матч"}</strong><small>{date(duel.completed_at)} · {opponent?.user_name || "Участник"}</small></span><span className="passport-result__rank">{outcome}</span><strong>{delta == null ? "—" : `${delta > 0 ? "+" : ""}${numeric(delta, 0)}`}</strong><ChevronDown size={18} /></summary>
    <div className="passport-result__body"><div className="passport-evidence-metrics"><Metric label="Ваш результат" value={numeric(own?.score, 5)} note={duel.metric} /><Metric label="Результат соперника" value={numeric(opponent?.score, 5)} /><Metric label="Рейтинг соперника" value={numeric(opponent?.rating, 0)} note="Текущий рейтинг из API" /><Metric label="Время до отправки" value={minutes == null ? "—" : `${numeric(minutes, 0)} мин`} /></div><div className="passport-result__links"><Link className="passport-evidence-link" to={`/duels/${duel.id}/result`}>Открыть матч<ArrowUpRight size={16} /></Link>{safeArtifactUrl(own?.file_url) && <a className="passport-evidence-link" href={safeArtifactUrl(own.file_url)} target="_blank" rel="noreferrer"><Download size={16} />Файл вашего решения</a>}</div></div>
  </details>;
}

export default function ProfileDirection({ direction, evidenceQuery, isOwner, ownerId, season, onBack, metrics = [], externalAchievements = [] }) {
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("overview");
  const heading = useRef(null);
  const data = directionEvidence(evidenceQuery.data, direction.code, ownerId);
  const ratingQueries = useQueries({ queries: ["overall", "competitions", "duels"].map((tab) => ({ queryKey: ["passport-direction-rating", ownerId, direction.code, season, tab], queryFn: () => api.rating.get({ tab, season, direction: direction.code === "cv" ? "computer_vision" : direction.code }), enabled: Boolean(isOwner && season), staleTime: 60000, retry: 1 })) });
  useEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.closest("section")?.scrollIntoView({ block: "start", behavior: "instant" }); }, [direction.code]);
  const ready = isOwner && Boolean(evidenceQuery.data);
  const official = data.competitions.filter(isOfficialResult);
  const results = filter === "community" ? data.community : filter === "official" ? official : filter === "duels" ? [] : data.competitions;
  const duels = ["all", "duels"].includes(filter) ? data.duels : [];
  const externalCount = externalAchievements.filter((item) => (item.verified === true || ["verified", "approved", "confirmed"].includes(item.verification_status || item.status)) && (item.directions || []).some((code) => code === direction.code || direction.code === "cv" && code === "computer_vision")).length;
  const losses = data.duels.length - data.wins - data.draws;
  const resultCount = data.competitions.length + data.duels.length;
  return <section className="passport-direction-detail">
    <button type="button" onClick={onBack} className="passport-evidence-back"><ArrowLeft size={18} />Карта компетенций</button>
    <header className="passport-direction-detail__heading"><div><h2 ref={heading} tabIndex={-1}>{direction.title}</h2><p>Результаты, решения и подтверждения по направлению.</p></div><span className="passport-evidence-status" title="Стартовые пороги ТЗ: достаточно — 2 официальных результата либо 1 результат и 10 дуэлей, подтверждение не старше года; высокая подтверждённость — 4 официальных результата, проверенный код и подтверждение не старше 180 дней.">{ready ? data.status : "Нет данных о подтверждениях"}</span></header>
    {!isOwner && <p className="passport-evidence-notice">Подробная история этого профиля пока не опубликована. Файлы решений доступны владельцу ML-паспорта.</p>}
    {isOwner && evidenceQuery.isLoading && <p className="passport-evidence-loading"><Loader2 size={18} className="animate-spin" />Собираем результаты…</p>}
    {(evidenceQuery.isError || evidenceQuery.data?.errors > 0) && <div className="passport-evidence-notice">Часть истории недоступна. Показатели рассчитаны только по загруженным результатам.<Button variant="outline" size="sm" onClick={() => evidenceQuery.refetch()}><RefreshCw size={14} />Повторить</Button></div>}
    <Tabs.Root className="passport-detail-views" value={view} onValueChange={setView}>
      <Tabs.List className="passport-detail-tabs" aria-label="Детали направления">
        <Tabs.Trigger value="overview"><BarChart3 size={18} aria-hidden="true" />Обзор</Tabs.Trigger>
        <Tabs.Trigger value="results"><FileText size={18} aria-hidden="true" />Результаты{ready && <span>{resultCount}</span>}</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview" className="passport-detail-view">
        <section className="passport-evidence-section passport-season"><h3>Текущий сезон</h3><div className="passport-season__metrics">{[["Общий индекс", Trophy], ["Соревнования", BarChart3], ["Рейтинг дуэлей", Swords]].map(([label, Icon], index) => { const query = ratingQueries[index]; const entry = query.data?.current_user; return <div key={label} className="passport-season__item"><Icon size={21} aria-hidden="true" /><Metric label={label} value={query.isLoading && query.fetchStatus === "fetching" ? "…" : numeric(entry?.score, 0)} note={entry?.rank ? `Место #${entry.rank}` : query.isError ? "Не удалось загрузить" : "Нет сезонной позиции"} /></div>; })}</div></section>
        <section className="passport-evidence-section"><div className="passport-evidence-list-heading"><h3>Официальные результаты</h3><button type="button" className="passport-evidence-link" onClick={() => { setFilter("official"); setView("results"); }}>Все решения<ArrowRight size={16} /></button></div>
          <div className="passport-performance-grid">
            <PerformanceMetric icon={Trophy} tone="amber" label="Лучший результат" value={top(data.peak)} note="Лучший официальный финал" />
            <PerformanceMetric icon={Target} tone="blue" label="Типичный результат" value={top(data.typical)} note={`Медиана последних ${Math.min(data.official.length, 5)} финалов`} />
            <PerformanceMetric icon={TrendingUp} tone="green" label="Свежая форма" value={top(data.recent)} note={data.recentCount >= 2 ? `${data.recentCount} финала за 180 дней` : "Нужно 2 финала за 180 дней"} />
          </div>
          <div className="passport-evidence-metrics passport-confirmation-counts"><Metric label="Финальных соревнований" value={ready ? data.official.length : "—"} /><Metric label="Дуэлей с людьми" value={ready ? data.duels.length : "—"} /><Metric label="Результатов в топ-10%" value={ready ? data.top10 : "—"} /><Metric label="Последнее подтверждение" value={date(data.lastConfirmed)} compact /></div>
        </section>
        <div className="passport-detail-insights">
          <section className="passport-evidence-section passport-detail-activity"><h3><Activity size={20} aria-hidden="true" />Активность в дуэлях</h3><p className="passport-detail-caption">Завершённые матчи · последние 8 недель</p><ActivityChart duels={data.duels} loading={evidenceQuery.isLoading} unavailableMessage={!isOwner ? "История доступна владельцу паспорта." : undefined} /></section>
          <section className="passport-evidence-section passport-duel-summary"><h3><Swords size={20} aria-hidden="true" />Результаты дуэлей</h3>
            <div className="passport-duel-summary__winrate"><strong>{data.duels.length ? `${numeric(data.wins / data.duels.length * 100, 0)}%` : "—"}</strong><span>побед в направлении</span></div>
            <div className="passport-duel-balance" role="img" aria-label={ready ? `${data.wins} побед, ${data.draws} ничьих, ${losses} поражений` : "Нет данных о дуэлях"}>{data.duels.length > 0 && [["wins", data.wins], ["draws", data.draws], ["losses", losses]].map(([key, count]) => count > 0 && <span key={key} className={`is-${key}`} style={{ width: `${count / data.duels.length * 100}%` }} />)}</div>
            <div className="passport-duel-legend">{[["wins", "Побед", data.wins], ["draws", "Ничьих", data.draws], ["losses", "Поражений", losses]].map(([key, label, count]) => <span key={key}><i className={`is-${key}`} aria-hidden="true" />{label}<strong>{ready ? count : "—"}</strong></span>)}</div>
            <div className="passport-evidence-metrics"><Metric label="Среднее время отправки" value={data.averageSubmissionMinutes == null ? "—" : `${numeric(data.averageSubmissionMinutes, 0)} мин`} note={`По ${data.submissionTimeCount} матчам с отправкой`} /><Metric label="Средний рейтинг соперников" value={numeric(data.averageOpponentRating, 0)} note="Текущие рейтинги из API" /></div>
          </section>
        </div>
        <details className="passport-evidence-extra passport-detail-context"><summary><Layers3 size={18} aria-hidden="true" />Дополнительный контекст<ChevronDown size={16} /></summary><div className="passport-evidence-metrics"><Metric label="Соревнования сообщества" value={ready ? data.community.filter((item) => isFinalCompetition(item.competition)).length : "—"} note="Отдельно от официальных подтверждений" /><Metric label="Подтверждённые внешние достижения" value={externalCount} note="Не повышают внутренний рейтинг" /><Metric label="Проверенный код / воспроизведение" value={ready ? numeric(data.reviewed, 0) : "—"} note="Только явно переданные статусы проверки" /></div></details>
      </Tabs.Content>
      <Tabs.Content value="results" className="passport-detail-view">
        <section className="passport-evidence-section"><div className="passport-evidence-list-heading"><h3><History size={20} aria-hidden="true" />История результатов и решений</h3><div className="passport-evidence-filters" role="group" aria-label="Источник результатов">{[["all", "Все"], ["official", "Официальные"], ["community", "Сообщество"], ["duels", "Дуэли"]].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div></div><div className="passport-evidence-list">{results.map((item) => <CompetitionEvidence key={item.competition.id} item={item} metrics={metrics} />)}{duels.map((duel) => <DuelEvidence key={duel.id} duel={duel} ownerId={ownerId} />)}{!results.length && !duels.length && !evidenceQuery.isLoading && <p className="passport-evidence-empty">{isOwner ? "По этому направлению пока нет доступных результатов выбранного типа." : "Подробная история не опубликована."}</p>}</div></section>
      </Tabs.Content>
    </Tabs.Root>
    <p className="passport-evidence-muted"><ShieldCheck size={16} />Проверка кода, воспроизведение и стек учитываются только при наличии подтверждения. История вызовов ML-Арены пока недоступна.</p>
  </section>;
}
