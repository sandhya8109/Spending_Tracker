// Enhanced Budget Tracker - Main Application Logic
// Integrates with login system and dashboard structure

// Configuration - Enhanced with user-specific categories
const defaultSubcategories = {
  income: [
    { value: 'UCO', text: '🏫 UCO', budget: 1000 },
    { value: 'GONG', text: '💼 Private', budget: 1300 },
    { value: 'Freelance', text: '💻 Freelance', budget: 500 },
    { value: 'Investment', text: '📈 Investment', budget: 200 }
  ],
  expense: [
    { value: 'Rent', text: '🏠 Rent', budget: 300 },
    { value: 'Grocery', text: '🛒 Grocery', budget: 200 },
    { value: 'Food', text: '🍕 Food', budget: 100 },
    { value: 'Petrol', text: '⛽ Petrol', budget: 120 },
    { value: 'Home', text: '🏡 Home', budget: 250 },
    { value: 'Gym', text: '💪 Gym', budget: 80 },
    { value: 'Mobile', text: '📱 Mobile', budget: 60 },
    { value: 'Extra', text: '✨ Extra', budget: 50 },
    { value: 'Insurance', text: '🛡️ Insurance', budget: 150 },
    { value: 'Tuition', text: '🎓 Tuition', budget: 1000 },
  ]
};

// Dynamic categories that merge default + user custom categories
let subcategories = JSON.parse(JSON.stringify(defaultSubcategories));

// Global variables - Enhanced for user management
let transactions = [];
let adjustableBudgets = {
  income: {
    UCO: 1000,
    GONG: 1300,
    Freelance: 500,
    Investment: 200
  },
  expense: {
    Rent: 300,
    Grocery: 200,
    Food: 100,
    Petrol: 120,
    Home: 250,
    Gym: 80,
    Mobile: 60,
    Extra: 50,
    Insurance: 150,
    Tuition: 1000,
  }
};

// Analytics data structure
let analyticsData = {
  currentMonth: { income: {}, expense: {} },
  trends: []
};

let selectedMonth = '2025-08';

// User-specific data management
let userDataLoaded = false;

// Initialize the budget tracker functionality (called after login)
function initializeBudgetTracker() {
  console.log('Initializing budget tracker for user:', currentUser?.name);
  
  try {
    // Load user-specific data
    loadUserData();
    
    // Merge user's custom categories
    mergeUserCategories();
    
    // Get DOM elements
    const budgetForm = document.getElementById('budgetForm');
    const categorySelect = document.getElementById('category');
    const subcategorySelect = document.getElementById('subcategory');
    const monthSelector = document.getElementById('monthSelector');
    const entryDateInput = document.getElementById('entryDate');
    
    // Set initial values
    selectedMonth = monthSelector.value;
    entryDateInput.value = `${selectedMonth}-01`;
    
    // Setup event listeners (remove existing ones first to prevent duplicates)
    if (budgetForm) {
      budgetForm.removeEventListener('submit', handleFormSubmit);
      budgetForm.addEventListener('submit', handleFormSubmit);
    }
    
    if (categorySelect) {
      categorySelect.removeEventListener('change', updateSubcategories);
      categorySelect.addEventListener('change', updateSubcategories);
    }
    
    if (monthSelector) {
      monthSelector.removeEventListener('change', handleMonthChange);
      monthSelector.addEventListener('change', handleMonthChange);
    }
    
    // Receipt upload handler
    const receiptUpload = document.getElementById('receiptUpload');
    if (receiptUpload) {
      receiptUpload.removeEventListener('change', handleReceiptUpload);
      receiptUpload.addEventListener('change', handleReceiptUpload);
    }
    
    // Item input for AI suggestions
    const itemInput = document.getElementById('item');
    if (itemInput) {
      itemInput.removeEventListener('input', handleItemInput);
      itemInput.addEventListener('input', handleItemInput);
    }
    
    // Initial render
    updateSubcategories();
    updateDisplayedMonth();
    renderMobileView();
    renderTables();
    initializeCharts();
    
    // Generate AI insights if on analytics page
    if (currentPage === 'analytics') {
      setTimeout(() => generateAIInsights(), 1000);
    }
    
    // Auto-save every 30 seconds
    setInterval(() => {
      if (transactions.length > 0 && currentUser) {
        saveUserData();
      }
    }, 30000);
    
    userDataLoaded = true;
    updateDebugInfo();
    
    console.log('Budget tracker initialized successfully with', transactions.length, 'transactions');
    
  } catch (error) {
    console.error('Budget tracker initialization error:', error);
    showNotification('Error loading budget data. Please refresh the page.', 'error', 5000);
  }
}

// User-specific data management
function loadUserData() {
  if (!currentUser) return;
  
  const userDataKey = `budgetData_${currentUser.id}`;
  const savedData = localStorage.getItem(userDataKey);
  
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      transactions = data.transactions || [];
      adjustableBudgets = data.adjustableBudgets || adjustableBudgets;
      selectedMonth = data.selectedMonth || selectedMonth;
      console.log(`Loaded ${transactions.length} transactions for user: ${currentUser.name}`);
    } catch (error) {
      console.error('Error loading user data:', error);
      transactions = [];
    }
  } else {
    console.log('No saved data found for user, starting fresh');
    transactions = [];
  }
}

function saveUserData() {
  if (!currentUser) return;
  
  const userDataKey = `budgetData_${currentUser.id}`;
  const data = {
    transactions,
    adjustableBudgets,
    selectedMonth,
    lastSaved: new Date().toISOString(),
    userId: currentUser.id
  };
  
  localStorage.setItem(userDataKey, JSON.stringify(data));
  console.log(`Data saved for user: ${currentUser.name}, ${transactions.length} transactions`);
}

function mergeUserCategories() {
  if (!currentUser || !currentUser.customCategories) return;
  
  // Reset to default categories
  subcategories = JSON.parse(JSON.stringify(defaultSubcategories));
  
  // Add user's custom categories
  Object.entries(currentUser.customCategories).forEach(([name, data]) => {
    if (!subcategories[data.type]) {
      subcategories[data.type] = [];
    }
    
    // Check if category already exists
    const existingIndex = subcategories[data.type].findIndex(cat => cat.value === name);
    if (existingIndex === -1) {
      subcategories[data.type].push({
        value: name,
        text: `✨ ${name}`,
        budget: data.budget
      });
      
      // Also add to adjustable budgets
      adjustableBudgets[data.type][name] = data.budget;
    }
  });
  
  console.log('Merged user categories:', currentUser.customCategories);
}

// Enhanced form submission with user context
function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!currentUser) {
    showNotification('Please log in to add transactions', 'error');
    return;
  }
  
  // Show loading state
  const submitButton = e.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Adding...';
  submitButton.disabled = true;
  
  const item = document.getElementById('item').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const subcategory = document.getElementById('subcategory').value;
  const entryDate = document.getElementById('entryDate').value;
  
  // Enhanced validation
  if (!item) {
    showNotification('Please enter what you spent on', 'error');
    resetButton();
    return;
  }
  
  if (!amount || amount <= 0) {
    showNotification('Please enter a valid amount greater than 0', 'error');
    resetButton();
    return;
  }
  
  if (amount > 99999) {
    showNotification('Amount seems too large. Please check.', 'error');
    resetButton();
    return;
  }
  
  if (!category || !subcategory || !entryDate) {
    showNotification('Please fill all required fields', 'error');
    resetButton();
    return;
  }
  
  // Check if date is reasonable
  const today = new Date();
  const selectedDate = new Date(entryDate);
  const futureLimit = new Date();
  futureLimit.setFullYear(today.getFullYear() + 1);
  
  if (selectedDate > futureLimit) {
    showNotification('Date cannot be more than 1 year in the future', 'error');
    resetButton();
    return;
  }
  
  // Create transaction with user context
  setTimeout(() => {
    const transaction = {
      id: Date.now() + Math.random(),
      item: item.substring(0, 100),
      amount: Math.round(amount * 100) / 100,
      type: category,
      category: subcategory,
      entryDate,
      month: entryDate.substring(0, 7),
      createdAt: new Date().toISOString(),
      userId: currentUser.id
    };
    
    console.log('Adding transaction:', transaction);
    
    transactions.push(transaction);
    saveUserData();
    
    // Reset form
    document.getElementById('budgetForm').reset();
    document.getElementById('subcategory').innerHTML = '<option value="">Select category</option>';
    
    // Update displays
    renderMobileView();
    renderTables();
    
    // Update full transaction list if on transactions page
    if (currentPage === 'transactions') {
      renderFullTransactionsList();
    }
    
    // Show success feedback
    const typeText = category === 'income' ? 'Income' : 'Expense';
    showNotification(`${typeText} of ${amount.toFixed(2)} added successfully!`, 'success');
    
    resetButton();
    updateDebugInfo();
    
    // Generate AI insights after adding transaction
    if (typeof generateAIInsights === 'function') {
      setTimeout(() => generateAIInsights(), 500);
    }
    
    // Focus back to item input for quick entry
    setTimeout(() => document.getElementById('item').focus(), 100);
  }, 800);
  
  function resetButton() {
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
}

// Enhanced month change handler
function handleMonthChange() {
  selectedMonth = document.getElementById('monthSelector').value;
  document.getElementById('entryDate').value = `${selectedMonth}-01`;
  updateDisplayedMonth();
  renderMobileView();
  renderTables();
  updateDebugInfo();
  
  // Update full transactions list if on transactions page
  if (currentPage === 'transactions') {
    renderFullTransactionsList();
  }
  
  // Save user preference
  if (currentUser) {
    saveUserData();
  }
}

// Enhanced subcategory update with user categories
function updateSubcategories() {
  const type = document.getElementById('category').value;
  const subcategorySelect = document.getElementById('subcategory');
  
  subcategorySelect.innerHTML = '<option value="">Select category</option>';
  
  if (type && subcategories[type]) {
    subcategories[type].forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub.value;
      opt.textContent = sub.text;
      subcategorySelect.appendChild(opt);
    });
  }
}

// Enhanced display month update
function updateDisplayedMonth() {
  const [year, month] = selectedMonth.split('-');
  const date = new Date(year, month - 1);
  const monthName = date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  
  // Update titles
  const transactionTitle = document.getElementById('transactionTitle');
  const expenseTitle = document.getElementById('expenseTitle');
  const incomeTitle = document.getElementById('incomeTitle');
  
  if (transactionTitle) transactionTitle.textContent = `Transactions - ${monthName}`;
  if (expenseTitle) expenseTitle.textContent = `${monthName} Expense Breakdown`;
  if (incomeTitle) incomeTitle.textContent = `${monthName} Income Sources`;
}

// Enhanced transaction filtering
function getFilteredTransactions() {
  return transactions.filter(t => t.month === selectedMonth);
}

// Enhanced mobile view rendering
function renderMobileView() {
  console.log('Rendering mobile view for month:', selectedMonth);
  
  const filtered = getFilteredTransactions();
  console.log('Filtered transactions for this month:', filtered.length);
  
  let incomeSummary = {};
  let expenseSummary = {};
  
  // Calculate summaries
  filtered.forEach(tr => {
    if (tr.type === 'income') {
      if (!incomeSummary[tr.category]) {
        incomeSummary[tr.category] = { earned: 0, budget: adjustableBudgets.income[tr.category] || 0 };
      }
      incomeSummary[tr.category].earned += tr.amount;
    } else {
      if (!expenseSummary[tr.category]) {
        expenseSummary[tr.category] = { spent: 0, budget: adjustableBudgets.expense[tr.category] || 0 };
      }
      expenseSummary[tr.category].spent += tr.amount;
    }
  });
  
  // Update analytics data
  updateAnalyticsData(incomeSummary, expenseSummary);
  
  // Update quick stats
  const totalEarned = Object.values(incomeSummary).reduce((sum, s) => sum + s.earned, 0);
  const totalSpent = Object.values(expenseSummary).reduce((sum, s) => sum + s.spent, 0);
  const remaining = totalEarned - totalSpent;
  
  // Update dashboard cards
  const totalIncomeCard = document.getElementById('totalIncomeCard');
  const totalExpenseCard = document.getElementById('totalExpenseCard');
  const netBalanceCard = document.getElementById('netBalanceCard');
  
  if (totalIncomeCard) totalIncomeCard.textContent = `${totalEarned.toFixed(2)}`;
  if (totalExpenseCard) totalExpenseCard.textContent = `${totalSpent.toFixed(2)}`;
  if (netBalanceCard) {
    netBalanceCard.textContent = `${remaining.toFixed(2)}`;
    netBalanceCard.className = netBalanceCard.className.replace(/text-\w+-\d+/, remaining >= 0 ? 'text-green-600' : 'text-red-600');
  }
  
  // Render transactions in dashboard
  const transactionList = document.getElementById('transactionList');
  if (transactionList) {
    if (filtered.length === 0) {
      transactionList.innerHTML = '<div class="text-center text-gray-500 py-8">No transactions for this month<br><small>Add your first transaction above!</small></div>';
    } else {
      const sortedTransactions = [...filtered].sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
      transactionList.innerHTML = sortedTransactions.slice(0, 10).map(createTransactionCard).join('');
    }
  }
  
  // Render expense categories (for transactions page)
  const expenseList = document.getElementById('expenseList');
  if (expenseList) {
    expenseList.innerHTML = subcategories.expense.map(cat => {
      const data = expenseSummary[cat.value] || { spent: 0, budget: adjustableBudgets.expense[cat.value] || cat.budget };
      return createCategoryCard(cat.text, data, 'expense', data.budget, cat.value);
    }).join('');
  }
  
  // Render income categories (for transactions page)
  const incomeList = document.getElementById('incomeList');
  if (incomeList) {
    incomeList.innerHTML = subcategories.income.map(src => {
      const data = incomeSummary[src.value] || { earned: 0, budget: adjustableBudgets.income[src.value] || src.budget };
      return createCategoryCard(src.text, data, 'income', data.budget, src.value);
    }).join('');
  }
  
  // Attach budget adjustment listeners
  attachBudgetListeners();
}

// Full transactions list for transactions page
function renderFullTransactionsList() {
  const container = document.getElementById('transactionListFull');
  if (!container) return;
  
  const filtered = getFilteredTransactions();
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="text-center text-gray-500 py-8">No transactions for this month</div>';
    return;
  }
  
  const sortedTransactions = [...filtered].sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  container.innerHTML = sortedTransactions.map(createTransactionCard).join('');
}

// Enhanced transaction card creation
function createTransactionCard(transaction) {
  const date = new Date(transaction.entryDate).toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric' 
  });
  
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
  const icon = isIncome ? '💰' : '💸';
  
  return `
    <div class="transaction-card bg-white rounded-lg p-4 border shadow-sm hover:shadow-md transition-all duration-200">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-3 flex-1 min-w-0">
          <span class="text-lg">${icon}</span>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 truncate">${transaction.item}</div>
            <div class="text-sm text-gray-500">${getSubcategoryText(transaction.category)} • ${date}</div>
          </div>
        </div>
        <div class="text-right flex items-center space-x-2">
          <div class="font-bold ${amountColor}">${transaction.amount.toFixed(2)}</div>
          <div class="flex flex-col space-y-1">
            <button onclick="editTransaction(${transaction.id})" 
                    class="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
              Edit
            </button>
            <button onclick="deleteTransaction(${transaction.id})" 
                    class="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Enhanced category card creation
function createCategoryCard(categoryText, data, type, budget, categoryKey) {
  const isIncome = type === 'income';
  const amount = isIncome ? data.earned : data.spent;
  const remaining = budget - amount;
  const percentage = budget > 0 ? (amount / budget) * 100 : 0;
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
  
  return `
    <div class="category-card bg-gray-50 rounded-lg p-4 border hover:shadow-sm transition-shadow">
      <div class="flex justify-between items-center mb-2">
        <div class="font-medium text-gray-900">${categoryText}</div>
        <div class="font-bold ${amountColor}">${amount.toFixed(2)}</div>
      </div>
      <div class="flex justify-between items-center text-sm text-gray-600 mb-2">
        <span>Budget: ${budget}</span>
        <span class="${remaining >= 0 ? 'text-green-600' : 'text-red-600'}">
          ${remaining >= 0 ? 'Remaining' : 'Over'}: ${Math.abs(remaining).toFixed(2)}
        </span>
      </div>
      <div class="flex justify-between items-center">
        <div class="flex-1 bg-gray-200 rounded-full h-2 mr-3">
          <div class="h-2 rounded-full transition-all duration-300 ${percentage > 100 ? 'bg-red-500' : (isIncome ? 'bg-green-500' : 'bg-blue-500')}" 
               style="width: ${Math.min(percentage, 100)}%"></div>
        </div>
        <select class="budget-adjust text-xs px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500" 
                data-type="${type}" data-category="${categoryKey}">
          ${generateBudgetOptions(budget)}
        </select>
      </div>
    </div>
  `;
}

// Budget options generation
function generateBudgetOptions(currentBudget) {
  const options = [];
  const budgetValues = [0, 50, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1300, 1500, 2000, 2500, 3000];
  
  budgetValues.forEach(value => {
    const selected = value === currentBudget ? 'selected' : '';
    options.push(`<option value="${value}" ${selected}>${value}</option>`);
  });
  
  return options.join('');
}

// Attach budget adjustment listeners
function attachBudgetListeners() {
  document.querySelectorAll('.budget-adjust').forEach(select => {
    select.removeEventListener('change', handleBudgetChange);
    select.addEventListener('change', handleBudgetChange);
  });
}

function handleBudgetChange(event) {
  const type = event.target.getAttribute('data-type');
  const category = event.target.getAttribute('data-category');
  const newBudget = parseFloat(event.target.value);
  
  if (!isNaN(newBudget)) {
    adjustableBudgets[type][category] = newBudget;
    
    // Update user's custom categories if it's a custom category
    if (currentUser && currentUser.customCategories && currentUser.customCategories[category]) {
      currentUser.customCategories[category].budget = newBudget;
      users[currentUser.email] = currentUser;
      localStorage.setItem('budgetUsers', JSON.stringify(users));
      localStorage.setItem('budgetCurrentUser', JSON.stringify(currentUser));
    }
    
    saveUserData();
    renderMobileView();
    renderTables();
    
    // Update budget page if we're on it
    if (currentPage === 'budgets') {
      loadBudgetsData();
    }
    
    showNotification('Budget updated successfully', 'success', 2000);
  }
}

// Get subcategory text helper
function getSubcategoryText(value) {
  const allSubcategories = [...subcategories.income, ...subcategories.expense];
  const sub = allSubcategories.find(s => s.value === value);
  return sub ? sub.text : value;
}

// Enhanced transaction deletion
function deleteTransaction(id) {
  if (!currentUser) {
    showNotification('Please log in to delete transactions', 'error');
    return;
  }
  
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) {
    showNotification('Transaction not found', 'error');
    return;
  }
  
  const confirmMessage = `Are you sure you want to delete "${transaction.item}" (${transaction.amount.toFixed(2)})?`;
  
  if (confirm(confirmMessage)) {
    showNotification('Deleting transaction...', 'info');
    
    setTimeout(() => {
      transactions = transactions.filter(t => t.id !== id);
      saveUserData();
      renderMobileView();
      renderTables();
      
      if (currentPage === 'transactions') {
        renderFullTransactionsList();
      }
      
      updateDebugInfo();
      showNotification('Transaction deleted successfully', 'success');
      
      // Regenerate AI insights
      if (typeof generateAIInsights === 'function') {
        setTimeout(() => generateAIInsights(), 500);
      }
    }, 500);
  }
}

// Enhanced transaction editing
function editTransaction(id) {
  if (!currentUser) {
    showNotification('Please log in to edit transactions', 'error');
    return;
  }
  
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) {
    showNotification('Transaction not found', 'error');
    return;
  }
  
  // Navigate to dashboard if not already there
  if (currentPage !== 'dashboard') {
    showDashboardPage('dashboard');
  }
  
  // Pre-fill form
  document.getElementById('item').value = transaction.item;
  document.getElementById('amount').value = transaction.amount;
  document.getElementById('entryDate').value = transaction.entryDate;
  document.getElementById('category').value = transaction.type;
  
  updateSubcategories();
  setTimeout(() => {
    document.getElementById('subcategory').value = transaction.category;
  }, 100);
  
  // Remove original transaction
  transactions = transactions.filter(t => t.id !== id);
  saveUserData();
  renderMobileView();
  renderTables();
  
  if (currentPage === 'transactions') {
    renderFullTransactionsList();
  }
  
  updateDebugInfo();
  
  showNotification('Transaction loaded for editing. Make changes and save.', 'info', 3000);
  document.getElementById('item').focus();
  
  // Scroll to form
  document.querySelector('#budgetForm').scrollIntoView({ 
    behavior: 'smooth',
    block: 'center'
  });
}

// Enhanced tab showing with full transaction list update
function showTab(tabName) {
  // Hide all content
  document.getElementById('content-transactions').classList.add('hidden');
  document.getElementById('content-expenses').classList.add('hidden');
  document.getElementById('content-income').classList.add('hidden');
  
  // Remove active state from all tabs
  const tabs = ['transactions', 'expenses', 'income'];
  tabs.forEach(tab => {
    const tabElement = document.getElementById(`tab-${tab}`);
    if (tabElement) {
      tabElement.className = 'flex-1 py-3 px-4 text-center font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent transition-colors';
    }
  });
  
  // Show selected content and activate tab
  document.getElementById(`content-${tabName}`).classList.remove('hidden');
  const activeTab = document.getElementById(`tab-${tabName}`);
  if (activeTab) {
    activeTab.className = 'flex-1 py-3 px-4 text-center font-medium text-blue-600 bg-blue-50 border-b-2 border-blue-600';
  }
  
  // Update transaction list for full transactions tab
  if (tabName === 'transactions') {
    renderFullTransactionsList();
  }
}

// Receipt upload handler
function handleReceiptUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const ocrResult = document.getElementById('ocrResult');
  ocrResult.textContent = 'Processing receipt...';
  ocrResult.className = 'text-xs mt-2 text-blue-600';
  
  // Mock OCR processing (replace with actual OCR integration)
  setTimeout(() => {
    // Simulate OCR results
    const mockResults = [
      { vendor: 'Walmart', amount: 45.67, category: 'Grocery' },
      { vendor: 'Shell', amount: 35.20, category: 'Petrol' },
      { vendor: 'McDonald\'s', amount: 12.99, category: 'Food' },
      { vendor: 'Home Depot', amount: 89.45, category: 'Home' }
    ];
    
    const result = mockResults[Math.floor(Math.random() * mockResults.length)];
    
    // Pre-fill form
    document.getElementById('item').value = result.vendor;
    document.getElementById('amount').value = result.amount;
    document.getElementById('category').value = 'expense';
    updateSubcategories();
    setTimeout(() => {
      document.getElementById('subcategory').value = result.category;
    }, 100);
    
    ocrResult.textContent = `Receipt processed: ${result.vendor} - ${result.amount}`;
    ocrResult.className = 'text-xs mt-2 text-green-600';
    
    showNotification('Receipt processed successfully!', 'success');
  }, 2000);
}

// Item input handler for AI suggestions
function handleItemInput(event) {
  const input = event.target.value;
  const suggestion = document.getElementById('aiSuggestion');
  
  if (input.length > 2) {
    // Mock AI category suggestion
    const suggestions = {
      'walmart': 'Grocery',
      'mcdonalds': 'Food',
      'shell': 'Petrol',
      'rent': 'Rent',
      'gym': 'Gym',
      'phone': 'Mobile'
    };
    
    const lowerInput = input.toLowerCase();
    for (const [keyword, category] of Object.entries(suggestions)) {
      if (lowerInput.includes(keyword)) {
        suggestion.textContent = `💡 Suggested category: ${category}`;
        suggestion.className = 'text-xs text-blue-500 mt-1';
        return;
      }
    }
  }
  
  suggestion.textContent = '';
}

// Legacy table rendering for compatibility
function renderTables() {
  const filtered = getFilteredTransactions();

  let incomeSummary = {};
  let expenseSummary = {};

  filtered.forEach(tr => {
    if (tr.type === 'income') {
      if (!incomeSummary[tr.category]) incomeSummary[tr.category] = { earned: 0, budget: adjustableBudgets.income[tr.category] || 0 };
      incomeSummary[tr.category].earned += tr.amount;
    } else {
      if (!expenseSummary[tr.category]) expenseSummary[tr.category] = { spent: 0, budget: adjustableBudgets.expense[tr.category] || 0 };
      expenseSummary[tr.category].spent += tr.amount;
    }
  });

  // Legacy table updates for compatibility
  const expenseTableBody = document.getElementById('expenseTable');
  if (expenseTableBody) {
    expenseTableBody.innerHTML = '';
    subcategories.expense.forEach(cat => {
      const data = expenseSummary[cat.value] || { spent: 0, budget: adjustableBudgets.expense[cat.value] || cat.budget };
      const remaining = (data.budget - data.spent).toFixed(2);
      expenseTableBody.innerHTML += `<tr>
        <td>${cat.text}</td>
        <td class="expense text-right">${data.spent.toFixed(2)}</td>
        <td class="text-right">
          <select class="budget-adjust px-2 py-1 border rounded text-sm" data-type="expense" data-category="${cat.value}">
            ${generateBudgetOptions(data.budget)}
          </select>
        </td>
        <td class="text-right">${remaining}</td>
      </tr>`;
    });
  }

  const incomeTableBody = document.getElementById('incomeTable');
  if (incomeTableBody) {
    incomeTableBody.innerHTML = '';
    subcategories.income.forEach(src => {
      const data = incomeSummary[src.value] || { earned: 0, budget: adjustableBudgets.income[src.value] || src.budget };
      const remaining = (data.budget - data.earned).toFixed(2);
      incomeTableBody.innerHTML += `<tr>
        <td>${src.text}</td>
        <td class="income text-right">${data.earned.toFixed(2)}</td>
        <td class="text-right">
          <select class="budget-adjust px-2 py-1 border rounded text-sm" data-type="income" data-category="${src.value}">
            ${generateBudgetOptions(data.budget)}
          </select>
        </td>
        <td class="text-right">${remaining}</td>
      </tr>`;
    });
  }

  const transactionTableBody = document.getElementById('transactionTable');
  if (transactionTableBody) {
    transactionTableBody.innerHTML = '';
    filtered.forEach(tr => {
      const formattedDate = new Date(tr.entryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      transactionTableBody.innerHTML += `<tr>
        <td class="text-center">${tr.item}</td>
        <td class="text-center">${tr.amount.toFixed(2)}</td>
        <td class="text-center">${tr.type === 'income' ? 'Income' : 'Expense'}</td>
        <td class="text-center">${tr.category}</td>
        <td class="text-center">${tr.type.charAt(0).toUpperCase() + tr.type.slice(1)}</td>
        <td class="text-center">${formattedDate}</td>
      </tr>`;
    });
  }

  // Update legacy final summary
  const totalEarned = Object.values(incomeSummary).reduce((sum, s) => sum + s.earned, 0);
  const totalSpent = Object.values(expenseSummary).reduce((sum, s) => sum + s.spent, 0);
  const remaining = totalEarned - totalSpent;
  
  const finalSummary = document.getElementById('finalSummary');
  if (finalSummary) {
    finalSummary.innerHTML = `
      Total Earned: ${totalEarned.toFixed(2)}<br>
      Total Spent: ${totalSpent.toFixed(2)}<br>
      Net Balance: ${remaining.toFixed(2)}
    `;
  }
  
  // Reattach budget listeners for legacy tables
  attachBudgetListeners();
}

// Analytics and charting functions
function updateAnalyticsData(incomeSummary, expenseSummary) {
  analyticsData.currentMonth.income = incomeSummary;
  analyticsData.currentMonth.expense = expenseSummary;
  
  // Calculate trends data (last 6 months)
  const months = [];
  const currentDate = new Date(selectedMonth + '-01');
  
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthStr = monthDate.toISOString().substring(0, 7);
    months.push(monthStr);
  }
  
  analyticsData.trends = months.map(month => {
    const monthTransactions = transactions.filter(t => t.month === month);
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      month: new Date(month + '-01').toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      income,
      expense,
      balance: income - expense
    };
  });
}

function initializeCharts() {
  console.log('Charts initialized and ready for analytics tab');
}

function createExpensePieChart() {
  const canvas = document.getElementById('expensePieChart');
  if (!canvas) return null;
  
  const ctx = canvas.getContext('2d');
  const data = analyticsData.currentMonth.expense;
  
  if (Object.keys(data).length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No expense data', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('for this month', canvas.width / 2, canvas.height / 2 + 10);
    return null;
  }
  
  // Calculate angles for pie chart
  const total = Object.values(data).reduce((sum, item) => sum + item.spent, 0);
  const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6'];
  
  let startAngle = -Math.PI / 2;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 20;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  Object.entries(data).forEach(([category, info], index) => {
    const percentage = info.spent / total;
    const endAngle = startAngle + (percentage * 2 * Math.PI);
    
    // Draw slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    startAngle = endAngle;
  });
  
  return data;
}

function createMonthlyTrendsChart() {
  const canvas = document.getElementById('monthlyTrendsChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const data = analyticsData.trends;
  
  if (data.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No trend data available', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const padding = 40;
  const chartWidth = canvas.width - 2 * padding;
  const chartHeight = canvas.height - 2 * padding;
  
  // Find max value for scaling
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.income, d.expense)),
    100
  ) * 1.1;
  
  // Draw grid lines
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= 4; i++) {
    const y = padding + (i * chartHeight / 4);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + chartWidth, y);
    ctx.stroke();
    
    // Y-axis labels
    const value = maxValue - (i * maxValue / 4);
    ctx.fillStyle = '#6B7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${value.toFixed(0)}`, padding - 5, y + 3);
  }
  
  // Draw lines
  const pointWidth = chartWidth / Math.max(data.length - 1, 1);
  
  // Income line
  ctx.strokeStyle = '#22C55E';
  ctx.lineWidth = 3;
  ctx.beginPath();
  data.forEach((point, index) => {
    const x = padding + (index * pointWidth);
    const y = padding + chartHeight - (point.income / maxValue * chartHeight);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  
  // Expense line
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  data.forEach((point, index) => {
    const x = padding + (index * pointWidth);
    const y = padding + chartHeight - (point.expense / maxValue * chartHeight);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  
  // Draw points and labels
  ctx.fillStyle = '#374151';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  
  data.forEach((point, index) => {
    const x = padding + (index * pointWidth);
    
    // Income point
    const incomeY = padding + chartHeight - (point.income / maxValue * chartHeight);
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.arc(x, incomeY, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Expense point
    const expenseY = padding + chartHeight - (point.expense / maxValue * chartHeight);
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(x, expenseY, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Month label
    ctx.fillStyle = '#6B7280';
    ctx.fillText(point.month, x, canvas.height - 10);
  });
  
  // Legend
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(10, 10, 15, 10);
  ctx.fillStyle = '#374151';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Income', 30, 20);
  
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(100, 10, 15, 10);
  ctx.fillStyle = '#374151';
  ctx.fillText('Expenses', 120, 20);
}

function createBudgetComparisonChart() {
  const canvas = document.getElementById('budgetComparisonChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const expenseData = analyticsData.currentMonth.expense;
  
  if (Object.keys(expenseData).length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No budget data', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('for this month', canvas.width / 2, canvas.height / 2 + 10);
    return;
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const padding = 60;
  const chartWidth = canvas.width - 2 * padding;
  const chartHeight = canvas.height - 2 * padding;
  
  const categories = Object.entries(expenseData);
  const barHeight = Math.max(chartHeight / categories.length, 25);
  const maxBudget = Math.max(...categories.map(([, data]) => Math.max(data.budget, data.spent))) * 1.1;
  
  categories.forEach(([category, data], index) => {
    const y = padding + (index * barHeight);
    const budgetWidth = (data.budget / maxBudget) * chartWidth;
    const spentWidth = (data.spent / maxBudget) * chartWidth;
    
    // Budget bar (background)
    ctx.fillStyle = '#E5E7EB';
    ctx.fillRect(padding, y + 5, budgetWidth, barHeight - 15);
    
    // Spent bar
    const spentColor = data.spent > data.budget ? '#EF4444' : '#3B82F6';
    ctx.fillStyle = spentColor;
    ctx.fillRect(padding, y + 5, Math.min(spentWidth, chartWidth), barHeight - 15);
    
    // Category label
    ctx.fillStyle = '#374151';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    const categoryText = getSubcategoryText(category).replace(/[📱🏠🛒🍕⛽🏡💪✨🛡️🎓]/g, '').trim();
    ctx.fillText(categoryText.substring(0, 8), 5, y + barHeight / 2 + 3);
    
    // Values
    ctx.textAlign = 'right';
    ctx.fillStyle = spentColor;
    ctx.font = '9px sans-serif';
    ctx.fillText(`${data.spent.toFixed(0)}`, canvas.width - 5, y + barHeight / 2 - 2);
    ctx.fillStyle = '#6B7280';
    ctx.fillText(`/${data.budget.toFixed(0)}`, canvas.width - 5, y + barHeight / 2 + 8);
  });
}

function updateCharts() {
  try {
    const expenseData = createExpensePieChart();
    createMonthlyTrendsChart();
    createBudgetComparisonChart();
    
    // Update legends and stats
    updateExpenseLegend(expenseData);
  } catch (error) {
    console.error('Error updating charts:', error);
  }
}

function updateExpenseLegend(expenseData) {
  const legendElement = document.getElementById('expenseLegend');
  if (!legendElement || !expenseData) {
    if (legendElement) {
      legendElement.innerHTML = '<div class="text-gray-500 text-center">No data to display</div>';
    }
    return;
  }
  
  const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6'];
  const total = Object.values(expenseData).reduce((sum, item) => sum + item.spent, 0);
  
  legendElement.innerHTML = Object.entries(expenseData)
    .sort(([,a], [,b]) => b.spent - a.spent)
    .map(([category, data], index) => {
      const percentage = ((data.spent / total) * 100).toFixed(1);
      const categoryText = getSubcategoryText(category);
      return `
        <div class="flex items-center justify-between py-1">
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full" style="background-color: ${colors[index % colors.length]}"></div>
            <span class="text-xs">${categoryText}</span>
          </div>
          <div class="text-right">
            <div class="text-xs font-medium">${data.spent.toFixed(0)}</div>
            <div class="text-xs text-gray-500">${percentage}%</div>
          </div>
        </div>
      `;
    }).join('');
}

// Generate AI Insights
function generateAIInsights() {
  const container = document.getElementById('aiInsights');
  if (!container || !currentUser) return;
  
  const filtered = getFilteredTransactions();
  if (filtered.length === 0) {
    container.innerHTML = '<div class="text-blue-600">Add transactions to get AI insights</div>';
    return;
  }
  
  const insights = [];
  
  // Calculate monthly totals
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
  
  // Savings rate insight
  if (savingsRate > 20) {
    insights.push(`Excellent! You're saving ${savingsRate.toFixed(1)}% of your income this month.`);
  } else if (savingsRate > 10) {
    insights.push(`Good savings rate of ${savingsRate.toFixed(1)}%. Consider increasing to 20%+ for better financial health.`);
  } else if (savingsRate > 0) {
    insights.push(`You're saving ${savingsRate.toFixed(1)}% this month. Try to gradually increase your savings rate.`);
  } else {
    insights.push(`You're spending more than you earn this month. Consider reviewing your expenses.`);
  }
  
  // Find top expense category
  const expensesByCategory = {};
  filtered.filter(t => t.type === 'expense').forEach(t => {
    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
  });
  
  if (Object.keys(expensesByCategory).length > 0) {
    const topCategory = Object.entries(expensesByCategory)
      .sort(([,a], [,b]) => b - a)[0];
    
    const percentage = ((topCategory[1] / totalExpenses) * 100).toFixed(1);
    insights.push(`${getSubcategoryText(topCategory[0])} is your biggest expense (${percentage}% of total spending).`);
    
    // Budget comparison
    const budget = adjustableBudgets.expense[topCategory[0]] || 0;
    if (topCategory[1] > budget * 1.1) {
      insights.push(`You're significantly over budget on ${getSubcategoryText(topCategory[0])}. Consider reviewing this category.`);
    }
  }
  
  // Transaction frequency insight
  const avgTransactionAmount = totalExpenses / filtered.filter(t => t.type === 'expense').length;
  if (avgTransactionAmount > 100) {
    insights.push(`Your average transaction is ${avgTransactionAmount.toFixed(2)}. Consider tracking smaller expenses too.`);
  }
  
  // Goal progress (if user has set goals)
  if (currentUser.savingsGoal > 0) {
    const currentYear = new Date().getFullYear();
    const yearTransactions = transactions.filter(t => new Date(t.entryDate).getFullYear() === currentYear);
    const yearSavings = yearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) -
                       yearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const goalProgress = (yearSavings / currentUser.savingsGoal) * 100;
    
    insights.push(`You're ${goalProgress.toFixed(1)}% towards your annual savings goal of ${currentUser.savingsGoal}.`);
  }
  
  container.innerHTML = insights.map(insight => 
    `<div class="bg-white p-3 rounded-lg border border-blue-200 text-sm">${insight}</div>`
  ).join('');
}

// Data persistence and utility functions (Enhanced for user context)
function saveData() {
  // This function now calls saveUserData for user-specific saving
  if (currentUser) {
    saveUserData();
  } else {
    // Fallback for non-logged in users (temporary storage)
    const data = {
      transactions,
      adjustableBudgets,
      selectedMonth,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem('budgetTrackerData_temp', JSON.stringify(data));
  }
}

function loadData() {
  // This function is now replaced by loadUserData for logged-in users
  if (!currentUser) {
    // Load temporary data for non-logged in users
    const savedData = localStorage.getItem('budgetTrackerData_temp');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        transactions = data.transactions || [];
        adjustableBudgets = data.adjustableBudgets || adjustableBudgets;
        selectedMonth = data.selectedMonth || selectedMonth;
      } catch (error) {
        console.error('Error loading temporary data:', error);
      }
    }
  }
}

// Enhanced notification system
function showNotification(message, type = 'info', duration = 3000) {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = `notification fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl text-white font-medium z-50 shadow-xl transition-all duration-300 max-w-sm text-center backdrop-blur-sm ${
    type === 'success' ? 'bg-green-500/90' : 
    type === 'error' ? 'bg-red-500/90' : 
    type === 'warning' ? 'bg-yellow-500/90' :
    'bg-blue-500/90'
  }`;
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  notification.innerHTML = `
    <div class="flex items-center justify-center space-x-2">
      <span>${icons[type] || icons.info}</span>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);
  
  // Auto remove
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.transform = 'translateX(-50%) translateY(-100%)';
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
  
  // Manual dismiss on click
  notification.addEventListener('click', () => {
    if (notification.parentNode) {
      notification.style.transform = 'translateX(-50%) translateY(-100%)';
      setTimeout(() => notification.remove(), 300);
    }
  });
}

// Export/Import functions (Enhanced for user context)
function exportData() {
  if (!currentUser) {
    showNotification('Please log in to export data', 'error');
    return;
  }
  
  const data = {
    transactions,
    adjustableBudgets,
    user: {
      name: currentUser.name,
      email: currentUser.email,
      customCategories: currentUser.customCategories,
      savingsGoal: currentUser.savingsGoal,
      incomeTarget: currentUser.incomeTarget,
      emergencyFund: currentUser.emergencyFund
    },
    exportDate: new Date().toISOString(),
    version: '2.0.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `budget-data-${currentUser.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification('Data exported successfully!', 'success');
}

function importData(event) {
  if (!currentUser) {
    showNotification('Please log in to import data', 'error');
    return;
  }
  
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.transactions && Array.isArray(data.transactions)) {
        // Merge with existing data or replace
        const shouldMerge = confirm('Do you want to merge with existing data? (Cancel to replace all data)');
        
        if (shouldMerge) {
          // Merge transactions
          const existingIds = new Set(transactions.map(t => t.id));
          const newTransactions = data.transactions.filter(t => !existingIds.has(t.id));
          transactions.push(...newTransactions);
          showNotification(`Merged ${newTransactions.length} new transactions`, 'success');
        } else {
          // Replace all data
          transactions = data.transactions;
          showNotification(`Imported ${transactions.length} transactions`, 'success');
        }
        
        // Update budgets if available
        if (data.adjustableBudgets) {
          adjustableBudgets = { ...adjustableBudgets, ...data.adjustableBudgets };
        }
        
        // Update user goals if available
        if (data.user) {
          if (data.user.customCategories) {
            currentUser.customCategories = { ...currentUser.customCategories, ...data.user.customCategories };
          }
          if (data.user.savingsGoal) currentUser.savingsGoal = data.user.savingsGoal;
          if (data.user.incomeTarget) currentUser.incomeTarget = data.user.incomeTarget;
          if (data.user.emergencyFund) currentUser.emergencyFund = data.user.emergencyFund;
          
          // Update user storage
          users[currentUser.email] = currentUser;
          localStorage.setItem('budgetUsers', JSON.stringify(users));
          localStorage.setItem('budgetCurrentUser', JSON.stringify(currentUser));
        }
        
        saveUserData();
        mergeUserCategories();
        renderMobileView();
        renderTables();
        updateDebugInfo();
        
        if (currentPage === 'transactions') {
          renderFullTransactionsList();
        }
      } else {
        showNotification('Invalid data format', 'error');
      }
    } catch (error) {
      console.error('Import error:', error);
      showNotification('Error importing data: Invalid file format', 'error');
    }
  };
  reader.readAsText(file);
  
  // Reset file input
  event.target.value = '';
}

function clearAllData() {
  if (!currentUser) {
    showNotification('Please log in to clear data', 'error');
    return;
  }
  
  if (confirm('Are you sure you want to clear ALL transaction data? This cannot be undone!')) {
    if (confirm('This will delete all your transactions but keep your account and settings. Continue?')) {
      transactions = [];
      
      // Reset budgets to defaults but keep custom categories
      adjustableBudgets = {
        income: { UCO: 1000, GONG: 1300, Freelance: 500, Investment: 200 },
        expense: {
          Rent: 300, Grocery: 200, Food: 100, Petrol: 120, Home: 250,
          Gym: 80, Mobile: 60, Extra: 50, Insurance: 150, Tuition: 1000,
        }
      };
      
      // Re-add custom category budgets
      if (currentUser.customCategories) {
        Object.entries(currentUser.customCategories).forEach(([name, data]) => {
          adjustableBudgets[data.type][name] = data.budget;
        });
      }
      
      saveUserData();
      renderMobileView();
      renderTables();
      updateDebugInfo();
      
      if (currentPage === 'transactions') {
        renderFullTransactionsList();
      }
      
      showNotification('All transaction data cleared successfully', 'success');
    }
  }
}

function getDataStats() {
  const totalTransactions = transactions.length;
  const totalMonths = new Set(transactions.map(t => t.month)).size;
  const oldestTransaction = transactions.length > 0 ? 
    new Date(Math.min(...transactions.map(t => new Date(t.entryDate)))).toLocaleDateString() : 'None';
  const newestTransaction = transactions.length > 0 ? 
    new Date(Math.max(...transactions.map(t => new Date(t.entryDate)))).toLocaleDateString() : 'None';
  
  const currentMonthTransactions = getFilteredTransactions().length;
  const customCategoriesCount = currentUser?.customCategories ? Object.keys(currentUser.customCategories).length : 0;
  
  return {
    totalTransactions,
    totalMonths,
    oldestTransaction,
    newestTransaction,
    currentMonthTransactions,
    customCategoriesCount,
    userName: currentUser?.name || 'Guest',
    userEmail: currentUser?.email || 'N/A'
  };
}

function updateDebugInfo() {
  const debugElement = document.getElementById('debugInfo');
  if (!debugElement) return;
  
  const stats = getDataStats();
  const filteredCount = getFilteredTransactions().length;
  
  debugElement.innerHTML = `
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div>User: ${stats.userName}</div>
      <div>Email: ${stats.userEmail}</div>
      <div>Total Transactions: ${stats.totalTransactions}</div>
      <div>This Month: ${filteredCount}</div>
      <div>Total Months: ${stats.totalMonths}</div>
      <div>Custom Categories: ${stats.customCategoriesCount}</div>
      <div>Date Range: ${stats.oldestTransaction}</div>
      <div>to ${stats.newestTransaction}</div>
      <div>Last Updated: ${new Date().toLocaleTimeString()}</div>
      <div>Data Loaded: ${userDataLoaded ? 'Yes' : 'No'}</div>
    </div>
  `;
}

function showDataStats() {
  const stats = getDataStats();
  const message = `📊 Data Statistics for ${stats.userName}

📈 Total Transactions: ${stats.totalTransactions}
📅 Months with Data: ${stats.totalMonths}  
📍 Current Month: ${getFilteredTransactions().length} transactions
🏷️ Custom Categories: ${stats.customCategoriesCount}
📆 Date Range: ${stats.oldestTransaction} to ${stats.newestTransaction}
👤 Account: ${stats.userEmail}
💾 Data Status: ${userDataLoaded ? 'Loaded' : 'Not Loaded'}`;
  
  alert(message);
}

// Make enhanced functions globally available
window.showTab = showTab;
window.deleteTransaction = deleteTransaction;
window.editTransaction = editTransaction;
window.exportData = exportData;
window.importData = importData;
window.clearAllData = clearAllData;
window.getDataStats = getDataStats;
window.showDataStats = showDataStats;
window.generateAIInsights = generateAIInsights;
window.initializeBudgetTracker = initializeBudgetTracker;