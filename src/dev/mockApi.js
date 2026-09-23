const STATE_KEY = "ml-arena-demo-state-v1";
const ROLE_KEY = "ml-arena-demo-role";
const now = "2026-09-23T10:00:00Z";
const demoUserId = "demo-user";

function seedState() {
  const profiles = [
    { id: "profile-demo", user_id: demoUserId, user_name: "menshikov", first_name: "Матвей", last_name: "Меншиков", bio: "Исследую данные, обучаю модели и проверяю идеи на практике.", city: "Москва", university: "МГУ", created_at: "2026-04-12T10:00:00Z", public_profile: true, show_real_name: true, skills: { classification: 76, regression: 62, nlp: 45, cv: 31, time_series: 58, ranking: 35, clustering: 44, recsys: 27 }, stats: { competitions_participated: 4, duels_won: 7, duels_lost: 3 }, rating_history: [{ date: "01.09", rating: 1000 }, { date: "08.09", rating: 1026 }, { date: "15.09", rating: 1054 }, { date: "22.09", rating: 1082 }] },
    { id: "profile-alex", user_id: "user-alex", user_name: "alex_flexer", first_name: "Александр", last_name: "Флексер", bio: "Компьютерное зрение и прикладное ML.", city: "Санкт-Петербург", created_at: "2025-01-18T10:00:00Z", public_profile: true, skills: { cv: 84, classification: 72, nlp: 26 }, stats: { competitions_participated: 6, duels_won: 11, duels_lost: 5 } },
    { id: "profile-norm", user_id: "user-norm", user_name: "norm_tip", first_name: "Никита", last_name: "Петров", bio: "Временные ряды и рекомендательные системы.", city: "Казань", created_at: "2025-05-07T10:00:00Z", public_profile: true, skills: { time_series: 79, recsys: 68, ranking: 60 }, stats: { competitions_participated: 3, duels_won: 4, duels_lost: 4 } },
  ];
  const competitions = [
    { id: "competition-churn", slug: "customer-churn", title: "Прогноз оттока клиентов", short_description: "Предскажите вероятность ухода клиента на основе истории взаимодействий.", description: "Постройте модель классификации, которая находит клиентов с высоким риском оттока. Данные и шаблон решения доступны после вступления.", origin: "official", status: "active", task_type: "classification", direction: "classification", metric: "roc_auc", metric_name: "ROC AUC", difficulty: "Средняя", access: "public", starts_at: "2026-09-10T10:00:00Z", deadline: "2026-10-20T18:00:00Z", final_results_at: "2026-10-22T18:00:00Z", participants_count: 148, daily_submission_limit: 5, public_split_percent: 30, prediction_column: "prediction", target_column: "target", current_dataset_version_id: "dataset-v1", prize_type: "cash", cash_prize_amount_rub: 50000, organizer_name: "ML-Арена", rules_version: 1 },
    { id: "competition-demand", slug: "demand-forecast", title: "Прогноз спроса", short_description: "Постройте точный прогноз спроса на следующие недели.", description: "Используйте исторические данные продаж и сезонные признаки для прогноза спроса.", origin: "official", organization_id: "org-demo", status: "active", task_type: "time_series", direction: "time_series", metric: "mae", metric_name: "MAE", difficulty: "Продвинутая", access: "public", starts_at: "2026-09-16T10:00:00Z", deadline: "2026-11-02T18:00:00Z", participants_count: 92, daily_submission_limit: 5, prediction_column: "prediction", current_dataset_version_id: "dataset-v2", prize_type: "non_cash", prize_description: "Менторская сессия и мерч ML-Арены", organizer_name: "DataLab", rules_version: 1 },
    { id: "competition-text", slug: "text-classifier", title: "Классификация отзывов", short_description: "Создайте модель анализа тональности текста.", description: "Определите тональность отзывов по обучающей выборке.", origin: "community", status: "active", task_type: "nlp", direction: "nlp", metric: "f1", difficulty: "Начальная", access: "public", starts_at: "2026-09-19T10:00:00Z", deadline: "2026-10-12T18:00:00Z", participants_count: 34, daily_submission_limit: 5, prediction_column: "label", current_dataset_version_id: "dataset-v3", organizer_name: "Сообщество ML-Арены", rules_version: 1 },
    { id: "competition-vision", slug: "vision-archive", title: "Распознавание объектов", short_description: "Архивное соревнование по компьютерному зрению.", description: "Определите класс объекта на фотографии.", origin: "official", status: "finished", task_type: "cv", direction: "computer_vision", metric: "accuracy", difficulty: "Средняя", access: "public", starts_at: "2026-07-01T10:00:00Z", deadline: "2026-08-10T18:00:00Z", participants_count: 207, prediction_column: "label", current_dataset_version_id: "dataset-v4", organizer_name: "ML-Арена", rules_version: 1 },
  ];
  const posts = [
    { id: "post-baseline", slug: "perviy-baseline", title: "Как собрать первый бейзлайн для соревнования", excerpt: "От изучения датасета до первого воспроизводимого решения.", category: { slug: "practice", name: "Практика" }, tags: ["baseline", "данные"], published_at: "2026-09-18T12:00:00Z", reading_time_minutes: 7, is_featured: true, author: { display_name: "Редакция ML-Арены" }, status: "published", body_html: "<h2>Начните с данных</h2><p>Проверьте структуру датасета, пропуски и распределение целевой переменной.</p><h2>Соберите простой бейзлайн</h2><p>Сохраните шаги подготовки данных и настройки модели. Это поможет честно сравнивать следующие эксперименты.</p><h2>Отправьте результат</h2><p>Проверьте формат CSV по шаблону и отправьте решение в соревнование.</p>" },
    { id: "post-duels", slug: "kak-prohodyat-dueli", title: "Как проходят рейтинговые дуэли", excerpt: "Одинаковая задача, ограниченное время и прозрачный итог.", category: { slug: "arena", name: "ML-Арена" }, tags: ["дуэли", "рейтинг"], published_at: "2026-09-14T12:00:00Z", reading_time_minutes: 5, author: { display_name: "Редакция ML-Арены" }, status: "published", body_html: "<h2>Один матч, равные условия</h2><p>Оба участника получают одну задачу и одинаковый лимит времени.</p><h2>Результат</h2><p>Победитель определяется по выбранной метрике после проверки решений.</p>" },
    { id: "post-ranking", slug: "metrika-i-razbienie", title: "Публичная и приватная оценка", excerpt: "Зачем нужны две части тестовой выборки и как читать результат.", category: { slug: "theory", name: "Разборы" }, tags: ["метрики", "соревнования"], published_at: "2026-09-09T12:00:00Z", reading_time_minutes: 6, author: { display_name: "Редакция ML-Арены" }, status: "published", body_html: "<h2>Публичная оценка</h2><p>Во время соревнования участник видит результат на открытой части данных.</p><h2>Приватная оценка</h2><p>Финальные места определяются по скрытой части после завершения соревнования.</p>" },
  ];
  const badge = { id: "badge-first", code: "first_duel", name: "Первый вызов", description: "Завершена первая рейтинговая дуэль.", icon_key: "swords", color_token: "blue-500", status: "active" };
  return {
    profiles, competitions, posts, badge,
    seasons: [{ id: "season-founder", slug: "founder-season", name: "Founder Season", description: "Первый сезон ML-Арены. Решайте задачи, участвуйте в дуэлях и собирайте подтверждённую историю результатов.", status: "active", start_at: "2026-08-30T00:00:00Z", end_at: "2027-01-01T00:00:00Z" }],
    plans: [{ id: "plan-month", code: "premium_month", name: "ML-Арена Premium", amount: 69000, compare_at_amount: 99000, billing_period: "month", currency: "RUB", status: "active" }, { id: "plan-year", code: "premium_year", name: "ML-Арена Premium", amount: 599000, compare_at_amount: 828000, billing_period: "year", currency: "RUB", status: "active" }],
    organizations: [{ id: "org-demo", name: "DataLab", slug: "datalab", status: "active", description: "Команда прикладного машинного обучения" }],
    datasets: [{ id: "dataset-demo", code: "customer_churn", name: "Клиенты и отток", status: "active", current_version: { id: "dataset-v1", version: 1, status: "validated" } }],
    metrics: [{ id: "metric-auc", code: "roc_auc", name: "ROC AUC", status: "active", direction: "maximize", current_version: { id: "metric-v1", version: 1, status: "approved" } }, { id: "metric-business", code: "business_score", name: "Business score", owner_organization_id: "org-demo", status: "active", direction: "maximize", current_version: { id: "metric-v2", version: 1, moderation_status: "approved", status: "approved" } }],
    tasks: [{ id: "task-churn", code: "customer_churn", title: "Прогноз оттока", name: "Прогноз оттока", status: "active", task_type: "classification", current_version: { id: "task-v1", version: 1, status: "released" } }],
    subscriptions: [], submissions: [], comments: {}, notes: {}, joined: {},
    duels: [{ id: "duel-complete", status: "completed", task_type: "classification", created_at: "2026-09-20T12:00:00Z", player1: { user_id: demoUserId, user_name: "menshikov", rating: 1082 }, player2: { user_id: "user-alex", user_name: "alex_flexer", rating: 1061 }, winner_id: demoUserId, rating_change: { [demoUserId]: 18 } }],
    challenges: [], tickets: {}, arenaChallenges: {},
  };
}

let state;
try { state = JSON.parse(sessionStorage.getItem(STATE_KEY)) || seedState(); } catch { state = seedState(); }
if (state.profiles?.[0]?.user_id === demoUserId && state.profiles[0].created_at === "2024-04-12T10:00:00Z") {
  state.profiles[0].created_at = "2026-04-12T10:00:00Z";
  try { sessionStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch { /* Demo still works without persisted state. */ }
}
const role = () => localStorage.getItem(ROLE_KEY) || "user";
const save = () => sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
const id = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
const list = (items, params) => {
  let rows = [...items];
  const q = params.get("q")?.toLowerCase();
  if (q) rows = rows.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  return rows.slice(Number(params.get("offset") || 0), Number(params.get("offset") || 0) + Number(params.get("limit") || 100));
};
const profile = () => state.profiles[0];
const account = () => ({ id: demoUserId, email: role() === "admin" ? "admin@demo.local" : "matvey@demo.local", role: role(), status: "active", email_verified: true });
const reply = (data, status = 200, extra = {}) => new Response(JSON.stringify(status >= 400 ? { error: data } : { data, ...extra }), { status, headers: { "Content-Type": "application/json" } });
const notFound = () => reply({ code: "RESOURCE_NOT_FOUND", message: "В демо-данных запись не найдена" }, 404);
const rows = (items, params) => reply(list(items, params), 200, { meta: { total: items.length } });

function rating(params) {
  const tab = params.get("tab") || "overall";
  const entries = state.profiles.map((item, index) => ({ id: item.user_id, user_id: item.user_id, profile: item, rank: index + 1, score: tab === "duels" ? 1082 - index * 30 : tab === "competitions" ? 340 - index * 60 : 430 - index * 45, overall_score: 430 - index * 45, competition_score: 340 - index * 60, duel_rating: 1082 - index * 30, competition_events_count: 4 - index, human_duels_count: 10 - index * 2, wins: 7 - index, losses: 3 + index, direction_scores: item.skills, directions: Object.keys(item.skills).slice(0, 3) }));
  entries[0].best_percentile = 1;
  if (tab === "overall") entries[0].history = [
    { date: "2026-08-30", score: 178 }, { date: "2026-09-02", score: 196 },
    { date: "2026-09-05", score: 235 }, { date: "2026-09-08", score: 238 },
    { date: "2026-09-11", score: 272 }, { date: "2026-09-14", score: 308 },
    { date: "2026-09-17", score: 356 }, { date: "2026-09-20", score: 418 },
    { date: "2026-09-23", score: 430 },
  ];
  return { items: entries, current_user: entries[0], total: entries.length, season: state.seasons[0] };
}

function adminResource(path) {
  const resources = [
    ["/api/v1/admin/billing/plans", "plans"], ["/api/v1/admin/blog/posts", "posts"],
    ["/api/v1/admin/organizations", "organizations"], ["/api/v1/admin/competitions", "competitions"],
    ["/api/v1/admin/subscriptions", "subscriptions"], ["/api/v1/admin/submissions", "submissions"],
    ["/api/v1/admin/datasets", "datasets"], ["/api/v1/admin/metrics", "metrics"],
    ["/api/v1/admin/tasks", "tasks"], ["/api/v1/admin/badges", "badges"],
    ["/api/v1/admin/users", "profiles"],
  ];
  return resources.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
}

function adminRequest(path, method, body, params) {
  if (path === "/api/v1/admin/me") return reply({ ...account(), roles: ["super_admin"], permissions: ["*"] });
  if (path === "/api/v1/admin/dashboard") return reply({ users_total: 1248, users_active_30d: 583, competitions_active: state.competitions.filter((item) => item.status === "active").length, submissions_24h: 37, failed_submissions_24h: 2, open_reports: 1, scheduled_posts: 0, recent_audit_events: [{ id: "event-1", action: "Соревнование опубликовано", target_type: "competition", target_id: "competition-churn", created_at: now }] });
  if (path === "/api/v1/admin/roles") return reply([{ code: "super_admin", name: "Суперадминистратор" }, { code: "content_editor", name: "Редактор" }]);
  if (path === "/api/v1/admin/metrics/pending-review") return reply(state.metrics.filter((item) => item.current_version?.moderation_status === "pending_review").map((metric) => ({ metric, version: metric.current_version })));
  if (path === "/api/v1/admin/metrics/custom" && method === "POST") {
    const version = { id: id("metric-version"), version: 1, moderation_status: "draft", ...body };
    const metric = { id: id("metric"), code: body.code, name: body.name, description: body.description, status: "draft", current_version: version, current_version_id: version.id };
    state.metrics.unshift(metric);
    save();
    return reply(metric);
  }
  if (path.startsWith("/api/v1/admin/metric-versions/")) {
    const parts = path.split("/");
    const metric = state.metrics.find((item) => item.current_version?.id === parts[5]);
    if (!metric) return notFound();
    const action = parts[6];
    if (action === "validation-runs") return reply([]);
    if (action === "source") return reply({ url: "data:text/plain;charset=utf-8,def%20score(data)%3A%0A%20%20%20%20return%200.9" });
    if (action === "test") return reply({ id: id("test"), status: "passed" });
    if (method === "POST") {
      metric.current_version.moderation_status = ({ approve: "approved", reject: "rejected", "request-changes": "changes_requested" })[action] || metric.current_version.moderation_status;
      save();
    }
    return reply(metric.current_version);
  }
  if (path === "/api/v1/admin/rating/seasons" && method === "GET") return rows(state.seasons, params);
  if (path === "/api/v1/admin/rating/seasons" && method === "POST") { const season = { id: id("season"), status: "draft", ...body }; state.seasons.push(season); save(); return reply(season); }
  if (path.startsWith("/api/v1/admin/rating/seasons/")) { const season = state.seasons.find((item) => item.id === path.split("/")[6]); if (season) { season.status = path.split("/").at(-1); save(); } return reply(season || {}); }
  if (path === "/api/v1/admin/audit-logs") return rows([{ id: "audit-1", action: "Вход в админку", target_type: "user", target_id: demoUserId, created_at: now }], params);
  if (path === "/api/v1/admin/moderation/reports") return rows([{ id: "report-1", status: "open", reason: "Проверить публикацию", created_at: now }], params);
  if (path.startsWith("/api/v1/admin/moderation/reports/")) return reply({ id: path.split("/")[6], status: "resolved" });
  if (path === "/api/v1/admin/blog/categories") return reply([{ id: "cat-practice", slug: "practice", name: "Практика" }, { id: "cat-arena", slug: "arena", name: "ML-Арена" }]);
  if (path === "/api/v1/admin/blog/tags") return reply([{ id: "tag-1", slug: "baseline", name: "baseline" }]);
  if (path === "/api/v1/admin/blog/media") return rows([], params);
  if (path.startsWith("/api/v1/admin/blog/") && path.endsWith("/revisions")) return reply([]);
  if (path.startsWith("/api/v1/admin/blog/") && path.endsWith("/metrics")) return reply({ views: 128, unique_views: 92, cta_clicks: 12 });
  if (path.includes("/validation-runs")) return reply([]);
  if (path.includes("/validation")) return reply({ status: "passed", checks: [] });
  if (path.includes("/readiness")) return reply({ ready: true, checks: [] });
  if (path.includes("/leaderboard/snapshots") || path.includes("/leaderboard/recalculations")) return reply([]);
  if (path.includes("/notes")) {
    const userId = path.split("/")[5];
    if (method === "POST") { const note = { id: id("note"), note: body.note, created_at: now }; (state.notes[userId] ||= []).push(note); save(); return reply(note); }
    return reply(state.notes[userId] || []);
  }
  const resource = adminResource(path);
  if (resource) {
    const [prefix, key] = resource;
    const rest = path.slice(prefix.length).split("/").filter(Boolean);
    const items = key === "badges" ? [state.badge] : state[key];
    if (!rest.length) {
      if (method === "GET") return rows(items, params);
      if (method === "POST") { const created = { id: id(key.slice(0, -1)), status: "draft", created_at: now, ...body }; if (key === "badges") state.badge = created; else items.unshift(created); save(); return reply(created); }
    }
    const item = items.find((entry) => entry.id === rest[0] || entry.user_id === rest[0]);
    if (!item) return notFound();
    if (rest.length === 1) {
      if (method === "GET") return reply(item);
      if (method === "PATCH" || method === "PUT") { Object.assign(item, body); save(); return reply(item); }
      if (method === "DELETE") { if (key !== "badges") items.splice(items.indexOf(item), 1); save(); return reply(item); }
    }
    if (rest[1] === "versions" && method === "POST") { const version = { id: id("version"), version: (item.current_version?.version || 0) + 1, status: "draft", ...body }; item.current_version = version; item.current_version_id = version.id; save(); return reply(version); }
    if (rest[1] === "notes") return reply(state.notes[rest[0]] || []);
    if (rest[1] === "badges") { if (method === "POST") return reply({ id: id("grant"), badge: state.badge, status: "active" }); return reply([]); }
    if (rest[1] === "duplicate" && method === "POST") { const copy = { ...item, id: id("copy"), title: `${item.title || item.name} (копия)`, status: "draft" }; items.unshift(copy); save(); return reply(copy); }
    if (method === "POST") { item.status = ({ publish: "active", archive: "archived", pause: "paused", resume: "active", verify: "active", ban: "banned", unban: "active" })[rest.at(-1)] || item.status; save(); return reply(item); }
    return reply(item);
  }
  if (method === "POST") return reply({ id: id("action"), status: "completed" });
  return reply([]);
}

function request(path, method, body, params) {
  if (path.startsWith("/api/v1/admin/")) return adminRequest(path, method, body, params);
  if (path === "/api/v1/auth/refresh" || path === "/api/v1/auth/login" || path === "/api/v1/auth/register") return reply({ access_token: "demo-token", user: account() });
  if (path === "/api/v1/auth/me") return reply(account());
  if (path.startsWith("/api/v1/auth/")) return reply({ ok: true });
  if (path === "/api/v1/config/public") return reply({ features: { competitions: true, duels: true, rating: true, ml_passport: true }, telegram_url: "https://t.me/ml_arena" });
  if (path === "/api/v1/public/platform-stats") return reply({ users: 1248, active_competitions: 2, completed_duels: 386, submissions: 4872 });
  if (path === "/api/v1/public/leaderboard-preview") return reply({ items: rating(new URLSearchParams()).items });
  if (path === "/api/v1/public/competitions-preview") return rows(state.competitions.slice(0, 3), params);
  if (path === "/api/v1/blog/config/public") return reply({ enabled: true });
  if (path === "/health") return reply({ status: "ok" });

  if (path === "/api/v1/profiles/me") { if (method === "PATCH") { Object.assign(profile(), body); save(); } return reply(profile()); }
  if (path === "/api/v1/profiles/me/avatar") { if (method === "DELETE") profile().avatar_url = null; else profile().avatar_url = "/passport-mark.svg"; save(); return reply(profile()); }
  if (path === "/api/v1/profiles/search") return rows(state.profiles, params);
  if (/^\/api\/v1\/profiles\/[^/]+\/badges$/.test(path)) return reply(path.split("/")[4] === demoUserId ? [{ id: "grant-first", status: "active", awarded_at: now, badge: state.badge }] : []);
  if (path.startsWith("/api/v1/profiles/")) return reply(state.profiles.find((item) => item.user_id === path.split("/")[4] || item.id === path.split("/")[4]) || profile());

  if (path === "/api/v1/rating/seasons") return reply(state.seasons);
  if (path === "/api/v1/rating/methodology") return reply({ method_version: "founder-v1", overall: { competition_weight: 0.7, duel_weight: 0.3 }, competition_weight_percent: 70, duel_weight_percent: 30, duel: { start: 1000, calibration_matches: 5, stake_percent: 0.05, stake_min: 10, stake_max: 50, delta_cap: 75 }, direction_min_users: 3 });
  if (path === "/api/v1/rating") return reply(rating(params));
  if (path === "/api/v1/leaderboard") return reply(rating(params));
  if (path === "/api/v1/billing/plans") return reply(state.plans);
  if (path === "/api/v1/metrics") return reply(state.metrics);
  if (path === "/api/v1/tasks") return rows(state.tasks, params);
  if (path.startsWith("/api/v1/tasks/")) return reply(state.tasks.find((item) => item.id === path.split("/")[4]) || state.tasks[0]);
  if (path === "/api/v1/badges/catalog") return reply([state.badge]);

  if (path === "/api/v1/blog/categories") return reply([{ id: "cat-practice", slug: "practice", name: "Практика" }, { id: "cat-arena", slug: "arena", name: "ML-Арена" }, { id: "cat-theory", slug: "theory", name: "Разборы" }]);
  if (path === "/api/v1/blog/tags") return reply([{ id: "tag-1", slug: "baseline", name: "baseline" }]);
  if (path === "/api/v1/blog/posts") { const category = params.get("category"); return rows(state.posts.filter((item) => !category || item.category?.slug === category), params); }
  if (path.startsWith("/api/v1/blog/posts/") && path.endsWith("/comments")) {
    const postId = path.split("/")[5];
    if (method === "POST") { const comment = { id: id("comment"), body: body.body, author_id: demoUserId, author_name: profile().user_name, created_at: now }; (state.comments[postId] ||= []).push(comment); save(); return reply(comment); }
    return reply(state.comments[postId] || []);
  }
  if (path.startsWith("/api/v1/blog/posts/") && path.endsWith("/events")) return reply({ ok: true });
  if (path.startsWith("/api/v1/blog/posts/")) return reply(state.posts.find((item) => item.slug === decodeURIComponent(path.split("/")[5]) || item.id === path.split("/")[5]) || state.posts[0]);
  if (path.startsWith("/api/v1/blog/comments/")) { for (const items of Object.values(state.comments)) { const item = items.find((entry) => entry.id === path.split("/")[5]); if (item) { if (method === "DELETE") items.splice(items.indexOf(item), 1); else Object.assign(item, body); save(); return reply(item); } } return notFound(); }

  if (path === "/api/v1/competitions") return rows(state.competitions.filter((item) => !params.get("origin") || item.origin === params.get("origin")), params);
  if (path === "/api/v1/competitions/community" && method === "POST") { const item = { id: id("competition"), origin: "community", status: "draft", created_at: now, ...body }; state.competitions.unshift(item); save(); return reply(item); }
  if (path.startsWith("/api/v1/competitions/by-slug/")) return reply(state.competitions.find((item) => item.slug === decodeURIComponent(path.split("/")[5])) || state.competitions[0]);
  if (path === "/api/v1/competitions/invites/accept") return reply({ competition_id: "competition-text" });
  if (path.startsWith("/api/v1/competitions/")) {
    const parts = path.split("/").filter(Boolean);
    const item = state.competitions.find((entry) => entry.id === parts[3]);
    if (!item) return notFound();
    const tail = parts.slice(4).join("/");
    if (!tail) return reply(item);
    if (tail === "rules") return reply({ version: 1, content: "Участники используют открытые данные и соблюдают правила честной игры." });
    if (tail === "join") { state.joined[item.id] = true; save(); return reply({ competition_id: item.id, status: "active" }); }
    if (tail === "participation/me") { if (method === "DELETE") { delete state.joined[item.id]; save(); return reply({}); } return state.joined[item.id] ? reply({ id: `participation-${item.id}`, competition_id: item.id, status: "active", best_public_score: null }) : notFound(); }
    if (tail === "files") return reply([{ id: `file-${item.id}`, kind: "participant_bundle", visibility: "participant", file: { original_filename: "data.zip" } }, { id: `sample-${item.id}`, kind: "sample_submission", visibility: "public", file: { original_filename: "sample_submission.csv" } }]);
    if (tail.includes("download-url")) return reply({ url: "data:text/csv;charset=utf-8,id,prediction%0A1,0.82%0A2,0.17" });
    if (tail === "leaderboard") return reply({ items: rating(new URLSearchParams()).items.map((entry) => ({ id: entry.user_id, user_id: entry.user_id, profile: entry.profile, rank: entry.rank, score: 0.91 - entry.rank * 0.025 })) });
    if (tail === "submissions/me") return rows(state.submissions.filter((entry) => entry.competition_id === item.id), params);
    if (tail === "submissions" && method === "POST") { const submission = { id: id("submission"), competition_id: item.id, status: "scored", public_score: 0.87, score: 0.87, created_at: now }; state.submissions.unshift(submission); save(); return reply(submission); }
    if (tail === "discussion") return reply({ items: [] });
    if (tail === "result-card") return reply({ status: "published", rank: 14, score: 0.91, percentile: 86 });
    if (tail === "applications" || tail === "submit-for-review" || tail === "community" || tail.startsWith("community/")) { if (method === "POST" && tail === "submit-for-review") item.status = "submitted_for_review"; if (method === "PATCH") Object.assign(item, body); save(); return reply(item); }
    if (tail.startsWith("manage/")) return method === "GET" ? rows([], params) : reply({ id: id("invite"), status: "pending" });
  }
  if (path.startsWith("/api/v1/submissions/")) return reply(state.submissions.find((entry) => entry.id === path.split("/")[4]) || { id: path.split("/")[4], status: "scored", public_score: 0.87 });

  if (path === "/api/v1/duels") return rows(state.duels, params);
  if (path === "/api/v1/duel-challenges") { if (method === "POST") { const challenge = { id: id("challenge"), status: "pending", opponent_user_id: body.opponent_user_id, task_type: body.task_type, created_at: now }; state.challenges.unshift(challenge); save(); return reply(challenge); } return rows(state.challenges, params); }
  if (path.startsWith("/api/v1/duel-challenges/")) { const challenge = state.challenges.find((entry) => entry.id === path.split("/")[4]); if (!challenge) return notFound(); const action = path.split("/")[5]; challenge.status = action === "accept" ? "accepted" : action === "withdraw" ? "withdrawn" : "declined"; if (action === "accept") { const duel = { id: id("duel"), status: "lobby", task_type: challenge.task_type, player1: { user_id: demoUserId, user_name: profile().user_name, rating: 1082 }, player2: { user_id: challenge.opponent_user_id, user_name: "alex_flexer", rating: 1061 }, created_at: now }; state.duels.unshift(duel); challenge.duel_id = duel.id; } save(); return reply(challenge); }
  if (path.startsWith("/api/v1/duels/")) { const parts = path.split("/"); const duel = state.duels.find((entry) => entry.id === parts[4]); if (!duel) return notFound(); const action = parts[5]; if (action === "ready") duel.status = "live"; if (action === "submissions") { duel.status = "completed"; duel.winner_id = demoUserId; } if (action === "leave") duel.status = "cancelled"; if (method === "POST") save(); return reply(duel); }
  if (path === "/api/v1/duel-matchmaking/search") { const ticket = { id: id("ticket"), status: "searching", task_type: body.task_type, seconds_until_fallback: 0 }; state.tickets[ticket.id] = ticket; save(); return reply(ticket); }
  if (path.startsWith("/api/v1/duel-matchmaking/")) { const parts = path.split("/"); const ticket = state.tickets[parts[4]]; if (!ticket) return notFound(); if (method === "DELETE") ticket.status = "cancelled"; else if (parts[5] === "continue") ticket.status = "searching"; else if (parts[5] === "arena-challenge") { const challenge = { id: id("arena"), status: "active", difficulty: body.difficulty, task_type: ticket.task_type, started_at: now }; state.arenaChallenges[challenge.id] = challenge; ticket.status = "challenge_started"; ticket.challenge_instance_id = challenge.id; save(); return reply(challenge); } else if (method === "GET") ticket.status = "fallback_available"; save(); return reply(ticket); }
  if (path.startsWith("/api/v1/arena-challenges/")) { const parts = path.split("/"); const challenge = state.arenaChallenges[parts[4]]; if (!challenge) return notFound(); if (parts[5] === "submissions") challenge.status = "scored"; if (parts[5] === "finish") challenge.status = "completed"; save(); return reply(challenge); }

  if (path === "/api/v1/organizations/me") return reply(state.organizations[0]);
  if (/^\/api\/v1\/organizations\/[^/]+\/metrics\/[^/]+\/versions\/[^/]+\/submit-for-moderation$/.test(path) && method === "POST") {
    const parts = path.split("/");
    const metric = state.metrics.find((item) => item.owner_organization_id === parts[4] && item.id === parts[6]);
    if (!metric?.current_version || metric.current_version.id !== parts[8]) return notFound();
    metric.current_version.moderation_status = "pending_review";
    save();
    return reply(metric.current_version);
  }
  if (path.startsWith("/api/v1/organizations/")) { const parts = path.split("/"); const org = state.organizations.find((item) => item.id === parts[4]); if (!org) return notFound(); if (parts.length === 5) { if (method === "PATCH") { Object.assign(org, body); save(); } return reply(org); } if (parts[5] === "competitions") { if (method === "GET") return rows(state.competitions.filter((item) => item.organization_id === org.id), params); if (method === "POST") { const item = { id: id("competition"), organization_id: org.id, origin: "official", status: "draft", ...body }; state.competitions.unshift(item); save(); return reply(item); } } if (parts[5] === "metrics") { if (parts.length === 6) { if (method === "GET") return reply(state.metrics.filter((item) => item.owner_organization_id === org.id)); const metric = { id: id("metric"), owner_organization_id: org.id, status: "draft", ...body }; metric.current_version = { id: id("version"), version: 1, moderation_status: "draft", ...body }; state.metrics.push(metric); save(); return reply(metric); } const metric = state.metrics.find((item) => item.id === parts[6]); if (parts[7] === "versions") { if (method === "GET") return reply(metric?.current_version ? [metric.current_version] : []); const version = { id: id("version"), version: (metric?.current_version?.version || 0) + 1, moderation_status: "draft", ...body }; if (metric) metric.current_version = version; save(); return reply(version); } if (parts[7] === "versions" && parts[9] === "submit-for-moderation") { if (metric?.current_version) metric.current_version.moderation_status = "pending_review"; save(); return reply(metric?.current_version || {}); } } if (method === "POST") return reply({ id: id("action"), status: "pending_review" }); }
  if (path === "/api/v1/cooperation/leads" || path === "/api/v1/moderation/reports") return reply({ id: id("request"), status: "received", ...body });
  if (path === "/api/v1/files/upload-intents") { const uploadId = id("upload"); return reply({ id: uploadId, upload_url: `${location.origin}/__mock-upload/${uploadId}`, method: "PUT", required_headers: {} }); }
  if (path.startsWith("/api/v1/files/uploads/")) return reply({ id: path.split("/")[5], status: "completed" });
  console.warn(`[demo API] Unhandled ${method} ${path}`);
  return reply({ code: "DEMO_UNHANDLED", message: "Это действие пока не смоделировано в локальном демо" }, 501);
}

export function installMockApi() {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = new URL(input instanceof Request ? input.url : input, location.href);
    if (url.pathname.startsWith("/__mock-upload/")) return new Response(null, { status: 200 });
    if (url.pathname === "/api/v1/blog/rss.xml") return new Response("<?xml version=\"1.0\"?><rss version=\"2.0\"><channel><title>ML-Арена</title></channel></rss>", { status: 200, headers: { "Content-Type": "application/xml" } });
    if (url.pathname.startsWith("/api/v1/") || url.pathname === "/health") {
      const method = (init.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
      let body = {};
      if (typeof init.body === "string") { try { body = JSON.parse(init.body); } catch { /* A few uploads use binary bodies. */ } }
      return request(url.pathname, method, body, url.searchParams);
    }
    return originalFetch(input, init);
  };
}
