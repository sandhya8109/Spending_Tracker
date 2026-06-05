// Smart Budget Tracker - AI Integration (Groq Chat)
// Focused solely on Groq chat — categorization is handled in app.js

const GroqChat = {
  history: [],

  getApiKey() {
    return localStorage.getItem('groqApiKey') || '';
  },

  saveApiKey(key) {
    if (key && key.trim()) {
      localStorage.setItem('groqApiKey', key.trim());
    } else {
      localStorage.removeItem('groqApiKey');
    }
  },

  getFinancialContext() {
    try {
      const month     = typeof selectedMonth !== 'undefined' ? selectedMonth : new Date().toISOString().substring(0, 7);
      const allTxns   = typeof transactions !== 'undefined' ? transactions : [];
      const budgets   = typeof adjustableBudgets !== 'undefined' ? adjustableBudgets : {};

      const monthTxns = allTxns.filter(t => (t.month || t.date?.substring(0, 7)) === month);
      const totalIncome  = monthTxns.filter(t => t.category === 'income').reduce((s, t) => s + t.amount, 0);
      const totalSpent   = monthTxns.filter(t => t.category === 'expense').reduce((s, t) => s + t.amount, 0);
      const netBalance   = totalIncome - totalSpent;

      // Top categories
      const catSpend = {};
      monthTxns.filter(t => t.category === 'expense').forEach(t => {
        catSpend[t.subcategory] = (catSpend[t.subcategory] || 0) + t.amount;
      });
      const topCategories = Object.entries(catSpend)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, v]) => `${k}:$${v.toFixed(2)}`);

      return {
        month,
        total_income:  totalIncome,
        total_spent:   totalSpent,
        net_balance:   netBalance,
        savings_rate:  totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : '0',
        transaction_count: monthTxns.length,
        top_categories: topCategories.join(', ') || 'none',
        all_time_transactions: allTxns.length
      };
    } catch (e) {
      return {};
    }
  },

  addMessage(role, content) {
    this.history.push({ role, content });
    this.renderMessage(role, content);
  },

  renderMessage(role, content) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'flex ' + (role === 'user' ? 'justify-end' : 'justify-start');

    const bubble = document.createElement('div');
    bubble.className = role === 'user' ? 'chat-bubble-user px-3 py-2' : 'chat-bubble-ai px-3 py-2';
    // Render simple line breaks
    bubble.innerHTML = content.replace(/\n/g, '<br>');

    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  renderTyping() {
    const container = document.getElementById('chatMessages');
    if (!container) return null;

    const div = document.createElement('div');
    div.className = 'flex justify-start';
    div.id = 'typingIndicator';

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble-ai px-3 py-2 flex items-center gap-1';
    bubble.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';

    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  },

  async send(userMessage) {
    if (!userMessage || !userMessage.trim()) return;

    const apiKey = this.getApiKey();
    const sendBtn = document.getElementById('chatSendBtn');
    const inputEl = document.getElementById('chatInput');

    if (sendBtn) sendBtn.disabled = true;
    if (inputEl) inputEl.disabled = true;

    // Show user message
    this.addMessage('user', userMessage);
    this.history.push({ role: 'user', content: userMessage }); // ensure in history for send

    // Show typing
    const typingEl = this.renderTyping();

    try {
      const ctx = this.getFinancialContext();
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          messages: this.history.slice(-20), // last 20 messages for context
          context: ctx
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (typingEl) typingEl.remove();

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err.detail || 'Sorry, I encountered an error. Please try again.';
        this.renderMessage('assistant', '❌ ' + msg);
        return;
      }

      const data = await resp.json();
      const reply = data.message || 'No response received.';
      this.addMessage('assistant', reply);

    } catch (e) {
      if (typingEl) typingEl.remove();
      if (e.name === 'AbortError') {
        this.renderMessage('assistant', '⏱️ Request timed out. Please check your connection and try again.');
      } else if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
        this.renderMessage('assistant', '🔌 Backend server is not running. Start it with: `cd budget-ai-backend && uvicorn main:app --reload`');
      } else {
        this.renderMessage('assistant', '❌ Error: ' + e.message);
      }
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      if (inputEl) { inputEl.disabled = false; inputEl.focus(); }
    }
  }
};

// ── Global functions ──────────────────────────────────────────────────────────

window.toggleAIChat = function() {
  const panel  = document.getElementById('aiChatPanel');
  const notice = document.getElementById('chatApiKeyNotice');
  if (!panel) return;

  const isHidden = panel.classList.contains('hidden');
  if (isHidden) {
    panel.classList.remove('hidden');
    panel.style.display = 'flex';

    // Show key notice if no key set
    if (notice) {
      if (!GroqChat.getApiKey()) {
        notice.classList.remove('hidden');
      } else {
        notice.classList.add('hidden');
      }
    }

    // Focus input
    const input = document.getElementById('chatInput');
    if (input) setTimeout(() => input.focus(), 100);
  } else {
    panel.classList.add('hidden');
    panel.style.display = '';
  }
};

window.sendChatMessage = async function() {
  const inputEl = document.getElementById('chatInput');
  if (!inputEl) return;

  const message = inputEl.value.trim();
  if (!message) return;

  inputEl.value = '';

  await GroqChat.send(message);
};

window.saveGroqApiKey = function() {
  const keyInput = document.getElementById('groqApiKey');
  if (!keyInput) return;

  const key = keyInput.value.trim();
  if (!key) {
    if (typeof showNotification === 'function') {
      showNotification('Please enter your Groq API key.', 'error');
    }
    return;
  }

  if (!key.startsWith('gsk_')) {
    if (typeof showNotification === 'function') {
      showNotification('Groq API keys start with "gsk_". Please double-check.', 'warning');
    }
    // Still save — user might know better
  }

  GroqChat.saveApiKey(key);

  // Mask the input
  keyInput.value = key.substring(0, 8) + '•'.repeat(Math.max(0, key.length - 8));

  // Hide notice if chat panel is open
  const notice = document.getElementById('chatApiKeyNotice');
  if (notice) notice.classList.add('hidden');

  if (typeof showNotification === 'function') {
    showNotification('Groq API key saved! AI chat is ready.', 'success');
  }
};

// ── DOMContentLoaded: prefill key if exists ───────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const existingKey = GroqChat.getApiKey();
  if (existingKey) {
    const keyInput = document.getElementById('groqApiKey');
    if (keyInput) {
      keyInput.value = existingKey.substring(0, 8) + '•'.repeat(Math.max(0, existingKey.length - 8));
    }
  }
});

// Export
window.GroqChat = GroqChat;
