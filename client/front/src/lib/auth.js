// Minimal token storage for "protected" routes; swap to real auth later.
const KEY = "cc_token";

export function setToken(t) {
  localStorage.setItem(KEY, t);
}

export function getToken() {
  return localStorage.getItem(KEY) || "";
}

export function isAuthed() {
  return Boolean(getToken());
}

export function clearToken() {
  localStorage.removeItem(KEY);
}
