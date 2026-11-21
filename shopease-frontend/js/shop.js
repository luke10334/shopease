// ============================================================
//  ShopEase Frontend – shop.js
//  Product listing, search, category filtering, product detail
// ============================================================

let _categories   = [];
let _shopPage     = 0;
let _shopCategory = null;
let _shopQuery    = '';
let _searchTimeout = null;

async function renderShop() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="shop-page">
      <!-- Hero -->
      <div class="hero-banner">
        <div class="hero-content">
          <h1 class="hero-title">Discover <span class="hero-title-accent">Premium</span> Products</h1>
          <p class="hero-sub">Handpicked collections delivered to your door</p>
          <div class="search-bar-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" id="shop-search" class="search-bar" placeholder="Search products…" autocomplete="off"/>
          </div>
        </div>
        <div class="hero-orb hero-orb--1"></div>
        <div class="hero-orb hero-orb--2"></div>
      </div>

      <!-- Category Pills -->
      <div class="category-strip" id="category-strip">
        <div class="loader-wrap small"><div class="loader-spinner"></div></div>
      </div>

      <!-- Products Grid -->
      <div class="container">
        <div id="products-grid" class="products-grid"></div>
        <div id="shop-pagination"></div>
      </div>
    </section>`;

  // Load categories
  try {
    _categories = await CategoryAPI.list();
    renderCategoryPills();
  } catch { _categories = []; renderCategoryPills(); }

  // Search input with debounce
  document.getElementById('shop-search').addEventListener('input', e => {
    clearTimeout(_searchTimeout);
    _shopQuery    = e.target.value.trim();
    _shopPage     = 0;
    _searchTimeout = setTimeout(loadProducts, 350);
  });

  await loadProducts();
}

function renderCategoryPills() {
  const strip = document.getElementById('category-strip');
  let html = `<div class="pills-container">`;
  html += `<button class="pill ${!_shopCategory ? 'pill--active' : ''}" data-id="">All</button>`;
  _categories.forEach(c => {
    html += `<button class="pill ${_shopCategory == c.id ? 'pill--active' : ''}" data-id="${c.id}">${c.name}</button>`;
  });
  html += `</div>`;
  strip.innerHTML = html;

  strip.querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => {
      _shopCategory = btn.dataset.id || null;
      _shopPage = 0;
      strip.querySelectorAll('.pill').forEach(p => p.classList.remove('pill--active'));
      btn.classList.add('pill--active');
      loadProducts();
    });
  });
}

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  const pagDiv = document.getElementById('shop-pagination');
  Loader.show(grid);

  try {
    let data;
    if (_shopQuery) {
      data = await ProductAPI.search(_shopQuery, _shopPage);
    } else {
      data = await ProductAPI.list(_shopPage, 12, _shopCategory);
    }

    const products = data.content ?? data;
    if (!products || products.length === 0) {
      grid.innerHTML = emptyState('📦', 'No products found', 'Try a different search or category.');
      pagDiv.innerHTML = '';
      return;
    }

    grid.innerHTML = products.map(p => productCard(p)).join('');
    grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        handleAddToCart(parseInt(btn.dataset.id), btn);
      });
    });
    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => Router.navigate(`/product/${card.dataset.id}`));
    });

    if (data.totalPages) {
      renderPagination(pagDiv, { page: data.page, totalPages: data.totalPages }, p => {
        _shopPage = p; loadProducts();
      });
    } else { pagDiv.innerHTML = ''; }

  } catch (err) {
    grid.innerHTML = emptyState('⚠️', 'Failed to load products', err.message);
  }
}

function productCard(p) {
  const inStock = p.stockQuantity > 0;
  return `
    <div class="product-card glass" data-id="${p.id}">
      <div class="product-img-wrap">
        <div class="product-img-placeholder">${categoryEmoji(p.categoryName)}</div>
        ${!inStock ? `<div class="out-of-stock-overlay">Out of Stock</div>` : ''}
      </div>
      <div class="product-info">
        <span class="product-category-tag">${p.categoryName ?? 'General'}</span>
        <h3 class="product-name">${escHtml(p.name)}</h3>
        <p class="product-desc">${escHtml((p.description ?? '').slice(0, 60))}${(p.description?.length ?? 0) > 60 ? '…' : ''}</p>
        <div class="product-footer">
          <span class="product-price">${formatCurrency(p.price)}</span>
          <button class="btn btn-sm btn-primary add-to-cart-btn"
            data-id="${p.id}"
            ${!inStock || !CurrentUser.isLoggedIn() ? 'disabled title="' + (!CurrentUser.isLoggedIn() ? 'Login to add' : 'Out of stock') + '"' : ''}>
            ${!CurrentUser.isLoggedIn() ? '🔐 Login' : (!inStock ? 'Sold Out' : '+ Cart')}
          </button>
        </div>
      </div>
    </div>`;
}

async function handleAddToCart(productId, btn) {
  if (!CurrentUser.isLoggedIn()) { Router.navigate('/login'); return; }
  const orig = btn.textContent;
  btn.disabled = true; btn.textContent = '…';
  try {
    await CartAPI.addItem(productId, 1);
    Toast.success('Added to cart! 🛒');
    updateCartBadge();
  } catch (err) {
    Toast.error(err.message);
  } finally {
    btn.disabled = false; btn.textContent = orig;
  }
}

// ── Product Detail ────────────────────────────────────────
async function renderProductDetail(id) {
  const app = document.getElementById('app');
  Loader.show(app);
  try {
    const p = await ProductAPI.get(id);
    const inStock = p.stockQuantity > 0;
    app.innerHTML = `
      <div class="container product-detail-page">
        <a href="#/shop" class="back-link">← Back to Shop</a>
        <div class="product-detail-grid glass">
          <div class="product-detail-img-wrap">
            <div class="product-detail-img-placeholder">${categoryEmoji(p.categoryName)}</div>
          </div>
          <div class="product-detail-info">
            <span class="product-category-tag">${p.categoryName ?? 'General'}</span>
            <h1 class="product-detail-name">${escHtml(p.name)}</h1>
            <p class="product-detail-desc">${escHtml(p.description ?? '')}</p>
            <div class="product-detail-stock ${inStock ? 'in-stock' : 'no-stock'}">
              ${inStock ? `✅ In Stock (${p.stockQuantity} available)` : '❌ Out of Stock'}
            </div>
            <div class="product-detail-price">${formatCurrency(p.price)}</div>
            <div class="qty-row">
              <label for="qty-input">Qty:</label>
              <div class="qty-control">
                <button class="qty-btn" id="qty-minus">−</button>
                <input type="number" id="qty-input" value="1" min="1" max="${p.stockQuantity}" class="qty-num"/>
                <button class="qty-btn" id="qty-plus">+</button>
              </div>
            </div>
            <button class="btn btn-primary btn-lg" id="detail-add-cart" ${!inStock || !CurrentUser.isLoggedIn() ? 'disabled' : ''}>
              ${!CurrentUser.isLoggedIn() ? '🔐 Login to Purchase' : '🛒 Add to Cart'}
            </button>
            ${!CurrentUser.isLoggedIn() ? `<p class="auth-hint"><a href="#/login" class="link">Login</a> to add this item to your cart.</p>` : ''}
          </div>
        </div>
      </div>`;

    const qtyInput = document.getElementById('qty-input');
    document.getElementById('qty-minus').onclick = () => { if (qtyInput.value > 1) qtyInput.value--; };
    document.getElementById('qty-plus').onclick  = () => { if (qtyInput.value < p.stockQuantity) qtyInput.value++; };

    document.getElementById('detail-add-cart').onclick = async function() {
      if (!CurrentUser.isLoggedIn()) { Router.navigate('/login'); return; }
      this.disabled = true; this.textContent = 'Adding…';
      try {
        await CartAPI.addItem(p.id, parseInt(qtyInput.value));
        Toast.success('Added to cart! 🛒');
        updateCartBadge();
        this.textContent = '✓ Added!';
        setTimeout(() => { this.disabled = false; this.textContent = '🛒 Add to Cart'; }, 1500);
      } catch(err) {
        Toast.error(err.message);
        this.disabled = false; this.textContent = '🛒 Add to Cart';
      }
    };
  } catch(err) {
    app.innerHTML = emptyState('⚠️', 'Product not found', err.message);
  }
}

// ── Helpers ───────────────────────────────────────────────
function categoryEmoji(name) {
  const n = (name ?? '').toLowerCase();
  if (n.includes('phone') || n.includes('mobile'))   return '📱';
  if (n.includes('laptop') || n.includes('computer')) return '💻';
  if (n.includes('cloth') || n.includes('fashion'))  return '👗';
  if (n.includes('shoe') || n.includes('footwear'))  return '👟';
  if (n.includes('book'))   return '📚';
  if (n.includes('food'))   return '🍔';
  if (n.includes('home'))   return '🏠';
  if (n.includes('sport'))  return '⚽';
  if (n.includes('beauty')) return '💄';
  if (n.includes('toy'))    return '🧸';
  if (n.includes('watch'))  return '⌚';
  return '📦';
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
