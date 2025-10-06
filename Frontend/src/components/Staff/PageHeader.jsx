//PageHeader
import { Plus } from "lucide-react"; 
import AddStaffModal from "./AddStaffModal"; 
import { useState } from "react"; 
import React from "react";  
import { Navigate, useNavigate } from "react-router-dom"; 

const PageHeader = ({ onStaffAdded }) => {
  const navigate = useNavigate();
  const [isModalOpen, setModalOpen] = useState(false);

  // Function to handle Add Staff Member button
  const handleAddStaff = () => {
    setModalOpen(true);
  };

  // Function to handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
  };

  // Function to handle successful staff addition
  const handleStaffAdded = (newStaff) => {
    setModalOpen(false);
    // Call the parent component's callback if provided
    if (onStaffAdded) {
      onStaffAdded(newStaff);
    }
  };

return (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
    {/* Title & Description */}
    <div className="flex-1 min-w-0">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
        Staff Management
      </h1>
      <p className="text-sm sm:text-base text-gray-600">
        Manage clinic staff and their permissions
      </p>
    </div>
    
    {/* Buttons - Only Add Staff Member button now */}
    <div className="w-full sm:w-auto">
      <button
        onClick={handleAddStaff}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer text-sm sm:text-base"
      >
        <Plus size={18} className="sm:w-5 sm:h-5" />
        <span>Add Staff Member</span>
      </button>
    </div>
    
    {/* AddStaffModal */}
    <AddStaffModal 
      isOpen={isModalOpen} 
      onClose={handleModalClose}
      mode="add"
      onStaffAdded={handleStaffAdded}
    />
  </div>
);
};

export default PageHeader;