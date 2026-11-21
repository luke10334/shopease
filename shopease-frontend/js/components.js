// ============================================================
//  ShopEase Frontend – components.js
//  Reusable UI pieces: toast, modal, loader, etc.
// ============================================================

// ── Toast ─────────────────────────────────────────────────
const Toast = {
  _container: null,
  init() {
    if (this._container) return;
    this._container = document.createElement('div');
    this._container.id = 'toast-container';
    document.body.appendChild(this._container);
  },
  show(message, type = 'success', duration = 3500) {
    this.init();
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    el.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
    this._container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast--visible'));
    setTimeout(() => {
      el.classList.remove('toast--visible');
      el.addEventListener('transitionend', () => el.remove(), { once: true });
    }, duration);
  },
  success(msg)  { this.show(msg, 'success'); },
  error(msg)    { this.show(msg, 'error'); },
  info(msg)     { this.show(msg, 'info'); },
  warning(msg)  { this.show(msg, 'warning'); }
};

// ── Loader ────────────────────────────────────────────────
const Loader = {
  show(container) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;
    container.innerHTML = `
      <div class="loader-wrap">
        <div class="loader-spinner"></div>
        <p class="loader-text">Loading…</p>
      </div>`;
  },
  showFull() {
    let el = document.getElementById('fullscreen-loader');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fullscreen-loader';
      el.innerHTML = `<div class="loader-spinner loader-spinner--lg"></div>`;
      document.body.appendChild(el);
    }
    el.classList.add('active');
  },
  hideFull() {
    document.getElementById('fullscreen-loader')?.classList.remove('active');
  }
};

// ── Modal ─────────────────────────────────────────────────
const Modal = {
  open({ title, body, onConfirm, confirmText = 'Confirm', confirmClass = 'btn-primary' }) {
    const existing = document.getElementById('se-modal');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'se-modal';
    el.className = 'modal-backdrop';
    el.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">${body}</div>
        ${onConfirm ? `
        <div class="modal-footer">
          <button class="btn btn-ghost" id="modal-cancel-btn">Cancel</button>
          <button class="btn ${confirmClass}" id="modal-confirm-btn">${confirmText}</button>
        </div>` : ''}
      </div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    const close = () => {
      el.classList.remove('active');
      el.addEventListener('transitionend', () => el.remove(), { once: true });
    };

    el.querySelector('#modal-close-btn').onclick = close;
    el.querySelector('#modal-cancel-btn')?.addEventListener('click', close);
    el.querySelector('#modal-confirm-btn')?.addEventListener('click', () => {
      onConfirm();
      close();
    });
    el.addEventListener('click', e => { if (e.target === el) close(); });
  }
};

// ── Status badge helper ───────────────────────────────────
function statusBadge(status) {
  const map = {
    PENDING:    'badge--amber',
    CONFIRMED:  'badge--indigo',
    PROCESSING: 'badge--blue',
    SHIPPED:    'badge--teal',
    DELIVERED:  'badge--green',
    CANCELLED:  'badge--red'
  };
  return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

// ── Empty state ───────────────────────────────────────────
function emptyState(icon, title, subtitle = '') {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3 class="empty-state-title">${title}</h3>
      ${subtitle ? `<p class="empty-state-sub">${subtitle}</p>` : ''}
    </div>`;
}

// ── Format currency ───────────────────────────────────────
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

// ── Format date ───────────────────────────────────────────
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ── Pagination ────────────────────────────────────────────
function renderPagination(container, { page, totalPages }, onPageChange) {
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = `<div class="pagination">`;
  html += `<button class="pag-btn" ${page === 0 ? 'disabled' : ''} data-page="${page - 1}">&#8592; Prev</button>`;
  for (let i = 0; i < totalPages; i++) {
    html += `<button class="pag-btn ${i === page ? 'pag-btn--active' : ''}" data-page="${i}">${i + 1}</button>`;
  }
  html += `<button class="pag-btn" ${page === totalPages - 1 ? 'disabled' : ''} data-page="${page + 1}">Next &#8594;</button>`;
  html += `</div>`;
  container.innerHTML = html;
  container.querySelectorAll('.pag-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => onPageChange(parseInt(btn.dataset.page)));
  });
}
