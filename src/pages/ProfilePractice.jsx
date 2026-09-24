import { Award, BarChart3, Check, History, Swords, Target, TrendingUp, UsersRound } from "lucide-react";
import "./ProfilePractice.css";

const formatNumber = (value) => value == null || !Number.isFinite(Number(value)) ? "—" : Number(value).toLocaleString("ru-RU", { useGrouping: false });
const matchesWord = (count) => new Intl.PluralRules("ru-RU").select(count) === "one" ? "матчу" : "матчам";
const matchCountWord = (count) => ({ one: "матч", few: "матча", many: "матчей" })[new Intl.PluralRules("ru-RU").select(count)] || "матчей";

function formatDate(value, index) {
  if (!value) return `Результат ${index + 1}`;
  const match = String(value).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (match) return `${match[3] || "01"}.${match[2]}`;
  return String(value);
}

function PracticeStat({ icon: Icon, tone, label, value, detail }) {
  return (
    <article className={`passport-practice-stat passport-practice-stat--${tone}`}>
      <div className="passport-practice-stat__head">
        <span className="passport-practice-stat__icon"><Icon size={29} strokeWidth={2.5} aria-hidden="true" /></span>
        <h3>{label}</h3>
      </div>
      <strong className="passport-practice-stat__value">{formatNumber(value)}</strong>
      <p>{detail}</p>
    </article>
  );
}

function PracticeChart({ history, historySource }) {
  const points = (Array.isArray(history) ? history : []).flatMap((item, index) => {
    const raw = item.rating ?? item.score;
    if (raw == null || !Number.isFinite(Number(raw))) return [];
    return [{ label: formatDate(item.date ?? item.period ?? item.created_at, index), value: Number(raw) }];
  });

  if (!points.length) {
    return <div className="passport-practice-chart__empty"><TrendingUp size={29} aria-hidden="true" /><strong>Истории рейтинга пока нет</strong><span>Изменения появятся после завершённых рейтинговых матчей.</span></div>;
  }

  const values = points.map((point) => point.value);
  const step = Math.max(50, Math.ceil((Math.max(...values) - Math.min(...values)) / 3 / 50) * 50);
  const min = Math.floor(Math.min(...values) / step) * step - step;
  const max = Math.ceil(Math.max(...values) / step) * step + step;
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, index) => min + index * step);
  const x = (index) => points.length === 1 ? 501 : 58 + (index / (points.length - 1)) * 886;
  const y = (value) => 213 - ((value - min) / (max - min)) * 181;
  const line = points.reduce((path, point, index) => {
    if (index === 0) return `M ${x(0)} ${y(point.value)}`;
    const previous = points[index - 1];
    const middle = (x(index - 1) + x(index)) / 2;
    return `${path} C ${middle} ${y(previous.value)}, ${middle} ${y(point.value)}, ${x(index)} ${y(point.value)}`;
  }, "");
  const area = `${line} L ${x(points.length - 1)} 213 L ${x(0)} 213 Z`;
  const labelCount = Math.min(points.length, 5);
  const labelIndices = new Set(Array.from({ length: labelCount }, (_, index) => Math.round(index * (points.length - 1) / Math.max(1, labelCount - 1))));
  const markerEvery = Math.ceil(points.length / 12);

  return <div className="passport-practice-chart__scroll">
    <svg className="passport-practice-chart__svg" viewBox="0 0 1000 265" role="img" aria-label={`История рейтинга ${historySource === "season" ? "дуэлей" : "профиля"}: от ${formatNumber(points[0].value)} до ${formatNumber(points.at(-1).value)}`}>
      <defs><linearGradient id="passport-practice-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#3476f5" stopOpacity=".20" /><stop offset="100%" stopColor="#3476f5" stopOpacity=".01" /></linearGradient></defs>
      {ticks.map((tick) => <g key={tick}><line x1="58" x2="944" y1={y(tick)} y2={y(tick)} className="passport-practice-chart__grid" /><text x="38" y={y(tick) + 5} textAnchor="end" className="passport-practice-chart__axis">{formatNumber(tick)}</text></g>)}
      {[1, 2, 3, 4].map((tick) => <line key={tick} x1={58 + tick * 886 / 4} x2={58 + tick * 886 / 4} y1="32" y2="213" className="passport-practice-chart__grid passport-practice-chart__grid--vertical" />)}
      {points.length > 1 && <><path d={area} className="passport-practice-chart__area" /><path d={line} className="passport-practice-chart__line" /></>}
      {points.map((point, index) => <g key={`${point.label}-${index}`}>
        {(index % markerEvery === 0 || index === points.length - 1) && <circle cx={x(index)} cy={y(point.value)} r="5.5" className="passport-practice-chart__dot"><title>{point.label}: {formatNumber(point.value)}</title></circle>}
        {labelIndices.has(index) && <text x={x(index)} y="252" textAnchor="middle" className="passport-practice-chart__axis">{point.label}</text>}
      </g>)}
    </svg>
  </div>;
}

function duelDetails(duel, ownerId) {
  const ownIsFirst = String(duel.player1?.user_id) === String(ownerId);
  const opponent = ownIsFirst ? duel.player2 : duel.player1;
  const ownPlayer = ownIsFirst ? duel.player1 : duel.player2;
  const started = Date.parse(duel.started_at);
  const submitted = Date.parse(ownPlayer?.submitted_at);
  const minutes = Number.isFinite(started) && Number.isFinite(submitted) && submitted >= started ? (submitted - started) / 60000 : null;
  const opponentRating = Number(opponent?.rating);
  return {
    ...duel,
    opponentName: opponent?.user_name || "Участник",
    opponentRating: opponent?.rating != null && Number.isFinite(opponentRating) ? opponentRating : null,
    minutes,
    result: duel.is_draw ? "Ничья" : duel.winner_id === ownerId ? "Победа" : "Поражение",
    ratingDelta: duel.rating_change?.[ownerId],
  };
}

function ActivityChart({ duels, loading, unavailableMessage }) {
  const today = new Date();
  const weekStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - ((today.getUTCDay() + 6) % 7)));
  const weeks = Array.from({ length: 8 }, (_, index) => {
    const start = new Date(weekStart);
    start.setUTCDate(start.getUTCDate() - (7 - index) * 7);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return { label: start.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", timeZone: "UTC" }), count: duels.filter((duel) => { const date = Date.parse(duel.completed_at); return Number.isFinite(date) && date >= start.getTime() && date < end.getTime(); }).length };
  });
  const peak = Math.max(...weeks.map((week) => week.count), 1);
  const hasActivity = weeks.some((week) => week.count > 0);

  return <div className="passport-practice-activity">
    <div className="passport-practice-activity__bars" role="img" aria-label={`Завершённые рейтинговые дуэли за восемь недель: ${weeks.map((week) => `${week.label} — ${week.count}`).join(", ")}`}>
      {weeks.map((week) => <div className="passport-practice-activity__week" key={week.label} title={`${week.label}: ${week.count}`}><div className="passport-practice-activity__bar-track"><span style={{ height: `${week.count ? Math.max(12, week.count / peak * 100) : 0}%` }} /></div><small>{week.label}</small></div>)}
    </div>
    {!loading && !hasActivity && <p className="passport-practice-activity__hint">{unavailableMessage || "Завершённые дуэли за последние восемь недель пока не найдены."}</p>}
  </div>;
}

function DetailMetric({ label, value, note }) {
  return <div className="passport-practice-detail"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

export default function ProfilePractice({ matches, wins, losses, bonus, rating, startRating, history, historySource, competitionScore, competitionsCount, duels = [], duelsLoading = false, duelsError = false, ownerId }) {
  const completedDuels = ownerId ? duels.filter((duel) => duel.status === "completed" && duel.mode !== "unrated" && [duel.player1?.user_id, duel.player2?.user_id].some((id) => String(id) === String(ownerId))).map((duel) => duelDetails(duel, ownerId)) : [];
  const submittedDuels = completedDuels.filter((duel) => duel.minutes != null);
  const ratedOpponents = completedDuels.filter((duel) => duel.opponentRating != null);
  const average = (items, field) => items.length ? Math.round(items.reduce((sum, item) => sum + item[field], 0) / items.length) : null;
  const matchesNumber = Number(matches);
  const winsNumber = Number(wins);
  const winRate = matchesNumber > 0 && Number.isFinite(winsNumber) ? `${Math.round(winsNumber / matchesNumber * 100)}%` : "—";
  const unavailableMessage = !ownerId ? "Подробная история матчей доступна владельцу паспорта." : duelsError ? "Не удалось загрузить историю матчей." : null;
  const stats = [
    { icon: Swords, tone: "blue", label: "Дуэли с людьми", value: matches, detail: "Завершённые матчи" },
    { icon: Check, tone: "green", label: "Победы", value: wins, detail: "В дуэлях с участниками" },
    { icon: History, tone: "red", label: "Поражения", value: losses, detail: "В дуэлях с участниками" },
    { icon: Award, tone: "violet", label: "Бонус вызовов", value: bonus, detail: "За задания ML-Арены" },
    { icon: Target, tone: "amber", label: "Рейтинг дуэлей сезона", value: rating, detail: Number(matches) > 0 ? "Текущее значение" : startRating == null ? "Появится после первого матча" : `Начинается с ${formatNumber(startRating)}` },
  ];

  return <section className="passport-practice">
    <header className="passport-practice__heading"><h2>Практика</h2><p>Рейтинговые дуэли, вызовы ML-Арены и результаты соревнований.</p></header>
    <div className="passport-practice__stats">{stats.map((stat) => <PracticeStat key={stat.label} {...stat} />)}</div>
    <div className="passport-practice__insights">
      <section className="passport-practice-panel"><div className="passport-practice-panel__heading"><div><h2>Активность в дуэлях</h2><p>Завершённые рейтинговые матчи по неделям</p></div></div><ActivityChart duels={completedDuels} loading={duelsLoading} unavailableMessage={unavailableMessage} /></section>
      <section className="passport-practice-panel"><div className="passport-practice-panel__heading"><div><h2>Результаты практики</h2><p>Человеческие дуэли отдельно от вызовов</p></div></div><div className="passport-practice-panel__metrics">
        <DetailMetric label="Доля побед" value={winRate} note="Только дуэли с людьми" />
        <DetailMetric label="Среднее время отправки" value={submittedDuels.length ? `${formatNumber(average(submittedDuels, "minutes"))} мин` : "—"} note={submittedDuels.length ? `По ${submittedDuels.length} ${matchesWord(submittedDuels.length)} с отправкой` : "Нет данных об отправках"} />
        <DetailMetric label="Средний рейтинг соперников" value={formatNumber(average(ratedOpponents, "opponentRating"))} note={ratedOpponents.length ? `Текущий рейтинг · ${ratedOpponents.length} ${matchCountWord(ratedOpponents.length)}` : "Нет данных о соперниках"} />
      </div></section>
    </div>
    <div className="passport-practice__history"><h2>{historySource === "season" ? "История рейтинга дуэлей" : "История рейтинга профиля"}</h2><p>{historySource === "season" ? "Изменения сезонного рейтинга в завершённых матчах." : "Изменения рейтинга профиля после дуэлей; это не сезонный рейтинг."}</p><div className="passport-practice-chart"><PracticeChart history={history} historySource={historySource} /></div></div>
    <div className="passport-practice__lower">
      <section className="passport-practice-panel"><div className="passport-practice-panel__heading"><BarChart3 size={20} aria-hidden="true" /><div><h2>Соревнования</h2><p>Сезонный рейтинг и участия</p></div></div><div className="passport-practice-panel__metrics"><DetailMetric label="Рейтинг сезона" value={formatNumber(competitionScore)} note="Баллы соревнований" /><DetailMetric label="Участий" value={formatNumber(competitionsCount)} note="За всё время" /><DetailMetric label="Средний результат" value="—" note="Нет истории финалов" /></div></section>
      <section className="passport-practice-panel"><div className="passport-practice-panel__heading"><UsersRound size={20} aria-hidden="true" /><div><h2>Последние дуэли</h2><p>Соперник, исход и изменение рейтинга</p></div></div>{completedDuels.length ? <div className="passport-practice-recent">{completedDuels.slice(0, 4).map((duel) => <div className="passport-practice-recent__row" key={duel.id}><span><strong>{duel.opponentName}</strong><small>{duel.task_type || duel.task_title || "Дуэль"}</small></span><span className={duel.result === "Победа" ? "is-win" : ""}>{duel.result}</span><strong>{duel.ratingDelta == null ? "—" : `${Number(duel.ratingDelta) > 0 ? "+" : ""}${formatNumber(duel.ratingDelta)}`}</strong></div>)}</div> : <div className="passport-practice-recent__empty">{duelsLoading ? "Загружаем матчи…" : unavailableMessage || "Дуэльная статистика появится после первых матчей с людьми."}</div>}</section>
    </div>
  </section>;
}
