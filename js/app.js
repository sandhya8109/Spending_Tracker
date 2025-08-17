    const subcategories = {
      income: [
        { value: 'UCO', text: 'UCO', budget: 1000 },
        { value: 'GONG', text: 'Private', budget: 1300 }
      ],
      expense: [
        { value: 'Rent', text: 'Rent', budget: 300 },
        { value: 'Grocery', text: 'Grocery', budget: 200 },
        { value: 'Food', text: 'Food', budget: 100 },
        { value: 'Petrol', text: 'Petrol', budget: 120 },
        { value: 'Home', text: 'Home', budget: 250 },
        { value: 'Gym', text: 'Gym', budget: 80 },
        { value: 'Mobile', text: 'Mobile', budget: 60 },
        { value: 'Extra', text: 'Extra', budget: 50 },
        { value: 'Insurance', text: 'Insurance', budget: 150 }
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

    const budgetForm = document.getElementById('budgetForm');
    const incomeTableBody = document.getElementById('incomeTable');
    const expenseTableBody = document.getElementById('expenseTable');
    const transactionTableBody = document.getElementById('transactionTable');
    const categorySelect = document.getElementById('category');
    const subcategorySelect = document.getElementById('subcategory');
    const finalSummary = document.getElementById('finalSummary');
    const monthSelector = document.getElementById('monthSelector');
    const incomeTitle = document.getElementById('incomeTitle');
    const expenseTitle = document.getElementById('expenseTitle');
    const transactionTitle = document.getElementById('transactionTitle');
    const entryDateInput = document.getElementById('entryDate');

    let selectedMonth = monthSelector.value;
    entryDateInput.value = `${selectedMonth}-01`;

    function updateDisplayedMonth() {
      const [year, month] = selectedMonth.split('-');
      const date = new Date(year, month - 1);
      const monthName = date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
      incomeTitle.textContent = `${monthName} Income Summary`;
      expenseTitle.textContent = `${monthName} Expense Summary`;
      transactionTitle.textContent = `All ${monthName} Transactions`;
    }

    function updateSubcategories() {
      const type = categorySelect.value;
      subcategorySelect.innerHTML = '';
      if (!type) return;
      subcategories[type].forEach(sub => {
        let opt = document.createElement('option');
        opt.value = sub.value;
        opt.textContent = sub.text;
        subcategorySelect.appendChild(opt);
      });
      if (subcategorySelect.options.length > 0) {
        subcategorySelect.selectedIndex = 0;
      }
    }

    function getFilteredTransactions() {
      return transactions.filter(t => t.month === selectedMonth);
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

      // Expense Table (first)
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

      // Income Table (second)
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

      // Attach event listeners to budget adjustment selects
      document.querySelectorAll('select.budget-adjust').forEach(select => {
        select.addEventListener('change', function() {
          const type = this.getAttribute('data-type');
          const category = this.getAttribute('data-category');
          const newBudget = parseFloat(this.value);
          if (!isNaN(newBudget)) {
            adjustableBudgets[type][category] = newBudget;
            renderTables();
          }
        });
      });

      // Transactions Table 
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

      const totalEarned = Object.values(incomeSummary).reduce((sum, s) => sum + s.earned, 0);
      const totalSpent = Object.values(expenseSummary).reduce((sum, s) => sum + s.spent, 0);
      const remaining = totalEarned - totalSpent;
      finalSummary.innerHTML = `
        Total Earned: <span class="income text-green-600 font-bold">$${totalEarned.toFixed(2)}</span> &nbsp; | &nbsp;
        Total Expense: <span class="expense text-red-600 font-bold">$${totalSpent.toFixed(2)}</span> &nbsp; | &nbsp;
        Remaining: <span class="font-bold" style="color:${remaining >= 0 ? 'green' : 'red'}">$${remaining.toFixed(2)}</span>
      `;
    }

    function generateBudgetOptions(currentBudget) {
      let options = '';
      // Start from 50 and go up to 2000 by 50 increments (no zero option)
      for (let val = 50; val <= 2000; val += 50) {
        options += `<option value="${val}"${val === Math.round(currentBudget) ? ' selected' : ''}>${val}</option>`;
      }
      // If currentBudget is not in increments of 50 or less than 50, add it so user can see selected budget
      if (currentBudget < 50 || currentBudget % 50 !== 0) {
        options = `<option value="${currentBudget}" selected>${currentBudget}</option>` + options;
      }
      return options;
    }

    budgetForm.addEventListener('submit', e => {
      e.preventDefault();

      const item = document.getElementById('item').value.trim();
      const amount = parseFloat(document.getElementById('amount').value);
      const entryDate = entryDateInput.value;
      const type = categorySelect.value;
      const category = subcategorySelect.value;

      if (!item || /\d/.test(item)) {
        alert('Description must be non-empty and contain no numbers.');
        return;
      }

      if (isNaN(amount) || !type || !category || !entryDate) {
        alert('Please fill all fields correctly.');
        return;
      }

      const monthOfEntry = entryDate.slice(0, 7);

      transactions.push({
        item,
        amount,
        category,
        type,
        month: monthOfEntry,
        entryDate
      });

      renderTables();
      budgetForm.reset();
      updateSubcategories();
      entryDateInput.value = `${selectedMonth}-01`;
    });

    categorySelect.addEventListener('change', updateSubcategories);

    monthSelector.addEventListener('change', () => {
      selectedMonth = monthSelector.value;
      entryDateInput.value = `${selectedMonth}-01`;
      updateDisplayedMonth();
      renderTables();
    });

    // Initial setup
    updateDisplayedMonth();
    updateSubcategories();
    renderTables();
