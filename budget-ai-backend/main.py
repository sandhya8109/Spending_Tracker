from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
import re
import uvicorn
import cv2
import numpy as np
import re
from PIL import Image
from fastapi import UploadFile, File
import base64
import io
import cv2
import pytesseract
from datetime import datetime 

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

image = cv2.imread(r"C:\Users\artha\Desktop\IMG_4705.jpeg")
text = pytesseract.image_to_string(image)
print(text)

# 1️⃣ Define FastAPI app first
app = FastAPI(title="AI Budget Tracker API", version="1.0.0")

# 2️⃣ Optional favicon route
@app.get("/favicon.ico")
def favicon():
    return FileResponse(os.path.join("static", "favicon.ico"))
# Initialize FastAPI app
app = FastAPI(title="AI Budget Tracker API", version="1.0.0")
# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class TransactionInput(BaseModel):
    item: str
    amount: float
    type: str  # "income" or "expense"
    category: Optional[str] = None
    entryDate: str

class CategorySuggestion(BaseModel):
    suggested_category: str
    confidence: float
    reasoning: str

class TransactionWithSuggestion(BaseModel):
    item: str
    amount: float
    type: str
    suggested_category: str
    confidence: float
    reasoning: str
    entryDate: str

# AI Categorization Engine
class SmartCategorizer:
    def __init__(self):
        # Category mappings based on your existing categories
        self.expense_categories = {
            'Rent': ['rent', 'apartment', 'house payment', 'mortgage', 'housing'],
            'Grocery': ['grocery', 'supermarket', 'walmart', 'costco', 'food shopping', 'kroger', 'safeway'],
            'Food': ['restaurant', 'pizza', 'mcdonalds', 'subway', 'starbucks', 'coffee', 'lunch', 'dinner', 'cafe'],
            'Petrol': ['gas', 'fuel', 'petrol', 'shell', 'exxon', 'bp', 'chevron', 'gasoline'],
            'Home': ['furniture', 'home depot', 'ikea', 'home improvement', 'appliances', 'cleaning supplies'],
            'Gym': ['gym', 'fitness', 'planet fitness', 'membership', 'workout', 'yoga'],
            'Mobile': ['phone', 'mobile', 'verizon', 'att', 'tmobile', 'cell phone', 'smartphone'],
            'Extra': ['entertainment', 'movie', 'shopping', 'amazon', 'miscellaneous'],
            'Insurance': ['insurance', 'health insurance', 'car insurance', 'life insurance'],
            'Tuition': ['tuition', 'school', 'education', 'college', 'university', 'course']
        }
        
        self.income_categories = {
            'UCO': ['uco', 'university', 'school payment', 'student payment'],
            'GONG': ['gong', 'private', 'freelance', 'consulting', 'work', 'job']
        }
        
    def categorize_expense(self, item_description: str) -> Dict:
        """Categorize expense based on item description"""
        item_lower = item_description.lower().strip()
        
        # Score each category
        category_scores = {}
        
        for category, keywords in self.expense_categories.items():
            score = 0
            matched_keywords = []
            
            for keyword in keywords:
                if keyword in item_lower:
                    score += len(keyword) * 2  # Longer matches get higher scores
                    matched_keywords.append(keyword)
                elif any(word in item_lower for word in keyword.split()):
                    score += 1  # Partial matches get lower scores
                    matched_keywords.append(keyword)
            
            if score > 0:
                category_scores[category] = {
                    'score': score,
                    'matched_keywords': matched_keywords
                }
        
        # Special pattern matching
        patterns = {
            'Petrol': [r'\$?\d+\.\d{2}.*gas', r'shell|exxon|bp|chevron'],
            'Food': [r'(restaurant|cafe|coffee|pizza)', r'(lunch|dinner|breakfast)'],
            'Grocery': [r'(grocery|supermarket)', r'(walmart|costco|kroger)'],
            'Mobile': [r'(phone|mobile).*bill', r'(verizon|att|tmobile)']
        }
        
        for category, pattern_list in patterns.items():
            for pattern in pattern_list:
                if re.search(pattern, item_lower, re.IGNORECASE):
                    if category in category_scores:
                        category_scores[category]['score'] += 3
                    else:
                        category_scores[category] = {
                            'score': 3,
                            'matched_keywords': ['pattern_match']
                        }
        
        # Return best match
        if category_scores:
            best_category = max(category_scores.keys(), 
                              key=lambda x: category_scores[x]['score'])
            confidence = min(category_scores[best_category]['score'] * 0.15, 0.95)
            
            return {
                'category': best_category,
                'confidence': confidence,
                'reasoning': f"Matched keywords: {', '.join(category_scores[best_category]['matched_keywords'][:3])}"
            }
        
        return {
            'category': 'Extra',
            'confidence': 0.3,
            'reasoning': 'No specific keywords matched, defaulting to Extra category'
        }
    
    def categorize_income(self, item_description: str) -> Dict:
        """Categorize income based on item description"""
        item_lower = item_description.lower().strip()
        
        # Check for UCO-related keywords
        uco_keywords = ['uco', 'university', 'school', 'student', 'academic']
        if any(keyword in item_lower for keyword in uco_keywords):
            return {
                'category': 'UCO',
                'confidence': 0.8,
                'reasoning': 'University/school-related income detected'
            }
        
        # Check for private/freelance work
        private_keywords = ['private', 'freelance', 'consulting', 'contract', 'gig', 'side hustle']
        if any(keyword in item_lower for keyword in private_keywords):
            return {
                'category': 'GONG',
                'confidence': 0.8,
                'reasoning': 'Private/freelance work detected'
            }
        
        # Default to GONG for other income
        return {
            'category': 'GONG',
            'confidence': 0.4,
            'reasoning': 'General income, categorized as private'
        }
    
    def suggest_category(self, item_description: str, transaction_type: str) -> Dict:
        """Main method to suggest category for any transaction"""
        if transaction_type.lower() == 'expense':
            return self.categorize_expense(item_description)
        elif transaction_type.lower() == 'income':
            return self.categorize_income(item_description)
        else:
            raise ValueError("Transaction type must be 'income' or 'expense'")

# Initialize the categorizer
categorizer = SmartCategorizer()
# Receipt OCR Processor Class
class ReceiptProcessor:
    def __init__(self):
        # Common receipt patterns
        self.amount_patterns = [
            r'\$\s*(\d+\.\d{2})',
            r'TOTAL[:\s]*\$?\s*(\d+\.\d{2})',
            r'AMOUNT[:\s]*\$?\s*(\d+\.\d{2})',
            r'(\d+\.\d{2})\s*$'
        ]
        
        self.date_patterns = [
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',
            r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}',
            r'(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})'
        ]
        
        # Common vendor patterns
        self.vendor_keywords = {
            'Grocery': ['walmart', 'kroger', 'safeway', 'publix', 'whole foods', 'costco', 'target'],
            'Food': ['mcdonalds', 'subway', 'starbucks', 'pizza', 'burger', 'kfc', 'taco bell'],
            'Petrol': ['shell', 'exxon', 'bp', 'chevron', 'mobil', 'texaco', 'speedway'],
            'Home': ['home depot', 'lowes', 'ikea', 'ace hardware'],
            'Gym': ['planet fitness', 'la fitness', 'gold\'s gym', '24 hour fitness']
        }
    
    def preprocess_image(self, image_array):
        """Preprocess image for better OCR results"""
        try:
            # Convert to grayscale
            if len(image_array.shape) == 3:
                gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
            else:
                gray = image_array
            
            # Apply threshold to get a binary image
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Denoise
            denoised = cv2.medianBlur(binary, 3)
            
            # Scale image for better OCR
            height, width = denoised.shape
            if width < 1000:
                scale_factor = 1000 / width
                new_width = int(width * scale_factor)
                new_height = int(height * scale_factor)
                denoised = cv2.resize(denoised, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
            
            return denoised
        
        except Exception as e:
            print(f"Image preprocessing error: {e}")
            return image_array
    
    def extract_text_from_image(self, image_array):
        """Extract text from image using OCR"""
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image_array)
            
            # OCR configuration for receipts
            custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/$:-'
            
            # Extract text
            text = pytesseract.image_to_string(processed_image, config=custom_config)
            
            return text.strip()
        
        except Exception as e:
            print(f"OCR extraction error: {e}")
            return ""
    
    def parse_receipt_data(self, text):
        """Parse extracted text to find receipt information"""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        result = {
            'vendor': None,
            'amount': None,
            'date': None,
            'raw_text': text,
            'confidence': 0.0
        }
        
        # Extract amount
        amount = self.extract_amount(text)
        if amount:
            result['amount'] = amount
            result['confidence'] += 0.4
        
        # Extract date
        date = self.extract_date(text)
        if date:
            result['date'] = date
            result['confidence'] += 0.3
        
        # Extract vendor and categorize
        vendor_info = self.extract_vendor(text)
        if vendor_info:
            result['vendor'] = vendor_info['name']
            result['suggested_category'] = vendor_info['category']
            result['confidence'] += 0.3
        
        return result
    
    def extract_amount(self, text):
        """Extract total amount from receipt text"""
        lines = text.split('\n')
        
        # Look for amounts, prioritizing those near "TOTAL" or at the end
        amounts = []
        
        for i, line in enumerate(lines):
            line_lower = line.lower()
            
            for pattern in self.amount_patterns:
                matches = re.findall(pattern, line, re.IGNORECASE)
                for match in matches:
                    amount = float(match)
                    
                    # Score based on context
                    score = 0
                    if 'total' in line_lower:
                        score += 10
                    if 'amount' in line_lower:
                        score += 8
                    if i >= len(lines) - 3:  # Near end of receipt
                        score += 5
                    if amount > 1:  # Reasonable amount
                        score += 2
                    
                    amounts.append((amount, score))
        
        if amounts:
            # Return highest scoring amount
            amounts.sort(key=lambda x: x[1], reverse=True)
            return amounts[0][0]
        
        return None
    
    def extract_date(self, text):
        """Extract date from receipt text"""
        for pattern in self.date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                date_str = matches[0] if isinstance(matches[0], str) else matches[0][0]
                
                # Try to parse the date
                try:
                    # Handle different date formats
                    date_formats = ['%m/%d/%Y', '%m-%d-%Y', '%Y/%m/%d', '%Y-%m-%d', '%m/%d/%y', '%m-%d-%y']
                    
                    for fmt in date_formats:
                        try:
                            parsed_date = datetime.strptime(date_str, fmt)
                            return parsed_date.strftime('%Y-%m-%d')
                        except ValueError:
                            continue
                    
                    # Handle named month formats
                    month_formats = ['%b %d, %Y', '%B %d, %Y', '%d %b %Y', '%d %B %Y']
                    for fmt in month_formats:
                        try:
                            parsed_date = datetime.strptime(date_str, fmt)
                            return parsed_date.strftime('%Y-%m-%d')
                        except ValueError:
                            continue
                            
                except Exception as e:
                    print(f"Date parsing error: {e}")
                    continue
        
        return None
    
    def extract_vendor(self, text):
        """Extract vendor name and suggest category"""
        text_lower = text.lower()
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        # Check against known vendors
        for category, vendors in self.vendor_keywords.items():
            for vendor in vendors:
                if vendor.lower() in text_lower:
                    return {
                        'name': vendor.title(),
                        'category': category
                    }
        
        # If no known vendor, try to extract the first meaningful line as vendor
        for line in lines[:5]:  # Check first 5 lines
            line_clean = re.sub(r'[^a-zA-Z\s]', '', line).strip()
            if len(line_clean) > 3 and len(line_clean) < 30:
                # This might be the vendor name
                return {
                    'name': line_clean.title(),
                    'category': 'Extra'  # Default category
                }
        
        return None

# Initialize OCR processor

receipt_processor = ReceiptProcessor()
@app.post("/api/process-receipt")
async def process_receipt(file: UploadFile = File(...)):
    """
    Process a receipt image and extract transaction data
    """
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image file
        image_data = await file.read()
        
        # Convert to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Extract text using OCR
        text = receipt_processor.extract_text_from_image(image)
        
        if not text:
            return {
                "success": False,
                "message": "No text found in image",
                "data": None
            }
        
        # Parse receipt data
        receipt_data = receipt_processor.parse_receipt_data(text)
        
        # Get category suggestion if vendor found
        suggested_category = None
        if receipt_data.get('suggested_category'):
            suggested_category = receipt_data['suggested_category']
        elif receipt_data.get('vendor'):
            # Use the existing categorizer
            try:
                suggestion = categorizer.suggest_category(
                    receipt_data['vendor'], 
                    'expense'
                )
                suggested_category = suggestion['category']
            except:
                suggested_category = 'Extra'
        
        return {
            "success": True,
            "message": "Receipt processed successfully",
            "data": {
                "vendor": receipt_data.get('vendor', ''),
                "amount": receipt_data.get('amount', 0),
                "date": receipt_data.get('date', ''),
                "suggested_category": suggested_category,
                "confidence": receipt_data.get('confidence', 0),
                "raw_text": receipt_data.get('raw_text', ''),
                "extracted_lines": len(text.split('\n')) if text else 0
            }
        }
        
    except Exception as e:
        print(f"Receipt processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing receipt: {str(e)}")

@app.post("/api/process-receipt-base64")
async def process_receipt_base64(image_data: dict):
    """
    Process a receipt from base64 image data (for camera capture)
    """
    try:
        # Decode base64 image
        base64_string = image_data.get('image', '').split(',')[1]  # Remove data:image/jpeg;base64, prefix
        image_bytes = base64.b64decode(base64_string)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Extract text using OCR
        text = receipt_processor.extract_text_from_image(image)
        
        if not text:
            return {
                "success": False,
                "message": "No text found in image",
                "data": None
            }
        
        # Parse receipt data
        receipt_data = receipt_processor.parse_receipt_data(text)
        
        # Get category suggestion
        suggested_category = receipt_data.get('suggested_category', 'Extra')
        
        return {
            "success": True,
            "message": "Receipt processed successfully",
            "data": {
                "vendor": receipt_data.get('vendor', ''),
                "amount": receipt_data.get('amount', 0),
                "date": receipt_data.get('date', ''),
                "suggested_category": suggested_category,
                "confidence": receipt_data.get('confidence', 0),
                "raw_text": receipt_data.get('raw_text', '')[:200] + "..." if len(receipt_data.get('raw_text', '')) > 200 else receipt_data.get('raw_text', '')
            }
        }
        
    except Exception as e:
        print(f"Base64 receipt processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing receipt: {str(e)}")

# Test endpoint for OCR
@app.get("/api/test-ocr")
async def test_ocr():
    """Test OCR functionality"""
    return {
        "message": "OCR service is ready",
        "supported_formats": ["jpg", "jpeg", "png", "bmp"],
        "features": ["text_extraction", "amount_detection", "date_detection", "vendor_recognition"],
        "tip": "Upload a clear receipt image for best results"
    }
# API Endpoints
@app.get("/")
async def root():
    return {
        "message": "AI Budget Tracker API", 
        "version": "1.0.0",
        "features": ["auto-categorization", "smart-insights"]
    }

@app.post("/api/suggest-category", response_model=CategorySuggestion)
async def suggest_category(transaction: TransactionInput):
    """
    Suggest a category for a transaction based on the item description
    """
    try:
        result = categorizer.suggest_category(transaction.item, transaction.type)
        
        return CategorySuggestion(
            suggested_category=result['category'],
            confidence=result['confidence'],
            reasoning=result['reasoning']
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error categorizing transaction: {str(e)}")

@app.post("/api/process-transaction", response_model=TransactionWithSuggestion)
async def process_transaction(transaction: TransactionInput):
    """
    Process a complete transaction with AI categorization
    """
    try:
        # Get category suggestion
        category_result = categorizer.suggest_category(transaction.item, transaction.type)
        
        return TransactionWithSuggestion(
            item=transaction.item,
            amount=transaction.amount,
            type=transaction.type,
            suggested_category=category_result['category'],
            confidence=category_result['confidence'],
            reasoning=category_result['reasoning'],
            entryDate=transaction.entryDate
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing transaction: {str(e)}")

@app.get("/api/categories/{transaction_type}")
async def get_categories(transaction_type: str):
    """
    Get available categories for a transaction type
    """
    if transaction_type.lower() == 'expense':
        return {
            "categories": list(categorizer.expense_categories.keys()),
            "type": "expense"
        }
    elif transaction_type.lower() == 'income':
        return {
            "categories": list(categorizer.income_categories.keys()),
            "type": "income"
        }
    else:
        raise HTTPException(status_code=400, detail="Transaction type must be 'income' or 'expense'")

# Test endpoints for development
@app.get("/api/test-categorization")
async def test_categorization():
    """Test the categorization with sample data"""
    test_cases = [
        {"item": "Starbucks coffee", "type": "expense"},
        {"item": "Shell gas station", "type": "expense"},
        {"item": "Walmart grocery shopping", "type": "expense"},
        {"item": "UCO tuition payment", "type": "expense"},
        {"item": "Freelance web design", "type": "income"},
        {"item": "University teaching", "type": "income"}
    ]
    
    results = []
    for case in test_cases:
        try:
            result = categorizer.suggest_category(case["item"], case["type"])
            results.append({
                "input": case,
                "output": result
            })
        except Exception as e:
            results.append({
                "input": case,
                "error": str(e)
            })
    
    return {"test_results": results}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)