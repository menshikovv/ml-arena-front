import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleUserRound,
  Lock,
  ShieldCheck,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { METRIC_LABELS, TASK_TYPE_LABELS } from "@/lib/ml-arena";
import { cn } from "@/lib/utils";

const STATUS_META = {
  active: { label: "Активно", className: "competition-event__status--active" },
  upcoming: { label: "Скоро", className: "competition-event__status--upcoming" },
  finalizing: { label: "Финализация", className: "competition-event__status--upcoming" },
  finished: { label: "Завершено", className: "competition-event__status--finished" },
};

function pluralize(value, one, few, many) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function getTimeLabel(competition, status) {
  if (status === "finished") return "Результаты опубликованы";
  if (status === "finalizing") return "Идёт финальный пересчёт";
  if (!competition.deadline) return "Дата уточняется";
  if (status === "upcoming") return `Старт до ${new Date(competition.deadline).toLocaleDateString("ru-RU")}`;
  const diff = new Date(competition.deadline).getTime() - Date.now();
  const days = Math.max(0, Math.ceil(diff / 86400000));
  return days > 0 ? `Осталось ${days} ${pluralize(days, "день", "дня", "дней")}` : "Последний день";
}

export default function CompetitionCard({ competition, status, meta, userState, featured = false, sequence = 1 }) {
  const statusMeta = STATUS_META[status] || STATUS_META.active;
  const isRestricted = competition.is_private || ["application", "invite_only", "partner", "premium"].includes(competition.access_type || competition.access);
  const isCommunity = competition.origin === "community";
  const isRated = !isCommunity && competition.rated !== false;
  const cashPrize = Number(competition.cash_prize_amount_rub ?? competition.prize_fund ?? 0);
  const prizeLabel = competition.prize_type === "non_cash" && competition.prize_description
    ? competition.prize_description
    : cashPrize > 0 ? `${cashPrize.toLocaleString("ru-RU")} ₽` : null;
  const prizeTitle = isCommunity ? "Практика" : prizeLabel || (isRated ? "Рейтинговое" : "Тренировочное");
  const prizeDescription = isCommunity
    ? "Результат сохранится в истории сообщества без сезонных очков."
    : prizeLabel
      ? "Награды получают участники, занявшие лучшие места по итогам соревнования."
      : isRated
        ? "Результат влияет на рейтинг и подтверждённую часть ML-паспорта."
        : "Практика не влияет на сезонный рейтинг.";
  const cta = status === "finished"
    ? "Смотреть результаты"
    : status === "finalizing"
      ? "Открыть соревнование"
      : status === "upcoming"
        ? "Открыть описание"
        : userState?.rank
          ? "Открыть рейтинг"
          : userState?.joined
            ? "Продолжить участие"
            : isRestricted
              ? "Подробнее"
              : "Участвовать";

  return (
    <Link to={`/competitions/${competition.id}`} className="competition-event-link">
      <article className={cn("competition-event", featured && "competition-event--featured")}>
        <div className="competition-event__main">
          <div className="competition-event__top">
            <h3>{competition.title}</h3>
            <span className="competition-event__sequence">Событие {String(sequence).padStart(2, "0")}</span>
          </div>
          <div className="competition-event__badges">
            <span className="competition-event__origin">
              {isCommunity ? <CircleUserRound size={12} /> : <ShieldCheck size={12} />}
              {isCommunity ? "Сообщество" : competition.origin === "official_partner" ? "Партнёрское" : "Официальное"}
            </span>
            <span className={cn("competition-event__status", statusMeta.className)}>
              <span aria-hidden="true" />{statusMeta.label}
            </span>
            <span>{TASK_TYPE_LABELS[competition.task_type] || competition.task_type}</span>
            <span>{meta.difficulty}</span>
            <span>{isRestricted && <Lock size={11} />}{meta.access}</span>
          </div>
          <p className="competition-event__description">{competition.description}</p>
          <div className="competition-event__facts">
            <span><Target size={14} />{METRIC_LABELS[competition.metric] || competition.metric || "Метрика уточняется"}</span>
            <span><Users size={14} />{competition.participants_count ?? "—"} участников</span>
            <span><CalendarClock size={14} />{getTimeLabel(competition, status)}</span>
            <span><Building2 size={14} />{competition.company_name || "ML-Арена"}</span>
          </div>
        </div>
        <div className="competition-event__aside">
          <Trophy className="competition-event__prize-icon" size={21} aria-hidden="true" />
          <div className="competition-event__prize">
            <span>{isCommunity ? "Статус результата" : prizeLabel ? "Призы" : "Формат"}</span>
            <strong>{prizeTitle}</strong>
            <p>{prizeDescription}</p>
          </div>
          {userState?.rank ? (
            <div className="competition-event__result">
              <span>Ваш результат <strong>#{userState.rank}</strong></span>
              <span>Балл <strong>{userState.score ?? "—"}</strong></span>
            </div>
          ) : userState?.joined ? (
            <span className="competition-event__joined"><CheckCircle2 size={13} />Вы участвуете</span>
          ) : null}
          <span className="competition-event__action">{cta}<ArrowRight size={16} aria-hidden="true" /></span>
        </div>
      </article>
    </Link>
  );
}
