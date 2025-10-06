

//PatientManagement.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/PatientManagement/Header";
import StatCard from "../components/PatientManagement/StatCard";
import PatientTable from "../components/PatientManagement/PatientTable";
import { Users, UserCheck, UserPlus, UserX } from "lucide-react";
 
export default function PatientManagement() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    malePatients: 0,
    newThisMonth: 0,
    femalePatients: 0,
  });
 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
       
        const token = localStorage.getItem("token");
       
        if (!token) {
          throw new Error("No authentication token found");
        }
 
        console.log("Fetching stats from:", `${import.meta.env.VITE_BACKEND_URL}/api/patients/stats`);
       
        // ✅ FIXED: Removed hospitalId from URL params
        // The hospitalId should come from the JWT token in the backend
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/patients/stats`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        );
 
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
 
        const data = await response.json();
        console.log("Stats response:", data);
 
        // ✅ FIXED: Handle the response structure properly
        if (data.success) {
          setStats({
            totalPatients: data.data?.totalPatients || data.totalPatients || 0,
            malePatients: data.data?.malePatients || data.malePatients || 0,
            newThisMonth: data.data?.newThisMonth || data.newThisMonth || 0,
            femalePatients: data.data?.femalePatients || data.femalePatients || 0,
          });
        } else {
          // Handle case where response structure is different
          setStats({
            totalPatients: data.totalPatients || 0,
            malePatients: data.malePatients || 0,
            newThisMonth: data.newThisMonth || 0,
            femalePatients: data.femalePatients || 0,
          });
        }
       
      } catch (err) {
        console.error("Error fetching stats:", err);
       
        setError(err.message || "Failed to fetch statistics");
       
        // Set default values on error
        setStats({
          totalPatients: 0,
          malePatients: 0,
          newThisMonth: 0,
          femalePatients: 0,
        });
      } finally {
        setLoading(false);
      }
    };
 
    fetchStats();
  }, []);
 
 return (
  <div className="p-3 sm:p-4 md:p-6 bg-gray-100 min-h-screen">
    <Header />
   
    {/* Show error message if there's an error */}
    {error && (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-start sm:items-center">
          <div className="text-red-800 text-sm sm:text-base">
            <strong>Error loading statistics:</strong> {error}
          </div>
        </div>
      </div>
    )}
   
    {/* Statistics Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <StatCard
        title="Total Patients"
        value={loading ? "..." : stats.totalPatients}
        icon={<Users className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />}
        iconBg="bg-blue-100"
      />
      <StatCard
        title="New This Month"
        value={loading ? "..." : stats.newThisMonth}
        icon={<UserPlus className="text-yellow-600 w-5 h-5 sm:w-6 sm:h-6" />}
        iconBg="bg-yellow-100"
      />
      <StatCard
        title="Female Patient Records"
        value={loading ? "..." : stats.femalePatients}
        icon={<UserCheck className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />}
        iconBg="bg-green-100"
      />
      <StatCard
        title="Male Patient Records"
        value={loading ? "..." : stats.malePatients}
        icon={<UserX className="text-red-600 w-5 h-5 sm:w-6 sm:h-6" />}
        iconBg="bg-red-100"
      />
    </div>
   
    <PatientTable />
  </div>
);
}
 