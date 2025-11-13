import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const { orderId, amount, paymentMethod, session_id } = location.state || {};
  const urlParams = new URLSearchParams(window.location.search);
  const urlOrderId = urlParams.get('order_id');
  const urlSessionId = urlParams.get('session_id');

  const finalOrderId = orderId || urlOrderId;

  useEffect(() => {
    const verifyPayment = async () => {
      if (!finalOrderId) {
        setLoading(false);
        return;
      }

      try {
        // Verify payment status for online payments
        if (paymentMethod === 'online' || urlSessionId) {
          const { data } = await API.get(`/orders/verify-payment/${finalOrderId}`);
          setOrderDetails(data);
        } else {
          // For COD, just set basic order details
          setOrderDetails({
            orderId: finalOrderId,
            paymentStatus: 'pending',
            orderStatus: 'confirmed',
            finalAmount: amount
          });
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [finalOrderId, paymentMethod, amount, urlSessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your order...</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">We couldn't find your order details.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const isPaymentSuccess = orderDetails.paymentStatus === 'success';
  const isCOD = paymentMethod === 'cod';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-blue-600">Flipkart</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {/* Success Icon */}
          <div className={`text-6xl mb-6 ${isPaymentSuccess || isCOD ? 'text-green-500' : 'text-yellow-500'}`}>
            {isPaymentSuccess || isCOD ? '✅' : '⏳'}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {isPaymentSuccess 
              ? 'Payment Successful!' 
              : isCOD 
                ? 'Order Placed Successfully!' 
                : 'Payment Processing...'
            }
          </h1>

          {/* Message */}
          <p className="text-lg text-gray-600 mb-6">
            {isPaymentSuccess 
              ? 'Thank you for your payment. Your order has been confirmed.' 
              : isCOD 
                ? 'Your order has been placed successfully. Pay when you receive your order.' 
                : 'Your payment is being processed. We will update you shortly.'
            }
          </p>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-gray-800 mb-4">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{orderDetails.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">₹{orderDetails.finalAmount || amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium">{isCOD ? 'Cash on Delivery' : 'Online Payment'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  orderDetails.paymentStatus === 'success' ? 'text-green-600' : 
                  orderDetails.paymentStatus === 'pending' ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {orderDetails.paymentStatus === 'success' ? 'Confirmed' : 
                   orderDetails.paymentStatus === 'pending' ? 'Pending' : 
                   'Failed'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/my-orders')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              View My Orders
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium"
            >
              Continue Shopping
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-sm text-gray-500">
            <p>You will receive an email confirmation shortly.</p>
            <p className="mt-2">For any queries, contact our customer support.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;