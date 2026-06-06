/* ═══════════════════════════════════════════════
   PLANIFY — script.js
   Full working Task Manager + Auth Simulation
═══════════════════════════════════════════════ */
 
const App = (() => {
 
  /* ─────────────────────────────────────────
     STATE
  ───────────────────────────────────────── */
  let state = {
    currentFilter: 'all',
    sortBy: 'date',
    searchQuery: '',
    tasks: [],
    user: null,
  };
 
  /* ─────────────────────────────────────────
     INIT
  ───────────────────────────────────────── */
  function init() {
    setupRipple();
    showSplash();
    setDate();
  }
 
  function showSplash() {
    const splash = document.getElementById('splash');
    // Wait for loader animation (≈2.5s) then decide screen
    setTimeout(() => {
      splash.style.opacity = '0';
      splash.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        splash.classList.add('hidden');
        const savedUser = getSavedUser();
        if (savedUser) {
          state.user = savedUser;
          loadTasks();
          showDashboard();
        } else {
          showAuth();
        }
      }, 500);
    }, 2600);
  }
 
  /* ─────────────────────────────────────────
     SCREEN MANAGEMENT
  ───────────────────────────────────────── */
  function showAuth() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    initAuthTabs();
  }
 
  function showDashboard() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    renderUserInfo();
    renderAll();
    setDate();
  }
 
  function setDate() {
    const el = document.getElementById('topbar-date');
    if (!el) return;
    const now = new Date();
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    el.textContent = now.toLocaleDateString('tr-TR', opts);
  }
 
  /* ─────────────────────────────────────────
     AUTH TABS
  ───────────────────────────────────────── */
  function initAuthTabs() {
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.querySelectorAll('.auth-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById('panel-' + target).classList.remove('hidden');
      });
    });
  }
 
  /* ─────────────────────────────────────────
     AUTH — LOGIN / REGISTER / LOGOUT
  ───────────────────────────────────────── */
  function login() {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-pass').value;
 
    if (!email || !pass) { showToast('E-posta ve şifre boş bırakılamaz.', 'error'); return; }
    if (!isValidEmail(email)) { showToast('Geçerli bir e-posta girin.', 'error'); return; }
    if (pass.length < 6)  { showToast('Şifre en az 6 karakter olmalı.', 'error'); return; }
 
    // Simulate login — if user exists in LS use it, else create a demo user
    let user = getSavedUser();
    if (!user) {
      user = { firstName: 'Demo', lastName: 'Kullanıcı', email, dob: '1990-01-01', via: 'email' };
    }
 
    saveUser(user);
    state.user = user;
    loadTasks();
    showToast('Hoş geldiniz, ' + user.firstName + '! 👋', 'success');
    showDashboard();
  }
 
  function register() {
    const firstName = document.getElementById('reg-firstname').value.trim();
    const lastName  = document.getElementById('reg-lastname').value.trim();
    const dob       = document.getElementById('reg-dob').value;
    const email     = document.getElementById('reg-email').value.trim();
    const pass      = document.getElementById('reg-pass').value;
 
    if (!firstName || !lastName) { showToast('Ad ve soyad gerekli.', 'error'); return; }
    if (!dob)  { showToast('Doğum tarihi gerekli.', 'error'); return; }
    if (!email || !isValidEmail(email)) { showToast('Geçerli bir e-posta girin.', 'error'); return; }
    if (pass.length < 6) { showToast('Şifre en az 6 karakter olmalı.', 'error'); return; }
 
    const user = { firstName, lastName, email, dob, via: 'email' };
    saveUser(user);
    state.user = user;
    loadTasks();
    showToast('Hesabınız oluşturuldu! 🎉', 'success');
    showDashboard();
  }
 
  function socialLogin(provider) {
    // Simulate social login
    const names = { Google: ['Ali', 'Yılmaz'], Facebook: ['Ayşe', 'Kaya'] };
    const [fn, ln] = names[provider];
    const user = {
      firstName: fn, lastName: ln,
      email: fn.toLowerCase() + '@example.com',
      dob: '1995-06-15', via: provider
    };
    saveUser(user);
    state.user = user;
    loadTasks();
    showToast(provider + ' ile giriş yapıldı! 🚀', 'success');
    showDashboard();
  }
 
  function logout() {
    if (!confirm('Çıkış yapmak istediğinize emin misiniz?')) return;
    state.user = null;
    state.tasks = [];
    state.currentFilter = 'all';
    localStorage.removeItem('planify_user');
    showToast('Başarıyla çıkış yapıldı.', 'info');
    showAuth();
  }
 
  function togglePass(btn) {
    const input = btn.previousElementSibling;
    const icon  = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fa fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fa fa-eye';
    }
  }
 
  /* ─────────────────────────────────────────
     USER INFO RENDER
  ───────────────────────────────────────── */
  function renderUserInfo() {
    const { firstName, lastName } = state.user;
    const initials = (firstName[0] + (lastName ? lastName[0] : '')).toUpperCase();
    const fullName = firstName + ' ' + (lastName || '');
 
    const avatarEl = document.getElementById('user-avatar-initial');
    const nameEl   = document.getElementById('sidebar-username');
    const topAvatar = document.getElementById('topbar-avatar');
 
    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl)   nameEl.textContent   = fullName;
    if (topAvatar) topAvatar.textContent = initials;
  }
 
  /* ─────────────────────────────────────────
     TASKS — CRUD
  ───────────────────────────────────────── */
  function addTask() {
    const titleEl    = document.getElementById('task-title');
    const descEl     = document.getElementById('task-desc');
    const typeEl     = document.getElementById('task-type');
    const priorityEl = document.getElementById('task-priority');
 
    const title = titleEl.value.trim();
    if (!title) { showToast('Görev başlığı boş bırakılamaz.', 'error'); titleEl.focus(); return; }
 
    const task = {
      id:        Date.now().toString(),
      title,
      desc:      descEl.value.trim(),
      type:      typeEl.value,
      priority:  priorityEl.value,
      completed: false,
      createdAt: new Date().toISOString(),
    };
 
    state.tasks.unshift(task);
    saveTasks();
    renderAll();
 
    // Clear inputs
    titleEl.value = '';
    descEl.value  = '';
 
    showToast('Görev eklendi! ✅', 'success');
  }
 
  function deleteTask(id) {
    const card = document.querySelector('[data-task-id="' + id + '"]');
    if (card) {
      card.classList.add('removing');
      setTimeout(() => {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveTasks();
        renderAll();
      }, 300);
    } else {
      state.tasks = state.tasks.filter(t => t.id !== id);
      saveTasks();
      renderAll();
    }
    showToast('Görev silindi.', 'warning');
  }
 
  function toggleComplete(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveTasks();
    renderAll();
    showToast(task.completed ? 'Tamamlandı! 🎉' : 'Tekrar açıldı.', task.completed ? 'success' : 'info');
  }
 
  /* ─────────────────────────────────────────
     FILTERS & SORT
  ───────────────────────────────────────── */
  function setFilter(filter, el) {
    state.currentFilter = filter;
    state.searchQuery   = '';
    document.getElementById('search-input').value = '';
 
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
 
    const labels = {
      all: 'Tüm Görevler', active: 'Aktif Görevler',
      daily: 'Günlük Görevler', weekly: 'Haftalık Görevler',
      monthly: 'Aylık Görevler', yearly: 'Yıllık Görevler',
      completed: 'Tamamlanan Görevler',
    };
    document.getElementById('topbar-title').textContent   = labels[filter] || filter;
    document.getElementById('task-list-label').textContent = labels[filter] || filter;
 
    renderTaskList();
  }
 
  function setSortBy(by, btn) {
    state.sortBy = by;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderTaskList();
  }
 
  function search(q) {
    state.searchQuery = q.toLowerCase();
    renderTaskList();
  }
 
  /* ─────────────────────────────────────────
     FILTER LOGIC
  ───────────────────────────────────────── */
  function getFilteredTasks() {
    let tasks = [...state.tasks];
 
    // Filter
    switch (state.currentFilter) {
      case 'all':       break;
      case 'active':    tasks = tasks.filter(t => !t.completed); break;
      case 'completed': tasks = tasks.filter(t =>  t.completed); break;
      default:          tasks = tasks.filter(t => t.type === state.currentFilter);
    }
 
    // Search
    if (state.searchQuery) {
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(state.searchQuery) ||
        (t.desc && t.desc.toLowerCase().includes(state.searchQuery))
      );
    }
 
    // Sort
    tasks.sort((a, b) => {
      switch (state.sortBy) {
        case 'priority': {
          const p = { high: 0, medium: 1, low: 2 };
          return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
        }
        case 'name': return a.title.localeCompare(b.title, 'tr');
        default:     return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
 
    return tasks;
  }
 
  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  function renderAll() {
    updateCounts();
    updateStats();
    renderTaskList();
  }
 
  function renderTaskList() {
    const list     = document.getElementById('task-list');
    const emptyEl  = document.getElementById('empty-state');
    const tasks    = getFilteredTasks();
 
    if (tasks.length === 0) {
      list.innerHTML = '';
      emptyEl.classList.remove('hidden');
    } else {
      emptyEl.classList.add('hidden');
      list.innerHTML = tasks.map(renderTaskCard).join('');
    }
  }
 
  function renderTaskCard(task) {
    const priorityColor = { high: '#f87171', medium: '#fb923c', low: '#34d399' }[task.priority] || '#60a5fa';
    const priorityLabel = { high: 'Yüksek', medium: 'Orta', low: 'Düşük' }[task.priority];
    const typeLabel = { daily:'Günlük', weekly:'Haftalık', monthly:'Aylık', yearly:'Yıllık' }[task.type] || task.type;
    const dateStr = formatDate(task.createdAt);
 
    return `
    <div class="task-card${task.completed ? ' completed' : ''}"
         data-task-id="${task.id}"
         style="--priority-color:${priorityColor}">
 
      <div class="task-check${task.completed ? ' done' : ''}"
           onclick="App.toggleComplete('${task.id}')">
        <i class="fa fa-check"></i>
      </div>
 
      <div class="task-body">
        <div class="task-title">${escHtml(task.title)}</div>
        ${task.desc ? `<div class="task-desc">${escHtml(task.desc)}</div>` : ''}
        <div class="task-meta">
          <span class="task-badge badge-${task.type}">${typeLabel}</span>
          <span class="priority-dot" style="--dot-c:${priorityColor}">${priorityLabel}</span>
          <span class="task-date">${dateStr}</span>
        </div>
      </div>
 
      <div class="task-actions">
        <button class="task-btn check ripple" onclick="App.toggleComplete('${task.id}')" title="${task.completed ? 'Geri Al' : 'Tamamla'}">
          <i class="fa ${task.completed ? 'fa-rotate-left' : 'fa-check'}"></i>
        </button>
        <button class="task-btn delete ripple" onclick="App.deleteTask('${task.id}')" title="Sil">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    </div>`;
  }
 
  function updateCounts() {
    const all       = state.tasks.length;
    const active    = state.tasks.filter(t => !t.completed).length;
    const completed = state.tasks.filter(t =>  t.completed).length;
    const daily     = state.tasks.filter(t => t.type === 'daily').length;
    const weekly    = state.tasks.filter(t => t.type === 'weekly').length;
    const monthly   = state.tasks.filter(t => t.type === 'monthly').length;
    const yearly    = state.tasks.filter(t => t.type === 'yearly').length;
 
    setEl('cnt-all',       all);
    setEl('cnt-active',    active);
    setEl('cnt-completed', completed);
    setEl('cnt-daily',     daily);
    setEl('cnt-weekly',    weekly);
    setEl('cnt-monthly',   monthly);
    setEl('cnt-yearly',    yearly);
  }
 
  function updateStats() {
    const total     = state.tasks.length;
    const done      = state.tasks.filter(t => t.completed).length;
    const active    = total - done;
    const rate      = total > 0 ? Math.round((done / total) * 100) : 0;
 
    setEl('stat-total',  total);
    setEl('stat-done',   done);
    setEl('stat-active', active);
    setEl('stat-rate',   '%' + rate);
    setEl('progress-pct', rate + '%');
 
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = rate + '%';
  }
 
  /* ─────────────────────────────────────────
     SIDEBAR TOGGLE (mobile)
  ───────────────────────────────────────── */
  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
  }
  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
  }
 
  /* ─────────────────────────────────────────
     TOAST NOTIFICATIONS
  ───────────────────────────────────────── */
  function showToast(message, type = 'info') {
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const container = document.getElementById('toast-container');
 
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = `<i class="fa ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);
 
    setTimeout(() => {
      toast.classList.add('out');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
 
  /* ─────────────────────────────────────────
     RIPPLE EFFECT
  ───────────────────────────────────────── */
  function setupRipple() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.ripple');
      if (!btn) return;
 
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x    = e.clientX - rect.left - size / 2;
      const y    = e.clientY - rect.top  - size / 2;
 
      const wave = document.createElement('span');
      wave.className = 'ripple-wave';
      wave.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
      btn.appendChild(wave);
      wave.addEventListener('animationend', () => wave.remove());
    });
  }
 
  /* ─────────────────────────────────────────
     LOCAL STORAGE
  ───────────────────────────────────────── */
  function saveUser(user)    { localStorage.setItem('planify_user', JSON.stringify(user)); }
  function getSavedUser()    { try { return JSON.parse(localStorage.getItem('planify_user')); } catch { return null; } }
 
  function saveTasks() {
    const key = 'planify_tasks_' + (state.user?.email || 'guest');
    localStorage.setItem(key, JSON.stringify(state.tasks));
  }
 
  function loadTasks() {
    const key = 'planify_tasks_' + (state.user?.email || 'guest');
    try {
      state.tasks = JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      state.tasks = [];
    }
    if (state.tasks.length === 0) seedDemoTasks();
  }
 
  function seedDemoTasks() {
    const now = new Date();
    state.tasks = [
      { id: 'd1', title: 'Sabah sporu yap', desc: '30 dakika koşu', type: 'daily',   priority: 'high',   completed: false, createdAt: new Date(now - 1e6).toISOString() },
      { id: 'd2', title: 'E-postaları kontrol et', desc: '', type: 'daily',   priority: 'medium', completed: true,  createdAt: new Date(now - 2e6).toISOString() },
      { id: 'w1', title: 'Proje sunumunu hazırla', desc: 'Q3 raporu', type: 'weekly',  priority: 'high',   completed: false, createdAt: new Date(now - 5e6).toISOString() },
      { id: 'w2', title: 'Haftalık alışveriş', desc: '', type: 'weekly',  priority: 'low',    completed: false, createdAt: new Date(now - 6e6).toISOString() },
      { id: 'm1', title: 'Fatura ödemeleri', desc: 'Elektrik, su, internet', type: 'monthly', priority: 'high',   completed: false, createdAt: new Date(now - 8e6).toISOString() },
      { id: 'm2', title: 'Performans değerlendirmesi', desc: '', type: 'monthly', priority: 'medium', completed: true,  createdAt: new Date(now - 9e6).toISOString() },
      { id: 'y1', title: 'Yıllık hedefleri belirle', desc: 'Kariyer ve kişisel gelişim', type: 'yearly',  priority: 'high',   completed: false, createdAt: new Date(now - 1e7).toISOString() },
      { id: 'y2', title: 'Tatil planı yap', desc: '', type: 'yearly',  priority: 'low',    completed: false, createdAt: new Date(now - 2e7).toISOString() },
    ];
    saveTasks();
  }
 
  /* ─────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────── */
  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
 
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
 
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
 
  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('tr-TR', { day:'2-digit', month:'short', year:'numeric' });
    } catch { return ''; }
  }
 
  /* ─────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────── */
  return {
    init,
    login, register, logout,
    socialLogin, togglePass,
    addTask, deleteTask, toggleComplete,
    setFilter, setSortBy, search,
    toggleSidebar, closeSidebar,
    showToast,
  };
 
})();
 
/* Start the app */
document.addEventListener('DOMContentLoaded', App.init);
