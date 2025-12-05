// المان‌ها
const form = document.getElementById('loginForm');
const btnLogin = document.getElementById('btnLogin');
const messageEl = document.getElementById('message');
const togglePwdBtn = document.getElementById('togglePwd');
const demoBtn = document.getElementById('btnDemo');

if (togglePwdBtn) {
  togglePwdBtn.addEventListener('click', () => {
    const pwd = document.getElementById('password');
    if (!pwd) return;
    if (pwd.type === 'password') { pwd.type = 'text'; togglePwdBtn.textContent = '🙈'; }
    else { pwd.type = 'password'; togglePwdBtn.textContent = '👁️'; }
    pwd.focus();
  });
}

// show message
function showMessage(text, { type = 'error' } = {}) {
  messageEl.textContent = text || '';
  messageEl.classList.remove('success');
  if (type === 'success') messageEl.classList.add('success');
}

// form submit
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await doLogin();
  });
}

async function doLogin() {
  const username = (document.getElementById('username') || {}).value?.trim();
  const password = (document.getElementById('password') || {}).value || '';
  const remember = (document.getElementById('remember') || {}).checked;

  if (!username || !password) {
    showMessage('نام کاربری و رمز عبور را وارد کنید.');
    return;
  }

  // ui: loading
  btnLogin.classList.add('loading');
  btnLogin.disabled = true;
  showMessage('');

  try {
    // call API - note: endpoint assumed '/login'
    const data = await apiFetch('/login', { method: 'POST', body: { username, password }, auth: false });

    // Expected response shape (based on backend DTO): { accessToken: '...', refreshToken: '...' }
    const access = data?.accessToken || data?.access || data?.token || data?.accessToken;
    const refresh = data?.refreshToken || data?.refresh;

    if (!access) {
      throw data?.message || 'پاسخ نامعتبر از سرور (توکن دریافت نشد).';
    }

    // store tokens
    if (remember) {
      localStorage.setItem('accessToken', access);
      if (refresh) localStorage.setItem('refreshToken', refresh);
    } else {
      // session-only: still store in sessionStorage for this tab
      sessionStorage.setItem('accessToken', access);
      if (refresh) sessionStorage.setItem('refreshToken', refresh);
    }

    // decode JWT payload safely
    let payload = {};
    try {
      const parts = access.split('.');
      if (parts.length >= 2) {
        payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      }
    } catch (err) {
      console.warn('invalid jwt decode', err);
    }

    // determine role robustly
    let role = payload?.role || payload?.roles || payload?.user?.role || payload?.data?.role || null;
    if (Array.isArray(role)) role = role[0];

    // Fallback: if payload contains user object with nested fields
    if (!role && payload?.user?.roles) role = Array.isArray(payload.user.roles) ? payload.user.roles[0] : payload.user.roles;

    // Decide redirect
    let redirect = '/../dashboard-student.html';
    if (role) {
      const r = String(role).toLowerCase();
      if (r.includes('admin')) redirect = '/../dashboard-admin.html';
      else if (r.includes('prof') || r.includes('teacher')) redirect = '/../dashboard-prof.html';
      else redirect = '/../dashboard-student.html';
    } else {
      // default: go to student dashboard but you can change
      redirect = '/../dashboard-student.html';
    }

    showMessage('ورود موفق — در حال هدایت...', { type: 'success' });

    // small delay for UX
    setTimeout(() => {
      // set token also in localStorage for api.js defaultHeaders to pick up
      // If used sessionStorage, mirror to localStorage for single-tab usage, but prefer to check both in api.js if needed.
      if (sessionStorage.getItem('accessToken')) {
        localStorage.setItem('accessToken', sessionStorage.getItem('accessToken'));
      }
      window.location.href = redirect;
    }, 700);

  } catch (err) {
    console.error(err);
    let text = typeof err === 'string' ? err : (err?.message || err?.detail || JSON.stringify(err));
    showMessage(text);
  } finally {
    btnLogin.classList.remove('loading');
    btnLogin.disabled = false;
  }
}

// demo login (optional): fill with test credentials or call a demo endpoint
if (demoBtn) {
  demoBtn.addEventListener('click', async () => {
    document.getElementById('username').value = 'admin';
    document.getElementById('password').value = 'admin';
    await doLogin();
  });
}