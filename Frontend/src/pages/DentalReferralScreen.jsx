import React, { useState } from 'react';
import { Copy, Filter, Calendar, Users, UserCheck, Clock, TrendingUp } from 'lucide-react';

const DentalReferralScreen = () => {
  const [selectedFilters, setSelectedFilters] = useState({
    id: '',
    doctorName: '',
    specialty: '',
    status: '',
    date: ''
  });

  const referralData = [
    {
      id: 'REF001',
      doctorName: 'Dr.Pardhu',
      email: 'pardhu@gmail.com',
      phone: '+91 9876543210',
      specialty: 'Orthodontist',
      status: 'Accepted',
      dateSent: '2024-07-25'
    },
    {
      id: 'REF002',
      doctorName: 'Dr.Juhi',
      email: 'juhi@gmail.com',
      phone: '+91 9876543211',
      specialty: 'Oral Surgeon',
      status: 'Registered',
      dateSent: '2024-07-24'
    },
    {
      id: 'REF003',
      doctorName: 'Dr.Likitha',
      email: 'likitha@gmail.com',
      phone: '+91 9876543212',
      specialty: 'Periodontist',
      status: 'Pending',
      dateSent: '2024-07-23'
    }
  ];



  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted': return 'bg-blue-100 text-blue-800';
      case 'Registered': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
    

      {/* Main Content */}
      <div className="flex-1 ml-32 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Referrals Details</h1>
            <p className="text-gray-600">Refer other doctors to DentalX and earn rewards for every successful registration</p>
          </div>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            + Invite Doctor
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-gray-600">Total Sent</h3>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">15</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-gray-600">Registered</h3>
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">08</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-gray-600">Pending</h3>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">05</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-gray-600">Success Rate</h3>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">53%</div>
          </div>
        </div>

        {/* Referral Tools Section */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Left Side - Referral Tools */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              Referral Tools
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Your referral code</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    value="DENTAL_DR_ARJUN_2025" 
                    readOnly
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 font-mono"
                  />
                  <button 
                    onClick={() => copyToClipboard("DENTAL_DR_ARJUN_2025")}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Your referral Link</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    value="https://dentoji.technoji.com/signup?ref=DENTAL_DR_ARJUN_2025" 
                    readOnly
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 text-sm"
                  />
                  <button 
                    onClick={() => copyToClipboard("https://dentoji.technoji.com/signup?ref=DENTAL_DR_ARJUN_2025")}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Referral Awards */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Referral Awards</h3>
            <ul className="space-y-3 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                ₹500 for each successful doctor registration 
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                ₹200 bonus for referrals within first 30 days
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                5% commission on referred doctor's first year fees
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Special bonuses for 5+ successful referrals
              </li>
            </ul>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-6 gap-4">
            <select className="px-4 py-2 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>ID</option>
            </select>
            <select className="px-4 py-2 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Doctor Name</option>
            </select>
            <select className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Specialty</option>
            </select>
            <select className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>All Status</option>
            </select>
            <input 
              type="date" 
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center">
              <Calendar className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Referral Information Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Referral Information</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Doctor Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Contact Information</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Specialty</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Date Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {referralData.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {referral.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {referral.doctorName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>
                        <div>{referral.email}</div>
                        <div className="text-gray-500">{referral.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {referral.specialty}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                        {referral.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {referral.dateSent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DentalReferralScreen;