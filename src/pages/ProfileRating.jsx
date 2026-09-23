import { Link } from "react-router-dom";
import { BarChart3, CalendarDays, ChevronDown, ChevronRight, Crown, Swords, TrendingUp, Trophy } from "lucide-react";
import "./ProfileRating.css";

const formatNumber = (value) => value == null || !Number.isFinite(Number(value)) ? "—" : Number(value).toLocaleString("ru-RU");
const formatPercent = (value) => value == null || !Number.isFinite(Number(value)) ? "—" : `${Math.round(Number(value))}%`;

function formatPeriod(value) {
  if (!value) return "";
  const date = new Date(/^\d{4}-\d{2}$/.test(value) ? `${value}-01T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("ru-RU", /^\d{4}-\d{2}$/.test(value) ? { month: "short" } : { day: "numeric", month: "short" });
}

function RatingChart({ history }) {
  const points = (Array.isArray(history) ? history : []).map((item) => ({
    label: formatPeriod(item.date || item.period || item.created_at),
    value: Number(item.score ?? item.rating),
  })).filter((item) => Number.isFinite(item.value));

  if (points.length < 2) return <div className="passport-rating-chart-empty"><TrendingUp size={27} /><span>История общего рейтинга пока не доступна</span></div>;

  const values = points.map((item) => item.value);
  const min = Math.floor(Math.min(...values) / 100) * 100;
  const max = Math.max(min + 100, Math.ceil(Math.max(...values) / 100) * 100);
  const x = (index) => 42 + (index / (points.length - 1)) * 445;
  const y = (value) => 163 - ((value - min) / (max - min)) * 133;
  const line = points.map((item, index) => `${index ? "L" : "M"}${x(index)},${y(item.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},163 L${x(0)},163 Z`;
  const ticks = [0, 1, 2, 3].map((index) => min + ((max - min) * index) / 3);

  return <svg className="passport-rating-chart" viewBox="0 0 520 205" role="img" aria-label={`Динамика общего рейтинга: от ${formatNumber(points[0].value)} до ${formatNumber(points.at(-1).value)}`}>
    {ticks.map((tick) => <g key={tick}><line x1="42" x2="492" y1={y(tick)} y2={y(tick)} stroke="currentColor" strokeDasharray="3 4" className="passport-rating-chart__grid" /><text x="29" y={y(tick) + 4} textAnchor="end" className="passport-rating-chart__label">{Math.round(tick)}</text></g>)}
    <path d={area} className="passport-rating-chart__area" />
    <path d={line} className="passport-rating-chart__line" />
    {points.map((item, index) => <g key={`${item.label}-${index}`}><circle cx={x(index)} cy={y(item.value)} r={index === points.length - 1 ? 5 : 3} className="passport-rating-chart__point"><title>{item.label}: {formatNumber(item.value)}</title></circle>{(points.length <= 6 || index === 0 || index === points.length - 1 || index % Math.ceil(points.length / 5) === 0) && <text x={x(index)} y="190" textAnchor="middle" className="passport-rating-chart__label">{item.label}</text>}</g>)}
  </svg>;
}

function RatingLinkCard({ to, icon: Icon, title, value, detail, weight, tone }) {
  return <Link to={to} className={`passport-rating-link passport-rating-link--${tone}`}>
    <span className="passport-rating-link__icon"><Icon size={25} /></span>
    <span className="passport-rating-link__body"><span className="passport-rating-link__title">{title}</span><strong>{formatNumber(value)}</strong><span className="passport-rating-link__detail">{detail}</span>{weight != null && <span className="passport-rating-link__weight"><span style={{ width: `${weight}%` }} /></span>}</span>
    <ChevronRight size={18} className="passport-rating-link__arrow" />
  </Link>;
}

export default function ProfileRating({ seasons, season, onSeasonChange, overall, competition, duels, ratingTotal, methodology }) {
  const competitionWeight = methodology?.overall?.competition_weight == null ? methodology?.competition_weight_percent : Number(methodology.overall.competition_weight) * 100;
  const duelWeight = methodology?.overall?.duel_weight == null ? methodology?.duel_weight_percent : Number(methodology.overall.duel_weight) * 100;
  const hasWeights = Number.isFinite(Number(competitionWeight)) && Number.isFinite(Number(duelWeight));
  const competitionShare = hasWeights ? Math.max(0, Math.min(100, Number(competitionWeight))) : 0;
  const total = Number(ratingTotal);
  const rank = Number(overall?.rank);
  const hasRank = Number.isFinite(rank) && rank > 0;
  const hasTotal = Number.isFinite(total) && total > 0;
  const topPercent = hasRank && hasTotal ? Math.max(1, Math.ceil((rank / total) * 100)) : null;
  const aheadPercent = hasRank && hasTotal ? Math.max(0, Math.round(((total - rank) / total) * 100)) : null;
  const overallScore = overall?.score ?? overall?.overall_score ?? null;
  const competitionScore = competition?.score ?? overall?.competition_score ?? null;
  const duelScore = duels?.duel_rating ?? duels?.score ?? overall?.duel_rating ?? null;
  const history = overall?.history || overall?.overall_rating_history || overall?.rating_history || [];
  const validHistory = (Array.isArray(history) ? history : []).filter((item) => Number.isFinite(Number(item.score ?? item.rating)));
  const latestDelta = validHistory.length > 1 ? Number(validHistory.at(-1).score ?? validHistory.at(-1).rating) - Number(validHistory.at(-2).score ?? validHistory.at(-2).rating) : null;
  const bestPercentile = competition?.best_percentile ?? overall?.best_percentile;
  const selectedSeason = seasons.find((item) => item.slug === season);
  const ratingLink = (tab) => `/rating?tab=${tab}${season ? `&season=${encodeURIComponent(season)}` : ""}`;

  return <section className="passport-rating-section">
    <div className="passport-rating-heading">
      <div className="passport-rating-heading__copy"><h2>Рейтинг сезона</h2><p>{hasWeights ? `Компоненты сезонного рейтинга: ${formatPercent(competitionWeight)} соревнования · ${formatPercent(duelWeight)} дуэли после нормализации.` : "Результаты соревнований и дуэлей в текущем сезоне."}</p></div>
      {seasons.length > 0 && <label className="passport-rating-season"><CalendarDays size={17} /><span className="sr-only">Выбрать сезон</span><select value={season || ""} onChange={(event) => onSeasonChange(event.target.value)}>{seasons.map((item) => <option key={item.id || item.slug} value={item.slug}>{item.name || item.title || item.slug}</option>)}</select><ChevronDown size={16} /></label>}
    </div>

    <div className="passport-rating-board">
      <article className="passport-rating-overall">
        <div className="passport-rating-overall__art" aria-hidden="true"><span /><span /></div>
        <div className="passport-rating-overall__head"><span className="passport-rating-overall__icon"><Trophy size={27} /></span><div><h3>Общий рейтинг</h3><p>{selectedSeason?.name ? `Место в сезоне «${selectedSeason.name}»` : "Место в текущем сезоне"}</p></div>{hasRank && <span className="passport-rating-overall__you">Вы здесь</span>}</div>
        <div className="passport-rating-overall__score"><strong>{formatNumber(overallScore)}</strong>{latestDelta != null && <span className={latestDelta >= 0 ? "is-positive" : "is-negative"}>{latestDelta > 0 ? "+" : ""}{formatNumber(latestDelta)} за период</span>}</div>
        <div className="passport-rating-overall__rank">{hasRank ? <><Crown size={17} /> #{rank} в сезоне</> : "Место появится после участия"}</div>
        <p className="passport-rating-overall__note">{hasRank ? "Результат подтверждён в рейтинге сезона." : "Участвуйте в рейтинговых соревнованиях и дуэлях, чтобы занять место в сезоне."}</p>
        <div className="passport-rating-overall__facts"><div><span>В топе</span><strong>{topPercent == null ? "—" : `${topPercent}%`}</strong><small>участников сезона</small></div><div><span>Выше, чем</span><strong>{aheadPercent == null ? "—" : `${aheadPercent}%`}</strong><small>участников</small></div><div><span>Событий</span><strong>{formatNumber(overall?.competition_events_count)}</strong><small>в соревнованиях</small></div></div>
      </article>

      <article className="passport-rating-structure">
        <h3><BarChart3 size={18} /> Структура рейтинга</h3>
        <div className="passport-rating-structure__body"><div className={`passport-rating-ring ${hasWeights ? "" : "is-empty"}`} style={{ "--competition-share": `${competitionShare}%` }}><div><strong>{formatNumber(overallScore)}</strong><span>всего</span></div></div><div className="passport-rating-structure__legend"><div><span className="passport-rating-dot passport-rating-dot--competition" /><span>Соревнования</span><strong>{formatPercent(competitionWeight)}</strong><small>{formatNumber(competitionScore)}</small></div><div><span className="passport-rating-dot passport-rating-dot--duel" /><span>Дуэли</span><strong>{formatPercent(duelWeight)}</strong><small>{formatNumber(duelScore)}</small></div></div></div>
        <p className="passport-rating-structure__note">Доли применяются к местам после нормализации, а не к сырым очкам.</p>
      </article>

      <article className="passport-rating-dynamics"><div className="passport-rating-dynamics__head"><h3><TrendingUp size={18} /> Динамика рейтинга</h3><Link to={ratingLink("overall")}>Таблица сезона <ChevronRight size={15} /></Link></div><RatingChart history={history} />{validHistory.length > 1 && <span className="passport-rating-dynamics__latest">{formatNumber(validHistory.at(-1).score ?? validHistory.at(-1).rating)}{latestDelta != null && <small className={latestDelta >= 0 ? "is-positive" : "is-negative"}>{latestDelta > 0 ? "+" : ""}{formatNumber(latestDelta)} за период</small>}</span>}</article>

      <div className="passport-rating-bottom">
        <RatingLinkCard to={ratingLink("competitions")} icon={BarChart3} title="Соревнования" value={competitionScore} detail={competition?.rank ? `Место #${competition.rank}` : "Пока без места"} weight={competitionWeight} tone="competition" />
        <RatingLinkCard to={ratingLink("duels")} icon={Swords} title="Дуэли" value={duelScore} detail={duels?.rank ? `Место #${duels.rank}` : "Место пока не определено"} weight={duelWeight} tone="duel" />
        <Link to={ratingLink("competitions")} className="passport-rating-best"><span className="passport-rating-best__icon"><Trophy size={25} /></span><span><span className="passport-rating-best__title">Лучший результат</span><strong>{bestPercentile == null ? "—" : `Топ-${formatPercent(bestPercentile)}`}</strong><small>{bestPercentile == null ? "Появится после финального результата" : "В рейтинговом соревновании"}</small></span><ChevronRight size={18} className="passport-rating-best__arrow" /></Link>
      </div>
    </div>
  </section>;
}
