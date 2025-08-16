Monthly Budget Analyzer - README
Overview
The Monthly Budget Analyzer is a web-based budgeting tool built with HTML, JavaScript, and styled with Tailwind CSS. It allows users to input and track their monthly income and expenses, view detailed transaction histories, and analyze budget summaries by category and subcategory. Users can select the month to analyze and adjust budgets dynamically to fit their financial goals.

Features
Select a month to view and manage budget entries for that period.

Add income or expense entries with description, amount, category, subcategory, and date.

Automatically filter and display transactions belonging to the selected month.

View summary tables for income and expenses with actual amounts, budgets, and remaining amounts.

Adjust budgets on the fly through dropdown selectors without zero-value options.

Real-time update of totals and remaining balance.

Validation for entry inputs, such as disallowing numbers in item descriptions.

Responsive layout styled with Tailwind CSS for clean UI and UX.

How to Use
Select Month: Use the month picker at the top to choose the month you want to track or analyze.

Add Entry: Fill out the form including:

Item description (no numbers allowed)

Amount (positive number)

Date (defaults to the first day of the selected month but can be adjusted within that month)

Category (Income or Expense)

Subcategory (changes dynamically based on category)

Submit Entry: Press the "Add Entry" button to add the transaction to the list and update summaries.

View Transactions: All transactions for the selected month appear in the "All Transactions" table.

Analyze Budgets: Review your Income and Expense summaries showing amounts earned/spent, budgeted amounts, and remaining balances.

Adjust Budgets: Use the dropdowns in the summary tables to increase or decrease budgets in increments starting at 50 (no zero budgets).

See Final Summary: The total earned, total spent, and remaining balance for the month are shown at the bottom.

Code Structure
HTML: The markup provides a structured layout with input forms, tables, and headings.

Tailwind CSS: Used for styling the form, tables, buttons, and layout with responsive utility classes.

JavaScript:

Defines subcategories and budgets for income and expenses.

Manages the transactions array saving all entries.

Handles dynamic form updates and validation.

Filters transactions based on the selected month.

Renders tables for transactions, income summary, and expense summary.

Enables budget adjustment without zero options, starting from 50.

Updates dates in form according to selected month to ensure logical input.

Important Notes
Item descriptions must not contain numbers.

Budget dropdowns do not include zero as an option to avoid zero budgets.

Entry date defaults to the first day of the currently selected month but can be changed manually.

The tool is client-side only; data is not persisted beyond page reload.

Requirements
Modern web browser with JavaScript enabled.

Internet connection to load Tailwind CSS CDN.

Customization and Extension Ideas
Add persistent storage (e.g., localStorage or backend database).

Enable editing and deleting of existing transactions.

Add charts or graphs for visual spending trends.

Allow for multiple currencies or advanced categorization.

Include notifications or budget limit warnings.

Future Backend Integration and Dynamic Analysis
For a fully dynamic and advanced analysis, consider adding a backend to store all the budget and transaction data persistently. This backend can expose APIs to retrieve and manipulate data. With such a setup, you can leverage Python’s powerful data science libraries like Pandas and NumPy for data processing, and Matplotlib and Seaborn for visualization. This will allow creating dynamic dashboards that analyze your income and expenditure trends, budget adherence, category breakdowns, and more. Dashboard frameworks like Streamlit or Dash can be used to create interactive, real-time visualizations based on your data.

This architecture enables:

Secure and persistent data storage.

Advanced and customizable data analysis.

Insightful visualizations and reporting.

Potential for forecasting, anomaly detection, and other ML-powered features.
