export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

let accessToken = null;
let refreshPromise = null;

export class ApiError extends Error {
  constructor(status, body = {}) {
    super(body.message || "Ошибка запроса к серверу");
    this.name = "ApiError";
    this.status = status;
    this.code = body.code || "UNKNOWN_ERROR";
    this.details = body.details || {};
    this.fieldErrors = body.field_errors || {};
    this.retryAfterSeconds = body.retry_after_seconds ?? null;
    this.requestId = body.request_id || null;
  }
}

export function setAccessToken(token) {
  accessToken = token || null;
}

export function clearAccessToken() {
  accessToken = null;
}

export function getAccessToken() {
  return accessToken;
}

function requestId() {
  return `frontend-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36)}`;
}

async function readResponse(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(response.status, { code: "INVALID_SERVER_RESPONSE", message: "Сервер вернул некорректный ответ" });
  }
}

async function refreshSession() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "X-Request-ID": requestId() },
    });
    const json = await readResponse(response);
    if (!response.ok) {
      clearAccessToken();
      throw new ApiError(response.status, json?.error);
    }
    setAccessToken(json.data.access_token || json.data.token);
    return json.data;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function apiRequest(path, init = {}, options = {}) {
  const { auth = true, retry = true } = options;
  const headers = new Headers(init.headers);
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  headers.set("X-Request-ID", requestId());
  if (auth && accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" });
  } catch {
    throw new ApiError(0, { code: "NETWORK_ERROR", message: "Не удалось связаться с сервером ML Арены" });
  }

  const json = await readResponse(response);
  if (response.ok) return json;

  const error = new ApiError(response.status, json?.error);
  const canRefresh = auth && retry && path !== "/api/v1/auth/refresh" && response.status === 401
    && ["TOKEN_EXPIRED", "AUTHENTICATION_REQUIRED"].includes(error.code);
  if (canRefresh) {
    try {
      await refreshSession();
      return apiRequest(path, init, { ...options, retry: false });
    } catch (refreshError) {
      clearAccessToken();
      window.dispatchEvent(new CustomEvent("ml-arena:session-expired"));
      throw refreshError;
    }
  }
  throw error;
}

export async function apiData(path, init = {}, options = {}) {
  const response = await apiRequest(path, init, options);
  return response?.data;
}

export async function restoreSession() {
  return refreshSession();
}

export function queryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : "";
}
