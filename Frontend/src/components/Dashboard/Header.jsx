// //Header
// import React, { useState, useEffect } from "react";
// import { Search, Bell, User } from "lucide-react";
// import { BiSolidBellRing } from "react-icons/bi";
// import { useNavigate } from "react-router-dom";

// const Header = () => {
//   const navigate = useNavigate();
//   const [profileImage, setProfileImage] = useState(null);
//   const [userName, setUserName] = useState("");
//   const [imageLoadError, setImageLoadError] = useState(false);
//   const [loading, setLoading] = useState(true);

//   // API base URL - adjust this to match your backend
//   const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ;

//   // Helper function to construct proper image URLs
//   const getImageUrl = (imagePath) => {
//     if (!imagePath) return null;
    
//     // If it's already a full URL, return as is
//     if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('blob:')) {
//       return imagePath;
//     }
    
//     // If it starts with a slash, it's already a proper path
//     if (imagePath.startsWith('/')) {
//       return `${API_BASE_URL}${imagePath}`;
//     }
    
//     // If it doesn't start with slash, add it
//     return `${API_BASE_URL}/${imagePath}`;
//   };

//   // Get user initials for fallback
//   const getInitials = (name) => {
//     if (!name) return "U";
//     return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
//   };

//   // Load user profile data
//   useEffect(() => {
//     const loadUserProfile = async () => {
//       try {
//         const token = localStorage.getItem('token');
        
//         if (!token) {
//           console.log('No token found');
//           setLoading(false);
//           return;
//         }

//         const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
//           method: 'GET',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         });

//         if (response.ok) {
//           const data = await response.json();
          
//           // Extract user data based on response structure
//           const userData = data.admin || data.receptionist || data.user || data;
          
//           // Set user name
//           setUserName(userData.name || "");
          
//           // Set profile image if exists
//           if (userData.profileImage) {
//             const imageUrl = getImageUrl(userData.profileImage);
//             setProfileImage(imageUrl);
//             setImageLoadError(false);
//           }
//         } else if (response.status === 401) {
//           console.log('Token expired or invalid');
//           localStorage.removeItem('token');
//         } else {
//           console.error('Failed to load profile:', response.statusText);
//         }
//       } catch (error) {
//         console.error('Error loading profile:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadUserProfile();
//   }, []);

//   // Handle image load error
//   const handleImageError = () => {
//     setImageLoadError(true);
//   };

//   // Handle image load success
//   const handleImageLoad = () => {
//     setImageLoadError(false);
//   };
// return (
//   <div className="max-w-7xl mx-auto px-3 sm:px-4">
//     <header className="flex justify-between items-center gap-3 sm:gap-4">
//       {/* Search Bar */}
//       <div className="relative flex-1 max-w-md">
//         <input
//           type="text"
//           placeholder="Search by Patient name.........."
//           className="w-full p-3 sm:p-4 pr-10 bg-white rounded-xl text-xs sm:text-sm text-gray-500 shadow-sm focus:outline-none"
//         />
//         <Search className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//       </div>

//       {/* Icons */}
//       <div className="flex items-center gap-3 sm:gap-6">
//         {/* Profile Image */}
//         <div
//           onClick={() => navigate("/profile")}
//           className="w-9 h-9 sm:w-10 sm:h-10 rounded-full cursor-pointer relative overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm border-2 border-white shadow-sm hover:shadow-md transition-shadow flex-shrink-0"
//         >
//           {loading ? (
//             // Loading spinner
//             <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
//           ) : profileImage && !imageLoadError ? (
//             // Profile image
//             <img 
//               src={profileImage} 
//               alt="Profile" 
//               className="w-full h-full object-cover"
//               onError={handleImageError}
//               onLoad={handleImageLoad}
//             />
//           ) : (
//             // Fallback to initials or default user icon
//             <span className="text-xs font-semibold">
//               {userName ? getInitials(userName) : <User size={14} className="sm:w-4 sm:h-4" />}
//             </span>
//           )}
//         </div>
//       </div>
//     </header>
//   </div>
// );
// };

// export default Header;

import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, User, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState("");
  const [imageLoadError, setImageLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // API base URL - adjust this to match your backend
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  // Define searchable pages
  const searchablePages = [
    {
      title: "Dashboard",
      url: "/dashboard",
      description: "View analytics and statistics",
      category: "Main",
      keywords: ["home", "stats", "analytics", "overview"]
    },
    {
      title: "Patients",
      url: "/patients",
      description: "Manage patient records",
      category: "Main",
      keywords: ["patient", "records", "medical", "history"]
    },
    {
      title: "Add Patient",
      url: "/addpatient",
      description: "Register new patient",
      category: "Patients",
      keywords: ["new", "register", "add", "create"]
    },
    {
      title: "Appointments",
      url: "/appointments",
      description: "Schedule and manage appointments",
      category: "Main",
      keywords: ["schedule", "booking", "calendar", "appointments"]
    },
    {
      title: "Staff Management",
      url: "/staff",
      description: "Manage clinic staff",
      category: "Management",
      keywords: ["employees", "team", "doctors", "nurses"]
    },
    {
      title: "Lab Management",
      url: "/labmanagement",
      description: "Manage laboratory tests",
      category: "Management",
      keywords: ["lab", "tests", "reports", "diagnostics"]
    },
    {
      title: "Billing",
      url: "/billing",
      description: "Manage invoices and payments",
      category: "Finance",
      keywords: ["invoice", "payment", "charges", "bills"]
    },
    {
      title: "Finance",
      url: "/finance",
      description: "Financial reports and analytics",
      category: "Finance",
      keywords: ["revenue", "expenses", "financial", "reports"]
    },
    {
      title: "Consultant",
      url: "/consultant",
      description: "Doctor consultations",
      category: "Medical",
      keywords: ["doctor", "consultation", "diagnosis"]
    },
    {
      title: "WhatsApp Messages",
      url: "/messages",
      description: "Send messages to patients",
      category: "Communication",
      keywords: ["chat", "message", "whatsapp", "communication"]
    },
    {
      title: "Settings",
      url: "/settings",
      description: "Configure system settings",
      category: "System",
      keywords: ["config", "preferences", "setup"]
    },
    {
      title: "Profile",
      url: "/profile",
      description: "View and edit your profile",
      category: "Account",
      keywords: ["account", "user", "personal", "info"]
    },
    {
      title: "Pricing",
      url: "/pricing",
      description: "View pricing plans",
      category: "Account",
      keywords: ["subscription", "plans", "payment"]
    },
    {
      title: "Receptionist Table",
      url: "/receptionisttable",
      description: "Manage receptionists",
      category: "Management",
      keywords: ["reception", "desk", "front"]
    },
    {
      title: "Share & Referral",
      url: "/share",
      description: "Share and refer patients",
      category: "Communication",
      keywords: ["refer", "referral", "share"]
    },
    {
      title: "Permissions",
      url: "/permissions",
      description: "Manage user permissions (Admin only)",
      category: "System",
      keywords: ["access", "rights", "admin", "control"]
    }
  ];

  // Helper function to construct proper image URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('blob:')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('/')) {
      return `${API_BASE_URL}${imagePath}`;
    }
    
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
          const userData = data.admin || data.receptionist || data.user || data;
          
          setUserName(userData.name || "");
          
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

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      searchPages(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search function
  const searchPages = (searchQuery) => {
    const lowerQuery = searchQuery.toLowerCase();
    
    const filtered = searchablePages.filter((page) => {
      const titleMatch = page.title.toLowerCase().includes(lowerQuery);
      const descMatch = page.description.toLowerCase().includes(lowerQuery);
      const categoryMatch = page.category.toLowerCase().includes(lowerQuery);
      const keywordMatch = page.keywords.some(keyword => 
        keyword.toLowerCase().includes(lowerQuery)
      );
      
      return titleMatch || descMatch || categoryMatch || keywordMatch;
    }).slice(0, 8);

    setSuggestions(filtered);
    setIsOpen(filtered.length > 0);
    setIsLoading(false);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (page) => {
    navigate(page.url);
    setQuery("");
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Clear search
  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      Main: "bg-blue-100 text-blue-700",
      Patients: "bg-green-100 text-green-700",
      Management: "bg-purple-100 text-purple-700",
      Finance: "bg-yellow-100 text-yellow-700",
      Medical: "bg-red-100 text-red-700",
      Communication: "bg-indigo-100 text-indigo-700",
      System: "bg-gray-100 text-gray-700",
      Account: "bg-pink-100 text-pink-700"
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

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
        {/* Smart Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query && suggestions.length > 0 && setIsOpen(true)}
              placeholder="Search pages, features..."
              className="w-full p-3 sm:p-4 pr-20 bg-white rounded-xl text-xs sm:text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            
            <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {query && (
                <button
                  onClick={handleClear}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Search className="h-4 w-4 text-gray-400" />
            </div>

            {isLoading && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-500 px-3 py-2">
                  {suggestions.length} result{suggestions.length !== 1 ? 's' : ''} found
                </div>
                
                {suggestions.map((page, index) => (
                  <button
                    key={page.url}
                    onClick={() => handleSuggestionClick(page)}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-150 flex items-start gap-3 group ${
                      selectedIndex === index
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-800 truncate">
                          {page.title}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(page.category)}`}>
                          {page.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {page.description}
                      </p>
                      <p className="text-xs text-blue-600 mt-1 truncate">
                        {page.url}
                      </p>
                    </div>
                    
                    <ChevronRight className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${
                      selectedIndex === index ? "transform translate-x-1 text-blue-500" : ""
                    }`} />
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
                <span className="font-medium">Tip:</span> Use ↑↓ arrows to navigate, Enter to select, Esc to close
              </div>
            </div>
          )}

          {/* No Results */}
          {isOpen && query && suggestions.length === 0 && !isLoading && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
              <div className="text-center">
                <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No results found for "{query}"</p>
                <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
              </div>
            </div>
          )}
        </div>

        {/* Icons */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Profile Image */}
          <div
            onClick={() => navigate("/profile")}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full cursor-pointer relative overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm border-2 border-white shadow-sm hover:shadow-md transition-shadow flex-shrink-0"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : profileImage && !imageLoadError ? (
              <img 
                src={profileImage} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            ) : (
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