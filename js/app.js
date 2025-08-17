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
    { value: 'Insurance', text: '🛡️ Insurance', budget: 150 }
  ]
};

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
    Insurance: 150
  }
};

// DOM elements
const budgetForm = document.getElementById('budgetForm');
const categorySelect = document.getElementById('category');
const subcategorySelect = document.getElementById('subcategory');
const monthSelector = document.getElementById('monthSelector');
const entryDateInput = document.getElementById('entryDate');
const itemInput = document.getElementById('item');
const amountInput = document.getElementById('amount');

// New mobile-friendly elements
const totalIncomeCard = document.getElementById('totalIncomeCard');
const totalExpenseCard = document.getElementById('totalExpenseCard');
const netBalanceCard = document.getElementById('netBalanceCard');
const transactionList = document.getElementById('transactionList');
const expenseList = document.getElementById('expenseList');
const incomeList = document.getElementById('incomeList');

// Legacy elements for compatibility
const transactionTableBody = document.getElementById('transactionTable');
const expenseTableBody = document.getElementById('expenseTable');
const incomeTableBody = document.getElementById('incomeTable');
const finalSummary = document.getElementById('finalSummary');
const incomeTitle = document.getElementById('incomeTitle');
const expenseTitle = document.getElementById('expenseTitle');
const transactionTitle = document.getElementById('transactionTitle');

let selectedMonth = monthSelector.value;
entryDateInput.value = `${selectedMonth}-01`;

// Initialize the application with better error handling and user feedback
document.addEventListener('DOMContentLoaded', function() {
  try {
    showNotification('Loading your budget data...', 'info', 1500);
    
    loadData();
    updateSubcategories();
    updateDisplayedMonth();
    renderMobileView();
    renderTables();
    
    // Event listeners with error handling
    budgetForm.addEventListener('submit', handleFormSubmit);
    categorySelect.addEventListener('change', updateSubcategories);
    monthSelector.addEventListener('change', handleMonthChange);
    
    // Auto-save every 30 seconds if there are unsaved changes
    setInterval(() => {
      if (transactions.length > 0) {
        saveData();
      }
    }, 30000);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveData();
        showNotification('Data saved manually', 'success', 1500);
      }
      
      // Escape to clear form
      if (e.key === 'Escape' && document.activeElement.closest('#budgetForm')) {
        budgetForm.reset();
        subcategorySelect.innerHTML = '<option value="">Select category</option>';
        showNotification('Form cleared', 'info', 1500);
      }
    });
    
    // Show welcome message for new users
    if (transactions.length === 0) {
      setTimeout(() => {
        showNotification('Welcome! Start by adding your first transaction below.', 'info', 4000);
      }, 2000);
    } else {
      setTimeout(() => {
        showNotification(`Loaded ${transactions.length} transactions`, 'success', 2000);
      }, 1000);
    }
    
  } catch (error) {
    console.error('Initialization error:', error);
    showNotification('Error loading app. Please refresh the page.', 'error', 5000);
  }
});

// Tab system
function showTab(tabName) {
  // Hide all content
  document.getElementById('content-transactions').classList.add('hidden');
  document.getElementById('content-expenses').classList.add('hidden');
  document.getElementById('content-income').classList.add('hidden');
  
  // Remove active state from all tabs
  document.getElementById('tab-transactions').className = 'flex-1 py-3 px-4 text-center font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent';
  document.getElementById('tab-expenses').className = 'flex-1 py-3 px-4 text-center font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent';
  document.getElementById('tab-income').className = 'flex-1 py-3 px-4 text-center font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent';
  
  // Show selected content and activate tab
  document.getElementById(`content-${tabName}`).classList.remove('hidden');
  document.getElementById(`tab-${tabName}`).className = 'flex-1 py-3 px-4 text-center font-medium text-blue-600 bg-blue-50 border-b-2 border-blue-600';
}

function handleMonthChange() {
  selectedMonth = monthSelector.value;
  entryDateInput.value = `${selectedMonth}-01`;
  updateDisplayedMonth();
  renderMobileView();
  renderTables();
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  // Show loading state
  const submitButton = e.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Adding...';
  submitButton.disabled = true;
  
  // Enhanced validation
  const item = itemInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;
  const subcategory = subcategorySelect.value;
  const entryDate = entryDateInput.value;
  
  // Detailed validation with specific error messages
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
      id: Date.now() + Math.random(), // Better unique ID
      item: item.substring(0, 100), // Limit item name length
      amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      type: category,
      category: subcategory,
      entryDate,
      month: entryDate.substring(0, 7), // YYYY-MM format
      createdAt: new Date().toISOString()
    };
    
    transactions.push(transaction);
    saveData();
    
    // Reset form
    budgetForm.reset();
    subcategorySelect.innerHTML = '<option value="">Select category</option>';
    
    // Update displays
    renderMobileView();
    renderTables();
    
    // Show success feedback with transaction details
    const typeText = category === 'income' ? 'Income' : 'Expense';
    showNotification(`${typeText} of ${amount.toFixed(2)} added successfully!`, 'success');
    
    // Reset button
    resetButton();
    
    // Focus back to item input for quick entry
    setTimeout(() => itemInput.focus(), 100);
  }, 800);
  
  function resetButton() {
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
}

function updateDisplayedMonth() {
  const [year, month] = selectedMonth.split('-');
  const date = new Date(year, month - 1);
  const monthName = date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  
  // Update titles
  if (incomeTitle) incomeTitle.textContent = `${monthName} Income Summary`;
  if (expenseTitle) expenseTitle.textContent = `${monthName} Expense Summary`;
  if (transactionTitle) transactionTitle.textContent = `Recent Transactions - ${monthName}`;
}

function updateSubcategories() {
  const type = categorySelect.value;
  subcategorySelect.innerHTML = '<option value="">Select category</option>';
  if (!type) return;
  
  subcategories[type].forEach(sub => {
    let opt = document.createElement('option');
    opt.value = sub.value;
    opt.textContent = sub.text;
    subcategorySelect.appendChild(opt);
  });
}

function getFilteredTransactions() {
  return transactions.filter(t => t.month === selectedMonth);
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
            <div class="font-bold ${amountColor}">${transaction.amount.toFixed(2)}</div>
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

function createCategoryCard(category, data, type, budget) {
  const isIncome = type === 'income';
  const label = isIncome ? 'Earned' : 'Spent';
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
  const amount = isIncome ? data.earned : data.spent;
  const remaining = budget - amount;
  const percentage = (amount / budget) * 100;
  
  return `
    <div class="category-card bg-gray-50 rounded-lg p-4 border">
      <div class="flex justify-between items-center mb-2">
        <div class="font-medium text-gray-900">${category}</div>
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
          <div class="h-2 rounded-full ${percentage > 100 ? 'bg-red-500' : (isIncome ? 'bg-green-500' : 'bg-red-500')}" 
               style="width: ${Math.min(percentage, 100)}%"></div>
        </div>
        <select class="budget-select budget-adjust text-xs px-2 py-1 border rounded" data-type="${type}" data-category="${category}">
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
  
  const confirmMessage = `Are you sure you want to delete "${transaction.item}" (${transaction.amount.toFixed(2)})?`;
  
  if (confirm(confirmMessage)) {
    // Show loading state
    showNotification('Deleting transaction...', 'info');
    
    setTimeout(() => {
      transactions = transactions.filter(t => t.id !== id);
      saveData();
      renderMobileView();
      renderTables();
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
  
  // Pre-fill the form with transaction data
  itemInput.value = transaction.item;
  amountInput.value = transaction.amount;
  entryDateInput.value = transaction.entryDate;
  categorySelect.value = transaction.type;
  
  // Update subcategories and select the correct one
  updateSubcategories();
  setTimeout(() => {
    subcategorySelect.value = transaction.category;
  }, 100);
  
  // Remove the original transaction
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  renderMobileView();
  renderTables();
  
  // Show edit feedback and focus
  showNotification('Transaction loaded for editing. Make changes and save.', 'info');
  itemInput.focus();
  
  // Scroll to form
  document.querySelector('#budgetForm').scrollIntoView({ 
    behavior: 'smooth',
    block: 'center'
  });
}

function renderMobileView() {
  const filtered = getFilteredTransactions();
  
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
  
  // Update quick stats
  const totalEarned = Object.values(incomeSummary).reduce((sum, s) => sum + s.earned, 0);
  const totalSpent = Object.values(expenseSummary).reduce((sum, s) => sum + s.spent, 0);
  const remaining = totalEarned - totalSpent;
  
  totalIncomeCard.textContent = `$${totalEarned.toFixed(2)}`;
  totalExpenseCard.textContent = `$${totalSpent.toFixed(2)}`;
  netBalanceCard.textContent = `$${remaining.toFixed(2)}`;
  netBalanceCard.className = `text-xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`;
  
  // Render transactions
  if (transactionList) {
    const sortedTransactions = [...filtered].sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
    transactionList.innerHTML = sortedTransactions.length ? 
      sortedTransactions.slice(0, 10).map(createTransactionCard).join('') :
      '<div class="text-center text-gray-500 py-8">No transactions yet</div>';
  }
  
  // Render expenses
  if (expenseList) {
    expenseList.innerHTML = subcategories.expense.map(cat => {
      const data = expenseSummary[cat.value] || { spent: 0, budget: adjustableBudgets.expense[cat.value] || cat.budget };
      return createCategoryCard(cat.text, data, 'expense', data.budget);
    }).join('');
  }
  
  // Render income
  if (incomeList) {
    incomeList.innerHTML = subcategories.income.map(src => {
      const data = incomeSummary[src.value] || { earned: 0, budget: adjustableBudgets.income[src.value] || src.budget };
      return createCategoryCard(src.text, data, 'income', data.budget);
    }).join('');
  }
  
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
  
  if (finalSummary) {
    finalSummary.innerHTML = `
      Total Earned: $${totalEarned.toFixed(2)}<br>
      Total Spent: $${totalSpent.toFixed(2)}<br>
      Net Balance: $${remaining.toFixed(2)}
    `;
  }
}

// Data persistence functions with localStorage
function saveData() {
  const data = {
    transactions,
    adjustableBudgets,
    selectedMonth,
    lastSaved: new Date().toISOString()
  };
  try {
    localStorage.setItem('budgetTrackerData', JSON.stringify(data));
    showNotification('Data saved automatically', 'success');
  } catch (e) {
    console.log('LocalStorage not available, using memory');
    window.budgetData = data;
  }
}

function loadData() {
  try {
    const stored = localStorage.getItem('budgetTrackerData');
    if (stored) {
      const data = JSON.parse(stored);
      transactions = data.transactions || [];
      adjustableBudgets = data.adjustableBudgets || adjustableBudgets;
      selectedMonth = data.selectedMonth || selectedMonth;
      monthSelector.value = selectedMonth;
      console.log('Data loaded from localStorage');
    } else {
      console.log('No saved data found, using defaults');
    }
  } catch (e) {
    console.log('Error loading data, using defaults');
    // Fallback to global variable if localStorage fails
    const data = window.budgetData;
    if (data) {
      transactions = data.transactions || [];
      adjustableBudgets = data.adjustableBudgets || adjustableBudgets;
    }
  }
}

// Enhanced notification system with different types and positioning
function showNotification(message, type = 'info', duration = 3000) {
  // Remove any existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = `notification fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg text-white font-medium z-50 shadow-lg transition-all duration-300 max-w-sm text-center ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    type === 'warning' ? 'bg-yellow-500' :
    'bg-blue-500'
  }`;
  
  // Add icon based on type
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
  
  // Add to DOM with animation
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(-50%) translateY(0)';
    notification.style.opacity = '1';
  }, 10);
  
  // Auto remove
  setTimeout(() => {
    notification.style.transform = 'translateX(-50%) translateY(-20px)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, duration);
  
  // Manual dismiss on click
  notification.addEventListener('click', () => {
    notification.style.transform = 'translateX(-50%) translateY(-20px)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
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
        showNotification('Data imported successfully!', 'success');
      } else {
        showNotification('Invalid data format', 'error');
      }
    } catch (error) {
      showNotification('Error importing data', 'error');
    }
  };
  reader.readAsText(file);
}

// Make functions globally available
window.showTab = showTab;
window.deleteTransaction = deleteTransaction;
window.editTransaction = editTransaction;
window.exportData = exportData;
window.importData = importData;

// Additional utility functions for better UX
function clearAllData() {
  if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
    if (confirm('This will delete all transactions and reset budgets. Are you absolutely sure?')) {
      transactions = [];
      adjustableBudgets = {
        income: { UCO: 1000, GONG: 1300 },
        expense: {
          Rent: 300, Grocery: 200, Food: 100, Petrol: 120, Home: 250,
          Gym: 80, Mobile: 60, Extra: 50, Insurance: 150
        }
      };
      
      try {
        localStorage.removeItem('budgetTrackerData');
      } catch (e) {
        console.log('LocalStorage not available');
      }
      
      renderMobileView();
      renderTables();
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

// Add these to global scope for debugging/admin features
window.clearAllData = clearAllData;
window.getDataStats = getDataStats;