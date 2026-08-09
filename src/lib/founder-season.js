export const FOUNDER_TELEGRAM_URL = import.meta.env.VITE_FOUNDER_TELEGRAM_URL || "https://t.me/ml_arena";

export const ML_INTERESTS = [
  "Tabular ML",
  "NLP",
  "Computer Vision",
  "Time Series",
  "Recommendation Systems",
  "Ranking",
  "Anomaly Detection",
  "Generative AI",
  "Другое",
];

export const FOUNDER_SECTIONS = {
  competitions: {
    title: "Соревнования ML Арены",
    description: "Мы готовим первое соревнование ML Арены. Предрегистрация уже открыта, а текущие задания и анонсы Founder Season выходят в Telegram.",
  },
  duels: {
    title: "Дуэли 1×1",
    description: "Режим с таймером, результатом и рейтингом появится после запуска платформы. Пока участвуйте в активностях Founder Season в Telegram.",
  },
  rating: {
    title: "Рейтинг участников",
    description: "История рейтинга начнёт формироваться после первых подтверждённых результатов на платформе.",
  },
  passport: {
    title: "ML-паспорт",
    description: "Здесь будут собраны подтверждённые соревнования, дуэли и направления навыков участника.",
  },
};

export function maskEmail(email = "") {
  const [name = "", domain = ""] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(2, name.length - visible.length))}@${domain}`;
}

export function trackFounderEvent(name, detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ml-arena:founder-event", { detail: { name, ...detail } }));
}
