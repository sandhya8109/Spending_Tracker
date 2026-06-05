// Authentication and User Management System

// Global variables for user management
let users = {};
let currentUser = null;
let currentPage = 'dashboard';

// Hash password using browser-native SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode('sbt_v1_' + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function isHashed(str) {
    return typeof str === 'string' && /^[a-f0-9]{64}$/.test(str);
}

// Initialize authentication system
function initializeAuth() {
  console.log('Initializing authentication system...');
  
  // Load existing users from localStorage
  loadUsersFromStorage();
  
  // Check for existing user session
  checkExistingSession();
  
  // Setup form event listeners
  setupAuthEventListeners();
  
  console.log('Authentication system initialized');
}

// Load users from localStorage
function loadUsersFromStorage() {
  try {
    const savedUsers = localStorage.getItem('budgetUsers');
    if (savedUsers) {
      users = JSON.parse(savedUsers);
      console.log(`Loaded ${Object.keys(users).length} existing users`);
    }
  } catch (error) {
    console.error('Error loading users from storage:', error);
    users = {};
  }
}

// Save users to localStorage
function saveUsersToStorage() {
  try {
    localStorage.setItem('budgetUsers', JSON.stringify(users));
    console.log('Users saved to storage');
  } catch (error) {
    console.error('Error saving users to storage:', error);
  }
}

// Check for existing user session
function checkExistingSession() {
  try {
    const savedCurrentUser = localStorage.getItem('budgetCurrentUser');
    if (savedCurrentUser) {
      currentUser = JSON.parse(savedCurrentUser);
      console.log('Found existing session for:', currentUser.name);
      showDashboard();
    } else {
      console.log('No existing session found, showing auth screen');
      showAuthScreen();
    }
  } catch (error) {
    console.error('Error checking existing session:', error);
    showAuthScreen();
  }
}

// Setup authentication event listeners
function setupAuthEventListeners() {
  // Login form
  const loginForm = document.getElementById('loginFormElement');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Signup form
  const signupForm = document.getElementById('signupFormElement');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
  
  console.log('Auth event listeners setup complete');
}

// Show/hide form functions
function showSignupForm() {
  console.log('Switching to signup form');
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('signupForm').classList.remove('hidden');
}

function showLoginForm() {
  console.log('Switching to login form');
  document.getElementById('signupForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
}

// Handle login form submission
function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  
  console.log('Attempting login for:', email);
  
  // Show loading state
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Signing In...';
  submitButton.disabled = true;
  
  // Hash then validate
  hashPassword(password).then(async (hashedInput) => {
    if (!email || !password) {
      showAuthError('Please fill in all fields');
      resetSubmitButton(submitButton, originalText);
      return;
    }

    if (!users[email]) {
      showAuthError('Account not found. Please check your email or sign up.');
      resetSubmitButton(submitButton, originalText);
      return;
    }

    const stored = users[email].password;
    let passwordMatch = false;

    if (isHashed(stored)) {
      // Normal path: compare hashes
      passwordMatch = stored === hashedInput;
    } else {
      // Migration path: stored password is still plaintext
      passwordMatch = stored === password;
      if (passwordMatch) {
        // Migrate to hashed
        users[email].password = hashedInput;
        saveUsersToStorage();
      }
    }

    if (!passwordMatch) {
      showAuthError('Incorrect password. Please try again.');
      resetSubmitButton(submitButton, originalText);
      return;
    }

    currentUser = users[email];
    currentUser.lastLogin = new Date().toISOString();
    localStorage.setItem('budgetCurrentUser', JSON.stringify(currentUser));
    users[email] = currentUser;
    saveUsersToStorage();

    showAuthSuccess(`Welcome back, ${currentUser.name}!`);
    setTimeout(() => showDashboard(), 1500);

  }).catch(() => {
    showAuthError('Login failed. Please try again.');
    resetSubmitButton(submitButton, originalText);
  });
}

// Handle signup form submission
function handleSignup(event) {
  event.preventDefault();
  
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const password = document.getElementById('signupPassword').value;
  const income = parseFloat(document.getElementById('signupIncome').value) || 0;
  
  console.log('Attempting signup for:', email);
  
  // Show loading state
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Creating Account...';
  submitButton.disabled = true;
  
  // Validate first, then hash
  if (!name || !email || !password) {
    showAuthError('Please fill in all required fields');
    resetSubmitButton(submitButton, originalText);
    return;
  }
  if (name.length < 2) {
    showAuthError('Name must be at least 2 characters long');
    resetSubmitButton(submitButton, originalText);
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAuthError('Please enter a valid email address');
    resetSubmitButton(submitButton, originalText);
    return;
  }
  if (password.length < 6) {
    showAuthError('Password must be at least 6 characters long');
    resetSubmitButton(submitButton, originalText);
    return;
  }
  if (users[email]) {
    showAuthError('An account with this email already exists. Please login instead.');
    resetSubmitButton(submitButton, originalText);
    setTimeout(() => {
      showLoginForm();
      document.getElementById('loginEmail').value = email;
    }, 2000);
    return;
  }
  if (income < 0 || income > 1000000) {
    showAuthError('Please enter a valid income amount');
    resetSubmitButton(submitButton, originalText);
    return;
  }

  hashPassword(password).then((hashedPw) => {
    const newUser = {
      id: Date.now() + Math.random(),
      name: name,
      email: email,
      password: hashedPw,
      incomeTarget: income,
      savingsGoal: income * 12 * 0.2,
      emergencyFund: income * 6,
      customCategories: {},
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    users[email] = newUser;
    currentUser = newUser;
    saveUsersToStorage();
    localStorage.setItem('budgetCurrentUser', JSON.stringify(currentUser));

    showAuthSuccess(`Account created successfully! Welcome, ${currentUser.name}!`);
    setTimeout(() => showDashboard(), 2000);

  }).catch(() => {
    showAuthError('Signup failed. Please try again.');
    resetSubmitButton(submitButton, originalText);
  });
}

// Reset submit button state
function resetSubmitButton(button, originalText) {
  button.textContent = originalText;
  button.disabled = false;
}

// Show authentication screens
function showAuthScreen() {
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('dashboardScreen').classList.add('hidden');

  // Hide AI chat button and panel
  const chatBtn = document.getElementById('chatToggleBtn');
  if (chatBtn) chatBtn.classList.add('hidden');
  const chatPanel = document.getElementById('aiChatPanel');
  if (chatPanel) chatPanel.classList.add('hidden');
  
  // Clear any existing error messages
  clearAuthMessages();
  
  // Reset forms
  const loginForm = document.getElementById('loginFormElement');
  const signupForm = document.getElementById('signupFormElement');
  if (loginForm) loginForm.reset();
  if (signupForm) signupForm.reset();
  
  // Show login form by default
  showLoginForm();
  
  // Focus on email field
  setTimeout(() => {
    const emailField = document.getElementById('loginEmail');
    if (emailField) emailField.focus();
  }, 100);
}

function showDashboard() {
  if (!currentUser) {
    showAuthScreen();
    return;
  }

  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('dashboardScreen').classList.remove('hidden');

  // Show AI chat button
  const chatBtn = document.getElementById('chatToggleBtn');
  if (chatBtn) chatBtn.classList.remove('hidden');
  
  // Update welcome message
  const welcomeUser = document.getElementById('welcomeUser');
  if (welcomeUser) {
    welcomeUser.textContent = `Welcome back, ${currentUser.name}!`;
  }
  
  // Initialize budget tracker with user context
  setTimeout(() => {
    if (typeof initializeBudgetTracker === 'function') {
      initializeBudgetTracker();
    } else {
      console.error('Budget tracker initialization function not found');
    }
  }, 500);
  
  // Show default dashboard page
  showDashboardPage('dashboard');
}

// Dashboard navigation
function showDashboardPage(page) {
  console.log('Navigating to page:', page);
  
  if (!currentUser) {
    console.error('No user session, redirecting to auth');
    showAuthScreen();
    return;
  }
  
  currentPage = page;
  
  // Hide all pages
  const pages = ['dashboard', 'transactions', 'budgets', 'analytics', 'profile', 'settings'];
  pages.forEach(p => {
    const pageElement = document.getElementById(`page-${p}`);
    if (pageElement) {
      pageElement.classList.add('hidden');
    }
  });
  
  // Show selected page
  const selectedPage = document.getElementById(`page-${page}`);
  if (selectedPage) {
    selectedPage.classList.remove('hidden');
  }
  
  // Update navigation active states
  pages.forEach(p => {
    const navItem = document.getElementById(`nav-${p}`);
    if (navItem) {
      if (p === page) {
        navItem.className = 'nav-item w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg bg-blue-50 text-blue-700 font-medium';
      } else {
        navItem.className = 'nav-item w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg hover:bg-gray-50 text-gray-700 transition-colors';
      }
    }
  });
  
  // Page-specific initialization
  switch(page) {
    case 'transactions':
      if (typeof renderFullTransactionsList === 'function') {
        setTimeout(() => renderFullTransactionsList(), 100);
      }
      break;
    case 'budgets':
      if (typeof loadBudgetsData === 'function') {
        setTimeout(() => loadBudgetsData(), 100);
      }
      break;
    case 'analytics':
      if (typeof updateCharts === 'function') {
        setTimeout(() => updateCharts(), 100);
      }
      if (typeof generateAIInsights === 'function') {
        setTimeout(() => generateAIInsights(), 200);
      }
      break;
    case 'profile':
      if (typeof loadProfileData === 'function') {
        setTimeout(() => loadProfileData(), 100);
      }
      break;
  }
}

// Sidebar toggle for mobile
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  
  if (sidebar && mainContent) {
    const isHidden = sidebar.style.transform === 'translateX(-100%)';
    
    if (isHidden) {
      sidebar.style.transform = 'translateX(0)';
    } else {
      sidebar.style.transform = 'translateX(-100%)';
    }
  }
}

// Logout function
function logout() {
  console.log('Logging out user:', currentUser?.name);
  
  if (confirm('Are you sure you want to logout?')) {
    // Clear current user session
    currentUser = null;
    localStorage.removeItem('budgetCurrentUser');
    
    // Show auth screen
    showAuthScreen();
    
    showAuthSuccess('Logged out successfully!');
  }
}

// Authentication message functions
function showAuthError(message) {
  clearAuthMessages();
  const authScreen = document.getElementById('authScreen');
  const errorDiv = document.createElement('div');
  errorDiv.id = 'authMessage';
  errorDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 max-w-sm text-center';
  errorDiv.innerHTML = `
    <div class="flex items-center justify-center space-x-2">
      <span>❌</span>
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(errorDiv);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove();
    }
  }, 4000);
}

function showAuthSuccess(message) {
  clearAuthMessages();
  const successDiv = document.createElement('div');
  successDiv.id = 'authMessage';
  successDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 max-w-sm text-center';
  successDiv.innerHTML = `
    <div class="flex items-center justify-center space-x-2">
      <span>✅</span>
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(successDiv);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.remove();
    }
  }, 3000);
}

function clearAuthMessages() {
  const existing = document.getElementById('authMessage');
  if (existing) {
    existing.remove();
  }
}

// Profile and Settings functions (stubs for now)
function loadProfileData() {
  if (!currentUser) return;
  
  // Pre-fill profile form fields if they exist
  const savingsGoalInput = document.getElementById('savingsGoal');
  const incomeTargetInput = document.getElementById('incomeTarget');
  const emergencyFundInput = document.getElementById('emergencyFund');
  
  if (savingsGoalInput) savingsGoalInput.value = currentUser.savingsGoal || '';
  if (incomeTargetInput) incomeTargetInput.value = currentUser.incomeTarget || '';
  if (emergencyFundInput) emergencyFundInput.value = currentUser.emergencyFund || '';
  
  console.log('Profile data loaded for:', currentUser.name);
}

function loadBudgetsData() {
  console.log('Loading budgets data...');
  // This will be implemented when budget management is expanded
}

// Make functions globally available
window.initializeAuth = initializeAuth;
window.showSignupForm = showSignupForm;
window.showLoginForm = showLoginForm;
window.showDashboardPage = showDashboardPage;
window.toggleSidebar = toggleSidebar;
window.logout = logout;
window.loadProfileData = loadProfileData;
window.loadBudgetsData = loadBudgetsData;

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
  initializeAuth();
}