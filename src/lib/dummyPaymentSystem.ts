// Dummy Payment System for Development and Testing
// This system simulates payment processing without actual monetary transactions

export interface DummyPaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  timestamp: string;
  paymentMethod: 'esewa' | 'bank_transfer' | 'card';
  status: 'completed' | 'pending' | 'failed';
}

export interface DummyPaymentRequest {
  amount: number;
  tournamentId: string;
  tournamentName: string;
  userId: string;
  userEmail: string;
  description?: string;
}

class DummyPaymentProcessor {
  private static instance: DummyPaymentProcessor;
  private transactions: DummyPaymentResult[] = [];

  static getInstance(): DummyPaymentProcessor {
    if (!DummyPaymentProcessor.instance) {
      DummyPaymentProcessor.instance = new DummyPaymentProcessor();
    }
    return DummyPaymentProcessor.instance;
  }

  constructor() {
    // Load existing transactions from localStorage
    this.loadTransactions();
  }

  private loadTransactions() {
    try {
      const stored = localStorage.getItem('dummy_payment_transactions');
      if (stored) {
        this.transactions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading dummy transactions:', error);
      this.transactions = [];
    }
  }

  private saveTransactions() {
    try {
      localStorage.setItem('dummy_payment_transactions', JSON.stringify(this.transactions));
    } catch (error) {
      console.error('Error saving dummy transactions:', error);
    }
  }

  // Simulate payment processing with realistic delays and success rates
  async processPayment(request: DummyPaymentRequest): Promise<DummyPaymentResult> {
    console.log('🔄 Processing dummy payment:', request);
    
    // Simulate processing delay (1-3 seconds)
    const processingDelay = Math.random() * 2000 + 1000;
    await new Promise(resolve => setTimeout(resolve, processingDelay));
    
    // 95% success rate for realistic simulation
    const isSuccessful = Math.random() > 0.05;
    
    const paymentMethods: DummyPaymentResult['paymentMethod'][] = ['esewa', 'bank_transfer', 'card'];
    const randomMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    const result: DummyPaymentResult = {
      success: isSuccessful,
      transactionId: this.generateTransactionId(),
      amount: request.amount,
      timestamp: new Date().toISOString(),
      paymentMethod: randomMethod,
      status: isSuccessful ? 'completed' : 'failed'
    };
    
    // Store transaction for analytics
    this.transactions.push(result);
    this.saveTransactions();
    
    console.log('✅ Dummy payment processed:', result);
    return result;
  }

  // Generate realistic transaction ID
  private generateTransactionId(): string {
    const prefix = 'TXN';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  // Get transaction history for analytics
  getTransactionHistory(userId?: string): DummyPaymentResult[] {
    if (userId) {
      // In a real system, we'd filter by userId
      return this.transactions;
    }
    return this.transactions;
  }

  // Get revenue analytics data
  getRevenueAnalytics(organizerId?: string) {
    const completedTransactions = this.transactions.filter(t => t.status === 'completed');
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const transactionCount = completedTransactions.length;
    const averageTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;
    
    // Calculate monthly revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlyTransactions = completedTransactions.filter(t => 
      new Date(t.timestamp) >= thirtyDaysAgo
    );
    const monthlyRevenue = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalRevenue,
      monthlyRevenue,
      transactionCount,
      averageTransaction,
      successRate: this.transactions.length > 0 ? (completedTransactions.length / this.transactions.length) * 100 : 0,
      platformCommission: totalRevenue * 0.05, // 5% platform fee
      organizerEarnings: totalRevenue * 0.95
    };
  }

  // Clear all transaction data (for testing)
  clearTransactions() {
    this.transactions = [];
    localStorage.removeItem('dummy_payment_transactions');
    console.log('🗑️ Dummy payment transactions cleared');
  }

  // Simulate payment verification (always returns true for dummy system)
  async verifyPayment(transactionId: string): Promise<boolean> {
    console.log('🔍 Verifying dummy payment:', transactionId);
    
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const transaction = this.transactions.find(t => t.transactionId === transactionId);
    return transaction ? transaction.success : false;
  }
}

export const dummyPaymentProcessor = DummyPaymentProcessor.getInstance();

// Dummy payment UI component for seamless integration
export const DummyPaymentInterface = {
  // Show payment simulation modal
  showPaymentModal: (request: DummyPaymentRequest): Promise<DummyPaymentResult> => {
    return new Promise((resolve, reject) => {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      `;

      modal.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
          <div style="width: 60px; height: 60px; background: #10b981; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">₹</div>
          <h2 style="color: #10b981; margin-bottom: 0.5rem; font-size: 1.5rem;">Dummy Payment System</h2>
          <p style="color: #6b7280; margin-bottom: 1rem;">Processing payment for ${request.tournamentName}</p>
          <p style="font-size: 1.25rem; font-weight: bold; color: #1f2937;">रू ${request.amount.toLocaleString()}</p>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <div style="width: 100%; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
            <div id="progress-bar" style="width: 0%; height: 100%; background: #10b981; border-radius: 2px; transition: width 0.3s ease;"></div>
          </div>
        </div>
        
        <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">
          This is a development simulation.<br>
          No real money will be charged.
        </p>
        
        <div style="display: flex; gap: 0.5rem; justify-content: center;">
          <button id="cancel-btn" style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">Cancel</button>
          <button id="pay-btn" style="padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">Complete Payment</button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Handle cancel
      const cancelBtn = modal.querySelector('#cancel-btn') as HTMLButtonElement;
      cancelBtn.onclick = () => {
        document.body.removeChild(overlay);
        reject(new Error('Payment cancelled by user'));
      };

      // Handle payment
      const payBtn = modal.querySelector('#pay-btn') as HTMLButtonElement;
      const progressBar = modal.querySelector('#progress-bar') as HTMLElement;
      
      payBtn.onclick = async () => {
        payBtn.disabled = true;
        cancelBtn.disabled = true;
        payBtn.textContent = 'Processing...';
        
        // Animate progress bar
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress > 100) progress = 100;
          progressBar.style.width = `${progress}%`;
          
          if (progress >= 100) {
            clearInterval(progressInterval);
          }
        }, 200);

        try {
          const result = await dummyPaymentProcessor.processPayment(request);
          document.body.removeChild(overlay);
          resolve(result);
        } catch (error) {
          document.body.removeChild(overlay);
          reject(error);
        }
      };
    });
  }
};