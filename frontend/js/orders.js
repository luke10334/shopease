// ============================================================
//  ShopEase Frontend – orders.js
//  My Orders page: paginated history with expandable items
// ============================================================

let _ordersPage = 0;

async function renderOrders() {
  if (!CurrentUser.isLoggedIn()) { Router.navigate('/login'); return; }

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container orders-page">
      <h1 class="page-title">My Orders</h1>
      <div id="orders-list"></div>
      <div id="orders-pagination"></div>
    </div>`;

  await loadOrders();
}

async function loadOrders() {
  const list  = document.getElementById('orders-list');
  const pagDiv = document.getElementById('orders-pagination');
  Loader.show(list);

  try {
    const data   = await OrderAPI.myOrders(_ordersPage);
    const orders = data.content ?? [];

    if (orders.length === 0) {
      list.innerHTML = emptyState('📦', 'No orders yet', '<a href="#/shop" class="link">Start shopping →</a>');
      pagDiv.innerHTML = '';
      return;
    }

    list.innerHTML = orders.map(o => orderCard(o)).join('');

    // Expand toggle
    list.querySelectorAll('.order-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = document.getElementById(`order-items-${btn.dataset.orderId}`);
        const isOpen = panel.classList.toggle('open');
        btn.textContent = isOpen ? '▲ Hide Items' : '▼ Show Items';
      });
    });

    if (data.totalPages > 1) {
      renderPagination(pagDiv, { page: data.page, totalPages: data.totalPages }, p => {
        _ordersPage = p; loadOrders();
      });
    } else { pagDiv.innerHTML = ''; }

  } catch(err) {
    list.innerHTML = emptyState('⚠️', 'Could not load orders', err.message);
  }
}

function orderCard(o) {
  const items = o.items ?? [];
  return `
    <div class="order-card glass">
      <div class="order-card-header">
        <div class="order-meta">
          <span class="order-id">Order #${o.id}</span>
          <span class="order-date">${formatDate(o.createdAt)}</span>
        </div>
        <div class="order-right">
          ${statusBadge(o.status)}
          <span class="order-total">${formatCurrency(o.totalAmount)}</span>
        </div>
      </div>
      <div class="order-address">📍 ${escHtml(o.shippingAddress)}</div>

      ${items.length > 0 ? `
      <button class="btn btn-ghost btn-sm order-toggle-btn" data-order-id="${o.id}">▼ Show Items (${items.length})</button>
      <div class="order-items-panel" id="order-items-${o.id}">
        <table class="order-items-table">
          <thead>
            <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            ${items.map(i => `
            <tr>
              <td>${escHtml(i.productName)}</td>
              <td>${i.quantity}</td>
              <td>${formatCurrency(i.priceAtPurchase)}</td>
              <td>${formatCurrency(i.subtotal)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : ''}
    </div>`;
}
