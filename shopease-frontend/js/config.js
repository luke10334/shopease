// ============================================================
//  ShopEase Frontend – config.js
//  Change API_BASE to match your running backend.
// ============================================================

const API_BASE = 'http://localhost:8080';

// ── Token helpers ─────────────────────────────────────────
const Token = {
  get()    { return localStorage.getItem('se_token'); },
  set(t)   { localStorage.setItem('se_token', t); },
  clear()  { localStorage.removeItem('se_token'); localStorage.removeItem('se_user'); },
  headers() {
    const t = Token.get();
    return t ? { Authorization: `Bearer ${t}` } : {};
  }
};

// ── Decode JWT payload (no verification – client-side only) ─
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
}

// ── Current user helper ───────────────────────────────────
const CurrentUser = {
  get() {
    const raw = localStorage.getItem('se_user');
    return raw ? JSON.parse(raw) : null;
  },
  set(user) { localStorage.setItem('se_user', JSON.stringify(user)); },
  isAdmin() { return this.get()?.role === 'ROLE_ADMIN'; },
  isLoggedIn() { return !!Token.get(); }
};
