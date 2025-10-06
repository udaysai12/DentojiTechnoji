//StaffManagement.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Plus, X, Activity, Clock, UserX, Ban, ChevronDown } from 'lucide-react';
import { FaEdit } from 'react-icons/fa';
import axios from 'axios';

// Import your existing components
import PageHeader from '../components/Staff/PageHeader';
import StatsCard from '../components/Staff/StatsCard';
import AddStaffModal from '../components/Staff/AddStaffModal';
import EditStaffModal from '../components/Staff/EditStaffModal';

import calendarIcon from '../assets/StaffManagement/calendar-icon.png';
import userCheckIcon from '../assets/StaffManagement/user-check-icon.png';
import receptionistIcon from '../assets/StaffManagement/receptionist.png';

const ReceptionistManagement = () => {
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState([]);
  const [filteredStaffMembers, setFilteredStaffMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hospitalId, setHospitalId] = useState('');
  const [adminId, setAdminId] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [userRole, setUserRole] = useState(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStaffMember, setSelectedStaffMember] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [staffMemberToDelete, setStaffMemberToDelete] = useState(null);

  const [filters, setFilters] = useState({
    status: 'All Status',
    search: '',
    role: 'All Roles',
    department: 'All Departments',
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;

  // Options
  const statusOptions = ['Active', 'Inactive', 'On Leave', 'Suspended'];
  const roleOptions = [
    'Doctor', 'Nurse', 'Anesthesiologist', 'Technician', 
    'Pharmacist', 'Radiologist', 'Administrative', 'Support Staff',
    'Receptionist', 'Senior Receptionist', 'Head Receptionist'
  ];
  const departmentOptions = [
    'General', 'General Dentistry', 'Oral Surgery', 'Orthodontics', 
    'Periodontics', 'Endodontics', 'Pediatric Dentistry', 'Prosthodontics',
    'Emergency', 'Reception', 'Administration', 'Support'
  ];

  // Phone number validation function
  const isValidPhoneNumber = (phone) => {
    if (!phone || phone.trim() === '') return true;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  // Initialize hospital and admin IDs
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedHospital = localStorage.getItem('hospital');
    const storedAdmin = localStorage.getItem('admin');

    if (!token) {
      toast.error('No authentication token found. Please log in.');
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const fetchedAdminId = decoded.id;
      const role = decoded.role
        ? decoded.role.charAt(0).toUpperCase() + decoded.role.slice(1).toLowerCase()
        : 'Unknown';

      setAdminId(fetchedAdminId);
      setUserRole(role);

      if (role !== 'Admin') {
        toast.error('Access denied. Only Admin users can view staff records.');
        setIsLoading(false);
        return;
      }

      if (storedHospital) {
        const hospital = JSON.parse(storedHospital);
        if (hospital._id && hospital.adminId === fetchedAdminId) {
          setHospitalId(hospital._id);
          return;
        }
      }

      const tokenHospitalId = decoded.hospitalId;
      if (tokenHospitalId) {
        setHospitalId(tokenHospitalId);
        localStorage.setItem('hospital', JSON.stringify({ _id: tokenHospitalId, adminId: fetchedAdminId }));
        return;
      }

      fetchUserProfile(token, fetchedAdminId);
    } catch (err) {
      console.error('Error decoding token:', err);
      toast.error('Invalid token');
      navigate('/login');
    }
  }, [navigate]);

  const fetchUserProfile = async (token, fetchedAdminId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      const fetchedHospitalId = data.hospital?._id;
      if (fetchedHospitalId) {
        setHospitalId(fetchedHospitalId);
        setHospitalName(data.hospital?.name || 'Unknown Hospital');
        localStorage.setItem('hospital', JSON.stringify({ _id: fetchedHospitalId, adminId: fetchedAdminId }));
        localStorage.setItem('admin', JSON.stringify({ _id: fetchedAdminId }));
      } else {
        toast.error('No hospital ID found. Please complete hospital setup.');
        navigate('/hospitalform');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      toast.error('Failed to fetch hospital ID');
      navigate('/login');
    }
  };

  // Fetch staff data from both collections and handle deduplication
  useEffect(() => {
    if (hospitalId && userRole === 'Admin') {
      fetchStaffData();
    }
  }, [hospitalId, userRole]);

  const fetchStaffData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch both staff and receptionist data
      const responses = await Promise.allSettled([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/staff/list`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/receptionists/list`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      const staffData = responses[0].status === 'fulfilled' ? responses[0].value.data : [];
      const receptionistData = responses[1].status === 'fulfilled' ? responses[1].value.data : [];

      // Create email-based maps for deduplication
      const staffByEmail = new Map();
      const receptionistByEmail = new Map();

      // Process staff data - PRESERVE ORIGINAL ROLE
      staffData.forEach((staff) => {
        staffByEmail.set(staff.email, {
          ...staff,
          name: `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
          phone: staff.phone && staff.phone !== 'N/A' ? staff.phone : '',
          role: staff.role || 'Staff',
          department: staff.department || 'General',
          source: 'staff',
          hasAccount: false,
        });
      });

      // Process receptionist data
      receptionistData.forEach((receptionist) => {
        receptionistByEmail.set(receptionist.email, {
          ...receptionist,
          name: receptionist.name,
          phone: receptionist.phone && receptionist.phone !== 'N/A' ? receptionist.phone : '',
          role: receptionist.position || 'Receptionist',
          department: 'Reception',
          source: 'receptionist',
          hasAccount: true,
        });
      });

      // Merge data with deduplication logic
      const mergedStaffMembers = [];
      const processedEmails = new Set();

      // First, add all unique staff members
      staffByEmail.forEach((staffMember, email) => {
        if (receptionistByEmail.has(email)) {
          // User exists in both collections - preserve STAFF ROLE
          const receptionist = receptionistByEmail.get(email);
          mergedStaffMembers.push({
            ...receptionist,
            role: staffMember.role,
            department: staffMember.department,
            source: 'both',
            hasAccount: true,
            staffId: staffMember._id,
            receptionistId: receptionist._id,
          });
        } else {
          // User exists only in staff collection
          mergedStaffMembers.push({
            ...staffMember,
            hasAccount: false,
          });
        }
        processedEmails.add(email);
      });

      // Add receptionists that don't have corresponding staff records
      receptionistByEmail.forEach((receptionist, email) => {
        if (!processedEmails.has(email)) {
          mergedStaffMembers.push({
            ...receptionist,
            hasAccount: true,
          });
        }
      });

      setStaffMembers(mergedStaffMembers);

      // Set hospital name
      if (staffData.length > 0 && staffData[0].hospitalId && staffData[0].hospitalId.name) {
        setHospitalName(staffData[0].hospitalId.name);
      } else if (receptionistData.length > 0 && receptionistData[0].hospital) {
        setHospitalName(receptionistData[0].hospital.name);
      }

      console.log('Merged staff data:', mergedStaffMembers);
    } catch (error) {
      console.error('Error fetching staff data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch staff data');
      setStaffMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced filtering
  useEffect(() => {
    let filtered = staffMembers;

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.name?.toLowerCase().includes(searchTerm) ||
          member.email?.toLowerCase().includes(searchTerm) ||
          (member.phone && member.phone.toLowerCase().includes(searchTerm)) ||
          member._id?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.status !== 'All Status') {
      filtered = filtered.filter((member) => member.status === filters.status);
    }

    if (filters.role !== 'All Roles') {
      filtered = filtered.filter((member) => member.role === filters.role);
    }

    if (filters.department !== 'All Departments') {
      filtered = filtered.filter((member) => member.department === filters.department);
    }

    setFilteredStaffMembers(filtered);
    setCurrentPage(1);
  }, [staffMembers, filters]);

  const stats = {
    total: staffMembers.length,
    active: staffMembers.filter((m) => m.status === 'Active').length,
    onLeave: staffMembers.filter((m) => m.status === 'On Leave').length,
    inactive: staffMembers.filter((m) => m.status === 'Inactive').length,
    doctors: staffMembers.filter((m) => m.role === 'Doctor').length,
    receptionists: staffMembers.filter((m) => m.role?.includes('Receptionist')).length,
    withAccounts: staffMembers.filter((m) => m.hasAccount).length,
    withoutAccounts: staffMembers.filter((m) => !m.hasAccount).length,
  };

  // Pagination
  const startIdx = (currentPage - 1) * rowsPerPage;
  const currentStaffMembers = filteredStaffMembers.slice(startIdx, startIdx + rowsPerPage);
  const totalPages = Math.ceil(filteredStaffMembers.length / rowsPerPage);

  // Handle creating account for staff member
  // const handleCreateAccount = (staffMember) => {
  //   navigate('/receptionistsignup', { 
  //     state: { 
  //       fromStaffManagement: true,
  //       staffMemberId: staffMember._id,
  //       staffMemberEmail: staffMember.email 
  //     }
  //   });
  // };

  const handleCreateAccount = (staffMember) => {
  navigate('/receptionistsignup', { 
    state: { 
      fromStaffManagement: true,
      staffMemberId: staffMember._id,
      staffMemberData: {
        name: staffMember.name,
        email: staffMember.email,
        role: staffMember.role,
        department: staffMember.department
      }
    }
  });
};

  // Handle viewing permissions
  const handleViewPermissions = (staffMember) => {
    navigate('/permissions', { 
      state: { 
        receptionistId: staffMember.receptionistId || staffMember._id,
        staffMemberEmail: staffMember.email 
      }
    });
  };

  // Handle edit staff member
  const handleEdit = (staffMember) => {
    if (userRole !== 'Admin') {
      toast.error('Access denied. Only Admin users can edit staff records.');
      return;
    }
    setSelectedStaffMember(staffMember);
    setIsEditModalOpen(true);
  };

  // Delete handlers
  const openDeleteConfirm = (staffMember) => {
    if (userRole !== 'Admin') {
      toast.error('Access denied. Only Admin users can delete staff records.');
      return;
    }
    setStaffMemberToDelete(staffMember);
    setIsDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setStaffMemberToDelete(null);
    setIsDeleteConfirmOpen(false);
  };

  const confirmDelete = async () => {
    if (!staffMemberToDelete) return;

    try {
      const token = localStorage.getItem('token');
      
      // Delete from appropriate collection(s)
      if (staffMemberToDelete.source === 'both') {
        // Delete from both collections
        await Promise.all([
          axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/staff/${staffMemberToDelete.staffId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/receptionists/${staffMemberToDelete.receptionistId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);
      } else if (staffMemberToDelete.source === 'staff') {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/staff/${staffMemberToDelete._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (staffMemberToDelete.source === 'receptionist') {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/receptionists/${staffMemberToDelete._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      
      toast.success('Staff member deleted successfully!');
      fetchStaffData();
    } catch (err) {
      console.error('Error deleting staff member:', err);
      toast.error(err.response?.data?.message || 'Failed to delete staff member.');
    } finally {
      closeDeleteConfirm();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }

  // Access denied for non-admin users
  if (userRole && userRole !== 'Admin') {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-2xl shadow p-6 w-full">
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Restricted</h2>
              <p className="text-gray-600 mb-4">This page is only accessible to Admin users.</p>
              <p className="text-sm text-gray-500">
                Current role: <span className="font-medium text-blue-600">{userRole}</span>
              </p>
            </div>
            <button
              onClick={() => navigate('/patients')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
            >
              Go to Patient Management
            </button>
          </div>
        </div>
      </div>
    );
  }
return (
  <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
    
    <PageHeader onStaffAdded={fetchStaffData} />

    {/* Stats Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
      <StatsCard
        title="Today's Staff"
        value={stats.total}
        iconSrc={calendarIcon}
        bgColor="bg-blue-100"
      />
      <StatsCard
        title="Active Today"
        value={stats.active}
        iconSrc={userCheckIcon}
        bgColor="bg-emerald-100"
      />
      <StatsCard
        title="Doctors"
        value={stats.doctors}
        iconSrc={receptionistIcon}
        bgColor="bg-purple-100"
      />
      <StatsCard
        title="Receptionists"
        value={stats.receptionists}
        iconSrc={receptionistIcon}
        bgColor="bg-orange-100"
      />
    </div>

    {/* Search and Filters */}
<div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm mb-4 sm:mb-6 md:mb-8">
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
    {/* Search Input */}
    <div className="relative flex-1">
      <Search
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        size={18}
      />
      <input
        type="text"
        placeholder="Search by name, email, phone, or ID"
        value={filters.search}
        onChange={(e) =>
          setFilters((prev) => ({ ...prev, search: e.target.value }))
        }
        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
    </div>

    {/* Role Dropdown */}
    <div className="relative w-full sm:w-auto sm:min-w-[140px]">
      <select
        value={filters.role}
        onChange={(e) =>
          setFilters((prev) => ({ ...prev, role: e.target.value }))
        }
        className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-full text-sm"
      >
        {["All Roles", ...roleOptions].map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
      />
    </div>

    {/* Status Dropdown */}
    <div className="relative w-full sm:w-auto sm:min-w-[140px]">
      <select
        value={filters.status}
        onChange={(e) =>
          setFilters((prev) => ({ ...prev, status: e.target.value }))
        }
        className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-full text-sm"
      >
        {["All Status", ...statusOptions].map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
      />
    </div>

    {/* Department Dropdown */}
    <div className="relative w-full sm:w-auto sm:min-w-[140px]">
      <select
        value={filters.department}
        onChange={(e) =>
          setFilters((prev) => ({ ...prev, department: e.target.value }))
        }
        className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-full text-sm"
      >
        {["All Departments", ...departmentOptions].map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
      />
    </div>
  </div>
</div>
    {/* Staff Table */}
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="flex justify-between items-start sm:items-center">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">Staff Members</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {staffMembers.length} staff member{staffMembers.length !== 1 ? 's' : ''} found
              {stats.withAccounts > 0 && (
                <span className="ml-2 text-blue-600">
                  • {stats.withAccounts} with accounts
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-3 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {['S.No', 'Staff Member', 'Role', 'Department', 'Email', 'Phone Number', 'Account', 'Actions'].map((head) => (
                  <th key={head} className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentStaffMembers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500 text-sm">
                    {filteredStaffMembers.length === 0 && staffMembers.length > 0
                      ? 'No staff members match your filters'
                      : 'No staff members found. Add your first staff member!'}
                  </td>
                </tr>
              ) : (
                currentStaffMembers.map((member, i) => {
                  return (
                    <tr key={member._id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-medium text-gray-900 text-xs sm:text-sm whitespace-nowrap">{startIdx + i + 1}</td>
                      
                      {/* Staff Member Column */}
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 text-xs sm:text-sm">{member.name || 'N/A'}</div>
                      </td>
                      
                      {/* Role Column */}
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                          member.role?.includes('Doctor') 
                            ? 'bg-purple-100 text-purple-600' 
                            : member.role?.includes('Receptionist')
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {member.role || 'Staff'}
                        </span>
                      </td>
                      
                      {/* Department Column */}
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-900 text-xs sm:text-sm whitespace-nowrap">{member.department || 'General'}</td>
                      
                      {/* Email Column */}
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-900 text-xs sm:text-sm whitespace-nowrap">{member.email}</td>
                      
                      {/* Phone Number Column */}
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-900 text-xs sm:text-sm whitespace-nowrap">{member.phone || 'Not provided'}</td>
                      
                      {/* Account Column */}
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {member.hasAccount ? (
                          <button
                            onClick={() => handleViewPermissions(member)}
                            className="bg-blue-500 text-white px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs hover:bg-blue-600 transition-colors cursor-pointer"
                          >
                            View Permissions
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCreateAccount(member)}
                            className="bg-green-500 text-white px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs hover:bg-green-600 transition-colors cursor-pointer"
                          >
                            Create Account
                          </button>
                        )}
                      </td>
                      
                      {/* Actions Column */}
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            className={`p-1 sm:p-1.5 rounded transition-colors ${userRole === 'Admin'
                                ? 'text-green-500 hover:text-green-600 hover:bg-green-50 cursor-pointer'
                                : 'text-gray-400 cursor-not-allowed'
                              }`}
                            onClick={() => handleEdit(member)}
                            disabled={userRole !== 'Admin'}
                            title={userRole !== 'Admin' ? 'Admin access required' : 'Edit staff member'}
                          >
                            <FaEdit size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                          <button
                            className={`p-1 sm:p-1.5 rounded transition-colors ${userRole === 'Admin'
                                ? 'text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                                : 'text-gray-400 cursor-not-allowed'
                              }`}
                            onClick={() => openDeleteConfirm(member)}
                            disabled={userRole !== 'Admin'}
                            title={userRole !== 'Admin' ? 'Admin access required' : 'Delete staff member'}
                          >
                            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex items-center justify-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex gap-1 text-xs flex-wrap justify-center">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-1.5 sm:p-2 rounded cursor-pointer transition-colors ${
                  currentPage === 1 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                ◀
              </button>
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-2.5 py-1.5 sm:px-3 sm:py-1 rounded cursor-pointer transition-colors ${
                    currentPage === idx + 1 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-1.5 sm:p-2 rounded cursor-pointer transition-colors ${
                  currentPage === totalPages 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* AddStaffModal */}
    <AddStaffModal 
      isOpen={isAddModalOpen}
      onClose={() => setIsAddModalOpen(false)}
      mode="add"
      onStaffAdded={fetchStaffData}
    />

    {/* EditStaffModal */}
    <EditStaffModal 
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      staffData={selectedStaffMember}
      onStaffUpdated={fetchStaffData}
    />

    {/* Delete Confirmation Modal */}
    {isDeleteConfirmOpen && userRole === 'Admin' && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-sm mx-4">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold mb-2">Delete Staff Member</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
              Are you sure you want to delete <strong>{staffMemberToDelete?.name}</strong>?
              <br />
              <span className="text-red-500 text-xs mt-2 block">This action cannot be undone.</span>
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-center gap-2 sm:gap-3">
              <button
                onClick={closeDeleteConfirm}
                className="px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-sm hover:bg-gray-200 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default ReceptionistManagement;