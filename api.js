const API_BASE = 'http://localhost:3001'; // <-- حتماً این را با آدرس بک‌اندت تنظیم کن

// Default headers helper
function defaultHeaders(auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = localStorage.getItem('accessToken');
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }
  return headers;
}

// simple fetch wrapper with JSON parsing and error handling
async function apiFetch(path, { method = 'GET', body = null, auth = true } = {}) {
  const opts = {
    method,
    headers: defaultHeaders(auth),
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + path, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }

  if (!res.ok) {
    const err = data || { status: res.status, message: res.statusText };
    throw err;
  }
  return data;
}