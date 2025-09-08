// Navigation System
class NavigationManager {
  constructor() {
    this.currentSection = 'dashboard';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeUserInfo();
    this.setCurrentDate();
    this.showSection('dashboard');
  }

  setupEventListeners() {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        this.closeMobileMenu();
      });
    }

    // Navigation links
    document.querySelectorAll('[data-section]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.currentTarget.getAttribute('data-section');
        this.showSection(section);
        this.closeMobileMenu();
      });
    });

    // Chat form
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
      chatForm.addEventListener('submit', (e) => this.handleChatMessage(e));
    }

    // Responsive handling
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) {
        this.closeMobileMenu();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Alt + number for quick navigation
      if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const sections = ['dashboard', 'goals', 'transactions', 'analytics', 'chat'];
        const num = parseInt(e.key);
        if (num >= 1 && num <= sections.length) {
          e.preventDefault();
          this.showSection(sections[num - 1]);
        }
      }

      // Escape to close mobile menu
      if (e.key === 'Escape') {
        this.closeMobileMenu();
      }
    });
  }

  initializeUserInfo() {
    const user = getCurrentUser();
    if (user) {
      const initials = this.getInitials(user.fullName || user.username);
      document.getElementById('userInitials').textContent = initials;
      document.getElementById('topUserInitials').textContent = initials;
      document.getElementById('userName').textContent = user.fullName || user.username;
      document.getElementById('userRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
  }

  getInitials(name) {
    return name.split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  setCurrentDate() {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
  }

  toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar.classList.contains('-translate-x-full')) {
      this.openMobileMenu();
    } else {
      this.closeMobileMenu();
    }
  }

  openMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(section => {
      section.classList.add('hidden');
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-content`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }

    // Update navigation active state
    document.querySelectorAll('[data-section]').forEach(link => {
      link.classList.remove('active-nav');
      link.classList.add('text-gray-700', 'hover:bg-gray-100');
      link.classList.remove('text-white');
    });

    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
      activeLink.classList.add('active-nav');
      activeLink.classList.remove('text-gray-700', 'hover:bg-gray-100');
      activeLink.classList.add('text-white');
    }

    // Update page title
    const titles = {
      dashboard: 'Home Dashboard',
      goals: 'Financial Goals',
      transactions: 'All Transactions',
      analytics: 'Analytics & Insights',
      chat: 'AI Chat Assistant',
      settings: 'Settings'
    };

    document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';
    this.currentSection = sectionName;

    // Handle section-specific initialization
    this.initializeSection(sectionName);
  }

  initializeSection(sectionName) {
    switch (sectionName) {
      case 'analytics':
        setTimeout(() => {
          if (typeof updateCharts === 'function') {
            updateCharts();
          }
        }, 100);
        break;
      
      case 'transactions':
        this.loadAllTransactions();
        break;
      
      case 'chat':
        this.initializeChat();
        break;
      
      case 'goals':
        this.loadGoals();
        break;
    }
  }

  loadAllTransactions() {
    const allList = document.getElementById('allTransactionsList');
    const expensesList = document.getElementById('expensesList');
    const incomesList = document.getElementById('incomesList');

    if (!allList || !expensesList || !incomesList) return;

    // Get all transactions
    const allTransactions = transactions || [];
    
    // Sort by date (newest first)
    const sortedTransactions = [...allTransactions].sort((a, b) => 
      new Date(b.entryDate) - new Date(a.entryDate)
    );

    // Render all transactions
    allList.innerHTML = this.renderTransactionsList(sortedTransactions);

    // Render expenses
    const expenses = sortedTransactions.filter(t => t.type === 'expense');
    expensesList.innerHTML = this.renderTransactionsList(expenses);

    // Render income
    const income = sortedTransactions.filter(t => t.type === 'income');
    incomesList.innerHTML = this.renderTransactionsList(income);
  }

  renderTransactionsList(transactionList) {
    if (transactionList.length === 0) {
      return '<div class="text-center text-gray-500 py-8">No transactions found</div>';
    }

    return transactionList.map(transaction => {
      const date = new Date(transaction.entryDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      const isIncome = transaction.type === 'income';
      const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
      const bgColor = isIncome ? 'bg-green-50' : 'bg-red-50';
      const icon = isIncome ? '💰' : '💸';
      
      return `
        <div class="flex items-center justify-between p-4 ${bgColor} rounded-lg mb-3 hover:shadow-md transition-shadow">
          <div class="flex items-center space-x-3">
            <span class="text-lg">${icon}</span>
            <div>
              <div class="font-medium text-gray-900">${transaction.item}</div>
              <div class="text-sm text-gray-500">${this.getSubcategoryText(transaction.category)} • ${date}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold ${amountColor}">${transaction.amount.toFixed(2)}</div>
            <div class="flex space-x-2 mt-1">
              <button onclick="editTransaction(${transaction.id})" 
                      class="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-100">
                Edit
              </button>
              <button onclick="deleteTransaction(${transaction.id})" 
                      class="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-100">
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  getSubcategoryText(value) {
    const subcategories = {
      income: [
        { value: 'UCO', text: '🏫 UCO' },
        { value: 'GONG', text: '💼 Private' }
      ],
      expense: [
        { value: 'Rent', text: '🏠 Rent' },
        { value: 'Grocery', text: '🛒 Grocery' },
        { value: 'Food', text: '🍕 Food' },
        { value: 'Petrol', text: '⛽ Petrol' },
        { value: 'Home', text: '🏡 Home' },
        { value: 'Gym', text: '💪 Gym' },
        { value: 'Mobile', text: '📱 Mobile' },
        { value: 'Extra', text: '✨ Extra' },
        { value: 'Insurance', text: '🛡️ Insurance' },
        { value: 'Tuition', text: '🎓 Tuition' }
      ]
    };
    
    const allSubcategories = [...subcategories.income, ...subcategories.expense];
    const sub = allSubcategories.find(s => s.value === value);
    return sub ? sub.text : value;
  }

  initializeChat() {
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    
    if (chatInput) {
      chatInput.focus();
    }
    
    // Scroll to bottom if there are messages
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  handleChatMessage(e) {
    e.preventDefault();
    
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message
    this.addChatMessage(message, 'user');
    chatInput.value = '';
    
    // Show typing indicator
    this.addTypingIndicator();
    
    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      this.removeTypingIndicator();
      this.handleAIResponse(message);
    }, 1500);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  addChatMessage(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    
    if (sender === 'user') {
      messageDiv.className = 'flex justify-end';
      messageDiv.innerHTML = `
        <div class="bg-blue-600 text-white p-3 rounded-lg max-w-xs lg:max-w-md">
          <p class="text-sm">${message}</p>
        </div>
      `;
    } else {
      messageDiv.className = 'flex justify-start';
      messageDiv.innerHTML = `
        <div class="bg-gray-100 text-gray-800 p-3 rounded-lg max-w-xs lg:max-w-md">
          <p class="text-sm">${message}</p>
        </div>
      `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'flex justify-start';
    typingDiv.innerHTML = `
      <div class="bg-gray-100 text-gray-800 p-3 rounded-lg">
        <div class="flex space-x-1">
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
      </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  handleAIResponse(userMessage) {
    // Simulate AI responses based on message content
    let response = "I understand you're asking about your finances. ";
    
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('budget') || lowerMessage.includes('spending')) {
      response = "Based on your current spending patterns, I'd recommend focusing on your highest expense categories. Consider setting up alerts when you're approaching budget limits.";
    } else if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
      response = "Great question about savings! Try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. You can also automate transfers to your savings account.";
    } else if (lowerMessage.includes('goal') || lowerMessage.includes('goals')) {
      response = "Setting financial goals is smart! Start with SMART goals - Specific, Measurable, Achievable, Relevant, and Time-bound. Break larger goals into smaller monthly targets.";
    } else if (lowerMessage.includes('expense') || lowerMessage.includes('cost')) {
      response = "To reduce expenses, try tracking every purchase for a week, look for subscription services you don't use, and consider the 24-hour rule before making non-essential purchases.";
    } else {
      response = "I can help you with budgeting advice, expense tracking, savings strategies, and financial goal setting. What specific area would you like to focus on?";
    }
    
    this.addChatMessage(response, 'ai');
  }

  loadGoals() {
    // This would typically load from storage or API
    // For now, it's handled in the HTML template
  }
}

// Transaction tab switching
window.showTransactionTab = function(tabName) {
  // Hide all transaction lists
  document.getElementById('allTransactionsList').style.display = tabName === 'all' ? 'block' : 'none';
  document.getElementById('expensesList').style.display = tabName === 'expenses' ? 'block' : 'none';
  document.getElementById('incomesList').style.display = tabName === 'income' ? 'block' : 'none';
  
  // Update tab buttons
  document.querySelectorAll('[id^="tab-"]').forEach(tab => {
    tab.className = 'flex-1 py-3 px-4 text-center font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent text-sm';
  });
  
  document.getElementById(`tab-${tabName}`).className = 'flex-1 py-3 px-4 text-center font-medium text-blue-600 bg-blue-50 border-b-2 border-blue-600 text-sm';
};

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Wait for auth check first
  setTimeout(() => {
    if (isAuthenticated()) {
      window.navigationManager = new NavigationManager();
    }
  }, 100);
});

// Make navigation functions globally available
window.showSection = (section) => window.navigationManager?.showSection(section);
window.toggleMobileMenu = () => window.navigationManager?.toggleMobileMenu();