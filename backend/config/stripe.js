const Stripe = require('stripe');

class StripePayment {
  constructor() {
    this.stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    this.currency = 'inr';
    
    console.log('💳 Stripe Configuration:', {
      environment: process.env.NODE_ENV,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ? '✓ Present' : '✗ Missing',
      secretKey: process.env.STRIPE_SECRET_KEY ? '✓ Present' : '✗ Missing'
    });
  }

  async createPaymentIntent(orderData) {
    try {
      console.log('🔄 Creating Stripe Payment Intent:', {
        order_id: orderData.order_id,
        amount: orderData.amount,
        currency: orderData.currency,
        customer: orderData.customer_name
      });

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(orderData.amount * 100), // Convert to paise
        currency: orderData.currency,
        metadata: {
          order_id: orderData.order_id,
          customer_id: orderData.customer_id,
          customer_email: orderData.customer_email,
          customer_name: orderData.customer_name
        },
        description: `Payment for order ${orderData.order_id}`,
        shipping: orderData.shipping_address ? {
          name: orderData.customer_name,
          phone: orderData.customer_phone,
          address: {
            line1: orderData.shipping_address.address,
            city: orderData.shipping_address.city,
            state: orderData.shipping_address.state,
            postal_code: orderData.shipping_address.pincode,
            country: 'IN',
          },
        } : undefined,
        // Add automatic payment methods
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log('✅ Stripe Payment Intent Created Successfully');
      return {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert back to rupees
        currency: paymentIntent.currency
      };
    } catch (error) {
      console.error('❌ Stripe API Error:', {
        type: error.type,
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      if (error.type === 'StripeConnectionError') {
        throw new Error('Unable to connect to payment gateway. Please check your internet connection.');
      } else if (error.type === 'StripeCardError') {
        throw new Error(`Card error: ${error.message}`);
      } else {
        throw new Error(error.message || 'Payment gateway error');
      }
    }
  }

  async retrievePaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Stripe retrieve payment intent error:', error);
      throw new Error('Failed to fetch payment status');
    }
  }

  async handleWebhook(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log('📨 Stripe Webhook Event:', event.type);

      return event;
    } catch (error) {
      console.error('❌ Stripe Webhook Error:', error);
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }

  // Create Stripe Checkout Session for hosted payment page
  async createCheckoutSession(orderData, successUrl, cancelUrl) {
    try {
      console.log('🔄 Creating Stripe Checkout Session:', {
        order_id: orderData.order_id,
        amount: orderData.amount,
        customer: orderData.customer_name
      });

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card', 'upi', 'netbanking'],
        line_items: [
          {
            price_data: {
              currency: orderData.currency,
              product_data: {
                name: `Order ${orderData.order_id}`,
                description: `Payment for order ${orderData.order_id}`,
              },
              unit_amount: Math.round(orderData.amount * 100), // Convert to paise
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: orderData.customer_email,
        client_reference_id: orderData.order_id,
        metadata: {
          order_id: orderData.order_id,
          customer_id: orderData.customer_id,
          customer_name: orderData.customer_name
        },
        shipping_address_collection: {
          allowed_countries: ['IN'],
        },
        custom_text: {
          submit: {
            message: 'Thank you for your order!',
          },
        },
      });

      console.log('✅ Stripe Checkout Session Created Successfully');
      return {
        session_id: session.id,
        url: session.url,
        payment_intent_id: session.payment_intent
      };
    } catch (error) {
      console.error('❌ Stripe Checkout Session Error:', error);
      throw new Error(error.message || 'Failed to create payment session');
    }
  }

  // Test connection method
  async testConnection() {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: 100, // 1 INR
        currency: 'inr',
        description: 'Test connection'
      });

      await this.stripe.paymentIntents.cancel(paymentIntent.id);

      return { 
        success: true, 
        message: 'Stripe connection successful',
        account: await this.stripe.accounts.retrieve()
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        type: error.type
      };
    }
  }
}

module.exports = new StripePayment();