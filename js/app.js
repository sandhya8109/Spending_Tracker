// Smart Budget Tracker - Main Application Logic
// Pure vanilla JS, no dependencies required

// ── Default categories ────────────────────────────────────────────────────────

const defaultSubcategories = {
  income: [
    { value: 'UCO',        text: '🏫 UCO',        budget: 1000 },
    { value: 'GONG',       text: '💼 Private',     budget: 1300 },
    { value: 'Freelance',  text: '💻 Freelance',   budget: 500 },
    { value: 'Investment', text: '📈 Investment',  budget: 200 }
  ],
  expense: [
    { value: 'Rent',      text: '🏠 Rent',       budget: 300 },
    { value: 'Grocery',   text: '🛒 Grocery',    budget: 200 },
    { value: 'Food',      text: '🍕 Food',       budget: 100 },
    { value: 'Petrol',    text: '⛽ Petrol',     budget: 120 },
    { value: 'Home',      text: '🏡 Home',       budget: 250 },
    { value: 'Gym',       text: '💪 Gym',        budget: 80 },
    { value: 'Mobile',    text: '📱 Mobile',     budget: 60 },
    { value: 'Extra',     text: '✨ Extra',      budget: 50 },
    { value: 'Insurance', text: '🛡️ Insurance', budget: 150 },
    { value: 'Tuition',   text: '🎓 Tuition',   budget: 1000 }
  ]
};

// ── State ─────────────────────────────────────────────────────────────────────

let transactions = [];
let adjustableBudgets = {};
let selectedMonth = new Date().toISOString().substring(0, 7);
let _debounceTimer = null;
let _chartInstances = {};

// ── AI category keywords ──────────────────────────────────────────────────────

const _categoryKeywords = {
  Grocery: ['walmart','costco','kroger','sainsbury','tesco','lidl','asda','trader joe','whole foods','market','supermarket','grocery','aldi','publix','safeway','wegmans','sprouts','fresh','produce'],
  Food: ['restaurant','pizza','mcdonalds','mcdonald','subway','starbucks','coffee','cafe','burger','kfc','taco','chipotle','domino','lunch','dinner','breakfast','takeaway','takeout','doordash','ubereats','zomato','swiggy','eat','sushi','noodle','chinese','thai','indian','kebab','wrap','sandwich','bagel','diner','bistro','grill','bbq','fried chicken','popeyes','wendys','wendy','arbys','panera','panda'],
  Petrol: ['gas','fuel','petrol','shell','exxon','bp','chevron','pump','mobil','texaco','caltex','filling station','service station','gasoline','diesel','unleaded'],
  Rent: ['rent','apartment','mortgage','lease','housing','landlord','flat','studio','condo','property'],
  Mobile: ['phone','mobile','verizon','att','at&t','tmobile','t-mobile','cell','sim','airtel','jio','vodafone','plan','carrier','prepaid','postpaid','data plan'],
  Gym: ['gym','fitness','workout','yoga','crossfit','membership','planet fitness','la fitness','anytime fitness','24 hour','equinox','orange theory','orangetheory','pilates','spin','cycling class','weight'],
  Home: ['furniture','ikea','home depot','lowes','appliance','cleaning','decor','hardware','mattress','repair','maintenance','plumber','electrician','carpet','curtain','towel','bedding'],
  Insurance: ['insurance','premium','coverage','geico','allstate','progressive','state farm','farmers','nationwide','usaa','aetna','humana','cigna','blue cross','dental','vision','life insurance','health insurance','car insurance','auto insurance'],
  Tuition: ['tuition','school','education','college','university','course','class','udemy','coursera','edx','skillshare','linkedin learning','bootcamp','training','seminar','textbook','books','study'],
  Extra: ['amazon','netflix','spotify','hulu','disney','subscription','entertainment','movie','cinema','shopping','online','apple','google play','itunes','gaming','steam','xbox','playstation','nintendo','ebay','etsy','alibaba','wish','target','bestbuy','best buy','macys','nordstrom','zara','h&m','clothing','shoes','fashion','accessories']
};

function localCategorize(text) {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(_categoryKeywords)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return cat;
    }
  }
  return null;
}

// ── Initialization ────────────────────────────────────────────────────────────

function initializeBudgetTracker() {
  loadUserData();

  // Set month selector
  const sel = document.getElementById('monthSelector');
  if (sel) {
    if (!sel.value) sel.value = selectedMonth;
    else selectedMonth = sel.value;
  }

  // Set today's date
  const dateInput = document.getElementById('entryDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  // Attach event listeners
  const itemInput = document.getElementById('item');
  if (itemInput) {
    itemInput.addEventListener('input', handleItemInput);
  }

  const receiptInput = document.getElementById('receiptUpload');
  if (receiptInput) {
    receiptInput.addEventListener('change', handleReceiptUpload);
  }

  updateSubcategories();
  renderMobileView();
  renderTables();
  initializeCharts();
}

// ── Form submission ───────────────────────────────────────────────────────────

function handleFormSubmit(e) {
  e.preventDefault();

  const itemEl    = document.getElementById('item');
  const amountEl  = document.getElementById('amount');
  const catEl     = document.getElementById('category');
  const subEl     = document.getElementById('subcategory');
  const dateEl    = document.getElementById('entryDate');

  const description = itemEl.value.trim();
  const amount      = parseFloat(amountEl.value);
  const category    = catEl.value;
  const subcategory = subEl.value;
  const entryDate   = dateEl.value;

  if (!description) { showNotification('Please enter a description.', 'error'); return; }
  if (!amount || amount <= 0) { showNotification('Please enter a valid amount.', 'error'); return; }
  if (!entryDate) { showNotification('Please select a date.', 'error'); return; }

  const transaction = {
    id: Date.now().toString(),
    item: description,
    amount,
    category,
    subcategory,
    date: entryDate,
    month: entryDate.substring(0, 7),
    createdAt: new Date().toISOString()
  };

  transactions.push(transaction);
  saveUserData();

  // Reset form
  itemEl.value = '';
  amountEl.value = '';
  document.getElementById('aiSuggestionBox').innerHTML = '';

  // Reset date to today
  dateEl.value = new Date().toISOString().split('T')[0];

  renderMobileView();
  renderTables();
  showNotification('Transaction added!', 'success');
}

// ── AI item input handler ─────────────────────────────────────────────────────

function handleItemInput(e) {
  const text = e.target.value.trim();
  const box = document.getElementById('aiSuggestionBox');
  if (!box) return;

  if (text.length < 2) {
    box.innerHTML = '';
    return;
  }

  // Instant local suggestion
  const localCat = localCategorize(text);
  if (localCat) {
    box.innerHTML = `<span class="text-blue-600">🤖 Suggested: <strong>${localCat}</strong> · <button type="button" onclick="applyAICategory('${localCat}')" class="underline font-semibold hover:text-blue-800">tap to apply</button></span>`;
  }

  // Debounced backend call
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(async () => {
    try {
      const resp = await fetch('/api/suggest-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text, amount: 0, category: 'expense' }),
        signal: AbortSignal.timeout(3000)
      });
      if (!resp.ok) return;
      const data = await resp.json();
      if (data.category && data.category !== 'Extra') {
        const conf = data.confidence ? Math.round(data.confidence * 100) : '';
        const confStr = conf ? ` ${conf}% confident` : '';
        box.innerHTML = `<span class="text-purple-600">🧠 AI suggests: <strong>${data.category}</strong>${confStr} · <button type="button" onclick="applyAICategory('${data.category}')" class="underline font-semibold hover:text-purple-800">tap to apply</button></span>`;
      }
    } catch (_) {
      // Backend offline — local suggestion already shown
    }
  }, 600);
}

function applyAICategory(category) {
  // Map category name to type
  const incomeCategories = ['UCO', 'GONG', 'Freelance', 'Investment'];
  const isIncome = incomeCategories.includes(category);

  const catEl = document.getElementById('category');
  if (catEl) {
    catEl.value = isIncome ? 'income' : 'expense';
    catEl.dispatchEvent(new Event('change'));
  }

  // Set subcategory after options populate
  setTimeout(() => {
    const subEl = document.getElementById('subcategory');
    if (subEl) {
      // Find option matching category (case-insensitive)
      const options = Array.from(subEl.options);
      const match = options.find(o => o.value.toLowerCase() === category.toLowerCase());
      if (match) subEl.value = match.value;
    }

    const box = document.getElementById('aiSuggestionBox');
    if (box) {
      box.innerHTML = `<span class="text-green-600">✅ Category set to <strong>${category}</strong></span>`;
    }
  }, 80);
}
window.applyAICategory = applyAICategory;

// ── Subcategory update ────────────────────────────────────────────────────────

function updateSubcategories() {
  const catEl = document.getElementById('category');
  const subEl = document.getElementById('subcategory');
  if (!catEl || !subEl) return;

  const type = catEl.value;
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;

  // Merge default + custom categories
  let cats = [...(defaultSubcategories[type] || [])];
  if (user && user.categories && user.categories[type]) {
    user.categories[type].forEach(c => {
      if (!cats.find(d => d.value === c.value)) cats.push(c);
    });
  }

  subEl.innerHTML = cats.map(c => `<option value="${c.value}">${c.text}</option>`).join('');
}
window.updateSubcategories = updateSubcategories;

function changeMonth(val) {
  selectedMonth = val;
  renderMobileView();
  renderTables();
}
window.changeMonth = changeMonth;

// ── Month filtering helper ────────────────────────────────────────────────────

function getMonthTransactions(month) {
  return transactions.filter(t => (t.month || t.date?.substring(0, 7)) === month);
}

// ── Render dashboard view ─────────────────────────────────────────────────────

function renderMobileView() {
  const monthTxns = getMonthTransactions(selectedMonth);

  const totalIncome  = monthTxns.filter(t => t.category === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxns.filter(t => t.category === 'expense').reduce((s, t) => s + t.amount, 0);
  const netBalance   = totalIncome - totalExpense;

  // Update stat cards
  const incomeCard   = document.getElementById('totalIncomeCard');
  const expenseCard  = document.getElementById('totalExpenseCard');
  const balanceCard  = document.getElementById('netBalanceCard');

  if (incomeCard)  incomeCard.querySelector('.income-amount').textContent   = '$' + totalIncome.toFixed(2);
  if (expenseCard) expenseCard.querySelector('.expense-amount').textContent = '$' + totalExpense.toFixed(2);
  if (balanceCard) {
    const el = balanceCard.querySelector('.balance-amount');
    el.textContent = '$' + Math.abs(netBalance).toFixed(2);
    el.className = 'balance-amount text-2xl font-bold ' + (netBalance >= 0 ? 'text-indigo-600' : 'text-red-600');
    if (netBalance < 0) el.textContent = '-$' + Math.abs(netBalance).toFixed(2);
  }

  // Render recent transactions (last 10)
  const listEl = document.getElementById('transactionList');
  if (listEl) {
    const sorted = [...monthTxns].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    if (sorted.length === 0) {
      listEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No transactions for this month yet.</p>';
    } else {
      listEl.innerHTML = sorted.map(t => createTransactionCard(t)).join('');
    }
  }
}

// ── Transaction card HTML ─────────────────────────────────────────────────────

function createTransactionCard(t) {
  const isIncome = t.category === 'income';
  const color = isIncome ? 'text-green-600' : 'text-red-500';
  const sign  = isIncome ? '+' : '-';
  const icon  = getCategoryIcon(t.subcategory);
  const dateStr = t.date ? new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  return `
    <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition group" data-id="${t.id}">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-9 h-9 rounded-full bg-white dark:bg-gray-600 shadow-sm flex items-center justify-center text-lg flex-shrink-0">${icon}</div>
        <div class="min-w-0">
          <div class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">${escapeHtml(t.item)}</div>
          <div class="text-xs text-gray-400 dark:text-gray-500">${t.subcategory || ''} · ${dateStr}</div>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="text-sm font-semibold ${color}">${sign}$${t.amount.toFixed(2)}</span>
        <div class="hidden group-hover:flex gap-1">
          <button onclick="editTransaction('${t.id}')" class="text-xs text-blue-500 hover:text-blue-700 px-1.5 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Edit">✏️</button>
          <button onclick="deleteTransaction('${t.id}')" class="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30" title="Delete">🗑️</button>
        </div>
      </div>
    </div>`;
}

function getCategoryIcon(subcategory) {
  const icons = {
    Grocery: '🛒', Food: '🍕', Petrol: '⛽', Rent: '🏠', Home: '🏡',
    Gym: '💪', Mobile: '📱', Extra: '✨', Insurance: '🛡️', Tuition: '🎓',
    UCO: '🏫', GONG: '💼', Freelance: '💻', Investment: '📈'
  };
  return icons[subcategory] || '💰';
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Render legacy tables ──────────────────────────────────────────────────────

function renderTables() {
  // These are hidden compat elements; just update their content
  const monthTxns = getMonthTransactions(selectedMonth);

  const ttBody = document.querySelector('#transactionTable tbody');
  if (ttBody) ttBody.innerHTML = monthTxns.map(t => `<tr><td>${escapeHtml(t.item)}</td><td>${t.amount}</td><td>${t.category}</td><td>${t.subcategory}</td><td>${t.date}</td></tr>`).join('');

  const etBody = document.querySelector('#expenseTable tbody');
  if (etBody) {
    const exp = monthTxns.filter(t => t.category === 'expense');
    etBody.innerHTML = exp.map(t => `<tr><td>${escapeHtml(t.item)}</td><td>${t.amount}</td><td>${t.subcategory}</td><td>${t.date}</td></tr>`).join('');
  }

  const itBody = document.querySelector('#incomeTable tbody');
  if (itBody) {
    const inc = monthTxns.filter(t => t.category === 'income');
    itBody.innerHTML = inc.map(t => `<tr><td>${escapeHtml(t.item)}</td><td>${t.amount}</td><td>${t.subcategory}</td><td>${t.date}</td></tr>`).join('');
  }
}

// ── Transactions page ─────────────────────────────────────────────────────────

function renderFullTransactionsList() {
  const monthTxns = getMonthTransactions(selectedMonth);
  const sorted = [...monthTxns].sort((a, b) => new Date(b.date) - new Date(a.date));

  const fullEl   = document.getElementById('transactionListFull');
  const expEl    = document.getElementById('expenseList');
  const incEl    = document.getElementById('incomeList');
  const titleEl  = document.getElementById('transactionTitle');
  const exTitleEl = document.getElementById('expenseTitle');
  const incTitleEl = document.getElementById('incomeTitle');

  const expenses = sorted.filter(t => t.category === 'expense');
  const income   = sorted.filter(t => t.category === 'income');

  if (fullEl) {
    if (sorted.length === 0) {
      fullEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No transactions for this month.</p>';
    } else {
      fullEl.innerHTML = sorted.map(t => createTransactionCard(t)).join('');
    }
  }
  if (expEl) {
    expEl.innerHTML = expenses.length
      ? expenses.map(t => createTransactionCard(t)).join('')
      : '<p class="text-gray-400 text-sm text-center py-8">No expenses this month.</p>';
  }
  if (incEl) {
    incEl.innerHTML = income.length
      ? income.map(t => createTransactionCard(t)).join('')
      : '<p class="text-gray-400 text-sm text-center py-8">No income recorded this month.</p>';
  }
  if (titleEl)   titleEl.textContent   = `All Transactions (${sorted.length})`;
  if (exTitleEl) exTitleEl.textContent = `Expenses (${expenses.length})`;
  if (incTitleEl) incTitleEl.textContent = `Income (${income.length})`;
}
window.renderFullTransactionsList = renderFullTransactionsList;

function switchTransactionTab(tab) {
  // Update tab buttons
  ['transactions', 'expenses', 'income'].forEach(t => {
    const btn = document.getElementById('tab-btn-' + t);
    const content = document.getElementById('content-' + t);
    if (t === tab) {
      if (btn) { btn.classList.add('tab-active', 'border-indigo-600', 'text-indigo-600'); btn.classList.remove('text-gray-500', 'border-transparent'); }
      if (content) content.classList.remove('hidden');
    } else {
      if (btn) { btn.classList.remove('tab-active', 'border-indigo-600', 'text-indigo-600'); btn.classList.add('text-gray-500', 'border-transparent'); }
      if (content) content.classList.add('hidden');
    }
  });
}
window.switchTransactionTab = switchTransactionTab;

// ── Budgets page ──────────────────────────────────────────────────────────────

function loadBudgetsData() {
  const container = document.getElementById('budgetCardsContainer');
  if (!container) return;

  const monthTxns = getMonthTransactions(selectedMonth);
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;

  let allCats = [...defaultSubcategories.expense];
  if (user && user.categories && user.categories.expense) {
    user.categories.expense.forEach(c => {
      if (!allCats.find(d => d.value === c.value)) allCats.push(c);
    });
  }

  if (allCats.length === 0) {
    container.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No expense categories found.</p>';
    return;
  }

  container.innerHTML = allCats.map(cat => {
    const budget = adjustableBudgets[cat.value] !== undefined ? adjustableBudgets[cat.value] : cat.budget;
    const spent  = monthTxns.filter(t => t.category === 'expense' && t.subcategory === cat.value).reduce((s, t) => s + t.amount, 0);
    const pct    = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
    const over   = spent > budget && budget > 0;
    return createCategoryCard(cat.text, { spent, budget }, 'expense', budget, cat.value);
  }).join('');

  attachBudgetListeners();
}
window.loadBudgetsData = loadBudgetsData;

function createCategoryCard(text, data, type, budget, key) {
  const spent = data.spent || 0;
  const pct   = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const over  = spent > budget && budget > 0;
  const barColor = over ? 'bg-red-500' : pct > 75 ? 'bg-amber-400' : 'bg-green-500';

  return `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="font-medium text-sm text-gray-800 dark:text-gray-100">${text}</span>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 dark:text-gray-400">Budget:</span>
          <select data-key="${key}" onchange="handleBudgetChange('${key}', this.value)"
            class="text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400">
            ${generateBudgetOptions(budget)}
          </select>
        </div>
      </div>
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
        <span>Spent: <strong class="${over ? 'text-red-600' : 'text-gray-800 dark:text-gray-100'}">$${spent.toFixed(2)}</strong></span>
        <span>${pct.toFixed(0)}%${over ? ' ⚠️ Over budget!' : ''}</span>
      </div>
      <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div class="${barColor} h-2 rounded-full transition-all" style="width:${pct}%"></div>
      </div>
    </div>`;
}

function generateBudgetOptions(current) {
  const options = [0,50,75,80,100,120,150,200,250,300,400,500,600,750,800,1000,1200,1500,2000,2500,3000];
  // Ensure current value is included
  if (!options.includes(current)) options.push(current);
  options.sort((a, b) => a - b);
  return options.map(v => `<option value="${v}" ${v === current ? 'selected' : ''}>$${v}</option>`).join('');
}

function handleBudgetChange(key, val) {
  adjustableBudgets[key] = parseFloat(val) || 0;
  saveUserData();
  showNotification('Budget updated for ' + key, 'success', 2000);
}
window.handleBudgetChange = handleBudgetChange;

function attachBudgetListeners() {
  // Handled via inline onchange
}

// ── Profile page ──────────────────────────────────────────────────────────────

function loadProfileData() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user) return;

  const goals = user.goals || {};
  const sgEl = document.getElementById('savingsGoal');
  const itEl = document.getElementById('incomeTarget');
  const efEl = document.getElementById('emergencyFund');
  if (sgEl) sgEl.value = goals.savingsGoal || '';
  if (itEl) itEl.value = goals.incomeTarget || '';
  if (efEl) efEl.value = goals.emergencyFund || '';

  renderGoalProgress();
  renderCustomCategories();
}
window.loadProfileData = loadProfileData;

function renderGoalProgress() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const progressEl = document.getElementById('goalProgress');
  if (!progressEl) return;

  if (!user || !user.goals) {
    progressEl.innerHTML = '<p class="text-gray-400 text-sm">Set your goals to see progress.</p>';
    return;
  }

  const goals = user.goals;
  const monthTxns = getMonthTransactions(selectedMonth);
  const income  = monthTxns.filter(t => t.category === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTxns.filter(t => t.category === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;

  const items = [];

  if (goals.savingsGoal > 0) {
    const pct = Math.min(100, (savings / goals.savingsGoal) * 100);
    const ok  = savings >= goals.savingsGoal;
    items.push(goalProgressBar('Monthly Savings', savings, goals.savingsGoal, pct, ok));
  }
  if (goals.incomeTarget > 0) {
    const pct = Math.min(100, (income / goals.incomeTarget) * 100);
    const ok  = income >= goals.incomeTarget;
    items.push(goalProgressBar('Income Target', income, goals.incomeTarget, pct, ok));
  }
  if (goals.emergencyFund > 0) {
    // Use all-time savings as proxy
    const allSavings = transactions.reduce((s, t) => {
      return s + (t.category === 'income' ? t.amount : -t.amount);
    }, 0);
    const eff = Math.max(0, allSavings);
    const pct = Math.min(100, (eff / goals.emergencyFund) * 100);
    items.push(goalProgressBar('Emergency Fund (all-time)', eff, goals.emergencyFund, pct, eff >= goals.emergencyFund));
  }

  progressEl.innerHTML = items.length ? items.join('') : '<p class="text-gray-400 text-sm">No goals set yet.</p>';
}

function goalProgressBar(label, current, target, pct, achieved) {
  const color = achieved ? 'bg-green-500' : pct > 75 ? 'bg-blue-500' : 'bg-indigo-400';
  return `
    <div>
      <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
        <span>${label}</span>
        <span class="${achieved ? 'text-green-600 font-semibold' : ''}">$${current.toFixed(2)} / $${target.toFixed(2)} ${achieved ? '✅' : ''}</span>
      </div>
      <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div class="${color} h-2 rounded-full transition-all" style="width:${pct}%"></div>
      </div>
    </div>`;
}

function saveGoals(e) {
  e.preventDefault();
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user) return;

  user.goals = {
    savingsGoal: parseFloat(document.getElementById('savingsGoal').value) || 0,
    incomeTarget: parseFloat(document.getElementById('incomeTarget').value) || 0,
    emergencyFund: parseFloat(document.getElementById('emergencyFund').value) || 0
  };

  // Persist
  if (typeof users !== 'undefined' && typeof saveUsersToStorage === 'function') {
    users[user.email] = user;
    saveUsersToStorage();
  }

  renderGoalProgress();
  showNotification('Goals saved!', 'success');
}
window.saveGoals = saveGoals;

function addCustomCategory(e) {
  e.preventDefault();
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user) return;

  const name   = document.getElementById('categoryName').value.trim();
  const type   = document.getElementById('categoryType').value;
  const budget = parseFloat(document.getElementById('categoryBudget').value) || 0;

  if (!name) { showNotification('Please enter a category name.', 'error'); return; }

  if (!user.categories) user.categories = { income: [], expense: [] };
  if (!user.categories[type]) user.categories[type] = [];

  // Check duplicate
  if (user.categories[type].find(c => c.value.toLowerCase() === name.toLowerCase())) {
    showNotification('Category already exists.', 'error');
    return;
  }

  const emoji = type === 'income' ? '💵' : '🏷️';
  user.categories[type].push({ value: name, text: emoji + ' ' + name, budget });

  if (typeof users !== 'undefined' && typeof saveUsersToStorage === 'function') {
    users[user.email] = user;
    saveUsersToStorage();
  }

  document.getElementById('addCategoryForm').reset();
  renderCustomCategories();
  updateSubcategories();
  showNotification('Category "' + name + '" added!', 'success');
}
window.addCustomCategory = addCustomCategory;

function renderCustomCategories() {
  const container = document.getElementById('customCategories');
  if (!container) return;
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user || !user.categories) {
    container.innerHTML = '<p class="text-gray-400 text-sm">No custom categories yet.</p>';
    return;
  }

  const items = [];
  ['income', 'expense'].forEach(type => {
    (user.categories[type] || []).forEach(cat => {
      items.push(`
        <div class="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="text-sm"><span class="font-medium dark:text-gray-100">${escapeHtml(cat.text)}</span> <span class="text-xs text-gray-400 dark:text-gray-500">${type} · $${cat.budget}/mo</span></div>
          <button onclick="deleteCustomCategory('${escapeHtml(cat.value)}','${type}')" class="text-red-400 hover:text-red-600 text-xs">✕</button>
        </div>`);
    });
  });

  container.innerHTML = items.length ? items.join('') : '<p class="text-gray-400 text-sm">No custom categories yet.</p>';
}

function deleteCustomCategory(value, type) {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user || !user.categories || !user.categories[type]) return;
  user.categories[type] = user.categories[type].filter(c => c.value !== value);
  if (typeof users !== 'undefined' && typeof saveUsersToStorage === 'function') {
    users[user.email] = user;
    saveUsersToStorage();
  }
  renderCustomCategories();
  updateSubcategories();
  showNotification('Category removed.', 'info');
}
window.deleteCustomCategory = deleteCustomCategory;

// ── Charts ────────────────────────────────────────────────────────────────────

function initializeCharts() {
  // Will be called when analytics page is first opened
}

function updateCharts() {
  createExpensePieChart();
  createMonthlyTrendsChart();
  createBudgetComparisonChart();
  updateExpenseLegend();
}
window.updateCharts = updateCharts;

function createExpensePieChart() {
  const canvas = document.getElementById('expensePieChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const monthTxns = getMonthTransactions(selectedMonth);
  const expenses  = monthTxns.filter(t => t.category === 'expense');

  // Aggregate by subcategory
  const data = {};
  expenses.forEach(t => {
    data[t.subcategory] = (data[t.subcategory] || 0) + t.amount;
  });
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total   = entries.reduce((s, e) => s + e[1], 0);

  if (total === 0) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No expense data for this month', w / 2, h / 2);
    return;
  }

  const colors = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];
  const cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 20;

  let angle = -Math.PI / 2;
  entries.forEach(([label, val], i) => {
    const slice = (val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    angle += slice;
  });

  // Center hole (donut)
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.5, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // Center text
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$' + total.toFixed(0), cx, cy - 7);
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.fillText('total', cx, cy + 8);

  // Store colors for legend
  canvas._legendData = entries.map(([label, val], i) => ({ label, val, color: colors[i % colors.length] }));
  canvas._total = total;
}

function updateExpenseLegend() {
  const canvas = document.getElementById('expensePieChart');
  const legendEl = document.getElementById('expenseLegend');
  if (!legendEl) return;

  if (!canvas || !canvas._legendData || canvas._legendData.length === 0) {
    legendEl.innerHTML = '';
    return;
  }

  const total = canvas._total || 1;
  legendEl.innerHTML = canvas._legendData.slice(0, 8).map(d =>
    `<div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <span class="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:${d.color}"></span>
        <span class="text-gray-700">${d.label}</span>
      </div>
      <span class="text-gray-500">$${d.val.toFixed(0)} (${((d.val/total)*100).toFixed(0)}%)</span>
    </div>`
  ).join('');
}

function createMonthlyTrendsChart() {
  const canvas = document.getElementById('monthlyTrendsChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Build last 6 months data
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().substring(0, 7));
  }

  const incomeData  = months.map(m => transactions.filter(t => t.category === 'income'  && (t.month || t.date?.substring(0,7)) === m).reduce((s, t) => s + t.amount, 0));
  const expenseData = months.map(m => transactions.filter(t => t.category === 'expense' && (t.month || t.date?.substring(0,7)) === m).reduce((s, t) => s + t.amount, 0));

  const maxVal = Math.max(...incomeData, ...expenseData, 1);
  const pad = { top: 20, right: 15, bottom: 40, left: 45 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  // Gridlines
  ctx.strokeStyle = '#f3f4f6';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
    ctx.fillStyle = '#9ca3af'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText('$' + Math.round(maxVal - (maxVal / 4) * i), pad.left - 4, y + 3);
  }

  const barW = chartW / months.length;
  const groupW = barW * 0.7;
  const bW = groupW / 2;

  months.forEach((m, i) => {
    const x = pad.left + i * barW + barW * 0.15;

    // Income bar
    const incH = (incomeData[i] / maxVal) * chartH;
    ctx.fillStyle = '#10b981';
    ctx.fillRect(x, pad.top + chartH - incH, bW, incH);

    // Expense bar
    const expH = (expenseData[i] / maxVal) * chartH;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + bW, pad.top + chartH - expH, bW, expH);

    // Month label
    const label = new Date(m + '-15').toLocaleDateString('en-US', { month: 'short' });
    ctx.fillStyle = '#6b7280'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, x + groupW / 2, pad.top + chartH + 12);
  });

  // Legend
  ctx.fillStyle = '#10b981'; ctx.fillRect(pad.left, h - 10, 10, 8);
  ctx.fillStyle = '#6b7280'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Income', pad.left + 13, h - 3);
  ctx.fillStyle = '#ef4444'; ctx.fillRect(pad.left + 60, h - 10, 10, 8);
  ctx.fillStyle = '#6b7280'; ctx.fillText('Expenses', pad.left + 73, h - 3);
}

function createBudgetComparisonChart() {
  const canvas = document.getElementById('budgetComparisonChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const monthTxns = getMonthTransactions(selectedMonth);
  let cats = [...defaultSubcategories.expense];
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (user && user.categories && user.categories.expense) {
    user.categories.expense.forEach(c => { if (!cats.find(d => d.value === c.value)) cats.push(c); });
  }

  const data = cats.map(cat => {
    const budget = adjustableBudgets[cat.value] !== undefined ? adjustableBudgets[cat.value] : cat.budget;
    const spent  = monthTxns.filter(t => t.category === 'expense' && t.subcategory === cat.value).reduce((s, t) => s + t.amount, 0);
    return { label: cat.value, budget, spent };
  }).filter(d => d.budget > 0 || d.spent > 0).slice(0, 8);

  if (data.length === 0) {
    ctx.fillStyle = '#9ca3af'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('No budget data available', w / 2, h / 2);
    return;
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.budget, d.spent)), 1);
  const pad = { top: 15, right: 15, bottom: 30, left: 10 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const barW = chartW / data.length;
  const groupW = barW * 0.75;
  const bW = groupW / 2 - 1;

  data.forEach((d, i) => {
    const x = pad.left + i * barW + (barW - groupW) / 2;

    // Budget bar
    const bH = (d.budget / maxVal) * chartH;
    ctx.fillStyle = '#a5b4fc';
    ctx.fillRect(x, pad.top + chartH - bH, bW, bH);

    // Spent bar
    const sH = (d.spent / maxVal) * chartH;
    const over = d.spent > d.budget && d.budget > 0;
    ctx.fillStyle = over ? '#ef4444' : '#6366f1';
    ctx.fillRect(x + bW + 1, pad.top + chartH - sH, bW, sH);

    // Label
    ctx.fillStyle = '#6b7280'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(d.label.substring(0, 6), x + groupW / 2, pad.top + chartH + 12);
  });

  // Legend
  ctx.fillStyle = '#a5b4fc'; ctx.fillRect(pad.left, h - 10, 10, 8);
  ctx.fillStyle = '#6b7280'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Budget', pad.left + 13, h - 3);
  ctx.fillStyle = '#6366f1'; ctx.fillRect(pad.left + 55, h - 10, 10, 8);
  ctx.fillText('Spent', pad.left + 68, h - 3);
  ctx.fillStyle = '#ef4444'; ctx.fillRect(pad.left + 105, h - 10, 10, 8);
  ctx.fillText('Over budget', pad.left + 118, h - 3);
}

// ── AI Insights ───────────────────────────────────────────────────────────────

function generateAIInsights() {
  const insightsEl = document.getElementById('aiInsights');
  if (!insightsEl) return;

  const monthTxns = getMonthTransactions(selectedMonth);
  const income  = monthTxns.filter(t => t.category === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTxns.filter(t => t.category === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  const insights = [];

  // Savings rate
  if (income > 0) {
    if (savingsRate >= 20) {
      insights.push({ icon: '🎉', text: `Great job! You're saving <strong>${savingsRate.toFixed(1)}%</strong> of your income this month. Keep it up!`, color: 'text-green-700 bg-green-50' });
    } else if (savingsRate >= 0) {
      insights.push({ icon: '⚠️', text: `You're saving <strong>${savingsRate.toFixed(1)}%</strong> of income. Aim for at least 20% for financial health.`, color: 'text-amber-700 bg-amber-50' });
    } else {
      insights.push({ icon: '🚨', text: `You're spending more than you earn this month by <strong>$${Math.abs(savings).toFixed(2)}</strong>. Review your expenses.`, color: 'text-red-700 bg-red-50' });
    }
  } else {
    insights.push({ icon: '💡', text: 'No income recorded this month. Add your income to get savings insights.', color: 'text-blue-700 bg-blue-50' });
  }

  // Top spending category
  const catSpend = {};
  monthTxns.filter(t => t.category === 'expense').forEach(t => {
    catSpend[t.subcategory] = (catSpend[t.subcategory] || 0) + t.amount;
  });
  const topCat = Object.entries(catSpend).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    const pct = expense > 0 ? ((topCat[1] / expense) * 100).toFixed(0) : 0;
    insights.push({ icon: '📊', text: `Your biggest expense category is <strong>${topCat[0]}</strong> at $${topCat[1].toFixed(2)} (${pct}% of total spending).`, color: 'text-indigo-700 bg-indigo-50' });
  }

  // Budget alerts
  let overBudget = [];
  defaultSubcategories.expense.forEach(cat => {
    const budget = adjustableBudgets[cat.value] !== undefined ? adjustableBudgets[cat.value] : cat.budget;
    const spent  = catSpend[cat.value] || 0;
    if (budget > 0 && spent > budget) {
      overBudget.push(`${cat.value} ($${spent.toFixed(0)} vs $${budget} budget)`);
    }
  });
  if (overBudget.length > 0) {
    insights.push({ icon: '⚡', text: `Over budget in: <strong>${overBudget.slice(0, 3).join(', ')}</strong>. Consider adjusting your spending or budgets.`, color: 'text-red-700 bg-red-50' });
  }

  // Transaction count
  if (monthTxns.length > 0) {
    const avgExpense = expense > 0 ? expense / monthTxns.filter(t => t.category === 'expense').length : 0;
    if (avgExpense > 0) {
      insights.push({ icon: '💳', text: `Average transaction size this month: <strong>$${avgExpense.toFixed(2)}</strong> across ${monthTxns.filter(t => t.category === 'expense').length} expense(s).`, color: 'text-gray-700 bg-gray-50' });
    }
  } else {
    insights.push({ icon: '📝', text: 'No transactions this month. Start tracking to get personalized insights!', color: 'text-gray-700 bg-gray-50' });
  }

  insightsEl.innerHTML = insights.map(i =>
    `<div class="flex gap-3 p-3 rounded-lg ${i.color}">
      <span class="text-lg flex-shrink-0">${i.icon}</span>
      <p class="text-sm">${i.text}</p>
    </div>`
  ).join('');
}
window.generateAIInsights = generateAIInsights;

// ── Transaction CRUD ──────────────────────────────────────────────────────────

function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;
  transactions = transactions.filter(t => t.id !== id);
  saveUserData();
  renderMobileView();
  renderTables();
  renderFullTransactionsList();
  showNotification('Transaction deleted.', 'info');
}
window.deleteTransaction = deleteTransaction;

function editTransaction(id) {
  const t = transactions.find(t => t.id === id);
  if (!t) return;

  const newDesc = prompt('Description:', t.item);
  if (newDesc === null) return;
  const newAmount = parseFloat(prompt('Amount:', t.amount));
  if (isNaN(newAmount) || newAmount <= 0) { showNotification('Invalid amount.', 'error'); return; }

  t.item   = newDesc.trim() || t.item;
  t.amount = newAmount;
  saveUserData();
  renderMobileView();
  renderTables();
  renderFullTransactionsList();
  showNotification('Transaction updated.', 'success');
}
window.editTransaction = editTransaction;

// ── Receipt upload / OCR ──────────────────────────────────────────────────────

async function handleReceiptUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const ocrEl = document.getElementById('ocrResult');
  if (ocrEl) ocrEl.textContent = '📷 Processing receipt...';

  try {
    // Try backend first
    const formData = new FormData();
    formData.append('file', file);
    const resp = await fetch('/api/process-receipt', { method: 'POST', body: formData, signal: AbortSignal.timeout(8000) });
    if (resp.ok) {
      const data = await resp.json();
      if (data.amount) {
        const amountEl = document.getElementById('amount');
        if (amountEl) amountEl.value = data.amount;
      }
      if (data.description) {
        const itemEl = document.getElementById('item');
        if (itemEl) itemEl.value = data.description;
        itemEl.dispatchEvent(new Event('input'));
      }
      if (ocrEl) ocrEl.textContent = '✅ Receipt processed: ' + (data.description || '') + (data.amount ? ' $' + data.amount : '');
      return;
    }
  } catch (_) {
    // Backend not available
  }

  // Fallback: Tesseract.js if available
  if (typeof Tesseract !== 'undefined') {
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text;
      // Try to extract amount
      const amountMatch = text.match(/\$?\s*(\d+\.?\d{0,2})/g);
      if (amountMatch && amountMatch.length > 0) {
        const amounts = amountMatch.map(a => parseFloat(a.replace('$', '').trim())).filter(a => a > 0);
        const maxAmount = Math.max(...amounts);
        const amountEl = document.getElementById('amount');
        if (amountEl && maxAmount > 0) amountEl.value = maxAmount.toFixed(2);
      }
      if (ocrEl) ocrEl.textContent = '📝 OCR text extracted. Verify the details above.';
    } catch (err) {
      if (ocrEl) ocrEl.textContent = '❌ Could not read receipt. Please enter details manually.';
    }
  } else {
    if (ocrEl) ocrEl.textContent = '📷 Receipt uploaded. Backend not available for OCR.';
  }
}

// ── Data persistence ──────────────────────────────────────────────────────────

function saveUserData() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user) return;

  user.transactions = transactions;
  user.adjustableBudgets = adjustableBudgets;

  if (typeof users !== 'undefined' && typeof saveUsersToStorage === 'function') {
    users[user.email] = user;
    saveUsersToStorage();
  }
}

function loadUserData() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user) return;

  transactions = user.transactions || [];
  adjustableBudgets = user.adjustableBudgets || {};
  mergeUserCategories(user);
}

function mergeUserCategories(user) {
  // Ensure default budgets are reflected if user has no overrides
  if (!user) return;
  defaultSubcategories.expense.forEach(cat => {
    if (adjustableBudgets[cat.value] === undefined) {
      adjustableBudgets[cat.value] = cat.budget;
    }
  });
}

// ── Data import/export ────────────────────────────────────────────────────────

function exportData() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const exportObj = {
    exportedAt: new Date().toISOString(),
    user: user ? user.email : 'unknown',
    transactions,
    adjustableBudgets
  };
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'budget-data-' + selectedMonth + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showNotification('Data exported!', 'success');
}
window.exportData = exportData;

function importData() {
  const fileInput = document.getElementById('importFile');
  if (!fileInput || !fileInput.files[0]) {
    showNotification('Please select a JSON file to import.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.transactions && Array.isArray(data.transactions)) {
        // Merge — avoid duplicates by ID
        const existingIds = new Set(transactions.map(t => t.id));
        const newTxns = data.transactions.filter(t => !existingIds.has(t.id));
        transactions = [...transactions, ...newTxns];
      }
      if (data.adjustableBudgets) {
        adjustableBudgets = { ...adjustableBudgets, ...data.adjustableBudgets };
      }
      saveUserData();
      renderMobileView();
      renderTables();
      showNotification('Data imported successfully!', 'success');
    } catch (err) {
      showNotification('Invalid JSON file. Please check the file format.', 'error');
    }
  };
  reader.readAsText(fileInput.files[0]);
}
window.importData = importData;

function clearAllData() {
  transactions = [];
  adjustableBudgets = {};
  saveUserData();
  renderMobileView();
  renderTables();
  showNotification('All data cleared.', 'info');
}
window.clearAllData = clearAllData;

function showDataStats() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const debugEl = document.getElementById('debugInfo');

  const monthTxns = getMonthTransactions(selectedMonth);
  const totalIncome  = monthTxns.filter(t => t.category === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxns.filter(t => t.category === 'expense').reduce((s, t) => s + t.amount, 0);

  const info = {
    user: user ? { name: user.name, email: user.email } : null,
    selectedMonth,
    totalTransactions: transactions.length,
    monthTransactions: monthTxns.length,
    monthIncome: '$' + totalIncome.toFixed(2),
    monthExpenses: '$' + totalExpense.toFixed(2),
    netBalance: '$' + (totalIncome - totalExpense).toFixed(2),
    adjustableBudgetsCount: Object.keys(adjustableBudgets).length,
    localStorageKeys: Object.keys(localStorage).filter(k => k.startsWith('budget')),
    timestamp: new Date().toISOString()
  };

  if (debugEl) debugEl.textContent = JSON.stringify(info, null, 2);
  updateDebugInfo();
}
window.showDataStats = showDataStats;

function updateDebugInfo() {
  // Light version — just update timestamp
  const debugEl = document.getElementById('debugInfo');
  if (debugEl && debugEl.textContent === 'Click Stats to load debug information.') return;
  showDataStats();
}
window.updateDebugInfo = updateDebugInfo;

// ── Notification system ───────────────────────────────────────────────────────

function showNotification(message, type = 'info', duration = 3500) {
  const dark = document.documentElement.classList.contains('dark');
  const colors = {
    success: dark ? 'background:#14532d;color:#86efac;border-left:4px solid #22c55e' : 'background:#dcfce7;color:#166534;border-left:4px solid #22c55e',
    error:   dark ? 'background:#450a0a;color:#fca5a5;border-left:4px solid #ef4444' : 'background:#fee2e2;color:#991b1b;border-left:4px solid #ef4444',
    info:    dark ? 'background:#0c1a2e;color:#7dd3fc;border-left:4px solid #0ea5e9' : 'background:#e0f2fe;color:#075985;border-left:4px solid #0ea5e9',
    warning: dark ? 'background:#2d1a00;color:#fcd34d;border-left:4px solid #f59e0b' : 'background:#fef3c7;color:#92400e;border-left:4px solid #f59e0b'
  };
  const style = colors[type] || colors.info;
  const el = document.createElement('div');
  el.className = 'notification';
  el.setAttribute('style', style);
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, duration);
}
window.showNotification = showNotification;

// ── Exports ───────────────────────────────────────────────────────────────────

window.initializeBudgetTracker = initializeBudgetTracker;
window.handleFormSubmit = handleFormSubmit;
window.handleItemInput = handleItemInput;
window.handleReceiptUpload = handleReceiptUpload;
window.updateSubcategories = updateSubcategories;
window.changeMonth = changeMonth;
window.renderMobileView = renderMobileView;
window.renderTables = renderTables;
window.renderFullTransactionsList = renderFullTransactionsList;
window.switchTransactionTab = switchTransactionTab;
window.loadBudgetsData = loadBudgetsData;
window.loadProfileData = loadProfileData;
window.saveGoals = saveGoals;
window.addCustomCategory = addCustomCategory;
window.deleteCustomCategory = deleteCustomCategory;
window.updateCharts = updateCharts;
window.generateAIInsights = generateAIInsights;
window.deleteTransaction = deleteTransaction;
window.editTransaction = editTransaction;
window.exportData = exportData;
window.importData = importData;
window.clearAllData = clearAllData;
window.showDataStats = showDataStats;
window.updateDebugInfo = updateDebugInfo;
window.showNotification = showNotification;
window.localCategorize = localCategorize;

// Expose state
Object.defineProperty(window, 'transactions', { get: () => transactions, set: v => { transactions = v; } });
Object.defineProperty(window, 'selectedMonth', { get: () => selectedMonth, set: v => { selectedMonth = v; } });
Object.defineProperty(window, 'adjustableBudgets', { get: () => adjustableBudgets, set: v => { adjustableBudgets = v; } });
