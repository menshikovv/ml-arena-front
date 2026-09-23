import { Award, Check, History, Swords, Target, TrendingUp } from "lucide-react";
import "./ProfilePractice.css";

const formatNumber = (value) => value == null || !Number.isFinite(Number(value)) ? "—" : Number(value).toLocaleString("ru-RU", { useGrouping: false });

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

function PracticeChart({ history }) {
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
    <svg className="passport-practice-chart__svg" viewBox="0 0 1000 265" role="img" aria-label={`История рейтинга дуэлей: от ${formatNumber(points[0].value)} до ${formatNumber(points.at(-1).value)}`}>
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

export default function ProfilePractice({ matches, wins, losses, bonus, rating, startRating, history }) {
  const stats = [
    { icon: Swords, tone: "blue", label: "Дуэли с людьми", value: matches, detail: "Завершённые матчи" },
    { icon: Check, tone: "green", label: "Победы", value: wins, detail: "В дуэлях с участниками" },
    { icon: History, tone: "red", label: "Поражения", value: losses, detail: "В дуэлях с участниками" },
    { icon: Award, tone: "violet", label: "Бонус вызовов", value: bonus, detail: "За задания ML-Арены" },
    { icon: Target, tone: "amber", label: "Рейтинг дуэлей сезона", value: rating, detail: Number(matches) > 0 ? "Текущее значение" : startRating == null ? "Появится после первого матча" : `Начинается с ${formatNumber(startRating)}` },
  ];

  return <section className="passport-practice">
    <header className="passport-practice__heading"><h2>Практика</h2><p>История рейтинговых дуэлей и результатов против заданий ML-Арены.</p></header>
    <div className="passport-practice__stats">{stats.map((stat) => <PracticeStat key={stat.label} {...stat} />)}</div>
    <div className="passport-practice__history"><h2>История рейтинга дуэлей</h2><p>Изменения рейтинга в завершённых матчах.</p><div className="passport-practice-chart"><PracticeChart history={history} /></div></div>
  </section>;
}
