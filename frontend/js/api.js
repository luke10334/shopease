// ============================================================
//  ShopEase Frontend – api.js
//  Central fetch wrappers for every backend endpoint.
// ============================================================

async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(auth ? Token.headers() : {})
  };

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status === 204) return null;

  let data;
  try { data = await res.json(); } catch { data = null; }

  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────────
const AuthAPI = {
  login(email, password)   { return apiFetch('/api/auth/login',    { method: 'POST', body: { email, password }, auth: false }); },
  register(payload)        { return apiFetch('/api/auth/register', { method: 'POST', body: payload, auth: false }); }
};

// ── Products ──────────────────────────────────────────────
const ProductAPI = {
  list(page = 0, size = 12, categoryId)  {
    const q = new URLSearchParams({ page, size });
    if (categoryId) q.set('categoryId', categoryId);
    return apiFetch(`/api/products?${q}`);
  },
  search(query, page = 0, size = 12) {
    return apiFetch(`/api/products/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`);
  },
  get(id)                  { return apiFetch(`/api/products/${id}`); },
  create(payload)          { return apiFetch('/api/products',     { method: 'POST', body: payload }); },
  update(id, payload)      { return apiFetch(`/api/products/${id}`, { method: 'PUT',  body: payload }); },
  deactivate(id)           { return apiFetch(`/api/products/${id}`, { method: 'DELETE' }); }
};

// ── Categories ────────────────────────────────────────────
const CategoryAPI = {
  list()              { return apiFetch('/api/categories'); },
  create(payload)     { return apiFetch('/api/categories', { method: 'POST', body: payload }); }
};

// ── Cart ──────────────────────────────────────────────────
const CartAPI = {
  get()                      { return apiFetch('/api/cart'); },
  addItem(productId, quantity){ return apiFetch('/api/cart/items', { method: 'POST', body: { productId, quantity } }); },
  updateItem(id, qty)        { return apiFetch(`/api/cart/items/${id}?qty=${qty}`, { method: 'PATCH' }); },
  removeItem(id)             { return apiFetch(`/api/cart/items/${id}`, { method: 'DELETE' }); },
  clear()                    { return apiFetch('/api/cart', { method: 'DELETE' }); }
};

// ── Orders ────────────────────────────────────────────────
const OrderAPI = {
  place(shippingAddress)     { return apiFetch('/api/orders', { method: 'POST', body: { shippingAddress } }); },
  myOrders(page = 0, size = 10) { return apiFetch(`/api/orders?page=${page}&size=${size}`); },
  get(id)                    { return apiFetch(`/api/orders/${id}`); }
};

// ── Admin ─────────────────────────────────────────────────
const AdminAPI = {
  orders(page = 0, size = 20, status) {
    const q = new URLSearchParams({ page, size });
    if (status) q.set('status', status);
    return apiFetch(`/api/admin/orders?${q}`);
  },
  getOrder(id)               { return apiFetch(`/api/admin/orders/${id}`); },
  updateStatus(id, status)   { return apiFetch(`/api/admin/orders/${id}/status`, { method: 'PATCH', body: { status } }); },
  users(page = 0, size = 20) { return apiFetch(`/api/admin/users?page=${page}&size=${size}`); }
};
