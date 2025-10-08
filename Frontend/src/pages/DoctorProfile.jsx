//DoctorProfile
import React, { useState, useEffect, useRef } from "react";
import { Edit, UserPlus, Calendar, Users, Gift, ArrowLeft, Save, X, Camera, Upload, Trash2, User, Crown, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ActionCard Component
function ActionCard({ icon, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-3 p-6 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group cursor-pointer"
        >
            <div className="text-blue-500 group-hover:text-blue-600 transition-colors">{icon}</div>
            <span className="text-sm font-medium text-gray-700 text-center leading-tight">{label}</span>
        </button>
    );
}

export default function DoctorProfile() {
    const [activeTab, setActiveTab] = useState("Overview");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [profileImagePreview, setProfileImagePreview] = useState(null);
    const [imageLoadError, setImageLoadError] = useState(false);
    const [userRole, setUserRole] = useState('Admin');
    const [subscriptionData, setSubscriptionData] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Form data state
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        email: "",
        phone: "",
        specialization: "",
        qualification: "",
        location: "",
        bio: "",
        profileImage: "",
        role: "",
        hospitalId: ""
    });

    const [originalFormData, setOriginalFormData] = useState({ ...formData });
    const [hospitalData, setHospitalData] = useState(null);

    // API base URL - adjust this to your backend URL
    const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;

    // Helper function to construct proper image URLs
    // Add this helper function to better construct image URLs
const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    console.log('🖼️ Processing image path:', imagePath);
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('blob:')) {
        console.log('✅ Using full URL:', imagePath);
        return imagePath;
    }
    
    // Remove any leading slash to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const finalUrl = `${API_BASE_URL}/${cleanPath}`;
    
    console.log('🔗 Constructed URL:', finalUrl);
    return finalUrl;
};

// Update the image loading functions in your component
const handleImageError = (e) => {
    console.log('❌ Image failed to load:', e.target.src);
    console.log('🔍 Trying alternative URL construction...');
    
    // Try alternative URL construction
    const currentSrc = e.target.src;
    const originalPath = formData.profileImage;
    
    // If this is the first failure, try without the leading slash
    if (originalPath && originalPath.startsWith('/uploads/')) {
        const altUrl = `${API_BASE_URL}${originalPath}`;
        if (currentSrc !== altUrl) {
            console.log('🔄 Retrying with alternative URL:', altUrl);
            e.target.src = altUrl;
            return;
        }
    }
    
    // If still failing, try with direct uploads path
    if (originalPath && originalPath.includes('uploads/profiles/')) {
        const filename = originalPath.split('/').pop();
        const directUrl = `${API_BASE_URL}/uploads/profiles/${filename}`;
        if (currentSrc !== directUrl) {
            console.log('🔄 Retrying with direct URL:', directUrl);
            e.target.src = directUrl;
            return;
        }
    }
    
    // All attempts failed, show fallback
    console.log('❌ All image load attempts failed, showing fallback');
    setImageLoadError(true);
    e.target.style.display = 'none';
    
    // Show the fallback initial
    const fallback = e.target.parentNode.querySelector('.fallback-initial');
    if (fallback) {
        fallback.style.display = 'flex';
    }
};

// Add a test function to check image accessibility
const testImageUrl = async (url) => {
    try {
        console.log('🧪 Testing image URL:', url);
        const response = await fetch(url, { method: 'HEAD' });
        console.log('📡 Image test response:', response.status);
        return response.ok;
    } catch (error) {
        console.error('❌ Image test failed:', error);
        return false;
    }
};

// Update the loadProfile function to better handle image URLs
const loadProfile = async () => {
    try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('No token found - user needs to login');
            alert('Please login to access your profile');
            return;
        }

        console.log('🔄 Loading profile with token:', token.substring(0, 20) + '...');

        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('📡 Profile API response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Profile data received:', data);
            
            // Extract user data based on response structure
            const userData = data.admin || data.receptionist || data.user || data;
            const hospital = data.hospital;
            
            console.log('👤 User data extracted:', userData);
            console.log('🏥 Hospital data extracted:', hospital);
            
            const profileData = {
                id: userData._id || userData.id || "",
                name: userData.name || "",
                email: userData.email || "",
                phone: userData.phone || userData.primaryNumber || "",
                specialization: userData.specialization || "",
                qualification: userData.qualification || "",
                location: userData.location || "",
                bio: userData.bio || "",
                profileImage: userData.profileImage || "",
                role: userData.role || "Admin",
                hospitalId: userData.hospitalId || ""
            };
            
            console.log('📝 Final profile data:', profileData);
            
            setFormData(profileData);
            setOriginalFormData(profileData);
            setUserRole(userData.role || "Admin");
            
            // Set hospital data if available
            if (hospital) {
                setHospitalData(hospital);
                console.log('🏥 Hospital data set:', hospital);
            }
            
            // Handle profile image with better error handling
            if (userData.profileImage) {
                console.log('🖼️ Processing profile image:', userData.profileImage);
                
                const imageUrl = getImageUrl(userData.profileImage);
                console.log('🔗 Final image URL:', imageUrl);
                
                // Test if the image URL is accessible
                const isAccessible = await testImageUrl(imageUrl);
                if (isAccessible) {
                    setProfileImagePreview(imageUrl);
                    setImageLoadError(false);
                    console.log('✅ Profile image URL verified and set');
                } else {
                    console.log('❌ Profile image URL not accessible, will show fallback');
                    setProfileImagePreview(null);
                    setImageLoadError(true);
                }
            } else {
                console.log('ℹ️ No profile image found');
                setProfileImagePreview(null);
                setImageLoadError(false);
            }
        } else if (response.status === 401) {
            console.error('❌ Token expired or invalid');
            localStorage.removeItem('token');
            alert('Session expired. Please login again.');
        } else {
            const errorText = await response.text();
            console.error('❌ Failed to load profile:', response.statusText, errorText);
            alert('Failed to load profile: ' + (response.statusText || 'Unknown error'));
        }
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        alert('Network error while loading profile. Please check your connection.');
    } finally {
        setLoading(false);
    }
};

// Add a debug function to test uploads endpoint
const testUploadsEndpoint = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/test-uploads`);
        const data = await response.json();
        console.log('📁 Uploads directory test:', data);
        return data;
    } catch (error) {
        console.error('❌ Failed to test uploads endpoint:', error);
        return null;
    }
};
    // Load profile data on component mount
    useEffect(() => {
        loadProfile();
        loadSubscriptionData();
    }, []);

    // Mock subscription data - replace with actual API call
   const loadSubscriptionData = async () => {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('No token found');
            setSubscriptionData(null);
            return;
        }

        console.log('🔄 Loading subscription data...');

        const response = await fetch(`${API_BASE_URL}/api/payments/subscription-status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('📡 Subscription API response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Subscription data received:', data);
            
            if (data.hasActiveSubscription && data.subscription) {
                const sub = data.subscription;
                
                // Map the API response to your component's expected format
                const formattedSubscription = {
                    planName: sub.planType,
                    status: sub.status,
                    validUntil: new Date(sub.endDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    features: formatFeatures(sub.features),
                    daysLeft: sub.daysRemaining,
                    isExpiringSoon: sub.isExpiringSoon,
                    startDate: sub.startDate,
                    endDate: sub.endDate,
                    amount: sub.amount,
                    planDetails: sub
                };
                
                setSubscriptionData(formattedSubscription);
                console.log('✅ Subscription data formatted and set:', formattedSubscription);
            } else {
                console.log('ℹ️ No active subscription found');
                setSubscriptionData(null);
            }
        } else if (response.status === 401) {
            console.error('❌ Token expired or invalid');
            localStorage.removeItem('token');
            setSubscriptionData(null);
        } else {
            const errorText = await response.text();
            console.error('❌ Failed to load subscription:', errorText);
            setSubscriptionData(null);
        }
    } catch (error) {
        console.error('❌ Error loading subscription data:', error);
        setSubscriptionData(null);
    }
};

const formatFeatures = (features) => {
    if (!features) return [];
    
    const featureList = [];
    
    if (features.maxPatients) {
        featureList.push(features.maxPatients === -1 ? 
            'Unlimited Patients' : 
            `Up to ${features.maxPatients} Patients`
        );
    }
    
    if (features.hasAdvancedReporting) {
        featureList.push('Advanced Analytics & Reporting');
    }
    
    if (features.hasPrioritySupport) {
        featureList.push('Priority Support');
    }
    
    if (features.hasApiAccess) {
        featureList.push('API Access');
    }
    
    if (features.hasWhiteLabel) {
        featureList.push('Custom Branding');
    }
    
    // Add default features
    featureList.push('Appointment Scheduling');
    featureList.push('Patient Records Management');
    featureList.push('Multi-device Sync');
    
    return featureList;
};

   
    const handleBackClick = () => {
        // Navigate back - implement your navigation logic
        navigate(-1); // Go back to previous page
    };

    // Handle image load success
    const handleImageLoad = (e) => {
        console.log('✅ Image loaded successfully:', e.target.src);
        setImageLoadError(false);
        // Hide the fallback initial
        const fallback = e.target.parentNode.querySelector('.fallback-initial');
        if (fallback) {
            fallback.style.display = 'none';
        }
    };

    // Update profile with better error handling
    const updateProfile = async (profileData) => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔄 Updating profile with data:', profileData);

            // Create proper update payload - keep all fields, even empty ones
            const updatePayload = {
                name: profileData.name || "",
                qualification: profileData.qualification || "",
                phone: profileData.phone || "",
                specialization: profileData.specialization || "",
                location: profileData.location || "",
                bio: profileData.bio || "",
                // Add any other fields your backend expects
                primaryNumber: profileData.phone || "", // Backend might expect this field name
            };

            console.log('📤 Final update payload:', updatePayload);

            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatePayload),
            });

            console.log('📡 Update response status:', response.status);
            
            // Get response text first
            const responseText = await response.text();
            console.log('📡 Raw response:', responseText);

            if (!response.ok) {
                let errorMessage = 'Failed to update profile';
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                    console.error('❌ Server error details:', errorData);
                } catch {
                    errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            // Try to parse JSON response
            let data;
            try {
                data = JSON.parse(responseText);
            } catch {
                // If response is not JSON, treat as success
                data = { message: 'Profile updated successfully' };
            }
            
            console.log('✅ Profile updated successfully:', data);
            
            // Reload profile data to get the latest from server
            await loadProfile();
            
            return data;
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            throw error;
        }
    };

    // Upload profile image
    const uploadProfileImage = async (file) => {
        try {
            setUploadingImage(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🖼️ Uploading image:', file.name, file.size, 'bytes');

            const formDataObj = new FormData();
            formDataObj.append('profileImage', file);

            const response = await fetch(`${API_BASE_URL}/api/auth/profile/upload-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formDataObj,
            });

            console.log('📡 Image upload response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload error response:', errorText);
                let errorMessage = 'Failed to upload image';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch {
                data = { profileImage: URL.createObjectURL(file) };
            }
            
            console.log('✅ Image uploaded successfully:', data);
            
            // Update profile image in state
            const newProfileImage = data.profileImage || data.user?.profileImage || URL.createObjectURL(file);
            
            setFormData(prev => ({ ...prev, profileImage: newProfileImage }));
            const imageUrl = getImageUrl(newProfileImage);
            setProfileImagePreview(imageUrl);
            setImageLoadError(false);
            console.log('🖼️ Profile image updated in state:', imageUrl);
            
            return data;
        } catch (error) {
            console.error('❌ Error uploading image:', error);
            throw error;
        } finally {
            setUploadingImage(false);
        }
    };

    // Delete profile image
    const deleteProfileImage = async () => {
        try {
            setUploadingImage(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🗑️ Deleting profile image...');

            const response = await fetch(`${API_BASE_URL}/api/auth/profile/image`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log('📡 Delete image response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Failed to delete image';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            console.log('✅ Image deleted successfully');
            
            // Clear profile image in state
            setFormData(prev => ({ ...prev, profileImage: "" }));
            setProfileImagePreview(null);
            setImageLoadError(false);
            
            return { message: 'Image deleted successfully' };
        } catch (error) {
            console.error('❌ Error deleting image:', error);
            throw error;
        } finally {
            setUploadingImage(false);
        }
    };

    // Handle file selection
    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        try {
            await uploadProfileImage(file);
            alert('Profile image uploaded successfully!');
        } catch (error) {
            alert('Failed to upload image: ' + error.message);
        }
        
        // Clear the input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle delete image
    const handleDeleteImage = async () => {
        if (window.confirm('Are you sure you want to delete your profile image?')) {
            try {
                await deleteProfileImage();
                alert('Profile image deleted successfully!');
            } catch (error) {
                alert('Failed to delete image: ' + error.message);
            }
        }
    };

    const handleEdit = () => {
        setOriginalFormData({ ...formData });
        setIsEditing(true);
        console.log('📝 Edit mode enabled');
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            console.log('💾 Saving profile changes...', formData);
            
            // Validate required fields
            if (!formData.name || formData.name.trim() === '') {
                alert('Name is required');
                return;
            }

            await updateProfile(formData);
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('❌ Update error:', error);
            alert('Failed to update profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({ ...originalFormData });
        setIsEditing(false);
        console.log('❌ Edit cancelled, reverted changes');
    };

    // Use the React Router navigate function
    const handleNavigate = (path) => {
        console.log(`🔄 Navigating to: ${path}`);
        navigate(path);
    };

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(`📝 Field changing: ${name} = "${value}"`);
        
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            console.log('📝 Updated form data:', newData);
            return newData;
        });
    };

    const renderEditButton = () => {
        if (activeTab !== "Personal Info") return null;

        if (isEditing) {
            return (
                <div className="flex gap-2">
                    <button
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        <X className="w-4 h-4" />
                        Cancel
                    </button>
                </div>
            );
        } else {
            return (
                <button
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    onClick={handleEdit}
                >
                    <Edit size={16} /> Edit Profile
                </button>
            );
        }
    };

    // Show loading state
    if (loading && !formData.name) {
        return (
            <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

return (
    <div className="p-3 sm:p-6 bg-gray-100 min-h-screen">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg mb-4 sm:mb-6">
            <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <ArrowLeft
                        size={18}
                        className="text-gray-600 cursor-pointer hover:text-gray-800 transition-colors flex-shrink-0 sm:w-5 sm:h-5"
                        onClick={handleBackClick}
                    />
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Doctor Profile</h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 truncate">
                            Manage your professional information • Role: {userRole}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                    {renderEditButton()}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-gray-50 overflow-x-auto">
                <div className="flex justify-between items-start mx-auto w-full min-w-max sm:min-w-0">
                    <button
                        onClick={() => setActiveTab("Overview")}
                        className={`px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors relative ml-4 sm:ml-10 cursor-pointer whitespace-nowrap ${
                            activeTab === "Overview"
                                ? "text-blue-600"
                                : "text-gray-600 hover:text-gray-800"
                        }`}
                    >
                        Overview
                        {activeTab === "Overview" && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab("Personal Info")}
                        className={`px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
                            activeTab === "Personal Info"
                                ? "text-blue-600"
                                : "text-gray-600 hover:text-gray-800"
                        }`}
                    >
                        Personal Info
                        {activeTab === "Personal Info" && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab("Subscription")}
                        className={`px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors relative mr-4 sm:mr-10 cursor-pointer whitespace-nowrap ${
                            activeTab === "Subscription"
                                ? "text-blue-600"
                                : "text-gray-600 hover:text-gray-800"
                        }`}
                    >
                        Subscription
                        {activeTab === "Subscription" && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></span>
                        )}
                    </button>
                </div>
            </div>
        </div>

        {/* Content */}
        <div>
            {activeTab === "Overview" && (
                <OverviewTab 
                    navigate={handleNavigate} 
                    formData={formData} 
                    hospitalData={hospitalData}
                    profileImagePreview={profileImagePreview}
                    imageLoadError={imageLoadError}
                    handleImageError={handleImageError}
                    handleImageLoad={handleImageLoad}
                />
            )}
            {activeTab === "Personal Info" && (
                <PersonalInfoTab
                    formData={formData}
                    handleInputChange={handleInputChange}
                    isEditing={isEditing}
                    profileImagePreview={profileImagePreview}
                    handleFileSelect={handleFileSelect}
                    handleDeleteImage={handleDeleteImage}
                    uploadingImage={uploadingImage}
                    fileInputRef={fileInputRef}
                    imageLoadError={imageLoadError}
                    handleImageError={handleImageError}
                    handleImageLoad={handleImageLoad}
                />
            )}
            {activeTab === "Subscription" && (
                <SubscriptionTab 
                    subscriptionData={subscriptionData}
                    navigate={handleNavigate}
                />
            )}
        </div>
    </div>
);

function OverviewTab({ navigate, formData, hospitalData, profileImagePreview, imageLoadError, handleImageError, handleImageLoad }) {
    const getInitials = (name) => {
        if (!name) return "U";
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div>
            {/* Doctor Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-100 flex items-center justify-center text-lg sm:text-xl font-bold text-blue-600 flex-shrink-0 overflow-hidden relative">
                        {profileImagePreview && !imageLoadError && (
                            <img 
                                src={profileImagePreview} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                                onLoad={handleImageLoad}
                            />
                        )}
                        <div className={`fallback-initial w-full h-full flex items-center justify-center absolute inset-0 ${profileImagePreview && !imageLoadError ? 'hidden' : 'flex'}`}>
                            {getInitials(formData.name)}
                        </div>
                    </div>
                    <div className="flex-1 w-full min-w-0">
                        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2 sm:gap-0">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 truncate">
                                    {formData.name || "User Name"}
                                </h2>
                                <p className="text-sm sm:text-base text-gray-600 mb-1 truncate">
                                    {formData.specialization || "General Practice"}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 break-all">{formData.email}</p>
                                {formData.qualification && (
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                        {formData.qualification}
                                    </p>
                                )}
                                {formData.phone && (
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                        📞 {formData.phone}
                                    </p>
                                )}
                                {formData.location && (
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                                        📍 {formData.location}
                                    </p>
                                )}
                            </div>
                            <span className="px-2.5 sm:px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium whitespace-nowrap flex-shrink-0">
                                {formData.role} Member
                            </span>
                        </div>
                        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                            {formData.bio || "No bio available. Click 'Edit Profile' to add your professional information."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <ActionCard
                        icon={<UserPlus size={20} className="sm:w-6 sm:h-6" />}
                        label="Add New Patient"
                        onClick={() => navigate("/addpatient")}
                    />
                    <ActionCard
                        icon={<Calendar size={20} className="sm:w-6 sm:h-6" />}
                        label="View Appointments"
                        onClick={() => navigate("/appointments")}
                    />
                    <ActionCard
                        icon={<Users size={20} className="sm:w-6 sm:h-6" />}
                        label="Manage Staff"
                        onClick={() => navigate("/staff")}
                    />
                    <ActionCard
                        icon={<Gift size={20} className="sm:w-6 sm:h-6" />}
                        label="Refers & Earn"
                        onClick={() => navigate("/share")}
                    />
                </div>
            </div>
        </div>
    );
}

function PersonalInfoTab({ 
    formData, 
    handleInputChange, 
    isEditing, 
    profileImagePreview, 
    handleFileSelect, 
    handleDeleteImage, 
    uploadingImage, 
    fileInputRef,
    imageLoadError,
    handleImageError,
    handleImageLoad
}) {
    const getInitials = (name) => {
        if (!name) return "U";
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="flex justify-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 w-full">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 sm:mb-6">Personal Information</h3>
                
                {/* Profile Image Section */}
                <div className="flex flex-col items-center mb-6 sm:mb-8">
                    <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-100 flex items-center justify-center text-xl sm:text-2xl font-bold text-blue-600 overflow-hidden border-4 border-white shadow-lg relative">
                            {profileImagePreview && !imageLoadError && (
                                <img 
                                    src={profileImagePreview} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover"
                                    onError={handleImageError}
                                    onLoad={handleImageLoad}
                                />
                            )}
                            <div className={`fallback-initial w-full h-full flex items-center justify-center absolute inset-0 ${profileImagePreview && !imageLoadError ? 'hidden' : 'flex'}`}>
                                {getInitials(formData.name)}
                            </div>
                        </div>
                        
                        {isEditing && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                                className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-1.5 sm:p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
                                title="Upload new image"
                            >
                                {uploadingImage ? (
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Camera size={14} className="sm:w-4 sm:h-4" />
                                )}
                            </button>
                        )}
                    </div>
                    
                    {isEditing && (
                        <div className="flex gap-2 mt-3 sm:mt-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Upload size={12} className="sm:w-3.5 sm:h-3.5" />
                                Upload Image
                            </button>
                            
                            {profileImagePreview && (
                                <button
                                    onClick={handleDeleteImage}
                                    disabled={uploadingImage}
                                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                                    Remove
                                </button>
                            )}
                        </div>
                    )}
                    
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        className="hidden"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {[
                        { label: "Full Name", name: "name", placeholder: "e.g. Dr. John Smith" },
                        { label: "Email", name: "email", placeholder: "e.g. john.smith@email.com", disabled: true },
                        { label: "Phone", name: "phone", placeholder: "e.g. 9876543210" },
                        { label: "Specialization", name: "specialization", placeholder: "e.g. General Practice" },
                        { label: "Qualification", name: "qualification", placeholder: "e.g. MBBS, MD" },
                        { label: "Location", name: "location", placeholder: "e.g. City, State" },
                    ].map((field) => (
                        <div key={field.name}>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                {field.label}
                                {field.disabled && <span className="text-gray-400 ml-1">(Read-only)</span>}
                            </label>
                            <input
                                type="text"
                                name={field.name}
                                value={formData[field.name] || ""}
                                onChange={handleInputChange}
                                placeholder={field.placeholder}
                                disabled={!isEditing || field.disabled}
                                className={`w-full border rounded-lg px-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-colors ${
                                    isEditing && !field.disabled
                                        ? "bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        : "bg-gray-50 border-gray-200 text-gray-600"
                                } focus:outline-none`}
                            />
                        </div>
                    ))}
                    <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio || ""}
                            onChange={handleInputChange}
                            placeholder="Tell us about yourself and your practice..."
                            disabled={!isEditing}
                            rows={4}
                            className={`w-full border rounded-lg px-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-colors resize-none ${
                                isEditing
                                    ? "bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    : "bg-gray-50 border-gray-200 text-gray-600"
                            } focus:outline-none`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function SubscriptionTab({ subscriptionData, navigate }) {
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'trial':
                return 'bg-blue-100 text-blue-800';
            case 'expired':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;
            case 'trial':
                return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />;
            case 'expired':
                return <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />;
            default:
                return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />;
        }
    };

    const getPlanDisplayName = (planName) => {
        const planMap = {
            'Free Trial': '7-Day Free Trial',
            'Monthly Plan': 'Professional Monthly',
            'Yearly Plan': 'Enterprise Yearly'
        };
        return planMap[planName] || planName;
    };

    if (!subscriptionData) {
        return (
            <div className="flex justify-center">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 w-full max-w-2xl text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Active Subscription</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                        Subscribe to unlock advanced features and grow your practice with powerful tools.
                    </p>
                    <button
                        onClick={() => navigate('/pricing')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
                    >
                        View Pricing Plans
                    </button>
                </div>
            </div>
        );
    }

    const daysLeftPercentage = subscriptionData.planName === 'Free Trial' 
        ? (subscriptionData.daysLeft / 7) * 100
        : subscriptionData.planName === 'Monthly Plan'
        ? (subscriptionData.daysLeft / 30) * 100
        : (subscriptionData.daysLeft / 365) * 100;

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Current Plan Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Current Subscription</h3>
                            <p className="text-xs sm:text-sm text-gray-600">Your active plan details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {getStatusIcon(subscriptionData.status)}
                        <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(subscriptionData.status)}`}>
                            {subscriptionData.status === 'active' ? 'Active' : 
                             subscriptionData.status === 'trial' ? 'Free Trial' : 'Expired'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                    <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-gray-900 break-words">
                            {getPlanDisplayName(subscriptionData.planName)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">Current Plan</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className={`text-lg sm:text-2xl font-bold ${subscriptionData.isExpiringSoon ? 'text-orange-600' : 'text-blue-600'}`}>
                            {subscriptionData.daysLeft}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">Days Remaining</div>
                        {subscriptionData.isExpiringSoon && (
                            <div className="text-xs text-orange-600 mt-1">⚠️ Expiring Soon</div>
                        )}
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-gray-900">
                            {subscriptionData.validUntil}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">Valid Until</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 sm:mt-6">
                    <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                        <span>Time Used</span>
                        <span>{Math.round(100 - daysLeftPercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full transition-all ${
                                subscriptionData.isExpiringSoon ? 'bg-orange-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.round(100 - daysLeftPercentage)}%` }}
                        ></div>
                    </div>
                </div>

                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                        onClick={() => navigate('/pricing')}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
                    >
                        {subscriptionData.planName === 'Free Trial' ? 'Upgrade Plan' : 'Change Plan'}
                    </button>
                    <button
                        onClick={() => navigate('/billing')}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
                    >
                        View Billing
                    </button>
                </div>
            </div>

            {/* Features Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Plan Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {subscriptionData.features && subscriptionData.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 sm:gap-3">
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-700">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Usage Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Usage Statistics</h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    Track your usage across various features and services
                </p>
                <div className="space-y-3 sm:space-y-4">
                    <div>
                        <div className="flex justify-between text-xs sm:text-sm mb-2">
                            <span className="text-gray-600">Patients Added</span>
                            <span className="text-gray-900 font-medium">View Details</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
}