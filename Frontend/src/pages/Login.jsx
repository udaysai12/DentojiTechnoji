//login.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Clock, Shield } from 'lucide-react';
import logo from '../assets/icons/dentoji_image.png'
import teeth from '../assets/icons/teeth.png'
//import teeth_1 from '../assets/icons/teeth_1.jpg'


export default function EnhancedLoginWithSubscriptionCheck() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const navigate = useNavigate();
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [loginErrors, setLoginErrors] = useState({});


  // After successful login and token storage, add this:


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear errors when user types
    if (loginErrors[name]) {
      setLoginErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Get backend URL from environment or default
  const getBackendUrl = () => {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  };

  // Simple navigation function with immediate fallback
  const handleNavigation = (path, options = {}) => {
    console.log('Navigating to:', path);
    
    // Immediate fallback for testing - can be removed once router is confirmed working
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode - using window.location');
      window.location.href = path;
      return;
    }
    
    try {
      navigate(path, { replace: true, ...options });
    } catch (error) {
      console.error('React Router navigation failed, using window.location:', error);
      window.location.href = path;
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateLoginForm = () => {
    const errors = {};
    
    if (!loginData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(loginData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!loginData.password) {
      errors.password = 'Password is required';
    } else if (loginData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const showToast = (message, type = 'info') => {
    const existingToasts = document.querySelectorAll('.custom-toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `custom-toast fixed top-4 right-4 p-4 rounded-lg text-white z-50 max-w-sm shadow-xl transform transition-all duration-300 ${
      type === 'error' ? 'bg-red-500' : 
      type === 'success' ? 'bg-green-500' : 
      type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`;
    
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <span>${icon}</span>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }
    }, 5000);
  };

  // Check if receptionist's doctor has active subscription
  const checkReceptionistDoctorSubscription = async (token, hospitalId) => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/payment/receptionist-doctor-subscription/${hospitalId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        console.error('Doctor subscription check failed');
        return {
          hasActiveSubscription: false,
          message: 'Unable to verify doctor subscription status'
        };
      }
    } catch (error) {
      console.error('Doctor subscription check error:', error);
      return {
        hasActiveSubscription: false,
        message: 'Network error checking doctor subscription'
      };
    }
  };

  // FIXED: Enhanced login with proper expired subscription handling
  const handleLoginWithSubscriptionCheck = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    console.log('Starting login with subscription check...');
    
    if (!validateLoginForm()) {
      showToast('Please check your email and password', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const requestData = {
        email: loginData.email.trim().toLowerCase(),
        password: loginData.password,
      };

      const backendUrl = getBackendUrl();
      
      // Step 1: Authenticate user
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();
      console.log('Login response data:', data);
      
      if (res.ok) {
        // Determine user role and get user data
        let user = null;
        let userRole = null;
        let welcomeName = '';

        if (data.admin) {
          user = data.admin;
          userRole = 'Admin';
          welcomeName = user.name;
        } else if (data.receptionist) {
          user = data.receptionist;
          userRole = 'Receptionist';
          welcomeName = user.name;
        }

        if (!user) {
          console.error('No user data found in response');
          showToast('Login response format error', 'error');
          return;
        }

        console.log(`${userRole} login successful:`, welcomeName);

        // Successful login with full access
        if (userRole === 'Admin') {
          // Admin successful login
          showToast(`Welcome back, ${welcomeName}!`, 'success');
          
          // Store Admin data in localStorage
          localStorage.setItem('token', data.token);
          localStorage.setItem('adminData', JSON.stringify({
            ...user,
            subscriptionStatus: data.subscription ? 'active' : 'inactive',
            currentPlan: data.subscription?.planType || 'none',
            hasActiveSubscription: !!data.subscription,
            subscriptionDaysRemaining: data.subscription?.daysRemaining || 0
          }));

          if (data.hospital) {
            localStorage.setItem('hospitalData', JSON.stringify(data.hospital));
          }

          if (data.subscription) {
            localStorage.setItem('subscriptionData', JSON.stringify(data.subscription));
            setSubscriptionStatus(data.subscription);
          }

          setRedirectMessage('Loading dashboard...');
          setIsRedirecting(true);
          
          setTimeout(() => {
            window.location.href = data.redirectTo || '/dashboard';

          }, 2000);

        } else if (userRole === 'Receptionist') {
          // Receptionist successful login
          showToast(`Welcome back, ${welcomeName}!`, 'success');
          
          // Store Receptionist data in localStorage
          localStorage.setItem('token', data.token);
          localStorage.setItem('receptionistData', JSON.stringify(user));

          if (data.hospital) {
            localStorage.setItem('hospitalData', JSON.stringify(data.hospital));
          }

          // Add additional subscription check for receptionist
          // const hospitalId = data.hospital?._id;
          // if (hospitalId) {
          //   const subscriptionCheck = await checkReceptionistDoctorSubscription(data.token, hospitalId);
          //   if (!subscriptionCheck.hasActiveSubscription) {
          //     showToast(subscriptionCheck.message || "Your doctor's active plan has ended. Please contact your doctor.", 'warning');
          //     localStorage.removeItem('token');
          //     localStorage.removeItem('receptionistData');
          //     localStorage.removeItem('hospitalData');
          //     setIsLoading(false);
          //     return;
          //   }
          // }

          setRedirectMessage('Loading patients page...');
          setIsRedirecting(true);
          
          setTimeout(() => {
             window.location.href = data.redirectTo || '/patients';
          }, 2000);
        }

        else if (res.status === 402) {
          // Payment/Subscription required scenarios
          if (userRole === 'Admin') {
            // Admin needs subscription
            showToast('Please choose a subscription plan to continue', 'warning');
            localStorage.setItem('token', data.token);
            localStorage.setItem('adminData', JSON.stringify({
              ...user,
              needsSubscription: true
            }));
           
            setRedirectMessage('Redirecting to pricing page...');
            setIsRedirecting(true);
           
            setTimeout(() => {
             window.location.href = '/pricing';
            }, 2000);
          } else if (userRole === 'Receptionist') {
            // Receptionist's doctor subscription expired
            showToast("Your doctor's active plan has ended. Please contact your doctor.", 'warning');
            localStorage.removeItem('token');
            localStorage.removeItem('receptionistData');
            localStorage.removeItem('hospitalData');
          }
 
        } else if (res.status === 412) {
          // Hospital setup required (Admin only)
          if (userRole === 'Admin') {
            showToast('Please complete your hospital setup', 'info');
            localStorage.setItem('token', data.token);
            localStorage.setItem('adminData', JSON.stringify({
              ...user,
              hasSubscription: true,
              requiresHospitalSetup: true
            }));
 
            if (data.subscription) {
              localStorage.setItem('subscriptionData', JSON.stringify(data.subscription));
              setSubscriptionStatus(data.subscription);
            }
           
            setRedirectMessage('Redirecting to hospital setup...');
            setIsRedirecting(true);
           
            setTimeout(() => {
               window.location.href = '/hospitalform';

            }, 2000);
          }
        }


        // Reset form
        setLoginData({
          email: "",
          password: "",
          rememberMe: false
        });
        setLoginErrors({});
        
      } else {
        console.error("Login failed:", data);
        
        // Handle different error scenarios
        if (res.status === 401) {
          showToast("Invalid email or password. Please try again.", 'error');
          setLoginErrors({ email: "Invalid credentials" });
        } else if (res.status === 402) {
          // FIXED: Handle subscription required scenario properly
          if (data.token && data.admin) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('adminData', JSON.stringify({
              ...data.admin,
              subscriptionExpired: true,
              needsSubscription: true
            }));
            
            // FIXED: Store hospital data if exists for expired subscription scenario
            if (data.hospital) {
              localStorage.setItem('hospitalData', JSON.stringify(data.hospital));
              localStorage.setItem('hasExistingHospital', 'true');
              console.log('Stored existing hospital data for pricing page');
            } else {
              localStorage.setItem('hasExistingHospital', 'false');
            }
            
            showToast(data.message || 'Subscription expired. Redirecting to pricing...', 'warning');
            
            setRedirectMessage('Redirecting to subscription plans...');
            setIsRedirecting(true);
            
            setTimeout(() => {
              window.location.href = '/pricing';
            }, 2000);
            
          } else if (data.receptionist) {
            // Receptionist doctor subscription issue
            showToast(data.message || "Your doctor's active plan has ended. Please contact your doctor.", 'warning');
          } else {
            showToast(data.message || "Subscription required", 'error');
          }
        } else if (res.status === 412) {
          // Handle hospital setup required scenario (Admin only)
          if (data.token && data.admin) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('adminData', JSON.stringify({
              ...data.admin,
              hasSubscription: true,
              requiresHospitalSetup: true
            }));
            
            if (data.subscription) {
              localStorage.setItem('subscriptionData', JSON.stringify(data.subscription));
              setSubscriptionStatus(data.subscription);
            }
            
            showToast(data.message || 'Hospital setup required', 'info');
            
            setRedirectMessage('Redirecting to hospital setup...');
            setIsRedirecting(true);
            
            setTimeout(() => {
               window.location.href = '/hospitalform';
            }, 2000);
          } else {
            showToast(data.message || "Hospital setup required", 'error');
          }
        } else if (res.status === 423) {
          showToast(data.message || "Account temporarily locked", 'error');
        } else if (res.status === 403) {
          showToast(data.message || "Account inactive", 'error');
        } else if (res.status === 500) {
          showToast("Server error. Please try again later.", 'error');
        } else {
          showToast(data.message || "Login failed. Please try again.", 'error');
        }
      }
    } catch (error) {
      console.error("Login network error:", error);
      showToast("Network error. Please check your connection and try again.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormDisabled = isLoading || isRedirecting;

  //Login.jsx
  // Login.jsx
return (
  <div className="min-h-screen bg-[#ECF3FF] flex items-center justify-center p-4 relative"
    style={{ 
      backgroundImage: `url(${teeth})`, 
      backgroundSize: 'cover', 
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat'
    }}
  >
    {/* Background overlay ONLY */}
    <div className="absolute inset-0 bg-white opacity-75 z-0"></div>
  
    {/* Redirecting Overlay */}
    {isRedirecting && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center shadow-xl max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-800 font-medium mb-2">Login successful!</p>
          <p className="text-sm text-gray-600 mb-3">{redirectMessage}</p>
          
          {/* Subscription Status Indicator */}
          {subscriptionStatus && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                <span>
                  {subscriptionStatus.hasActiveSubscription 
                    ? `${subscriptionStatus.planType} Active` 
                    : 'Setup Required'}
                </span>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            Redirecting in a moment...
          </div>
        </div>
      </div>
    )}

    {/* Main Login Interface - Desktop Layout */}
    <div className="hidden md:flex w-full max-w-7xl p-6 relative z-10">
      {/* Left Section - Updated to match Signup page */}
      <div className="w-[60%] p-8 pl-0 text-white">
        {/* Empty header section for spacing consistency */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-8">
            {/* Removed logo and text to match signup page */}
          </div>
        </div>

        {/* Main content - matches signup page structure */}
        <div className="mt-12 mb-10 -ml-31">
          <h2 className="text-5xl font-bold mb-1 text-gray-900">Welcome to</h2>
          <img src={logo} alt="" className="w-[500px]" />
          
          <h2 className="text-xl text-gray-500 font-bold mb-6 -mt-10 ml-3">Patient Management System</h2>

          {/* Feature list - Add this section */}
<div className="mt-8 ml-3 space-y-3">
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <p className="text-sm text-gray-600">Keep patient records organized</p>
  </div>
  
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <p className="text-sm text-gray-600">Access to Interactive tooth chart</p>
  </div>
  
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <p className="text-sm text-gray-600">Gain insights into patient data</p>
  </div>
  
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <p className="text-sm text-gray-600">Manage appointments with patients</p>
  </div>
  
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <p className="text-sm text-gray-600">Manage lab records</p>
  </div>
</div>
        </div>
      </div>

      {/* Right Section - Desktop Login Form */}
      <div className="w-[40%] p-8 flex items-center justify-center relative z-10 ml-60">
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 min-h-[480px] flex flex-col justify-center shadow-lg border border-gray-100">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h3>
            <p className="text-gray-600 text-sm">Access your dental dashboard</p>
            
            {/* Role-based access indicator */}
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-600">
              <Shield className="w-3 h-3" />
              <span>Admin & Receptionist Access</span>
            </div>
          </div>

          <form onSubmit={handleLoginWithSubscriptionCheck} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1">
                Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  disabled={isFormDisabled}
                  className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg focus:ring-3 focus:ring-blue-100 focus:border-blue-500 outline-none text-gray-800 placeholder-gray-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors ${
                    loginErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
              </div>
              {loginErrors.email && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {loginErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={loginData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  disabled={isFormDisabled}
                  className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-lg focus:ring-3 focus:ring-blue-100 focus:border-blue-500 outline-none text-gray-800 placeholder-gray-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors ${
                    loginErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isFormDisabled}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {loginErrors.password && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {loginErrors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={loginData.rememberMe}
                  onChange={handleInputChange}
                  disabled={isFormDisabled}
                  className="w-3 h-3 text-blue-600 border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="ml-2 text-xs text-gray-700">Remember Me</span>
              </label>
              <button
                type="button"
                disabled={isFormDisabled}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                onClick={() => navigate('/forgot-password')}
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isFormDisabled}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 text-sm rounded-lg transition-all duration-200 focus:ring-3 focus:ring-blue-100 flex items-center justify-center ${
                isFormDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg transform hover:scale-[1.02]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying Access...
                </>
              ) : isRedirecting ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Redirecting...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-700 text-sm">
              Don't have an account?{" "}
              <button
                onClick={() => handleNavigation("/signup")}
                disabled={isFormDisabled}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed"
                type="button"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Mobile Layout - Unchanged */}
    <div className="flex md:hidden w-full max-w-sm mx-auto relative z-10">
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 w-full">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-current" />
            </div>
            <h1 className="text-xl font-bold text-blue-600">DENTOJI</h1>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Sign In</h3>
          <p className="text-gray-600 text-sm">Access your dental dashboard</p>
        </div>

        <form onSubmit={handleLoginWithSubscriptionCheck} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-800 mb-1">
              Email Address
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
                disabled={isFormDisabled}
                className={`w-full pl-9 pr-3 py-3 text-sm border rounded-lg focus:ring-3 focus:ring-blue-100 focus:border-blue-500 outline-none text-gray-800 placeholder-gray-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors ${
                  loginErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {loginErrors.email && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {loginErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-800 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={loginData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                disabled={isFormDisabled}
                className={`w-full pl-9 pr-10 py-3 text-sm border rounded-lg focus:ring-3 focus:ring-blue-100 focus:border-blue-500 outline-none text-gray-800 placeholder-gray-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors ${
                  loginErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isFormDisabled}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {loginErrors.password && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {loginErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isFormDisabled}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 text-sm rounded-lg transition-all duration-200 focus:ring-3 focus:ring-blue-100 flex items-center justify-center ${
              isFormDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </>
            ) : isRedirecting ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Redirecting...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-700 text-sm">
            Don't have an account?{" "}
            <button
              onClick={() => handleNavigation("/signup")}
              disabled={isFormDisabled}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed"
              type="button"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
);
}