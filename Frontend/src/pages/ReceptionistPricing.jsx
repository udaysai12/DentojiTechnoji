

 
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Check, Loader2 } from 'lucide-react';
 
const ReceptionistPricing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [receptionistCount, setReceptionistCount] = useState(0);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
 
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const RAZORPAY_KEY = "rzp_test_R99HrubJ0gN8ko";
 
  useEffect(() => {
    loadRazorpay();
    fetchReceptionistCount();
  }, []);
 
  const loadRazorpay = () => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }
 
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => console.error('Failed to load Razorpay');
    document.head.appendChild(script);
  };
 
  const fetchReceptionistCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/receptionists/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setReceptionistCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching count:', error);
    }
  };
 
  const handlePayment = async () => {
    if (!razorpayLoaded || isProcessing) return;
    setIsProcessing(true);
 
    try {
      const token = localStorage.getItem('token');
     
      const orderResponse = await fetch(`${BACKEND_URL}/api/receptionist-payment/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receptionistCount: receptionistCount + 1 })
      });
 
      const orderData = await orderResponse.json();
      if (!orderData.success) throw new Error(orderData.message);
 
      const options = {
        key: RAZORPAY_KEY,
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'Additional Receptionist Access',
        description: `Payment for receptionist #${receptionistCount + 1}`,
        order_id: orderData.order.razorpayOrderId,
       
        handler: async (response) => {
          try {
            const verifyResponse = await fetch(`${BACKEND_URL}/api/receptionist-payment/verify-payment`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderData.order.orderId
              })
            });
 
            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              alert('Payment successful! You can now add receptionist.');
              window.location.href = '/receptionistsignup';
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            alert('Payment completed but verification failed. Please contact support.');
          }
        },
 
        theme: { color: '#4F46E5' },
        modal: { ondismiss: () => setIsProcessing(false) }
      };
 
      const rzp = new window.Razorpay(options);
      rzp.open();
 
    } catch (error) {
      alert(`Payment failed: ${error.message}`);
      setIsProcessing(false);
    }
  };
 
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header - positioned at top left of screen */}
      <div className="mb-8">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Staff Management</span>
        </button>
      </div>
     
      <div className="max-w-md mx-auto">
 
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {/* Icon and Title */}
          <div className="text-center pt-8 pb-4">
            <div className="w-20 h-20 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Add More Receptionist</h1>
            <p className="text-sm text-gray-500 px-6">
              You're currently using {receptionistCount}/2 free receptionists.<br />
              Unlock unlimited potential for your practice.
            </p>
          </div>
 
          {/* Premium Access Card */}
          <div className="mx-6 mb-6 bg-gray-50 rounded-2xl p-6">
            <div className="text-center mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-1">Premium Access</h2>
              <p className="text-xs text-gray-500 mb-4">One-time payment for additional receptionist</p>
             
              {/* Price */}
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">₹ 299</span>
                <span className="text-sm text-gray-500 ml-1">per receptionist</span>
              </div>
             
              <div className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full inline-block">
                All inclusive
              </div>
            </div>
 
            {/* What's Included */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">What's Included:</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Instant activation after payment</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Full access to receptionist features</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Patient management capabilities</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">No recurring charges</span>
                </div>
              </div>
            </div>
 
            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={!razorpayLoaded || isProcessing}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-6 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                `Pay ₹299 & Add Receptionist`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default ReceptionistPricing;
 