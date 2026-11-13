const API_URL = import.meta.env.API_URL || 'https://personal-expense-management-system-mote.onrender.com/api';
let accessToken = null;
let refreshing = null;
export const setAccessToken = token => { accessToken = token || null; };
export const getAccessToken = () => accessToken;

async function rawRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (accessToken && options.auth !== false) headers.Authorization = `Bearer ${accessToken}`;
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include', ...options, headers });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}
export async function refreshSession() {
  if (!refreshing) {
    refreshing = rawRequest('/auth/refresh', { method: 'POST', auth: false }).then(({ response, payload }) => {
      if (!response.ok || !payload.accessToken) { accessToken = null; return null; }
      accessToken = payload.accessToken;
      return payload;
    }).finally(() => { refreshing = null; });
  }
  return refreshing;
}
export async function apiRequest(path, options = {}) {
  let result = await rawRequest(path, options);
  if (result.response.status === 401 && options.auth !== false && !options.skipRefresh && path !== '/auth/refresh') {
    const refreshed = await refreshSession();
    if (refreshed) result = await rawRequest(path, options);
  }
  if (!result.response.ok) throw new Error(result.payload.message || 'Request failed.');
  return result.payload;
}
