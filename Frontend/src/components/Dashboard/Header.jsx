//Header
import React, { useState, useEffect } from "react";
import { Search, Bell, User } from "lucide-react";
import { BiSolidBellRing } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState("");
  const [imageLoadError, setImageLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  // API base URL - adjust this to match your backend
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ;

  // Helper function to construct proper image URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('blob:')) {
      return imagePath;
    }
    
    // If it starts with a slash, it's already a proper path
    if (imagePath.startsWith('/')) {
      return `${API_BASE_URL}${imagePath}`;
    }
    
    // If it doesn't start with slash, add it
    return `${API_BASE_URL}/${imagePath}`;
  };

  // Get user initials for fallback
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('No token found');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Extract user data based on response structure
          const userData = data.admin || data.receptionist || data.user || data;
          
          // Set user name
          setUserName(userData.name || "");
          
          // Set profile image if exists
          if (userData.profileImage) {
            const imageUrl = getImageUrl(userData.profileImage);
            setProfileImage(imageUrl);
            setImageLoadError(false);
          }
        } else if (response.status === 401) {
          console.log('Token expired or invalid');
          localStorage.removeItem('token');
        } else {
          console.error('Failed to load profile:', response.statusText);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // Handle image load error
  const handleImageError = () => {
    setImageLoadError(true);
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoadError(false);
  };
return (
  <div className="max-w-7xl mx-auto px-3 sm:px-4">
    <header className="flex justify-between items-center gap-3 sm:gap-4">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <input
          type="text"
          placeholder="Search by Patient name.........."
          className="w-full p-3 sm:p-4 pr-10 bg-white rounded-xl text-xs sm:text-sm text-gray-500 shadow-sm focus:outline-none"
        />
        <Search className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Icons */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Profile Image */}
        <div
          onClick={() => navigate("/profile")}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full cursor-pointer relative overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm border-2 border-white shadow-sm hover:shadow-md transition-shadow flex-shrink-0"
        >
          {loading ? (
            // Loading spinner
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          ) : profileImage && !imageLoadError ? (
            // Profile image
            <img 
              src={profileImage} 
              alt="Profile" 
              className="w-full h-full object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          ) : (
            // Fallback to initials or default user icon
            <span className="text-xs font-semibold">
              {userName ? getInitials(userName) : <User size={14} className="sm:w-4 sm:h-4" />}
            </span>
          )}
        </div>
      </div>
    </header>
  </div>
);
};

export default Header;