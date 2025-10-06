// import React, { useState, useEffect } from "react";
// import { ArrowLeft, Check, Crown, Sparkles, Zap, Shield, Star, AlertCircle, User, CreditCard, Clock, Loader2, RefreshCw, Phone, Mail, Globe, Award } from "lucide-react";

// export default function EnhancedPricingComponent() {
//     const [isProcessingPayment, setIsProcessingPayment] = useState(false);
//     const [selectedPlan, setSelectedPlan] = useState(null);
//     const [subscriptionStatus, setSubscriptionStatus] = useState(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [razorpayLoaded, setRazorpayLoaded] = useState(false);
//     const [plans, setPlans] = useState([]);
//     const [error, setError] = useState(null);
//     const [retryCount, setRetryCount] = useState(0);
//     const [redirecting, setRedirecting] = useState(false);
    
//     // FIXED: Add hospital existence check
//     const [hasExistingHospital, setHasExistingHospital] = useState(false);
//     const [isNewAdmin, setIsNewAdmin] = useState(true);
    
//     const [userDetails, setUserDetails] = useState({
//         id: "",
//         name: "",
//         email: "",
//         phone: "",
//         qualification: ""
//     });

//     // Configuration
//     const BACKEND_URL = "http://localhost:5000";
//     const RAZORPAY_KEY = "rzp_test_R99HrubJ0gN8ko";
//     const MAX_RETRIES = 3;

//     // Enhanced toast notification system
//     const showToast = (message, type = 'info', duration = 5000) => {
//         const existingToasts = document.querySelectorAll('.custom-toast');
//         existingToasts.forEach(toast => toast.remove());

//         const toast = document.createElement('div');
//         toast.className = `custom-toast fixed top-4 right-4 p-4 rounded-xl text-white z-[9999] max-w-sm shadow-2xl transform transition-all duration-300 backdrop-blur-sm ${
//             type === 'error' ? 'bg-red-500/90' : 
//             type === 'success' ? 'bg-green-500/90' : 
//             type === 'warning' ? 'bg-yellow-500/90' : 'bg-blue-500/90'
//         }`;
        
//         const icons = {
//             error: '❌',
//             success: '✅',
//             warning: '⚠️',
//             info: 'ℹ️'
//         };

//         toast.innerHTML = `
//             <div class="flex items-start space-x-3">
//                 <span style="font-size: 16px; margin-top: 2px;">${icons[type]}</span>
//                 <div>
//                     <span style="font-size: 14px; line-height: 1.4; display: block;">${message}</span>
//                     <div class="w-full bg-white/20 rounded-full h-1 mt-3">
//                         <div class="bg-white rounded-full h-1 toast-progress" style="width: 100%; transition: width ${duration}ms linear;"></div>
//                     </div>
//                 </div>
//                 <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200 ml-2" style="font-size: 16px;">×</button>
//             </div>
//         `;
        
//         document.body.appendChild(toast);
        
//         // Start progress bar animation
//         setTimeout(() => {
//             const progressBar = toast.querySelector('.toast-progress');
//             if (progressBar) {
//                 progressBar.style.width = '0%';
//             }
//         }, 100);
        
//         setTimeout(() => {
//             if (document.body.contains(toast)) {
//                 toast.style.opacity = '0';
//                 toast.style.transform = 'translateY(-20px) scale(0.95)';
//                 setTimeout(() => {
//                     if (document.body.contains(toast)) {
//                         document.body.removeChild(toast);
//                     }
//                 }, 300);
//             }
//         }, duration);
//     };

//     // FIXED: Navigation function based on hospital existence
//     const navigateAfterPayment = () => {
//         setRedirecting(true);
        
//         if (hasExistingHospital) {
//             showToast('Redirecting to dashboard...', 'success', 2000);
//             setTimeout(() => {
//                 try {
//                     window.location.href = '/dashboard';
//                 } catch (error) {
//                     console.error('Navigation error:', error);
//                     showToast('Navigation failed. Please manually go to /dashboard', 'error');
//                     setRedirecting(false);
//                 }
//             }, 1500);
//         } else {
//             showToast('Redirecting to hospital setup...', 'success', 2000);
//             setTimeout(() => {
//                 try {
//                     window.location.href = '/hospitalform';
//                 } catch (error) {
//                     console.error('Navigation error:', error);
//                     showToast('Navigation failed. Please manually go to /hospitalform', 'error');
//                     setRedirecting(false);
//                 }
//             }, 1500);
//         }
//     };

//     // FIXED: Load user data and check hospital status
//     const loadUserData = () => {
//         try {
//             // Get admin data from localStorage
//             const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
//             const hospitalData = JSON.parse(localStorage.getItem('hospitalData') || '{}');
            
//             // Check if hospital exists from localStorage
//             const hasHospitalFromStorage = localStorage.getItem('hasExistingHospital') === 'true';
//             const hospitalExists = hospitalData._id || hospitalData.id || hasHospitalFromStorage;
            
//             console.log('Hospital check:', {
//                 hospitalData,
//                 hasHospitalFromStorage,
//                 hospitalExists
//             });

//             setHasExistingHospital(hospitalExists);
//             setIsNewAdmin(!hospitalExists);

//             const userData = {
//                 id: adminData.id || "demo_admin_123",
//                 name: adminData.name || "Dr. Sarah Johnson",
//                 email: adminData.email || "sarah.johnson@dental.com",
//                 phone: adminData.phone || "9876543210",
//                 qualification: adminData.qualification || "BDS, MDS"
//             };
            
//             setUserDetails(userData);
            
//             console.log('User status:', {
//                 isNewAdmin: !hospitalExists,
//                 hasExistingHospital: hospitalExists,
//                 adminData: userData
//             });
            
//         } catch (error) {
//             console.error('Error loading user data:', error);
//             showToast('Failed to load user profile', 'error');
            
//             // Default fallback
//             setIsNewAdmin(true);
//             setHasExistingHospital(false);
//         }
//     };

//     // Enhanced API call with retry logic
//     const apiCall = async (url, options = {}, retries = 0) => {
//         try {
//             const response = await fetch(url, {
//                 ...options,
//                 headers: {
//                     'Content-Type': 'application/json',
//                     ...options.headers
//                 }
//             });

//             if (!response.ok) {
//                 const errorData = await response.json().catch(() => ({}));
//                 throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
//             }

//             return await response.json();
//         } catch (error) {
//             if (retries < MAX_RETRIES && (error.name === 'TypeError' || error.message.includes('fetch'))) {
//                 console.warn(`API call failed, retrying... (${retries + 1}/${MAX_RETRIES})`);
//                 await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
//                 return apiCall(url, options, retries + 1);
//             }
//             throw error;
//         }
//     };

//     // FIXED: Fetch plans and filter based on hospital status
//     const fetchPlans = async () => {
//         try {
//             setIsLoading(true);
//             setError(null);
            
//             const data = await apiCall(`${BACKEND_URL}/api/payments/plans`);
            
//             if (data.success && data.plans) {
//                 let filteredPlans = data.plans;
                
//                 // FIXED: Filter out free trial for existing admins
//                 if (hasExistingHospital) {
//                     filteredPlans = data.plans.filter(plan => plan.planType !== 'Free Trial');
//                     console.log('Existing admin: Free trial filtered out');
//                 } else {
//                     console.log('New admin: All plans including free trial available');
//                 }
                
//                 const enhancedPlans = filteredPlans.map(plan => ({
//                     ...plan,
//                     icon: getIconComponent(plan.icon),
//                     formattedAmount: plan.amount > 0 ? `₹${(plan.amount / 100).toLocaleString('en-IN')}` : 'Free',
//                     isPopular: plan.popular || plan.planType === 'Monthly Plan',
//                     badge: plan.badge || (plan.popular ? 'Most Popular' : ''),
//                     benefits: plan.features || [],
//                     ctaText: plan.button || `Choose ${plan.title}`
//                 }));
                
//                 setPlans(enhancedPlans);
//                 console.log(`Loaded ${enhancedPlans.length} plans for ${hasExistingHospital ? 'existing' : 'new'} admin`);
//             } else {
//                 throw new Error('Invalid plans data structure received from server');
//             }
//         } catch (error) {
//             console.error('Error fetching plans:', error);
//             setError(error.message);
//             showToast(`Failed to load pricing plans: ${error.message}`, 'error');
//             setPlans([]);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // Check subscription status
//     const checkSubscriptionStatus = async () => {
//         try {
//             const token = localStorage.getItem('token');
//             if (!token) return;

//             const data = await apiCall(`${BACKEND_URL}/api/payments/subscription-status`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });

//             if (data.success) {
//                 setSubscriptionStatus(data.data);
//                 if (data.data?.hasActiveSubscription) {
//                     showToast(`Active ${data.data.subscription.planType} subscription found`, 'info', 3000);
//                 }
//             }
//         } catch (error) {
//             console.error('Error checking subscription:', error);
//             // Don't show error toast for subscription check as it's not critical
//         }
//     };

//     // Load Razorpay SDK
//     const loadRazorpay = () => {
//         return new Promise((resolve, reject) => {
//             if (window.Razorpay) {
//                 setRazorpayLoaded(true);
//                 resolve(true);
//                 return;
//             }

//             const script = document.createElement('script');
//             script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//             script.async = true;
            
//             script.onload = () => {
//                 if (window.Razorpay) {
//                     setRazorpayLoaded(true);
//                     resolve(true);
//                 } else {
//                     reject(new Error('Razorpay SDK failed to initialize'));
//                 }
//             };
            
//             script.onerror = () => {
//                 reject(new Error('Failed to load Razorpay SDK'));
//             };
            
//             document.head.appendChild(script);
//         });
//     };

//     // Get appropriate icon for plan
//     const getIconComponent = (iconName) => {
//         const iconMap = {
//             'Sparkles': <Sparkles className="w-6 h-6" />,
//             'Zap': <Zap className="w-6 h-6" />,
//             'Crown': <Crown className="w-6 h-6" />,
//             'Star': <Star className="w-6 h-6" />,
//             'Shield': <Shield className="w-6 h-6" />,
//             'Award': <Award className="w-6 h-6" />
//         };
//         return iconMap[iconName] || <Star className="w-6 h-6" />;
//     };

//     // FIXED: Handle free trial activation (only for new admins)
//     const handleFreeTrial = async () => {
//         if (isProcessingPayment || hasExistingHospital) return;

//         setIsProcessingPayment(true);
//         setSelectedPlan('Free Trial');

//         try {
//             const token = localStorage.getItem('token');
//             if (!token) {
//                 throw new Error('Authentication required. Please login to continue.');
//             }

//             const data = await apiCall(`${BACKEND_URL}/api/payments/create-free-trial`, {
//                 method: 'POST',
//                 headers: { 'Authorization': `Bearer ${token}` },
//                 body: JSON.stringify({
//                     adminId: userDetails.id,
//                     userDetails: userDetails
//                 })
//             });

//             if (data.success) {
//                 showToast('Free trial activated successfully! Welcome to Dentoji!', 'success');
                
//                 // FIXED: New admin goes to hospital form after free trial
//                 setTimeout(() => {
//                     navigateAfterPayment();
//                 }, 1500);
//             } else {
//                 throw new Error(data.message || 'Failed to activate free trial');
//             }
//         } catch (error) {
//             console.error('Free trial error:', error);
//             showToast(`Failed to activate free trial: ${error.message}`, 'error');
//             setIsProcessingPayment(false);
//             setSelectedPlan(null);
//         }
//     };

//     // FIXED: Handle Razorpay payment with proper navigation based on hospital status
//     const handleRazorpayPayment = async (plan) => {
//         if (isProcessingPayment || !razorpayLoaded) return;

//         if (plan.planType === 'Free Trial') {
//             return handleFreeTrial();
//         }

//         setIsProcessingPayment(true);
//         setSelectedPlan(plan.planType);

//         try {
//             const token = localStorage.getItem('token');
//             if (!token) {
//                 throw new Error('Authentication required');
//             }

//             // Create order
//             showToast('Creating payment order...', 'info', 2000);
//             const orderData = await apiCall(`${BACKEND_URL}/api/payments/create-order`, {
//                 method: 'POST',
//                 headers: { 'Authorization': `Bearer ${token}` },
//                 body: JSON.stringify({ planType: plan.planType })
//             });

//             if (!orderData.success) {
//                 throw new Error(orderData.message || 'Failed to create order');
//             }

//             // Initialize Razorpay checkout
//             const options = {
//                 key: RAZORPAY_KEY,
//                 amount: orderData.order.amount,
//                 currency: orderData.order.currency,
//                 name: 'Dentoji Practice Management',
//                 description: `${plan.title} - ${plan.description}`,
//                 order_id: orderData.order.id,
                
//                 handler: async (response) => {
//                     try {
//                         showToast('Payment successful! Verifying...', 'success', 3000);
                        
//                         const verificationData = await apiCall(`${BACKEND_URL}/api/payments/verify-payment`, {
//                             method: 'POST',
//                             headers: { 'Authorization': `Bearer ${token}` },
//                             body: JSON.stringify({
//                                 razorpay_order_id: response.razorpay_order_id,
//                                 razorpay_payment_id: response.razorpay_payment_id,
//                                 razorpay_signature: response.razorpay_signature,
//                                 planType: plan.planType
//                             })
//                         });

//                         if (verificationData.success) {
//                             showToast(`Welcome to ${plan.title}! Your subscription is now active.`, 'success');
                            
//                             // FIXED: Navigate based on hospital existence
//                             setTimeout(() => {
//                                 navigateAfterPayment();
//                             }, 2000);
//                         } else {
//                             throw new Error('Payment verification failed');
//                         }
//                     } catch (error) {
//                         console.error('Verification error:', error);
//                         showToast('Payment completed but verification failed. Please contact support.', 'warning');
//                         setIsProcessingPayment(false);
//                         setSelectedPlan(null);
//                     }
//                 },

//                 prefill: {
//                     name: userDetails.name,
//                     email: userDetails.email,
//                     contact: userDetails.phone,
//                 },

//                 theme: { color: '#3B82F6' },
                
//                 modal: {
//                     ondismiss: () => {
//                         showToast('Payment cancelled', 'info');
//                         setIsProcessingPayment(false);
//                         setSelectedPlan(null);
//                     }
//                 }
//             };

//             const rzp = new window.Razorpay(options);
//             rzp.open();

//         } catch (error) {
//             console.error('Payment error:', error);
//             showToast(`Payment failed: ${error.message}`, 'error');
//             setIsProcessingPayment(false);
//             setSelectedPlan(null);
//         }
//     };

//     // Retry mechanism for failed operations
//     const handleRetry = async () => {
//         setRetryCount(prev => prev + 1);
//         setError(null);
//         await fetchPlans();
//         await checkSubscriptionStatus();
        
//         if (!razorpayLoaded) {
//             try {
//                 await loadRazorpay();
//             } catch (error) {
//                 console.error('Retry load Razorpay failed:', error);
//             }
//         }
//     };

//     // FIXED: Initialize component with hospital check first
//     useEffect(() => {
//         const initialize = async () => {
//             // IMPORTANT: Load user data first to determine hospital status
//             loadUserData();
            
//             // Small delay to ensure hospital status is set
//             setTimeout(async () => {
//                 // Load all data in parallel after hospital status is determined
//                 const promises = [
//                     fetchPlans(),
//                     checkSubscriptionStatus(),
//                     loadRazorpay().catch(error => {
//                         console.warn('Razorpay loading failed:', error);
//                         showToast('Payment system unavailable. Some features may be limited.', 'warning', 3000);
//                     })
//                 ];

//                 try {
//                     await Promise.allSettled(promises);
//                 } catch (error) {
//                     console.error('Initialization error:', error);
//                 }
//             }, 100);
//         };

//         initialize();
//     }, []);

//     // Re-fetch plans when hospital status changes
//     useEffect(() => {
//         if (!isLoading && plans.length > 0) {
//             console.log('Hospital status changed, re-fetching plans...');
//             fetchPlans();
//         }
//     }, [hasExistingHospital]);

//     // Loading state
//     if (isLoading && retryCount === 0) {
//         return (
//             <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
//                 <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm w-full mx-4 border border-gray-100">
//                     <div className="relative mb-6">
//                         <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
//                         <div className="absolute inset-0 rounded-full bg-blue-100 animate-pulse opacity-20"></div>
//                     </div>
//                     <h3 className="text-xl font-bold text-gray-800 mb-2">Loading Pricing</h3>
//                     <p className="text-gray-600">Setting up your personalized plans...</p>
//                     <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
//                         <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     // Error state with retry
//     if (error && plans.length === 0) {
//         return (
//             <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
//                 <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md w-full border border-red-100">
//                     <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                         <AlertCircle className="w-8 h-8 text-red-600" />
//                     </div>
//                     <h3 className="text-xl font-bold text-gray-800 mb-2">Unable to Load Pricing</h3>
//                     <p className="text-gray-600 mb-4">{error}</p>
//                     <button 
//                         onClick={handleRetry}
//                         disabled={isLoading}
//                         className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
//                     >
//                         {isLoading ? (
//                             <>
//                                 <Loader2 className="w-4 h-4 animate-spin" />
//                                 Retrying...
//                             </>
//                         ) : (
//                             <>
//                                 <RefreshCw className="w-4 h-4" />
//                                 Try Again ({retryCount}/{MAX_RETRIES})
//                             </>
//                         )}
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     // Redirecting overlay
//     if (redirecting) {
//         return (
//             <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
//                 <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md w-full mx-4 border border-green-100">
//                     <div className="relative mb-6">
//                         <Loader2 className="w-12 h-12 text-green-600 mx-auto animate-spin" />
//                         <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-20"></div>
//                     </div>
//                     <h3 className="text-xl font-bold text-green-800 mb-2">Success!</h3>
//                     <p className="text-green-600 mb-4">
//                         {hasExistingHospital 
//                             ? 'Taking you to your dashboard...' 
//                             : 'Taking you to hospital setup...'}
//                     </p>
//                     <div className="mt-4 w-full bg-green-200 rounded-full h-2">
//                         <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{width: '85%'}}></div>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//             {/* Processing overlay */}
//             {isProcessingPayment && (
//                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
//                     <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm w-full mx-4 border border-gray-100">
//                         <div className="relative mb-6">
//                             <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
//                             <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-20"></div>
//                         </div>
//                         <h3 className="text-xl font-bold text-gray-800 mb-2">
//                             {selectedPlan === 'Free Trial' ? 'Activating Free Trial' : 'Processing Payment'}
//                         </h3>
//                         <p className="text-gray-600">
//                             {selectedPlan === 'Free Trial' 
//                                 ? 'Setting up your 7-day trial account...' 
//                                 : 'Please complete the payment in the popup window'}
//                         </p>
//                         <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
//                             <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             <div className="relative z-10 p-6">
//                 {/* Header */}
//                 <div className="max-w-7xl mx-auto mb-8">
//                     <div className="flex items-center gap-4 mb-8">
//                         <button className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-200 group border border-gray-100">
//                             <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
//                         </button>
//                         <div className="flex-1">
//                             <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
//                                 Choose Your Perfect Plan
//                             </h1>
//                             <p className="text-gray-600 mt-2 text-lg">Transform your dental practice with the right features for your needs</p>
//                         </div>
//                     </div>

//                     {/* FIXED: Admin status indicator */}
//                     <div className={`border rounded-2xl p-4 mb-6 shadow-lg transition-all duration-300 ${
//                         hasExistingHospital ? 'bg-blue-50/50 border-blue-200/50' : 'bg-green-50/50 border-green-200/50'
//                     }`}>
//                         <div className="flex items-center gap-3">
//                             <Shield className={`w-6 h-6 ${hasExistingHospital ? 'text-blue-600' : 'text-green-600'}`} />
//                             <div className="flex-1">
//                                 <span className={`font-semibold ${hasExistingHospital ? 'text-blue-800' : 'text-green-800'}`}>
//                                     {hasExistingHospital ? 'Existing Admin - Renewal Plans' : 'New Admin - Welcome Plans'}
//                                 </span>
//                                 <p className={`${hasExistingHospital ? 'text-blue-700' : 'text-green-700'} text-sm mt-1`}>
//                                     {hasExistingHospital 
//                                         ? 'Subscription renewal for your existing practice' 
//                                         : 'Get started with your new dental practice'}
//                                 </p>
//                             </div>
//                             <div className={`px-3 py-1 rounded-full text-xs font-medium ${
//                                 hasExistingHospital 
//                                     ? 'bg-blue-100 text-blue-800' 
//                                     : 'bg-green-100 text-green-800'
//                             }`}>
//                                 {hasExistingHospital ? 'Renewal' : 'New Setup'}
//                             </div>
//                         </div>
//                     </div>
                
//                     {/* Subscription status */}
//                     {subscriptionStatus?.hasActiveSubscription && (
//                         <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl p-6 mb-6 shadow-lg">
//                             <div className="flex items-center gap-4">
//                                 <Shield className="w-8 h-8 text-green-600" />
//                                 <div className="flex-1">
//                                     <h3 className="text-lg font-bold text-green-800">
//                                         Active Subscription: {subscriptionStatus.subscription.planType}
//                                     </h3>
//                                     <p className="text-green-700">
//                                         {subscriptionStatus.subscription.daysRemaining} days remaining • 
//                                         Expires on {new Date(subscriptionStatus.subscription.endDate).toLocaleDateString()}
//                                     </p>
//                                 </div>
//                                 {subscriptionStatus.subscription.isExpiringSoon && (
//                                     <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-medium">
//                                         <Clock className="w-4 h-4 inline mr-1" />
//                                         Expiring Soon
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     )}

//                     {/* Payment system status */}
//                     <div className={`border rounded-2xl p-4 mb-6 shadow-lg transition-all duration-300 ${
//                         razorpayLoaded ? 'bg-green-50/50 border-green-200/50' : 'bg-yellow-50/50 border-yellow-200/50'
//                     }`}>
//                         <div className="flex items-center gap-3">
//                             <Shield className={`w-6 h-6 ${razorpayLoaded ? 'text-green-600' : 'text-yellow-600'}`} />
//                             <div className="flex-1">
//                                 <span className={`font-semibold ${razorpayLoaded ? 'text-green-800' : 'text-yellow-800'}`}>
//                                     {razorpayLoaded ? 'Secure Payment System Ready' : 'Loading Payment System...'}
//                                 </span>
//                                 <p className={`${razorpayLoaded ? 'text-green-700' : 'text-yellow-700'} text-sm mt-1`}>
//                                     {razorpayLoaded ? 'SSL encrypted payments powered by Razorpay' : 'Initializing secure payment gateway...'}
//                                 </p>
//                             </div>
//                             {razorpayLoaded && (
//                                 <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
//                                     Ready
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>

//                 {/* Pricing cards */}
//                 <div className="max-w-7xl mx-auto">
//                     {plans.length === 0 ? (
//                         <div className="bg-red-50/50 border border-red-200/50 rounded-2xl p-8 text-center shadow-lg">
//                             <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//                             <h3 className="text-xl font-bold text-red-800 mb-2">No Pricing Plans Available</h3>
//                             <p className="text-red-600 mb-4">Unable to load pricing information from the server.</p>
//                             <button 
//                                 onClick={handleRetry}
//                                 className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
//                             >
//                                 Try Again
//                             </button>
//                         </div>
//                     ) : (
//                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
//                             {plans.map((plan, index) => {
//                                 const isCurrentPlan = subscriptionStatus?.hasActiveSubscription && 
//                                                     subscriptionStatus.subscription.planType === plan.planType;
//                                 const isDisabled = isProcessingPayment || (!razorpayLoaded && plan.planType !== 'Free Trial');
                                
//                                 // Enhanced color schemes for each plan
//                                 const getCardStyles = (planType) => {
//                                     switch(planType) {
//                                         case 'Free Trial':
//                                             return {
//                                                 border: 'border-emerald-300/70 hover:border-emerald-400',
//                                                 bg: 'bg-gradient-to-br from-white via-emerald-50/30 to-green-50/50 hover:from-emerald-50/40 hover:via-green-50/40 hover:to-emerald-100/60',
//                                                 iconGradient: 'from-emerald-500 via-green-500 to-teal-500',
//                                                 buttonGradient: 'from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600'
//                                             };
//                                         case 'Monthly Plan':
//                                             return {
//                                                 border: 'border-blue-300/70 hover:border-blue-400 ring-2 ring-blue-200/50',
//                                                 bg: 'bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/60 hover:from-blue-50/50 hover:via-indigo-50/50 hover:to-purple-50/40',
//                                                 iconGradient: 'from-blue-500 via-indigo-500 to-purple-500',
//                                                 buttonGradient: 'from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600'
//                                             };
//                                         case 'Yearly Plan':
//                                             return {
//                                                 border: 'border-amber-300/70 hover:border-amber-400',
//                                                 bg: 'bg-gradient-to-br from-white via-amber-50/40 to-orange-50/50 hover:from-amber-50/50 hover:via-orange-50/50 hover:to-yellow-50/40',
//                                                 iconGradient: 'from-amber-500 via-orange-500 to-yellow-500',
//                                                 buttonGradient: 'from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:via-orange-600 hover:to-yellow-600'
//                                             };
//                                         default:
//                                             return {
//                                                 border: 'border-gray-200 hover:border-gray-300',
//                                                 bg: 'bg-white hover:bg-gray-50/30',
//                                                 iconGradient: 'from-gray-500 to-gray-600',
//                                                 buttonGradient: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
//                                             };
//                                     }
//                                 };

//                                 const cardStyles = getCardStyles(plan.planType);
                                
//                                 return (
//                                     <div
//                                         key={index}
//                                         className={`relative rounded-3xl border-2 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl group ${cardStyles.border} ${cardStyles.bg} ${
//                                             isCurrentPlan ? 'ring-4 ring-green-300/60 shadow-2xl' : 'shadow-xl'
//                                         } backdrop-blur-sm transform hover:-translate-y-1`}
//                                     >
//                                         {/* Popular badge */}
//                                         {plan.isPopular && !isCurrentPlan && (
//                                             <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
//                                                 <div className={`bg-gradient-to-r ${cardStyles.iconGradient} text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-pulse`}>
//                                                     <Star className="w-4 h-4" />
//                                                     {plan.badge || 'Most Popular'}
//                                                 </div>
//                                             </div>
//                                         )}

//                                         {/* Current plan badge */}
//                                         {isCurrentPlan && (
//                                             <div className="absolute -top-4 right-4 z-10">
//                                                 <div className="bg-green-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-bounce">
//                                                     <Check className="w-4 h-4 inline mr-1" />
//                                                     Active Plan
//                                                 </div>
//                                             </div>
//                                         )}

//                                         <div className="p-8">
//                                             {/* Plan header */}
//                                             <div className="text-center mb-8">
//                                                 <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-r ${cardStyles.iconGradient} p-5 text-white shadow-xl transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300`}>
//                                                     {plan.icon}
//                                                 </div>
                                                
//                                                 <h3 className="text-2xl font-bold text-gray-900 mb-3">{plan.title}</h3>
//                                                 <p className="text-gray-600 mb-6 leading-relaxed">{plan.description}</p>

//                                                 {/* Pricing */}
//                                                 <div className="mb-6">
//                                                     <div className="flex items-baseline justify-center gap-2">
//                                                         <span className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
//                                                             {plan.price}
//                                                         </span>
//                                                         {plan.planType !== 'Free Trial' && (
//                                                             <span className="text-gray-600 text-lg font-medium">+ GST</span>
//                                                         )}
//                                                         <span className="text-gray-600 text-lg">{plan.period}</span>
//                                                     </div>
                                                    
//                                                     {plan.originalPrice && (
//                                                         <div className="flex items-center justify-center gap-3 mt-3">
//                                                             <span className="text-gray-500 line-through text-xl">{plan.originalPrice}</span>
//                                                             {plan.savings && (
//                                                                 <span className="text-green-600 font-bold text-sm bg-green-100 px-4 py-2 rounded-full shadow-sm">
//                                                                     {plan.savings}
//                                                                 </span>
//                                                             )}
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                             </div>

//                                             {/* Features list */}
//                                             <div className="space-y-4 mb-8">
//                                                 {(plan.benefits || plan.features || []).map((feature, i) => (
//                                                     <div key={i} className="flex items-start gap-4 text-gray-700 group">
//                                                         <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-green-200 transition-colors">
//                                                             <Check className="w-4 h-4 text-green-600" />
//                                                         </div>
//                                                         <span className="text-sm leading-relaxed font-medium">{feature}</span>
//                                                     </div>
//                                                 ))}
//                                             </div>

//                                             {/* CTA Button */}
//                                             <button
//                                                 onClick={() => handleRazorpayPayment(plan)}
//                                                 disabled={isDisabled || isCurrentPlan}
//                                                 className={`w-full text-white px-6 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r ${cardStyles.buttonGradient} shadow-xl hover:shadow-2xl relative overflow-hidden group`}
//                                             >
//                                                 <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                
//                                                 {isCurrentPlan ? (
//                                                     <span className="flex items-center justify-center gap-3 relative z-10">
//                                                         <Check className="w-5 h-5" />
//                                                         Current Active Plan
//                                                     </span>
//                                                 ) : isProcessingPayment && selectedPlan === plan.planType ? (
//                                                     <span className="flex items-center justify-center gap-3 relative z-10">
//                                                         <Loader2 className="w-5 h-5 animate-spin" />
//                                                         Processing...
//                                                     </span>
//                                                 ) : (
//                                                     <span className="flex items-center justify-center gap-3 relative z-10">
//                                                         <span>{plan.ctaText}</span>
//                                                         {plan.planType !== 'Free Trial' && plan.amount > 0 && (
//                                                             <span className="text-sm opacity-90 bg-white/20 px-2 py-1 rounded-full">
//                                                                 {plan.formattedAmount}
//                                                             </span>
//                                                         )}
//                                                     </span>
//                                                 )}
//                                             </button>

//                                             {/* Additional info for paid plans */}
//                                             {plan.planType !== 'Free Trial' && (
//                                                 <div className="mt-4 text-center">
//                                                     <p className="text-xs text-gray-500">
//                                                         Secure payment • Cancel anytime • 24/7 support
//                                                     </p>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     )}

                 
//                 </div>
//             </div>
//         </div>
//     );
// }

import React, { useState, useEffect } from "react";
import { ArrowLeft, Check, Crown, Sparkles, Zap, Shield, Star, AlertCircle, User, CreditCard, Clock, Loader2, RefreshCw, Phone, Mail, Globe, Award, X } from "lucide-react";

export default function EnhancedPricingComponent() {
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [plans, setPlans] = useState([]);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [redirecting, setRedirecting] = useState(false);
    const [showFreeTrialPopup, setShowFreeTrialPopup] = useState(false);
    
    // FIXED: Add hospital existence check
    const [hasExistingHospital, setHasExistingHospital] = useState(false);
    const [isNewAdmin, setIsNewAdmin] = useState(true);
    
    const [userDetails, setUserDetails] = useState({
        id: "",
        name: "",
        email: "",
        phone: "",
        qualification: ""
    });

    // Configuration
    const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}` || "http://localhost:4000";
    const RAZORPAY_KEY = "rzp_test_R99HrubJ0gN8ko";
    const MAX_RETRIES = 3;

    // Enhanced toast notification system
    const showToast = (message, type = 'info', duration = 5000) => {
        const existingToasts = document.querySelectorAll('.custom-toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `custom-toast fixed top-4 right-4 p-4 rounded-xl text-white z-[9999] max-w-sm shadow-2xl transform transition-all duration-300 backdrop-blur-sm ${
            type === 'error' ? 'bg-red-500/90' : 
            type === 'success' ? 'bg-green-500/90' : 
            type === 'warning' ? 'bg-yellow-500/90' : 'bg-blue-500/90'
        }`;
        
        const icons = {
            error: '❌',
            success: '✅',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="flex items-start space-x-3">
                <span style="font-size: 16px; margin-top: 2px;">${icons[type]}</span>
                <div>
                    <span style="font-size: 14px; line-height: 1.4; display: block;">${message}</span>
                    <div class="w-full bg-white/20 rounded-full h-1 mt-3">
                        <div class="bg-white rounded-full h-1 toast-progress" style="width: 100%; transition: width ${duration}ms linear;"></div>
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200 ml-2" style="font-size: 16px;">×</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Start progress bar animation
        setTimeout(() => {
            const progressBar = toast.querySelector('.toast-progress');
            if (progressBar) {
                progressBar.style.width = '0%';
            }
        }, 100);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-20px) scale(0.95)';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }
        }, duration);
    };

    // FIXED: Navigation function based on hospital existence
    const navigateAfterPayment = () => {
        setRedirecting(true);
        
        if (hasExistingHospital) {
            showToast('Redirecting to dashboard...', 'success', 2000);
            setTimeout(() => {
                try {
                    window.location.href = '/dashboard';
                } catch (error) {
                    console.error('Navigation error:', error);
                    showToast('Navigation failed. Please manually go to /dashboard', 'error');
                    setRedirecting(false);
                }
            }, 1500);
        } else {
            showToast('Redirecting to hospital setup...', 'success', 2000);
            setTimeout(() => {
                try {
                    window.location.href = '/hospitalform';
                } catch (error) {
                    console.error('Navigation error:', error);
                    showToast('Navigation failed. Please manually go to /hospitalform', 'error');
                    setRedirecting(false);
                }
            }, 1500);
        }
    };

    // FIXED: Load user data and check hospital status
    const loadUserData = () => {
        try {
            // Get admin data from localStorage
            const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
            const hospitalData = JSON.parse(localStorage.getItem('hospitalData') || '{}');
            
            // Check if hospital exists from localStorage
            const hasHospitalFromStorage = localStorage.getItem('hasExistingHospital') === 'true';
            const hospitalExists = hospitalData._id || hospitalData.id || hasHospitalFromStorage;
            
            console.log('Hospital check:', {
                hospitalData,
                hasHospitalFromStorage,
                hospitalExists
            });

            setHasExistingHospital(hospitalExists);
            setIsNewAdmin(!hospitalExists);

            const userData = {
                id: adminData.id || "demo_admin_123",
                name: adminData.name || "Dr. Sarah Johnson",
                email: adminData.email || "sarah.johnson@dental.com",
                phone: adminData.phone || "9876543210",
                qualification: adminData.qualification || "BDS, MDS"
            };
            
            setUserDetails(userData);
            
            console.log('User status:', {
                isNewAdmin: !hospitalExists,
                hasExistingHospital: hospitalExists,
                adminData: userData
            });
            
        } catch (error) {
            console.error('Error loading user data:', error);
            showToast('Failed to load user profile', 'error');
            
            // Default fallback
            setIsNewAdmin(true);
            setHasExistingHospital(false);
        }
    };

    // Enhanced API call with retry logic
    const apiCall = async (url, options = {}, retries = 0) => {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (retries < MAX_RETRIES && (error.name === 'TypeError' || error.message.includes('fetch'))) {
                console.warn(`API call failed, retrying... (${retries + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
                return apiCall(url, options, retries + 1);
            }
            throw error;
        }
    };

    // FIXED: Fetch plans and filter based on hospital status
    const fetchPlans = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const data = await apiCall(`${BACKEND_URL}/api/payments/plans`);
            
            if (data.success && data.plans) {
                let filteredPlans = data.plans;
                
                // FIXED: Filter out free trial for existing admins
                if (hasExistingHospital) {
                    filteredPlans = data.plans.filter(plan => plan.planType !== 'Free Trial');
                    console.log('Existing admin: Free trial filtered out');
                } else {
                    console.log('New admin: All plans including free trial available');
                }
                
                const enhancedPlans = filteredPlans.map(plan => ({
                    ...plan,
                    icon: getIconComponent(plan.icon),
                    formattedAmount: plan.amount > 0 ? `₹${(plan.amount / 100).toLocaleString('en-IN')}` : 'Free',
                    isPopular: plan.popular || plan.planType === 'Monthly Plan',
                    badge: plan.badge || (plan.popular ? 'Most Popular' : ''),
                    benefits: plan.features || [],
                    ctaText: plan.button || `Choose ${plan.title}`
                }));
                
                setPlans(enhancedPlans);
                console.log(`Loaded ${enhancedPlans.length} plans for ${hasExistingHospital ? 'existing' : 'new'} admin`);
            } else {
                throw new Error('Invalid plans data structure received from server');
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            setError(error.message);
            showToast(`Failed to load pricing plans: ${error.message}`, 'error');
            setPlans([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Check subscription status
    const checkSubscriptionStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const data = await apiCall(`${BACKEND_URL}/api/payments/subscription-status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (data.success) {
                setSubscriptionStatus(data.data);
                if (data.data?.hasActiveSubscription) {
                    showToast(`Active ${data.data.subscription.planType} subscription found`, 'info', 3000);
                }
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
            // Don't show error toast for subscription check as it's not critical
        }
    };

    // Load Razorpay SDK
    const loadRazorpay = () => {
        return new Promise((resolve, reject) => {
            if (window.Razorpay) {
                setRazorpayLoaded(true);
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            
            script.onload = () => {
                if (window.Razorpay) {
                    setRazorpayLoaded(true);
                    resolve(true);
                } else {
                    reject(new Error('Razorpay SDK failed to initialize'));
                }
            };
            
            script.onerror = () => {
                reject(new Error('Failed to load Razorpay SDK'));
            };
            
            document.head.appendChild(script);
        });
    };

    // Get appropriate icon for plan
    const getIconComponent = (iconName) => {
        const iconMap = {
            'Sparkles': <Sparkles className="w-6 h-6" />,
            'Zap': <Zap className="w-6 h-6" />,
            'Crown': <Crown className="w-6 h-6" />,
            'Star': <Star className="w-6 h-6" />,
            'Shield': <Shield className="w-6 h-6" />,
            'Award': <Award className="w-6 h-6" />
        };
        return iconMap[iconName] || <Star className="w-6 h-6" />;
    };

    // FIXED: Handle free trial activation (only for new admins)
    const handleFreeTrial = async () => {
        // Check if existing admin tries to use free trial
        if (hasExistingHospital) {
            setShowFreeTrialPopup(true);
            return;
        }

        if (isProcessingPayment) return;

        setIsProcessingPayment(true);
        setSelectedPlan('Free Trial');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required. Please login to continue.');
            }

            const data = await apiCall(`${BACKEND_URL}/api/payments/create-free-trial`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    adminId: userDetails.id,
                    userDetails: userDetails
                })
            });

            if (data.success) {
                showToast('Free trial activated successfully! Welcome to Dentoji!', 'success');
                
                // FIXED: New admin goes to hospital form after free trial
                setTimeout(() => {
                    navigateAfterPayment();
                }, 1500);
            } else {
                throw new Error(data.message || 'Failed to activate free trial');
            }
        } catch (error) {
            console.error('Free trial error:', error);
            showToast(`Failed to activate free trial: ${error.message}`, 'error');
            setIsProcessingPayment(false);
            setSelectedPlan(null);
        }
    };

    // FIXED: Handle Razorpay payment with proper navigation based on hospital status
    const handleRazorpayPayment = async (plan) => {
        if (isProcessingPayment || !razorpayLoaded) return;

        if (plan.planType === 'Free Trial') {
            return handleFreeTrial();
        }

        setIsProcessingPayment(true);
        setSelectedPlan(plan.planType);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }

            // Create order
            showToast('Creating payment order...', 'info', 2000);
            const orderData = await apiCall(`${BACKEND_URL}/api/payments/create-order`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ planType: plan.planType })
            });

            if (!orderData.success) {
                throw new Error(orderData.message || 'Failed to create order');
            }

            // Initialize Razorpay checkout
            const options = {
                key: RAZORPAY_KEY,
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: 'Dentoji Practice Management',
                description: `${plan.title} - ${plan.description}`,
                order_id: orderData.order.id,
                
                handler: async (response) => {
                    try {
                        showToast('Payment successful! Verifying...', 'success', 3000);
                        
                        const verificationData = await apiCall(`${BACKEND_URL}/api/payments/verify-payment`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                planType: plan.planType
                            })
                        });

                        if (verificationData.success) {
                            showToast(`Welcome to ${plan.title}! Your subscription is now active.`, 'success');
                            
                            // FIXED: Navigate based on hospital existence
                            setTimeout(() => {
                                navigateAfterPayment();
                            }, 2000);
                        } else {
                            throw new Error('Payment verification failed');
                        }
                    } catch (error) {
                        console.error('Verification error:', error);
                        showToast('Payment completed but verification failed. Please contact support.', 'warning');
                        setIsProcessingPayment(false);
                        setSelectedPlan(null);
                    }
                },

                prefill: {
                    name: userDetails.name,
                    email: userDetails.email,
                    contact: userDetails.phone,
                },

                theme: { color: '#4264D0' },
                
                modal: {
                    ondismiss: () => {
                        showToast('Payment cancelled', 'info');
                        setIsProcessingPayment(false);
                        setSelectedPlan(null);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Payment error:', error);
            showToast(`Payment failed: ${error.message}`, 'error');
            setIsProcessingPayment(false);
            setSelectedPlan(null);
        }
    };

    // Retry mechanism for failed operations
    const handleRetry = async () => {
        setRetryCount(prev => prev + 1);
        setError(null);
        await fetchPlans();
        await checkSubscriptionStatus();
        
        if (!razorpayLoaded) {
            try {
                await loadRazorpay();
            } catch (error) {
                console.error('Retry load Razorpay failed:', error);
            }
        }
    };

    // FIXED: Initialize component with hospital check first
    useEffect(() => {
        const initialize = async () => {
            // IMPORTANT: Load user data first to determine hospital status
            loadUserData();
            
            // Small delay to ensure hospital status is set
            setTimeout(async () => {
                // Load all data in parallel after hospital status is determined
                const promises = [
                    fetchPlans(),
                    checkSubscriptionStatus(),
                    loadRazorpay().catch(error => {
                        console.warn('Razorpay loading failed:', error);
                        showToast('Payment system unavailable. Some features may be limited.', 'warning', 3000);
                    })
                ];

                try {
                    await Promise.allSettled(promises);
                } catch (error) {
                    console.error('Initialization error:', error);
                }
            }, 100);
        };

        initialize();
    }, []);

    // Re-fetch plans when hospital status changes
    useEffect(() => {
        if (!isLoading && plans.length > 0) {
            console.log('Hospital status changed, re-fetching plans...');
            fetchPlans();
        }
    }, [hasExistingHospital]);

    // Free Trial Popup Component
    const FreeTrialPopup = () => (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-md w-full border border-gray-200 animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Trial Already Used</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                    You have already used your free trial. Please choose from our premium plans to continue using Dentoji's advanced features.
                </p>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowFreeTrialPopup(false)}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => setShowFreeTrialPopup(false)}
                        className="flex-1 px-6 py-3 bg-[#4264D0] text-white rounded-xl font-medium hover:bg-[#3854BC] transition-colors"
                    >
                        View Plans
                    </button>
                </div>
            </div>
        </div>
    );

    // Loading state
    if (isLoading && retryCount === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm w-full mx-4 border border-gray-100">
                    <div className="relative mb-6">
                        <Loader2 className="w-12 h-12 text-[#4264D0] mx-auto animate-spin" />
                        <div className="absolute inset-0 rounded-full bg-blue-100 animate-pulse opacity-20"></div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Loading Pricing</h3>
                    <p className="text-gray-600">Setting up your personalized plans...</p>
                    <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-[#4264D0] h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state with retry
    if (error && plans.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md w-full border border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Unable to Load Pricing</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={handleRetry}
                        disabled={isLoading}
                        className="bg-[#4264D0] hover:bg-[#3854BC] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Retrying...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Try Again ({retryCount}/{MAX_RETRIES})
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Redirecting overlay
    if (redirecting) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md w-full mx-4 border border-green-100">
                    <div className="relative mb-6">
                        <Loader2 className="w-12 h-12 text-green-600 mx-auto animate-spin" />
                        <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-20"></div>
                    </div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">Success!</h3>
                    <p className="text-green-600 mb-4">
                        {hasExistingHospital 
                            ? 'Taking you to your dashboard...' 
                            : 'Taking you to hospital setup...'}
                    </p>
                    <div className="mt-4 w-full bg-green-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{width: '85%'}}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            {/* Free Trial Popup */}
            {showFreeTrialPopup && <FreeTrialPopup />}

            {/* Processing overlay */}
            {isProcessingPayment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm w-full mx-4 border border-gray-100">
                        <div className="relative mb-6">
                            <Loader2 className="w-12 h-12 text-[#4264D0] mx-auto animate-spin" />
                            <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-20"></div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {selectedPlan === 'Free Trial' ? 'Activating Free Trial' : 'Processing Payment'}
                        </h3>
                        <p className="text-gray-600">
                            {selectedPlan === 'Free Trial' 
                                ? 'Setting up your 7-day trial account...' 
                                : 'Please complete the payment in the popup window'}
                        </p>
                        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-[#4264D0] h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative z-10 p-6">
                {/* Header */}
                <div className="max-w-6xl mx-auto mb-12">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-[#4264D0]/10 text-[#4264D0] px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
                            <Sparkles className="w-4 h-4" />
                            PRICING
                        </div>
                        
                        <h1 className="text-5xl font-bold text-gray-900 mb-4">
                           Simple,
                            <span className="bg-gradient-to-r from-[#4264D0] to-[#6B73FF] bg-clip-text text-transparent">transparent pricing</span>
                        </h1>

                    </div>

                    {/* FIXED: Admin status indicator */}
                    <div className={`border rounded-2xl p-4 mb-8 shadow-lg transition-all duration-300 ${
                        hasExistingHospital ? 'bg-blue-50/50 border-blue-200/50' : 'bg-green-50/50 border-green-200/50'
                    }`}>
                        <div className="flex items-center gap-3">
                            <Shield className={`w-6 h-6 ${hasExistingHospital ? 'text-blue-600' : 'text-green-600'}`} />
                            <div className="flex-1">
                                <span className={`font-semibold ${hasExistingHospital ? 'text-blue-800' : 'text-green-800'}`}>
                                    {hasExistingHospital ? 'Existing Admin - Renewal Plans' : 'New Admin - Welcome Plans'}
                                </span>
                                <p className={`${hasExistingHospital ? 'text-blue-700' : 'text-green-700'} text-sm mt-1`}>
                                    {hasExistingHospital 
                                        ? 'Subscription renewal for your existing practice' 
                                        : 'Get started with your new dental practice'}
                                </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                hasExistingHospital 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                            }`}>
                                {hasExistingHospital ? 'Renewal' : 'New Setup'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing cards */}
                <div className="max-w-6xl mx-auto">
                    {plans.length === 0 ? (
                        <div className="bg-red-50/50 border border-red-200/50 rounded-2xl p-8 text-center shadow-lg">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-red-800 mb-2">No Pricing Plans Available</h3>
                            <p className="text-red-600 mb-4">Unable to load pricing information from the server.</p>
                            <button 
                                onClick={handleRetry}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            {plans.map((plan, index) => {
                                const isCurrentPlan = subscriptionStatus?.hasActiveSubscription && 
                                                    subscriptionStatus.subscription.planType === plan.planType;
                                const isDisabled = isProcessingPayment || (!razorpayLoaded && plan.planType !== 'Free Trial');
                                
                                // Get plan specific styling
                                const getPlanConfig = (planType) => {
                                    switch(planType) {
                                        case 'Free Trial':
                                            return {
                                                planId: '01',
                                                planCategory: 'Free Trial',
                                                planName: '7 - Day ',
                                                planSuffix: 'Free Trial',
                                                tagline: 'Try all premium features for free',
                                                buttonText: 'Free Trial',
                                                gradient: 'from-[#4264D0]/10 to-blue-50',
                                                borderColor: 'border-blue-200',
                                                buttonStyle: 'bg-[#4264D0] hover:bg-[#3854BC]',
                                                accentColor: 'text-blue-600'
                                            };
                                        case 'Monthly Plan':
                                            return {
                                                planId: '02',
                                                planCategory: 'Standard',
                                                planName: 'Monthly Plan',
                                                planSuffix: '+ GST',
                                                tagline: 'Perfect for short-term usage',
                                                buttonText: 'Monthly Plan -1700',
                                                gradient: 'from-[#4264D0]/10 to-blue-50',
                                                borderColor: 'border-[#4264D0]/30',
                                                buttonStyle: 'bg-[#4264D0] hover:bg-[#3854BC]',
                                                accentColor: 'text-[#4264D0]',
                                               
                                            };
                                        case 'Yearly Plan':
                                            return {
                                                planId: '03',
                                                planCategory: 'premium',
                                                planName: 'Yearly Plan',
                                                planSuffix: '+ GST',
                                                tagline: 'Best value for regular practice',
                                                buttonText: 'yearly plan -18,000',
                                                gradient: 'from-[#4264D0]/10 to-blue-50',
                                                borderColor: 'border-[#4264D0]/30',
                                                buttonStyle: 'bg-[#4264D0] hover:bg-[#3854BC]',
                                                accentColor: 'text-blue-600',
                                                 isPopular: true,
                                                badge: ' premium'
                                            };
                                        default:
                                            return {
                                                planId: '01',
                                                planCategory: 'Standard',
                                                planName: 'Basic',
                                                planSuffix: 'plan',
                                                tagline: 'Perfect for getting started',
                                                buttonText: 'yearly plan',
                                                gradient: 'from-gray-50 to-white',
                                                borderColor: 'border-gray-200',
                                                buttonStyle: 'bg-[#4264D0] hover:bg-[#3854BC]',
                                                accentColor: 'text-[#4264D0]'
                                            };
                                    }
                                };

                                const config = getPlanConfig(plan.planType);
                                
                                return (
                                    <div
                                        key={index}
                                        className={`relative rounded-3xl border-2 transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl group bg-gradient-to-br ${config.gradient} ${config.borderColor} ${
                                            isCurrentPlan ? 'ring-4 ring-green-300/60 shadow-2xl' : 'shadow-xl hover:shadow-2xl'
                                        } ${config.isPopular ? 'ring-2 ring-[#4264D0]/20' : ''} backdrop-blur-sm transform hover:-translate-y-2`}
                                        style={{
                                            animationDelay: `${index * 100}ms`
                                        }}
                                    >
                                        {/* Popular badge */}
                                        {config.isPopular && !isCurrentPlan && (
                                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                                                <div className="bg-gradient-to-r from-[#4264D0] to-[#6B73FF] text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce">
                                                    {config.badge}
                                                </div>
                                            </div>
                                        )}

                                        {/* Current plan badge */}
                                        {isCurrentPlan && (
                                            <div className="absolute -top-4 right-4 z-10">
                                                <div className="bg-green-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-pulse">
                                                    <Check className="w-4 h-4 inline mr-1" />
                                                    Active Plan
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-8 h-full flex flex-col">
                                            {/* Plan header */}
                                            <div className="mb-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className={`text-sm font-medium ${config.accentColor}`}>
                                                        {config.planId}. {config.planCategory}
                                                    </span>
                                                   
                                                </div>
                                                
                                                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                                                    {config.planName}<span className="text-gray-400">{config.planSuffix}</span>
                                                </h3>
                                                <p className="text-gray-600 text-lg">{config.tagline}</p>
                                            </div>

                                            {/* Pricing */}
                                            <div className="mb-8">
                                                <div className="flex items-baseline gap-1 mb-2">
                                                    <span className="text-5xl font-bold text-gray-900">
                                                        {plan.planType === 'Yearly Plan' ? '₹18,000' : plan.formattedAmount === 'Free' ? '₹0' : plan.formattedAmount}
                                                    </span>
                                                    <span className="text-gray-500 text-lg">
                                                        {plan.planType === 'Free Trial' ? '' : '/mo'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    {plan.planType === 'Free Trial' ? '7-day trial' : 
                                                     plan.planType === 'Yearly Plan' ? 'Starting from' : 'Pause or cancel anytime'}
                                                </p>
                                                
                                                {plan.originalPrice && plan.planType !== 'Yearly Plan' && (
                                                    <div className="mt-2">
                                                        <span className="text-gray-500 line-through text-sm mr-2">{plan.originalPrice }</span>
                                                        {plan.savings && (
                                                            <span className="text-green-600 font-bold text-sm bg-green-100 px-2 py-1 rounded-full">
                                                                {plan.savings}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Features list */}
                                            <div className="flex-1 mb-8">
                                                <div className="space-y-3">
                                                    {(plan.benefits || plan.features || []).slice(0, 6).map((feature, i) => (
                                                        <div key={i} className="flex items-start gap-3 text-gray-700">
                                                            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                            <span className="text-sm leading-relaxed">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* CTA Button */}
                                            <div className="mt-auto">
                                                <button
                                                    onClick={() => handleRazorpayPayment(plan)}
                                                    disabled={isDisabled || isCurrentPlan}
                                                    className={`w-full text-white px-6 py-4 rounded-2xl cursor-pointer font-bold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${config.buttonStyle} shadow-lg hover:shadow-xl relative overflow-hidden group/btn`}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                                                    
                                                    {isCurrentPlan ? (
                                                        <span className="flex items-center justify-center gap-2 relative z-10">
                                                            <Check className="w-5 h-5" />
                                                            Current Active Plan
                                                        </span>
                                                    ) : isProcessingPayment && selectedPlan === plan.planType ? (
                                                        <span className="flex items-center justify-center gap-2 relative z-10">
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Processing...
                                                        </span>
                                                    ) : (
                                                        <span className="relative z-10">{config.buttonText}</span>
                                                    )}
                                                </button>

                                                {/* Additional info */}
                                                <div className="mt-3 text-center">
                                                    <p className="text-xs text-gray-500">
                                                        {plan.planType === 'Free Trial' ? 'No credit card required' : 
                                                         plan.planType === 'Yearly Plan' ? 'best plan for this platform' : 
                                                         'Secure payment • Cancel anytime'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Climate commitment */}
                    <div className="text-center mt-12">
                        <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 rounded-full px-6 py-3">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-green-800 text-sm font-medium">
                                Dentoji contributes 1% of your subscription to remove CO₂ from the atmosphere through Stripe Climate.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}