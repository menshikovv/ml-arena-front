import { ApiError } from "@/api/client";
import { api, uploadFile, waitForSubmission } from "@/api/mlArenaApi";

const pendingFiles = new Map();
const profileIds = new Map();

export function normalizeProfile(profile = {}) {
  const result = {
    ...profile,
    id: profile.user_id || profile.id,
    nickname: profile.user_name,
    education_status: profile.university,
    organization: profile.company,
    registered_at: profile.created_at,
    skill_nlp: profile.skills?.nlp || 0,
    skill_cv: profile.skills?.cv || 0,
    skill_tabular: profile.skills?.tabular || 0,
    skill_regression: profile.skills?.regression || 0,
    skill_classification: profile.skills?.classification || 0,
    skill_time_series: profile.skills?.time_series || 0,
    duels_won: profile.stats?.duels_won || 0,
    duels_lost: profile.stats?.duels_lost || 0,
    competitions_won: profile.stats?.competitions_won || 0,
    competitions_participated: profile.stats?.competitions_participated || 0,
  };
  if (profile.user_name && profile.user_id) profileIds.set(profile.user_name, profile.user_id);
  return result;
}

function normalizeCompetition(competition = {}) {
  return { ...competition, prize_fund: Number(competition.prize_fund || (competition.prize_amount || 0) / 100), created_date: competition.created_date || competition.created_at };
}

function normalizeDuel(duel = {}, currentUserId = null) {
  const currentIsPlayer2 = currentUserId && duel.player2?.user_id === currentUserId;
  const player1 = currentIsPlayer2 ? duel.player2 || {} : duel.player1 || {};
  const player2 = currentIsPlayer2 ? duel.player1 || {} : duel.player2 || {};
  const winner = duel.winner_id === player1.user_id ? player1 : duel.winner_id === player2.user_id ? player2 : null;
  return {
    ...duel,
    status: duel.status === "live" ? "active" : duel.status === "challenge_pending" ? "pending" : duel.status,
    player1_name: player1.user_name,
    player1_rating: player1.rating,
    player1_avatar: player1.avatar_url,
    player1_score: player1.score,
    player1_file_url: player1.file_url,
    player1_submitted_at: player1.submitted_at,
    player2_name: player2.user_name,
    player2_rating: player2.rating,
    player2_avatar: player2.avatar_url,
    player2_score: player2.score,
    player2_file_url: player2.file_url,
    player2_submitted_at: player2.submitted_at,
    winner_name: winner?.user_name || null,
    rating_change: duel.rating_change ? Math.max(...Object.values(duel.rating_change).map((value) => Math.abs(value))) : 0,
    created_date: duel.created_at,
  };
}

function listData(response, normalizer = (value) => value) {
  return (response?.data || []).map(normalizer);
}

function competitionPayload(data) {
  return {
    title: data.title,
    short_description: data.short_description || data.description?.slice(0, 500) || null,
    description: data.description || data.desc || data.title,
    task_type: data.task_type || "classification",
    metric_code: data.metric || data.metric_code || "accuracy",
    domain: data.domain || null,
    difficulty: data.difficulty || null,
    access: data.access || "open",
    submission_deadline: data.deadline || data.submission_deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
    daily_submission_limit: data.daily_submission_limit || data.max_submits_free || 5,
    public_split_percent: data.public_split_percent || 30,
    prize_amount: data.prize_amount ?? Math.round(Number(data.prize_fund || 0) * 100),
    prize_currency: data.prize_currency || "RUB",
    rules: data.rules || null,
    rules_version: data.rules_version || "v1",
    banner_color: data.banner_color || "#2563EB",
  };
}

async function deferredFile(handle) {
  const file = pendingFiles.get(handle);
  if (!file) throw new ApiError(422, { code: "UPLOAD_REQUIRED", message: "Выберите файл заново" });
  pendingFiles.delete(handle);
  return file;
}

export const base44 = {
  entities: {
    MLProfile: {
      async get(id) {
        return normalizeProfile(id === "me" ? await api.profiles.me() : await api.profiles.get(id));
      },
      async list(sort = "-rating", limit = 50) {
        const response = await api.profiles.search({ sort, limit });
        return listData(response, normalizeProfile);
      },
      async filter(filters = {}, sort = "-rating", limit = 50) {
        const response = await api.profiles.search({ city: filters.city, min_rating: filters.min_rating, max_rating: filters.max_rating, sort, limit });
        return listData(response, normalizeProfile);
      },
    },
    Badge: {
      async filter(filters = {}) {
        const userId = filters.user_id || profileIds.get(filters.user_name);
        if (!userId) return [];
        return api.profiles.badges(userId);
      },
    },
    Competition: {
      async get(id) { return normalizeCompetition(await api.competitions.get(id)); },
      async list(sort = "-created_at", limit = 50) {
        const response = await api.competitions.list({ sort: sort.replace("created_date", "created_at"), limit });
        return listData(response, normalizeCompetition);
      },
      async filter(filters = {}, sort = "-created_at", limit = 50) {
        const me = await api.auth.me();
        if (me.role === "organization" && me.organization_id) {
          const response = await api.organizations.competitions(me.organization_id, { limit });
          return listData(response, normalizeCompetition);
        }
        const response = await api.competitions.list({ status: filters.status, task_type: filters.task_type, q: filters.q, sort: sort.replace("created_date", "created_at"), limit });
        return listData(response, normalizeCompetition);
      },
      async create(data) {
        const me = await api.auth.me();
        const body = competitionPayload(data);
        const created = me.role === "organization" && me.organization_id
          ? await api.organizations.createCompetition(me.organization_id, body)
          : await api.admin.createCompetition({ ...body, organization_id: data.organization_id || null });
        return normalizeCompetition(created);
      },
      async delete(id) {
        const me = await api.auth.me();
        if (me.role === "organization" && me.organization_id) return api.organizations.archiveCompetition(me.organization_id, id);
        return api.admin.archiveCompetition(id);
      },
    },
    Submission: {
      async filter(filters = {}, sort = "-score", limit = 100) {
        const competitionId = filters.competition_id;
        const board = await api.competitions.leaderboard(competitionId, { limit });
        const leaderboard = board.items.map((item) => ({
          id: `${competitionId}-${item.user_id}`,
          competition_id: competitionId,
          user_id: item.user_id,
          user_name: item.user_name,
          user_avatar: item.user_avatar,
          score: Number(item.best_score),
          public_score: item.best_score,
          status: "scored",
          attempt_number: item.attempts,
          created_date: item.submitted_at,
        }));
        try {
          const mine = await api.competitions.submissions(competitionId, { limit });
          return [...listData(mine, (item) => ({ ...item, user_name: "Ты", score: Number(item.public_score ?? item.score), created_date: item.created_date || item.created_at })), ...leaderboard];
        } catch (error) {
          if (error.status === 401 || error.status === 403 || error.status === 404) return leaderboard;
          throw error;
        }
      },
      async create(data) {
        const file = await deferredFile(data.file_url);
        const upload = await uploadFile(file, "competition_submission", { competition_id: data.competition_id });
        const competition = await api.competitions.get(data.competition_id);
        const created = await api.competitions.submit(data.competition_id, upload.id, competition.current_dataset_version_id);
        return waitForSubmission(created.id);
      },
    },
    Discussion: {
      async filter() { return []; },
      async create() { throw new ApiError(501, { code: "FEATURE_UNAVAILABLE", message: "Обсуждения пока не поддерживаются бэкендом" }); },
    },
    Duel: {
      async get(id) {
        const [duel, me] = await Promise.all([api.duels.get(id), api.auth.me()]);
        return normalizeDuel(duel, me.id);
      },
      async list(sort = "-created_at", limit = 50) {
        const [response, me] = await Promise.all([api.duels.list({ sort: sort.replace("created_date", "created_at"), limit }), api.auth.me()]);
        return listData(response, (duel) => normalizeDuel(duel, me.id));
      },
      async create(data) {
        const opponentUserId = data.opponent_user_id || data.player2_user_id;
        if (!opponentUserId) throw new ApiError(422, { code: "OPPONENT_REQUIRED", message: "Для вызова нужен пользователь из списка платформы" });
        const [duel, me] = await Promise.all([
          api.duels.createChallenge({ opponent_user_id: opponentUserId, task_type: data.task_type, mode: data.mode || "rated" }),
          api.auth.me(),
        ]);
        return normalizeDuel(duel, me.id);
      },
      async update(id, data) {
        const me = await api.auth.me();
        if (data.status === "active") return normalizeDuel(await api.duels.ready(id, true), me.id);
        const handle = data.player1_file_url || data.player2_file_url;
        if (handle?.startsWith("pending-upload:")) {
          const file = await deferredFile(handle);
          const upload = await uploadFile(file, "duel_submission", { duel_id: id });
          return normalizeDuel(await api.duels.submit(id, upload.id), me.id);
        }
        return normalizeDuel(await api.duels.get(id), me.id);
      },
    },
    JobInvite: {
      async create() { throw new ApiError(501, { code: "FEATURE_UNAVAILABLE", message: "Приглашения работодателей ещё не реализованы в API" }); },
    },
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const uploadId = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        const handle = `pending-upload:${uploadId}`;
        pendingFiles.set(handle, file);
        return { file_url: handle };
      },
      async SendEmail() { throw new ApiError(501, { code: "FEATURE_UNAVAILABLE", message: "Отправка писем из кабинета отсутствует в API" }); },
    },
  },
  auth: { me: api.auth.me },
};
