//BillingPage
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Receipt, CreditCard, Calendar, CheckCircle, XCircle, Clock, AlertCircle, FileText, DollarSign } from 'lucide-react';

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    loadBillingData();
  }, []);

const loadBillingData = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No token found');
      return;
    }

    console.log('🔄 Loading billing data...');

    // Use the detailed subscription info endpoint instead
    const response = await fetch(`${API_BASE_URL}/api/payments/current-plan`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Billing API response status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Billing data received:', result);
      
      if (result.success && result.data) {
        // Transform the data to match our component structure
        const transformedData = {
          currentSubscription: result.data.subscriptionStatus,
          paymentHistory: result.data.latestPayment ? [result.data.latestPayment] : [],
          paymentSummary: {
            totalTransactions: 1,
            successfulPayments: result.data.latestPayment?.status === 'paid' ? 1 : 0,
            failedPayments: 0,
            totalSpent: result.data.latestPayment?.amount || 0
          },
          subscriptionHistory: []
        };
        
        setBillingData(transformedData);
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to load billing data:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Error loading billing data:', error);
  } finally {
    setLoading(false);
  }
};

  const handleBack = () => {
    window.history.back();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Paid' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Failed' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' },
      created: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Created' },
    };

    const statusInfo = statusMap[status?.toLowerCase()] || statusMap.pending;
    const Icon = statusInfo.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        <Icon className="w-3 h-3" />
        {statusInfo.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    const rupees = amount / 100;
    return `₹${rupees.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const downloadInvoice = (payment) => {
    const invoiceContent = `
DENTOJI - INVOICE
=====================================
Invoice ID: ${payment.receipt || payment.orderId}
Date: ${formatDate(payment.createdAt)}
Status: ${payment.status}

BILLING DETAILS
-------------------------------------
Plan: ${payment.planType}
Amount: ${formatCurrency(payment.amount)}
Payment Method: ${payment.paymentMethod || 'N/A'}

Payment ID: ${payment.razorpayOrderId || 'N/A'}
Order ID: ${payment.orderId}

Thank you for your business!
    `;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${payment.orderId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filterPayments = (payments) => {
    if (!payments) return [];
    if (activeFilter === 'all') return payments;
    return payments.filter(p => p.status.toLowerCase() === activeFilter);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const currentSub = billingData?.currentSubscription;
  const payments = billingData?.paymentHistory || [];
  const filteredPayments = filterPayments(payments);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg mb-6 p-6">
        <div className="flex items-center gap-3 mb-4">
          <ArrowLeft
            size={20}
            className="text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
            onClick={handleBack}
          />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Billing & Payments</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your subscription and payment history</p>
          </div>
        </div>
      </div>

      {/* Current Subscription Summary */}
      {currentSub?.hasActiveSubscription && (
        <div className="bg-[#4264D0] rounded-lg shadow-sm mb-6 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Current Subscription</h2>
              </div>
              <p className="text-2xl font-bold mb-1">{currentSub.subscription.planType}</p>
              <p className="text-blue-100">
                {currentSub.subscription.daysRemaining} days remaining • 
                Expires on {formatDate(currentSub.subscription.endDate)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100 mb-1">Amount Paid</p>
              <p className="text-2xl font-bold">{formatCurrency(currentSub.subscription.amount)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Summary */}
      {billingData?.paymentSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-xl font-bold text-gray-900">{billingData.paymentSummary.totalTransactions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-xl font-bold text-gray-900">{billingData.paymentSummary.successfulPayments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-xl font-bold text-gray-900">{billingData.paymentSummary.failedPayments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(billingData.paymentSummary.totalSpent)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            {['all', 'paid', 'completed', 'pending', 'failed'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No payment records found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment, index) => (
              <div
                key={payment.id || index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{payment.planType}</h4>
                        <p className="text-sm text-gray-600">Order ID: {payment.orderId}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 ml-13">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(payment.createdAt)}
                      </span>
                      {payment.paymentMethod && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          {payment.paymentMethod}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                      {getStatusBadge(payment.status)}
                    </div>
                    
                    {(payment.status === 'paid' || payment.status === 'completed') && (
                      <button
                        onClick={() => downloadInvoice(payment)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download Invoice"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {payment.receipt && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Receipt: {payment.receipt}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription History */}
      {billingData?.subscriptionHistory && billingData.subscriptionHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription History</h3>
          <div className="space-y-3">
            {billingData.subscriptionHistory.map((sub, index) => (
              <div
                key={sub.id || index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{sub.planType}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Duration: {sub.duration} days
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(sub.amount)}</p>
                    {getStatusBadge(sub.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}