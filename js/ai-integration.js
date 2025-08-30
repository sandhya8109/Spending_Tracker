// AI Integration for Budget Tracker Frontend
// Add this to your existing app.js or create a new ai-integration.js file

class BudgetAI {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000/api';
        this.isProcessing = false;
        this.initializeAI();
    }

    async initializeAI() {
        console.log('Initializing AI features...');
        
        // Test backend connection
        try {
            const response = await fetch(`${this.apiBaseUrl.replace('/api', '')}/`);
            const data = await response.json();
            console.log('Backend connected:', data.message);
            this.showNotification('AI features enabled!', 'success', 2000);
        } catch (error) {
            console.warn('Backend not available, AI features disabled');
            this.showNotification('AI features offline - using manual entry', 'warning', 3000);
        }
    }

    async suggestCategory(itemDescription, transactionType) {
        if (!itemDescription || itemDescription.trim().length < 2) {
            return null;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/suggest-category`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    item: itemDescription,
                    amount: 0, // Not needed for category suggestion
                    type: transactionType,
                    entryDate: new Date().toISOString().split('T')[0]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting AI suggestion:', error);
            return null;
        }
    }

    async processFullTransaction(transactionData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/process-transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error processing transaction:', error);
            return null;
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Use your existing notification function
        if (typeof showNotification === 'function') {
            showNotification(message, type, duration);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    formatConfidence(confidence) {
        const percentage = Math.round(confidence * 100);
        if (percentage >= 80) return { emoji: '🎯', color: 'text-green-600' };
        if (percentage >= 60) return { emoji: '👍', color: 'text-blue-600' };
        if (percentage >= 40) return { emoji: '🤔', color: 'text-yellow-600' };
        return { emoji: '❓', color: 'text-gray-600' };
    }
}

// Initialize AI when DOM loads
let budgetAI;

document.addEventListener('DOMContentLoaded', function() {
    budgetAI = new BudgetAI();
    
    // Add AI suggestion functionality to existing form
    const itemInput = document.getElementById('item');
    const categorySelect = document.getElementById('category');
    const subcategorySelect = document.getElementById('subcategory');
    const aiSuggestionElement = document.getElementById('aiSuggestion');
    
    let suggestionTimeout;

    // Real-time AI suggestions as user types
    itemInput.addEventListener('input', async function() {
        const itemValue = this.value.trim();
        const categoryValue = categorySelect.value;
        
        // Clear previous timeout
        clearTimeout(suggestionTimeout);
        
        // Clear previous suggestions
        if (aiSuggestionElement) {
            aiSuggestionElement.textContent = '';
        }
        
        if (itemValue.length < 3 || !categoryValue) {
            return;
        }
        
        // Debounce API calls
        suggestionTimeout = setTimeout(async () => {
            if (budgetAI.isProcessing) return;
            budgetAI.isProcessing = true;
            
            try {
                const suggestion = await budgetAI.suggestCategory(itemValue, categoryValue);
                
                if (suggestion && aiSuggestionElement) {
                    const confidence = budgetAI.formatConfidence(suggestion.confidence);
                    
                    aiSuggestionElement.innerHTML = `
                        <span class="${confidence.color}">
                            ${confidence.emoji} AI suggests: <strong>${suggestion.suggested_category}</strong> 
                            (${Math.round(suggestion.confidence * 100)}% confident)
                        </span>
                        <button onclick="acceptAISuggestion('${suggestion.suggested_category}')" 
                                class="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                            Use This
                        </button>
                    `;
                }
            } catch (error) {
                console.error('AI suggestion error:', error);
            } finally {
                budgetAI.isProcessing = false;
            }
        }, 800); // Wait 800ms after user stops typing
    });
});

// Function to accept AI suggestion
function acceptAISuggestion(suggestedCategory) {
    const subcategorySelect = document.getElementById('subcategory');
    const aiSuggestionElement = document.getElementById('aiSuggestion');
    
    // Update subcategory dropdown if suggestion is valid
    const options = Array.from(subcategorySelect.options);
    const matchingOption = options.find(option => option.value === suggestedCategory);
    
    if (matchingOption) {
        subcategorySelect.value = suggestedCategory;
        aiSuggestionElement.innerHTML = '<span class="text-green-600">✅ AI suggestion applied!</span>';
        
        setTimeout(() => {
            if (aiSuggestionElement) {
                aiSuggestionElement.textContent = '';
            }
        }, 2000);
        
        budgetAI.showNotification('Category set by AI!', 'success', 1500);
    } else {
        budgetAI.showNotification('Category not found in options', 'error', 2000);
    }
}

// Enhanced form submission with AI processing
function enhancedFormSubmit(formData) {
    // This function can be called from your existing handleFormSubmit
    // to add AI insights before saving the transaction
    
    return new Promise(async (resolve, reject) => {
        try {
            // Process with AI for additional insights
            const aiResult = await budgetAI.processFullTransaction({
                item: formData.item,
                amount: formData.amount,
                type: formData.category,
                entryDate: formData.entryDate
            });
            
            if (aiResult) {
                console.log('AI Processing Result:', aiResult);
                
                // Add AI insights to the transaction
                const enhancedTransaction = {
                    ...formData,
                    aiSuggestion: {
                        category: aiResult.suggested_category,
                        confidence: aiResult.confidence,
                        reasoning: aiResult.reasoning
                    }
                };
                
                resolve(enhancedTransaction);
            } else {
                // Fallback to original data if AI fails
                resolve(formData);
            }
        } catch (error) {
            console.error('AI processing failed:', error);
            resolve(formData); // Continue without AI
        }
    });
}

// Utility function to generate smart insights
function generateSmartInsights(transactions, currentMonth) {
    const insights = [];
    
    // Spending pattern analysis
    const monthlyTransactions = transactions.filter(t => t.month === currentMonth);
    const categories = {};
    
    monthlyTransactions.forEach(t => {
        if (t.type === 'expense') {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        }
    });
    
    // Find highest spending category
    const topCategory = Object.entries(categories)
        .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory) {
        insights.push(`💸 Your biggest expense this month is ${topCategory[0]} (${topCategory[1].toFixed(2)})`);
    }
    
    // Check for unusual spending patterns
    const avgDailySpending = Object.values(categories).reduce((a, b) => a + b, 0) / new Date().getDate();
    if (avgDailySpending > 50) {
        insights.push(`⚠️ You're spending ${avgDailySpending.toFixed(2)}/day on average`);
    } else if (avgDailySpending < 20) {
        insights.push(`🎉 Great job! You're only spending ${avgDailySpending.toFixed(2)}/day on average`);
    }
    
    // Budget adherence
    let overBudgetCategories = 0;
    Object.entries(categories).forEach(([cat, spent]) => {
        const budget = adjustableBudgets.expense[cat] || 0;
        if (spent > budget && budget > 0) {
            overBudgetCategories++;
        }
    });
    
    if (overBudgetCategories > 0) {
        insights.push(`📊 You're over budget in ${overBudgetCategories} categories`);
    }
    
    return insights;
}

// Update the analytics tab to show AI insights
function updateAIInsights() {
    const insightsElement = document.getElementById('aiInsights');
    if (!insightsElement) return;
    
    try {
        const insights = generateSmartInsights(transactions, selectedMonth);
        
        if (insights.length > 0) {
            insightsElement.innerHTML = insights.map(insight => 
                `<div class="flex items-start space-x-2">
                    <span class="flex-shrink-0">🤖</span>
                    <span>${insight}</span>
                </div>`
            ).join('');
        } else {
            insightsElement.innerHTML = '<div class="text-blue-600">Add more transactions to get personalized insights!</div>';
        }
    } catch (error) {
        console.error('Error generating AI insights:', error);
        insightsElement.innerHTML = '<div class="text-gray-500">AI insights temporarily unavailable</div>';
    }
}

// Extend existing functions
const originalShowTab = window.showTab;
window.showTab = function(tabName) {
    originalShowTab(tabName);
    
    // Update AI insights when analytics tab is shown
    if (tabName === 'analytics') {
        setTimeout(updateAIInsights, 200);
    }
};
// Add this to your existing ai-integration.js file

class ReceiptOCR {
    constructor(budgetAI) {
        this.budgetAI = budgetAI;
        this.isProcessing = false;
        this.initializeOCR();
    }

    initializeOCR() {
        console.log('Initializing Receipt OCR...');
        
        // Get DOM elements
        this.receiptUpload = document.getElementById('receiptUpload');
        this.ocrResult = document.getElementById('ocrResult');
        
        if (this.receiptUpload) {
            this.receiptUpload.addEventListener('change', this.handleReceiptUpload.bind(this));
        }
        
        // Add camera capture button if supported
        this.addCameraCapture();
    }

    addCameraCapture() {
        // Check if camera is supported
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const receiptContainer = this.receiptUpload?.parentElement;
            if (receiptContainer) {
                const cameraButton = document.createElement('button');
                cameraButton.type = 'button';
                cameraButton.className = 'mt-2 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors';
                cameraButton.innerHTML = '📷 Take Photo of Receipt';
                cameraButton.onclick = this.openCamera.bind(this);
                
                receiptContainer.appendChild(cameraButton);
            }
        }
    }

    async handleReceiptUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (this.isProcessing) {
            this.showOCRStatus('Please wait, processing previous receipt...', 'warning');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showOCRStatus('Please upload an image file', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showOCRStatus('Image too large. Please use a smaller file (max 5MB)', 'error');
            return;
        }

        this.isProcessing = true;
        this.showOCRStatus('Processing receipt... This may take a few seconds', 'processing');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.budgetAI.apiBaseUrl}/process-receipt`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.handleOCRResult(result);

        } catch (error) {
            console.error('Receipt processing error:', error);
            this.showOCRStatus('Error processing receipt. Please try again.', 'error');
        } finally {
            this.isProcessing = false;
        }
    }

    async openCamera() {
        if (this.isProcessing) {
            this.budgetAI.showNotification('Please wait, processing previous receipt...', 'warning');
            return;
        }

        try {
            // Create camera modal
            const modal = this.createCameraModal();
            document.body.appendChild(modal);

            // Start camera
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });

            const video = modal.querySelector('#cameraVideo');
            video.srcObject = stream;

            // Handle capture
            const captureBtn = modal.querySelector('#captureBtn');
            captureBtn.onclick = () => this.capturePhoto(video, stream, modal);

            // Handle close
            const closeBtn = modal.querySelector('#closeCameraBtn');
            closeBtn.onclick = () => this.closeCameraModal(stream, modal);

        } catch (error) {
            console.error('Camera error:', error);
            this.budgetAI.showNotification('Camera not available. Please upload an image instead.', 'error');
        }
    }

    createCameraModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-lg w-full">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Capture Receipt</h3>
                    <button id="closeCameraBtn" class="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                
                <div class="relative">
                    <video id="cameraVideo" autoplay playsinline class="w-full rounded-lg bg-black"></video>
                    <div class="absolute inset-0 border-2 border-dashed border-white opacity-50 rounded-lg pointer-events-none"></div>
                </div>
                
                <div class="flex space-x-3 mt-4">
                    <button id="captureBtn" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg">
                        📷 Capture
                    </button>
                    <button id="closeCameraBtn2" class="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg">
                        Cancel
                    </button>
                </div>
                
                <p class="text-xs text-gray-500 mt-2 text-center">
                    Position the receipt clearly in the frame for best results
                </p>
            </div>
        `;

        // Add second close button handler
        modal.querySelector('#closeCameraBtn2').onclick = modal.querySelector('#closeCameraBtn').onclick;

        return modal;
    }

    async capturePhoto(video, stream, modal) {
        try {
            // Create canvas to capture frame
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            // Convert to base64
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);

            // Close camera
            this.closeCameraModal(stream, modal);

            // Process the captured image
            this.isProcessing = true;
            this.showOCRStatus('Processing captured receipt...', 'processing');

            const response = await fetch(`${this.budgetAI.apiBaseUrl}/process-receipt-base64`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageDataUrl
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.handleOCRResult(result);

        } catch (error) {
            console.error('Photo capture error:', error);
            this.showOCRStatus('Error processing photo. Please try again.', 'error');
        } finally {
            this.isProcessing = false;
        }
    }

    closeCameraModal(stream, modal) {
        // Stop camera stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        // Remove modal
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }

    handleOCRResult(result) {
        if (result.success && result.data) {
            const data = result.data;
            let filledFields = [];

            // Auto-fill form fields
            if (data.vendor && data.vendor !== '') {
                const itemField = document.getElementById('item');
                if (itemField) {
                    itemField.value = data.vendor;
                    filledFields.push('vendor');
                }
            }

            if (data.amount && data.amount > 0) {
                const amountField = document.getElementById('amount');
                if (amountField) {
                    amountField.value = data.amount.toFixed(2);
                    filledFields.push('amount');
                }
            }

            if (data.date && data.date !== '') {
                const dateField = document.getElementById('entryDate');
                if (dateField) {
                    dateField.value = data.date;
                    filledFields.push('date');
                }
            }

            // Set category if suggested
            if (data.suggested_category) {
                const categoryField = document.getElementById('category');
                const subcategoryField = document.getElementById('subcategory');
                
                if (categoryField && subcategoryField) {
                    categoryField.value = 'expense'; // Receipts are usually expenses
                    
                    // Trigger category change to populate subcategories
                    categoryField.dispatchEvent(new Event('change'));
                    
                    // Set subcategory after a short delay
                    setTimeout(() => {
                        if (subcategoryField.querySelector(`option[value="${data.suggested_category}"]`)) {
                            subcategoryField.value = data.suggested_category;
                            filledFields.push('category');
                        }
                    }, 100);
                }
            }

            // Show success message
            const confidence = Math.round(data.confidence * 100);
            const fieldsText = filledFields.length > 0 ? filledFields.join(', ') : 'some fields';
            
            this.showOCRStatus(
                `✅ Receipt processed! Auto-filled: ${fieldsText} (${confidence}% confidence)`, 
                'success'
            );

            // Show notification
            this.budgetAI.showNotification(
                `Receipt processed successfully! Found ${filledFields.length} fields`, 
                'success'
            );

            // Clear the file input
            if (this.receiptUpload) {
                this.receiptUpload.value = '';
            }

        } else {
            this.showOCRStatus(
                result.message || 'Could not extract data from receipt. Please fill manually.', 
                'warning'
            );
        }
    }

    showOCRStatus(message, type) {
        if (!this.ocrResult) return;

        const colors = {
            processing: 'text-blue-600',
            success: 'text-green-600',
            warning: 'text-yellow-600',
            error: 'text-red-600'
        };

        const icons = {
            processing: '⏳',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        this.ocrResult.className = `text-xs mt-1 ${colors[type] || 'text-gray-600'}`;
        this.ocrResult.innerHTML = `${icons[type] || 'ℹ️'} ${message}`;

        // Auto-clear success/warning messages after 10 seconds
        if (type === 'success' || type === 'warning') {
            setTimeout(() => {
                if (this.ocrResult) {
                    this.ocrResult.textContent = '';
                }
            }, 10000);
        }
    }

    // Test OCR functionality
    async testOCR() {
        try {
            const response = await fetch(`${this.budgetAI.apiBaseUrl}/test-ocr`);
            const data = await response.json();
            console.log('OCR Test Result:', data);
            this.budgetAI.showNotification('OCR service is working!', 'success');
            return data;
        } catch (error) {
            console.error('OCR test failed:', error);
            this.budgetAI.showNotification('OCR service unavailable', 'warning');
            return null;
        }
    }
}

// Initialize OCR when document loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for budgetAI to be initialized
    setTimeout(() => {
        if (window.budgetAI) {
            window.receiptOCR = new ReceiptOCR(window.budgetAI);
            console.log('Receipt OCR initialized');
        }
    }, 1000);
});
// Enhanced AI Predictions and Advanced Insights
// Add this to your existing ai-integration.js file

class BudgetPredictor {
    constructor(budgetAI) {
        this.budgetAI = budgetAI;
        this.predictions = {};
        this.insights = [];
        this.initializePredictor();
    }

    initializePredictor() {
        console.log('Initializing Budget Predictor...');
        this.updatePredictions();
    }

    // Predict spending for rest of month
    predictMonthlySpending(transactions, currentMonth) {
        const monthTransactions = transactions.filter(t => t.month === currentMonth);
        const today = new Date();
        const currentDay = today.getDate();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const daysRemaining = daysInMonth - currentDay;

        // Calculate daily spending patterns
        const spendingByDay = {};
        const spendingByCategory = {};

        monthTransactions.forEach(t => {
            if (t.type === 'expense') {
                const day = new Date(t.entryDate).getDate();
                spendingByDay[day] = (spendingByDay[day] || 0) + t.amount;
                spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
            }
        });

        // Calculate average daily spending
        const totalSpentSoFar = Object.values(spendingByDay).reduce((sum, amt) => sum + amt, 0);
        const avgDailySpending = totalSpentSoFar / currentDay;

        // Predict remaining spending with trend analysis
        const recentDays = Object.entries(spendingByDay)
            .filter(([day]) => parseInt(day) > currentDay - 7)
            .map(([, amount]) => amount);

        const recentAvg = recentDays.length > 0 
            ? recentDays.reduce((sum, amt) => sum + amt, 0) / recentDays.length
            : avgDailySpending;

        // Weight recent spending more heavily
        const predictedDailySpending = (avgDailySpending * 0.3) + (recentAvg * 0.7);
        const projectedRemainingSpending = predictedDailySpending * daysRemaining;
        const projectedTotalSpending = totalSpentSoFar + projectedRemainingSpending;

        return {
            currentSpending: totalSpentSoFar,
            projectedTotal: projectedTotalSpending,
            projectedRemaining: projectedRemainingSpending,
            avgDaily: avgDailySpending,
            recentDaily: recentAvg,
            daysRemaining,
            spendingByCategory
        };
    }

    // Analyze spending patterns and detect anomalies
    analyzeSpendingPatterns(transactions, months = 6) {
        const patterns = {};
        const categoryTrends = {};

        // Get last N months of data
        const recentMonths = this.getRecentMonths(months);
        
        recentMonths.forEach(month => {
            const monthTransactions = transactions.filter(t => t.month === month);
            const monthSpending = {};

            monthTransactions.forEach(t => {
                if (t.type === 'expense') {
                    monthSpending[t.category] = (monthSpending[t.category] || 0) + t.amount;
                }
            });

            patterns[month] = monthSpending;
        });

        // Calculate category trends
        Object.keys(subcategories.expense).forEach(category => {
            const categoryKey = subcategories.expense[category].value;
            const monthlyAmounts = recentMonths.map(month => 
                patterns[month]?.[categoryKey] || 0
            );

            if (monthlyAmounts.length > 1) {
                const avg = monthlyAmounts.reduce((sum, amt) => sum + amt, 0) / monthlyAmounts.length;
                const recent = monthlyAmounts.slice(-2).reduce((sum, amt) => sum + amt, 0) / 2;
                const trend = recent > avg ? 'increasing' : recent < avg ? 'decreasing' : 'stable';

                categoryTrends[categoryKey] = {
                    average: avg,
                    recent: recent,
                    trend: trend,
                    variance: this.calculateVariance(monthlyAmounts),
                    monthlyData: monthlyAmounts
                };
            }
        });

        return {
            patterns,
            categoryTrends,
            insights: this.generatePatternInsights(categoryTrends)
        };
    }

    // Detect unusual spending
    detectAnomalies(transactions, currentMonth) {
        const currentMonthTransactions = transactions.filter(t => t.month === currentMonth);
        const historicalData = this.analyzeSpendingPatterns(transactions, 6);
        const anomalies = [];

        // Check each category for unusual spending
        Object.entries(historicalData.categoryTrends).forEach(([category, data]) => {
            const currentSpending = currentMonthTransactions
                .filter(t => t.category === category && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const threshold = data.average + (2 * Math.sqrt(data.variance));
            const lowThreshold = Math.max(0, data.average - (2 * Math.sqrt(data.variance)));

            if (currentSpending > threshold) {
                anomalies.push({
                    category,
                    type: 'high_spending',
                    current: currentSpending,
                    expected: data.average,
                    severity: currentSpending > threshold * 1.5 ? 'high' : 'medium'
                });
            } else if (currentSpending < lowThreshold && data.average > 50) {
                anomalies.push({
                    category,
                    type: 'low_spending',
                    current: currentSpending,
                    expected: data.average,
                    severity: 'low'
                });
            }
        });

        return anomalies;
    }

    // Generate actionable insights
    generateAdvancedInsights(transactions, currentMonth) {
        const insights = [];
        const prediction = this.predictMonthlySpending(transactions, currentMonth);
        const patterns = this.analyzeSpendingPatterns(transactions);
        const anomalies = this.detectAnomalies(transactions, currentMonth);

        // Budget projection insights
        const totalBudget = Object.values(adjustableBudgets.expense).reduce((sum, b) => sum + b, 0);
        if (prediction.projectedTotal > totalBudget) {
            const overage = prediction.projectedTotal - totalBudget;
            insights.push({
                type: 'warning',
                title: 'Budget Overage Predicted',
                message: `You're projected to exceed your budget by $${overage.toFixed(2)} this month.`,
                action: 'Consider reducing spending in flexible categories',
                priority: 'high'
            });
        } else if (prediction.projectedTotal < totalBudget * 0.8) {
            const savings = totalBudget - prediction.projectedTotal;
            insights.push({
                type: 'success',
                title: 'Great Savings Potential',
                message: `You could save $${savings.toFixed(2)} this month!`,
                action: 'Consider allocating savings to an emergency fund',
                priority: 'medium'
            });
        }

        // Spending velocity insights
        if (prediction.recentDaily > prediction.avgDaily * 1.3) {
            insights.push({
                type: 'warning',
                title: 'Spending Acceleration Detected',
                message: `Recent spending is ${((prediction.recentDaily / prediction.avgDaily - 1) * 100).toFixed(1)}% higher than your monthly average.`,
                action: 'Review recent expenses and identify any unnecessary purchases',
                priority: 'high'
            });
        }

        // Category trend insights
        Object.entries(patterns.categoryTrends).forEach(([category, trend]) => {
            if (trend.trend === 'increasing' && trend.recent > trend.average * 1.5) {
                const categoryText = getSubcategoryText(category);
                insights.push({
                    type: 'info',
                    title: `${categoryText} Spending Rising`,
                    message: `Your ${categoryText.toLowerCase()} spending has increased ${((trend.recent / trend.average - 1) * 100).toFixed(1)}% recently.`,
                    action: 'Review this category for optimization opportunities',
                    priority: 'medium'
                });
            }
        });

        // Anomaly insights
        anomalies.forEach(anomaly => {
            const categoryText = getSubcategoryText(anomaly.category);
            if (anomaly.type === 'high_spending') {
                insights.push({
                    type: 'warning',
                    title: `Unusual ${categoryText} Spending`,
                    message: `${categoryText} spending ($${anomaly.current.toFixed(2)}) is significantly higher than usual ($${anomaly.expected.toFixed(2)} average).`,
                    action: 'Check if this was planned or if you can reduce future spending',
                    priority: anomaly.severity
                });
            }
        });

        // Seasonal and timing insights
        const seasonalInsight = this.generateSeasonalInsights(transactions, currentMonth);
        if (seasonalInsight) {
            insights.push(seasonalInsight);
        }

        // Sort by priority
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return insights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    }

    // Generate seasonal insights
    generateSeasonalInsights(transactions, currentMonth) {
        const month = parseInt(currentMonth.split('-')[1]);
        const seasonalTips = {
            12: { season: 'Holiday', tip: 'Holiday spending typically increases. Set aside extra budget for gifts.' },
            1: { season: 'New Year', tip: 'Great time to review and optimize your budget for the year ahead.' },
            3: { season: 'Spring', tip: 'Spring cleaning season - consider selling items you no longer need.' },
            6: { season: 'Summer', tip: 'Summer activities may increase entertainment and travel expenses.' },
            9: { season: 'Back to School', tip: 'School supplies and activities may impact family budgets.' }
        };

        const seasonal = seasonalTips[month];
        if (seasonal) {
            return {
                type: 'info',
                title: `${seasonal.season} Budget Tip`,
                message: seasonal.tip,
                action: 'Plan accordingly for seasonal expenses',
                priority: 'low'
            };
        }

        return null;
    }

    // Calculate variance for trend analysis
    calculateVariance(numbers) {
        const avg = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    }

    // Get recent months for analysis
    getRecentMonths(count) {
        const months = [];
        const currentDate = new Date(selectedMonth + '-01');
        
        for (let i = count - 1; i >= 0; i--) {
            const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            months.push(monthDate.toISOString().substring(0, 7));
        }
        
        return months;
    }

    // Generate pattern insights
    generatePatternInsights(categoryTrends) {
        const insights = [];
        
        Object.entries(categoryTrends).forEach(([category, trend]) => {
            if (trend.variance > trend.average * 0.5) {
                insights.push(`${getSubcategoryText(category)} spending is highly variable`);
            }
            
            if (trend.trend === 'increasing' && trend.recent > trend.average * 1.2) {
                insights.push(`${getSubcategoryText(category)} costs are rising consistently`);
            }
        });
        
        return insights;
    }

    // Update predictions (call this when data changes)
    updatePredictions() {
        if (!window.transactions || window.transactions.length === 0) {
            this.predictions = {};
            this.insights = [];
            return;
        }

        try {
            this.predictions = this.predictMonthlySpending(window.transactions, selectedMonth);
            this.insights = this.generateAdvancedInsights(window.transactions, selectedMonth);
            console.log('Predictions updated:', this.predictions);
        } catch (error) {
            console.error('Error updating predictions:', error);
            this.predictions = {};
            this.insights = [];
        }
    }

    // Get spending recommendations
    getSpendingRecommendations() {
        const recommendations = [];
        
        if (this.predictions.projectedTotal) {
            const totalBudget = Object.values(adjustableBudgets.expense).reduce((sum, b) => sum + b, 0);
            const remainingBudget = totalBudget - this.predictions.currentSpending;
            const dailyBudgetRemaining = remainingBudget / this.predictions.daysRemaining;

            recommendations.push({
                type: 'budget',
                title: 'Daily Budget Recommendation',
                value: dailyBudgetRemaining,
                message: `To stay on budget, limit spending to $${dailyBudgetRemaining.toFixed(2)}/day for the remaining ${this.predictions.daysRemaining} days.`
            });

            // Category-specific recommendations
            Object.entries(this.predictions.spendingByCategory).forEach(([category, spent]) => {
                const categoryBudget = adjustableBudgets.expense[category] || 0;
                if (spent > categoryBudget * 0.8) {
                    recommendations.push({
                        type: 'category',
                        title: `${getSubcategoryText(category)} Alert`,
                        message: `You've used ${((spent / categoryBudget) * 100).toFixed(1)}% of your ${getSubcategoryText(category).toLowerCase()} budget.`
                    });
                }
            });
        }

        return recommendations;
    }
}

// Enhanced insights rendering
function renderAdvancedInsights() {
    const insightsElement = document.getElementById('aiInsights');
    if (!insightsElement || !window.budgetPredictor) return;

    try {
        const insights = window.budgetPredictor.insights;
        const predictions = window.budgetPredictor.predictions;
        const recommendations = window.budgetPredictor.getSpendingRecommendations();

        if (insights.length === 0 && Object.keys(predictions).length === 0) {
            insightsElement.innerHTML = `
                <div class="text-center text-blue-600 p-4">
                    <div class="text-2xl mb-2">🤖</div>
                    <div>Add more transactions to unlock personalized insights and predictions!</div>
                </div>
            `;
            return;
        }

        let html = '';

        // Show key prediction first
        if (predictions.projectedTotal) {
            const totalBudget = Object.values(adjustableBudgets.expense).reduce((sum, b) => sum + b, 0);
            const projectionStatus = predictions.projectedTotal > totalBudget ? 'over' : 'under';
            const projectionColor = projectionStatus === 'over' ? 'text-red-600' : 'text-green-600';
            
            html += `
                <div class="bg-white rounded-lg p-3 mb-3 border-l-4 border-blue-500">
                    <div class="font-medium text-gray-800">📊 Month Projection</div>
                    <div class="text-sm ${projectionColor}">
                        Projected total spending: $${predictions.projectedTotal.toFixed(2)}
                        ${projectionStatus === 'over' ? '(Over budget)' : '(Under budget)'}
                    </div>
                </div>
            `;
        }

        // Show top insights
        insights.slice(0, 3).forEach(insight => {
            const colors = {
                'warning': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '⚠️' },
                'success': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: '✅' },
                'info': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'ℹ️' }
            };
            
            const style = colors[insight.type] || colors.info;
            
            html += `
                <div class="${style.bg} rounded-lg p-3 mb-2 border ${style.border}">
                    <div class="flex items-start space-x-2">
                        <span class="flex-shrink-0 text-lg">${style.icon}</span>
                        <div class="flex-1">
                            <div class="font-medium ${style.text} text-xs">${insight.title}</div>
                            <div class="text-xs text-gray-700 mt-1">${insight.message}</div>
                            ${insight.action ? `<div class="text-xs text-gray-600 mt-1 italic">💡 ${insight.action}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        // Show recommendations
        recommendations.forEach(rec => {
            if (rec.type === 'budget') {
                html += `
                    <div class="bg-purple-50 rounded-lg p-3 mt-2 border border-purple-200">
                        <div class="flex items-center space-x-2">
                            <span>🎯</span>
                            <div class="text-xs">
                                <div class="font-medium text-purple-800">${rec.title}</div>
                                <div class="text-purple-700">${rec.message}</div>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        insightsElement.innerHTML = html;

    } catch (error) {
        console.error('Error rendering advanced insights:', error);
        insightsElement.innerHTML = `
            <div class="text-red-600 text-xs">
                <span>❌</span> Error loading insights. Please refresh the page.
            </div>
        `;
    }
}

// Initialize the predictor when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.budgetAI) {
            window.budgetPredictor = new BudgetPredictor(window.budgetAI);
            console.log('Budget Predictor initialized');
            
            // Update insights when analytics tab is shown
            const originalShowTab = window.showTab;
            window.showTab = function(tabName) {
                originalShowTab(tabName);
                
                if (tabName === 'analytics') {
                    setTimeout(() => {
                        if (window.budgetPredictor) {
                            window.budgetPredictor.updatePredictions();
                            renderAdvancedInsights();
                        }
                    }, 300);
                }
            };
            
            // Update predictions when new transactions are added
            const originalHandleFormSubmit = window.handleFormSubmit;
            if (originalHandleFormSubmit) {
                window.handleFormSubmit = function(e) {
                    const result = originalHandleFormSubmit.call(this, e);
                    setTimeout(() => {
                        if (window.budgetPredictor) {
                            window.budgetPredictor.updatePredictions();
                        }
                    }, 1000);
                    return result;
                };
            }
        }
    }, 1500);
});

// Make available globally
window.BudgetPredictor = BudgetPredictor;
window.renderAdvancedInsights = renderAdvancedInsights;

// Make ReceiptOCR available globally
window.ReceiptOCR = ReceiptOCR;

// Make functions globally available
window.acceptAISuggestion = acceptAISuggestion;
window.budgetAI = budgetAI;
window.enhancedFormSubmit = enhancedFormSubmit;
window.updateAIInsights = updateAIInsights;