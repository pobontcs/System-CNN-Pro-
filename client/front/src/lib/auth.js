const KEY = "cropcare_token";

export function isAuthed() {
  return Boolean(localStorage.getItem(KEY));
}

export function setToken(token) {
  localStorage.setItem(KEY, token);
}

export function clearToken() {
  localStorage.removeItem(KEY);
}
