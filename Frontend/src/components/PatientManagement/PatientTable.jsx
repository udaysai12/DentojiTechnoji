

// //PatientTable.jsx
// import React, { useState, useEffect } from "react";
// import { Trash2, Upload, Search, X, CalendarDays, ChevronDown, } from "lucide-react";
// import { FaEdit } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
//     import * as XLSX from '../../../node_modules/xlsx/xlsx.mjs';
// import { saveAs } from "file-saver"; 
// import axios from "axios";
// import { jwtDecode } from "jwt-decode";
// import EditPatientModal from "./EditPatientModal";

// // FilterBar Component
// const FilterBar = ({ search, setSearch, date, setDate, gender, setGender, ageRange, setAgeRange }) => {
//   const handleDateChange = (e) => {
//     setDate(e.target.value);
//   };

//   const handleGenderChange = (e) => {
//     setGender(e.target.value);
//   };

//   const handleAgeRangeChange = (e) => {
//     setAgeRange(e.target.value);
//   };

//   return (
//     <div className="bg-white rounded-xl p-4 mt-5 shadow-sm flex flex-wrap gap-3 items-center mb-6 border border-gray-100">
//       {/* Search Input */}
//       <div className="relative w-full  sm:w-180">
//         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//         <input
//           type="text"
//           placeholder="Search by patient name, phone number..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 placeholder:text-gray-400"
//         />
//       </div>

//       {/* Date Filter */}
//       <div className="relative w-full sm:w-48">
//         <input
//           type="date"
//           value={date}
//           onChange={handleDateChange}
//           className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 cursor-pointer"
//         />
//       </div>

//       {/* Gender Filter */}
//       <div className="relative w-full sm:w-40">
//         <select
//           value={gender}
//           onChange={handleGenderChange}
//           className="appearance-none w-full border border-gray-300 rounded-md px-4 py-2 pr-10 text-sm text-gray-500 bg-white"
//         >
//           <option value="">All Genders</option>
//           <option value="Male">Male</option>
//           <option value="Female">Female</option>
//           <option value="Other">Other</option>
//         </select>
//         <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
//       </div>

//       {/* Age Range Filter */}
//       <div className="relative w-full sm:w-40">
//         <select
//           value={ageRange}
//           onChange={handleAgeRangeChange}
//           className="appearance-none w-full border border-gray-300 rounded-md px-4 py-2 pr-10 text-sm text-gray-500 bg-white"
//         >
//           <option value="">All Ages</option>
//           <option value="0-18">0-18 years</option>
//           <option value="19-35">19-35 years</option>
//           <option value="36-50">36-50 years</option>
//           <option value="51-65">51-65 years</option>
//           <option value="65+">65+ years</option>
//         </select>
//         <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
//       </div>
//     </div>
//   );
// };

// const PatientTable = () => {
//   const navigate = useNavigate();
//   const [patients, setPatients] = useState([]);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [selectedPatient, setSelectedPatient] = useState(null);
//   const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
//   const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
//   const [patientToDelete, setPatientToDelete] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [hospitalId, setHospitalId] = useState(null);
//   const [userRole, setUserRole] = useState(null);

//   // Filter states
//   const [searchTerm, setSearchTerm] = useState("");
//   const [dateFilter, setDateFilter] = useState("");
//   const [genderFilter, setGenderFilter] = useState("");
//   const [ageRangeFilter, setAgeRangeFilter] = useState("");
//   const [filteredPatients, setFilteredPatients] = useState([]);

//   // Pagination
//   const rowsPerPage = 6;
//   const [currentPage, setCurrentPage] = useState(1);

//   // Fetch patients with role-based filtering
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) {
//           setError("No authentication token found. Please log in.");
//           setLoading(false);
//           return;
//         }

//         const decoded = jwtDecode(token); 
//         const role = decoded.role;
//         setUserRole(role);
//         const userId = decoded.id;

//         console.log("Decoded token:", decoded);
//         console.log("User role:", role);
//         console.log("User ID:", userId);

//         let fetchedHospitalId = null;

//         // First, try to get hospital ID from the token
//         if (decoded.hospitalId) {
//           fetchedHospitalId = decoded.hospitalId;
//           console.log("Hospital ID from token:", fetchedHospitalId);
//         } else {
//           // If not in token, fetch from profile endpoint
//           try {
//             console.log("Fetching profile to get hospital ID...");
//             const profileResponse = await axios.get(
//               `${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`,
//               {
//                 headers: { Authorization: `Bearer ${token}` },
//               }
//             );
            
//             console.log("Profile response:", profileResponse.data);
            
//             if (role === "Admin" && profileResponse.data.hospital) {
//               fetchedHospitalId = profileResponse.data.hospital._id;
//               console.log("Hospital ID from profile (Admin):", fetchedHospitalId);
//             } else if (role === "Receptionist") {
//               // For receptionists, get hospitalId directly from the receptionist object
//               const receptionistData = profileResponse.data.receptionist;
//               if (receptionistData && receptionistData.hospitalId) {
//                 fetchedHospitalId = receptionistData.hospitalId;
//                 console.log("Hospital ID from profile (Receptionist):", fetchedHospitalId);
//               } else {
//                 console.error("Receptionist data or hospitalId not found in profile response");
//               }
//             }
//           } catch (profileError) {
//             console.error("Error fetching profile:", profileError);
//             setError("Failed to fetch user profile. Please try logging in again.");
//             setLoading(false);
//             return;
//           }
//         }

//         if (!fetchedHospitalId) {
//           console.error("No hospital ID found for user");
//           if (role === "Admin") {
//             setError("No hospital found. Please complete hospital setup by going to Hospital Form.");
//           } else {
//             setError("No hospital association found. Please contact your administrator.");
//           }
//           setLoading(false);
//           return;
//         }

//         setHospitalId(fetchedHospitalId);

//         // Build the API URL based on user role
//         let url = `${import.meta.env.VITE_BACKEND_URL}/api/patients`;
//         const params = new URLSearchParams();

//         if (role === "Receptionist") {
//           params.append("hospitalId", fetchedHospitalId);
//         } else if (role === "Admin") {
//           params.append("adminId", userId);
//         }

//         if (params.toString()) {
//           url += `?${params.toString()}`;
//         }

//         console.log("Fetching patients from:", url);

//         const response = await axios.get(url, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
        
//         console.log("Patients response:", response.data);
//         setPatients(response.data || []);
//         setFilteredPatients(response.data || []); // Initialize filtered patients
//       } catch (err) {
//         console.error("Error fetching data:", err);
//         if (err.response?.status === 401) {
//           setError("Authentication failed. Please log in again.");
//         } else {
//           setError(
//             err.response?.data?.message || "Failed to fetch patient records."
//           );
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [navigate]);

//   // Filter functionality useEffect
//   useEffect(() => {
//     let filtered = [...patients];

//     // Search filter
//     // Search filter
// if (searchTerm.trim() !== "") {
//   filtered = filtered.filter((patient) => {
//     const firstName = patient.firstName || '';
//     const lastName = patient.lastName || '';
//     const fullName = `${firstName} ${lastName}`.toLowerCase();
//     const searchLower = searchTerm.toLowerCase();
//     const primaryNumber = patient.primaryNumber || '';
//     const patientId = patient.patientId || '';
    
//     return fullName.includes(searchLower) ||
//            firstName.toLowerCase().includes(searchLower) ||
//            lastName.toLowerCase().includes(searchLower) ||
//            primaryNumber.includes(searchTerm) ||
//            patientId.toLowerCase().includes(searchLower);
//   });
// }

//     // Date filter (filter by last visit date)
//     if (dateFilter) {
//       filtered = filtered.filter((patient) => {
//         if (!patient.lastVisit) return false;
//         const visitDate = new Date(patient.lastVisit).toISOString().split('T')[0];
//         return visitDate === dateFilter;
//       });
//     }

//     // Gender filter
//     if (genderFilter) {
//       filtered = filtered.filter((patient) => 
//         patient.gender && patient.gender.toLowerCase() === genderFilter.toLowerCase()
//       );
//     }

//     // Age range filter
//     if (ageRangeFilter) {
//       filtered = filtered.filter((patient) => {
//         const age = parseInt(patient.age);
//         switch (ageRangeFilter) {
//           case "0-18":
//             return age >= 0 && age <= 18;
//           case "19-35":
//             return age >= 19 && age <= 35;
//           case "36-50":
//             return age >= 36 && age <= 50;
//           case "51-65":
//             return age >= 51 && age <= 65;
//           case "65+":
//             return age > 65;
//           default:
//             return true;
//         }
//       });
//     }

//     setFilteredPatients(filtered);
//     setCurrentPage(1); // Reset to first page when filters change
//   }, [searchTerm, dateFilter, genderFilter, ageRangeFilter, patients]);

//   // Patient row click handler
// // const handleRowClick = (patient) => {
// //     console.log('Clicking on patient:', patient);
    
// //     const patientId = patient._id;
// //     const patientHospitalId = patient.hospitalId || hospitalId;
    
// //     if (!patientId) {
// //         console.error('Missing patient ID:', patientId);
// //         return;
// //     }
    
// //     if (!patientHospitalId) {
// //         console.error('Missing hospital ID:', { 
// //             patientHospitalId: patient.hospitalId,
// //             currentHospitalId: hospitalId 
// //         });
// //         return;
// //     }

// //     console.log('Navigating to:', `/patientdata/${patientHospitalId}/${patientId}`);
    
// //     // CRITICAL FIX: Store correct hospitalId before navigation
// //     localStorage.setItem('currentHospitalId', patientHospitalId);
    
// //     navigate(`/patientdata/${patientHospitalId}/${patientId}`, { 
// //         state: { 
// //             patient: {
// //                 ...patient,
// //                 hospitalId: patientHospitalId // Ensure hospitalId is included
// //             }
// //         } 
// //     });
// // };



// // For PatientTable component - Updated handleRowClick with better error handling
// const handleRowClick = async (patient) => {
//     console.log('🔄 Clicking on patient:', patient);
    
//     const patientId = patient._id;
//     const patientHospitalId = hospitalId; // Use the current hospitalId from state
    
//     if (!patientId) {
//         console.error('❌ Missing patient ID:', patientId);
//         alert('Patient ID not found. Cannot navigate to patient details.');
//         return;
//     }
    
//     if (!patientHospitalId) {
//         console.error('❌ Missing hospital ID:', { 
//             currentHospitalId: hospitalId 
//         });
//         alert('Hospital ID not found. Cannot navigate to patient details.');
//         return;
//     }

//     console.log('🚀 Navigating to:', `/patientdata/${patientHospitalId}/${patientId}`);
    
//     // Store correct hospitalId BEFORE navigation
//     localStorage.setItem('currentHospitalId', patientHospitalId);
//     console.log('💾 Hospital ID stored in localStorage:', patientHospitalId);
    
//     try {
//         // Try to fetch complete patient data before navigation
//         const token = localStorage.getItem('token');
//         console.log('📡 Fetching complete patient data...');
        
//         const response = await axios.get(
//             `${import.meta.env.VITE_BACKEND_URL}/api/patients/${patientHospitalId}/${patientId}`,
//             { headers: { 'Authorization': `Bearer ${token}` } }
//         );
        
//         const patientData = response.data;
//         console.log('✅ Fetched complete patient data:', patientData);
        
//         navigate(`/patientdata/${patientHospitalId}/${patientId}`, { 
//             state: { 
//                 patient: {
//                     ...patientData,
//                     hospitalId: patientHospitalId
//                 }
//             } 
//         });
//     } catch (error) {
//         console.warn('⚠️ Could not fetch complete patient data, using existing data:', error);
        
//         // Use the existing patient data with hospitalId ensured
//         const patientWithHospitalId = {
//             ...patient,
//             hospitalId: patientHospitalId
//         };
        
//         console.log('🔄 Using existing patient data:', patientWithHospitalId);
        
//         navigate(`/patientdata/${patientHospitalId}/${patientId}`, { 
//             state: { 
//                 patient: patientWithHospitalId
//             } 
//         });
//     }
// };

//   const openEditModal = (patient) => {
//     setSelectedPatient(patient);
//     setIsEditModalOpen(true);
//   };

//   const closeEditModal = () => {
//     setSelectedPatient(null);
//     setIsEditModalOpen(false);
//   };

//   const handleUpdatePatient = (updatedPatient) => {
//     setPatients((prev) =>
//       prev.map((p) => (p._id === updatedPatient._id ? updatedPatient : p))
//     );

//      // Add this code to refresh patient data in ProformaModal
//     if (window.refreshPatientData) {
//         window.refreshPatientData();
//     }
//     closeEditModal();
//   };

//   const openDeleteConfirm = (patient) => {
//     setPatientToDelete(patient);
//     setIsDeleteConfirmOpen(true);
//   };

//   const closeDeleteConfirm = () => {
//     setPatientToDelete(null);
//     setIsDeleteConfirmOpen(false);
//   };

//   const confirmDelete = async () => {
//     if (!patientToDelete) return;

//     try {
//       const token = localStorage.getItem("token");
//       await axios.delete(
//         `${import.meta.env.VITE_BACKEND_URL}/api/patients/${hospitalId}/${patientToDelete._id}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       setPatients((prev) => prev.filter((p) => p._id !== patientToDelete._id));
//       setFilteredPatients((prev) => prev.filter((p) => p._id !== patientToDelete._id));
//     } catch (err) {
//       console.error("Error deleting patient:", err);
//       setError(
//         err.response?.data?.message || "Failed to delete patient record."
//       );
//     } finally {
//       closeDeleteConfirm();
//     }
//   };

//   const openExportConfirm = () => {
//     setIsExportConfirmOpen(true);
//   };

//   const closeExportConfirm = () => {
//     setIsExportConfirmOpen(false);
//   };

//   const confirmExport = () => {
//     const dataToExport = filteredPatients.map((p, index) => ({
//       "Patient ID": index + 1,
//       Name: `${p.firstName} ${p.lastName}`,
//       Age: p.age,
//       Gender: p.gender,
//       Phone: p.primaryNumber,
//       "Primary Issue": p.primaryDentalIssue,
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(dataToExport);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");

//     const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
//     const blob = new Blob([excelBuffer], {
//       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     });
//     saveAs(blob, "Patients.xlsx");

//     closeExportConfirm();
//   };

//   // Pagination logic
//   const totalPages = Math.ceil(filteredPatients.length / rowsPerPage);
//   const handlePageChange = (page) => {
//     if (page >= 1 && page <= totalPages) {
//       setCurrentPage(page);
//     }
//   };
//   const startIdx = (currentPage - 1) * rowsPerPage;
//   const currentPatients = filteredPatients.slice(startIdx, startIdx + rowsPerPage);

//   if (loading) return <div className="p-6">Loading...</div>;
  
//   if (error) {
//     return (
//       <div className="p-6">
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//           <div className="text-red-800 font-medium mb-2">Error</div>
//           <div className="text-red-600">{error}</div>
//           {userRole === "Admin" && error.includes("hospital") && (
//             <button
//               onClick={() => navigate("/hospitalform")}
//               className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
//             >
//               Set Up Hospital
//             </button>
//           )}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full max-w-[99.5%]">
//       {/* Filter Bar - positioned at top */}
//       <FilterBar
//         search={searchTerm}
//         setSearch={setSearchTerm}
//         date={dateFilter}
//         setDate={setDateFilter}
//         gender={genderFilter}
//         setGender={setGenderFilter}
//         ageRange={ageRangeFilter}
//         setAgeRange={setAgeRangeFilter}
//       />

//       <div className="bg-white rounded-2xl shadow p-6 w-full">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-base font-semibold">Patient Records</h2>
//           <button
//             className="bg-gray-100 text-gray-800 px-5 py-2 rounded-lg cursor-pointer text-sm flex items-center gap-2 mr-20"
//             onClick={openExportConfirm}
//           >
//             <Upload size={16} />
//             Export
//           </button>
//         </div>

//         {/* Results info */}
//         {(searchTerm || dateFilter || genderFilter || ageRangeFilter) && (
//           <div className="mb-4 text-sm text-gray-600">
//             {filteredPatients.length > 0 
//               ? `Found ${filteredPatients.length} patient${filteredPatients.length === 1 ? '' : 's'} matching your filters`
//               : `No patients found matching your filters`
//             }
//           </div>
//         )}

//         <div className="overflow-x-auto">
//           <table className="min-w-full text-sm text-left">
//             <thead className="border-b border-gray-200 text-gray-600 bg-gray-50">
//               <tr>
//                 <th className="p-3 font-medium">S NO</th>
//                 <th className="p-3 font-medium">Name</th>
//                 <th className="p-3 font-medium">Patient ID</th>
//                 <th className="p-3 font-medium">Age</th>
//                 <th className="p-3 font-medium">Gender</th>
//                 <th className="p-3 font-medium">Phone</th>
//                 <th className="p-3 font-medium">Primary Issue</th>
//                 <th className="p-3 font-medium">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {currentPatients.length > 0 ? (
//                 currentPatients.map((p, index) => (
//                   <tr
//                     key={p._id || p.id}
//                     className="border-b border-gray-100 last:border-none hover:bg-gray-50 h-16 cursor-pointer transition-colors duration-150"
//                     onClick={() => handleRowClick(p)}
//                   >
//                     <td className="p-3">{startIdx + index + 1}</td>
//                     <td className="p-3 font-medium">{`${p.firstName} ${p.lastName}`}</td>
//                     <td className="p-3">{p.patientId}</td>
//                     <td className="p-3">{p.age}</td>
//                     <td className="p-3">{p.gender}</td>
//                     <td className="p-3">{p.primaryNumber}</td>
//                     <td className="p-3">{p.primaryDentalIssue}</td>
//                       {/* {p.primaryDentalIssue ? new Date(p.primaryDentalIssue).toLocaleString("en-GB", {
//                         year: "numeric",
//                         month: "2-digit",
//                         day: "2-digit",
//                         hour: "2-digit",
//                         minute: "2-digit",
//                         hour12: false
//                       }) : ""} */}
                    
                    
//                     <td className="p-3">
//                       <div
//                         className="flex items-center gap-4"
//                         onClick={(e) => e.stopPropagation()}
//                       >
//                         <button
//                           className="text-green-500 hover:text-green-600 cursor-pointer transition-colors duration-150"
//                           onClick={() => openEditModal(p)}
//                         >
//                           <FaEdit size={18} />
//                         </button>
//                         <button
//                           className="text-red-500 hover:text-red-600 cursor-pointer transition-colors duration-150"
//                           onClick={() => openDeleteConfirm(p)}
//                         >
//                           <Trash2 size={18} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan="8" className="p-6 text-center text-gray-500">
//                     {(searchTerm || dateFilter || genderFilter || ageRangeFilter) ? "No patients found matching your filters." : "No patients found."}
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {totalPages > 1 && (
//           <div className="flex justify-center items-center mt-4 gap-1 text-xs">
//             <button
//               onClick={() => handlePageChange(currentPage - 1)}
//               disabled={currentPage === 1}
//               className={`p-1 rounded ${
//                 currentPage === 1
//                   ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//                   : "bg-gray-100 hover:bg-gray-200"
//               }`}
//             >
//               ◀
//             </button>

//             {Array.from({ length: totalPages }, (_, idx) => (
//               <button
//                 key={idx}
//                 onClick={() => handlePageChange(idx + 1)}
//                 className={`px-2 py-1 rounded ${
//                   currentPage === idx + 1
//                     ? "bg-blue-500 text-white"
//                     : "bg-gray-100 hover:bg-gray-200"
//                 }`}
//               >
//                 {idx + 1}
//               </button>
//             ))}

//             <button
//               onClick={() => handlePageChange(currentPage + 1)}
//               disabled={currentPage === totalPages}
//               className={`p-1 rounded ${
//                 currentPage === totalPages
//                   ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//                   : "bg-gray-100 hover:bg-gray-200"
//               }`}
//             >
//               ▶
//             </button>
//           </div>
//         )}

//         {isEditModalOpen && (
//           <EditPatientModal
//             patient={selectedPatient}
//             onClose={closeEditModal}
//             onUpdate={handleUpdatePatient}
//           />
//         )}

//         {isDeleteConfirmOpen && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//             <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
//               <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
//               <p className="text-sm text-gray-600 mb-6">
//                 Are you sure you want to delete this patient?
//               </p>
//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={closeDeleteConfirm}
//                   className="px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-sm hover:bg-gray-200"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={confirmDelete}
//                   className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {isExportConfirmOpen && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//             <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
//               <h2 className="text-lg font-semibold mb-4">Export to Excel</h2>
//               <p className="text-sm text-gray-600 mb-6">
//                 Are you sure you want to export patient records to Excel?
//               </p>
//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={closeExportConfirm}
//                   className="px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-sm hover:bg-gray-200"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={confirmExport}
//                   className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600"
//                 >
//                   Export
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PatientTable;

//PatientTable.jsx
import React, { useState, useEffect } from "react";
import { Trash2, Upload, Search, X, CalendarDays, ChevronDown, Download } from "lucide-react";
import { FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import EditPatientModal from "./EditPatientModal";

// FilterBar Component
const FilterBar = ({ search, setSearch, date, setDate, gender, setGender, ageRange, setAgeRange }) => {
  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handleGenderChange = (e) => {
    setGender(e.target.value);
  };

  const handleAgeRangeChange = (e) => {
    setAgeRange(e.target.value);
  };

  return (
    <div className="bg-white rounded-xl p-4 mt-5 shadow-sm flex flex-wrap gap-3 items-center mb-6 border border-gray-100">
      {/* Search Input */}
      <div className="relative w-full  sm:w-180">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by patient name, phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 placeholder:text-gray-400"
        />
      </div>

      {/* Date Filter */}
      <div className="relative w-full sm:w-48">
        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 cursor-pointer"
        />
      </div>

      {/* Gender Filter */}
      <div className="relative w-full sm:w-40">
        <select
          value={gender}
          onChange={handleGenderChange}
          className="appearance-none w-full border border-gray-300 rounded-md px-4 py-2 pr-10 text-sm text-gray-500 bg-white"
        >
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Age Range Filter */}
      <div className="relative w-full sm:w-40">
        <select
          value={ageRange}
          onChange={handleAgeRangeChange}
          className="appearance-none w-full border border-gray-300 rounded-md px-4 py-2 pr-10 text-sm text-gray-500 bg-white"
        >
          <option value="">All Ages</option>
          <option value="0-18">0-18 years</option>
          <option value="19-35">19-35 years</option>
          <option value="36-50">36-50 years</option>
          <option value="51-65">51-65 years</option>
          <option value="65+">65+ years</option>
        </select>
        <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

const PatientTable = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hospitalId, setHospitalId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [ageRangeFilter, setAgeRangeFilter] = useState("");
  const [filteredPatients, setFilteredPatients] = useState([]);

  // Pagination
  const rowsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch patients with role-based filtering
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found. Please log in.");
          setLoading(false);
          return;
        }

        const decoded = jwtDecode(token); 
        const role = decoded.role;
        setUserRole(role);
        const userId = decoded.id;

        console.log("Decoded token:", decoded);
        console.log("User role:", role);
        console.log("User ID:", userId);

        let fetchedHospitalId = null;

        // First, try to get hospital ID from the token
        if (decoded.hospitalId) {
          fetchedHospitalId = decoded.hospitalId;
          console.log("Hospital ID from token:", fetchedHospitalId);
        } else {
          // If not in token, fetch from profile endpoint
          try {
            console.log("Fetching profile to get hospital ID...");
            const profileResponse = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            
            console.log("Profile response:", profileResponse.data);
            
            if (role === "Admin" && profileResponse.data.hospital) {
              fetchedHospitalId = profileResponse.data.hospital._id;
              console.log("Hospital ID from profile (Admin):", fetchedHospitalId);
            } else if (role === "Receptionist") {
              // For receptionists, get hospitalId directly from the receptionist object
              const receptionistData = profileResponse.data.receptionist;
              if (receptionistData && receptionistData.hospitalId) {
                fetchedHospitalId = receptionistData.hospitalId;
                console.log("Hospital ID from profile (Receptionist):", fetchedHospitalId);
              } else {
                console.error("Receptionist data or hospitalId not found in profile response");
              }
            }
          } catch (profileError) {
            console.error("Error fetching profile:", profileError);
            setError("Failed to fetch user profile. Please try logging in again.");
            setLoading(false);
            return;
          }
        }

        if (!fetchedHospitalId) {
          console.error("No hospital ID found for user");
          if (role === "Admin") {
            setError("No hospital found. Please complete hospital setup by going to Hospital Form.");
          } else {
            setError("No hospital association found. Please contact your administrator.");
          }
          setLoading(false);
          return;
        }

        setHospitalId(fetchedHospitalId);

        // Build the API URL based on user role
        let url = `${import.meta.env.VITE_BACKEND_URL}/api/patients`;
        const params = new URLSearchParams();

        if (role === "Receptionist") {
          params.append("hospitalId", fetchedHospitalId);
        } else if (role === "Admin") {
          params.append("adminId", userId);
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        console.log("Fetching patients from:", url);

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log("Patients response:", response.data);
        setPatients(response.data || []);
        setFilteredPatients(response.data || []); // Initialize filtered patients
      } catch (err) {
        console.error("Error fetching data:", err);
        if (err.response?.status === 401) {
          setError("Authentication failed. Please log in again.");
        } else {
          setError(
            err.response?.data?.message || "Failed to fetch patient records."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Filter functionality useEffect
  useEffect(() => {
    let filtered = [...patients];

    // Search filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((patient) => {
        const firstName = patient.firstName || '';
        const lastName = patient.lastName || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        const primaryNumber = patient.primaryNumber || '';
        const patientId = patient.patientId || '';
        
        return fullName.includes(searchLower) ||
               firstName.toLowerCase().includes(searchLower) ||
               lastName.toLowerCase().includes(searchLower) ||
               primaryNumber.includes(searchTerm) ||
               patientId.toLowerCase().includes(searchLower);
      });
    }

    // Date filter (filter by last visit date)
    if (dateFilter) {
      filtered = filtered.filter((patient) => {
        if (!patient.lastVisit) return false;
        const visitDate = new Date(patient.lastVisit).toISOString().split('T')[0];
        return visitDate === dateFilter;
      });
    }

    // Gender filter
    if (genderFilter) {
      filtered = filtered.filter((patient) => 
        patient.gender && patient.gender.toLowerCase() === genderFilter.toLowerCase()
      );
    }

    // Age range filter
    if (ageRangeFilter) {
      filtered = filtered.filter((patient) => {
        const age = parseInt(patient.age);
        switch (ageRangeFilter) {
          case "0-18":
            return age >= 0 && age <= 18;
          case "19-35":
            return age >= 19 && age <= 35;
          case "36-50":
            return age >= 36 && age <= 50;
          case "51-65":
            return age >= 51 && age <= 65;
          case "65+":
            return age > 65;
          default:
            return true;
        }
      });
    }

    setFilteredPatients(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, dateFilter, genderFilter, ageRangeFilter, patients]);

  // Patient row click handler
  const handleRowClick = async (patient) => {
    console.log('🔄 Clicking on patient:', patient);
    
    const patientId = patient._id;
    const patientHospitalId = hospitalId; // Use the current hospitalId from state
    
    if (!patientId) {
        console.error('❌ Missing patient ID:', patientId);
        alert('Patient ID not found. Cannot navigate to patient details.');
        return;
    }
    
    if (!patientHospitalId) {
        console.error('❌ Missing hospital ID:', { 
            currentHospitalId: hospitalId 
        });
        alert('Hospital ID not found. Cannot navigate to patient details.');
        return;
    }

    console.log('🚀 Navigating to:', `/patientdata/${patientHospitalId}/${patientId}`);
    
    // Store correct hospitalId BEFORE navigation
    localStorage.setItem('currentHospitalId', patientHospitalId);
    console.log('💾 Hospital ID stored in localStorage:', patientHospitalId);
    
    try {
        // Try to fetch complete patient data before navigation
        const token = localStorage.getItem('token');
        console.log('📡 Fetching complete patient data...');
        
        const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/patients/${patientHospitalId}/${patientId}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        const patientData = response.data;
        console.log('✅ Fetched complete patient data:', patientData);
        
        navigate(`/patientdata/${patientHospitalId}/${patientId}`, { 
            state: { 
                patient: {
                    ...patientData,
                    hospitalId: patientHospitalId
                }
            } 
        });
    } catch (error) {
        console.warn('⚠️ Could not fetch complete patient data, using existing data:', error);
        
        // Use the existing patient data with hospitalId ensured
        const patientWithHospitalId = {
            ...patient,
            hospitalId: patientHospitalId
        };
        
        console.log('🔄 Using existing patient data:', patientWithHospitalId);
        
        navigate(`/patientdata/${patientHospitalId}/${patientId}`, { 
            state: { 
                patient: patientWithHospitalId
            } 
        });
    }
  };

  const openEditModal = (patient) => {
    setSelectedPatient(patient);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedPatient(null);
    setIsEditModalOpen(false);
  };

  const handleUpdatePatient = (updatedPatient) => {
    setPatients((prev) =>
      prev.map((p) => (p._id === updatedPatient._id ? updatedPatient : p))
    );

     // Add this code to refresh patient data in ProformaModal
    if (window.refreshPatientData) {
        window.refreshPatientData();
    }
    closeEditModal();
  };

  const openDeleteConfirm = (patient) => {
    setPatientToDelete(patient);
    setIsDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setPatientToDelete(null);
    setIsDeleteConfirmOpen(false);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/patients/${hospitalId}/${patientToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPatients((prev) => prev.filter((p) => p._id !== patientToDelete._id));
      setFilteredPatients((prev) => prev.filter((p) => p._id !== patientToDelete._id));
    } catch (err) {
      console.error("Error deleting patient:", err);
      setError(
        err.response?.data?.message || "Failed to delete patient record."
      );
    } finally {
      closeDeleteConfirm();
    }
  };

  // CSV Export function to replace Excel export
  const exportToCSV = () => {
    const dataToExport = filteredPatients.map((p, index) => ({
      "Patient ID": index + 1,
      Name: `${p.firstName} ${p.lastName}`,
      Age: p.age,
      Gender: p.gender,
      Phone: p.primaryNumber,
      "Primary Issue": p.primaryDentalIssue,
    }));

    // Convert to CSV format
    const csvHeaders = Object.keys(dataToExport[0] || {}).join(',');
    const csvRows = dataToExport.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      ).join(',')
    );
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'patients.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredPatients.length / rowsPerPage);
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const startIdx = (currentPage - 1) * rowsPerPage;
  const currentPatients = filteredPatients.slice(startIdx, startIdx + rowsPerPage);

  if (loading) return <div className="p-6">Loading...</div>;
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium mb-2">Error</div>
          <div className="text-red-600">{error}</div>
          {userRole === "Admin" && error.includes("hospital") && (
            <button
              onClick={() => navigate("/hospitalform")}
              className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
            >
              Set Up Hospital
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[99.5%]">
      {/* Filter Bar - positioned at top */}
      <FilterBar
        search={searchTerm}
        setSearch={setSearchTerm}
        date={dateFilter}
        setDate={setDateFilter}
        gender={genderFilter}
        setGender={setGenderFilter}
        ageRange={ageRangeFilter}
        setAgeRange={setAgeRangeFilter}
      />

      <div className="bg-white rounded-2xl shadow p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold">Patient Records</h2>
          <button
            className="bg-gray-100 text-gray-800 px-5 py-2 rounded-lg cursor-pointer text-sm flex items-center gap-2 mr-20"
            onClick={exportToCSV}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {/* Results info */}
        {(searchTerm || dateFilter || genderFilter || ageRangeFilter) && (
          <div className="mb-4 text-sm text-gray-600">
            {filteredPatients.length > 0 
              ? `Found ${filteredPatients.length} patient${filteredPatients.length === 1 ? '' : 's'} matching your filters`
              : `No patients found matching your filters`
            }
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="border-b border-gray-200 text-gray-600 bg-gray-50">
              <tr>
                <th className="p-3 font-medium">S NO</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Patient ID</th>
                <th className="p-3 font-medium">Age</th>
                <th className="p-3 font-medium">Gender</th>
                <th className="p-3 font-medium">Phone</th>
                <th className="p-3 font-medium">Primary Issue</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPatients.length > 0 ? (
                currentPatients.map((p, index) => (
                  <tr
                    key={p._id || p.id}
                    className="border-b border-gray-100 last:border-none hover:bg-gray-50 h-16 cursor-pointer transition-colors duration-150"
                    onClick={() => handleRowClick(p)}
                  >
                    <td className="p-3">{startIdx + index + 1}</td>
                    <td className="p-3 font-medium">{`${p.firstName} ${p.lastName}`}</td>
                    <td className="p-3">{p.patientId}</td>
                    <td className="p-3">{p.age}</td>
                    <td className="p-3">{p.gender}</td>
                    <td className="p-3">{p.primaryNumber}</td>
                    <td className="p-3">{p.primaryDentalIssue}</td>
                    
                    <td className="p-3">
                      <div
                        className="flex items-center gap-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="text-green-500 hover:text-green-600 cursor-pointer transition-colors duration-150"
                          onClick={() => openEditModal(p)}
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-600 cursor-pointer transition-colors duration-150"
                          onClick={() => openDeleteConfirm(p)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-gray-500">
                    {(searchTerm || dateFilter || genderFilter || ageRangeFilter) ? "No patients found matching your filters." : "No patients found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-4 gap-1 text-xs">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-1 rounded ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              ◀
            </button>

            {Array.from({ length: totalPages }, (_, idx) => (
              <button
                key={idx}
                onClick={() => handlePageChange(idx + 1)}
                className={`px-2 py-1 rounded ${
                  currentPage === idx + 1
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {idx + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-1 rounded ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              ▶
            </button>
          </div>
        )}

        {isEditModalOpen && (
          <EditPatientModal
            patient={selectedPatient}
            onClose={closeEditModal}
            onUpdate={handleUpdatePatient}
          />
        )}

        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
              <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this patient?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteConfirm}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-sm hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientTable;