import { strToU8, zipSync } from "fflate";

const HOUR = 3600000;
const DAY = 24 * HOUR;
const OWNER = "demo-alex";
const LABEL = "Демонстрационные данные";
const NAMES = ["demo.anna", "demo.maria", "demo.alex", "demo.ivan", "demo.elena", "demo.nikita"];

export function createScreenshotDemo(now = Date.now()) {
  const date = (days = 0, hours = 0) => new Date(now + days * DAY + hours * HOUR).toISOString();
  const dataset = Buffer.from(zipSync({
    "README.txt": strToU8("DEMONSTRATION DATA ONLY. Synthetic records for local screenshots, not real customers or pilot results.\nColumns: row_id, window_id, vibration, temperature. Rank by prediction within window_id.\n"),
    "train.csv": strToU8("row_id,window_id,vibration,temperature,target\n1,1,0.8,72,3\n2,1,0.2,48,0\n3,1,0.6,65,2\n4,2,0.9,76,3\n5,2,0.3,52,1\n6,2,0.1,42,0\n"),
    "test.csv": strToU8("row_id,window_id,vibration,temperature\n1001,3,0.8,71\n1002,3,0.3,53\n1003,3,0.7,68\n"),
    "sample_submission.csv": strToU8("row_id,prediction\n1001,0.5\n1002,0.5\n1003,0.5\n"),
  }));
  const user = { id: OWNER, role: "user", status: "active", email_verified: true, email: "demo.alex@example.test" };
  const season = { id: "demo-season", slug: "demo-autumn-2026", name: "Осень 2026 · демо-сезон", status: "active", start_at: "2026-10-01T00:00:00Z", end_at: "2026-12-01T00:00:00Z", description: `${LABEL}. Учебная витрина общего рейтинга платформы. Все участники и числовые показатели вымышлены.` };
  const description = `## Техносмена: приоритет обслуживания

${LABEL}. Учебная задача на ранжирование, не действующее соревнование.

В начале смены бригада получает телеметрию оборудования. До запуска линии она успеет проверить только пять станков. Постройте список приоритетов: какие машины нужно обслужить в первую очередь, чтобы сократить риск остановки производства.

### Что нужно предсказать

Для каждой пары «окно обслуживания — станок» оцените приоритет проверки. Чем выше значение prediction, тем раньше бригада проверит станок. Порядок внутри каждого окна оценивается отдельно.

### Данные и первый запуск

В train.csv есть температура, вибрация, нагрузка и история отказов. В test.csv целевая переменная скрыта. Разделяйте валидацию по времени, чтобы не использовать будущие показания. Стартовое решение — градиентный бустинг по агрегатам телеметрии.

### Формат ответа

CSV в UTF-8, две колонки: row_id и prediction. Каждая строка test.csv должна встретиться ровно один раз. Предсказания — конечные числа, без пропусков.

\`\`\`csv
row_id,prediction
1001,0.842
1002,0.315
1003,0.709
\`\`\`

### Как определяется итог

Во время соревнования доступна открытая оценка на 30% тестовой выборки. После финальной проверки итоговый порядок определяется на оставшихся 70%. Код решения загружается отдельно от CSV с ответами.

# Метрика и оценка решения

**NDCG@5** сравнивает первые пять станков в вашем списке с оптимальным порядком обслуживания. Метрика считается для каждого окна, затем усредняется. Значения от 0 до 1: чем выше, тем лучше. Открытая и закрытая части не пересекаются.`;
  const base = {
    origin: "official_platform", title: "Техносмена", short_description: "Расположите станки по приоритету обслуживания: бригада успеет проверить только пять машин.", description,
    task_type: "ranking", metric: "demo_ndcg_at_5", metric_name: "NDCG@5", metric_direction: "maximize", difficulty: "medium", domain: "Промышленность",
    rated: true, access: "open", company_name: "ML-Арена · демо", organization_name: "ML-Арена · демо", participants_count: 6, daily_submission_limit: 20,
    prize_type: "none", prize_amount: 0, prize_currency: "RUB", prediction_column: "prediction", group_column: "window_id", baseline_score: 0.7012,
    source_code_required: true, public_split_percent: 30, rules: `${LABEL}. Одинаковые данные и лимиты для всех тестовых участников. Разрешены публичные библиотеки. Перед итоговой проверкой необходимо прикрепить воспроизводимый код.`,
    external_data_policy: "Только предоставленные данные и открытые справочники оборудования.", ai_tools_policy: "Разрешены с раскрытием использования в описании решения.",
    created_at: date(-16), starts_at: date(-5), submission_deadline: date(6), deadline: date(6), source_code_deadline: date(7), final_results_at: null,
    user_state: "has_valid_submit", user_best_public_score: 0.8734,
  };
  const competitions = [
    { ...base, id: "demo-techsmena", slug: "demo-techsmena", status: "active" },
    { ...base, id: "demo-maintenance-final", title: "Предиктивное обслуживание", short_description: "Финальный учебный результат с проверенным кодом.", status: "completed", starts_at: date(-25), deadline: date(-16), submission_deadline: date(-16), final_results_at: date(-14), user_state: "finished_with_result", user_best_public_score: 0.8612 },
    { ...base, id: "demo-logistics-final", title: "Маршруты без задержек", short_description: "Учебный результат; проверка кода не проводилась.", status: "completed", starts_at: date(-35), deadline: date(-26), submission_deadline: date(-26), final_results_at: date(-24), user_state: "finished_with_result", user_best_public_score: 0.8241 },
    { ...base, id: "demo-community", title: "Ранжирование поисковой выдачи", short_description: "Практика сообщества, отдельно от официальных подтверждений.", origin: "community", rated: false, status: "completed", deadline: date(-9), submission_deadline: date(-9), final_results_at: date(-8), user_state: "finished_with_result", user_best_public_score: 0.8023 },
  ];
  const results = Object.fromEntries(competitions.map((competition, index) => [competition.id, {
    competition_id: competition.id, competition_title: competition.title, user_id: OWNER, user_name: "demo.alex", rank: 3,
    participants_count: 6, score: [0.8734, 0.8846, 0.8362, 0.8023][index], leaderboard_kind: index === 0 || index === 3 ? "public" : "private", origin: competition.origin,
    evidence_level: index === 3 ? "community_activity" : "arena_verified", code_reviewed: index === 1, reproduced: index === 1, expert_defended: index === 1,
    confirmed_at: index === 1 ? date(-14) : null, verification_status: index === 1 ? "verified" : index === 2 ? "pending_review" : null,
    verified_technologies: index === 1 ? ["Python", "CatBoost", "pandas", "scikit-learn"] : [],
  }]));
  const profile = {
    user_id: OWNER, id: "demo-profile", user_name: "demo.alex", first_name: "Александр", last_name: "Морозов", email: user.email,
    bio: "Тестовый профиль · демонстрационные данные. Прикладной ML: ранжирование, временные ряды и воспроизводимые решения.", avatar_url: null,
    city: "Москва", university: "Демонстрационный технический университет", company: "Учебная ML-команда", created_at: date(-80), public_profile: true,
    show_real_name: true, show_career_details: true, visible_to_employers: true, github_url: null, kaggle_url: null,
    skills: { ranking: 74, regression: 61, time_series: 58, classification: 0, nlp: 0, cv: 0 },
    stats: { competitions_participated: 4, duels_won: 4, duels_lost: 2, duels_played: 6 },
    achievements: [
      { id: "demo-achievement-verified", achievement_type: "hackathon", title: "Учебный ML-хакатон · демо", result: "Финалист учебного трека", description: "Демонстрационный пример внешнего подтверждения, не реальное достижение.", verification_status: "verified", achieved_at: date(-32).slice(0, 10), is_public: true },
      { id: "demo-achievement-pending", achievement_type: "pet_project", title: "Планировщик обслуживания · демо", result: "Самостоятельный учебный проект", description: "Самозаявленные сведения. Подтверждение ожидает проверки; не учитывается как проверенный результат.", verification_status: "pending_review", achieved_at: date(-6).slice(0, 10), is_public: true },
    ],
  };
  const ratingRows = NAMES.map((user_name, index) => ({
    user_id: index === 2 ? OWNER : `demo-user-${index}`, user_name, rank: index + 1, score: [924, 891, 856, 818, 775, 731][index], overall_score: [924, 891, 856, 818, 775, 731][index],
    competition_score: [742, 710, 680, 645, 610, 570][index], competition_rank: index + 1, competition_events_count: 2,
    duel_rating: [1420, 1382, 1348, 1310, 1284, 1242][index], duel_rank: index + 1, human_duels_count: 6, wins: index === 2 ? 4 : 5 - Math.floor(index / 2), losses: index === 2 ? 2 : 1 + Math.floor(index / 2),
    win_streak: index === 2 ? 2 : 1, best_percentile: [16.7, 16.7, 33.3, 50, 66.7, 83.3][index], verified_results_count: index === 2 ? 1 : 2,
    directions: index % 2 === 0 ? ["ranking", "time_series"] : ["regression", "classification"], updated_at: date(-1), is_current_user: index === 2,
  }));
  const methodology = { method_version: "demo-v1", direction_min_users: 10, overall: { competition_weight: 0.7, duel_weight: 0.3 }, duel: { start: 1000, calibration_matches: 5, stake_percent: 0.02, stake_min: 15, stake_max: 50, delta_cap: 60 }, competition: { base_participation: 10, max_bonus: 100, difficulty: { beginner: 1, standard: 1.2, advanced: 1.5 }, reliability: { 0: 0.5, 10: 0.7, 30: 0.85, 50: 0.95, 100: 1 } }, challenge: { delta_cap: 10, season_cap: 40, direction_cap: 20, no_match_after_seconds: 60 } };
  const makeDuel = (index, status = "completed") => ({
    id: index === 0 ? "demo-duel" : `demo-duel-${index}`, status, mode: "rated", task_type: "ranking", metric: "ndcg", task_title: "Приоритет обращений в поддержку",
    task_description: `${LABEL}. Тестовые участники: demo.alex против demo.maria. Расположите обращения по срочности. Используйте тип инцидента, давность заявки и число затронутых пользователей. Оба участника решают одну задачу на одинаковых данных.`,
    rules: "Демонстрационный матч. Один CSV с колонками row_id и prediction. Оценка на общей скрытой выборке; больше — лучше.", duration_minutes: 60, dataset_bundle_url: "/__demo__/dataset.zip",
    started_at: status === "completed" ? date(-index * 3, -1) : new Date(now - 13 * 60000).toISOString(), ends_at: status === "completed" ? date(-index * 3) : new Date(now + 47 * 60000).toISOString(),
    completed_at: status === "completed" ? date(-index * 3) : null, winner_id: status === "completed" ? index % 3 ? OWNER : "demo-user-1" : null,
    is_draw: false, rating_change: { [OWNER]: index % 3 ? 24 : -18 },
    player1: { user_id: OWNER, user_name: "demo.alex", rating: 1348, ready: true, score: status === "completed" ? index % 3 ? 0.8462 : 0.7981 : null, submitted_at: status === "completed" ? date(-index * 3, -0.5) : null, avatar_url: null },
    player2: { user_id: "demo-user-1", user_name: "demo.maria", rating: 1382, ready: true, score: status === "completed" ? index % 3 ? 0.8214 : 0.8469 : null, submitted_at: status === "completed" ? date(-index * 3, -0.3) : null, avatar_url: null },
  });
  const duelHistory = Array.from({ length: 6 }, (_, i) => makeDuel(i + 1));
  let duelState = "live";
  const submissions = (competition) => [0.7012, 0.7938, competition.user_best_public_score].map((public_score, index) => ({
    id: `${competition.id}-submission-${index + 1}`, competition_id: competition.id, user_id: OWNER, user_name: "demo.alex", original_filename: ["baseline_answers.csv", "features_v2_answers.csv", "final_answers.csv"][index],
    status: "scored", attempt_number: index + 1, public_score, private_score: competition.status === "completed" && competition.origin !== "community" ? index === 2 ? results[competition.id].score : public_score - 0.01 : null,
    private_score_revealed: competition.status === "completed" && competition.origin !== "community", created_at: new Date(Date.parse(competition.starts_at) + (index + 1) * 4 * HOUR).toISOString(),
    file_url: "/__demo__/answers.csv",
  }));
  const page = (items, search) => items.slice(Number(search.get("offset") || 0), Number(search.get("offset") || 0) + Number(search.get("limit") || 100));
  const ok = (data, total) => ({ status: 200, body: { data, meta: { request_id: "screenshot-demo", ...(total == null ? {} : { total }) } } });
  const error = (status, message) => ({ status, body: { error: { code: "SCREENSHOT_DEMO", message } } });
  return {
    ownerId: OWNER,
    respond(method, input, host = "127.0.0.1") {
      if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(`http://${host}`).hostname)) return error(403, "Демо доступно только на локальном адресе");
      const { pathname: path, searchParams: search } = new URL(input, "http://127.0.0.1");
      if (path === "/api/v1/auth/refresh" || path === "/api/v1/auth/login") return ok({ access_token: "local-screenshot-demo-only", user });
      if (path === "/api/v1/auth/me") return ok(user);
      if (path.includes("/auth/logout")) return ok({});
      if (path === "/api/v1/config/public") return ok({ features: { competitions: true, duels: true, rating: true, ml_passport: true } });
      if (path === "/__demo__/dataset.zip") return { status: 200, raw: dataset, contentType: "application/zip" };
      if (path === "/__demo__/answers.csv") return { status: 200, raw: "row_id,prediction\n1001,0.842\n1002,0.315\n1003,0.709\n", contentType: "text/csv; charset=utf-8" };
      if (path === "/__demo__/solution.py") return { status: 200, raw: "# Demonstration code, not a real participant solution.\nimport pandas as pd\n\ndef predict(frame):\n    return frame['vibration'].fillna(0)\n", contentType: "text/x-python; charset=utf-8" };
      if (/\/duels\/demo-duel\/ready$/.test(path) && method === "POST") { duelState = "live"; return ok(makeDuel(0, duelState)); }
      if (method === "POST" && /^\/api\/v1\/competitions\/demo-[^/]+\/files\/(demo-bundle|demo-baseline)\/download-url$/.test(path)) return ok({ url: path.includes("demo-bundle") ? "/__demo__/dataset.zip" : "/__demo__/solution.py" });
      if (method !== "GET") return error(409, "Режим скриншотов: изменения и реальные загрузки отключены");
      if (path === "/api/v1/profiles/me" || path === `/api/v1/profiles/${OWNER}`) return ok(profile);
      if (path === "/api/v1/profiles/me/achievements" || path === `/api/v1/profiles/${OWNER}/achievements`) return ok(profile.achievements);
      if (path.endsWith("/badges")) return ok([{ id: "demo-badge", awarded_at: date(-14), status: "active", badge: { name: "Воспроизводимое решение · демо", description: "Демонстрационный статус: код и воспроизводимость проверены.", icon_key: "badge_check", color_token: "blue-500" } }]);
      if (path === "/api/v1/profiles/search") return ok(ratingRows, ratingRows.length);
      if (path.startsWith("/api/v1/profiles/")) return ok({ ...profile, user_id: path.split("/").at(-1), user_name: "demo.maria", first_name: "Мария", last_name: "Иванова", email: "demo.maria@example.test" });
      if (path === "/api/v1/metrics") return ok([{ id: "demo-metric", code: "demo_ndcg_at_5", name: "NDCG@5", direction: "maximize", description: "Усреднённое качество первых пяти позиций в каждом окне обслуживания." }]);
      if (path === "/api/v1/rating/seasons") return ok([season]);
      if (path === "/api/v1/rating/methodology") return ok(methodology);
      if (path === "/api/v1/rating" || path === "/api/v1/leaderboard") {
        const tab = search.get("tab") || "overall";
        const rows = ratingRows.map((row) => ({ ...row, score: tab === "duels" ? row.duel_rating : tab === "competitions" ? row.competition_score : row.overall_score }));
        const mine = { ...rows[2], history: [620, 688, 735, 802, 856].map((value, index) => ({ score: value, rating: value, created_at: date(-28 + index * 6), date: date(-28 + index * 6) })) };
        return ok({ season, items: rows, current_user: mine, total: rows.length });
      }
      if (path === "/api/v1/competitions" || path === "/api/v1/public/competitions-preview") {
        const rows = competitions.filter((item) => !search.get("origin") || (search.get("origin") === "community" ? item.origin === "community" : item.origin !== "community"));
        return ok(page(rows, search), rows.length);
      }
      const match = path.match(/^\/api\/v1\/competitions\/([^/]+)(.*)$/);
      if (match) {
        const competition = competitions.find((item) => item.id === match[1]);
        if (!competition) return error(404, "Демонстрационное соревнование не найдено");
        const tail = match[2];
        if (!tail) return ok(competition);
        if (tail === "/result-card") return ok(results[competition.id]);
        if (tail === "/rules") return ok({ version: "demo-v1", markdown: competition.rules, daily_submission_limit: 20, submission_deadline: competition.deadline });
        if (tail === "/participation/me") return ok({ competition_id: competition.id, user_id: OWNER, state: "active", best_public_score: competition.user_best_public_score, public_rank: 3, attempts_used_today: 3, attempts_left_today: 17, attempts_left_to_submit: 17 });
        if (tail === "/submissions/me") { const rows = submissions(competition); return ok(page(rows, search), rows.length); }
        if (tail === "/discussion") return ok({ available: false, message: "Обсуждение недоступно в режиме демонстрации" });
        if (tail === "/files") return ok({ version: "demo-v1", files: [{ id: "demo-bundle", kind: "participant_bundle", file: { original_filename: "demo_dataset.zip", size_bytes: dataset.length } }, { id: "demo-baseline", kind: "baseline", file: { original_filename: "baseline_demo.py", size_bytes: 1480 } }] });
        if (tail === "/leaderboard") {
          const kind = search.get("kind") || "public";
          if (kind === "private" && competition.status !== "completed") return ok({ kind: "private", private_locked: true, items: [], current_user: null });
          const rows = NAMES.map((user_name, index) => ({ user_id: ratingRows[index].user_id, user_name, rank: index + 1, best_score: [0.9126, 0.8918, kind === "private" ? results[competition.id].score : competition.user_best_public_score, 0.8012, 0.7941, 0.7653][index], attempts: [5, 4, 3, 6, 2, 4][index], submitted_at: date(-1, -index), user_avatar: null })).filter((row) => !search.get("q") || row.user_name.includes(search.get("q")));
          return ok({ kind, private_locked: false, items: page(rows, search), current_user: rows.find((row) => row.user_id === OWNER), total: rows.length });
        }
      }
      if (path === "/api/v1/duels") {
        const rows = search.get("status") === "completed" ? duelHistory : [makeDuel(0, duelState), ...duelHistory].filter((item) => !search.get("status") || item.status === search.get("status"));
        return ok(page(rows, search), rows.length);
      }
      if (path === "/api/v1/duel-challenges") return ok([], 0);
      if (path.startsWith("/api/v1/duels/")) {
        const id = path.split("/")[4];
        const duel = id === "demo-duel" ? makeDuel(0, duelState) : duelHistory.find((item) => item.id === id);
        return duel ? ok(duel) : error(404, "Дуэль не найдена");
      }
      if (/\/source-code$/.test(path)) {
        const id = path.split("/")[4];
        if (!id.startsWith("demo-maintenance-final-")) return error(404, "Итоговый код пока не прикреплён");
        return ok({ submission_id: id, version: 1, file: { id: "demo-source", original_filename: "maintenance_solution.py", size_bytes: 1480, content_type: "text/x-python" }, uploaded_at: date(-15), replacement_allowed: false, download_url: "/__demo__/solution.py", expires_in: 300 });
      }
      if (path === "/api/v1/public/platform-stats") return ok({ users_count: 6, competitions_count: 4, submissions_count: 12, duels_count: 6 });
      if (path === "/api/v1/public/leaderboard-preview") return ok(ratingRows.slice(0, 3));
      return error(404, "Этот экран не входит в демонстрационный набор");
    },
  };
}

export function screenshotDemoPlugin() {
  const demo = createScreenshotDemo();
  return {
    name: "local-screenshot-demo",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = new URL(req.url || "/", "http://127.0.0.1").pathname;
        if (path === "/") { res.writeHead(302, { Location: "/competitions/demo-techsmena" }); res.end(); return; }
        if (!path.startsWith("/api/") && !path.startsWith("/__demo__/")) return next();
        const response = demo.respond(req.method, req.url, req.headers.host);
        res.statusCode = response.status;
        res.setHeader("Content-Type", response.contentType || "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-ML-Arena-Data", "demonstration-only");
        res.end(response.raw ?? JSON.stringify(response.body));
      });
    },
  };
}
