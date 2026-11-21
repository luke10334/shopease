// ============================================================
//  ShopEase Frontend – auth.js
//  Login, Register, Logout logic.
// ============================================================

function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card glass">
        <div class="auth-logo">
          <span class="logo-icon">🛒</span>
          <span class="logo-text">ShopEase</span>
        </div>
        <h1 class="auth-title">Welcome back</h1>
        <p class="auth-sub">Sign in to your account</p>

        <form id="login-form" class="auth-form" novalidate>
          <div class="form-group">
            <label for="login-email">Email</label>
            <input type="email" id="login-email" placeholder="you@example.com" autocomplete="email" required />
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <div class="input-pw-wrap">
              <input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password" required />
              <button type="button" class="pw-toggle" data-target="login-password">👁</button>
            </div>
          </div>
          <p id="login-error" class="form-error hidden"></p>
          <button type="submit" class="btn btn-primary btn-block" id="login-btn">Sign In</button>
        </form>

        <p class="auth-footer">Don't have an account? <a href="#/register" class="link">Register</a></p>

        <div class="auth-divider"><span>Quick access</span></div>
        <div class="auth-demo-creds">
          <button class="demo-btn" onclick="fillDemo('admin@shopease.com','Admin@123')">🔑 Login as Admin</button>
          <button class="demo-btn" onclick="fillDemo('john@example.com','User@1234')">👤 Login as User</button>
        </div>
      </div>
    </div>`;

  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.target);
      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.textContent = inp.type === 'password' ? '👁' : '🙈';
    });
  });

  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl    = document.getElementById('login-error');
    const btn      = document.getElementById('login-btn');
    errEl.classList.add('hidden');
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      const data = await AuthAPI.login(email, password);
      Token.set(data.accessToken);
      const payload = decodeJwt(data.accessToken);
      CurrentUser.set({ email, role: payload?.role, userId: payload?.userId });
      updateNavbar();
      Toast.success('Welcome back! 👋');
      Router.navigate(CurrentUser.isAdmin() ? '/admin' : '/shop');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'Sign In';
    }
  });
}

window.fillDemo = function(email, pw) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = pw;
};

function renderRegister() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card glass">
        <div class="auth-logo">
          <span class="logo-icon">🛒</span>
          <span class="logo-text">ShopEase</span>
        </div>
        <h1 class="auth-title">Create account</h1>
        <p class="auth-sub">Join ShopEase today</p>

        <form id="register-form" class="auth-form" novalidate>
          <div class="form-group">
            <label for="reg-name">Full Name</label>
            <input type="text" id="reg-name" placeholder="John Doe" required />
          </div>
          <div class="form-group">
            <label for="reg-email">Email</label>
            <input type="email" id="reg-email" placeholder="you@example.com" required />
          </div>
          <div class="form-group">
            <label for="reg-password">Password</label>
            <div class="input-pw-wrap">
              <input type="password" id="reg-password" placeholder="Min 6 characters" required />
              <button type="button" class="pw-toggle" data-target="reg-password">👁</button>
            </div>
          </div>
          <p id="reg-error" class="form-error hidden"></p>
          <button type="submit" class="btn btn-primary btn-block" id="reg-btn">Create Account</button>
        </form>

        <p class="auth-footer">Already have an account? <a href="#/login" class="link">Sign In</a></p>
      </div>
    </div>`;

  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.target);
      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.textContent = inp.type === 'password' ? '👁' : '🙈';
    });
  });

  document.getElementById('register-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errEl    = document.getElementById('reg-error');
    const btn      = document.getElementById('reg-btn');
    errEl.classList.add('hidden');
    btn.disabled = true; btn.textContent = 'Creating account…';
    try {
      await AuthAPI.register({ name, email, password });
      Toast.success('Account created! Please log in.');
      Router.navigate('/login');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'Create Account';
    }
  });
}

function logout() {
  Token.clear();
  updateNavbar();
  Toast.info('Logged out successfully.');
  Router.navigate('/shop');
}
