const axios = require('axios');

class CashfreePayment {
  constructor() {
    this.environment = process.env.CASHFREE_ENVIRONMENT || 'sandbox';
    
    this.baseURL = this.environment === 'production' 
      ? 'https://api.cashfree.com/pg' 
      : 'https://sandbox.cashfree.com/pg';
    
    this.headers = {
      'Content-Type': 'application/json',
      'x-client-id': process.env.CASHFREE_APP_ID,
      'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      'x-api-version': '2022-09-01'
    };

    console.log('💰 Cashfree Configuration:', {
      environment: this.environment,
      baseURL: this.baseURL,
      appId: process.env.CASHFREE_APP_ID ? '✓ Present' : '✗ Missing',
      secretKey: process.env.CASHFREE_SECRET_KEY ? '✓ Present (first 10 chars): ' + process.env.CASHFREE_SECRET_KEY.substring(0, 10) + '...' : '✗ Missing'
    });
  }

  async createOrder(orderData) {
    try {
      console.log('🔄 Creating Cashfree Order:', {
        order_id: orderData.order_id,
        order_amount: orderData.order_amount,
        customer: orderData.customer_details.customer_name,
        environment: this.environment,
        baseURL: this.baseURL
      });

      // Validate credentials first
      if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
        throw new Error('Cashfree credentials are missing. Please check your environment variables.');
      }

      const response = await axios.post(`${this.baseURL}/orders`, orderData, {
        headers: this.headers,
        timeout: 30000
      });
      
      console.log('✅ Cashfree Order Created Successfully:', {
        order_id: response.data.order_id,
        payment_session_id: response.data.payment_session_id ? '✓ Present' : '✗ Missing',
        cf_order_id: response.data.cf_order_id
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Cashfree API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        environment: this.environment,
        url: error.config?.url,
        headers: {
          'x-client-id': this.headers['x-client-id'] ? '✓ Present' : '✗ Missing',
          'x-client-secret': this.headers['x-client-secret'] ? '✓ Present (first 10 chars): ' + this.headers['x-client-secret'].substring(0, 10) + '...' : '✗ Missing'
        }
      });
      
      // More specific error messages
      if (error.response?.status === 401) {
        throw new Error('Cashfree authentication failed. Please check: 1) Your App ID and Secret Key are correct, 2) You are using sandbox credentials in sandbox environment, 3) Your account is activated.');
      } else if (error.response?.status === 400) {
        throw new Error(`Cashfree validation error: ${JSON.stringify(error.response.data)}`);
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Cashfree API endpoint not found. Check your internet connection.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'Payment gateway error');
      }
    }
  }

  async getOrderStatus(orderId) {
    try {
      const response = await axios.get(`${this.baseURL}/orders/${orderId}`, {
        headers: this.headers
      });
      
      return response.data;
    } catch (error) {
      console.error('Cashfree get order error:', error.response?.data || error.message);
      throw new Error('Failed to fetch order status');
    }
  }

  // Test connection method
  async testConnection() {
    try {
      const testOrder = {
        order_id: `TEST${Date.now()}`,
        order_amount: 1.00,
        order_currency: 'INR',
        customer_details: {
          customer_id: 'test_user_1',
          customer_email: 'test@example.com',
          customer_phone: '9999999999',
          customer_name: 'Test User'
        }
      };

      const result = await this.createOrder(testOrder);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        environment: this.environment,
        credentials: {
          appId: process.env.CASHFREE_APP_ID ? 'Present' : 'Missing',
          secretKey: process.env.CASHFREE_SECRET_KEY ? 'Present' : 'Missing'
        }
      };
    }
  }
}

module.exports = new CashfreePayment();