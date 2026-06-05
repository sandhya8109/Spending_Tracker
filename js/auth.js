// Smart Budget Tracker - Authentication System
// SHA-256 password hashing via browser crypto.subtle

let users = {};
let currentUser = null;
let currentPage = 'dashboard';

// ── Password hashing ──────────────────────────────────────────────────────────

async function hashPassword(password) {
  const text = 'sbt_v1_' + password;
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function isHashed(str) {
  return /^[a-f0-9]{64}$/.test(str);
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function loadUsersFromStorage() {
  try {
    const raw = localStorage.getItem('budgetUsers');
    users = raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Failed to load users:', e);
    users = {};
  }
}

function saveUsersToStorage() {
  try {
    localStorage.setItem('budgetUsers', JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users:', e);
  }
}

// ── Session ───────────────────────────────────────────────────────────────────

function checkExistingSession() {
  try {
    const saved = localStorage.getItem('budgetCurrentUser');
    if (saved) {
      const user = JSON.parse(saved);
      if (user && user.email && users[user.email]) {
        currentUser = users[user.email];
        showDashboard();
        return;
      }
    }
  } catch (e) {
    console.warn('Session check failed:', e);
  }
  showAuthScreen();
}

// ── Event listeners ───────────────────────────────────────────────────────────

function setupAuthEventListeners() {
  const loginEl = document.getElementById('loginFormElement');
  if (loginEl) loginEl.addEventListener('submit', handleLogin);

  const signupEl = document.getElementById('signupFormElement');
  if (signupEl) signupEl.addEventListener('submit', handleSignup);
}

// ── Login ─────────────────────────────────────────────────────────────────────

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showAuthError('login', 'Please fill in all fields.');
    return;
  }

  const user = users[email];
  if (!user) {
    showAuthError('login', 'No account found with that email. Please sign up.');
    return;
  }

  // Compare — support plaintext migration
  let match = false;
  if (isHashed(user.password)) {
    const hashed = await hashPassword(password);
    match = hashed === user.password;
  } else {
    // plaintext migration path
    if (password === user.password) {
      match = true;
      // Upgrade to hashed
      user.password = await hashPassword(password);
      users[email] = user;
      saveUsersToStorage();
    }
  }

  if (!match) {
    showAuthError('login', 'Incorrect password. Please try again.');
    return;
  }

  currentUser = user;
  localStorage.setItem('budgetCurrentUser', JSON.stringify({ email: user.email, name: user.name }));
  showAuthSuccess('login', 'Welcome back, ' + user.name + '!');
  setTimeout(() => showDashboard(), 500);
}

// ── Signup ────────────────────────────────────────────────────────────────────

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const password = document.getElementById('signupPassword').value;
  const incomeVal = document.getElementById('signupIncome').value;

  if (name.length < 2) {
    showAuthError('signup', 'Name must be at least 2 characters.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAuthError('signup', 'Please enter a valid email address.');
    return;
  }
  if (password.length < 6) {
    showAuthError('signup', 'Password must be at least 6 characters.');
    return;
  }
  if (users[email]) {
    showAuthError('signup', 'An account with that email already exists. Please sign in.');
    return;
  }

  const hashed = await hashPassword(password);
  const newUser = {
    name,
    email,
    password: hashed,
    income: parseFloat(incomeVal) || 0,
    createdAt: new Date().toISOString(),
    categories: { income: [], expense: [] },
    goals: { savingsGoal: 0, incomeTarget: 0, emergencyFund: 0 },
    transactions: [],
    adjustableBudgets: {}
  };

  users[email] = newUser;
  saveUsersToStorage();

  currentUser = newUser;
  localStorage.setItem('budgetCurrentUser', JSON.stringify({ email, name }));
  showAuthSuccess('signup', 'Account created! Welcome, ' + name + '!');
  setTimeout(() => showDashboard(), 600);
}

// ── Screen management ─────────────────────────────────────────────────────────

function showAuthScreen() {
  const authEl = document.getElementById('authScreen');
  const dashEl = document.getElementById('dashboardScreen');
  const chatBtn = document.getElementById('chatToggleBtn');
  const chatPanel = document.getElementById('aiChatPanel');

  if (authEl) authEl.classList.remove('hidden');
  if (dashEl) dashEl.classList.add('hidden');
  if (chatBtn) chatBtn.classList.add('hidden');
  if (chatPanel) chatPanel.classList.add('hidden');

  // Reset forms
  const loginForm = document.getElementById('loginFormElement');
  const signupForm = document.getElementById('signupFormElement');
  if (loginForm) loginForm.reset();
  if (signupForm) signupForm.reset();

  // Hide error/success messages
  ['loginError', 'loginSuccess', 'signupError', 'signupSuccess'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // Focus email
  setTimeout(() => {
    const emailInput = document.getElementById('loginEmail');
    if (emailInput) emailInput.focus();
  }, 100);
}

function showDashboard() {
  const authEl = document.getElementById('authScreen');
  const dashEl = document.getElementById('dashboardScreen');
  const chatBtn = document.getElementById('chatToggleBtn');

  if (authEl) authEl.classList.add('hidden');
  if (dashEl) dashEl.classList.remove('hidden');

  // Show chat button (flex so the icon centers)
  if (chatBtn) {
    chatBtn.classList.remove('hidden');
    chatBtn.style.display = 'flex';
  }

  // Update welcome text
  const welcomeEl = document.getElementById('welcomeUser');
  if (welcomeEl && currentUser) {
    welcomeEl.textContent = '👤 ' + (currentUser.name || currentUser.email);
  }

  // Populate month selector
  populateMonthSelector();

  // Initialize budget tracker after brief delay
  setTimeout(() => {
    if (typeof initializeBudgetTracker === 'function') {
      initializeBudgetTracker();
    }
  }, 500);

  showDashboardPage('dashboard');
}

function showDashboardPage(page) {
  currentPage = page;

  // Hide all pages
  document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));

  // Remove active state from all nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('nav-active'));

  // Show selected page
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.remove('hidden');

  // Set nav active
  const navBtn = document.getElementById('nav-' + page);
  if (navBtn) navBtn.classList.add('nav-active');

  // Close sidebar on mobile
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (window.innerWidth < 768) {
    if (sidebar) sidebar.classList.remove('translate-x-0');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (overlay) overlay.classList.add('hidden');
  }

  // Page-specific logic
  switch (page) {
    case 'settings':
      // Prefill API key
      if (typeof GroqChat !== 'undefined') {
        const keyInput = document.getElementById('groqApiKey');
        if (keyInput) keyInput.value = GroqChat.getApiKey() || '';
      }
      if (typeof updateDebugInfo === 'function') updateDebugInfo();
      break;

    case 'transactions':
      if (typeof renderFullTransactionsList === 'function') renderFullTransactionsList();
      break;

    case 'analytics':
      if (typeof updateCharts === 'function') updateCharts();
      if (typeof generateAIInsights === 'function') generateAIInsights();
      break;

    case 'budgets':
      if (typeof loadBudgetsData === 'function') loadBudgetsData();
      break;

    case 'profile':
      if (typeof loadProfileData === 'function') loadProfileData();
      break;

    default:
      break;
  }
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar) return;

  const isOpen = !sidebar.classList.contains('-translate-x-full');
  if (isOpen) {
    sidebar.classList.add('-translate-x-full');
    sidebar.classList.remove('translate-x-0');
    if (overlay) overlay.classList.add('hidden');
  } else {
    sidebar.classList.remove('-translate-x-full');
    sidebar.classList.add('translate-x-0');
    if (overlay) overlay.classList.remove('hidden');
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────

function logout() {
  currentUser = null;
  localStorage.removeItem('budgetCurrentUser');
  // Close chat panel
  const chatPanel = document.getElementById('aiChatPanel');
  if (chatPanel) chatPanel.classList.add('hidden');
  showAuthScreen();
}

// ── Error/Success messages ────────────────────────────────────────────────────

function showAuthError(form, msg) {
  const errEl = document.getElementById(form + 'Error');
  const okEl = document.getElementById(form + 'Success');
  if (errEl) { errEl.textContent = msg; errEl.classList.remove('hidden'); }
  if (okEl) okEl.classList.add('hidden');
}

function showAuthSuccess(form, msg) {
  const okEl = document.getElementById(form + 'Success');
  const errEl = document.getElementById(form + 'Error');
  if (okEl) { okEl.textContent = msg; okEl.classList.remove('hidden'); }
  if (errEl) errEl.classList.add('hidden');
}

// ── Month selector helper ─────────────────────────────────────────────────────

function populateMonthSelector() {
  const sel = document.getElementById('monthSelector');
  if (!sel) return;

  const now = new Date();
  const options = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = d.toISOString().substring(0, 7);
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push(`<option value="${value}">${label}</option>`);
  }
  // Add future month
  const nextD = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextVal = nextD.toISOString().substring(0, 7);
  const nextLabel = nextD.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  options.push(`<option value="${nextVal}">${nextLabel}</option>`);

  sel.innerHTML = options.join('');

  // Default to current month
  const currentMonthVal = now.toISOString().substring(0, 7);
  sel.value = currentMonthVal;
}

// ── Initialization ────────────────────────────────────────────────────────────

function initializeAuth() {
  loadUsersFromStorage();
  checkExistingSession();
  setupAuthEventListeners();
}

document.addEventListener('DOMContentLoaded', initializeAuth);

// ── Exports to window ─────────────────────────────────────────────────────────

window.hashPassword = hashPassword;
window.isHashed = isHashed;
window.loadUsersFromStorage = loadUsersFromStorage;
window.saveUsersToStorage = saveUsersToStorage;
window.checkExistingSession = checkExistingSession;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.showAuthScreen = showAuthScreen;
window.showDashboard = showDashboard;
window.showDashboardPage = showDashboardPage;
window.toggleSidebar = toggleSidebar;
window.logout = logout;
window.showAuthError = showAuthError;
window.showAuthSuccess = showAuthSuccess;
window.populateMonthSelector = populateMonthSelector;
window.initializeAuth = initializeAuth;
window.currentUser = currentUser;  // getter via closure — reassigned on login
window.getCurrentUser = () => currentUser;
