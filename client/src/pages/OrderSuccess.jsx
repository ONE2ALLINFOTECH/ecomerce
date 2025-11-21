import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { clearCart } from '../store/cartSlice';
import API from '../services/api';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      const orderId = searchParams.get('order_id');

      // Check if coming from COD order
      if (location.state?.orderId && location.state?.paymentMethod === 'cod') {
        setOrderDetails(location.state);
        setLoading(false);
        return;
      }

      // Verify Stripe payment
      if (sessionId && orderId) {
        try {
          const { data } = await API.get(`/orders/verify-payment/${sessionId}?order_id=${orderId}`);
          
          if (data.success) {
            dispatch(clearCart());
            setOrderDetails({
              orderId: data.orderId,
              amount: data.amount,
              paymentMethod: 'online',
              paymentStatus: 'success'
            });
          } else {
            navigate('/order-failed', { 
              state: { 
                orderId: data.orderId,
                paymentStatus: 'failed'
              } 
            });
          }
        } catch (error) {
          console.error('Payment verification failed:', error);
          navigate('/order-failed');
        } finally {
          setLoading(false);
        }
      } else {
        // No valid data, redirect to home
        navigate('/');
      }
    };

    verifyPayment();
  }, [searchParams, location.state, navigate, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Flipkart Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center">
          <h1 className="text-2xl font-bold text-blue-600 italic">Flipkart</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Icon & Message */}
        <div className="bg-white rounded-sm shadow-sm p-8 mb-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle size={48} className="text-green-600" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-medium text-gray-900 mb-2">
            Order Placed Successfully!
          </h2>
          <p className="text-gray-600 text-base">
            Thank you for shopping with us
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-sm shadow-sm mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Order Information</h3>
          </div>
          
          <div className="p-6">
            {/* Order Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 pb-6 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Order ID</p>
                <p className="font-semibold text-gray-900 text-lg">#{orderDetails.orderId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Amount</p>
                <p className="font-bold text-gray-900 text-2xl">₹{orderDetails.amount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Mode</p>
                <p className="font-semibold text-gray-900">
                  {orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
                </p>
              </div>
            </div>

            {/* Order Tracking Timeline */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-6 text-base">Order Status</h4>
              <div className="relative">
                <div className="flex items-start justify-between">
                  {/* Order Placed */}
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mb-3 relative z-10 shadow-md">
                      <CheckCircle size={28} className="text-white" strokeWidth={2.5} />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Order Placed</p>
                    <p className="text-xs text-gray-500">Just now</p>
                  </div>
                  
                  {/* Connecting Line */}
                  <div className="flex-1 h-1 bg-gray-300 self-start mt-7 -mx-4"></div>
                  
                  {/* Packed */}
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center mb-3 relative z-10">
                      <Package size={28} className="text-gray-500" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Packed</p>
                    <p className="text-xs text-gray-400">Pending</p>
                  </div>
                  
                  {/* Connecting Line */}
                  <div className="flex-1 h-1 bg-gray-300 self-start mt-7 -mx-4"></div>
                  
                  {/* Shipped */}
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center mb-3 relative z-10">
                      <Truck size={28} className="text-gray-500" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Shipped</p>
                    <p className="text-xs text-gray-400">Pending</p>
                  </div>
                  
                  {/* Connecting Line */}
                  <div className="flex-1 h-1 bg-gray-300 self-start mt-7 -mx-4"></div>
                  
                  {/* Delivered */}
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center mb-3 relative z-10">
                      <Home size={28} className="text-gray-500" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Delivered</p>
                    <p className="text-xs text-gray-400">Pending</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status Messages */}
            {orderDetails.paymentMethod === 'cod' && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">Cash on Delivery:</span> Please keep ₹{orderDetails.amount} ready for payment at the time of delivery.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {orderDetails.paymentMethod === 'online' && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">
                      <span className="font-semibold">Payment Successful!</span> Your payment of ₹{orderDetails.amount} has been processed successfully.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            to="/orders"
            className="bg-blue-600 text-white px-10 py-3 rounded-sm font-medium hover:bg-blue-700 transition-all text-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Track Your Order
          </Link>
          <Link
            to="/products"
            className="bg-white border-2 border-blue-600 text-blue-600 px-10 py-3 rounded-sm font-medium hover:bg-blue-50 transition-all text-center hover:border-blue-700"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-sm shadow-sm p-6 text-center">
          <p className="text-sm text-gray-600">
            Need help with your order?{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
              Contact Customer Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;