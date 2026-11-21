// ============================================================
//  ShopEase Frontend – cart.js
//  Cart page: view, update qty, remove, clear, place order
// ============================================================

async function renderCart() {
  if (!CurrentUser.isLoggedIn()) { Router.navigate('/login'); return; }

  const app = document.getElementById('app');
  Loader.show(app);

  try {
    const cart = await CartAPI.get();
    const items = cart.items ?? [];

    app.innerHTML = `
      <div class="container cart-page">
        <h1 class="page-title">Your Cart <span class="cart-count-badge">${items.length}</span></h1>
        ${items.length === 0
          ? emptyState('🛒', 'Your cart is empty', '<a href="#/shop" class="link">Browse products →</a>')
          : `
          <div class="cart-layout">
            <div class="cart-items" id="cart-items-list">
              ${items.map(item => cartItemRow(item)).join('')}
            </div>
            <div class="cart-summary glass">
              <h2 class="summary-title">Order Summary</h2>
              <div class="summary-row">
                <span>Items (${items.length})</span>
                <span id="summary-subtotal">${formatCurrency(calcTotal(items))}</span>
              </div>
              <div class="summary-row">
                <span>Shipping</span>
                <span class="text-green">Free</span>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row summary-total">
                <span>Total</span>
                <span id="summary-total">${formatCurrency(calcTotal(items))}</span>
              </div>
              <div class="form-group mt-4">
                <label for="shipping-address">Shipping Address *</label>
                <textarea id="shipping-address" placeholder="123 Main St, City, State, ZIP" rows="3"></textarea>
              </div>
              <button class="btn btn-primary btn-block" id="place-order-btn">Place Order 🚀</button>
              <button class="btn btn-ghost btn-block mt-2" id="clear-cart-btn">🗑 Clear Cart</button>
            </div>
          </div>`
        }
      </div>`;

    if (items.length === 0) return;

    // Qty change buttons
    app.querySelectorAll('.qty-minus-btn').forEach(btn => {
      btn.addEventListener('click', () => changeQty(btn.dataset.itemId, parseInt(btn.dataset.qty) - 1));
    });
    app.querySelectorAll('.qty-plus-btn').forEach(btn => {
      btn.addEventListener('click', () => changeQty(btn.dataset.itemId, parseInt(btn.dataset.qty) + 1));
    });
    app.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.addEventListener('click', () => removeItem(btn.dataset.itemId));
    });

    // Clear cart
    document.getElementById('clear-cart-btn').addEventListener('click', () => {
      Modal.open({
        title: 'Clear Cart',
        body: 'Are you sure you want to remove all items from your cart?',
        confirmText: 'Clear All',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
          try {
            await CartAPI.clear();
            Toast.success('Cart cleared.');
            updateCartBadge();
            renderCart();
          } catch(err) { Toast.error(err.message); }
        }
      });
    });

    // Place order
    document.getElementById('place-order-btn').addEventListener('click', async () => {
      const address = document.getElementById('shipping-address').value.trim();
      if (!address) { Toast.warning('Please enter a shipping address.'); return; }
      const btn = document.getElementById('place-order-btn');
      btn.disabled = true; btn.textContent = 'Placing Order…';
      try {
        const order = await OrderAPI.place(address);
        Toast.success(`Order #${order.id} placed! 🎉`);
        updateCartBadge();
        Router.navigate('/orders');
      } catch(err) {
        Toast.error(err.message);
        btn.disabled = false; btn.textContent = 'Place Order 🚀';
      }
    });

  } catch(err) {
    app.innerHTML = emptyState('⚠️', 'Could not load cart', err.message);
  }
}

function cartItemRow(item) {
  return `
    <div class="cart-item glass" id="cart-item-${item.id}">
      <div class="cart-item-img">${categoryEmoji(item.productName)}</div>
      <div class="cart-item-info">
        <h4 class="cart-item-name">${escHtml(item.productName)}</h4>
        <p class="cart-item-price">${formatCurrency(item.price)}</p>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn qty-minus-btn" data-item-id="${item.id}" data-qty="${item.quantity}" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
        <span class="qty-display">${item.quantity}</span>
        <button class="qty-btn qty-plus-btn" data-item-id="${item.id}" data-qty="${item.quantity}">+</button>
      </div>
      <div class="cart-item-subtotal">${formatCurrency(item.subtotal ?? (item.price * item.quantity))}</div>
      <button class="remove-item-btn icon-btn" data-item-id="${item.id}" title="Remove">✕</button>
    </div>`;
}

async function changeQty(itemId, newQty) {
  if (newQty < 1) return;
  try {
    await CartAPI.updateItem(itemId, newQty);
    updateCartBadge();
    renderCart();
  } catch(err) { Toast.error(err.message); }
}

async function removeItem(itemId) {
  try {
    await CartAPI.removeItem(itemId);
    Toast.info('Item removed.');
    updateCartBadge();
    renderCart();
  } catch(err) { Toast.error(err.message); }
}

function calcTotal(items) {
  return items.reduce((sum, i) => sum + (i.subtotal ?? (i.price * i.quantity)), 0);
}
