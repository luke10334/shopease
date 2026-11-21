// ============================================================
//  ShopEase Frontend – router.js
//  Simple hash-based SPA router + navbar update
// ============================================================

const Router = {
  routes: {},

  define(routes) {
    this.routes = routes;
  },

  navigate(path) {
    window.location.hash = `#${path}`;
  },

  async resolve() {
    const raw  = window.location.hash.replace(/^#/, '') || '/shop';
    const parts = raw.split('/').filter(Boolean);
    const base  = '/' + (parts[0] ?? 'shop');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Match route
    if (base === '/product' && parts[1]) {
      await this.routes['/product']?.(parts[1]);
    } else if (this.routes[base]) {
      await this.routes[base]();
    } else {
      await this.routes['/shop']?.();
    }

    updateNavbar();
  },

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  }
};

// ── Navbar ────────────────────────────────────────────────
function updateNavbar() {
  const loggedIn = CurrentUser.isLoggedIn();
  const isAdmin  = CurrentUser.isAdmin();
  const hash     = window.location.hash;

  // Cart badge
  if (loggedIn && !isAdmin) updateCartBadge();

  // Active nav link
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.remove('nav-link--active');
    if (hash.startsWith(a.getAttribute('href'))) a.classList.add('nav-link--active');
  });

  // Auth section
  const authSection = document.getElementById('nav-auth');
  if (!authSection) return;
  if (loggedIn) {
    const user = CurrentUser.get();
    authSection.innerHTML = `
      <span class="nav-user-chip">
        <span class="nav-user-avatar">${(user?.email?.[0] ?? 'U').toUpperCase()}</span>
        <span class="nav-user-email">${user?.email ?? ''}</span>
      </span>
      ${isAdmin ? `<a href="#/admin" class="nav-link ${hash.startsWith('#/admin') ? 'nav-link--active' : ''}">Admin</a>` : ''}
      <button class="btn btn-ghost btn-sm" onclick="logout()">Logout</button>`;
  } else {
    authSection.innerHTML = `
      <a href="#/login"    class="nav-link ${hash === '#/login'    ? 'nav-link--active' : ''}">Login</a>
      <a href="#/register" class="btn btn-primary btn-sm">Sign Up</a>`;
  }
}

async function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge || !CurrentUser.isLoggedIn() || CurrentUser.isAdmin()) return;
  try {
    const cart  = await CartAPI.get();
    const count = (cart.items ?? []).length;
    badge.textContent = count > 0 ? count : '';
    badge.style.display = count > 0 ? 'flex' : 'none';
  } catch { badge.style.display = 'none'; }
}
