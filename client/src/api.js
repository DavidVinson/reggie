const TOKEN_KEY = 'reggie_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  }).catch(() => {});
  clearToken();
  window.location.href = '/login';
}

// Drop-in replacement for fetch() that attaches the JWT and handles 401.
export default async function api(url, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    return res;
  }

  return res;
}
