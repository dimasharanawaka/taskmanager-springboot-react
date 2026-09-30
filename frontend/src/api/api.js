const TOKEN_KEY = "taskflow.accessToken";

export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(body?.error || "Something went wrong. Please try again.", response.status, body?.fields);
  }

  return body;
}

export const authApi = {
  register: (payload) => request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/api/auth/me"),
};

export const tasksApi = {
  list: () => request("/api/tasks"),
  create: (payload) => request("/api/tasks", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => request(`/api/tasks/${id}`, { method: "DELETE" }),
};
