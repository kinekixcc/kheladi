// eSewa Payment Integration for Nepal
export interface ESewaConfig {
  merchantId: string;
  secretKey: string;
  baseUrl: string;
}

export interface ESewaPaymentData {
  amount: number;
  tax_amount: number;
  total_amount: number;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: number;
  product_delivery_charge: number;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
}

// eSewa Configuration
export const ESEWA_CONFIG: ESewaConfig = {
  merchantId: 'EPAYTEST', // Test merchant ID - replace with actual in production
  secretKey: '8gBm/:&EnhH.1/q', // Test secret key - replace with actual in production
  baseUrl: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form' // Test URL - use https://epay.esewa.com.np/api/epay/main/v2/form for production
};

// Check if we're in development mode and eSewa test server is not accessible
const isDevelopment = import.meta.env.DEV;

// Generate signature for eSewa payment
export const generateESewaSignature = (
  total_amount: string,
  transaction_uuid: string,
  product_code: string,
  secret_key: string
): string => {
  // eSewa signature generation logic
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  
  // For demo purposes, we'll use a simple hash
  // In production, you should use proper HMAC-SHA256
  return btoa(message + secret_key).substring(0, 32);
};

// Mock payment simulation for development
const simulateESewaPayment = (paymentData: ESewaPaymentData): void => {
  console.log('🔄 Simulating eSewa payment...', paymentData);
  
  // Create a mock payment form that redirects to our success page after a delay
  const mockForm = document.createElement('div');
  mockForm.innerHTML = `
    <div style="
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
      font-family: Arial, sans-serif;
    ">
      <div style="
        background: white;
        padding: 40px;
        border-radius: 12px;
        text-align: center;
        max-width: 400px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 60px;
          height: 60px;
          background: #16a34a;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
        ">₹</div>
        <h2 style="color: #16a34a; margin-bottom: 10px;">eSewa Payment Simulation</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Processing payment of रू ${paymentData.total_amount}
        </p>
        <div style="
          width: 100%;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 20px;
        ">
          <div style="
            width: 0%;
            height: 100%;
            background: #16a34a;
            border-radius: 2px;
            animation: progress 3s ease-in-out forwards;
          "></div>
        </div>
        <p style="color: #888; font-size: 14px;">
          This is a development simulation.<br>
          In production, this would redirect to eSewa.
        </p>
      </div>
    </div>
    <style>
      @keyframes progress {
        to { width: 100%; }
      }
    </style>
  `;
  
  document.body.appendChild(mockForm);
  
  // Simulate payment processing time
  setTimeout(() => {
    document.body.removeChild(mockForm);
    
    // Redirect to success page with payment parameters
    const urlParams = new URLSearchParams({
      tournament_id: paymentData.product_code.replace('TOURNAMENT_', ''),
      user_id: new URLSearchParams(paymentData.success_url.split('?')[1]).get('user_id') || '',
      transaction_uuid: paymentData.transaction_uuid
    });
    
    window.location.href = `/payment/success?${urlParams.toString()}`;
  }, 3000);
};

// Create eSewa payment form data
export const createESewaPayment = (
  amount: number,
  tournamentId: string,
  tournamentName: string,
  userId: string
): ESewaPaymentData => {
  const transaction_uuid = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const product_code = `TOURNAMENT_${tournamentId}`;
  const tax_amount = 0;
  const product_service_charge = 0;
  const product_delivery_charge = 0;
  const total_amount = amount + tax_amount + product_service_charge + product_delivery_charge;
  
  const success_url = `${window.location.origin}/payment/success?tournament_id=${tournamentId}&user_id=${userId}&transaction_uuid=${transaction_uuid}`;
  const failure_url = `${window.location.origin}/payment/failure?tournament_id=${tournamentId}&user_id=${userId}`;
  
  const signature = generateESewaSignature(
    total_amount.toString(),
    transaction_uuid,
    product_code,
    ESEWA_CONFIG.secretKey
  );
  
  return {
    amount,
    tax_amount,
    total_amount,
    transaction_uuid,
    product_code,
    product_service_charge,
    product_delivery_charge,
    success_url,
    failure_url,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    signature
  };
};

// Submit payment to eSewa
export const submitESewaPayment = (paymentData: ESewaPaymentData): void => {
  // Check if we're in development or if eSewa is not accessible
  if (isDevelopment) {
    console.log('🚀 Development mode: Using eSewa payment simulation');
    simulateESewaPayment(paymentData);
    return;
  }
  
  // Try to submit to real eSewa, with fallback to simulation
  try {
    // Create a form and submit to eSewa
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = ESEWA_CONFIG.baseUrl;
    
    // Add all payment data as hidden inputs
    Object.entries(paymentData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value.toString();
      form.appendChild(input);
    });
    
    // Add merchant ID
    const merchantInput = document.createElement('input');
    merchantInput.type = 'hidden';
    merchantInput.name = 'merchant_id';
    merchantInput.value = ESEWA_CONFIG.merchantId;
    form.appendChild(merchantInput);
    
    // Submit form
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  } catch (error) {
    console.warn('⚠️ eSewa connection failed, using simulation:', error);
    simulateESewaPayment(paymentData);
  }
};

// Verify eSewa payment (to be called on success page)
export const verifyESewaPayment = async (
  transaction_uuid: string,
  product_code: string,
  total_amount: number
): Promise<boolean> => {
  try {
    // In a real application, this should be done on the backend
    // For demo purposes, we'll simulate verification
    console.log('Verifying eSewa payment:', { transaction_uuid, product_code, total_amount });
    
    // Simulate API call to eSewa verification endpoint
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo, we'll assume payment is successful
    return true;
  } catch (error) {
    console.error('Payment verification failed:', error);
    return false;
  }
};