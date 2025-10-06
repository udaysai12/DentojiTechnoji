import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, TrendingUp, Clock, XCircle, BarChart3 } from 'lucide-react';

const SubscriptionTables = () => {
  const [activeTab, setActiveTab] = useState('trials');
  const [freeTrialUsers, setFreeTrialUsers] = useState([]);
  const [paidUsers, setPaidUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailedUserData, setDetailedUserData] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('host_auth_token');
      const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      console.log('Fetching from:', `${baseURL}/api/host/dashboard`);
      
      const dashboardRes = await fetch(`${baseURL}/api/host/dashboard?limit=1000`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Dashboard Response Status:', dashboardRes.status);

      const dashboardData = await dashboardRes.json();
      console.log('Dashboard Data:', dashboardData);

      if (!dashboardData.success || !dashboardData.data) {
        throw new Error('Failed to fetch dashboard data');
      }

      const allUsers = dashboardData.data;
      console.log(`Total users from dashboard: ${allUsers.length}`);

      // Process each user and enrich with detailed data
      const enrichedUsers = await Promise.all(
        allUsers.map(async (user) => {
          try {
            // Fetch detailed user info including patient count
            const detailsRes = await fetch(`${baseURL}/api/host/dashboard/doctor/${user.id}`, {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            const details = await detailsRes.json();
            const subscription = details.success && details.data.subscriptions?.[0] ? details.data.subscriptions[0] : null;
            
            // Patient count now comes from the doctor details API
            const patientCount = details.success && details.data.patientCount ? details.data.patientCount : 0;
            
            const isActive = user.status === 'Active';
            
            let statusInfo = {
              status: user.status,
              isActive: isActive,
              daysRemaining: 0,
              label: user.status
            };

            if (subscription && subscription.startDate && subscription.endDate) {
              statusInfo = calculateStatusFromEndDate(subscription.endDate, subscription.startDate);
              statusInfo.status = user.status;
              statusInfo.isActive = isActive;
            }

            return {
              adminId: user.id,
              subscriptionId: user.subscriptionId || user.id,
              name: user.doctorName,
              email: user.email,
              startDate: user.startDate || subscription?.startDate,
              endDate: user.endDate || subscription?.endDate,
              planType: user.planType || subscription?.planType || 'None',
              plan: user.planType || subscription?.planType || 'None',
              amount: subscription?.amount || 0,
              status: user.status,
              patientCount,
              daysRemaining: statusInfo.daysRemaining,
              isActive: statusInfo.isActive,
              dashboardStatus: user.status,
              nextBillingDate: subscription?.endDate
            };
          } catch (err) {
            console.error(`Error processing user ${user.id}:`, err);
            return {
              adminId: user.id,
              subscriptionId: user.id,
              name: user.doctorName,
              email: user.email,
              startDate: user.startDate,
              endDate: user.endDate,
              planType: user.planType || 'None',
              plan: user.planType || 'None',
              amount: 0,
              status: user.status,
              patientCount: 0,
              daysRemaining: 0,
              isActive: user.status === 'Active',
              dashboardStatus: user.status
            };
          }
        })
      );

      // Categorize users based on planType
      const freeTrials = enrichedUsers.filter(user => 
        user.planType === 'Free Trial' || user.planType === 'free trial'
      );

      const paidSubs = enrichedUsers.filter(user => 
        user.planType === 'Monthly Plan' || 
        user.planType === 'Yearly Plan' ||
        user.plan === 'Monthly Plan' ||
        user.plan === 'Yearly Plan'
      );

      console.log(`Free Trial Users: ${freeTrials.length}`);
      console.log(`Paid Users: ${paidSubs.length}`);

      setFreeTrialUsers(freeTrials);
      setPaidUsers(paidSubs);
      
      if (freeTrials.length === 0 && paidSubs.length === 0) {
        setDebugInfo(`No subscriptions found. Total users in dashboard: ${allUsers.length}`);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setDebugInfo(`Fetch Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrial = async (userId) => {
    try {
      const token = localStorage.getItem('host_auth_token');
      const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/payments/delete-trial/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        alert('Free trial deleted successfully');
        fetchSubscriptionData();
        setShowDeleteModal(false);
        setUserToDelete(null);
      } else {
        alert(data.message || 'Failed to delete trial');
      }
    } catch (error) {
      console.error('Error deleting trial:', error);
      alert('Failed to delete trial');
    }
  };

  const fetchDoctorDetails = async (userId) => {
    try {
      setLoadingDetails(true);
      const token = localStorage.getItem('host_auth_token');
      const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${baseURL}/api/host/dashboard/doctor/${userId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setDetailedUserData(data.data);
      } else {
        console.error('Failed to fetch doctor details:', data.message);
        alert('Failed to fetch doctor details');
      }
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      alert('Error fetching doctor details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = async (user) => {
    setSelectedUser(user);
    await fetchDoctorDetails(user.adminId);
  };

  const filterData = (data) => {
    if (!searchTerm) return data;
    return data.filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const calculateStatusFromEndDate = (endDate, startDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const start = new Date(startDate);
    
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const daysFromStart = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return {
        status: 'Active',
        label: `${daysFromStart}/${totalDays} Days`,
        statusClass: 'bg-green-50 text-green-700',
        daysClass: 'text-gray-900',
        daysRemaining: diffDays,
        isActive: true
      };
    } else {
      const daysInactive = Math.abs(diffDays);
      return {
        status: 'Inactive',
        label: `${daysInactive} Days Inactive`,
        statusClass: 'bg-red-50 text-red-700',
        daysClass: 'text-red-600',
        daysRemaining: diffDays,
        isActive: false
      };
    }
  };

  const getStatusInfo = (user) => {
    if (user.dashboardStatus) {
      const isActive = user.dashboardStatus === 'Active';
      
      if (user.endDate && user.startDate) {
        const dateStatus = calculateStatusFromEndDate(user.endDate, user.startDate);
        return {
          ...dateStatus,
          status: user.dashboardStatus,
          isActive: isActive
        };
      }
      
      return {
        status: user.dashboardStatus,
        label: isActive ? 'Active' : 'Inactive',
        statusClass: isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
        daysClass: isActive ? 'text-gray-900' : 'text-red-600',
        isActive: isActive
      };
    }
    
    if (user.endDate && user.startDate) {
      return calculateStatusFromEndDate(user.endDate, user.startDate);
    }
    
    const daysRemaining = user.daysRemaining || 0;
    if (daysRemaining > 0) {
      return {
        status: 'Active',
        label: `${daysRemaining} Days`,
        statusClass: 'bg-green-50 text-green-700',
        daysClass: 'text-gray-900',
        daysRemaining: daysRemaining,
        isActive: true
      };
    } else {
      const daysInactive = Math.abs(daysRemaining);
      return {
        status: 'Inactive',
        label: `${daysInactive} Days Inactive`,
        statusClass: 'bg-red-50 text-red-700',
        daysClass: 'text-red-600',
        daysRemaining: daysRemaining,
        isActive: false
      };
    }
  };

  const calculateActiveUsers = (users) => {
    return users.filter(user => {
      const statusInfo = getStatusInfo(user);
      return statusInfo.isActive;
    });
  };

  const calculateInactiveUsers = (users) => {
    return users.filter(user => {
      const statusInfo = getStatusInfo(user);
      return !statusInfo.isActive;
    });
  };

  const calculateExpiringSoon = (users) => {
    return users.filter(user => {
      const statusInfo = getStatusInfo(user);
      return statusInfo.isActive && statusInfo.daysRemaining > 0 && statusInfo.daysRemaining <= 7;
    });
  };

  const allUsers = [...freeTrialUsers, ...paidUsers];
  
  const activeTrials = calculateActiveUsers(freeTrialUsers).length;
  const expiringSoon = calculateExpiringSoon(freeTrialUsers).length;
  const expiredTrials = calculateInactiveUsers(freeTrialUsers).length;
  const conversionRate = paidUsers.length > 0 ? Math.round((paidUsers.length / (paidUsers.length + freeTrialUsers.length)) * 100) : 0;
  
  const activePaidUsers = calculateActiveUsers(paidUsers);
  const inactivePaidUsers = calculateInactiveUsers(paidUsers);
  const activeMonthly = activePaidUsers.filter(u => u.plan === 'Monthly Plan').length;
  const activeYearly = activePaidUsers.filter(u => u.plan === 'Yearly Plan').length;
  const monthlyRevenue = paidUsers
    .filter(u => u.plan === 'Monthly Plan')
    .reduce((sum, u) => sum + (u.amount || 170000), 0) / 100;
  const totalRevenue = paidUsers.reduce((sum, u) => sum + (u.amount || 0), 0) / 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const filteredData = activeTab === 'trials' ? filterData(freeTrialUsers) : filterData(paidUsers);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trials & Subscriptions</h1>
            <p className="text-sm text-gray-500 mt-1">Track and manage all trial users and active subscriptions</p>
          </div>
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
            R
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {activeTab === 'trials' ? (
            <>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium">Active Trials</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activeTrials}</p>
                  </div>
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium">Expiring Soon</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{expiringSoon}</p>
                  </div>
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium">Inactive Trials</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{expiredTrials}</p>
                  </div>
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{conversionRate}%</p>
                  </div>
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activePaidUsers.length}</p>
                  </div>
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium">Inactive Subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{inactivePaidUsers.length}</p>
                  </div>
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium">Monthly / Yearly</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activeMonthly} / {activeYearly}</p>
                  </div>
                  <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center">
                    <Clock className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Doctor/ Clinic Information</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-4 px-4 py-2 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tab"
                      value="trials"
                      checked={activeTab === 'trials'}
                      onChange={(e) => setActiveTab(e.target.value)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">Trials</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tab"
                      value="subscriptions"
                      checked={activeTab === 'subscriptions'}
                      onChange={(e) => setActiveTab(e.target.value)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">Subscriptions</span>
                  </label>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by Doctor/Clinic name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-80"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[18%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead className="text-center border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                    Doctor Name
                  </th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                    {activeTab === 'trials' ? 'Trial Start' : 'Start Date'}
                  </th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                    {activeTab === 'trials' ? 'Trial Expiry' : 'Next Billing'}
                  </th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                    Status Days
                  </th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                    {activeTab === 'trials' ? 'Trial' : 'Plan'}
                  </th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="text-gray-500 mb-2">
                        No {activeTab === 'trials' ? 'trial' : 'subscription'} users found
                      </div>
                      {debugInfo && (
                        <div className="text-xs text-red-600 mt-2 max-w-2xl mx-auto">
                          <strong>Debug Info:</strong> {debugInfo}
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((user) => {
                    const statusInfo = getStatusInfo(user);
                    return (
                      <tr key={user.subscriptionId} className="hover:bg-gray-50 transition-colors text-center">
                        <td className="px-6 py-4 text-[12px] font-medium text-gray-900 truncate">
                          {user.name}
                        </td>
                         <td className="px-6 py-4 text-[12px] font-medium text-gray-900 truncate">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 text-[12px] text-gray-600">
                          {formatDate(user.startDate)}
                        </td>
                        <td className="px-6 py-4 text-[12px] text-gray-600">
                          {formatDate(activeTab === 'trials' ? user.endDate : user.nextBillingDate || user.endDate)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[12px] font-medium whitespace-nowrap ${statusInfo.daysClass}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {activeTab === 'trials' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 whitespace-nowrap">
                              Free Trial
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${
                              user.plan === 'Monthly Plan' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {user.plan === 'Monthly Plan' ? 'Monthly' : 'Yearly'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${statusInfo.statusClass}`}>
                            {statusInfo.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewDetails(user)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {activeTab === 'trials' && (
                              <button
                                onClick={() => {
                                  setUserToDelete(user);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Trial"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Free Trial</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the free trial for <strong>{userToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTrial(userToDelete.adminId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete Trial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Subscription Details</h3>
                <p className="text-sm text-gray-500 mt-1">View clinic's current plan, type, and status</p>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setDetailedUserData(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : detailedUserData ? (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">Current Plan</label>
                    <input
                      type="text"
                      value={detailedUserData.subscriptions?.[0]?.planType || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">Doctor's Name</label>
                    <input
                      type="text"
                      value={detailedUserData.doctorName || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">Dashboard Status</label>
                    <input
                      type="text"
                      value={detailedUserData.status || selectedUser.dashboardStatus || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">Patient Count</label>
                    <input
                      type="text"
                      value={detailedUserData.patientCount || 0}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-gray-50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">Status</label>
                    <input
                      type="text"
                      value={getStatusInfo(selectedUser).status}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-gray-50 capitalize"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">Status Days</label>
                    <input
                      type="text"
                      value={getStatusInfo(selectedUser).label}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">Plan Amount</label>
                    <input
                      type="text"
                      value={detailedUserData.subscriptions?.[0]?.amount 
                        ? `₹${(detailedUserData.subscriptions[0].amount / 100).toLocaleString('en-IN')}` 
                        : '₹0'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">Email Address</label>
                    <input
                      type="text"
                      value={detailedUserData.email || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">Phone Number</label>
                    <input
                      type="text"
                      value={detailedUserData.phone || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">Clinic's Name</label>
                    <input
                      type="text"
                      value={detailedUserData.clinicName || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">Clinic Address</label>
                    <input
                      type="text"
                      value={detailedUserData.clinicLocation || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">Education Qualification</label>
                    <input
                      type="text"
                      value={detailedUserData.qualification || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">
                      {detailedUserData.subscriptions?.[0]?.planType === 'Free Trial' ? 'Trial Start Date' : 'Subscription Start Date'}
                    </label>
                    <input
                      type="text"
                      value={detailedUserData.subscriptions?.[0]?.startDate 
                        ? formatDate(detailedUserData.subscriptions[0].startDate)
                        : 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">
                      {detailedUserData.subscriptions?.[0]?.planType === 'Free Trial' ? 'Trial End Date' : 'Subscription End Date'}
                    </label>
                    <input
                      type="text"
                      value={detailedUserData.subscriptions?.[0]?.endDate 
                        ? formatDate(detailedUserData.subscriptions[0].endDate)
                        : 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">Plan Type</label>
                    <input
                      type="text"
                      value={detailedUserData.subscriptions?.[0]?.planType || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-gray-50 capitalize"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                No details available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionTables; 