import { ApiError, apiData, apiRequest, clearAccessToken, queryString, restoreSession, setAccessToken } from "@/api/client";

const json = (body) => JSON.stringify(body);

export const api = {
  auth: {
    register: (body) => apiData("/api/v1/auth/register", { method: "POST", body: json(body) }, { auth: false }),
    requestVerification: (email) => apiData("/api/v1/auth/email/verify/request", { method: "POST", body: json({ email }) }, { auth: false }),
    confirmVerification: (email, code) => apiData("/api/v1/auth/email/verify/confirm", { method: "POST", body: json({ email, code }) }, { auth: false }),
    login: async (email, password) => {
      const data = await apiData("/api/v1/auth/login", { method: "POST", body: json({ email, password }) }, { auth: false });
      setAccessToken(data.access_token || data.token);
      return data;
    },
    restore: restoreSession,
    me: () => apiData("/api/v1/auth/me"),
    logout: async (all = false) => {
      try {
        return await apiData(`/api/v1/auth/logout${all ? "-all" : ""}`, { method: "POST" });
      } finally {
        clearAccessToken();
      }
    },
    forgotPassword: (email) => apiData("/api/v1/auth/password/forgot", { method: "POST", body: json({ email }) }, { auth: false }),
    resetPassword: (token, newPassword) => apiData("/api/v1/auth/password/reset", { method: "POST", body: json({ token, new_password: newPassword }) }, { auth: false }),
  },
  profiles: {
    me: () => apiData("/api/v1/profiles/me"),
    updateMe: (body) => apiData("/api/v1/profiles/me", { method: "PATCH", body: json(body) }),
    search: (params) => apiRequest(`/api/v1/profiles/search${queryString(params)}`, {}, { auth: false }),
    get: (userId) => apiData(`/api/v1/profiles/${userId}`),
    setAvatar: (uploadId) => apiData("/api/v1/profiles/me/avatar", { method: "POST", body: json({ upload_id: uploadId }) }),
    deleteAvatar: () => apiData("/api/v1/profiles/me/avatar", { method: "DELETE" }),
    badges: (userId) => apiData(`/api/v1/profiles/${userId}/badges`, {}, { auth: false }),
  },
  public: {
    stats: () => apiData("/api/v1/public/platform-stats", {}, { auth: false }),
    leaderboard: () => apiData("/api/v1/public/leaderboard-preview", {}, { auth: false }),
    competitions: () => apiRequest("/api/v1/public/competitions-preview", {}, { auth: false }),
  },
  competitions: {
    list: (params) => apiRequest(`/api/v1/competitions${queryString(params)}`),
    get: (id) => apiData(`/api/v1/competitions/${id}`),
    rules: (id) => apiData(`/api/v1/competitions/${id}/rules`, {}, { auth: false }),
    join: (id, version) => apiData(`/api/v1/competitions/${id}/join`, { method: "POST", body: json({ accepted_rules_version: version }) }),
    participation: (id) => apiData(`/api/v1/competitions/${id}/participation/me`),
    leave: (id) => apiData(`/api/v1/competitions/${id}/participation/me`, { method: "DELETE" }),
    files: (id) => apiData(`/api/v1/competitions/${id}/files`),
    fileUrl: (competitionId, fileId) => apiData(`/api/v1/competitions/${competitionId}/files/${fileId}/download-url`, { method: "POST" }),
    leaderboard: (id, params) => apiData(`/api/v1/competitions/${id}/leaderboard${queryString(params)}`, {}, { auth: false }),
    submissions: (id, params) => apiRequest(`/api/v1/competitions/${id}/submissions/me${queryString(params)}`),
    submit: (id, uploadId, datasetVersionId) => apiData(`/api/v1/competitions/${id}/submissions`, { method: "POST", body: json({ upload_id: uploadId, dataset_version_id: datasetVersionId }) }),
  },
  submissions: {
    get: (id) => apiData(`/api/v1/submissions/${id}`),
    cancel: (id) => apiData(`/api/v1/submissions/${id}/cancel`, { method: "POST" }),
  },
  leaderboard: {
    global: (params) => apiData(`/api/v1/leaderboard${queryString(params)}`, {}, { auth: false }),
  },
  billing: {
    plans: () => apiData("/api/v1/billing/plans", {}, { auth: false }),
  },
  organizations: {
    me: () => apiData("/api/v1/organizations/me"),
    get: (id) => apiData(`/api/v1/organizations/${id}`, {}, { auth: false }),
    update: (id, body) => apiData(`/api/v1/organizations/${id}`, { method: "PATCH", body: json(body) }),
    competitions: (id, params) => apiRequest(`/api/v1/organizations/${id}/competitions${queryString(params)}`),
    createCompetition: (id, body) => apiData(`/api/v1/organizations/${id}/competitions`, { method: "POST", body: json(body) }),
    updateCompetition: (organizationId, competitionId, body) => apiData(`/api/v1/organizations/${organizationId}/competitions/${competitionId}`, { method: "PATCH", body: json(body) }),
    submitCompetition: (organizationId, competitionId) => apiData(`/api/v1/organizations/${organizationId}/competitions/${competitionId}/submit-for-moderation`, { method: "POST" }),
    archiveCompetition: (organizationId, competitionId) => apiData(`/api/v1/organizations/${organizationId}/competitions/${competitionId}/archive`, { method: "POST" }),
  },
  duels: {
    challenges: (params) => apiRequest(`/api/v1/duel-challenges${queryString(params)}`),
    createChallenge: (body) => apiData("/api/v1/duel-challenges", { method: "POST", body: json(body) }),
    challengeAction: (id, action) => apiData(`/api/v1/duel-challenges/${id}/${action}`, { method: "POST" }),
    list: (params) => apiRequest(`/api/v1/duels${queryString(params)}`),
    get: (id) => apiData(`/api/v1/duels/${id}`),
    ready: (id, ready = true) => apiData(`/api/v1/duels/${id}/ready`, { method: "POST", body: json({ ready }) }),
    leave: (id) => apiData(`/api/v1/duels/${id}/leave`, { method: "POST" }),
    submit: (id, uploadId) => apiData(`/api/v1/duels/${id}/submissions`, { method: "POST", body: json({ upload_id: uploadId }) }),
    result: (id) => apiData(`/api/v1/duels/${id}/result`),
  },
  admin: {
    users: (params) => apiRequest(`/api/v1/admin/users${queryString(params)}`),
    competitions: (params) => apiRequest(`/api/v1/admin/competitions${queryString(params)}`),
    createCompetition: (body) => apiData("/api/v1/admin/competitions", { method: "POST", body: json(body) }),
    archiveCompetition: (id) => apiData(`/api/v1/admin/competitions/${id}/archive`, { method: "POST" }),
    subscriptions: (params) => apiRequest(`/api/v1/admin/subscriptions${queryString(params)}`),
  },
};

export async function sha256Hex(file) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

export async function uploadFile(file, purpose, context = {}) {
  const checksum = await sha256Hex(file);
  const extension = file.name.split(".").pop()?.toLowerCase();
  const contentType = file.type || {
    csv: "text/csv",
    json: "application/json",
    ipynb: "application/x-ipynb+json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    pdf: "application/pdf",
  }[extension] || "application/octet-stream";
  const intent = await apiData("/api/v1/files/upload-intents", {
    method: "POST",
    body: json({
      purpose,
      filename: file.name,
      content_type: contentType,
      size_bytes: file.size,
      checksum_sha256: checksum,
      context,
    }),
  });
  const put = await fetch(intent.upload_url, { method: intent.method || "PUT", headers: intent.required_headers || {}, body: file });
  if (!put.ok) throw new ApiError(put.status, { code: "UPLOAD_FAILED", message: "Не удалось загрузить файл в хранилище" });
  return apiData(`/api/v1/files/uploads/${intent.id}/complete`, { method: "POST", body: json({ checksum_sha256: checksum }) });
}

export async function waitForSubmission(id, options = {}) {
  const { interval = 1500, attempts = 40 } = options;
  const terminal = new Set(["scored", "failed", "invalid", "rejected", "cancelled", "evaluated", "error"]);
  for (let index = 0; index < attempts; index += 1) {
    const submission = await api.submissions.get(id);
    if (terminal.has(submission.status)) return submission;
    await new Promise((resolve) => window.setTimeout(resolve, interval));
  }
  throw new ApiError(408, { code: "SCORING_TIMEOUT", message: "Проверка решения занимает больше обычного. Результат появится в истории попыток." });
}
