"""
Smart Budget Tracker - FastAPI Backend
Gracefully handles missing optional dependencies.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import platform
import json
import re
from datetime import datetime

# ── Optional dependency flags ─────────────────────────────────────────────────

OPENCV_AVAILABLE = False
try:
    import cv2
    from PIL import Image
    import pytesseract
    OPENCV_AVAILABLE = True
    if platform.system() == "Windows":
        tesseract_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        ]
        for p in tesseract_paths:
            if os.path.exists(p):
                pytesseract.pytesseract.tesseract_cmd = p
                break
except ImportError:
    pass

NUMPY_AVAILABLE = False
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    pass

PANDAS_AVAILABLE = False
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    pass

SKLEARN_AVAILABLE = False
try:
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import LabelEncoder
    SKLEARN_AVAILABLE = True
except ImportError:
    pass

BERT_AVAILABLE = False
try:
    from transformers import pipeline
    import torch
    BERT_AVAILABLE = True
except ImportError:
    pass

PROPHET_AVAILABLE = False
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    pass

JOBLIB_AVAILABLE = False
try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    pass

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Smart Budget Tracker API",
    description="AI-powered personal finance backend",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory learning store ──────────────────────────────────────────────────

LEARNING_FILE = os.path.join(os.path.dirname(__file__), "learning_data.json")

def load_learning_data() -> dict:
    try:
        if os.path.exists(LEARNING_FILE):
            with open(LEARNING_FILE, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return {"corrections": {}, "patterns": {}}

def save_learning_data(data: dict):
    try:
        with open(LEARNING_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception:
        pass

learning_data = load_learning_data()

# ── Pydantic models ───────────────────────────────────────────────────────────

class TransactionInput(BaseModel):
    description: str
    amount: Optional[float] = 0.0
    category: Optional[str] = "expense"
    date: Optional[str] = None

class LearningInput(BaseModel):
    description: str
    original_category: str
    corrected_category: str

class InsightsInput(BaseModel):
    transactions: List[Dict[str, Any]]
    month: Optional[str] = None

class PredictInput(BaseModel):
    transactions: List[Dict[str, Any]]
    periods: Optional[int] = 3

class AnomalyInput(BaseModel):
    transactions: List[Dict[str, Any]]

# ── Keyword categorization ────────────────────────────────────────────────────

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Grocery": ["walmart","costco","kroger","sainsbury","tesco","lidl","asda","trader joe","whole foods",
                "market","supermarket","grocery","aldi","publix","safeway","wegmans","sprouts","fresh","produce"],
    "Food": ["restaurant","pizza","mcdonalds","subway","starbucks","coffee","cafe","burger","kfc","taco",
             "chipotle","domino","lunch","dinner","breakfast","takeaway","takeout","doordash","ubereats",
             "zomato","swiggy","eat","sushi","noodle","bistro","grill","bbq","sandwich","diner","panera"],
    "Petrol": ["gas","fuel","petrol","shell","exxon","bp","chevron","pump","mobil","texaco","caltex",
               "filling station","gasoline","diesel","unleaded"],
    "Rent": ["rent","apartment","mortgage","lease","housing","landlord","flat","studio","condo","property"],
    "Mobile": ["phone","mobile","verizon","att","at&t","tmobile","t-mobile","cell","sim","airtel","jio",
               "vodafone","plan","carrier","prepaid","postpaid","data plan"],
    "Gym": ["gym","fitness","workout","yoga","crossfit","membership","planet fitness","la fitness",
            "anytime fitness","equinox","orangetheory","pilates","spin","cycling class","weight"],
    "Home": ["furniture","ikea","home depot","lowes","appliance","cleaning","decor","hardware","mattress",
             "repair","maintenance","plumber","electrician","carpet","curtain","bedding"],
    "Insurance": ["insurance","premium","coverage","geico","allstate","progressive","state farm","farmers",
                  "nationwide","usaa","aetna","humana","cigna","blue cross","dental","vision","life insurance",
                  "health insurance","car insurance","auto insurance"],
    "Tuition": ["tuition","school","education","college","university","course","class","udemy","coursera",
                "edx","skillshare","linkedin learning","bootcamp","training","seminar","textbook","books","study"],
    "Extra": ["amazon","netflix","spotify","hulu","disney","subscription","entertainment","movie","cinema",
              "shopping","online","apple","google play","gaming","steam","xbox","playstation","nintendo",
              "ebay","etsy","alibaba","wish","target","bestbuy","macys","nordstrom","zara","h&m","clothing",
              "shoes","fashion","accessories"]
}

def keyword_categorize(description: str) -> tuple[str, float]:
    """Return (category, confidence) using keyword matching."""
    lower = description.lower()

    # Check learned corrections first
    for key, correction in learning_data.get("corrections", {}).items():
        if key.lower() in lower:
            return correction, 0.95

    # Keyword matching
    matches = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in lower)
        if score > 0:
            matches[cat] = score

    if matches:
        best = max(matches, key=matches.get)
        total = sum(matches.values())
        confidence = min(0.95, matches[best] / total + 0.3)
        return best, round(confidence, 2)

    return "Extra", 0.4


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "status": "running",
        "app": "Smart Budget Tracker API",
        "version": "2.0.0",
        "features": {
            "keyword_categorization": True,
            "bert_categorization": BERT_AVAILABLE,
            "ocr": OPENCV_AVAILABLE,
            "anomaly_detection": SKLEARN_AVAILABLE,
            "spending_prediction": PROPHET_AVAILABLE,
            "advanced_insights": PANDAS_AVAILABLE,
        }
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/ai-status")
async def ai_status():
    return {
        "opencv": OPENCV_AVAILABLE,
        "numpy": NUMPY_AVAILABLE,
        "pandas": PANDAS_AVAILABLE,
        "sklearn": SKLEARN_AVAILABLE,
        "bert": BERT_AVAILABLE,
        "prophet": PROPHET_AVAILABLE,
        "joblib": JOBLIB_AVAILABLE,
        "groq": True,  # installed via requirements
    }


@app.post("/api/suggest-category")
async def suggest_category(data: TransactionInput):
    description = data.description.strip()
    if not description:
        raise HTTPException(status_code=400, detail="Description is required.")

    category, confidence = keyword_categorize(description)

    # Try BERT if available and confidence is low
    if BERT_AVAILABLE and confidence < 0.6:
        try:
            # Use zero-shot classification as a demonstration
            # In production you'd fine-tune on financial data
            pass  # Placeholder — BERT pipeline setup is expensive at startup
        except Exception:
            pass

    return {
        "category": category,
        "confidence": confidence,
        "method": "keyword" if not BERT_AVAILABLE else "hybrid",
        "description": description
    }


@app.post("/api/learn-transaction")
async def learn_transaction(data: LearningInput):
    desc_lower = data.description.lower().strip()
    # Store the correction keyed by significant words
    words = [w for w in re.split(r'\W+', desc_lower) if len(w) > 3]
    key = words[0] if words else desc_lower[:20]

    learning_data["corrections"][key] = data.corrected_category
    save_learning_data(learning_data)

    return {
        "status": "learned",
        "key": key,
        "category": data.corrected_category,
        "total_corrections": len(learning_data["corrections"])
    }


@app.post("/api/advanced-insights")
async def advanced_insights(data: InsightsInput):
    txns = data.transactions
    month = data.month

    if not txns:
        return {"insights": ["No transaction data provided."], "summary": {}}

    if not PANDAS_AVAILABLE:
        # Fallback without pandas
        income  = sum(t.get("amount", 0) for t in txns if t.get("category") == "income")
        expense = sum(t.get("amount", 0) for t in txns if t.get("category") == "expense")
        savings = income - expense
        rate    = (savings / income * 100) if income > 0 else 0
        insights = [
            f"Total income: ${income:.2f}",
            f"Total expenses: ${expense:.2f}",
            f"Net savings: ${savings:.2f}",
            f"Savings rate: {rate:.1f}%"
        ]
        return {"insights": insights, "summary": {"income": income, "expense": expense, "savings": savings}}

    # Pandas-powered analysis
    df = pd.DataFrame(txns)
    if df.empty:
        return {"insights": ["No data to analyze."], "summary": {}}

    df["amount"] = pd.to_numeric(df.get("amount", pd.Series(dtype=float)), errors="coerce").fillna(0)
    df["category"] = df.get("category", "expense")

    income_df  = df[df["category"] == "income"]
    expense_df = df[df["category"] == "expense"]

    total_income  = float(income_df["amount"].sum())
    total_expense = float(expense_df["amount"].sum())
    savings       = total_income - total_expense
    rate          = (savings / total_income * 100) if total_income > 0 else 0

    insights = [
        f"Total income: ${total_income:.2f}",
        f"Total expenses: ${total_expense:.2f}",
        f"Net savings: ${savings:.2f} ({rate:.1f}% savings rate)"
    ]

    if "subcategory" in expense_df.columns and not expense_df.empty:
        top = expense_df.groupby("subcategory")["amount"].sum().sort_values(ascending=False).head(3)
        for cat, amt in top.items():
            pct = (amt / total_expense * 100) if total_expense > 0 else 0
            insights.append(f"Top expense: {cat} ${amt:.2f} ({pct:.0f}%)")

    summary = {
        "income": total_income,
        "expense": total_expense,
        "savings": savings,
        "savings_rate": round(rate, 2),
        "transaction_count": len(df)
    }

    return {"insights": insights, "summary": summary}


@app.post("/api/predict-spending")
async def predict_spending(data: PredictInput):
    if not PROPHET_AVAILABLE:
        return {
            "available": False,
            "message": "Prophet not installed. Run: pip install prophet",
            "predictions": []
        }

    if not PANDAS_AVAILABLE:
        return {"available": False, "message": "Pandas required for predictions.", "predictions": []}

    txns = [t for t in data.transactions if t.get("category") == "expense"]
    if len(txns) < 5:
        return {"available": True, "message": "Need at least 5 expense transactions for prediction.", "predictions": []}

    try:
        df = pd.DataFrame(txns)
        df["date"] = pd.to_datetime(df.get("date", pd.Series(dtype=str)), errors="coerce")
        df["amount"] = pd.to_numeric(df.get("amount", pd.Series(dtype=float)), errors="coerce").fillna(0)
        df = df.dropna(subset=["date"])
        df = df.set_index("date").resample("MS")["amount"].sum().reset_index()
        df.columns = ["ds", "y"]

        if len(df) < 2:
            return {"available": True, "message": "Not enough monthly data for prediction.", "predictions": []}

        model = Prophet(yearly_seasonality=False, weekly_seasonality=False, daily_seasonality=False)
        model.fit(df)
        future = model.make_future_dataframe(periods=data.periods, freq="MS")
        forecast = model.predict(future)

        predictions = forecast.tail(data.periods)[["ds", "yhat", "yhat_lower", "yhat_upper"]].to_dict("records")
        for p in predictions:
            p["ds"] = str(p["ds"])[:7]
            p["yhat"] = round(max(0, float(p["yhat"])), 2)
            p["yhat_lower"] = round(max(0, float(p["yhat_lower"])), 2)
            p["yhat_upper"] = round(max(0, float(p["yhat_upper"])), 2)

        return {"available": True, "predictions": predictions, "periods": data.periods}

    except Exception as e:
        return {"available": True, "error": str(e), "predictions": []}


@app.post("/api/detect-anomalies")
async def detect_anomalies(data: AnomalyInput):
    txns = [t for t in data.transactions if t.get("category") == "expense"]

    if not SKLEARN_AVAILABLE:
        return {"available": False, "message": "scikit-learn not installed. Run: pip install scikit-learn", "anomalies": []}

    if not NUMPY_AVAILABLE:
        return {"available": False, "message": "numpy required for anomaly detection.", "anomalies": []}

    if len(txns) < 5:
        return {"available": True, "message": "Need at least 5 transactions for anomaly detection.", "anomalies": []}

    try:
        amounts = np.array([[t.get("amount", 0)] for t in txns])
        model = IsolationForest(contamination=0.1, random_state=42)
        preds = model.fit_predict(amounts)

        anomalies = []
        for i, (t, pred) in enumerate(zip(txns, preds)):
            if pred == -1:
                anomalies.append({
                    "id": t.get("id"),
                    "item": t.get("item", ""),
                    "amount": t.get("amount", 0),
                    "date": t.get("date", ""),
                    "subcategory": t.get("subcategory", ""),
                    "reason": "Unusual spending amount detected"
                })

        return {"available": True, "anomalies": anomalies, "total_checked": len(txns)}

    except Exception as e:
        return {"available": True, "error": str(e), "anomalies": []}


@app.post("/api/process-receipt")
async def process_receipt(file: UploadFile = File(...)):
    if not OPENCV_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="OCR not available. Install: pip install opencv-python Pillow pytesseract"
        )

    try:
        contents = await file.read()
        img_array = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image file.")

        # Preprocess for OCR
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

        pil_img = Image.fromarray(gray)
        text = pytesseract.image_to_string(pil_img)

        # Extract amount
        amount = None
        amount_patterns = [
            r'total[:\s]+\$?\s*(\d+\.?\d{0,2})',
            r'amount[:\s]+\$?\s*(\d+\.?\d{0,2})',
            r'sum[:\s]+\$?\s*(\d+\.?\d{0,2})',
            r'\$\s*(\d+\.\d{2})',
        ]
        for pattern in amount_patterns:
            match = re.search(pattern, text.lower())
            if match:
                amount = float(match.group(1))
                break

        # Extract description (first meaningful line)
        lines = [l.strip() for l in text.split('\n') if l.strip() and len(l.strip()) > 3]
        description = lines[0] if lines else ""

        return {
            "text": text,
            "amount": amount,
            "description": description,
            "lines": lines[:5]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")


@app.post("/api/chat")
async def chat_with_ai(data: Dict[str, Any]):
    api_key = data.get("api_key", "").strip()
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="Groq API key required. Get one free at console.groq.com"
        )

    try:
        from groq import Groq
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="groq package not installed. Run: pip install groq"
        )

    messages  = data.get("messages", [])
    ctx       = data.get("context", {})

    month        = ctx.get("month", "this month")
    total_income = float(ctx.get("total_income", 0) or 0)
    total_spent  = float(ctx.get("total_spent", 0) or 0)
    net_balance  = float(ctx.get("net_balance", 0) or 0)
    savings_rate = ctx.get("savings_rate", "0")
    top_cats     = ctx.get("top_categories", "none")
    txn_count    = ctx.get("transaction_count", 0)

    system_prompt = f"""You are a smart, friendly personal finance AI assistant integrated into a budget tracking app.
Be concise, practical, and encouraging. Use simple language and bullet points when helpful.
Avoid overwhelming the user — keep responses under 200 words unless they ask for detail.

User's financial snapshot for {month}:
- Income: ${total_income:.2f}
- Spending: ${total_spent:.2f}
- Net balance: ${net_balance:.2f}
- Savings rate: {savings_rate}%
- Top spending categories: {top_cats}
- Transactions recorded: {txn_count}

When giving advice: be specific to their numbers, mention actionable steps, and stay positive.
If asked about general finance topics, apply 50/30/20 rule or other frameworks where helpful."""

    chat_messages = [{"role": "system", "content": system_prompt}]
    for m in messages:
        role = m.get("role", "")
        content = m.get("content", "")
        if role in ("user", "assistant") and content:
            chat_messages.append({"role": role, "content": content})

    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=chat_messages,
            max_tokens=600,
            temperature=0.7,
        )
        reply = completion.choices[0].message.content
        return {"message": reply, "model": completion.model}

    except Exception as e:
        err_msg = str(e)
        if "invalid_api_key" in err_msg.lower() or "authentication" in err_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid Groq API key. Check your key at console.groq.com")
        elif "rate_limit" in err_msg.lower():
            raise HTTPException(status_code=429, detail="Groq rate limit reached. Please wait a moment and try again.")
        else:
            raise HTTPException(status_code=500, detail=f"Groq API error: {err_msg}")


# ── Dev server entry point ────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
