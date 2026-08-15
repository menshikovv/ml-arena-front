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
  cooperation: {
    createLead: (body) => apiData("/api/v1/cooperation/leads", { method: "POST", body: json(body) }, { auth: false }),
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
    me: () => apiData("/api/v1/admin/me"),
    dashboard: () => apiData("/api/v1/admin/dashboard"),
    roles: () => apiData("/api/v1/admin/roles"),
    setStaffRoles: (userId, roles) => apiData(`/api/v1/admin/staff/${userId}/roles`, { method: "PUT", body: json({ roles }) }),
    auditLogs: (params) => apiRequest(`/api/v1/admin/audit-logs${queryString(params)}`),
    users: (params) => apiRequest(`/api/v1/admin/users${queryString(params)}`),
    user: (id, params) => apiData(`/api/v1/admin/users/${id}${queryString(params)}`),
    verifyUser: (id) => apiData(`/api/v1/admin/users/${id}/verify`, { method: "POST" }),
    banUser: (id, body) => apiData(`/api/v1/admin/users/${id}/ban`, { method: "POST", body: json(body) }),
    unbanUser: (id) => apiData(`/api/v1/admin/users/${id}/unban`, { method: "POST" }),
    userNotes: (id) => apiData(`/api/v1/admin/users/${id}/notes`),
    addUserNote: (id, note) => apiData(`/api/v1/admin/users/${id}/notes`, { method: "POST", body: json({ note }) }),
    grantBadge: (userId, badgeId) => apiData(`/api/v1/admin/users/${userId}/badges/${badgeId}/grant`, { method: "POST" }),
    revokeBadge: (userId, badgeId) => apiData(`/api/v1/admin/users/${userId}/badges/${badgeId}/revoke`, { method: "POST" }),
    organizations: (params) => apiRequest(`/api/v1/admin/organizations${queryString(params)}`),
    organization: (id) => apiData(`/api/v1/admin/organizations/${id}`),
    createOrganization: (body) => apiData("/api/v1/admin/organizations", { method: "POST", body: json(body) }),
    updateOrganization: (id, body) => apiData(`/api/v1/admin/organizations/${id}`, { method: "PATCH", body: json(body) }),
    organizationAction: (id, action, body) => apiData(`/api/v1/admin/organizations/${id}/${action}`, { method: "POST", ...(body ? { body: json(body) } : {}) }),
    metrics: (params) => apiRequest(`/api/v1/admin/metrics${queryString(params)}`),
    metric: (id) => apiData(`/api/v1/admin/metrics/${id}`),
    createMetric: (body) => apiData("/api/v1/admin/metrics", { method: "POST", body: json(body) }),
    updateMetric: (id, body) => apiData(`/api/v1/admin/metrics/${id}`, { method: "PATCH", body: json(body) }),
    metricAction: (id, action, body) => apiData(`/api/v1/admin/metrics/${id}/${action}`, { method: "POST", ...(body ? { body: json(body) } : {}) }),
    deleteMetric: (id) => apiData(`/api/v1/admin/metrics/${id}`, { method: "DELETE" }),
    datasets: (params) => apiRequest(`/api/v1/admin/datasets${queryString(params)}`),
    dataset: (id) => apiData(`/api/v1/admin/datasets/${id}`),
    createDataset: (body) => apiData("/api/v1/admin/datasets", { method: "POST", body: json(body) }),
    updateDataset: (id, body) => apiData(`/api/v1/admin/datasets/${id}`, { method: "PATCH", body: json(body) }),
    createDatasetVersion: (id, body) => apiData(`/api/v1/admin/datasets/${id}/versions`, { method: "POST", body: json(body) }),
    attachDatasetFile: (id, versionId, body) => apiData(`/api/v1/admin/datasets/${id}/versions/${versionId}/files`, { method: "POST", body: json(body) }),
    archiveDataset: (id) => apiData(`/api/v1/admin/datasets/${id}/archive`, { method: "POST" }),
    deleteDataset: (id) => apiData(`/api/v1/admin/datasets/${id}`, { method: "DELETE" }),
    validateDatasetVersion: (id) => apiData(`/api/v1/admin/dataset-versions/${id}/validate`, { method: "POST" }),
    datasetValidation: (id) => apiData(`/api/v1/admin/dataset-versions/${id}/validation`),
    tasks: (params) => apiRequest(`/api/v1/admin/tasks${queryString(params)}`),
    task: (id) => apiData(`/api/v1/admin/tasks/${id}`),
    createTask: (body) => apiData("/api/v1/admin/tasks", { method: "POST", body: json(body) }),
    updateTask: (id, body) => apiData(`/api/v1/admin/tasks/${id}`, { method: "PATCH", body: json(body) }),
    createTaskVersion: (id, body) => apiData(`/api/v1/admin/tasks/${id}/versions`, { method: "POST", body: json(body) }),
    releaseTaskVersion: (id, versionId) => apiData(`/api/v1/admin/tasks/${id}/versions/${versionId}/release`, { method: "POST" }),
    taskAction: (id, action) => apiData(`/api/v1/admin/tasks/${id}/${action}`, { method: "POST" }),
    deleteTask: (id) => apiData(`/api/v1/admin/tasks/${id}`, { method: "DELETE" }),
    badges: (params) => apiRequest(`/api/v1/admin/badges${queryString(params)}`),
    badge: (id) => apiData(`/api/v1/admin/badges/${id}`),
    createBadge: (body) => apiData("/api/v1/admin/badges", { method: "POST", body: json(body) }),
    updateBadge: (id, body) => apiData(`/api/v1/admin/badges/${id}`, { method: "PATCH", body: json(body) }),
    archiveBadge: (id) => apiData(`/api/v1/admin/badges/${id}/archive`, { method: "POST" }),
    billingPlans: (params) => apiRequest(`/api/v1/admin/billing/plans${queryString(params)}`),
    billingPlan: (id) => apiData(`/api/v1/admin/billing/plans/${id}`),
    createBillingPlan: (body) => apiData("/api/v1/admin/billing/plans", { method: "POST", body: json(body) }),
    updateBillingPlan: (id, body) => apiData(`/api/v1/admin/billing/plans/${id}`, { method: "PATCH", body: json(body) }),
    billingPlanAction: (id, action) => apiData(`/api/v1/admin/billing/plans/${id}/${action}`, { method: "POST" }),
    deleteBillingPlan: (id) => apiData(`/api/v1/admin/billing/plans/${id}`, { method: "DELETE" }),
    subscriptions: (params) => apiRequest(`/api/v1/admin/subscriptions${queryString(params)}`),
    createSubscription: (userId, body) => apiData(`/api/v1/admin/users/${userId}/subscriptions`, { method: "POST", body: json(body) }),
    subscriptionAction: (id, action, body) => apiData(`/api/v1/admin/subscriptions/${id}/${action}`, { method: "POST", ...(body ? { body: json(body) } : {}) }),
    competitions: (params) => apiRequest(`/api/v1/admin/competitions${queryString(params)}`),
    competition: (id) => apiData(`/api/v1/admin/competitions/${id}`),
    createCompetition: (body) => apiData("/api/v1/admin/competitions", { method: "POST", body: json(body) }),
    updateCompetition: (id, body) => apiData(`/api/v1/admin/competitions/${id}`, { method: "PATCH", body: json(body) }),
    duplicateCompetition: (id) => apiData(`/api/v1/admin/competitions/${id}/duplicate`, { method: "POST" }),
    competitionAction: (id, action, body) => apiData(`/api/v1/admin/competitions/${id}/${action}`, { method: "POST", ...(body ? { body: json(body) } : {}) }),
    archiveCompetition: (id) => apiData(`/api/v1/admin/competitions/${id}/archive`, { method: "POST" }),
    competitionReadiness: (id) => apiData(`/api/v1/admin/competitions/${id}/readiness`),
    updateScoringConfig: (id, body) => apiData(`/api/v1/admin/competitions/${id}/scoring-config`, { method: "POST", body: json(body) }),
    submissions: (params) => apiRequest(`/api/v1/admin/submissions${queryString(params)}`),
    submission: (id) => apiData(`/api/v1/admin/submissions/${id}`),
    submissionAction: (id, action, reason) => apiData(`/api/v1/admin/submissions/${id}/${action}`, { method: "POST", body: json({ reason }) }),
    leaderboardSnapshots: (id) => apiData(`/api/v1/admin/competitions/${id}/leaderboard/snapshots`),
    createLeaderboardSnapshot: (id, kind) => apiData(`/api/v1/admin/competitions/${id}/leaderboard/snapshots${queryString({ kind })}`, { method: "POST" }),
    leaderboardRecalculations: (id) => apiData(`/api/v1/admin/competitions/${id}/leaderboard/recalculations`),
    recalculateLeaderboard: (id, body) => apiData(`/api/v1/admin/competitions/${id}/leaderboard/recalculate`, { method: "POST", body: json(body) }),
    revealPrivateLeaderboard: (id) => apiData(`/api/v1/admin/competitions/${id}/leaderboard/reveal-private`, { method: "POST" }),
    moderationReports: (params) => apiRequest(`/api/v1/admin/moderation/reports${queryString(params)}`),
    decideModerationReport: (id, body) => apiData(`/api/v1/admin/moderation/reports/${id}/decision`, { method: "POST", body: json(body) }),
    blogPosts: (params) => apiRequest(`/api/v1/admin/blog/posts${queryString(params)}`),
    blogPost: (id) => apiData(`/api/v1/admin/blog/posts/${id}`),
    createBlogPost: (body) => apiData("/api/v1/admin/blog/posts", { method: "POST", body: json(body) }),
    updateBlogPost: (id, body) => apiData(`/api/v1/admin/blog/posts/${id}`, { method: "PATCH", body: json(body) }),
    deleteBlogPost: (id) => apiData(`/api/v1/admin/blog/posts/${id}`, { method: "DELETE" }),
    blogPostAction: (id, action, body) => apiData(`/api/v1/admin/blog/posts/${id}/${action}`, { method: "POST", ...(body ? { body: json(body) } : {}) }),
    blogPostRevisions: (id) => apiData(`/api/v1/admin/blog/posts/${id}/revisions`),
    blogPostMetrics: (id) => apiData(`/api/v1/admin/blog/posts/${id}/metrics`),
    blogCategories: () => apiData("/api/v1/admin/blog/categories"),
    createBlogCategory: (body) => apiData("/api/v1/admin/blog/categories", { method: "POST", body: json(body) }),
    updateBlogCategory: (id, body) => apiData(`/api/v1/admin/blog/categories/${id}`, { method: "PUT", body: json(body) }),
    deleteBlogCategory: (id) => apiData(`/api/v1/admin/blog/categories/${id}`, { method: "DELETE" }),
    blogTags: () => apiData("/api/v1/admin/blog/tags"),
    createBlogTag: (body) => apiData("/api/v1/admin/blog/tags", { method: "POST", body: json(body) }),
    updateBlogTag: (id, body) => apiData(`/api/v1/admin/blog/tags/${id}`, { method: "PUT", body: json(body) }),
    deleteBlogTag: (id) => apiData(`/api/v1/admin/blog/tags/${id}`, { method: "DELETE" }),
    blogMedia: (params) => apiRequest(`/api/v1/admin/blog/media${queryString(params)}`),
    attachBlogMedia: (body) => apiData("/api/v1/admin/blog/media", { method: "POST", body: json(body) }),
    updateBlogMedia: (id, body) => apiData(`/api/v1/admin/blog/media/${id}`, { method: "PATCH", body: json(body) }),
    deleteBlogMedia: (id) => apiData(`/api/v1/admin/blog/media/${id}`, { method: "DELETE" }),
  },
};

const sha256Constants = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotateRight(value, shift) {
  return (value >>> shift) | (value << (32 - shift));
}

function sha256Fallback(buffer) {
  const bytes = new Uint8Array(buffer);
  const bitLength = bytes.length * 8;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  const hash = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const words = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(offset + index * 4, false);
    for (let index = 16; index < 64; index += 1) {
      const first = words[index - 15];
      const second = words[index - 2];
      const sigma0 = rotateRight(first, 7) ^ rotateRight(first, 18) ^ (first >>> 3);
      const sigma1 = rotateRight(second, 17) ^ rotateRight(second, 19) ^ (second >>> 10);
      words[index] = (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + sum1 + choice + sha256Constants[index] + words[index]) >>> 0;
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (sum0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  return [...hash].map((value) => value.toString(16).padStart(8, "0")).join("");
}

export async function sha256Hex(file) {
  const buffer = await file.arrayBuffer();
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", buffer);
    return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
  }
  return sha256Fallback(buffer);
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
