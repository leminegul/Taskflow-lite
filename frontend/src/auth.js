export function setAuth(token) {
  localStorage.setItem("token", token);
}

export function clearAuth() {
  localStorage.removeItem("token");
}

export function isAuthed() {
  return !!localStorage.getItem("token");
}
