// ============================================================
//  ShopEase Frontend – admin.js
//  Admin Dashboard: Orders tab, Products tab, Users tab
// ============================================================

let _adminTab      = 'orders';
let _adminOrderPage = 0;
let _adminUserPage  = 0;
let _adminOrderStatus = '';

async function renderAdmin() {
  if (!CurrentUser.isLoggedIn() || !CurrentUser.isAdmin()) {
    Toast.error('Admin access required.');
    Router.navigate('/shop');
    return;
  }

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="admin-page">
      <div class="admin-sidebar glass">
        <div class="admin-brand">
          <span class="logo-icon">🛒</span>
          <span class="logo-text">Admin</span>
        </div>
        <nav class="admin-nav">
          <button class="admin-nav-btn ${_adminTab==='orders' ? 'active' : ''}" data-tab="orders">📋 Orders</button>
          <button class="admin-nav-btn ${_adminTab==='products' ? 'active' : ''}" data-tab="products">📦 Products</button>
          <button class="admin-nav-btn ${_adminTab==='users' ? 'active' : ''}" data-tab="users">👥 Users</button>
        </nav>
        <button class="btn btn-ghost btn-sm admin-shop-link" onclick="Router.navigate('/shop')">← Back to Shop</button>
      </div>
      <div class="admin-content" id="admin-content">
        <div class="loader-wrap"><div class="loader-spinner"></div></div>
      </div>
    </div>`;

  app.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _adminTab = btn.dataset.tab;
      app.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadAdminTab();
    });
  });

  loadAdminTab();
}

async function loadAdminTab() {
  const content = document.getElementById('admin-content');
  switch (_adminTab) {
    case 'orders':   await loadAdminOrders(content); break;
    case 'products': await loadAdminProducts(content); break;
    case 'users':    await loadAdminUsers(content); break;
  }
}

// ── Orders Tab ────────────────────────────────────────────
async function loadAdminOrders(content) {
  Loader.show(content);
  try {
    const statuses = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const data = await AdminAPI.orders(_adminOrderPage, 20, _adminOrderStatus || undefined);
    const orders = data.content ?? [];

    content.innerHTML = `
      <div class="admin-section-header">
        <h2 class="admin-section-title">Orders</h2>
        <div class="admin-filters">
          <select id="admin-order-status-filter" class="filter-select">
            ${statuses.map(s => `<option value="${s}" ${_adminOrderStatus===s?'selected':''}>${s||'All Statuses'}</option>`).join('')}
          </select>
        </div>
      </div>

      ${orders.length === 0
        ? emptyState('📋', 'No orders found')
        : `<div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                ${orders.map(o => `
                <tr>
                  <td>#${o.id}</td>
                  <td>
                    <div class="user-cell">
                      <span class="user-avatar">${(o.userEmail?.[0] ?? 'U').toUpperCase()}</span>
                      <span>${escHtml(o.userEmail)}</span>
                    </div>
                  </td>
                  <td>${formatCurrency(o.totalAmount)}</td>
                  <td>${statusBadge(o.status)}</td>
                  <td>${formatDate(o.createdAt)}</td>
                  <td>
                    <select class="status-select" data-order-id="${o.id}" data-current="${o.status}">
                      <option value="">— Change —</option>
                      ${nextStatuses(o.status).map(s => `<option value="${s}">${s}</option>`).join('')}
                    </select>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div id="admin-orders-pag"></div>`
      }`;

    document.getElementById('admin-order-status-filter')?.addEventListener('change', e => {
      _adminOrderStatus = e.target.value;
      _adminOrderPage = 0;
      loadAdminOrders(content);
    });

    content.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        const newStatus = sel.value;
        if (!newStatus) return;
        try {
          await AdminAPI.updateStatus(sel.dataset.orderId, newStatus);
          Toast.success(`Order #${sel.dataset.orderId} → ${newStatus}`);
          loadAdminOrders(content);
        } catch(err) {
          Toast.error(err.message);
          sel.value = '';
        }
      });
    });

    if (data.totalPages > 1) {
      renderPagination(
        document.getElementById('admin-orders-pag'),
        { page: data.page, totalPages: data.totalPages },
        p => { _adminOrderPage = p; loadAdminOrders(content); }
      );
    }
  } catch(err) {
    content.innerHTML = emptyState('⚠️', 'Failed to load orders', err.message);
  }
}

function nextStatuses(current) {
  const map = {
    PENDING:    ['CONFIRMED', 'CANCELLED'],
    CONFIRMED:  ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED'],
    SHIPPED:    ['DELIVERED'],
    DELIVERED:  [],
    CANCELLED:  []
  };
  return map[current] ?? [];
}

// ── Products Tab ──────────────────────────────────────────
async function loadAdminProducts(content) {
  Loader.show(content);
  try {
    const [productsData, categories] = await Promise.all([
      ProductAPI.list(0, 50),
      CategoryAPI.list()
    ]);
    const products = productsData.content ?? productsData ?? [];

    content.innerHTML = `
      <div class="admin-section-header">
        <h2 class="admin-section-title">Products</h2>
        <button class="btn btn-primary btn-sm" id="new-product-btn">+ New Product</button>
      </div>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${products.map(p => `
            <tr class="${!p.active ? 'row-inactive' : ''}">
              <td>#${p.id}</td>
              <td>${escHtml(p.name)}</td>
              <td>${escHtml(p.categoryName ?? '—')}</td>
              <td>${formatCurrency(p.price)}</td>
              <td>${p.stockQuantity}</td>
              <td><span class="badge ${p.active ? 'badge--green' : 'badge--red'}">${p.active ? 'Active' : 'Inactive'}</span></td>
              <td class="action-cell">
                <button class="btn btn-xs btn-ghost edit-product-btn" data-id="${p.id}">✏️ Edit</button>
                ${p.active ? `<button class="btn btn-xs btn-danger deactivate-btn" data-id="${p.id}">🚫 Deactivate</button>` : ''}
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    document.getElementById('new-product-btn').onclick = () => openProductModal(null, categories);

    content.querySelectorAll('.edit-product-btn').forEach(btn => {
      btn.onclick = async () => {
        const p = await ProductAPI.get(btn.dataset.id);
        openProductModal(p, categories);
      };
    });

    content.querySelectorAll('.deactivate-btn').forEach(btn => {
      btn.onclick = () => {
        Modal.open({
          title: 'Deactivate Product',
          body: 'Deactivating will hide this product from the shop. Order history is preserved.',
          confirmText: 'Deactivate',
          confirmClass: 'btn-danger',
          onConfirm: async () => {
            try {
              await ProductAPI.deactivate(btn.dataset.id);
              Toast.success('Product deactivated.');
              loadAdminProducts(content);
            } catch(err) { Toast.error(err.message); }
          }
        });
      };
    });
  } catch(err) {
    content.innerHTML = emptyState('⚠️', 'Failed to load products', err.message);
  }
}

function openProductModal(product, categories) {
  const isEdit = !!product;
  Modal.open({
    title: isEdit ? `Edit Product #${product.id}` : 'New Product',
    body: `
      <form id="product-form" class="auth-form">
        <div class="form-group">
          <label>Name *</label>
          <input id="pf-name" type="text" value="${escHtml(product?.name ?? '')}" required placeholder="Product name"/>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="pf-desc" rows="3" placeholder="Description">${escHtml(product?.description ?? '')}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Price *</label>
            <input id="pf-price" type="number" step="0.01" value="${product?.price ?? ''}" required placeholder="0.00"/>
          </div>
          <div class="form-group">
            <label>Stock *</label>
            <input id="pf-stock" type="number" value="${product?.stockQuantity ?? ''}" required placeholder="0"/>
          </div>
        </div>
        <div class="form-group">
          <label>Category *</label>
          <select id="pf-category">
            <option value="">— Select Category —</option>
            ${categories.map(c => `<option value="${c.id}" ${product?.categoryId == c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <p id="pf-error" class="form-error hidden"></p>
      </form>`,
    confirmText: isEdit ? 'Save Changes' : 'Create Product',
    onConfirm: async () => {
      const payload = {
        name:           document.getElementById('pf-name').value.trim(),
        description:    document.getElementById('pf-desc').value.trim(),
        price:          parseFloat(document.getElementById('pf-price').value),
        stockQuantity:  parseInt(document.getElementById('pf-stock').value),
        categoryId:     parseInt(document.getElementById('pf-category').value)
      };
      try {
        if (isEdit) await ProductAPI.update(product.id, payload);
        else        await ProductAPI.create(payload);
        Toast.success(isEdit ? 'Product updated!' : 'Product created!');
        loadAdminProducts(document.getElementById('admin-content'));
      } catch(err) { Toast.error(err.message); }
    }
  });
}

// ── Users Tab ─────────────────────────────────────────────
async function loadAdminUsers(content) {
  Loader.show(content);
  try {
    const data  = await AdminAPI.users(_adminUserPage);
    const users = data.content ?? data ?? [];

    content.innerHTML = `
      <div class="admin-section-header">
        <h2 class="admin-section-title">Users</h2>
        <span class="section-meta">${data.totalElements ?? users.length} total</span>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
          </thead>
          <tbody>
            ${users.map(u => `
            <tr>
              <td>#${u.id}</td>
              <td>
                <div class="user-cell">
                  <span class="user-avatar">${(u.name?.[0] ?? 'U').toUpperCase()}</span>
                  <span>${escHtml(u.name)}</span>
                </div>
              </td>
              <td>${escHtml(u.email)}</td>
              <td><span class="badge ${u.role === 'ROLE_ADMIN' ? 'badge--indigo' : 'badge--blue'}">${u.role}</span></td>
              <td>${u.createdAt ? formatDate(u.createdAt) : '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div id="admin-users-pag"></div>`;

    if (data.totalPages > 1) {
      renderPagination(
        document.getElementById('admin-users-pag'),
        { page: data.page, totalPages: data.totalPages },
        p => { _adminUserPage = p; loadAdminUsers(content); }
      );
    }
  } catch(err) {
    content.innerHTML = emptyState('⚠️', 'Failed to load users', err.message);
  }
}
