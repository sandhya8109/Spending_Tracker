# 💰 Monthly Budget Analyzer  

A simple yet powerful **web-based budgeting tool** built with **HTML, JavaScript, and Tailwind CSS**.  
It helps you **track income & expenses**, **analyze budgets by category**, and **stay on top of your financial goals** — all in one place.  

---

## 🚀 Features  

- 📅 **Select a Month** → View & manage budget entries for a specific period.  
- ➕ **Add Transactions** → Add income/expense entries with description, amount, category, subcategory, and date.  
- 🔎 **Smart Filtering** → Automatically shows only the transactions of the selected month.  
- 📊 **Budget Summaries** → View income & expense summaries with budgets, actuals, and remaining balances.  
- ⚡ **Dynamic Budgets** → Adjust budgets on the fly (no zero-value options, increments start at 50).  
- ⏱ **Real-Time Updates** → Totals & balances update instantly as you add entries.  
- ✅ **Validation** → Ensures clean input (e.g., no numbers in item descriptions).  
- 📱 **Responsive UI** → Styled with Tailwind CSS for clean and modern look.  

---

## 📝 How to Use  

1. **Select Month** → Use the month picker at the top.  
2. **Add Entry** → Fill out:  
   - Item description *(no numbers allowed)*  
   - Amount *(positive number)*  
   - Date *(defaults to 1st day of month, must stay within month)*  
   - Category *(Income/Expense)*  
   - Subcategory *(auto-adjusts by category)*  
3. **Submit Entry** → Click **Add Entry** to add to transaction list.  
4. **View Transactions** → See all records in the **All Transactions** table.  
5. **Analyze Budgets** → Review summaries showing earned/spent, budgeted, and remaining balances.  
6. **Adjust Budgets** → Change via dropdowns (increments of 50, no zero budgets).  
7. **Final Summary** → Shows total earned, spent, and balance for the month.  

---

## 📂 Code Structure  

- **HTML** → Layout with forms, tables, and headings.  
- **Tailwind CSS** → For responsive styling (CDN).  
- **JavaScript** → Handles logic:  
  - Transaction storage (in memory).  
  - Input validation & dynamic updates.  
  - Month-based filtering.  
  - Budget summaries & adjustments.  
  - Date synchronization with selected month.  

---

## ⚠️ Important Notes  

- ❌ Item descriptions **cannot contain numbers**.  
- 🚫 Budgets **cannot be zero** (minimum is 50).  
- 📆 Dates default to **first day of selected month**.  
- 💾 Data is **not persistent** (reset on reload).  

---

## 📦 Requirements  

- Modern web browser (with JavaScript enabled).  
- Internet connection (for Tailwind CSS CDN).  

---

## 💡 Customization & Extensions  

- 💾 Add persistent storage (`localStorage` or database).  
- ✏️ Enable **editing & deleting** transactions.  
- 📈 Add **charts/graphs** for visual trends.  
- 💱 Multi-currency support.  
- 🚨 Budget limit warnings/notifications.  

---

## 🔮 Future Backend & Dynamic Analysis  

For advanced insights, add a backend for **persistent data storage** & **analysis**:  

- Use **Python (Pandas, NumPy)** for financial analysis.  
- Create **visual reports** with Matplotlib & Seaborn.  
- Build interactive dashboards with **Streamlit** or **Dash**.  
- Add features like:  
  - Forecasting 💡  
  - Anomaly detection ⚠️  
  - Personalized financial insights 📊  

---



This project is open-source under the **MIT License**.  

