# Monthly Budget Analyzer

A smart, AI-powered personal finance management application that helps you track expenses, analyze spending patterns, and make informed financial decisions.

## ✨ Features

### 📊 Core Functionality
- **Transaction Management**: Add, edit, and categorize income and expenses
- **Visual Analytics**: Interactive charts and graphs for spending visualization
- **Budget Tracking**: Set and monitor budgets for different categories
- **Monthly Overview**: Comprehensive financial summaries by month

### 🤖 AI-Powered Features
- **Smart Categorization**: AI suggests categories based on transaction descriptions
- **Receipt Processing**: Take photos of receipts for automatic data extraction
- **Spending Insights**: AI-generated analysis of your financial patterns
- **Pattern Learning**: System learns from your categorization preferences

### 📱 User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Intuitive Interface**: Clean, modern design with easy navigation
- **Real-time Updates**: Instant feedback and live calculations
- **Data Persistence**: Local storage ensures your data is saved

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server setup required for basic functionality

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/monthly-budget-analyzer.git
   cd monthly-budget-analyzer
   ```

2. **Frontend Setup**
   ```bash
   # Simply open index.html in your browser
   open index.html
   # or serve locally
   python -m http.server 8080
   ```

3. **Backend Setup (Optional - for enhanced AI features)**
   ```bash
   # Navigate to backend directory
   cd budget-ai-backend
   
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   .\.venv\Scripts\Activate.ps1
   # Install dependencies
   pip install -r requirements.txt
   
   # Start the FastAPI server
   python main.py
   # Server will run on http://0.0.0:8000
   ```

4. **Start using**
   - Open your browser to `index.html` or `http://localhost:8080`
   - Backend API will be available at `http://localhost:8000` (if running)
   - Begin adding transactions and explore AI features

## 📖 Usage Guide

### Adding Transactions
1. Fill in the transaction details (item, amount, date)
2. Select transaction type (income/expense)
3. Choose or let AI suggest a category
4. Upload receipt (optional) or use camera feature
5. Click "Add Entry"

### AI Features
- **Smart Suggestions**: Type transaction descriptions to get AI category suggestions
- **Receipt Scanning**: Use "Take Photo of Receipt" for automatic data extraction
- **Analytics**: View AI-generated insights in the Charts tab

### Viewing Analytics
- Switch to the "Charts" tab to see visual representations
- Review AI insights for spending patterns and recommendations
- Monitor budget utilization and savings rates

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic structure and modern web standards
- **CSS3 & Tailwind** - Responsive design and utility-first styling
- **Vanilla JavaScript** - Core application logic and DOM manipulation
- **Chart.js** - Interactive charts and data visualization

### Backend (Optional)
- **FastAPI** - Modern Python web framework for AI services
- **Python 3.x** - Backend runtime environment
- **Uvicorn** - ASGI server for FastAPI applications
- **AI Libraries** - OCR processing and pattern recognition

### AI Integration
- **Pattern Recognition** - Local categorization algorithms
- **OCR Processing** - Receipt text extraction via backend API
- **Machine Learning** - User behavior learning and adaptation
- **FastAPI Backend** - AI service integration at http://localhost:8000

### Data Storage
- **LocalStorage** - Client-side data persistence
- **JSON Format** - Structured data management
- **Export/Import** - Data portability features

## 🏗️ Architecture

```
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
```

## 🔧 Configuration

### AI Backend (Optional)
The app works offline but can connect to an AI backend for enhanced features:

```javascript
// Configure AI backend URL in ai-integration.js
const API_BASE_URL = 'http://localhost:8000/api';
```

### Customization
- Modify categories in `app.js`
- Adjust AI patterns in `ai-integration.js`
- Customize styling in CSS files
- Configure chart options in `charts.js`

## 📊 AI Features Deep Dive

### Smart Categorization
- **Pattern Matching**: Recognizes common merchant names and keywords
- **User Learning**: Adapts to your categorization preferences
- **Confidence Scoring**: Shows how certain the AI is about suggestions
- **Manual Override**: Easy to accept, reject, or modify suggestions

### Receipt Processing
- **Camera Integration**: Direct photo capture from device camera
- **OCR Extraction**: Automatic text recognition from receipt images
- **Data Parsing**: Intelligent extraction of amount, date, and vendor
- **Form Auto-fill**: Seamless integration with transaction form

### Analytics & Insights
- **Spending Patterns**: Identifies trends and unusual spending
- **Budget Alerts**: Proactive warnings about budget overruns
- **Category Analysis**: Detailed breakdown by spending categories
- **Savings Tracking**: Monitors savings rate and financial health

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and conventions
- Add comments for complex logic
- Test features across different browsers
- Update documentation for new features

## 📝 License


## 🙏 Acknowledgments

- **Chart.js** - Beautiful charts and graphs
- **Tailwind CSS** - Utility-first CSS framework
- **OpenAI API** - AI-powered categorization (optional backend)
- **Contributors** - Thanks to all who have contributed to this project

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/sandhya8109/monthly-budget-analyzer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sandhya8109/monthly-budget-analyzer/discussions)
- **Email**: sandyrimal07@example.com

## 🔮 Roadmap

### Upcoming Features
- [ ] Bank account integration
- [ ] Multi-currency support
- [ ] Advanced AI insights
- [ ] Mobile app development
- [ ] Cloud synchronization
- [ ] Collaborative budgeting
- [ ] Financial goal tracking

### Version History
- **v1.2.0** - AI integration and receipt scanning
- **v1.1.0** - Enhanced analytics and charts
- **v1.0.0** - Initial release with core features

---

**Made with ❤️ for better financial management**

*Star ⭐ this repository if it helps you manage your finances better!*