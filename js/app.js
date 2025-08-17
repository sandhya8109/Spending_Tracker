// Configuration
const subcategories = {
  income: [
    { value: 'UCO', text: '🏫 UCO', budget: 1000 },
    { value: 'GONG', text: '💼 Private', budget: 1300 }
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

// Global variables
let transactions = [];
let adjustableBudgets = {
  income: {
    UCO: 1000,
    GONG: 1300
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

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing comprehensive budget tracker...');
  
  try {
    showNotification('Loading your budget data...', 'info', 1500);
    
    // Get DOM elements
    const budgetForm = document.getElementById('budgetForm');
    const categorySelect = document.getElementById('category');
    const subcategorySelect = document.getElementById('subcategory');
    const monthSelector = document.getElementById('monthSelector');
    const entryDateInput = document.getElementById('entryDate');
    
    // Set initial values
    selectedMonth = monthSelector.value;
    entryDateInput.value = `${selectedMonth}-01`;
    
    // Load saved data
    loadData();
    
    // Setup event listeners
    budgetForm.addEventListener('submit', handleFormSubmit);
    categorySelect.addEventListener('change', updateSubcategories);
    monthSelector.addEventListener('change', handleMonthChange);
    
    // Initial render
    updateSubcategories();
    updateDisplayedMonth();
    renderMobileView();
    renderTables();
    initializeCharts();
    
    // Auto-save every 30 seconds
    setInterval(() => {
      if (transactions.length > 0) {
        saveData();
      }
    }, 30000);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveData();
        showNotification('Data saved manually', 'success', 1500);
      }
      
      if (e.key === 'Escape' && document.activeElement.closest('#budgetForm')) {
        budgetForm.reset();
        subcategorySelect.innerHTML = '<option value="">Select category</option>';
        showNotification('Form cleared', 'info', 1500);
      }
    });
    
    // Show welcome message
    if (transactions.length === 0) {
      setTimeout(() => {
        showNotification('Welcome! Start by adding your first transaction below.', 'info', 4000);
      }, 2000);
    } else {
      setTimeout(() => {
        showNotification(`Loaded ${transactions.length} transactions`, 'success', 2000);
      }, 1000);
    }
    
    console.log('App initialized successfully with', transactions.length, 'transactions');
    updateDebugInfo();
    
  } catch (error) {
    console.error('Initialization error:', error);
    showNotification('Error loading app. Please refresh the page.', 'error', 5000);
  }
});

function handleFormSubmit(e) {
  e.preventDefault();
  
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
  
  if (!category) {
    showNotification('Please select income or expense', 'error');
    resetButton();
    return;
  }
  
  if (!subcategory) {
    showNotification('Please select a category', 'error');
    resetButton();
    return;
  }
  
  if (!entryDate) {
    showNotification('Please select a date', 'error');
    resetButton();
    return;
  }
  
  // Check if date is too far in the future
  const today = new Date();
  const selectedDate = new Date(entryDate);
  const futureLimit = new Date();
  futureLimit.setFullYear(today.getFullYear() + 1);
  
  if (selectedDate > futureLimit) {
    showNotification('Date cannot be more than 1 year in the future', 'error');
    resetButton();
    return;
  }
  
  // Simulate processing delay for better UX
  setTimeout(() => {
    const transaction = {
      id: Date.now() + Math.random(),
      item: item.substring(0, 100),
      amount: Math.round(amount * 100) / 100,
      type: category,
      category: subcategory,
      entryDate,
      month: entryDate.substring(0, 7),
      createdAt: new Date().toISOString()
    };
    
    console.log('Adding transaction:', transaction);
    
    transactions.push(transaction);
    saveData();
    
    // Reset form
    document.getElementById('budgetForm').reset();
    document.getElementById('subcategory').innerHTML = '<option value="">Select category</option>';
    
    // Update displays
    renderMobileView();
    renderTables();
    
    // Show success feedback
    const typeText = category === 'income' ? 'Income' : 'Expense';
    showNotification(`${typeText} of $${amount.toFixed(2)} added successfully!`, 'success');
    
    resetButton();
    updateDebugInfo();
    
    // Focus back to item input for quick entry
    setTimeout(() => document.getElementById('item').focus(), 100);
  }, 800);
  
  function resetButton() {
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
}

function handleMonthChange() {
  selectedMonth = document.getElementById('monthSelector').value;
  document.getElementById('entryDate').value = `${selectedMonth}-01`;
  updateDisplayedMonth();
  renderMobileView();
  renderTables();
  updateDebugInfo();
}

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

function updateDisplayedMonth() {
  const [year, month] = selectedMonth.split('-');
  const date = new Date(year, month - 1);
  const monthName = date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  
  // Update titles
  document.getElementById('transactionTitle').textContent = `Recent Transactions - ${monthName}`;
  document.getElementById('expenseTitle').textContent = `${monthName} Expense Breakdown`;
  document.getElementById('incomeTitle').textContent = `${monthName} Income Sources`;
}

function getFilteredTransactions() {
  return transactions.filter(t => t.month === selectedMonth);
}

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
  
  document.getElementById('totalIncomeCard').textContent = `$${totalEarned.toFixed(2)}`;
  document.getElementById('totalExpenseCard').textContent = `$${totalSpent.toFixed(2)}`;
  document.getElementById('netBalanceCard').textContent = `$${remaining.toFixed(2)}`;
  document.getElementById('netBalanceCard').className = `text-xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`;
  
  // Render transactions
  const transactionList = document.getElementById('transactionList');
  if (filtered.length === 0) {
    transactionList.innerHTML = '<div class="text-center text-gray-500 py-8">No transactions for this month</div>';
  } else {
    const sortedTransactions = [...filtered].sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
    transactionList.innerHTML = sortedTransactions.slice(0, 10).map(createTransactionCard).join('');
  }
  
  // Render expense categories
  const expenseList = document.getElementById('expenseList');
  expenseList.innerHTML = subcategories.expense.map(cat => {
    const data = expenseSummary[cat.value] || { spent: 0, budget: adjustableBudgets.expense[cat.value] || cat.budget };
    return createCategoryCard(cat.text, data, 'expense', data.budget, cat.value);
  }).join('');
  
  // Render income categories
  const incomeList = document.getElementById('incomeList');
  incomeList.innerHTML = subcategories.income.map(src => {
    const data = incomeSummary[src.value] || { earned: 0, budget: adjustableBudgets.income[src.value] || src.budget };
    return createCategoryCard(src.text, data, 'income', data.budget, src.value);
  }).join('');
  
  // Attach budget adjustment listeners
  document.querySelectorAll('.budget-adjust').forEach(select => {
    select.addEventListener('change', function() {
      const type = this.getAttribute('data-type');
      const category = this.getAttribute('data-category');
      const newBudget = parseFloat(this.value);
      if (!isNaN(newBudget)) {
        adjustableBudgets[type][category] = newBudget;
        saveData();
        renderMobileView();
        renderTables();
        showNotification('Budget updated', 'success');
      }
    });
  });
}

function createTransactionCard(transaction) {
  const date = new Date(transaction.entryDate).toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric' 
  });
  
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
  const icon = isIncome ? '💰' : '💸';
  
  return `
    <div class="transaction-card bg-white rounded-lg p-4 border shadow-sm hover:shadow-md transition-shadow">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-3 flex-1">
          <span class="text-lg">${icon}</span>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 truncate">${transaction.item}</div>
            <div class="text-sm text-gray-500">${getSubcategoryText(transaction.category)} • ${date}</div>
          </div>
        </div>
        <div class="text-right flex items-center space-x-2">
          <div>
            <div class="font-bold ${amountColor}">$${transaction.amount.toFixed(2)}</div>
          </div>
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

function createCategoryCard(categoryText, data, type, budget, categoryKey) {
  const isIncome = type === 'income';
  const amount = isIncome ? data.earned : data.spent;
  const remaining = budget - amount;
  const percentage = budget > 0 ? (amount / budget) * 100 : 0;
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
  
  return `
    <div class="category-card bg-gray-50 rounded-lg p-4 border">
      <div class="flex justify-between items-center mb-2">
        <div class="font-medium text-gray-900">${categoryText}</div>
        <div class="font-bold ${amountColor}">$${amount.toFixed(2)}</div>
      </div>
      <div class="flex justify-between items-center text-sm text-gray-600 mb-2">
        <span>Budget: $${budget}</span>
        <span class="${remaining >= 0 ? 'text-green-600' : 'text-red-600'}">
          ${remaining >= 0 ? 'Remaining' : 'Over'}: $${Math.abs(remaining).toFixed(2)}
        </span>
      </div>
      <div class="flex justify-between items-center">
        <div class="flex-1 bg-gray-200 rounded-full h-2 mr-3">
          <div class="h-2 rounded-full ${percentage > 100 ? 'bg-red-500' : (isIncome ? 'bg-green-500' : 'bg-blue-500')}" 
               style="width: ${Math.min(percentage, 100)}%"></div>
        </div>
        <select class="budget-adjust text-xs px-2 py-1 border rounded" data-type="${type}" data-category="${categoryKey}">
          ${generateBudgetOptions(budget)}
        </select>
      </div>
    </div>
  `;
}

function generateBudgetOptions(currentBudget) {
  const options = [];
  const budgetValues = [50, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1300, 1500, 2000];
  
  budgetValues.forEach(value => {
    const selected = value === currentBudget ? 'selected' : '';
    options.push(`<option value="${value}" ${selected}>$${value}</option>`);
  });
  
  return options.join('');
}

function getSubcategoryText(value) {
  const allSubcategories = [...subcategories.income, ...subcategories.expense];
  const sub = allSubcategories.find(s => s.value === value);
  return sub ? sub.text : value;
}

function deleteTransaction(id) {
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) {
    showNotification('Transaction not found', 'error');
    return;
  }
  
  const confirmMessage = `Are you sure you want to delete "${transaction.item}" ($${transaction.amount.toFixed(2)})?`;
  
  if (confirm(confirmMessage)) {
    showNotification('Deleting transaction...', 'info');
    
    setTimeout(() => {
      transactions = transactions.filter(t => t.id !== id);
      saveData();
      renderMobileView();
      renderTables();
      updateDebugInfo();
      showNotification('Transaction deleted successfully', 'success');
    }, 500);
  }
}

function editTransaction(id) {
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) {
    showNotification('Transaction not found', 'error');
    return;
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
  saveData();
  renderMobileView();
  renderTables();
  updateDebugInfo();
  
  showNotification('Transaction loaded for editing. Make changes and save.', 'info');
  document.getElementById('item').focus();
  
  // Scroll to form
  document.querySelector('#budgetForm').scrollIntoView({ 
    behavior: 'smooth',
    block: 'center'
  });
}

function showTab(tabName) {
  // Hide all content
  document.getElementById('content-transactions').classList.add('hidden');
  document.getElementById('content-expenses').classList.add('hidden');
  document.getElementById('content-income').classList.add('hidden');
  document.getElementById('content-analytics').classList.add('hidden');
  
  // Remove active state from all tabs
  const tabs = ['transactions', 'expenses', 'income', 'analytics'];
  tabs.forEach(tab => {
    document.getElementById(`tab-${tab}`).className = 'flex-1 py-3 px-2 text-center font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent text-xs';
  });
  
  // Show selected content and activate tab
  document.getElementById(`content-${tabName}`).classList.remove('hidden');
  document.getElementById(`tab-${tabName}`).className = 'flex-1 py-3 px-2 text-center font-medium text-blue-600 bg-blue-50 border-b-2 border-blue-600 text-xs';
  
  // Update charts when analytics tab is shown
  if (tabName === 'analytics') {
    setTimeout(() => updateCharts(), 100);
  }
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
    const categoryText = getSubcategoryText(category).replace(/[📱🏠🛒🍕⛽🏡💪✨🛡️]/g, '').trim();
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
    updateAnalyticsStats();
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

function updateAnalyticsStats() {
  const statsElement = document.getElementById('analyticsStats');
  if (!statsElement) return;
  
  const currentMonth = analyticsData.currentMonth;
  const totalIncome = Object.values(currentMonth.income).reduce((sum, item) => sum + item.earned, 0);
  const totalExpense = Object.values(currentMonth.expense).reduce((sum, item) => sum + item.spent, 0);
  const balance = totalIncome - totalExpense;
  
  // Calculate savings rate
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
  
  // Find highest expense category
  const highestExpense = Object.entries(currentMonth.expense)
    .sort(([,a], [,b]) => b.spent - a.spent)[0];
  
  // Calculate budget utilization
  const totalBudget = Object.values(adjustableBudgets.expense).reduce((sum, budget) => sum + budget, 0);
  const budgetUtilization = totalBudget > 0 ? ((totalExpense / totalBudget) * 100) : 0;
  
  statsElement.innerHTML = `
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="bg-green-50 p-4 rounded-lg border border-green-200">
        <div class="text-green-800 text-sm font-medium">Savings Rate</div>
        <div class="text-2xl font-bold text-green-600">${savingsRate.toFixed(1)}%</div>
      </div>
      <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div class="text-blue-800 text-sm font-medium">Budget Used</div>
        <div class="text-2xl font-bold text-blue-600">${budgetUtilization.toFixed(1)}%</div>
      </div>
    </div>
    
    <div class="space-y-3">
      ${highestExpense ? `
        <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <div class="text-yellow-800 text-sm font-medium">Top Expense Category</div>
          <div class="font-semibold">${getSubcategoryText(highestExpense[0])} - ${highestExpense[1].spent.toFixed(2)}</div>
        </div>
      ` : ''}
      
      ${balance < 0 ? `
        <div class="bg-red-50 p-3 rounded-lg border border-red-200">
          <div class="text-red-800 text-sm font-medium">⚠️ Budget Alert</div>
          <div class="font-semibold">You're overspending by ${Math.abs(balance).toFixed(2)} this month</div>
        </div>
      ` : balance > totalIncome * 0.3 ? `
        <div class="bg-green-50 p-3 rounded-lg border border-green-200">
          <div class="text-green-800 text-sm font-medium">🎉 Great Job!</div>
          <div class="font-semibold">You're saving ${savingsRate.toFixed(1)}% of your income!</div>
        </div>
      ` : ''}
    </div>
  `;
}

// Data persistence and utility functions
function saveData() {
  const data = {
    transactions,
    adjustableBudgets,
    selectedMonth,
    lastSaved: new Date().toISOString()
  };
  
  // Use in-memory storage instead of localStorage
  window.budgetData = data;
  console.log('Data saved to memory:', transactions.length, 'transactions');
}

function loadData() {
  // Load from in-memory storage
  const data = window.budgetData;
  if (data) {
    transactions = data.transactions || [];
    adjustableBudgets = data.adjustableBudgets || adjustableBudgets;
    selectedMonth = data.selectedMonth || selectedMonth;
    console.log('Data loaded from memory:', transactions.length, 'transactions');
  } else {
    console.log('No saved data found, using defaults');
  }
}

function showNotification(message, type = 'info', duration = 3000) {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = `notification fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg text-white font-medium z-50 shadow-lg transition-all duration-300 max-w-sm text-center ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    type === 'warning' ? 'bg-yellow-500' :
    'bg-blue-500'
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
  
  // Auto remove
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, duration);
  
  // Manual dismiss on click
  notification.addEventListener('click', () => {
    if (notification.parentNode) {
      notification.remove();
    }
  });
}

// Export/Import functions
function exportData() {
  const data = {
    transactions,
    adjustableBudgets,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `budget-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification('Data exported successfully!', 'success');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.transactions && Array.isArray(data.transactions)) {
        transactions = data.transactions;
        if (data.adjustableBudgets) {
          adjustableBudgets = data.adjustableBudgets;
        }
        saveData();
        renderMobileView();
        renderTables();
        updateDebugInfo();
        showNotification(`Data imported successfully! Loaded ${transactions.length} transactions`, 'success');
      } else {
        showNotification('Invalid data format', 'error');
      }
    } catch (error) {
      console.error('Import error:', error);
      showNotification('Error importing data', 'error');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
    if (confirm('This will delete all transactions and reset budgets. Are you absolutely sure?')) {
      transactions = [];
      adjustableBudgets = {
        income: { UCO: 1000, GONG: 1300 },
        expense: {
          Rent: 300, Grocery: 200, Food: 100, Petrol: 120, Home: 250,
          Gym: 80, Mobile: 60, Extra: 50, Insurance: 150, Tuition: 1000,
        }
      };
      
      // Clear memory storage
      window.budgetData = null;
      
      renderMobileView();
      renderTables();
      updateDebugInfo();
      showNotification('All data cleared successfully', 'success');
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
  
  return {
    totalTransactions,
    totalMonths,
    oldestTransaction,
    newestTransaction
  };
}

function updateDebugInfo() {
  const debugElement = document.getElementById('debugInfo');
  if (!debugElement) return;
  
  const stats = getDataStats();
  const filteredCount = getFilteredTransactions().length;
  
  debugElement.innerHTML = `
    <div>Total Transactions: ${stats.totalTransactions}</div>
    <div>This Month: ${filteredCount}</div>
    <div>Total Months: ${stats.totalMonths}</div>
    <div>Date Range: ${stats.oldestTransaction} to ${stats.newestTransaction}</div>
    <div>Last Updated: ${new Date().toLocaleTimeString()}</div>
  `;
}

function showDataStats() {
  const stats = getDataStats();
  alert(`Data Statistics:\n\nTotal Transactions: ${stats.totalTransactions}\nMonths with Data: ${stats.totalMonths}\nOldest Entry: ${stats.oldestTransaction}\nNewest Entry: ${stats.newestTransaction}\nCurrent Month: ${selectedMonth}\nFiltered Count: ${getFilteredTransactions().length}`);
}

// Make functions globally available
window.showTab = showTab;
window.deleteTransaction = deleteTransaction;
window.editTransaction = editTransaction;
window.exportData = exportData;
window.importData = importData;
window.clearAllData = clearAllData;
window.getDataStats = getDataStats;
window.showDataStats = showDataStats;