import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Package, Truck, Home, Clock } from 'lucide-react';
import API from '../services/api';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const urlOrderId = urlParams.get('order_id');
  const urlSessionId = urlParams.get('session_id');
  const canceled = urlParams.get('canceled');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        
        // Priority: location.state -> URL params -> redirect to home
        const orderId = location.state?.orderId || urlOrderId;

        if (!orderId) {
          console.error('No order ID found');
          navigate('/');
          return;
        }

        // If payment was canceled, show failure
        if (canceled === 'true') {
          setOrderDetails({
            orderId: orderId,
            paymentStatus: 'cancelled',
            paymentMethod: 'online',
            isCanceled: true
          });
          setLoading(false);
          return;
        }

        // Try to get order details from backend
        try {
          const { data } = await API.get(`/orders/verify-payment/${orderId}`);
          setOrderDetails({
            ...data,
            orderId: data.orderId || orderId,
            amount: data.finalAmount || location.state?.amount
          });
        } catch (apiError) {
          console.warn('API fetch failed, using client-side data:', apiError);
          // Fallback to client-side data
          setOrderDetails({
            orderId: orderId,
            paymentStatus: location.state?.paymentStatus || 'pending',
            paymentMethod: location.state?.paymentMethod || 'online',
            amount: location.state?.amount,
            orderStatus: location.state?.orderStatus || 'pending'
          });
        }

      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location.state, navigate, urlOrderId, urlSessionId, canceled]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <XCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Order</h2>
          <p className="text-gray-600 mb-4">{error}</p>
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

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <XCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
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

  const isCOD = orderDetails.paymentMethod === 'cod';
  const isPaymentSuccess = orderDetails.paymentStatus === 'success';
  const isPaymentFailed = orderDetails.paymentStatus === 'failed' || orderDetails.paymentStatus === 'cancelled';
  const isPaymentPending = orderDetails.paymentStatus === 'pending' || orderDetails.paymentStatus === 'processing';
  const isOrderConfirmed = orderDetails.orderStatus === 'confirmed';

  // Determine overall success state
  const isSuccess = (isCOD && isOrderConfirmed) || 
                   (!isCOD && isPaymentSuccess) || 
                   (isCOD && isPaymentPending);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-blue-600">Flipkart</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {isSuccess ? (
          <div>
            {/* Success Message */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-4">
                <CheckCircle size={48} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isCOD ? 'Order Placed Successfully!' : 'Payment Successful!'}
              </h2>
              <p className="text-gray-600 text-lg">
                {isCOD 
                  ? 'Your order has been confirmed with Cash on Delivery.' 
                  : 'Thank you for your payment. Your order has been confirmed.'
                }
              </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-white border border-gray-200 rounded shadow-sm mb-6">
              <div className="bg-blue-50 px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Order ID</p>
                    <p className="font-semibold text-gray-900">{orderDetails.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                    <p className="font-semibold text-gray-900 text-xl">₹{orderDetails.amount || orderDetails.finalAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                    <p className="font-semibold text-gray-900">
                      {isCOD ? 'Cash on Delivery' : 'Online Payment'}
                    </p>
                  </div>
                </div>

                {/* Payment Status */}
                {!isCOD && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center">
                      <CheckCircle size={20} className="text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">Payment Completed Successfully</span>
                    </div>
                  </div>
                )}

                {/* Delivery Timeline */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Order Tracking</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle size={24} className="text-white" />
                      </div>
                      <p className="text-xs font-medium text-gray-900">Order Confirmed</p>
                      <p className="text-xs text-gray-500">Just now</p>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-300 -mx-2"></div>
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        orderDetails.orderStatus === 'confirmed' ? 'bg-gray-200' : 'bg-gray-200'
                      }`}>
                        <Package size={24} className="text-gray-500" />
                      </div>
                      <p className="text-xs font-medium text-gray-500">Packed</p>
                      <p className="text-xs text-gray-400">Pending</p>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-300 -mx-2"></div>
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                        <Truck size={24} className="text-gray-500" />
                      </div>
                      <p className="text-xs font-medium text-gray-500">Shipped</p>
                      <p className="text-xs text-gray-400">Pending</p>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-300 -mx-2"></div>
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                        <Home size={24} className="text-gray-500" />
                      </div>
                      <p className="text-xs font-medium text-gray-500">Delivered</p>
                      <p className="text-xs text-gray-400">Pending</p>
                    </div>
                  </div>
                </div>

                {isCOD && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <span className="font-semibold">Note:</span> Please keep ₹{orderDetails.amount || orderDetails.finalAmount} ready for cash payment on delivery.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/my-orders"
                className="bg-blue-600 text-white px-8 py-3 rounded-sm font-medium hover:bg-blue-700 transition-colors text-center shadow-md"
              >
                Track Order
              </Link>
              <Link
                to="/products"
                className="bg-white border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-sm font-medium hover:bg-blue-50 transition-colors text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : isPaymentPending ? (
          <div>
            {/* Pending Payment Message */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-50 rounded-full mb-4">
                <Clock size={48} className="text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Processing
              </h2>
              <p className="text-gray-600 text-lg">
                Your payment is being processed. This may take a few moments.
              </p>
            </div>

            {/* Processing Details Card */}
            <div className="bg-white border border-gray-200 rounded shadow-sm mb-6">
              <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-100">
                <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
              </div>
              <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <Clock size={20} className="text-yellow-600 mr-2" />
                    <span className="text-yellow-800 font-medium">Payment Processing</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-2">
                    We are confirming your payment. You will receive an email confirmation once processed.
                    Please do not refresh this page.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Order ID</p>
                    <p className="font-semibold text-gray-900">{orderDetails.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Amount</p>
                    <p className="font-semibold text-gray-900">₹{orderDetails.amount || orderDetails.finalAmount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-8 py-3 rounded-sm font-medium hover:bg-blue-700 transition-colors text-center shadow-md"
              >
                Refresh Status
              </button>
              <Link
                to="/products"
                className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-sm font-medium hover:bg-gray-50 transition-colors text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Failure Message */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-4">
                <XCircle size={48} className="text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {orderDetails.isCanceled ? 'Payment Cancelled' : 'Payment Failed'}
              </h2>
              <p className="text-gray-600 text-lg">
                {orderDetails.isCanceled 
                  ? 'Your payment was cancelled. No amount has been deducted.' 
                  : 'Unfortunately, your payment could not be processed.'}
              </p>
            </div>

            {/* Failure Details Card */}
            <div className="bg-white border border-gray-200 rounded shadow-sm mb-6">
              <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
              </div>
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800">
                    {orderDetails.isCanceled
                      ? 'You cancelled the payment process. No amount has been deducted from your account.'
                      : 'Your payment was unsuccessful. No amount has been deducted from your account.'
                    }
                  </p>
                </div>
                {orderDetails.orderId && (
                  <div className="text-sm text-gray-600">
                    <p><span className="font-medium">Reference ID:</span> {orderDetails.orderId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/checkout-customer')}
                className="bg-orange-500 text-white px-8 py-3 rounded-sm font-medium hover:bg-orange-600 transition-colors shadow-md"
              >
                {orderDetails.isCanceled ? 'Try Again' : 'Retry Payment'}
              </button>
              <Link
                to="/products"
                className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-sm font-medium hover:bg-gray-50 transition-colors text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our{' '}
            <a href="mailto:support@flipkart.com" className="text-blue-600 hover:underline font-medium">
              customer support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;