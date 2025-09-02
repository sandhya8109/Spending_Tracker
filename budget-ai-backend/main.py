from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import re
import uvicorn
import cv2
import numpy as np
from PIL import Image
from datetime import datetime, timedelta
import base64
import io
import pytesseract
import json
import platform

# Advanced ML imports
from transformers import pipeline, AutoTokenizer, AutoModel
import torch
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import joblib
from prophet import Prophet
import warnings
warnings.filterwarnings('ignore')

# Auto-detect Tesseract installation
if platform.system() == "Windows":
    possible_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"C:\Users\{}\AppData\Local\Programs\Tesseract-OCR\tesseract.exe".format(os.getenv('USERNAME'))
    ]
    for path in possible_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            break

app = FastAPI(title="Enhanced AI Budget Tracker", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enhanced Pydantic Models
class TransactionInput(BaseModel):
    item: str
    amount: float
    type: str
    category: Optional[str] = None
    entryDate: str
    user_id: Optional[str] = "default"

class AdvancedInsight(BaseModel):
    type: str
    priority: str
    title: str
    message: str
    confidence: float
    data: Optional[Dict[str, Any]] = None
    recommendation: Optional[str] = None

class SpendingPrediction(BaseModel):
    predicted_amount: float
    confidence_interval: Dict[str, float]
    trend: str
    seasonality: Optional[Dict[str, Any]] = None
    factors: List[str]

class AnomalyDetection(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    similar_transactions: List[Dict[str, Any]]
    explanation: str

# Advanced AI Components
class AdvancedCategorizer:
    def __init__(self):
        # Initialize BERT for semantic understanding
        try:
            self.tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
            self.model = AutoModel.from_pretrained('bert-base-uncased')
            self.bert_available = True
            print("✅ BERT model loaded successfully")
        except Exception as e:
            print(f"⚠️ BERT not available: {e}")
            self.bert_available = False
        
        # Enhanced category mappings with semantic understanding
        self.category_embeddings = {}
        self.expense_categories = {
            'Rent': {
                'keywords': ['rent', 'apartment', 'house payment', 'mortgage', 'housing', 'lease', 'property'],
                'semantic_context': ['monthly housing cost', 'residential payment', 'accommodation fee']
            },
            'Grocery': {
                'keywords': ['grocery', 'supermarket', 'walmart', 'costco', 'food shopping', 'kroger', 'safeway'],
                'semantic_context': ['food shopping', 'household supplies', 'daily necessities']
            },
            'Food': {
                'keywords': ['restaurant', 'pizza', 'mcdonalds', 'subway', 'starbucks', 'coffee', 'lunch', 'dinner'],
                'semantic_context': ['dining out', 'takeaway meal', 'restaurant bill', 'food delivery']
            },
            'Petrol': {
                'keywords': ['gas', 'fuel', 'petrol', 'shell', 'exxon', 'bp', 'chevron', 'gasoline'],
                'semantic_context': ['vehicle fuel', 'gas station', 'transportation cost']
            },
            'Home': {
                'keywords': ['furniture', 'home depot', 'ikea', 'home improvement', 'appliances', 'cleaning'],
                'semantic_context': ['home improvement', 'household items', 'furniture purchase']
            },
            'Gym': {
                'keywords': ['gym', 'fitness', 'planet fitness', 'membership', 'workout', 'yoga'],
                'semantic_context': ['fitness membership', 'exercise facility', 'health club']
            },
            'Mobile': {
                'keywords': ['phone', 'mobile', 'verizon', 'att', 'tmobile', 'cell phone'],
                'semantic_context': ['phone bill', 'mobile service', 'telecommunications']
            },
            'Extra': {
                'keywords': ['entertainment', 'movie', 'shopping', 'amazon', 'miscellaneous'],
                'semantic_context': ['miscellaneous expense', 'entertainment cost', 'other purchases']
            },
            'Insurance': {
                'keywords': ['insurance', 'health insurance', 'car insurance', 'life insurance'],
                'semantic_context': ['insurance premium', 'coverage payment', 'protection plan']
            },
            'Tuition': {
                'keywords': ['tuition', 'school', 'education', 'college', 'university', 'course'],
                'semantic_context': ['educational fee', 'academic payment', 'learning cost']
            }
        }
        
        # Initialize TF-IDF vectorizer for text similarity
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        # Load or initialize transaction history for learning
        self.transaction_history = []
        self.load_learning_data()

    def get_bert_embedding(self, text):
        """Get BERT embedding for text"""
        if not self.bert_available:
            return None
        
        try:
            inputs = self.tokenizer(text, return_tensors='pt', truncation=True, padding=True, max_length=128)
            with torch.no_grad():
                outputs = self.model(**inputs)
                embedding = outputs.last_hidden_state.mean(dim=1).squeeze().numpy()
            return embedding
        except Exception as e:
            print(f"BERT embedding error: {e}")
            return None

    def advanced_categorize(self, item_description: str, amount: float = None, transaction_type: str = "expense") -> Dict:
        """Advanced categorization using multiple AI techniques"""
        
        # Traditional keyword matching
        keyword_result = self.keyword_categorize(item_description, transaction_type)
        
        # Semantic similarity using BERT
        if self.bert_available:
            semantic_result = self.semantic_categorize(item_description, transaction_type)
            
            # Combine results with weighted scoring
            if semantic_result and keyword_result:
                combined_confidence = (keyword_result['confidence'] * 0.4 + semantic_result['confidence'] * 0.6)
                if semantic_result['confidence'] > keyword_result['confidence']:
                    result = semantic_result
                    result['confidence'] = combined_confidence
                    result['reasoning'] += f" + {keyword_result['reasoning']}"
                else:
                    result = keyword_result
                    result['confidence'] = combined_confidence
                    result['reasoning'] += f" + {semantic_result['reasoning']}"
            else:
                result = semantic_result or keyword_result
        else:
            result = keyword_result
        
        # Historical pattern matching
        if self.transaction_history:
            historical_match = self.find_historical_patterns(item_description, amount)
            if historical_match and historical_match['confidence'] > result['confidence']:
                result = historical_match
        
        # Anomaly detection for amount
        if amount:
            anomaly_info = self.detect_amount_anomaly(result['category'], amount)
            if anomaly_info['is_anomaly']:
                result['anomaly_detected'] = True
                result['anomaly_score'] = anomaly_info['anomaly_score']
        
        return result

    def semantic_categorize(self, item_description: str, transaction_type: str) -> Dict:
        """Categorize using semantic similarity with BERT embeddings"""
        if not self.bert_available:
            return None
        
        item_embedding = self.get_bert_embedding(item_description)
        if item_embedding is None:
            return None
        
        categories = self.expense_categories if transaction_type == 'expense' else {}
        best_match = None
        highest_similarity = 0
        
        for category, info in categories.items():
            # Create embeddings for semantic context
            for context in info['semantic_context']:
                context_embedding = self.get_bert_embedding(context)
                if context_embedding is not None:
                    similarity = cosine_similarity([item_embedding], [context_embedding])[0][0]
                    if similarity > highest_similarity:
                        highest_similarity = similarity
                        best_match = category
        
        if best_match and highest_similarity > 0.3:
            return {
                'category': best_match,
                'confidence': min(highest_similarity, 0.95),
                'reasoning': f'Semantic similarity match (BERT): {highest_similarity:.2f}'
            }
        
        return None

    def keyword_categorize(self, item_description: str, transaction_type: str) -> Dict:
        """Enhanced keyword-based categorization"""
        item_lower = item_description.lower().strip()
        categories = self.expense_categories if transaction_type == 'expense' else {}
        
        category_scores = {}
        
        for category, info in categories.items():
            score = 0
            matched_keywords = []
            
            for keyword in info['keywords']:
                if keyword in item_lower:
                    score += len(keyword) * 2
                    matched_keywords.append(keyword)
                elif any(word in item_lower for word in keyword.split()):
                    score += 1
                    matched_keywords.append(keyword)
            
            if score > 0:
                category_scores[category] = {
                    'score': score,
                    'matched_keywords': matched_keywords
                }
        
        if category_scores:
            best_category = max(category_scores.keys(), key=lambda x: category_scores[x]['score'])
            confidence = min(category_scores[best_category]['score'] * 0.1, 0.8)
            
            return {
                'category': best_category,
                'confidence': confidence,
                'reasoning': f"Keyword match: {', '.join(category_scores[best_category]['matched_keywords'][:3])}"
            }
        
        return {
            'category': 'Extra',
            'confidence': 0.2,
            'reasoning': 'No keywords matched, using default'
        }

    def find_historical_patterns(self, item_description: str, amount: float = None) -> Optional[Dict]:
        """Find similar transactions in history"""
        if not self.transaction_history:
            return None
        
        # Create TF-IDF vectors for similarity comparison
        descriptions = [t['item'] for t in self.transaction_history] + [item_description]
        
        try:
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(descriptions)
            similarities = cosine_similarity(tfidf_matrix[-1:], tfidf_matrix[:-1]).flatten()
            
            # Find most similar transaction
            max_similarity_idx = similarities.argmax()
            max_similarity = similarities[max_similarity_idx]
            
            if max_similarity > 0.5:  # Threshold for similarity
                similar_transaction = self.transaction_history[max_similarity_idx]
                return {
                    'category': similar_transaction['category'],
                    'confidence': min(max_similarity, 0.9),
                    'reasoning': f'Similar to previous transaction: {similar_transaction["item"]} (similarity: {max_similarity:.2f})'
                }
        except Exception as e:
            print(f"Historical pattern matching error: {e}")
        
        return None

    def detect_amount_anomaly(self, category: str, amount: float) -> Dict:
        """Detect if the amount is anomalous for the category"""
        category_amounts = [t['amount'] for t in self.transaction_history if t.get('category') == category]
        
        if len(category_amounts) < 5:  # Need at least 5 data points
            return {'is_anomaly': False, 'anomaly_score': 0}
        
        # Use Isolation Forest for anomaly detection
        try:
            amounts_array = np.array(category_amounts + [amount]).reshape(-1, 1)
            iso_forest = IsolationForest(contamination=0.1, random_state=42)
            anomaly_scores = iso_forest.fit_predict(amounts_array)
            
            is_anomaly = anomaly_scores[-1] == -1
            anomaly_score = iso_forest.decision_function(amounts_array)[-1]
            
            return {
                'is_anomaly': is_anomaly,
                'anomaly_score': float(anomaly_score),
                'explanation': f'Amount ${amount:.2f} is {"unusual" if is_anomaly else "normal"} for {category} category'
            }
        except Exception as e:
            print(f"Anomaly detection error: {e}")
            return {'is_anomaly': False, 'anomaly_score': 0}

    def learn_from_transaction(self, transaction: Dict):
        """Learn from new transactions to improve categorization"""
        self.transaction_history.append({
            'item': transaction.get('item', ''),
            'amount': transaction.get('amount', 0),
            'category': transaction.get('category', ''),
            'type': transaction.get('type', ''),
            'date': transaction.get('entryDate', '')
        })
        
        # Keep only recent transactions (last 1000)
        if len(self.transaction_history) > 1000:
            self.transaction_history = self.transaction_history[-1000:]
        
        # Save learning data
        self.save_learning_data()

    def save_learning_data(self):
        """Save learning data to file"""
        try:
            with open('learning_data.json', 'w') as f:
                json.dump(self.transaction_history, f)
        except Exception as e:
            print(f"Error saving learning data: {e}")

    def load_learning_data(self):
        """Load learning data from file"""
        try:
            if os.path.exists('learning_data.json'):
                with open('learning_data.json', 'r') as f:
                    self.transaction_history = json.load(f)
                print(f"Loaded {len(self.transaction_history)} transactions for learning")
        except Exception as e:
            print(f"Error loading learning data: {e}")

# Time Series Prediction Engine
class SpendingPredictor:
    def __init__(self):
        self.models = {}
        
    def prepare_time_series_data(self, transactions: List[Dict], category: str = None) -> pd.DataFrame:
        """Prepare transaction data for time series analysis"""
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['entryDate'])
        
        if category:
            df = df[df['category'] == category]
        
        # Aggregate by day
        daily_spending = df.groupby(df['date'].dt.date)['amount'].sum().reset_index()
        daily_spending.columns = ['ds', 'y']
        daily_spending['ds'] = pd.to_datetime(daily_spending['ds'])
        
        return daily_spending

    def predict_spending(self, transactions: List[Dict], category: str = None, days_ahead: int = 30) -> Dict:
        """Predict future spending using Prophet"""
        try:
            df = self.prepare_time_series_data(transactions, category)
            
            if len(df) < 10:  # Need sufficient data
                return {
                    'predicted_amount': 0,
                    'confidence_interval': {'lower': 0, 'upper': 0},
                    'trend': 'insufficient_data',
                    'factors': ['Need more historical data for accurate predictions']
                }
            
            # Initialize and fit Prophet model
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                changepoint_prior_scale=0.05
            )
            
            model.fit(df)
            
            # Make future predictions
            future = model.make_future_dataframe(periods=days_ahead)
            forecast = model.predict(future)
            
            # Get prediction for the period
            future_predictions = forecast.tail(days_ahead)
            total_predicted = future_predictions['yhat'].sum()
            confidence_lower = future_predictions['yhat_lower'].sum()
            confidence_upper = future_predictions['yhat_upper'].sum()
            
            # Analyze trend
            recent_trend = forecast['trend'].tail(10).mean()
            earlier_trend = forecast['trend'].head(10).mean()
            trend_direction = 'increasing' if recent_trend > earlier_trend else 'decreasing'
            
            return {
                'predicted_amount': max(0, total_predicted),
                'confidence_interval': {
                    'lower': max(0, confidence_lower),
                    'upper': max(0, confidence_upper)
                },
                'trend': trend_direction,
                'seasonality': {
                    'weekly': forecast['weekly'].tail(7).mean(),
                    'yearly': forecast['yearly'].tail(1).iloc[0] if 'yearly' in forecast.columns else 0
                },
                'factors': [
                    f'Historical average: ${df["y"].mean():.2f}/day',
                    f'Trend: {trend_direction}',
                    f'Prediction confidence: {((confidence_upper - confidence_lower) / total_predicted * 100):.1f}% range'
                ]
            }
            
        except Exception as e:
            print(f"Prediction error: {e}")
            return {
                'predicted_amount': 0,
                'confidence_interval': {'lower': 0, 'upper': 0},
                'trend': 'error',
                'factors': [f'Prediction failed: {str(e)}']
            }

# Advanced Insights Engine
class InsightsEngine:
    def __init__(self):
        self.predictor = SpendingPredictor()
        
    def generate_advanced_insights(self, transactions: List[Dict], budgets: Dict = None) -> List[Dict]:
        """Generate advanced AI-powered insights"""
        insights = []
        
        if not transactions:
            return [{
                'type': 'info',
                'priority': 'low',
                'title': 'Getting Started',
                'message': 'Add transactions to unlock AI-powered insights',
                'confidence': 1.0
            }]
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['entryDate'])
        df['month'] = df['date'].dt.to_period('M')
        
        # Spending pattern analysis
        insights.extend(self.analyze_spending_patterns(df))
        
        # Anomaly detection
        insights.extend(self.detect_spending_anomalies(df))
        
        # Seasonal analysis
        insights.extend(self.analyze_seasonality(df))
        
        # Budget optimization
        if budgets:
            insights.extend(self.optimize_budgets(df, budgets))
        
        # Predictive insights
        insights.extend(self.generate_predictive_insights(transactions))
        
        # Sort by priority and confidence
        priority_order = {'high': 3, 'medium': 2, 'low': 1}
        insights.sort(key=lambda x: (priority_order.get(x['priority'], 0), x.get('confidence', 0)), reverse=True)
        
        return insights[:10]  # Return top 10 insights

    def analyze_spending_patterns(self, df: pd.DataFrame) -> List[Dict]:
        """Analyze spending patterns using clustering"""
        insights = []
        
        try:
            # Analyze spending by day of week
            df['day_of_week'] = df['date'].dt.day_name()
            daily_spending = df.groupby('day_of_week')['amount'].mean()
            
            highest_day = daily_spending.idxmax()
            highest_amount = daily_spending.max()
            
            insights.append({
                'type': 'info',
                'priority': 'medium',
                'title': 'Spending Pattern',
                'message': f'You spend most on {highest_day}s (avg: ${highest_amount:.2f})',
                'confidence': 0.8,
                'data': daily_spending.to_dict()
            })
            
            # Analyze category distribution
            category_spending = df.groupby('category')['amount'].sum().sort_values(ascending=False)
            if len(category_spending) > 1:
                top_category = category_spending.index[0]
                top_amount = category_spending.iloc[0]
                total_spending = category_spending.sum()
                percentage = (top_amount / total_spending) * 100
                
                if percentage > 50:
                    insights.append({
                        'type': 'warning',
                        'priority': 'high',
                        'title': 'Spending Concentration',
                        'message': f'{top_category} dominates your spending ({percentage:.1f}% of total)',
                        'confidence': 0.9,
                        'recommendation': 'Consider diversifying your expenses or reviewing this category'
                    })
            
        except Exception as e:
            print(f"Pattern analysis error: {e}")
        
        return insights

    def detect_spending_anomalies(self, df: pd.DataFrame) -> List[Dict]:
        """Detect spending anomalies using machine learning"""
        insights = []
        
        try:
            if len(df) < 10:
                return insights
            
            # Use Isolation Forest for anomaly detection
            features = df[['amount']].values
            iso_forest = IsolationForest(contamination=0.1, random_state=42)
            anomalies = iso_forest.fit_predict(features)
            
            anomaly_transactions = df[anomalies == -1]
            
            if len(anomaly_transactions) > 0:
                for _, transaction in anomaly_transactions.head(3).iterrows():  # Top 3 anomalies
                    insights.append({
                        'type': 'warning',
                        'priority': 'medium',
                        'title': 'Unusual Spending Detected',
                        'message': f'${transaction["amount"]:.2f} for {transaction["item"]} is unusual for you',
                        'confidence': 0.7,
                        'data': {
                            'transaction': transaction.to_dict(),
                            'typical_range': f'${df["amount"].quantile(0.25):.2f} - ${df["amount"].quantile(0.75):.2f}'
                        }
                    })
                    
        except Exception as e:
            print(f"Anomaly detection error: {e}")
        
        return insights

    def analyze_seasonality(self, df: pd.DataFrame) -> List[Dict]:
        """Analyze seasonal spending patterns"""
        insights = []
        
        try:
            if len(df) < 30:  # Need at least a month of data
                return insights
            
            # Monthly spending analysis
            monthly_spending = df.groupby(df['date'].dt.month)['amount'].mean()
            
            if len(monthly_spending) > 3:
                highest_month = monthly_spending.idxmax()
                lowest_month = monthly_spending.idxmin()
                
                month_names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                
                insights.append({
                    'type': 'info',
                    'priority': 'medium',
                    'title': 'Seasonal Pattern',
                    'message': f'You typically spend more in {month_names[highest_month]} and less in {month_names[lowest_month]}',
                    'confidence': 0.7,
                    'data': monthly_spending.to_dict()
                })
                
        except Exception as e:
            print(f"Seasonality analysis error: {e}")
        
        return insights

    def optimize_budgets(self, df: pd.DataFrame, budgets: Dict) -> List[Dict]:
        """Optimize budgets using historical data"""
        insights = []
        
        try:
            expense_budgets = budgets.get('expense', {})
            
            for category, budget in expense_budgets.items():
                category_data = df[df['category'] == category]
                
                if len(category_data) > 5:  # Need sufficient data
                    avg_spending = category_data['amount'].mean()
                    std_spending = category_data['amount'].std()
                    
                    # Recommend budget adjustment
                    recommended_budget = avg_spending + (2 * std_spending)  # 95% confidence interval
                    
                    if recommended_budget > budget * 1.2:
                        insights.append({
                            'type': 'suggestion',
                            'priority': 'medium',
                            'title': f'{category} Budget Optimization',
                            'message': f'Consider increasing budget from ${budget} to ${recommended_budget:.2f}',
                            'confidence': 0.8,
                            'recommendation': f'Based on spending pattern: avg ${avg_spending:.2f} ± ${std_spending:.2f}'
                        })
                    elif recommended_budget < budget * 0.8:
                        insights.append({
                            'type': 'success',
                            'priority': 'low',
                            'title': f'{category} Budget Opportunity',
                            'message': f'You could reduce budget from ${budget} to ${recommended_budget:.2f}',
                            'confidence': 0.7,
                            'recommendation': 'Free up budget for other categories'
                        })
                        
        except Exception as e:
            print(f"Budget optimization error: {e}")
        
        return insights

    def generate_predictive_insights(self, transactions: List[Dict]) -> List[Dict]:
        """Generate predictive insights"""
        insights = []
        
        try:
            # Overall spending prediction
            prediction = self.predictor.predict_spending(transactions, days_ahead=30)
            
            if prediction['predicted_amount'] > 0:
                insights.append({
                    'type': 'prediction',
                    'priority': 'high',
                    'title': 'Next 30-Day Prediction',
                    'message': f'Predicted spending: ${prediction["predicted_amount"]:.2f} (trend: {prediction["trend"]})',
                    'confidence': 0.7,
                    'data': prediction
                })
                
        except Exception as e:
            print(f"Predictive insights error: {e}")
        
        return insights

# Initialize AI components
categorizer = AdvancedCategorizer()
insights_engine = InsightsEngine()

# Enhanced API Endpoints
@app.get("/")
async def root():
    return {
        "message": "Enhanced AI Budget Tracker API",
        "version": "2.0.0",
        "features": [
            "advanced_categorization_with_bert",
            "anomaly_detection",
            "spending_predictions",
            "pattern_recognition",
            "budget_optimization",
            "semantic_understanding"
        ],
        "ai_status": {
            "bert_available": categorizer.bert_available,
            "learning_data": len(categorizer.transaction_history)
        }
    }

@app.post("/api/suggest-category")
async def suggest_category(transaction: TransactionInput):
    """Enhanced category suggestion with AI"""
    try:
        result = categorizer.advanced_categorize(
            transaction.item,
            transaction.amount,
            transaction.type
        )
        
        return {
            "suggested_category": result['category'],
            "confidence": result['confidence'],
            "reasoning": result['reasoning'],
            "anomaly_detected": result.get('anomaly_detected', False),
            "anomaly_score": result.get('anomaly_score', 0)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enhanced categorization failed: {str(e)}")

@app.post("/api/learn-transaction")
async def learn_transaction(transaction: TransactionInput):
    """Learn from user corrections"""
    try:
        categorizer.learn_from_transaction({
            'item': transaction.item,
            'amount': transaction.amount,
            'category': transaction.category,
            'type': transaction.type,
            'entryDate': transaction.entryDate
        })
        
        return {
            "message": "Learning updated successfully",
            "total_learned_transactions": len(categorizer.transaction_history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Learning failed: {str(e)}")

@app.post("/api/advanced-insights")
async def generate_insights(data: Dict[str, Any]):
    """Generate advanced AI insights"""
    try:
        transactions = data.get('transactions', [])
        budgets = data.get('budgets', {})
        
        insights = insights_engine.generate_advanced_insights(transactions, budgets)
        
        return {
            "insights": insights,
            "generated_at": datetime.now().isoformat(),
            "total_insights": len(insights)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insights generation failed: {str(e)}")

@app.post("/api/predict-spending")
async def predict_spending(data: Dict[str, Any]):
    """Predict future spending"""
    try:
        transactions = data.get('transactions', [])
        category = data.get('category', None)
        days_ahead = data.get('days_ahead', 30)
        
        prediction = insights_engine.predictor.predict_spending(
            transactions, category, days_ahead
        )
        
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/api/detect-anomalies")
async def detect_anomalies(data: Dict[str, Any]):
    """Detect spending anomalies"""
    try:
        transactions = data.get('transactions', [])
        
        if not transactions:
            return {"anomalies": [], "message": "No transactions to analyze"}
        
        df = pd.DataFrame(transactions)
        insights = insights_engine.detect_spending_anomalies(df)
        
        return {
            "anomalies": insights,
            "total_transactions_analyzed": len(transactions),
            "anomaly_count": len([i for i in insights if i['type'] == 'warning'])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")

@app.get("/api/ai-status")
async def ai_status():
    """Get AI system status"""
    return {
        "bert_available": categorizer.bert_available,
        "learning_data_size": len(categorizer.transaction_history),
        "models_loaded": {
            "categorizer": True,
            "insights_engine": True,
            "predictor": True
        },
        "features": {
            "semantic_categorization": categorizer.bert_available,
            "anomaly_detection": True,
            "time_series_prediction": True,
            "pattern_recognition": True,
            "budget_optimization": True
        }
    }

# Enhanced OCR with better preprocessing
class EnhancedReceiptProcessor:
    def __init__(self):
        # Initialize with better patterns and preprocessing
        self.amount_patterns = [
        r'TOTAL[:\s]*\$?\s*(\d+\.\d{2})',
        r'AMOUNT[:\s]*\$?\s*(\d+\.\d{2})',
        r'SUBTOTAL[:\s]*\$?\s*(\d+\.\d{2})',
        r'\$\s*(\d+\.\d{2})',
        r'(\d+\.\d{2})'
]

        self.date_patterns = [
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',
            r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^\d]*(\d{1,2})[^\d]*(\d{4})',
            r'(\d{1,2})[^\d]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^\d]+(\d{4})'
        ]
        
        # Enhanced vendor detection with category mapping
        self.vendor_categories = {
            'walmart': 'Grocery', 'kroger': 'Grocery', 'safeway': 'Grocery',
            'costco': 'Grocery', 'target': 'Grocery', 'whole foods': 'Grocery',
            'mcdonalds': 'Food', 'subway': 'Food', 'starbucks': 'Food',
            'burger king': 'Food', 'kfc': 'Food', 'taco bell': 'Food',
            'dominos': 'Food', 'pizza hut': 'Food',
            'shell': 'Petrol', 'exxon': 'Petrol', 'bp': 'Petrol',
            'chevron': 'Petrol', 'mobil': 'Petrol', 'texaco': 'Petrol',
            'home depot': 'Home', 'lowes': 'Home', 'ikea': 'Home',
            'planet fitness': 'Gym', 'la fitness': 'Gym', 'gold gym': 'Gym'
        }

    def advanced_preprocess(self, image_array):
        """Advanced image preprocessing for better OCR"""
        try:
            # Convert to grayscale
            if len(image_array.shape) == 3:
                gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
            else:
                gray = image_array
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            enhanced = clahe.apply(gray)
            
            # Noise reduction using bilateral filter
            denoised = cv2.bilateralFilter(enhanced, 9, 75, 75)
            
            # Morphological operations to clean up text
            kernel = np.ones((1,1), np.uint8)
            processed = cv2.morphologyEx(denoised, cv2.MORPH_CLOSE, kernel)
            
            # Adaptive thresholding
            binary = cv2.adaptiveThreshold(
                processed, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 11, 2
            )
            
            # Scale up for better OCR recognition
            height, width = binary.shape
            if width < 1200:
                scale_factor = 1200 / width
                new_width = int(width * scale_factor)
                new_height = int(height * scale_factor)
                binary = cv2.resize(binary, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
            
            return binary
            
        except Exception as e:
            print(f"Advanced preprocessing error: {e}")
            return image_array

    def extract_with_confidence(self, image_array):
        """Extract text with confidence scores"""
        try:
            processed_image = self.advanced_preprocess(image_array)
            
            # Multiple OCR configurations for different text types
            configs = [
                r'--oem 3 --psm 6',  # Uniform block of text
                r'--oem 3 --psm 8',  # Single word
                r'--oem 3 --psm 7',  # Single text line
                r'--oem 3 --psm 11', # Sparse text
            ]
            
            best_result = ""
            best_confidence = 0
            
            for config in configs:
                try:
                    # Get detailed OCR data with confidence
                    data = pytesseract.image_to_data(
                        processed_image, 
                        config=config, 
                        output_type=pytesseract.Output.DICT
                    )
                    
                    # Calculate average confidence
                    confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
                    if confidences:
                        avg_confidence = sum(confidences) / len(confidences)
                        if avg_confidence > best_confidence:
                            best_confidence = avg_confidence
                            best_result = pytesseract.image_to_string(processed_image, config=config)
                    
                except Exception as e:
                    print(f"OCR config error: {e}")
                    continue
            
            return best_result.strip(), best_confidence / 100.0
            
        except Exception as e:
            print(f"OCR extraction error: {e}")
            return "", 0.0

    def smart_parse_receipt(self, text, confidence):
        """Smart parsing with AI-enhanced extraction"""
        result = {
            'vendor': None,
            'amount': None,
            'date': None,
            'raw_text': text,
            'confidence': confidence * 0.3,  # Base confidence from OCR
            'suggested_category': 'Extra'
        }
        
        # Enhanced amount extraction
        amount = self.extract_best_amount(text)
        if amount:
            result['amount'] = amount
            result['confidence'] += 0.4
        
        # Enhanced date extraction
        date = self.extract_best_date(text)
        if date:
            result['date'] = date
            result['confidence'] += 0.2
        
        # Enhanced vendor extraction with AI categorization
        vendor_info = self.extract_smart_vendor(text)
        if vendor_info:
            result['vendor'] = vendor_info['name']
            result['suggested_category'] = vendor_info['category']
            result['confidence'] += 0.3
            
            # Use the enhanced categorizer for better suggestions
            try:
                ai_suggestion = categorizer.advanced_categorize(vendor_info['name'], amount or 0, 'expense')
                if ai_suggestion['confidence'] > 0.5:
                    result['suggested_category'] = ai_suggestion['category']
                    result['confidence'] = max(result['confidence'], ai_suggestion['confidence'])
            except:
                pass
        
        return result

    def extract_best_amount(self, text):
        """Enhanced amount extraction with context awareness"""
        lines = text.split('\n')
        amount_candidates = []
        
        for i, line in enumerate(lines):
            line_lower = line.lower()
            
            for pattern in self.amount_patterns:
                matches = re.findall(pattern, line, re.IGNORECASE)
                for match in matches:
                    try:
                        amount = float(match)
                        
                        # Score based on context
                        score = 0
                        
                        # Higher score for total/amount keywords
                        if any(keyword in line_lower for keyword in ['total', 'amount', 'due', 'balance']):
                            score += 20
                        
                        # Higher score for end of receipt
                        if i >= len(lines) * 0.7:
                            score += 10
                        
                        # Reasonable amount range
                        if 1 <= amount <= 10000:
                            score += 5
                        
                        # Not a tiny amount (likely not total)
                        if amount > 0.5:
                            score += 3
                        
                        amount_candidates.append((amount, score, line))
                        
                    except ValueError:
                        continue
        
        if amount_candidates:
            # Sort by score and return highest
            amount_candidates.sort(key=lambda x: x[1], reverse=True)
            return amount_candidates[0][0]
        
        return None

    def extract_best_date(self, text):
        """Enhanced date extraction with multiple formats"""
        for pattern in self.date_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                date_str = match.group()
                
                # Try to parse with multiple formats
                date_formats = [
                    '%m/%d/%Y', '%m-%d-%Y', '%Y/%m/%d', '%Y-%m-%d',
                    '%m/%d/%y', '%m-%d-%y', '%y/%m/%d', '%y-%m-%d',
                    '%b %d %Y', '%B %d %Y', '%d %b %Y', '%d %B %Y',
                    '%b %d, %Y', '%B %d, %Y'
                ]
                
                for fmt in date_formats:
                    try:
                        # Clean up the date string
                        clean_date = re.sub(r'[^\w\s/\-,]', '', date_str)
                        parsed_date = datetime.strptime(clean_date.strip(), fmt)
                        
                        # Validate date is reasonable (not too far in future/past)
                        today = datetime.now()
                        if (today - timedelta(days=365*2)) <= parsed_date <= (today + timedelta(days=30)):
                            return parsed_date.strftime('%Y-%m-%d')
                    except ValueError:
                        continue
        
        return None

    def extract_smart_vendor(self, text):
        """Smart vendor extraction with AI enhancement"""
        text_lower = text.lower()
        
        # Check known vendors first
        for vendor, category in self.vendor_categories.items():
            if vendor in text_lower:
                return {
                    'name': vendor.title(),
                    'category': category
                }
        
        # Extract potential vendor from first few lines
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        for line in lines[:5]:  # Check first 5 lines
            # Clean line of special characters and numbers
            clean_line = re.sub(r'[^\w\s]', ' ', line).strip()
            clean_line = re.sub(r'\b\d+\b', '', clean_line).strip()
            
            # Check if it looks like a business name
            if (3 <= len(clean_line) <= 30 and 
                not clean_line.lower() in ['receipt', 'store', 'customer', 'thank you'] and
                len(clean_line.split()) <= 4):
                
                # Try to categorize using keywords
                line_lower = clean_line.lower()
                if any(word in line_lower for word in ['market', 'grocery', 'food', 'mart']):
                    category = 'Grocery'
                elif any(word in line_lower for word in ['gas', 'fuel', 'station']):
                    category = 'Petrol'
                elif any(word in line_lower for word in ['restaurant', 'cafe', 'grill', 'kitchen']):
                    category = 'Food'
                elif any(word in line_lower for word in ['fitness', 'gym', 'health']):
                    category = 'Gym'
                else:
                    category = 'Extra'
                
                return {
                    'name': clean_line.title(),
                    'category': category
                }
        
        return None

# Initialize enhanced OCR processor
enhanced_ocr = EnhancedReceiptProcessor()

# Updated OCR endpoints
@app.post("/api/process-receipt")
async def process_receipt_enhanced(file: UploadFile = File(...)):
    """Enhanced receipt processing with better AI"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        image_data = await file.read()
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Enhanced OCR extraction
        text, ocr_confidence = enhanced_ocr.extract_with_confidence(image)
        
        if not text:
            return {
                "success": False,
                "message": "No text found in image",
                "data": None
            }
        
        # Smart parsing with AI
        receipt_data = enhanced_ocr.smart_parse_receipt(text, ocr_confidence)
        
        return {
            "success": True,
            "message": "Receipt processed with enhanced AI",
            "data": {
                "vendor": receipt_data.get('vendor', ''),
                "amount": receipt_data.get('amount', 0),
                "date": receipt_data.get('date', ''),
                "suggested_category": receipt_data.get('suggested_category', 'Extra'),
                "confidence": receipt_data.get('confidence', 0),
                "ocr_confidence": ocr_confidence,
                "raw_text": receipt_data.get('raw_text', '')[:300] + "..." if len(receipt_data.get('raw_text', '')) > 300 else receipt_data.get('raw_text', '')
            }
        }
        
    except Exception as e:
        print(f"Enhanced receipt processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing receipt: {str(e)}")

# Background task for model training
@app.post("/api/retrain-models")
async def retrain_models(background_tasks: BackgroundTasks):
    """Retrain AI models with accumulated data"""
    
    def retrain():
        try:
            print("Starting model retraining...")
            
            # Retrain categorization model if enough data
            if len(categorizer.transaction_history) > 100:
                # Update TF-IDF vectorizer with new data
                descriptions = [t['item'] for t in categorizer.transaction_history]
                categorizer.tfidf_vectorizer.fit(descriptions)
                
                # Save updated vectorizer
                with open('tfidf_vectorizer.pkl', 'wb') as f:
                    pickle.dump(categorizer.tfidf_vectorizer, f)
            
            print("Model retraining completed")
            
        except Exception as e:
            print(f"Retraining error: {e}")
    
    background_tasks.add_task(retrain)
    
    return {
        "message": "Model retraining started in background",
        "estimated_time": "2-3 minutes",
        "data_points": len(categorizer.transaction_history)
    }

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Comprehensive health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "categorizer": "operational",
            "insights_engine": "operational",
            "ocr_processor": "operational",
            "bert_model": "operational" if categorizer.bert_available else "offline",
            "learning_data": f"{len(categorizer.transaction_history)} transactions"
        },
        "memory_usage": {
            "learning_data_size": len(categorizer.transaction_history),
            "models_loaded": 4 if categorizer.bert_available else 3
        }
    }

if __name__ == "__main__":
    print("Starting Enhanced AI Budget Tracker Backend...")
    print("Available features:")
    print("- BERT-based semantic categorization")
    print("- Anomaly detection with Isolation Forest")
    print("- Time series prediction with Prophet")
    print("- Advanced OCR with confidence scoring")
    print("- Pattern recognition and learning")
    print("- Budget optimization recommendations")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=False,
        log_level="info"
    )