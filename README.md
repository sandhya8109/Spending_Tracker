# 💰 Monthly Budget Analyzer  

[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tech](https://img.shields.io/badge/Tech-FastAPI%20%7C%20PyTorch%20%7C%20Tailwind-blue)]()
[![Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)
[![LinkedIn](https://img.shields.io/badge/Showcase-LinkedIn-blue?logo=linkedin)](https://lnkd.in/dEi6nSmv)

A **smart, AI-powered personal finance management application** that helps you track expenses, analyze spending patterns, and make informed financial decisions.  

![Dashboard Screenshot](assets/demo.png) <!-- Replace with your own screenshot -->

---

## ✨ Highlights  

- 🚀 Developed a **smart, AI-powered personal finance application** with seamless UX.  
- 🎨 Built the **frontend** using **HTML, Tailwind CSS, and Vanilla JavaScript**, featuring a responsive UI and interactive **Chart.js** dashboards.  
- 🧠 Engineered an **AI backend** with **FastAPI + PyTorch/Transformers**, integrating multiple intelligent models:  
  - **NLP models** for expense categorization & adaptive pattern learning.  
  - **OCR pipeline** using **Tesseract + OpenCV** for automated receipt scanning & text extraction.  
  - **Time-series forecasting** with **Prophet** and **Statsmodels** to predict monthly spending trends.  
  - **Anomaly detection** via **PyOD** and statistical methods to flag unusual expenses.  
- 🔄 Designed **adaptive learning pipelines** to improve categorization suggestions continuously.  
- 📊 Delivered **AI-driven dashboards** showing savings rates, category breakdowns, predictive alerts, and budget utilization.  
- ☁️ **Deployed on Vercel**, enabling scalability, cross-device accessibility, and smooth **CI/CD workflow**.  

---

## 📊 Features  

### Core Functionality  
- **Transaction Management** – Add, edit, and categorize income & expenses  
- **Visual Analytics** – Interactive charts and graphs for spending visualization  
- **Budget Tracking** – Set and monitor budgets for different categories  
- **Monthly Overview** – Comprehensive financial summaries by month  

### AI-Powered Features  
- **Smart Categorization** – AI suggests categories based on transaction descriptions  
- **Receipt Processing** – Upload or capture receipts for automatic data extraction  
- **Spending Insights** – AI-generated analysis of your financial patterns  
- **Forecasting & Anomaly Detection** – Predictive insights on future spending and unusual expense alerts  
- **Adaptive Learning** – Improves accuracy from user feedback  

---

## 🛠️ Tech Stack  

### Frontend  
- **HTML5**, **Tailwind CSS**, **Vanilla JavaScript**  
- **Chart.js** – Interactive data visualization  

### Backend (AI Services)  
- **FastAPI** – Python backend framework  
- **PyTorch / Transformers** – NLP & AI models  
- **Tesseract + OpenCV** – OCR for receipt scanning  
- **Prophet + Statsmodels** – Time-series forecasting  
- **PyOD** – Anomaly detection  

### Infrastructure  
- **Vercel** – Deployment & hosting  
- **LocalStorage / JSON** – Data persistence & portability  

---

## 🚀 Getting Started  

### Prerequisites  
- Modern web browser (Chrome, Firefox, Safari, Edge)  
- Python 3.x (for backend AI features)  

### Installation  

1. **Clone the repository**
   ```bash
   git clone https://github.com/sandhya8109/monthly-budget-analyzer.git
   cd monthly-budget-analyzer
2. **Frontend Setup** 
# Simply open index.html in your browser
open index.html
# or serve locally
python -m http.server 8080
3.**Backend Setup (Optional - for enhanced AI features)**
cd budget-ai-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # On Windows:.\venv\Scripts\activate
pip install -r requirements.txt

# Start the FastAPI server
python main.py
# Server will run on http://0.0.0.0:8000
Start using

4. Open your browser to index.html or http://localhost:8080

Backend API will be available at http://localhost:8000 (if running)

Begin adding transactions and explore AI features
📖 Usage Guide
Adding Transactions

Fill in the transaction details (item, amount, date)

Select transaction type (income/expense)

Choose or let AI suggest a category

Upload receipt (optional) or use camera feature

Click "Add Entry"

AI Features

Smart Suggestions – Type transaction descriptions to get AI category suggestions

Receipt Scanning – Use "Take Photo of Receipt" for automatic data extraction

Analytics – View AI-generated insights in the Charts tab

Viewing Analytics

Switch to the "Charts" tab to see visual representations

Review AI insights for spending patterns and recommendations

Monitor budget utilization and savings rates

🏗️ Architecture
monthly-budget-analyzer/
├── .venv/                   # Python virtual environment
├── assets/                  # Static assets and resources
├── budget-ai-backend/       # AI backend service
│   ├── __pycache__/        
│   ├── venv/               # Backend virtual environment
│   └── main.py             # FastAPI backend server
├── css/
│   └── styles.css          # Application styling
├── data/
│   └── sample-data.json    # Sample transaction data
├── .gitattributes          # Git configuration
├── ai-integration.js       # AI features and smart categorization
├── app.js                  # Main application logic
├── index.html              # Main application interface
├── README.md               # Project documentation
└── requirements.txt        # Python dependencies

🔧 Configuration
AI Backend (Optional)

The app works offline but can connect to an AI backend for enhanced features:

// Configure AI backend URL in ai-integration.js
const API_BASE_URL = 'http://localhost:8000/api';

Customization

Modify categories in app.js

Adjust AI patterns in ai-integration.js

Customize styling in CSS files

Configure chart options in charts.js

🔗 Project Showcase

Check out the detailed write-up and demo on LinkedIn:
👉 View on LinkedIn

🤝 Contributing

We welcome contributions!

Fork the repository

Create a feature branch

git checkout -b feature/amazing-feature


Commit your changes

git commit -m 'Add amazing feature'


Push to the branch

git push origin feature/amazing-feature


Open a Pull Request

📝 License

This project is licensed under the MIT License – see the LICENSE
 file for details.

🙏 Acknowledgments

Chart.js – Beautiful charts and graphs

Tailwind CSS – Utility-first CSS framework

OpenAI API – AI-powered categorization (optional backend)

Contributors – Thanks to all who have contributed

📞 Support & Contact

Issues: GitHub Issues

Discussions: GitHub Discussions

Email: sandyrimal07@example.com