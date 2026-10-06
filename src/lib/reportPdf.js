import "./reportPdf.css";

const A4_WIDTH = 210;
const A4_HEIGHT = 297;

function node(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value !== undefined && value !== null) element.textContent = String(value);
  return element;
}

function append(parent, ...children) {
  children.filter(Boolean).forEach((child) => parent.appendChild(child));
  return parent;
}

function display(value) {
  return value === undefined || value === null || value === "" ? "—" : String(value);
}

function date(value) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "—";
}

function shortDate(value) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString("ru-RU") : "—";
}

function avatarFallback(name) {
  const initials = (name || "?").split(/\s|_/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["#7C3AED", "#06B6D4", "#EC4899", "#F59E0B", "#10B981", "#8B5CF6"];
  const index = (name || "").split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % colors.length;
  const fallback = node("span", "report-pdf__avatar-fallback", initials);
  fallback.style.background = `linear-gradient(135deg, ${colors[index]}, ${colors[index]}99)`;
  return fallback;
}

async function printableAvatar(url) {
  if (!url) return null;
  try {
    const source = new Image();
    source.crossOrigin = "anonymous";
    source.src = new URL(url, window.location.href).href;
    await source.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    const scale = Math.max(canvas.width / source.naturalWidth, canvas.height / source.naturalHeight);
    const width = source.naturalWidth * scale;
    const height = source.naturalHeight * scale;
    context.drawImage(source, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function sectionChunks(section) {
  const size = section.kind === "directions" ? 8 : section.kind === "facts" ? 8 : 7;
  if (!section.items?.length) return [];
  const chunks = [];
  for (let index = 0; index < section.items.length; index += size) {
    chunks.push({ ...section, title: index ? `${section.title} · продолжение` : section.title, items: section.items.slice(index, index + size) });
  }
  return chunks;
}

function createSection(section) {
  const wrapper = node("section", "report-pdf__section");
  wrapper.appendChild(node("h2", "report-pdf__section-title", section.title));
  const content = node("div", `report-pdf__${section.kind}`);
  section.items.forEach((item) => {
    if (section.kind === "directions") {
      const row = node("div", "report-pdf__direction");
      append(row, node("strong", "report-pdf__direction-name", item.label), node("span", "report-pdf__direction-value", display(item.value)));
      if (item.detail) row.appendChild(node("small", "report-pdf__direction-detail", item.detail));
      content.appendChild(row);
    } else if (section.kind === "facts") {
      const row = node("div", "report-pdf__fact");
      append(row, node("span", "report-pdf__fact-label", item.label), node("strong", "report-pdf__fact-value", display(item.value)));
      content.appendChild(row);
    } else {
      const row = node("div", "report-pdf__list-row");
      append(row, node("strong", "report-pdf__list-title", item.label), item.detail && node("span", "report-pdf__list-detail", item.detail));
      content.appendChild(row);
    }
  });
  wrapper.appendChild(content);
  return wrapper;
}

function createPage(report, pageNumber, includeSummary) {
  const page = node("article", "report-pdf__page");
  const top = node("div", "report-pdf__top");
  const brand = node("div", "report-pdf__brand");
  const logo = node("img", "report-pdf__brand-logo");
  logo.src = "/logo.svg";
  logo.alt = "";
  const brandCopy = node("div", "report-pdf__brand-copy");
  append(brandCopy, node("strong", "report-pdf__brand-name", "ML-Арена"), node("span", "report-pdf__brand-season", "Founder Season"));
  append(brand, logo, brandCopy);
  append(top, brand, node("span", "report-pdf__type", report.type));
  page.appendChild(top);

  const hero = node("header", `report-pdf__hero${includeSummary && report.avatarName ? " report-pdf__hero--passport" : ""}`);
  const heroCopy = node("div", "report-pdf__hero-copy");
  append(heroCopy, node("p", "report-pdf__eyebrow", report.eyebrow), node("h1", "report-pdf__title", includeSummary ? report.title : `${report.title} · продолжение`));
  if (includeSummary && report.subtitle) heroCopy.appendChild(node("p", "report-pdf__subtitle", report.subtitle));
  if (includeSummary && report.avatarName) {
    const avatar = node("div", "report-pdf__avatar");
    if (report.avatarImage) {
      const image = node("img", "report-pdf__avatar-image");
      image.src = report.avatarImage;
      image.alt = "";
      avatar.appendChild(image);
    } else {
      avatar.appendChild(avatarFallback(report.avatarName));
    }
    hero.appendChild(avatar);
  }
  hero.appendChild(heroCopy);
  page.appendChild(hero);

  const body = node("div", "report-pdf__body");
  if (includeSummary && report.stats?.length) {
    const stats = node("div", "report-pdf__stats");
    stats.style.gridTemplateColumns = `repeat(${Math.min(report.stats.length, 4)}, minmax(0, 1fr))`;
    report.stats.forEach((item) => {
      const stat = node("div", "report-pdf__stat");
      append(stat, node("span", "report-pdf__stat-label", item.label), node("strong", "report-pdf__stat-value", display(item.value)), item.detail && node("small", "report-pdf__stat-detail", item.detail));
      stats.appendChild(stat);
    });
    body.appendChild(stats);
  }
  page.appendChild(body);

  const footer = node("footer", "report-pdf__footer");
  append(footer, node("span", "report-pdf__footer-note", report.note), node("span", "report-pdf__footer-date", `Сформировано ${date(new Date())} · ${pageNumber}`));
  footer.appendChild(node("div", "report-pdf__source", report.url));
  page.appendChild(footer);
  return { page, body, footer };
}

async function download(report, filename) {
  const mount = node("div", "report-pdf__mount");
  mount.setAttribute("aria-hidden", "true");
  document.body.appendChild(mount);
  try {
    await Promise.all([
      document.fonts.load('500 14px "Inter Report"', "Пример"),
      document.fonts.load('500 14px "Inter Report"', "Sample 123"),
      document.fonts.load('700 18px "Science Gothic"', "Пример"),
      document.fonts.load('700 18px "Science Gothic"', "Sample 123"),
    ]);
    await document.fonts.ready;
    report.avatarImage = await printableAvatar(report.avatarUrl);
    const sections = report.sections.flatMap(sectionChunks);
    const pages = [];
    const first = createPage(report, 1, true);
    mount.appendChild(first.page);
    pages.push(first);
    let current = first;

    sections.forEach((section) => {
      const element = createSection(section);
      current.body.appendChild(element);
      if (element.getBoundingClientRect().bottom > current.footer.getBoundingClientRect().top - 20) {
        current.body.removeChild(element);
        current = createPage(report, pages.length + 1, false);
        mount.appendChild(current.page);
        pages.push(current);
        current.body.appendChild(element);
      }
    });

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
    await Promise.all([...mount.querySelectorAll("img")].map((image) => image.decode()));
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    pdf.setProperties({ title: report.title, subject: report.type, creator: "ML-Арена" });
    for (const [index, { page }] of pages.entries()) {
      const canvas = await html2canvas(page, { scale: 2, backgroundColor: "#ffffff", logging: false, useCORS: true });
      if (index) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, A4_WIDTH, A4_HEIGHT);
      if (report.url) pdf.link(14, 279, 182, 11, { url: report.url });
    }
    pdf.save(filename);
  } finally {
    mount.remove();
  }
}

function filenamePart(value) {
  return String(value || "user").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 48) || "user";
}

export function downloadPassportPdf({ profile, name, rating, rank, directions, badges, externalAchievements, options, url }) {
  const facts = [];
  if (options.includeCareer) {
    [["Город", profile.city], ["Университет", profile.university], ["Компания", profile.company]].forEach(([label, value]) => { if (value) facts.push({ label, value }); });
  }
  if (options.includeContacts) {
    [["Email", profile.email], ["GitHub", profile.github_url], ["Kaggle", profile.kaggle_url]].forEach(([label, value]) => { if (value) facts.push({ label, value }); });
  }
  const verifiedExternal = options.includeExternal ? externalAchievements.filter((item) => item.verified === true || ["verified", "approved", "confirmed"].includes(item.verification_status || item.status)) : [];
  const sections = [
    { title: "Направления ML", kind: "directions", items: directions.map((item) => ({ label: item.title, value: item.score == null ? "—" : item.score, detail: item.evidence ? `${item.evidence.official.length} официальных финалов · ${item.evidence.duels.length} дуэлей` : "Индекс профиля" })) },
    ...(badges.length ? [{ title: "Достижения ML-Арены", kind: "list", items: badges.map((grant) => ({ label: grant.badge?.name || grant.name || grant.title || "Бейдж", detail: grant.badge?.description || grant.description || "" })) }] : []),
    ...(verifiedExternal.length ? [{ title: "Подтверждённые внешние достижения", kind: "list", items: verifiedExternal.map((item) => ({ label: item.title || item.name || item.competition_name || "Достижение", detail: item.source || item.platform || item.provider || "" })) }] : []),
    ...(facts.length ? [{ title: "Дополнительные сведения", kind: "facts", items: facts }] : []),
  ];
  return download({
    type: "ML-паспорт / резюме",
    avatarName: name,
    avatarUrl: profile.avatar_url,
    eyebrow: profile.user_name ? `@${profile.user_name}` : "Профиль участника",
    title: name,
    subtitle: profile.bio || "Практические результаты и направления машинного обучения.",
    stats: [{ label: "Рейтинг сезона", value: rating }, { label: "Место", value: rank ? `#${rank}` : "—" }, { label: "Соревнования", value: profile.stats?.competitions_participated ?? "—" }, { label: "Бейджи", value: badges.length }],
    sections,
    note: "Сводка профиля, не официальный сертификат. Актуальные данные доступны по ссылке.",
    url,
  }, `ml-arena-passport-${filenamePart(profile.user_name)}.pdf`);
}

export function downloadCompetitionPdf({ competition, result, score, metric, url }) {
  const sections = [
    { title: "Результат участника", kind: "facts", items: [
      { label: "Участник", value: result.user_name || result.user_id },
      { label: "Метрика", value: metric },
      { label: "Таблица", value: result.leaderboard_kind === "private" ? "Финальная (private)" : display(result.leaderboard_kind) },
      { label: "Завершено", value: date(competition.final_results_at || competition.completed_at || competition.deadline) },
      { label: "Тип", value: competition.origin === "community" ? "Соревнование сообщества" : "Официальное соревнование" },
      { label: "Уровень подтверждения", value: result.evidence_level === "arena_verified" ? "Результат ML-Арены" : "Активность сообщества" },
    ] },
  ];
  return download({
    type: "Итог соревнования",
    eyebrow: "Завершённое соревнование",
    title: result.competition_title || competition.title,
    subtitle: "Карточка результата участника по опубликованным итогам.",
    stats: [{ label: "Итоговое место", value: result.rank ? `#${result.rank}` : "—" }, { label: "Результат", value: score }, { label: "Участников", value: result.participants_count ?? "—" }],
    sections,
    note: "Карточка сформирована по данным итогов. Проверяйте актуальность на странице соревнования.",
    url,
  }, `ml-arena-competition-${filenamePart(competition.id)}.pdf`);
}

export function downloadDuelPdf({ duel, player1Score, player2Score, metric, taskType, url }) {
  const result = duel.is_draw ? "Ничья" : duel.winner_name === "Ты" ? "Победа" : "Поражение";
  return download({
    type: "Итог дуэли",
    eyebrow: "Дуэль 1×1 · завершена",
    title: `${display(duel.player1_name)} × ${display(duel.player2_name)}`,
    subtitle: duel.task_title || "Одинаковая задача и единые условия для обоих участников.",
    stats: [{ label: "Результат", value: result }, { label: "Изменение рейтинга", value: duel.current_user_rating_change == null ? "—" : `${duel.current_user_rating_change > 0 ? "+" : ""}${duel.current_user_rating_change}` }, { label: "Дата", value: shortDate(duel.completed_at) }],
    sections: [
      { title: "Сравнение результатов", kind: "facts", items: [
        { label: display(duel.player1_name), value: player1Score },
        { label: display(duel.player2_name), value: player2Score },
        { label: "Метрика", value: metric },
        { label: "Направление", value: taskType },
      ] },
      { title: "Параметры матча", kind: "facts", items: [
        { label: "Рейтинг участника", value: duel.player1_rating },
        { label: "Рейтинг соперника", value: duel.player2_rating },
        { label: "ID дуэли", value: duel.id },
        { label: "Статус", value: "Завершена" },
      ] },
    ],
    note: "Карточка отражает итог матча и не содержит исходные решения участников.",
    url,
  }, `ml-arena-duel-${filenamePart(duel.id)}.pdf`);
}
