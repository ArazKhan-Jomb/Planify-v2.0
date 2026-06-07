/* ═══════════════════════════════════════════════════
   ARAZION — script.js v2.1 FIXED
═══════════════════════════════════════════════════ */

/* ─── FIREBASE CONFIG ─── */
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "arazion-xxx.firebaseapp.com",
  projectId:         "arazion-xxx",
  storageBucket:     "arazion-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};

/* ─── DEMO MODE ─── */
const DEMO_MODE = true; // Firebase hazır olunca false yapın

/* ─── FIREBASE INIT ─── */
let auth, db;
if (!DEMO_MODE) {
  try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db   = firebase.firestore();
  } catch(e) {
    console.warn('Firebase init failed:', e);
  }
}

/* ─── DEMO USER ─── */
const DEMO_USER = {
  uid: 'demo-user-001',
  email: 'demo@arazion.app',
  displayName: 'Demo Kullanıcı'
};

/* ─── LOCAL STORAGE HELPERS ─── */
const LS = {
  get:    (k, def) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; } catch { return def; } },
  set:    (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) { console.warn('LS.set error:', e); } },
  remove: (k)      => { try { localStorage.removeItem(k); } catch {} },
};

/* ─── GLOBAL STATE ─── */
const State = {
  user:         null,
  profile:      null,
  tasks:        [],
  notes:        [],
  filter:       'all',
  sort:         'date',
  theme:        'dark',
  xp:           0,
  level:        1,
  streak:       0,
  pomodoros:    0,
  achievements: [],
};

/* ═══════════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  Boot.start();
});

const Boot = {
  start() {
    this.initParticles();
    UI.initRipple();
    this.runIntro(() => {
      this.runSplash(() => {
        if (DEMO_MODE) {
          this.checkDemoSession();
        } else {
          if (!auth) { this.checkDemoSession(); return; }
          auth.onAuthStateChanged(user => {
            if (user) {
              State.user = user;
              App.loadAndEnter();
            } else {
              UI.show('auth-screen');
              Auth.initTabs();
            }
          });
        }
      });
    });
  },

  checkDemoSession() {
    const saved = LS.get('arazion_demo_session', null);
    if (saved) {
      State.user = DEMO_USER;
      App.loadAndEnter();
    } else {
      UI.show('auth-screen');
      // Kısa gecikme ile tab'ları başlat — DOM'un hazır olmasını garantile
      setTimeout(() => Auth.initTabs(), 50);
    }
  },

  initParticles() {
    const container = document.getElementById('araz-particles');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'araz-particle';
      const size = Math.random() * 4 + 2;
      p.style.cssText = `
        width:${size}px;height:${size}px;
        left:${Math.random()*100}%;
        bottom:${Math.random()*20}%;
        animation-duration:${Math.random()*6+4}s;
        animation-delay:${Math.random()*4}s;
        opacity:${Math.random()*.7+.3};
      `;
      container.appendChild(p);
    }
  },

  runIntro(cb) {
    const el = document.getElementById('by-araz');
    if (!el) { cb(); return; }
    el.classList.remove('hidden');
    setTimeout(() => {
      el.style.transition = 'opacity 0.6s ease';
      el.style.opacity = '0';
      setTimeout(() => {
        el.classList.add('hidden');
        el.style.opacity = '';
        cb();
      }, 650);
    }, 2800);
  },

  runSplash(cb) {
    const el     = document.getElementById('splash');
    const fill   = document.getElementById('splash-fill');
    const status = document.getElementById('splash-status');
    if (!el) { cb(); return; }
    el.classList.remove('hidden');

    const msgs = ['Başlatılıyor...', 'Modüller yükleniyor...', 'Veriler hazırlanıyor...', 'Neredeyse hazır...'];
    let pct = 0, mi = 0;
    const iv = setInterval(() => {
      pct += Math.random() * 20 + 10;
      if (pct > 100) pct = 100;
      if (fill) fill.style.width = pct + '%';
      if (mi < msgs.length - 1 && pct > (mi + 1) * 25) {
        mi++;
        if (status) status.textContent = msgs[mi];
      }
      if (pct >= 100) {
        clearInterval(iv);
        setTimeout(() => {
          el.style.transition = 'opacity 0.5s ease';
          el.style.opacity = '0';
          setTimeout(() => {
            el.classList.add('hidden');
            el.style.opacity = '';
            cb();
          }, 520);
        }, 350);
      }
    }, 180);
  }
};

/* ═══════════════════════════════════════════════════
   UI HELPERS
═══════════════════════════════════════════════════ */
const UI = {
  show(id) {
    ['auth-screen', 'onboarding', 'dashboard'].forEach(s => {
      const el = document.getElementById(s);
      if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
  },

  setDate() {
    const el = document.getElementById('page-date');
    if (!el) return;
    el.textContent = new Date().toLocaleDateString('tr-TR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  },

  toast(msg, type = 'info', icon = null) {
    const icons = {
      success: 'fa-check-circle',
      error:   'fa-times-circle',
      warning: 'fa-triangle-exclamation',
      info:    'fa-circle-info',
      xp:      'fa-star'
    };
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fa ${icon || icons[type] || icons.info}"></i><span>${msg}</span>`;
    container.appendChild(t);
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 320);
    }, 3200);
  },

  togglePass(btn) {
    if (!btn) return;
    const inp  = btn.previousElementSibling;
    const icon = btn.querySelector('i');
    if (!inp || !icon) return;
    if (inp.type === 'password') {
      inp.type = 'text';
      icon.className = 'fa fa-eye-slash';
    } else {
      inp.type = 'password';
      icon.className = 'fa fa-eye';
    }
  },

  setAvatar(el, user, profile) {
    if (!el) return;
    if (profile?.photoURL && profile.photoURL.length < 200000) {
      el.innerHTML = `<img src="${profile.photoURL}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      const name = profile?.firstName || user?.displayName || user?.email || '?';
      el.innerHTML = '';
      el.textContent = name.charAt(0).toUpperCase();
    }
  },

  initRipple() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.ripple');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const wave = document.createElement('span');
      wave.className = 'ripple-wave';
      const size = Math.max(rect.width, rect.height) * 2;
      wave.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
      btn.appendChild(wave);
      setTimeout(() => wave.remove(), 650);
    });
  },

  closeLevelUp() {
    document.getElementById('levelup-modal')?.classList.add('hidden');
  },

  showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
  }
};

/* ═══════════════════════════════════════════════════
   AUTH MODULE
═══════════════════════════════════════════════════ */
const Auth = {
  _tabsInited: false,

  initTabs() {
    // Tekrar tekrar listener eklenmesini önle
    if (this._tabsInited) {
      this._resetForms();
      return;
    }
    this._tabsInited = true;

    // Tab geçişi
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-panel').forEach(p => p.classList.add('hidden'));
        tab.classList.add('active');
        const panel = document.getElementById(`panel-${tab.dataset.tab}`);
        if (panel) panel.classList.remove('hidden');
      });
    });

    // Şifre güçlülüğü
    const passInp = document.getElementById('r-pass');
    if (passInp) {
      passInp.addEventListener('input', () => this._checkStrength(passInp.value));
    }

    // Enter tuşu desteği
    const lEmail = document.getElementById('l-email');
    const lPass  = document.getElementById('l-pass');
    if (lEmail) lEmail.addEventListener('keydown', e => { if (e.key === 'Enter') this.login(); });
    if (lPass)  lPass.addEventListener('keydown',  e => { if (e.key === 'Enter') this.login(); });

    const rEmail = document.getElementById('r-email');
    const rPass  = document.getElementById('r-pass');
    if (rEmail) rEmail.addEventListener('keydown', e => { if (e.key === 'Enter') this.register(); });
    if (rPass)  rPass.addEventListener('keydown',  e => { if (e.key === 'Enter') this.register(); });

    this._resetForms();
  },

  _resetForms() {
    // Hata mesajlarını temizle
    ['login-error', 'register-error'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    // Butonları sıfırla
    ['btn-login', 'btn-register'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.remove('btn-loading');
    });
    // İlk tab'ı aktif et
    document.querySelectorAll('.auth-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
    document.querySelectorAll('.auth-panel').forEach((p, i) => p.classList.toggle('hidden', i !== 0));
  },

  _checkStrength(val) {
    const bar   = document.getElementById('ps-bar');
    const label = document.getElementById('ps-label');
    if (!bar) return;
    let score = 0;
    if (val.length >= 8)         score++;
    if (/[A-Z]/.test(val))       score++;
    if (/[0-9]/.test(val))       score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const clrs = ['#f87171', '#fb923c', '#fbbf24', '#34d399'];
    const lbls = ['Çok Zayıf', 'Zayıf', 'Orta', 'Güçlü'];
    bar.style.width      = (score * 25) + '%';
    bar.style.background = clrs[score - 1] || '#f87171';
    if (label) label.textContent = val.length ? (lbls[score - 1] || '') : '';
  },

  async login() {
    const emailEl = document.getElementById('l-email');
    const passEl  = document.getElementById('l-pass');
    const btn     = document.getElementById('btn-login');

    const email = emailEl?.value.trim() || '';
    const pass  = passEl?.value || '';

    // Validasyon
    if (!email) { UI.showError('login-error', 'E-posta adresi gerekli.'); emailEl?.focus(); return; }
    if (!this._validEmail(email)) { UI.showError('login-error', 'Geçerli bir e-posta adresi girin.'); emailEl?.focus(); return; }
    if (!pass)  { UI.showError('login-error', 'Şifre gerekli.'); passEl?.focus(); return; }

    if (btn) btn.classList.add('btn-loading');

    if (DEMO_MODE) {
      await this._delay(900);
      if (btn) btn.classList.remove('btn-loading');
      State.user = { ...DEMO_USER, email };
      LS.set('arazion_demo_session', { email, ts: Date.now() });
      App.loadAndEnter();
      return;
    }

    try {
      const remember = document.getElementById('remember-me')?.checked;
      const pers = remember
        ? firebase.auth.Auth.Persistence.LOCAL
        : firebase.auth.Auth.Persistence.SESSION;
      await auth.setPersistence(pers);
      await auth.signInWithEmailAndPassword(email, pass);
      // onAuthStateChanged devreye girer
    } catch (err) {
      if (btn) btn.classList.remove('btn-loading');
      UI.showError('login-error', this._errMsg(err.code));
    }
  },

  async register() {
    const fnEl    = document.getElementById('r-fn');
    const lnEl    = document.getElementById('r-ln');
    const dobEl   = document.getElementById('r-dob');
    const emailEl = document.getElementById('r-email');
    const passEl  = document.getElementById('r-pass');
    const btn     = document.getElementById('btn-register');

    const fn    = fnEl?.value.trim()    || '';
    const ln    = lnEl?.value.trim()    || '';
    const dob   = dobEl?.value          || '';
    const email = emailEl?.value.trim() || '';
    const pass  = passEl?.value         || '';

    // Validasyon
    if (!fn)    { UI.showError('register-error', 'Ad gerekli.');                  fnEl?.focus();    return; }
    if (!email) { UI.showError('register-error', 'E-posta adresi gerekli.');      emailEl?.focus(); return; }
    if (!this._validEmail(email)) { UI.showError('register-error', 'Geçerli bir e-posta adresi girin.'); emailEl?.focus(); return; }
    if (!pass)  { UI.showError('register-error', 'Şifre gerekli.');               passEl?.focus();  return; }
    if (pass.length < 8) { UI.showError('register-error', 'Şifre en az 8 karakter olmalı.'); passEl?.focus(); return; }

    if (btn) btn.classList.add('btn-loading');

    if (DEMO_MODE) {
      await this._delay(900);
      if (btn) btn.classList.remove('btn-loading');
      State.user = { ...DEMO_USER, email };
      const profile = {
        firstName: fn, lastName: ln, dob, email,
        onboarded: false, xp: 0, level: 1, streak: 0,
        theme: 'dark', pomodoros: 0, achievements: [],
        createdAt: new Date().toISOString()
      };
      LS.set('arazion_profile', profile);
      LS.set('arazion_demo_session', { email, ts: Date.now() });
      State.profile = profile;
      Onboarding.start();
      return;
    }

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      const uid  = cred.user.uid;
      await db.collection('users').doc(uid).set({
        firstName: fn, lastName: ln, dob, email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        xp: 0, level: 1, streak: 0, theme: 'dark',
        onboarded: false, pomodoros: 0, achievements: []
      });
      State.user = cred.user;
      await App.loadProfile();
      Onboarding.start();
    } catch (err) {
      if (btn) btn.classList.remove('btn-loading');
      UI.showError('register-error', this._errMsg(err.code));
    }
  },

  async googleLogin() {
    if (DEMO_MODE) {
      State.user = { ...DEMO_USER };
      LS.set('arazion_demo_session', { ts: Date.now() });
      await App.loadAndEnter();
      return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await auth.signInWithPopup(provider);
      const user   = result.user;
      const docRef = db.collection('users').doc(user.uid);
      const snap   = await docRef.get();
      if (!snap.exists) {
        const parts = (user.displayName || '').split(' ');
        await docRef.set({
          firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '',
          email: user.email, photoURL: user.photoURL || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          xp: 0, level: 1, streak: 0, theme: 'dark',
          onboarded: false, pomodoros: 0, achievements: []
        });
        State.user = user;
        await App.loadProfile();
        Onboarding.start();
      }
      // Varolan kullanıcıyı onAuthStateChanged yönetir
    } catch (err) {
      UI.toast('Google girişi başarısız: ' + err.message, 'error');
    }
  },

  async forgotPassword() {
    const email = document.getElementById('l-email')?.value.trim() || '';
    if (!email) { UI.toast('Önce e-posta adresinizi girin.', 'warning'); return; }
    if (!this._validEmail(email)) { UI.toast('Geçerli bir e-posta adresi girin.', 'warning'); return; }
    if (DEMO_MODE) { UI.toast('Demo modda şifre sıfırlama çalışmaz.', 'info'); return; }
    try {
      await auth.sendPasswordResetEmail(email);
      UI.toast('Şifre sıfırlama e-postası gönderildi!', 'success');
    } catch (err) {
      UI.toast(this._errMsg(err.code), 'error');
    }
  },

  async logout() {
    if (!confirm('Çıkış yapmak istiyor musunuz?')) return;
    Pomodoro.stop();

    if (DEMO_MODE) {
      LS.remove('arazion_demo_session');
    } else {
      try { await auth.signOut(); } catch(e) {}
    }

    // State sıfırla
    State.user = null; State.profile = null;
    State.tasks = []; State.notes = [];
    State.xp = 0; State.level = 1; State.streak = 0; State.achievements = [];

    UI.show('auth-screen');
    this._tabsInited = false; // Tekrar initTabs için izin ver
    setTimeout(() => Auth.initTabs(), 50);
    UI.toast('Çıkış yapıldı.', 'info');
  },

  _validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); },

  _errMsg(code) {
    const m = {
      'auth/user-not-found':        'Bu e-posta ile kayıtlı hesap bulunamadı.',
      'auth/wrong-password':        'Hatalı şifre.',
      'auth/invalid-credential':    'Hatalı e-posta veya şifre.',
      'auth/invalid-email':         'Geçersiz e-posta adresi.',
      'auth/email-already-in-use':  'Bu e-posta zaten kullanımda.',
      'auth/weak-password':         'Şifre çok zayıf. En az 6 karakter kullanın.',
      'auth/too-many-requests':     'Çok fazla deneme. Lütfen biraz bekleyin.',
      'auth/network-request-failed':'Ağ hatası. İnternet bağlantınızı kontrol edin.',
      'auth/user-disabled':         'Bu hesap devre dışı bırakılmış.',
      'auth/operation-not-allowed': 'Bu giriş yöntemi etkin değil.',
    };
    return m[code] || `Bir hata oluştu (${code}). Tekrar deneyin.`;
  }
};

/* ═══════════════════════════════════════════════════
   APP MODULE
═══════════════════════════════════════════════════ */
const App = {
  async loadAndEnter() {
    await this.loadProfile();
    if (!State.profile?.onboarded) {
      Onboarding.start();
    } else {
      this.enterDashboard();
    }
  },

  async loadProfile() {
    const uid = State.user?.uid;
    if (!uid) return;

    if (DEMO_MODE) {
      let p = LS.get('arazion_profile', null);
      if (!p) {
        p = {
          firstName: 'Demo', lastName: 'Kullanıcı',
          email: State.user.email || 'demo@arazion.app',
          onboarded: true, xp: 120, level: 2, streak: 3,
          theme: 'dark', pomodoros: 2, achievements: ['first_task'],
          createdAt: new Date().toISOString()
        };
        LS.set('arazion_profile', p);
      }
      State.profile      = p;
      State.xp           = p.xp           || 0;
      State.level        = p.level        || 1;
      State.streak       = p.streak       || 0;
      State.theme        = p.theme        || 'dark';
      State.pomodoros    = p.pomodoros    || 0;
      State.achievements = p.achievements || [];
      Settings.applyTheme(State.theme);
      return;
    }

    try {
      const snap = await db.collection('users').doc(uid).get();
      if (snap.exists) {
        const p = snap.data();
        State.profile      = p;
        State.xp           = p.xp           || 0;
        State.level        = p.level        || 1;
        State.streak       = p.streak       || 0;
        State.theme        = p.theme        || 'dark';
        State.pomodoros    = p.pomodoros    || 0;
        State.achievements = p.achievements || [];
        Settings.applyTheme(State.theme);
      }
    } catch(e) {
      console.error('loadProfile error:', e);
    }
  },

  enterDashboard() {
    UI.show('dashboard');
    this._updateSidebar();
    Tasks.load();
    Notes.load();
    Calendar.render();
    Achievements.render();
    Profile.render();
    Notifications.init();
    Gamification.updateXPBar();
    Streak.check();
    this.showSection('tasks');
    UI.setDate();
  },

  _updateSidebar() {
    const p    = State.profile;
    const u    = State.user;
    const name = p
      ? `${p.firstName || ''} ${p.lastName || ''}`.trim()
      : (u?.displayName || u?.email || '');

    const s = id => document.getElementById(id);
    if (s('sb-name'))    s('sb-name').textContent    = name || 'Kullanıcı';
    if (s('streak-val')) s('streak-val').textContent = State.streak;

    [s('sb-avatar'), s('tb-avatar'), s('prof-avatar-big')].forEach(el => {
      if (el) UI.setAvatar(el, u, p);
    });
  },

  showSection(sec) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`sec-${sec}`);
    if (target) target.classList.remove('hidden');

    const titles = {
      tasks: 'Görevler', calendar: 'Takvim', notes: 'Not Defteri',
      pomodoro: 'Pomodoro', ai: 'AI Asistan',
      achievements: 'Başarımlar', profile: 'Profil', settings: 'Ayarlar'
    };
    const pt = document.getElementById('page-title');
    if (pt) pt.textContent = titles[sec] || sec;

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const sb = document.getElementById('search-box');
    if (sb) sb.style.display = sec === 'tasks' ? '' : 'none';

    if (sec === 'calendar')     Calendar.render();
    if (sec === 'ai')           AI.init();
    if (sec === 'profile')      Profile.render();
    if (sec === 'achievements') Achievements.render();

    this.closeSidebar();
  },

  toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('open');
  },

  closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('open');
  },

  exitFocus() {
    document.getElementById('focus-overlay')?.classList.add('hidden');
  }
};

/* ═══════════════════════════════════════════════════
   ONBOARDING
═══════════════════════════════════════════════════ */
const Onboarding = {
  step: 0,
  goals: [],
  tasks: { daily: [], weekly: [], monthly: [], yearly: [] },
  taskType: 'daily',
  theme: 'dark',

  start() {
    UI.show('onboarding');
    this.step = 0;
    this.goals = [];
    this.tasks = { daily: [], weekly: [], monthly: [], yearly: [] };
    this.taskType = 'daily';
    this.theme = 'dark';

    const p    = State.profile;
    const name = p?.firstName
      || State.user?.displayName?.split(' ')[0]
      || 'Kullanıcı';
    const unel = document.getElementById('ob-username');
    if (unel) unel.textContent = name;

    this._renderStep();
    this._setupTaskInput();

    // Goal chip'lerini sıfırla
    document.querySelectorAll('.goal-chip').forEach(chip => {
      chip.classList.remove('selected');
      const fresh = chip.cloneNode(true);
      chip.parentNode.replaceChild(fresh, chip);
      fresh.addEventListener('click', () => {
        fresh.classList.toggle('selected');
        const g = fresh.dataset.goal;
        if (fresh.classList.contains('selected')) {
          if (!this.goals.includes(g)) this.goals.push(g);
        } else {
          this.goals = this.goals.filter(x => x !== g);
        }
      });
    });
  },

  _renderStep() {
    document.querySelectorAll('.ob-panel').forEach((p, i) => {
      p.classList.toggle('hidden', i !== this.step);
    });
    document.querySelectorAll('.ob-step-label').forEach((l, i) => {
      l.classList.toggle('active', i === this.step);
    });
    const prog = document.getElementById('ob-progress');
    if (prog) prog.style.width = (this.step / 4 * 100) + '%';
  },

  next() {
    if (this.step >= 4) { this.finish(); return; }
    this.step++;
    if (this.step === 4) this._buildSummary();
    this._renderStep();
  },

  prev() {
    if (this.step > 0) { this.step--; this._renderStep(); }
  },

  setTaskType(type, btn) {
    this.taskType = type;
    document.querySelectorAll('.ob-ttab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this._renderTaskList();
  },

  _setupTaskInput() {
    const old = document.getElementById('ob-task-inp');
    if (!old) return;
    const fresh = old.cloneNode(true);
    old.parentNode.replaceChild(fresh, old);
    fresh.addEventListener('keydown', e => {
      if (e.key === 'Enter' && fresh.value.trim()) {
        this.tasks[this.taskType].push(fresh.value.trim());
        fresh.value = '';
        this._renderTaskList();
      }
    });
  },

  _renderTaskList() {
    const list = document.getElementById('ob-task-list');
    if (!list) return;
    list.innerHTML = '';
    (this.tasks[this.taskType] || []).forEach((t, i) => {
      const item = document.createElement('div');
      item.className = 'ob-task-item';
      item.innerHTML = `<span>${t}</span><button onclick="Onboarding._removeTask('${this.taskType}',${i})"><i class="fa fa-xmark"></i></button>`;
      list.appendChild(item);
    });
  },

  _removeTask(type, idx) {
    this.tasks[type].splice(idx, 1);
    this._renderTaskList();
  },

  pickTheme(theme, card) {
    this.theme = theme;
    document.querySelectorAll('.tp-card').forEach(c => c.classList.remove('active'));
    if (card) card.classList.add('active');
    Settings.applyTheme(theme);
  },

  _buildSummary() {
    const el = document.getElementById('ob-summary');
    if (!el) return;
    const total = Object.values(this.tasks).flat().length;
    const themeNames = { dark: 'Dark', light: 'Light', bw: 'Siyah & Beyaz' };
    el.innerHTML = `
      <div class="ob-summary-item"><i class="fa fa-check"></i><span>Tema: ${themeNames[this.theme] || this.theme}</span></div>
      <div class="ob-summary-item"><i class="fa fa-check"></i><span>${this.goals.length} hedef seçildi</span></div>
      <div class="ob-summary-item"><i class="fa fa-check"></i><span>${total} başlangıç görevi oluşturulacak</span></div>
    `;
  },

  async finish() {
    const uid = State.user?.uid;
    if (!uid) return;

    const initTasks = [];
    Object.entries(this.tasks).forEach(([type, list]) => {
      list.forEach(title => initTasks.push({
        id: 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        title, type, priority: 'medium', completed: false,
        createdAt: { toDate: () => new Date() },
        deadline: null, description: ''
      }));
    });

    if (DEMO_MODE) {
      const existingProfile = State.profile || {};
      const profile = {
        ...existingProfile,
        onboarded: true, goals: this.goals, theme: this.theme,
        firstName:  existingProfile.firstName  || 'Demo',
        lastName:   existingProfile.lastName   || 'Kullanıcı',
        email:      State.user?.email          || '',
        xp: 50, level: 1, streak: 0, pomodoros: 0, achievements: [],
        createdAt: existingProfile.createdAt   || new Date().toISOString(),
      };
      LS.set('arazion_profile', profile);
      LS.set('arazion_tasks', initTasks);
      State.profile = profile;
      State.xp = 50; State.level = 1; State.achievements = [];
    } else {
      await db.collection('users').doc(uid).update({
        onboarded: true, goals: this.goals, theme: this.theme
      });
      const batch = db.batch();
      initTasks.forEach(t => {
        const ref = db.collection('users').doc(uid).collection('tasks').doc();
        const { id, ...data } = t;
        batch.set(ref, {
          ...data,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      await batch.commit();
    }

    State.profile.onboarded = true;
    State.theme = this.theme;
    UI.toast('ARAZION\'a hoşgeldin! 🎉', 'success');
    Gamification.addXP(50, '+50 XP: Kurulum tamamlandı!');
    App.enterDashboard();
  }
};

/* ═══════════════════════════════════════════════════
   TASKS MODULE
═══════════════════════════════════════════════════ */
const Tasks = {
  load() {
    const uid = State.user?.uid;
    if (!uid) return;

    if (DEMO_MODE) {
      State.tasks = LS.get('arazion_tasks', this._defaultDemoTasks());
      this.render();
      this._updateCounts();
      this._updateStats();
      return;
    }

    db.collection('users').doc(uid).collection('tasks')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snap => {
        State.tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        this.render();
        this._updateCounts();
        this._updateStats();
        Calendar.render();
      }, err => console.error('Tasks listener error:', err));
  },

  _defaultDemoTasks() {
    const mk = (id, title, type, priority, completed, deadline = null) => ({
      id, title, type, priority, completed,
      createdAt: { toDate: () => new Date() },
      deadline, description: ''
    });
    return [
      mk('d1', 'Sabah egzersizi yap',      'daily',   'high',   false),
      mk('d2', 'E-postaları kontrol et',   'daily',   'medium', true),
      mk('d3', 'Su iç (2L)',               'daily',   'low',    false),
      mk('w1', 'Haftalık rapor hazırla',   'weekly',  'high',   false),
      mk('w2', 'Kitap oku (3 bölüm)',      'weekly',  'medium', false),
      mk('m1', 'Aylık bütçe gözden geçir','monthly', 'high',   false),
      mk('y1', 'Dil kursu bitir',          'yearly',  'medium', false),
    ];
  },

  _saveDemo() {
    LS.set('arazion_tasks', State.tasks);
  },

  async addTask() {
    const titleEl = document.getElementById('t-title');
    const title   = titleEl?.value.trim() || '';
    if (!title) { UI.toast('Görev başlığı girin.', 'warning'); titleEl?.focus(); return; }

    const type     = document.getElementById('t-type')?.value    || 'daily';
    const priority = document.getElementById('t-prio')?.value    || 'medium';
    const deadline = document.getElementById('t-deadline')?.value || null;
    const desc     = document.getElementById('t-desc')?.value.trim() || '';

    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2),
      title, type, priority,
      deadline: deadline || null,
      description: desc,
      completed: false,
      createdAt: { toDate: () => new Date() }
    };

    if (DEMO_MODE) {
      State.tasks.unshift(newTask);
      this._saveDemo();
      this.render();
      this._updateCounts();
      this._updateStats();
    } else {
      const uid = State.user?.uid;
      await db.collection('users').doc(uid).collection('tasks').add({
        title, type, priority,
        deadline: deadline || null,
        description: desc,
        completed: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    if (titleEl) titleEl.value = '';
    const descEl = document.getElementById('t-desc');
    if (descEl) descEl.value = '';
    const dlEl = document.getElementById('t-deadline');
    if (dlEl) dlEl.value = '';

    UI.toast('Görev eklendi! ✅', 'success');
    Gamification.addXP(5, '+5 XP: Yeni görev eklendi');
    Achievements.check();
  },

  async toggleComplete(id) {
    const task = State.tasks.find(t => t.id === id);
    if (!task) return;
    const newVal = !task.completed;

    const card = document.querySelector(`[data-task-id="${id}"]`);
    if (card) {
      card.classList.add('removing');
      await new Promise(r => setTimeout(r, 280));
    }

    if (DEMO_MODE) {
      task.completed = newVal;
      this._saveDemo();
      this.render();
      this._updateCounts();
      this._updateStats();
    } else {
      const uid = State.user?.uid;
      await db.collection('users').doc(uid).collection('tasks').doc(id).update({
        completed: newVal,
        completedAt: newVal
          ? firebase.firestore.FieldValue.serverTimestamp()
          : null
      });
    }

    if (newVal) {
      const xpm = { low: 10, medium: 20, high: 35 };
      const gained = xpm[task.priority] || 10;
      Gamification.addXP(gained, `+${gained} XP: Görev tamamlandı! 🎯`);
      Achievements.check();
      Notifications.add('Görev Tamamlandı', `"${task.title}" ✅`, 'green', 'fa-check-circle');
    }
  },

  async deleteTask(id) {
    if (!confirm('Bu görevi silmek istiyor musunuz?')) return;

    const card = document.querySelector(`[data-task-id="${id}"]`);
    if (card) {
      card.classList.add('removing');
      await new Promise(r => setTimeout(r, 280));
    }

    if (DEMO_MODE) {
      State.tasks = State.tasks.filter(t => t.id !== id);
      this._saveDemo();
      this.render();
      this._updateCounts();
      this._updateStats();
    } else {
      const uid = State.user?.uid;
      await db.collection('users').doc(uid).collection('tasks').doc(id).delete();
    }
    UI.toast('Görev silindi.', 'info');
  },

  setFilter(filter, el) {
    State.filter = filter;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
    const labels = {
      all:       'Tüm Görevler',
      active:    'Aktif Görevler',
      daily:     'Günlük Görevler',
      weekly:    'Haftalık Görevler',
      monthly:   'Aylık Görevler',
      yearly:    'Yıllık Hedefler',
      completed: 'Tamamlananlar'
    };
    const ll = document.getElementById('list-label');
    if (ll) ll.textContent = labels[filter] || filter;
    this.render();
  },

  setSort(sort, btn) {
    State.sort = sort;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this.render();
  },

  _filtered() {
    let tasks = [...State.tasks];
    const f = State.filter;
    if (f === 'completed') {
      tasks = tasks.filter(t => t.completed);
    } else if (f === 'active') {
      tasks = tasks.filter(t => !t.completed);
    } else if (['daily', 'weekly', 'monthly', 'yearly'].includes(f)) {
      tasks = tasks.filter(t => t.type === f && !t.completed);
    }

    const q = (document.getElementById('search-inp')?.value || '').toLowerCase();
    if (q) tasks = tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );

    tasks.sort((a, b) => {
      if (State.sort === 'priority') {
        const o = { high: 0, medium: 1, low: 2 };
        return (o[a.priority] ?? 1) - (o[b.priority] ?? 1);
      }
      if (State.sort === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      }
      if (State.sort === 'name') {
        return a.title.localeCompare(b.title, 'tr');
      }
      // date (default)
      const at = a.createdAt?.toDate?.() || new Date(0);
      const bt = b.createdAt?.toDate?.() || new Date(0);
      return bt - at;
    });
    return tasks;
  },

  render() {
    const list  = document.getElementById('task-list');
    const empty = document.getElementById('empty-state');
    if (!list) return;
    const tasks = this._filtered();
    list.innerHTML = '';
    if (!tasks.length) {
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');
    tasks.forEach(task => list.appendChild(this._buildCard(task)));
  },

  _buildCard(task) {
    const div = document.createElement('div');
    const pColors = { high: 'var(--red)', medium: 'var(--orange)', low: 'var(--green)' };
    const pLabels = { high: 'Yüksek', medium: 'Orta', low: 'Düşük' };
    const typeLabels = { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık', yearly: 'Yıllık' };
    const typeIcons  = { daily: 'fa-sun', weekly: 'fa-calendar-week', monthly: 'fa-calendar-days', yearly: 'fa-calendar' };
    const pc = pColors[task.priority] || 'var(--border2)';

    div.className = [
      'task-card',
      task.completed ? 'completed' : '',
      this._isOverdue(task) ? 'overdue' : ''
    ].filter(Boolean).join(' ');
    div.dataset.taskId = task.id;
    div.style.setProperty('--pc', pc);

    let deadlineHtml = '';
    if (task.deadline) {
      const dl   = new Date(task.deadline);
      const now  = new Date(); now.setHours(0, 0, 0, 0);
      const diff = Math.ceil((dl - now) / 86400000);
      const cls  = diff < 0 ? 'overdue' : diff <= 3 ? 'soon' : 'ok';
      const txt  = diff < 0
        ? `${Math.abs(diff)} gün gecikti`
        : diff === 0 ? 'Bugün' : `${diff} gün kaldı`;
      deadlineHtml = `<span class="tc-deadline ${cls}"><i class="fa fa-calendar"></i> ${txt}</span>`;
    }

    const createdDate = task.createdAt?.toDate?.()
      ? task.createdAt.toDate().toLocaleDateString('tr-TR')
      : '';

    // XSS koruması için başlıkları temizle
    const safeTitle = (task.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeDesc  = (task.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeName  = safeTitle.replace(/'/g, "\\'").replace(/\\/g, '\\\\');

    div.innerHTML = `
      <div class="chk ${task.completed ? 'done' : ''}" onclick="Tasks.toggleComplete('${task.id}')">
        <i class="fa fa-check"></i>
      </div>
      <div class="tc-body">
        <div class="tc-title">${safeTitle}</div>
        ${safeDesc ? `<div class="tc-desc">${safeDesc}</div>` : ''}
        <div class="tc-meta">
          <span class="tc-badge"><i class="fa ${typeIcons[task.type] || 'fa-tag'}"></i> ${typeLabels[task.type] || task.type}</span>
          <span class="tc-prio" style="--pc:${pc}">${pLabels[task.priority] || task.priority}</span>
          ${deadlineHtml}
        </div>
      </div>
      <div class="tc-actions">
        <span class="tc-date">${createdDate}</span>
        <button class="tc-btn timer ripple" onclick="Pomodoro.focusTask('${task.id}','${safeName}')" title="Pomodoro Başlat">
          <i class="fa fa-clock"></i>
        </button>
        <button class="tc-btn del ripple" onclick="Tasks.deleteTask('${task.id}')">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    `;
    return div;
  },

  _isOverdue(task) {
    if (!task.deadline || task.completed) return false;
    const dl = new Date(task.deadline);
    dl.setHours(23, 59, 59);
    return dl < new Date();
  },

  search(q) { this.render(); },

  _updateCounts() {
    const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    s('c-all',     State.tasks.length);
    s('c-active',  State.tasks.filter(t => !t.completed).length);
    s('c-done',    State.tasks.filter(t => t.completed).length);
    s('c-daily',   State.tasks.filter(t => t.type === 'daily'   && !t.completed).length);
    s('c-weekly',  State.tasks.filter(t => t.type === 'weekly'  && !t.completed).length);
    s('c-monthly', State.tasks.filter(t => t.type === 'monthly' && !t.completed).length);
    s('c-yearly',  State.tasks.filter(t => t.type === 'yearly'  && !t.completed).length);
  },

  _updateStats() {
    const total = State.tasks.length;
    const done  = State.tasks.filter(t => t.completed).length;
    const rate  = total ? Math.round((done / total) * 100) : 0;
    const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    s('st-total',  total);
    s('st-done',   done);
    s('st-active', total - done);
    s('st-rate',   `%${rate}`);
    s('prog-pct',  `${rate}%`);
    const fill = document.getElementById('prog-fill');
    if (fill) fill.style.width = rate + '%';
    s('ps-total',  total);
    s('ps-done',   done);
    s('ps-notes',  State.notes.length);
    s('ps-xp',     State.xp);
  },

  voiceInput() {
    const btn = document.querySelector('.btn-voice');
    const SR  = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { UI.toast('Tarayıcınız ses tanımayı desteklemiyor.', 'warning'); return; }
    const rec = new SR();
    rec.lang = 'tr-TR';
    rec.interimResults = false;
    btn?.classList.add('listening');
    rec.start();
    rec.onresult = e => {
      const inp = document.getElementById('t-title');
      if (inp) inp.value = e.results[0][0].transcript;
      btn?.classList.remove('listening');
    };
    rec.onerror = () => {
      btn?.classList.remove('listening');
      UI.toast('Ses tanıma başarısız.', 'error');
    };
    rec.onend = () => btn?.classList.remove('listening');
  }
};

/* ═══════════════════════════════════════════════════
   NOTES MODULE
═══════════════════════════════════════════════════ */
const Notes = {
  editId: null,
  color:  'default',

  load() {
    if (DEMO_MODE) {
      State.notes = LS.get('arazion_notes', []);
      this.render(State.notes);
      return;
    }
    const uid = State.user?.uid;
    if (!uid) return;
    db.collection('users').doc(uid).collection('notes')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snap => {
        State.notes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        this.render(State.notes);
        Tasks._updateStats();
      }, err => console.error('Notes listener error:', err));
  },

  render(notes) {
    const grid  = document.getElementById('notes-grid');
    const empty = document.getElementById('notes-empty');
    if (!grid) return;
    grid.innerHTML = '';
    if (!notes || !notes.length) {
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');
    notes.forEach(n => grid.appendChild(this._buildCard(n)));
  },

  _buildCard(note) {
    const div = document.createElement('div');
    div.className = `note-card${note.color && note.color !== 'default' ? ' nc-' + note.color : ''}`;
    let date = '';
    if (note.createdAt?.toDate) {
      date = note.createdAt.toDate().toLocaleDateString('tr-TR');
    } else if (note.createdAt) {
      date = new Date(note.createdAt).toLocaleDateString('tr-TR');
    }
    const safeTitle = (note.title || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const safeBody  = (note.body  || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    div.innerHTML = `
      <div class="note-card-head">
        <div class="note-card-title">${safeTitle}</div>
        <div class="note-card-actions">
          <button class="note-action-btn edit ripple" onclick="Notes.openModal('${note.id}')"><i class="fa fa-pen"></i></button>
          <button class="note-action-btn del  ripple" onclick="Notes.delete('${note.id}')"><i class="fa fa-trash"></i></button>
        </div>
      </div>
      <span class="note-card-cat">${note.category || 'kisisel'}</span>
      <div class="note-card-body">${safeBody}</div>
      <div class="note-card-date">${date}</div>
    `;
    return div;
  },

  openModal(id) {
    this.editId = id || null;
    const title = document.getElementById('note-modal-title');
    if (title) title.textContent = id ? 'Notu Düzenle' : 'Yeni Not';
    if (id) {
      const n = State.notes.find(x => x.id === id);
      if (n) {
        const ti = document.getElementById('note-title-inp');
        const bi = document.getElementById('note-body-inp');
        const ci = document.getElementById('note-cat-inp');
        if (ti) ti.value = n.title || '';
        if (bi) bi.value = n.body  || '';
        if (ci) ci.value = n.category || 'kisisel';
        this.color = n.color || 'default';
      }
    } else {
      const ti = document.getElementById('note-title-inp');
      const bi = document.getElementById('note-body-inp');
      if (ti) ti.value = '';
      if (bi) bi.value = '';
      const ci = document.getElementById('note-cat-inp');
      if (ci) ci.value = 'kisisel';
      this.color = 'default';
    }
    document.querySelectorAll('.cp-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.c === this.color);
    });
    document.getElementById('note-modal')?.classList.remove('hidden');
  },

  closeModal() {
    document.getElementById('note-modal')?.classList.add('hidden');
    this.editId = null;
  },

  pickColor(btn) {
    this.color = btn.dataset.c;
    document.querySelectorAll('.cp-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  },

  async save() {
    const title    = document.getElementById('note-title-inp')?.value.trim() || '';
    const body     = document.getElementById('note-body-inp')?.value.trim()  || '';
    const category = document.getElementById('note-cat-inp')?.value          || 'kisisel';
    if (!title) { UI.toast('Not başlığı girin.', 'warning'); return; }

    const uid  = State.user?.uid;
    const data = { title, body, category, color: this.color };

    if (DEMO_MODE) {
      if (this.editId) {
        const idx = State.notes.findIndex(n => n.id === this.editId);
        if (idx > -1) State.notes[idx] = { ...State.notes[idx], ...data };
      } else {
        State.notes.unshift({
          id: 'note-' + Date.now(),
          ...data,
          createdAt: new Date().toISOString()
        });
      }
      LS.set('arazion_notes', State.notes);
      this.render(State.notes);
      Tasks._updateStats();
    } else {
      if (this.editId) {
        await db.collection('users').doc(uid).collection('notes').doc(this.editId).update({
          ...data,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        await db.collection('users').doc(uid).collection('notes').add({
          ...data,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        Gamification.addXP(3, '+3 XP: Not oluşturuldu');
      }
    }

    UI.toast(this.editId ? 'Not güncellendi.' : 'Not eklendi! 📝', 'success');
    this.closeModal();
  },

  async delete(id) {
    if (!confirm('Bu notu silmek istiyor musunuz?')) return;
    if (DEMO_MODE) {
      State.notes = State.notes.filter(n => n.id !== id);
      LS.set('arazion_notes', State.notes);
      this.render(State.notes);
      Tasks._updateStats();
    } else {
      const uid = State.user?.uid;
      await db.collection('users').doc(uid).collection('notes').doc(id).delete();
    }
    UI.toast('Not silindi.', 'info');
  },

  search(q) {
    const f = State.notes.filter(n =>
      (n.title || '').toLowerCase().includes(q.toLowerCase()) ||
      (n.body  || '').toLowerCase().includes(q.toLowerCase())
    );
    this.render(f);
  },

  filterByCategory(cat) {
    const f = cat === 'all' ? State.notes : State.notes.filter(n => n.category === cat);
    this.render(f);
  }
};

/* ═══════════════════════════════════════════════════
   CALENDAR MODULE
═══════════════════════════════════════════════════ */
const Calendar = {
  date: new Date(),
  view: 'month',

  render() {
    const grid = document.getElementById('cal-grid');
    if (!grid) return;
    grid.style.gridTemplateColumns = 'repeat(7,1fr)';
    if (this.view === 'month')     this._renderMonth(grid);
    else if (this.view === 'week') this._renderWeek(grid);
    else                           this._renderDay(grid);

    const title = document.getElementById('cal-month-title');
    if (title) {
      if (this.view === 'month')
        title.textContent = this.date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
      else if (this.view === 'week')
        title.textContent = `Haftalık — ${this.date.toLocaleDateString('tr-TR')}`;
      else
        title.textContent = this.date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
  },

  _renderMonth(grid) {
    grid.innerHTML = '';
    ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts', 'Paz'].forEach(d => {
      const h = document.createElement('div');
      h.className = 'cal-day-header';
      h.textContent = d;
      grid.appendChild(h);
    });
    const year = this.date.getFullYear(), month = this.date.getMonth();
    const first = new Date(year, month, 1);
    let startDay = first.getDay() - 1;
    if (startDay < 0) startDay = 6;

    for (let i = 0; i < startDay; i++)
      grid.appendChild(this._dayCell(new Date(year, month, -startDay + i + 1), true));
    const dim = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= dim; d++)
      grid.appendChild(this._dayCell(new Date(year, month, d), false));
    const total = startDay + dim;
    const rem = total % 7 ? 7 - (total % 7) : 0;
    for (let i = 1; i <= rem; i++)
      grid.appendChild(this._dayCell(new Date(year, month + 1, i), true));
  },

  _dayCell(date, otherMonth) {
    const cell    = document.createElement('div');
    const today   = new Date();
    const isToday = date.toDateString() === today.toDateString();
    cell.className = `cal-day${otherMonth ? ' other-month' : ''}${isToday ? ' today' : ''}`;

    const num = document.createElement('span');
    num.className = 'cal-day-num';
    num.textContent = date.getDate();
    cell.appendChild(num);

    const evDiv = document.createElement('div');
    evDiv.className = 'cal-events';
    const dateStr  = date.toISOString().split('T')[0];
    const dayTasks = State.tasks.filter(t => t.deadline === dateStr);

    dayTasks.slice(0, 3).forEach(t => {
      const ev = document.createElement('div');
      ev.className = 'cal-event';
      ev.textContent = (t.title || '').slice(0, 18);
      ev.style.background = t.completed
        ? 'var(--green)'
        : new Date(t.deadline) < today ? 'var(--red)' : 'var(--purple)';
      evDiv.appendChild(ev);
    });
    if (dayTasks.length > 3) {
      const more = document.createElement('div');
      more.className = 'cal-event';
      more.style.background = 'var(--text3)';
      more.textContent = `+${dayTasks.length - 3} daha`;
      evDiv.appendChild(more);
    }
    cell.appendChild(evDiv);
    return cell;
  },

  _renderWeek(grid) {
    grid.style.gridTemplateColumns = '1fr';
    grid.innerHTML = '<p style="color:var(--text2);text-align:center;padding:40px;font-size:14px">Haftalık görünüm yakında geliyor!</p>';
  },

  _renderDay(grid) {
    grid.style.gridTemplateColumns = '1fr';
    const dateStr    = this.date.toISOString().split('T')[0];
    const todayTasks = State.tasks.filter(t => t.deadline === dateStr);
    grid.innerHTML = '';
    if (!todayTasks.length) {
      grid.innerHTML = '<p style="color:var(--text2);text-align:center;padding:40px">Bu gün için görev yok.</p>';
      return;
    }
    todayTasks.forEach(t => {
      const d = document.createElement('div');
      d.style.cssText = 'padding:12px 16px;border-radius:10px;background:var(--glass);border:1px solid var(--border);margin-bottom:8px;font-size:14px;color:var(--text);display:flex;align-items:center;gap:10px';
      const safeTitle = (t.title || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      d.innerHTML = `<i class="fa fa-circle-dot" style="color:var(--purple)"></i>${safeTitle}`;
      grid.appendChild(d);
    });
  },

  setView(v, btn) {
    this.view = v;
    document.querySelectorAll('.cvt').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this.render();
  },

  prev() {
    if (this.view === 'month') this.date.setMonth(this.date.getMonth() - 1);
    else this.date.setDate(this.date.getDate() - (this.view === 'week' ? 7 : 1));
    this.render();
  },

  next() {
    if (this.view === 'month') this.date.setMonth(this.date.getMonth() + 1);
    else this.date.setDate(this.date.getDate() + (this.view === 'week' ? 7 : 1));
    this.render();
  }
};

/* ═══════════════════════════════════════════════════
   POMODORO MODULE
═══════════════════════════════════════════════════ */
const Pomodoro = {
  mode:    'work',
  times:   { work: 25 * 60, short: 5 * 60, long: 15 * 60 },
  remaining: 25 * 60,
  total:     25 * 60,
  running:   false,
  timer:     null,
  sessions:  0,
  focusTaskName: '—',

  setMode(mode, btn) {
    this.stop();
    this.mode = mode;
    this.remaining = this.times[mode];
    this.total     = this.times[mode];
    document.querySelectorAll('.pomo-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this._update();
  },

  toggle() { this.running ? this.stop() : this.start(); },

  start() {
    this.running = true;
    const icon = document.getElementById('pomo-icon');
    if (icon) icon.className = 'fa fa-pause';
    this.timer = setInterval(() => {
      this.remaining--;
      this._update();
      const ft = document.getElementById('focus-timer');
      if (ft) ft.textContent = this._fmt(this.remaining);
      if (this.remaining <= 0) this._complete();
    }, 1000);
  },

  stop() {
    this.running = false;
    clearInterval(this.timer);
    this.timer = null;
    const icon = document.getElementById('pomo-icon');
    if (icon) icon.className = 'fa fa-play';
  },

  reset() {
    this.stop();
    this.remaining = this.times[this.mode];
    this.total     = this.times[this.mode];
    this._update();
  },

  _complete() {
    this.stop();
    this.sessions++;
    const sc = document.getElementById('pomo-session-count');
    if (sc) sc.textContent = this.sessions;
    if (this.mode === 'work') {
      State.pomodoros++;
      const tc = document.getElementById('pomo-total-count');
      if (tc) tc.textContent = State.pomodoros;
      if (DEMO_MODE && State.profile) {
        State.profile.pomodoros = (State.profile.pomodoros || 0) + 1;
        LS.set('arazion_profile', State.profile);
      }
      Gamification.addXP(15, '+15 XP: Pomodoro tamamlandı! 🍅');
      Achievements.check();
      UI.toast('Pomodoro tamamlandı! 🍅 Harika iş!', 'success');
    } else {
      UI.toast('Mola bitti! Çalışmaya devam et 💪', 'info');
    }
    this.reset();
  },

  _fmt(s) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  },

  _update() {
    const tt = document.getElementById('pomo-time');
    if (tt) tt.textContent = this._fmt(this.remaining);
    const pct  = 1 - (this.remaining / this.total);
    const circ = 2 * Math.PI * 85;
    const circle = document.getElementById('pomo-circle');
    if (circle) {
      circle.style.strokeDasharray  = circ;
      circle.style.strokeDashoffset = circ * (1 - pct);
      const svg = circle.closest('svg');
      if (svg && !svg.querySelector('#pomo-grad')) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `<linearGradient id="pomo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a78bfa"/>
          <stop offset="100%" stop-color="#60a5fa"/>
        </linearGradient>`;
        svg.insertBefore(defs, svg.firstChild);
        circle.setAttribute('stroke', 'url(#pomo-grad)');
      }
    }
  },

  focusTask(id, name) {
    this.focusTaskName = name;
    const ftn = document.getElementById('focus-task-name');
    if (ftn) ftn.textContent = name;
    const ftt = document.getElementById('focus-task-text');
    if (ftt) ftt.textContent = name;
    document.getElementById('focus-overlay')?.classList.remove('hidden');
    App.showSection('pomodoro');
    if (!this.running) this.start();
    const ft = document.getElementById('focus-timer');
    if (ft) ft.textContent = this._fmt(this.remaining);
  }
};

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('focus-overlay')?.classList.add('hidden');
    document.getElementById('notif-panel')?.classList.add('hidden');
    document.getElementById('note-modal')?.classList.add('hidden');
    document.getElementById('profile-edit-modal')?.classList.add('hidden');
    document.getElementById('levelup-modal')?.classList.add('hidden');
  }
});

/* ═══════════════════════════════════════════════════
   AI ASSISTANT
═══════════════════════════════════════════════════ */
const AI = {
  initialized: false,

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this._addMessage('bot', 'Merhaba! 👋 Ben ARAZION AI asistanınım. Görevlerinizi planlamanıza, önceliklendirmenize ve üretkenliğinizi artırmanıza yardımcı olabilirim. Ne yapmamı istersiniz?');
  },

  async send() {
    const inp = document.getElementById('ai-inp');
    const msg = inp?.value.trim() || '';
    if (!msg) return;
    if (inp) inp.value = '';
    this._addMessage('user', msg);
    this._showTyping();

    try {
      const context = this._buildContext();
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `Sen ARAZION premium üretkenlik uygulamasının AI asistanısın. Türkçe yanıt ver. Kısa, pratik, motive edici ol. Kullanıcı verileri: ${context}`,
          messages: [{ role: 'user', content: msg }]
        })
      });
      const data = await res.json();
      this._removeTyping();
      const text = (data.content || []).map(c => c.text || '').join('') || 'Yanıt alınamadı.';
      this._addMessage('bot', text);
    } catch (err) {
      this._removeTyping();
      this._addMessage('bot', 'Üzgünüm, bağlantı sorunu yaşıyorum. Lütfen tekrar deneyin. 🔄');
    }
  },

  _buildContext() {
    return JSON.stringify({
      totalTasks:   State.tasks.length,
      doneTasks:    State.tasks.filter(t => t.completed).length,
      activeTasks:  State.tasks.filter(t => !t.completed).length,
      highPriority: State.tasks.filter(t => t.priority === 'high' && !t.completed).map(t => t.title),
      overdue:      State.tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && !t.completed).map(t => t.title),
      level:        State.level,
      xp:           State.xp,
      streak:       State.streak,
      notes:        State.notes.length
    });
  },

  quickAction(type) {
    const msgs = {
      plan:       'Bugünkü görevlerimi analiz ederek bana ideal bir gün planı oluştur.',
      priority:   'Aktif görevlerimi öncelik sırasına koy ve hangilerinden başlamam gerektiğini söyle.',
      weekly:     'Bu haftaki görevlerime bakarak haftalık bir plan öner.',
      motivation: 'İlerleme durumumu değerlendirerek motive edici ve kişisel bir mesaj yaz.'
    };
    const inp = document.getElementById('ai-inp');
    if (inp) inp.value = msgs[type] || '';
    this.send();
  },

  _addMessage(role, text) {
    const chat = document.getElementById('ai-chat');
    if (!chat) return;
    const msg = document.createElement('div');
    msg.className = `ai-message ${role}`;
    const safeText = text
      .replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    msg.innerHTML = `
      <div class="ai-msg-avatar"><i class="fa fa-${role === 'bot' ? 'robot' : 'user'}"></i></div>
      <div class="ai-bubble">${safeText}</div>
    `;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  },

  _showTyping() {
    const chat = document.getElementById('ai-chat');
    if (!chat) return;
    const t = document.createElement('div');
    t.className = 'ai-message bot';
    t.id = 'ai-typing-indicator';
    t.innerHTML = `
      <div class="ai-msg-avatar"><i class="fa fa-robot"></i></div>
      <div class="ai-bubble ai-typing">
        <div class="ai-typing-dot"></div>
        <div class="ai-typing-dot"></div>
        <div class="ai-typing-dot"></div>
      </div>`;
    chat.appendChild(t);
    chat.scrollTop = chat.scrollHeight;
  },

  _removeTyping() {
    document.getElementById('ai-typing-indicator')?.remove();
  }
};

/* ═══════════════════════════════════════════════════
   GAMIFICATION
═══════════════════════════════════════════════════ */
const Gamification = {
  xpTable: [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000],

  async addXP(amount, msg) {
    State.xp += amount;
    if (msg) UI.toast(msg, 'xp', 'fa-star');
    const newLevel = this._calcLevel(State.xp);
    const leveled  = newLevel > State.level;
    State.level = newLevel;
    this.updateXPBar();
    if (leveled) this._showLevelUp(newLevel);

    if (DEMO_MODE) {
      if (State.profile) {
        State.profile.xp    = State.xp;
        State.profile.level = State.level;
        LS.set('arazion_profile', State.profile);
      }
    } else {
      const uid = State.user?.uid;
      if (uid) {
        try {
          await db.collection('users').doc(uid).update({ xp: State.xp, level: State.level });
        } catch(e) {}
      }
    }
    const psXp = document.getElementById('ps-xp');
    if (psXp) psXp.textContent = State.xp;
    const pl = document.getElementById('prof-level');
    if (pl)   pl.textContent   = State.level;
  },

  _calcLevel(xp) {
    for (let i = this.xpTable.length - 1; i >= 0; i--) {
      if (xp >= this.xpTable[i]) return i + 1;
    }
    return 1;
  },

  updateXPBar() {
    const lv  = State.level;
    const cur = State.xp;
    const min = this.xpTable[lv - 1] || 0;
    const max = this.xpTable[lv]     || (min + 500);
    const pct = Math.min(((cur - min) / (max - min)) * 100, 100);

    const fill  = document.getElementById('xp-fill');
    const badge = document.getElementById('xp-level-badge');
    const val   = document.getElementById('xp-val');
    if (fill)  fill.style.width  = pct + '%';
    if (badge) badge.textContent = `Lv.${lv}`;
    if (val)   val.textContent   = `${cur} / ${max} XP`;

    const ps = document.getElementById('prof-streak');
    if (ps) ps.textContent = State.streak;
  },

  _showLevelUp(level) {
    const modal = document.getElementById('levelup-modal');
    const ll    = document.getElementById('levelup-level');
    if (ll) ll.textContent = `Seviye ${level}`;
    if (modal)  modal.classList.remove('hidden');
    UI.toast(`🎉 Seviye ${level}'e ulaştın!`, 'xp', 'fa-trophy');
  }
};

/* ═══════════════════════════════════════════════════
   STREAK MODULE
═══════════════════════════════════════════════════ */
const Streak = {
  async check() {
    if (DEMO_MODE) {
      const sv = document.getElementById('streak-val');
      if (sv) sv.textContent = State.streak;
      return;
    }
    const uid = State.user?.uid;
    if (!uid) return;
    try {
      const snap = await db.collection('users').doc(uid).get();
      const data = snap.data();
      const last = data?.lastActive?.toDate?.();
      if (!last) { await this._update(1); return; }
      const today   = new Date(); today.setHours(0, 0, 0, 0);
      const lastDay = new Date(last); lastDay.setHours(0, 0, 0, 0);
      const diff    = Math.round((today - lastDay) / 86400000);
      let streak    = data.streak || 0;
      if (diff === 0) return;
      streak = diff === 1 ? streak + 1 : 1;
      await this._update(streak);
    } catch(e) {
      console.error('Streak check error:', e);
    }
  },

  async _update(streak) {
    const uid   = State.user?.uid;
    State.streak = streak;
    const sv = document.getElementById('streak-val');
    if (sv) sv.textContent = streak;
    const ps = document.getElementById('prof-streak');
    if (ps) ps.textContent = streak;
    if (!DEMO_MODE && uid) {
      try {
        await db.collection('users').doc(uid).update({
          streak,
          lastActive: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch(e) {}
    }
    if (streak > 1) UI.toast(`🔥 ${streak} günlük seri!`, 'warning', 'fa-fire');
  }
};

/* ═══════════════════════════════════════════════════
   ACHIEVEMENTS
═══════════════════════════════════════════════════ */
const Achievements = {
  list: [
    { id: 'first_task', name: 'İlk Adım',         desc: 'İlk görevini ekle',              icon: '🎯', req: s => s.total >= 1 },
    { id: 'task5',      name: 'Aktif Başlangıç',  desc: '5 görev ekle',                   icon: '⚡', req: s => s.total >= 5 },
    { id: 'task20',     name: 'Görev Ustası',      desc: '20 görev ekle',                  icon: '🏆', req: s => s.total >= 20 },
    { id: 'done5',      name: 'Tamamlayıcı',       desc: '5 görevi tamamla',               icon: '✅', req: s => s.done >= 5 },
    { id: 'done20',     name: 'Üretkenlik Gurusu', desc: '20 görevi tamamla',              icon: '🚀', req: s => s.done >= 20 },
    { id: 'streak3',    name: '3 Günlük Seri',     desc: '3 gün üst üste kullan',          icon: '🔥', req: s => s.streak >= 3 },
    { id: 'streak7',    name: 'Haftalık Seri',     desc: '7 gün üst üste kullan',          icon: '💫', req: s => s.streak >= 7 },
    { id: 'pomo1',      name: 'İlk Pomodoro',      desc: 'İlk pomodoro oturumunu tamamla', icon: '🍅', req: s => s.pomodoros >= 1 },
    { id: 'pomo10',     name: 'Pomodoro Pro',      desc: '10 pomodoro tamamla',            icon: '⏱️', req: s => s.pomodoros >= 10 },
    { id: 'note1',      name: 'Not Alan',           desc: 'İlk notunu oluştur',             icon: '📝', req: s => s.notes >= 1 },
    { id: 'level5',     name: 'Deneyimli',          desc: "Seviye 5'e ulaş",                icon: '⭐', req: s => s.level >= 5 },
    { id: 'level10',    name: 'Efsane',             desc: "Seviye 10'a ulaş",               icon: '💎', req: s => s.level >= 10 },
  ],

  check() {
    const stats = {
      total:     State.tasks.length,
      done:      State.tasks.filter(t => t.completed).length,
      streak:    State.streak,
      level:     State.level,
      pomodoros: State.pomodoros || (State.profile?.pomodoros || 0),
      notes:     State.notes.length
    };
    this.list.forEach(ach => {
      if (!State.achievements.includes(ach.id) && ach.req(stats)) {
        this._unlock(ach);
      }
    });
  },

  async _unlock(ach) {
    State.achievements.push(ach.id);
    UI.toast(`🏆 Başarım: ${ach.name}!`, 'xp', 'fa-trophy');
    Notifications.add('Başarım Açıldı!', `"${ach.name}" ${ach.icon}`, 'purple', 'fa-trophy');
    Gamification.addXP(25, '+25 XP: Başarım kazanıldı!');
    if (DEMO_MODE) {
      if (State.profile) State.profile.achievements = [...State.achievements];
      LS.set('arazion_profile', State.profile);
    } else {
      const uid = State.user?.uid;
      if (uid) {
        try {
          await db.collection('users').doc(uid).update({
            achievements: firebase.firestore.FieldValue.arrayUnion(ach.id)
          });
        } catch(e) {}
      }
    }
    this.render();
  },

  render() {
    const grid = document.getElementById('ach-grid');
    if (!grid) return;
    let unlocked = 0;
    grid.innerHTML = '';
    this.list.forEach(ach => {
      const isUnlocked = State.achievements.includes(ach.id);
      if (isUnlocked) unlocked++;
      const card = document.createElement('div');
      card.className = `ach-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-name">${ach.name}</div>
        <div class="ach-desc">${ach.desc}</div>
        ${isUnlocked ? '<div class="ach-badge">Kazanıldı</div>' : ''}
      `;
      grid.appendChild(card);
    });
    const au = document.getElementById('ach-unlocked');
    const at = document.getElementById('ach-total');
    if (au) au.textContent = unlocked;
    if (at) at.textContent = this.list.length;
  }
};

/* ═══════════════════════════════════════════════════
   PROFILE MODULE
═══════════════════════════════════════════════════ */
const Profile = {
  render() {
    const p = State.profile;
    const u = State.user;
    const name = p
      ? `${p.firstName || ''} ${p.lastName || ''}`.trim()
      : (u?.displayName || u?.email || '');

    const s = id => document.getElementById(id);
    if (s('prof-name'))   s('prof-name').textContent   = name || 'Kullanıcı';
    if (s('prof-email'))  s('prof-email').textContent  = u?.email || '';
    if (s('prof-level'))  s('prof-level').textContent  = State.level;
    if (s('prof-streak')) s('prof-streak').textContent = State.streak;
    if (s('sb-name'))     s('sb-name').textContent     = name || 'Kullanıcı';
    if (s('streak-val'))  s('streak-val').textContent  = State.streak;

    if (p?.createdAt) {
      const date = p.createdAt?.toDate?.() || new Date(p.createdAt);
      const pj = s('prof-joined');
      if (pj) pj.textContent = date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }) + ' tarihinden beri';
    }

    [s('sb-avatar'), s('tb-avatar'), s('prof-avatar-big')].forEach(el => {
      if (el) UI.setAvatar(el, u, p);
    });
    Gamification.updateXPBar();
  },

  openEditModal() {
    const p = State.profile;
    const fn  = document.getElementById('e-fn');  if (fn)  fn.value  = p?.firstName || '';
    const ln  = document.getElementById('e-ln');  if (ln)  ln.value  = p?.lastName  || '';
    const dob = document.getElementById('e-dob'); if (dob) dob.value = p?.dob       || '';
    document.getElementById('profile-edit-modal')?.classList.remove('hidden');
  },

  closeEditModal() {
    document.getElementById('profile-edit-modal')?.classList.add('hidden');
  },

  async saveEdit() {
    const fn  = document.getElementById('e-fn')?.value.trim()  || '';
    const ln  = document.getElementById('e-ln')?.value.trim()  || '';
    const dob = document.getElementById('e-dob')?.value        || '';
    if (DEMO_MODE) {
      if (State.profile) {
        State.profile.firstName = fn;
        State.profile.lastName  = ln;
        State.profile.dob       = dob;
        LS.set('arazion_profile', State.profile);
      }
    } else {
      const uid = State.user?.uid;
      await db.collection('users').doc(uid).update({ firstName: fn, lastName: ln, dob });
    }
    if (State.profile) {
      State.profile.firstName = fn;
      State.profile.lastName  = ln;
    }
    UI.toast('Profil güncellendi!', 'success');
    this.closeEditModal();
    this.render();
  },

  uploadAvatar(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { UI.toast('Dosya 2MB\'dan küçük olmalı.', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = async e => {
      const b64 = e.target.result;
      if (DEMO_MODE) {
        if (State.profile) State.profile.photoURL = b64;
        LS.set('arazion_profile', State.profile);
      } else {
        const uid = State.user?.uid;
        await db.collection('users').doc(uid).update({ photoURL: b64 });
        if (State.profile) State.profile.photoURL = b64;
      }
      this.render();
      UI.toast('Avatar güncellendi!', 'success');
    };
    reader.readAsDataURL(file);
  },

  async changePassword() {
    const email = State.user?.email;
    if (!email) return;
    if (DEMO_MODE) { UI.toast('Demo modda şifre değiştirme çalışmaz.', 'info'); return; }
    try {
      await auth.sendPasswordResetEmail(email);
      UI.toast('Şifre sıfırlama e-postası gönderildi!', 'success');
    } catch (err) {
      UI.toast('Hata: ' + err.message, 'error');
    }
  }
};

/* ═══════════════════════════════════════════════════
   SETTINGS MODULE
═══════════════════════════════════════════════════ */
const Settings = {
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    State.theme = theme;
    const sel = document.getElementById('theme-select');
    if (sel) sel.value = theme;
  },

  async setTheme(theme) {
    this.applyTheme(theme);
    if (DEMO_MODE) {
      if (State.profile) State.profile.theme = theme;
      LS.set('arazion_profile', State.profile);
    } else {
      const uid = State.user?.uid;
      if (uid) {
        try { await db.collection('users').doc(uid).update({ theme }); } catch(e) {}
      }
    }
  },

  exportData() {
    const data = {
      profile:    State.profile,
      tasks:      State.tasks,
      notes:      State.notes,
      xp:         State.xp,
      level:      State.level,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `arazion-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    UI.toast('Veriler dışa aktarıldı!', 'success');
  },

  async deleteAccount() {
    const conf = prompt('Hesabınızı silmek istediğinizden emin misiniz?\nOnaylamak için "SİL" yazın:');
    if (conf !== 'SİL') return;
    if (DEMO_MODE) {
      LS.remove('arazion_demo_session');
      LS.remove('arazion_profile');
      LS.remove('arazion_tasks');
      LS.remove('arazion_notes');
      State.user = null; State.profile = null;
      Auth._tabsInited = false;
      UI.show('auth-screen');
      setTimeout(() => Auth.initTabs(), 50);
      UI.toast('Demo hesap sıfırlandı.', 'info');
      return;
    }
    try {
      const uid = State.user?.uid;
      const [ts, ns] = await Promise.all([
        db.collection('users').doc(uid).collection('tasks').get(),
        db.collection('users').doc(uid).collection('notes').get()
      ]);
      const batch = db.batch();
      ts.docs.forEach(d => batch.delete(d.ref));
      ns.docs.forEach(d => batch.delete(d.ref));
      batch.delete(db.collection('users').doc(uid));
      await batch.commit();
      await State.user.delete();
      UI.toast('Hesap silindi.', 'info');
    } catch (err) {
      UI.toast('Yeniden giriş yapmanız gerekebilir: ' + err.message, 'error');
    }
  },

  toggleDailySummary(enabled) {
    UI.toast(enabled ? 'Günlük özet açıldı.' : 'Günlük özet kapatıldı.', 'info');
  }
};

/* ═══════════════════════════════════════════════════
   NOTIFICATIONS MODULE
═══════════════════════════════════════════════════ */
const Notifications = {
  items: [],

  init() {
    this._checkPermission();
    setTimeout(() => this._checkOverdue(), 800);
  },

  _checkPermission() {
    const btn = document.getElementById('notif-toggle');
    if (!btn) return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      btn.textContent = 'Açık';
      btn.classList.add('active');
    }
  },

  async requestPermission() {
    if (typeof Notification === 'undefined') {
      UI.toast('Tarayıcınız bildirim desteklemiyor.', 'warning');
      return;
    }
    const perm = await Notification.requestPermission();
    const btn  = document.getElementById('notif-toggle');
    if (perm === 'granted') {
      if (btn) { btn.textContent = 'Açık'; btn.classList.add('active'); }
      UI.toast('Bildirimler açıldı!', 'success');
    } else {
      UI.toast('Bildirim izni reddedildi.', 'warning');
    }
  },

  _checkOverdue() {
    const today   = new Date(new Date().toDateString());
    const overdue = State.tasks.filter(t =>
      !t.completed && t.deadline && new Date(t.deadline) < today
    );
    if (overdue.length) {
      overdue.slice(0, 3).forEach(t =>
        this.add('Gecikmiş Görev', `"${t.title}" süresi geçti!`, 'red', 'fa-triangle-exclamation')
      );
    }
  },

  add(title, desc, color, icon) {
    const item = { title, desc, color, icon, time: new Date() };
    this.items.unshift(item);
    this._render();
    document.getElementById('notif-dot')?.classList.remove('hidden');
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification(title, { body: desc }); } catch(e) {}
    }
  },

  _render() {
    const list = document.getElementById('np-list');
    if (!list) return;
    if (!this.items.length) {
      list.innerHTML = '<p class="np-empty">Bildirim yok</p>';
      return;
    }
    list.innerHTML = '';
    this.items.slice(0, 20).forEach(item => {
      const div = document.createElement('div');
      div.className = 'np-item';
      div.innerHTML = `
        <div class="np-item-icon" style="background:rgba(167,139,250,0.1)">
          <i class="fa ${item.icon}" style="color:var(--purple)"></i>
        </div>
        <div class="np-item-body">
          <div class="np-item-title">${item.title}</div>
          <div class="np-item-time">${item.desc}</div>
        </div>`;
      list.appendChild(div);
    });
  },

  showPanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    panel.classList.toggle('hidden');
    document.getElementById('notif-dot')?.classList.add('hidden');
    setTimeout(() => {
      const handler = e => {
        if (!panel.contains(e.target) && !e.target.closest('#notif-btn')) {
          panel.classList.add('hidden');
          document.removeEventListener('click', handler);
        }
      };
      document.addEventListener('click', handler);
    }, 150);
  },

  clearAll() {
    this.items = [];
    this._render();
    document.getElementById('notif-dot')?.classList.add('hidden');
  }
};

/* ═══════════════════════════════════════════════════
   PWA
═══════════════════════════════════════════════════ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
