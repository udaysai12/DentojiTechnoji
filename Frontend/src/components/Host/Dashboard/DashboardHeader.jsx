// src/components/Host/Dashboard/DashboardHeader.jsx
import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Users, Clock, DollarSign } from 'lucide-react';

const DashboardHeader = () => {
  const [stats, setStats] = useState({
    totalClinics: 0,
    activeSubscriptions: 0,
    trialClinics: 0,
    totalRevenue: '0'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHeaderStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('host_auth_token');
      
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/host/dashboard/header-stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch stats');
      }

      if (result.success) {
        setStats(result.stats);
      } else {
        throw new Error(result.message || 'Failed to load statistics');
      }
    } catch (err) {
      console.error('Error fetching header stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeaderStats();
    
    // Optional: Refresh stats every 5 minutes
    const interval = setInterval(fetchHeaderStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const statsArray = [
    {
      title: "Total Clinics Onboarded",
      value: loading ? "..." : stats.totalClinics.toLocaleString(),
      icon: Users,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500"
    },
    {
      title: "Active Subscriptions", 
      value: loading ? "..." : stats.activeSubscriptions.toLocaleString(),
      icon: TrendingUp,
      bgColor: "bg-green-50",
      iconColor: "text-green-500"
    },
    {
      title: "Trial Clinics",
      value: loading ? "..." : stats.trialClinics.toLocaleString(),
      icon: Clock,
      bgColor: "bg-yellow-50", 
      iconColor: "text-yellow-500"
    },
    {
      title: "Total Revenue",
      value: loading ? "..." : `₹${stats.totalRevenue}`,
      icon: DollarSign,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-500"
    }
  ];

  return (
    <div className="bg-gray-100 rounded-xl shadow-sm p-6 mb-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Clinic Onboarding Dashboard</h1>
          <p className="text-gray-500 text-sm">Monitor clinic registrations, track trial to subscription progress, and manage doctor activity at a glance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <button
            onClick={fetchHeaderStats}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Profile Avatar */}
          <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-medium text-lg">
            R
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          Failed to load statistics: {error}
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsArray.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="bg-white rounded-xl p-4 h-24 flex items-center justify-between border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1 leading-tight">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center ml-3 flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardHeader;