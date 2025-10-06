//AddPatient

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, User, ChevronDown, Wallet, PlusCircle, Camera, Plus, Edit, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from 'jwt-decode';
import { Share2 } from "lucide-react";
import OutPatientRecordModal from '../components/PatientManagement/OutPatientRecordModal'


// Auto-save constants
const DRAFT_KEY = 'patientFormDraft';
const AUTO_SAVE_DELAY = 1000; // Auto-save after 1 second of inactivity

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
    });
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('Token invalid or expired, redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      localStorage.removeItem('hospital');
      window.location.href = '/login';
    } else if (error.response && error.response.status === 404) {
      console.error('API endpoint not found:', error.config.url);
      toast.error('API endpoint not found. Please check backend server.');
    }
    return Promise.reject(error);
  }
);

// Country data with flags and codes
const countries = [
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  // Add more countries as needed
];

const CountrySelect = ({ value, onChange, name }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (code) => {
    onChange({ target: { name, value: code } });
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative">
      <div
        className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value ? `${countries.find(c => c.code === value)?.flag || ''} ${value}` : 'Select'}</span>
        <ChevronDown className="absolute right-3 w-4 h-4 text-gray-400" />
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country..."
            className="w-full px-3 py-2 border-b border-gray-200 text-sm focus:outline-none"
          />
          {filteredCountries.map((country) => (
            <div
              key={country.code}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => handleSelect(country.code)}
            >
              {country.flag} {country.name} ({country.code})
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AddPatient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    age: 0,
    gender: '',
    bloodType: '',
    status: 'active',
    patientType: '',
    memberSince: '',
    lastVisit: '',
    primaryNumber: '',
    primaryCountryCode: '+91', // Default to India
    emailAddress: '',
    address: '',
    city: '',
    phoneNumber: '',
    phoneCountryCode: '+91',
    stateProvince: '',
    zipPostalCode: '',
    emergencyContactName: '',
    relationship: '',
    emergencyContactNumber: '',
    emergencyCountryCode: '+91',
    emergencyContactEmail: '',
    primaryDentalIssue: '',
    currentSymptoms: '',
    allergies: '',
    medicalHistory: '',
    currentMedications: '',
    diabetes: false,
    hypertension: false,
    cardiacHeartProblems: false,
    disordersOthers: '',
    smoking: false,
    drinking: false,
    gutkaChewing: false,
    disordersOthersSpecify: false,
    totalPaid: '',
    opFee: '',
    lastPayment: '',
    paymentMethod: '',
    customFields: '',
    avatar: '',
    appointments: [
      {
        appointmentDate: '',
        appointmentTime: '',
        treatment: '',
        doctor: '',
      },
    ],
    personalCustomFields: [],
    contactCustomFields: [],
    emergencyCustomFields: [],
    medicalCustomFields: [],
    paymentCustomFields: [],
    appointmentCustomFields: [],
  });

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('');
  const [newField, setNewField] = useState({ label: '', type: 'text', applyToAll: false });
  const [hospitalId, setHospitalId] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false); // Add this state
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const [editingField, setEditingField] = useState(null);
  const [fileInputRef, setFileInputRef] = useState(null);
  
  // Auto-save state variables
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Auto-save function
  const autoSaveFormData = useCallback((data) => {
    try {
      const dataToSave = {
        ...data,
        _lastSaved: Date.now()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, []);

  // Clear draft function
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setLastSaved(null);
  };

 const handlePrintReceipt = () => {
  // Only allow printing if patient has been created
  if (!formData.createdPatientDetails) {
    toast.warning('Please save the patient first before printing receipt');
    return;
  }
  setShowPrintModal(true);
};

// Add these new functions
const handlePrintYes = () => {
  console.log('🎯 handlePrintYes - Opening modal with:', {
    patientId: formData.createdPatientDetails?.databaseId || formData.createdPatientDetails?._id,
    _id: formData.createdPatientDetails?._id,
    databaseId: formData.createdPatientDetails?.databaseId,
    hospitalId: hospitalId,
    hasPatientDetails: !!formData.createdPatientDetails,
    fullPatientDetails: formData.createdPatientDetails
  });
  
  setShowPrintDialog(false);
  setShowPrintModal(true);
};
const handlePrintNo = () => {
  setShowPrintDialog(false);
  resetFormDataCompletely(); 
  navigateToPatients();
};

const handlePrintModalClose = () => {
  setShowPrintModal(false);
  resetFormDataCompletely(); // Add this line
  navigateToPatients();
};

const navigateToPatients = () => {
  navigate('/patients', {
    state: {
      newPatient: formData.createdPatientDetails,
      showSuccess: true,
      message: `Patient "${formData.createdPatientDetails?.name || 'Unknown'}" was successfully added!`
    }
  });
};


  // Load saved draft on component mount
  useEffect(() => {
   const savedDraft = localStorage.getItem(DRAFT_KEY);
if (savedDraft) {
  try {
    const parsedDraft = JSON.parse(savedDraft);
    // Only load if there's meaningful data (not just default values)
    const hasData = parsedDraft.firstName || parsedDraft.lastName || parsedDraft.emailAddress || parsedDraft.primaryNumber || parsedDraft.primaryDentalIssue || parsedDraft.address;
    if (hasData) {
      // Preserve the current patientId and don't overwrite it
      const currentPatientId = formData.patientId;
      setFormData({
        ...parsedDraft,
        patientId: currentPatientId || parsedDraft.patientId
      });
      setLastSaved(new Date(parsedDraft._lastSaved || Date.now()));
      toast.info('Previous draft restored');
    }
  } catch (error) {
    console.error('Error loading draft:', error);
    localStorage.removeItem(DRAFT_KEY);
  }
}
  }, []);

  // Auto-save form data when it changes
  useEffect(() => {
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new timeout for auto-save
    const timeoutId = setTimeout(() => {
     // Only save if there's meaningful data
      const hasData = formData.firstName || formData.lastName || formData.emailAddress || formData.primaryNumber;
      if (hasData) {
        autoSaveFormData(formData);
      }
      

    }, AUTO_SAVE_DELAY);

    setAutoSaveTimeout(timeoutId);

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [formData, autoSaveFormData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedHospital = localStorage.getItem('hospital');
    const storedAdmin = localStorage.getItem('admin');

    console.log('Stored Admin:', storedAdmin);
    console.log('Stored Hospital:', storedHospital);
    console.log('Token:', token);

    if (!token) {
      toast.error('No authentication token found. Please log in.');
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const fetchedAdminId = decoded.id;
      setAdminId(fetchedAdminId);

      if (storedHospital) {
        const hospital = JSON.parse(storedHospital);
        if (hospital._id && hospital.adminId === fetchedAdminId) {
          console.log('Using hospitalId from localStorage:', hospital._id);
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

      axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`)
        .then((response) => {
          console.log('Fetched user profile:', response.data);
          const fetchedHospitalId = response.data.hospital?._id;
          if (fetchedHospitalId) {
            setHospitalId(fetchedHospitalId);
            localStorage.setItem('hospital', JSON.stringify({ _id: fetchedHospitalId, adminId: fetchedAdminId }));
            localStorage.setItem('admin', JSON.stringify({ _id: fetchedAdminId }));
          } else {
            toast.error('No hospital ID found. Please complete hospital setup.');
            navigate('/hospitalform');
          }
        })
        .catch((err) => {
          console.error('Error fetching user profile:', err);
          toast.error('Failed to fetch hospital ID');
          navigate('/login');
        });
    } catch (err) {
      console.error('Error decoding token:', err);
      toast.error('Invalid token');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      setFormData((prev) => ({ ...prev, age }));
    }
  }, [formData.dateOfBirth]);

  useEffect(() => {
    if (hospitalId) {
      const token = localStorage.getItem('token');
      axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/hospitals/${hospitalId}/generate-patient-id`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
        .then((res) => {
          setFormData((prev) => ({ ...prev, patientId: res.data.patientId }));
          console.log('Patient ID generated successfully:', res.data.patientId);
        })
        .catch((err) => {
          console.error('Failed to fetch patient ID:', err);
          toast.error('Failed to generate patient ID');
        });
    }
  }, [hospitalId]);

  const handleBackClick = () => {
    //clearDraft(); // Clear auto-saved data from localStorage
    resetFormDataCompletely();
    navigate('/patients');
  };

  // Validation functions
  const restrictToAlphabetsAndSpaces = (value) => {
    return value.replace(/[^a-zA-Z\s]/g, '');
  };

  const restrictToNumbers = (value) => {
    return value.replace(/[^0-9]/g, '');
  };

  const restrictPhoneNumber = (value) => {
    let numericValue = value.startsWith('+') ? value.slice(1) : value;
    numericValue = numericValue.replace(/[^0-9]/g, '');
    const maxLength = 10; // Strictly 10 digits
    if (numericValue.length > maxLength) {
      toast.warn('Phone number must be exactly 10 digits');
      numericValue = numericValue.slice(0, maxLength);
    }
    return numericValue;
  };

  // New function to validate phone number length
  const validatePhoneNumber = (value) => {
    return value.length === 10; // Exactly 10 digits required
  };

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validateDate = (value) => {
    if (!value) return true; // Empty date is valid
    const date = new Date(value);
    return !isNaN(date.getTime());
  };

  const handleInputChange = (e, index = null, sectionType = null) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;

    // Apply validation based on field name
    if (['firstName', 'lastName', 'emergencyContactName', 'city', 'stateProvince', 'primaryDentalIssue', 'currentSymptoms', 'disordersOthers', 'currentMedications', 'address', 'treatment', 'doctor'].includes(name)) {
      newValue = restrictToAlphabetsAndSpaces(value);
    } else if (name === 'allergies') {
      newValue = value.replace(/[^0-9\/]/g, '');
    }
    else if (['primaryNumber', 'phoneNumber', 'emergencyContactNumber'].includes(name)) {
      newValue = restrictPhoneNumber(value);
      if (newValue.length > 10) {
        toast.warn('Phone number must be exactly 10 digits');
      }   
    } else if (['totalPaid', 'opFee', 'lastPayment'].includes(name)) {
      newValue = restrictToNumbers(value);
    } else if (['emailAddress', 'emergencyContactEmail'].includes(name)) {
      newValue = value; // Email validation will be checked on save
    } else if (['primaryCountryCode', 'phoneCountryCode', 'emergencyCountryCode'].includes(name)) {
      newValue = value; // Allow country code to be set
    } else if (['dateOfBirth', 'memberSince', 'lastVisit', 'appointmentDate'].includes(name)) {
      newValue = value; // Date validation will be checked on save
    }

    if (sectionType && index !== null) {
      setFormData((prev) => {
        const fieldName = `${sectionType}CustomFields`;
        const updatedFields = [...prev[fieldName]];
        updatedFields[index] = {
          ...updatedFields[index],
          [name]: newValue,
        };
        return { ...prev, [fieldName]: updatedFields };
      });
    } else if (index !== null) {
      setFormData((prev) => {
        const updatedCustomFields = [...prev.customFields];
        updatedCustomFields[index] = {
          ...updatedCustomFields[index],
          [name]: newValue,
        };
        return { ...prev, customFields: updatedCustomFields };
      });
    } else if (['appointmentDate', 'appointmentTime', 'treatment', 'doctor'].includes(name)) {
      setFormData((prev) => {
        const updatedAppointments = [...prev.appointments];
        updatedAppointments[0] = {
          ...updatedAppointments[0],
          [name]: newValue,
        };
        return { ...prev, appointments: updatedAppointments };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : newValue,
      }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatar: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef) {
      fileInputRef.click();
    }
  };

  const handleOpenPopup = (section) => {
    setCurrentSection(section);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setNewField({ label: '', type: 'text', applyToAll: false });
    setCurrentSection('');
    setEditingField(null);
    setIsPopupOpen(false);
  };

  const handlePopupInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewField((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddCustomField = async () => {
    if (!newField.label.trim() || !newField.type.trim()) {
      toast.error('Please fill in both label and field type.');
      return;
    }

    const fieldName = `${currentSection}CustomFields`;
    if (editingField !== null) {
      setFormData((prev) => {
        const updatedFields = [...prev[fieldName]];
        updatedFields[editingField.index] = {
          label: newField.label,
          value: editingField.value,
          type: newField.type
        };
        return { ...prev, [fieldName]: updatedFields };
      });
      toast.success('Custom field updated successfully!');
    } else {
      const newCustomField = { label: newField.label, value: '', type: newField.type };
      if (newField.applyToAll && hospitalId) {
        try {
          await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/patients/${hospitalId}/add-custom-field`, {
            label: newField.label,
            value: '',
            section: currentSection,
          });
          toast.success('Custom field added to all patients successfully!');
        } catch (err) {
          console.error('Error adding custom field to all patients:', err);
          toast.error('Failed to add custom field to all patients');
        }
      }

      setFormData((prev) => ({
        ...prev,
        [fieldName]: [...prev[fieldName], newCustomField],
      }));
      toast.success('Custom field added successfully!');
    }

    handleClosePopup();
  };

  const handleEditField = (index, field, sectionType) => {
    setEditingField({ index, value: field.value, sectionType });
    setNewField({ label: field.label, type: field.type || 'text', applyToAll: false });
    setCurrentSection(sectionType);
    setIsPopupOpen(true);
  };

  const handleRemoveCustomField = (index, sectionType) => {
    if (window.confirm('Are you sure you want to delete this custom field?')) {
      const fieldName = `${sectionType}CustomFields`;
      setFormData((prev) => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((_, i) => i !== index),
      }));
      toast.success('Custom field removed successfully!');
    }
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSaveDraft = () => {
    console.log('Saving draft:', formData);
    toast.success('Draft saved successfully!');
  };

const handleSaveAndProceed = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No authentication token found. Please log in.');
      navigate('/login');
      return;
    }
    if (!hospitalId) {
      toast.error('Invalid hospital ID');
      return;
    }
    if (!adminId) {
      toast.error('Invalid admin ID');
      return;
    }

    // Validate phone numbers for exactly 10 digits if provided
    if (formData.primaryNumber && !validatePhoneNumber(formData.primaryNumber)) {
      toast.error('Primary phone number must be exactly 10 digits');
      return;
    }
    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    if (formData.emergencyContactNumber && !validatePhoneNumber(formData.emergencyContactNumber)) {
      toast.error('Emergency contact number must be exactly 10 digits');
      return;
    }

    // Validate email fields only if provided
    if (formData.emailAddress && !validateEmail(formData.emailAddress)) {
      toast.error('Invalid email address format');
      return;
    }
    if (formData.emergencyContactEmail && !validateEmail(formData.emergencyContactEmail)) {
      toast.error('Invalid emergency contact email format');
      return;
    }

    // Validate date fields only if provided
    if (formData.dateOfBirth && !validateDate(formData.dateOfBirth)) {
      toast.error('Invalid date of birth');
      return;
    }
    if (formData.memberSince && !validateDate(formData.memberSince)) {
      toast.error('Invalid member since date');
      return;
    }
    if (formData.lastVisit && !validateDate(formData.lastVisit)) {
      toast.error('Invalid last visit date');
      return;
    }
    if (formData.appointments[0].appointmentDate && !validateDate(formData.appointments[0].appointmentDate)) {
      toast.error('Invalid appointment date');
      return;
    }

    // Validate appointmentTime format (HH:MM) only if provided
    if (formData.appointments[0].appointmentTime && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(formData.appointments[0].appointmentTime)) {
      toast.error('Invalid appointment time format. Use HH:MM (e.g., 14:30)');
      return;
    }

    const patientData = {
      patientId: formData.patientId?.trim() || '',
      firstName: formData.firstName?.trim() || '',
      lastName: formData.lastName?.trim() || '',
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
      gender: formData.gender || '',
      primaryNumber: formData.primaryNumber?.trim() || '',
      age: formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : 0,
      status: formData.status || 'active',
      bloodType: formData.bloodType || '',
      patientType: formData.patientType || '',
      memberSince: formData.memberSince ? new Date(formData.memberSince) : null,
      lastVisit: formData.lastVisit ? new Date(formData.lastVisit) : null,
      emailAddress: formData.emailAddress?.trim() || '',
      address: formData.address?.trim() || '',
      city: formData.city?.trim() || '',
      phoneNumber: formData.phoneNumber?.trim() || '',
      stateProvince: formData.stateProvince?.trim() || '',
      zipPostalCode: formData.zipPostalCode?.trim() || '',
      emergencyContactName: formData.emergencyContactName?.trim() || '',
      relationship: formData.relationship || '',
      emergencyContactNumber: formData.emergencyContactNumber?.trim() || '',
      emergencyContactEmail: formData.emergencyContactEmail?.trim() || '',
      primaryDentalIssue: formData.primaryDentalIssue?.trim() || '',
      currentSymptoms: formData.currentSymptoms?.trim() || '',
      allergies: formData.allergies?.trim() || '',
      medicalHistory: (() => {
        const conditions = [];
        if (formData.diabetes) conditions.push("Diabetes");
        if (formData.hypertension) conditions.push("Hypertension (B.P)");
        if (formData.cardiacHeartProblems) conditions.push("Cardiac/Heart Problems");
        if (formData.disordersOthersSpecify) conditions.push("Disorders Others");
        if (formData.smoking) conditions.push("Smoking");
        if (formData.drinking) conditions.push("Drinking");
        if (formData.gutkaChewing) conditions.push("Gutka Chewing");
        let medicalHistoryText = formData.medicalHistory?.trim() || '';
        if (conditions.length > 0) {
          const conditionsText = conditions.join(", ");
          medicalHistoryText = medicalHistoryText ? `${conditionsText}; ${medicalHistoryText}` : conditionsText;
        }
        return medicalHistoryText || '';
      })(),
      currentMedications: formData.currentMedications?.trim() || '',
      diabetes: formData.diabetes || false,
      hypertension: formData.hypertension || false,
      cardiacHeartProblems: formData.cardiacHeartProblems || false,
      disordersOthersSpecify: formData.disordersOthersSpecify || false,
      disordersOthers: formData.disordersOthers?.trim() || '',
      smoking: formData.smoking || false,
      drinking: formData.drinking || false,
      gutkaChewing: formData.gutkaChewing || false,
      totalPaid: formData.totalPaid || '0',
      opFee: formData.opFee || '0',
      lastPayment: formData.lastPayment || '',
      paymentMethod: formData.paymentMethod || '',
      customFields: [
        ...formData.customFields,
        ...formData.personalCustomFields.map(field => ({ ...field, section: 'personal' })),
        ...formData.contactCustomFields.map(field => ({ ...field, section: 'contact' })),
        ...formData.emergencyCustomFields.map(field => ({ ...field, section: 'emergency' })),
        ...formData.medicalCustomFields.map(field => ({ ...field, section: 'medical' })),
        ...formData.paymentCustomFields.map(field => ({ ...field, section: 'payment' })),
        ...formData.appointmentCustomFields.map(field => ({ ...field, section: 'appointment' })),
      ],
      avatar: formData.avatar || '',
      appointments: formData.appointments.map(appointment => ({
        appointmentDate: appointment.appointmentDate ? new Date(appointment.appointmentDate) : null,
        appointmentTime: appointment.appointmentTime || '',
        treatment: appointment.treatment?.trim() || '',
        doctor: appointment.doctor?.trim() || '',
      })),
      hospitalId: hospitalId,
      adminId: adminId
    };

    console.log('👤 Creating patient...');

    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/patients/${hospitalId}`,
      patientData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );



    const createdPatient = response.data;
    console.log('✅ Patient created successfully:', createdPatient);



    // DEBUG: Log the exact structure we're getting from the API
console.log('🔍 API Response detailed structure:', {
  response_data: createdPatient,
  has_id: !!createdPatient.id,
  has_underscore_id: !!createdPatient._id,
  has_patient_nested: !!createdPatient.patient,
  patient_nested_id: createdPatient.patient?._id,
  patient_nested_id_direct: createdPatient.patient?.id,
  direct_patientId: createdPatient.patientId,
  response_keys: Object.keys(createdPatient),
  full_response: JSON.stringify(createdPatient, null, 2)
});



// Extract the database ID with better fallback logic
// Based on your API response structure, try these in order
const databaseId = createdPatient._id ||           // Direct _id from response
                   createdPatient.patient?._id ||   // _id from nested patient object
                   createdPatient.patient?.id ||    // id from nested patient object  
                   createdPatient.id;               // Direct id from response

// Add validation that databaseId was extracted
console.log('🆔 ID extraction debug:', {
  createdPatient: createdPatient,
  direct_id: createdPatient._id,
  patient_nested_id: createdPatient.patient?._id,
  final_database_id: databaseId,
  response_keys: Object.keys(createdPatient)
});

if (!databaseId) {
  console.error('❌ CRITICAL: No database ID extracted from API response');
  console.error('❌ Full API response:', createdPatient);
  toast.error('Failed to get patient ID from server. Please try again.');
  return;
}

const patientDetails = {
      _id: databaseId,
  id: databaseId,  // For compatibility
  databaseId: databaseId,
  patientId: createdPatient.patientId,
      name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Unnamed Patient',
      email: formData.emailAddress || '',
      phone: formData.primaryNumber ? formData.primaryCountryCode + formData.primaryNumber : '',
      dateOfBirth: formData.dateOfBirth || '',
      gender: formData.gender || '',
      bloodType: formData.bloodType || '',
      status: formData.status || 'active',
        ...createdPatient,
      createdAt: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    console.log('📄 Final patient details for modal:', patientDetails);
console.log('🔍 Database ID check:', patientDetails.databaseId);

    setFormData(prev => ({
  ...prev,
  createdPatientDetails: patientDetails,
  rawApiResponse: createdPatient // Also store raw response for debugging
}));

// Add this console log right after setting formData to verify it worked
console.log('🔍 FormData updated with createdPatientDetails:', {
  patientDetails,
  databaseId: patientDetails.databaseId,
  createdPatientId: createdPatient._id
});

    // Clear draft after successful save
    clearDraft();

    // Reset form to initial state after successful save
    //resetFormToInitialState();

    toast.success(`Patient "${patientDetails.name}" added successfully!`, {
      autoClose: 3000,
      position: "top-right"
    });

    const patientCreatedEvent = new CustomEvent('patientCreated', {
      detail: {
        patient: createdPatient,
        patientDetails: patientDetails,
        timestamp: new Date().toISOString(),
        source: 'add-patient-form',
        action: 'CREATE'
         }
  });
  window.dispatchEvent(patientCreatedEvent);

  const refreshFlag = {
    created: true,
    timestamp: Date.now(),
    patientId: createdPatient._id || createdPatient.id,
    patientData: patientDetails,
    source: 'patient-creation',
    refreshType: 'immediate'
  };
  localStorage.setItem('newPatientCreated', JSON.stringify(refreshFlag));
  localStorage.setItem('patientRefreshNeeded', JSON.stringify(refreshFlag));
  localStorage.setItem('lastPatientUpdate', Date.now().toString());

  console.log('📝 Set patient refresh flags:', refreshFlag);

  // Show first success popup
  setShowConfirmation(true);

  // After 3 seconds, hide first popup and show print dialog
  setTimeout(() => {
    setShowConfirmation(false);
    setShowPrintDialog(true);
  }, 3000);

} catch (err) {
  console.error('❌ Error saving patient:', err);

  const errorDetails = {
    timestamp: new Date().toISOString(),
    error: {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      url: err.config?.url
    },
    context: {
      hospitalId,
      adminId,
      patientId: formData.patientId,
      patientName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Unnamed Patient'
    }
  };
  console.log('📊 Detailed error info:', errorDetails);

  if (err.response) {
    const { status, data } = err.response;
    const errorMessage = data?.message || data?.error || 'Unknown server error';
    switch (status) {
      case 400:
        toast.error(`Validation Error: ${errorMessage}`);
        break;
      case 401:
        toast.error('Authentication expired. Please log in again.');
        setTimeout(() => {
          localStorage.clear();
          navigate('/login');
        }, 2000);
        break;
      case 403:
        toast.error('Access denied. You may not have permission to create patients.');
        break;
      case 409:
        toast.error(`Patient already exists: ${errorMessage}`);
        break;
      case 422:
        toast.error(`Invalid data: ${errorMessage}. Please check all fields.`);
        break;
      case 429:
        toast.error('Too many requests. Please wait a moment and try again.');
        break;
      case 500:
        toast.error('Server error occurred. Please try again later.');
        break;
      default:
        toast.error(`Server error (${status}): ${errorMessage}`);
    }
  } else if (err.request) {
    if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
      toast.error('Network error. Please check your internet connection and try again.');
    } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      toast.error('Request timed out. Please check your connection and try again.');
    } else {
      toast.error('Unable to connect to the server. Please check your connection.');
    }
  } else {
    toast.error(`Unexpected error: ${err.message}`);
  }

  const existingErrors = JSON.parse(localStorage.getItem('patientErrors') || '[]');
  existingErrors.push(errorDetails);
  if (existingErrors.length > 5) existingErrors.shift();
  localStorage.setItem('patientErrors', JSON.stringify(existingErrors));
}
};





  // Add this new function to handle draft clearing when user wants to start fresh
  const handleClearDraft = () => {
    if (window.confirm('Are you sure you want to clear all entered data and start fresh?')) {
      clearDraft();
      // Reset form to initial state
      setFormData({
        patientId: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        age: 0,
        gender: '',
        bloodType: '',
        status: 'active',
        patientType: '',
        memberSince: '',
        lastVisit: '',
        primaryNumber: '',
        primaryCountryCode: '+91',
        emailAddress: '',
        address: '',
        city: '',
        phoneNumber: '',
        phoneCountryCode: '+91',
        stateProvince: '',
        zipPostalCode: '',
        emergencyContactName: '',
        relationship: '',
        emergencyContactNumber: '',
        emergencyCountryCode: '+91',
        emergencyContactEmail: '',
        primaryDentalIssue: '',
        currentSymptoms: '',
        allergies: '',
        medicalHistory: '',
        currentMedications: '',
        diabetes: false,
        hypertension: false,
        cardiacHeartProblems: false,
        disordersOthers: '',
        smoking: false,
        drinking: false,
        gutkaChewing: false,
        disordersOthersSpecify: false,
        totalPaid: '',
        opFee: '',
        lastPayment: '',
        paymentMethod: '',
        customFields: '',
        avatar: '',
        appointments: [
          {
            appointmentDate: '',
            appointmentTime: '',
            treatment: '',
            doctor: '',
          },
        ],
        personalCustomFields: [],
        contactCustomFields: [],
        emergencyCustomFields: [],
        medicalCustomFields: [],
        paymentCustomFields: [],
        appointmentCustomFields: [],
      });
      toast.success('Draft cleared successfully!');
    }
  };

  // Reset form to initial state function
const resetFormToInitialState = () => {
  setFormData({
    patientId: formData.patientId, // Keep the generated patient ID
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    age: 0,
    gender: '',
    bloodType: '',
    status: 'active',
    patientType: '',
    memberSince: '',
    lastVisit: '',
    primaryNumber: '',
    primaryCountryCode: '+91',
    emailAddress: '',
    address: '',
    city: '',
    phoneNumber: '',
    phoneCountryCode: '+91',
    stateProvince: '',
    zipPostalCode: '',
    emergencyContactName: '',
    relationship: '',
    emergencyContactNumber: '',
    emergencyCountryCode: '+91',
    emergencyContactEmail: '',
    primaryDentalIssue: '',
    currentSymptoms: '',
    allergies: '',
    medicalHistory: '',
    currentMedications: '',
    diabetes: false,
    hypertension: false,
    cardiacHeartProblems: false,
    disordersOthers: '',
    smoking: false,
    drinking: false,
    gutkaChewing: false,
    disordersOthersSpecify: false,
    totalPaid: '',
    opFee: '',
    lastPayment: '',
    paymentMethod: '',
    customFields:'',
    avatar: '',
    appointments: [
      {
        appointmentDate: '',
        appointmentTime: '',
        treatment: '',
        doctor: '',
      },
    ],
    personalCustomFields: [],
    contactCustomFields: [],
    emergencyCustomFields: [],
    medicalCustomFields: [],
    paymentCustomFields: [],
    appointmentCustomFields: [],
  });
};



const resetFormDataCompletely = () => {
  // Clear draft from localStorage
  clearDraft();
  
  // Reset form to initial state with new patient ID
  setFormData({
    patientId: '', // This will be regenerated by the useEffect
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    age: 0,
    gender: '',
    bloodType: '',
    status: 'active',
    patientType: '',
    memberSince: '',
    lastVisit: '',
    primaryNumber: '',
    primaryCountryCode: '+91',
    emailAddress: '',
    address: '',
    city: '',
    phoneNumber: '',
    phoneCountryCode: '+91',
    stateProvince: '',
    zipPostalCode: '',
    emergencyContactName: '',
    relationship: '',
    emergencyContactNumber: '',
    emergencyCountryCode: '+91',
    emergencyContactEmail: '',
    primaryDentalIssue: '',
    currentSymptoms: '',
    allergies: '',
    medicalHistory: '',
    currentMedications: '',
    diabetes: false,
    hypertension: false,
    cardiacHeartProblems: false,
    disordersOthers: '',
    smoking: false,
    drinking: false,
    gutkaChewing: false,
    disordersOthersSpecify: false,
    totalPaid: '',
    opFee: '',
    lastPayment: '',
    paymentMethod: '',
    customFields: '',
    avatar: '',
    appointments: [
      {
        appointmentDate: '',
        appointmentTime: '',
        treatment: '',
        doctor: '',
      },
    ],
    personalCustomFields: [],
    contactCustomFields: [],
    emergencyCustomFields: [],
    medicalCustomFields: [],
    paymentCustomFields: [],
    appointmentCustomFields: [],
    // Remove any created patient details
    createdPatientDetails: null,
    rawApiResponse: null,
  });
  
  console.log('Form data completely reset');
};





  // Add this function to show draft status
  const getDraftStatusMessage = () => {
    if (!lastSaved) return null;
    const timeDiff = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (timeDiff < 60) return `Draft saved ${timeDiff} seconds ago`;
    if (timeDiff < 3600) return `Draft saved ${Math.floor(timeDiff / 60)} minutes ago`;
    return `Draft saved ${Math.floor(timeDiff / 3600)} hours ago`;
  };

  // Update the handleSaveDraft function to be more explicit
  // const handleSaveDraft = () => {
  //   autoSaveFormData(formData);
  //   toast.success('Draft saved successfully!');
  // };

  const renderSectionHeader = (title, sectionType) => (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      <button
        type="button"
        onClick={() => handleOpenPopup(sectionType)}
        className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200"
      >
        <Plus size={16} className="mr-1" />
        Add Field
      </button>
    </div>
  );

  const renderCustomFields = (fields, sectionType) => (
    fields.map((field, index) => (
      <div key={index} className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
          {field.label}
        </label>
        <div className="flex items-center space-x-2">
          <input
            type={field.type || 'text'}
            name="value"
            value={field.value}
            onChange={(e) => handleInputChange(e, index, sectionType)}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter field value"
          />
          <button
            type="button"
            onClick={() => handleEditField(index, field, sectionType)}
            className="p-2 text-blue-600 hover:text-blue-700 cursor-pointer focus:outline-none"
          >
            <Edit size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleRemoveCustomField(index, sectionType)}
            className="p-2 text-red-600 hover:text-red-700 cursor-pointer focus:outline-none"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    ))
  );

  if (!hospitalId || !adminId) {
    return <div>Loading...</div>;
  }


return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      <style>{`
        input::placeholder,
        textarea::placeholder {
          color: rgba(0, 0, 0, 0.2) !important;
        }
        select option:first-child {
          color: rgba(0, 0, 0, 0.2);
        }
      `}</style>

      <div className="max-w-full mx-auto p-3 sm:p-6">
       

        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="bg-green-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b border-green-100">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                    <div className="flex items-start space-x-2">
            <button
              onClick={handleBackClick}
              className="flex items-center text-gray-700 hover:text-gray-900 cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Add New Patient</h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Create a new patient record with complete information
              </p>
            </div>
          </div>
                </div>
              </div>
              <div className="px-4 sm:px-6 py-3 sm:py-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Blood Type:</span>
                    <span className="text-xs sm:text-sm text-gray-900">
                      {formData.createdPatientDetails?.bloodType || formData.bloodType || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Created:</span>
                    <span className="text-xs sm:text-sm text-gray-900">
                      {formData.createdPatientDetails?.createdAt || new Date().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-lg">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">Redirecting to patients list...</p>
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent mr-2"></div>
                    <span className="text-xs sm:text-sm text-green-600 font-medium">Success</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        
{showPrintDialog && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
      <div className="bg-blue-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b border-blue-100">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2 2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10a2 2 0 002-2z"/>
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-base sm:text-lg font-semibold text-blue-800">Print Receipt</h3>
            <p className="text-xs sm:text-sm text-blue-600">Would you like to print the patient receipt?</p>
          </div>
        </div>
      </div>
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <p className="text-xs sm:text-sm text-gray-600 text-center">
          Do you want to print the out-patient record for {formData.createdPatientDetails?.name}?
        </p>
      </div>
      <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-lg">
        <div className="flex justify-end space-x-3">
          <button
            onClick={handlePrintNo}
            className="px-3 sm:px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-medium"
          >
            No
          </button>
          <button
            onClick={handlePrintYes}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-medium"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  </div>
)}



{showPrintModal && (
  <OutPatientRecordModal 
    isOpen={showPrintModal}
    onClose={handlePrintModalClose}
    patientId={formData.createdPatientDetails?.databaseId || formData.createdPatientDetails?._id}
    hospitalId={hospitalId}
    debug={{
      patientDetails: formData.createdPatientDetails,
      rawApiResponse: formData.rawApiResponse,
      timestamp: new Date().toISOString(),
      modalPatientId: formData.createdPatientDetails?.databaseId,
      modalHospitalId: hospitalId
    }}
  />
)}


        {isPopupOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {editingField !== null ? 'Edit Field' : 'Add New Field'}
                  </h3>
                  <button
                    onClick={handleClosePopup}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="px-4 sm:px-6 py-3 sm:py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Label Name
                    </label>
                    <input
                      type="text"
                      name="label"
                      value={newField.label}
                      onChange={handlePopupInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter field name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Field Type
                    </label>
                    <div className="relative">
                      <select
                        name="type"
                        value={newField.type}
                        onChange={handlePopupInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="tel">Phone</option>
                        <option value="date">Date</option>
                        <option value="textarea">Textarea</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  {editingField === null && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="applyToAll"
                        name="applyToAll"
                        checked={newField.applyToAll}
                        onChange={handlePopupInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="applyToAll" className="ml-2 block text-xs sm:text-sm text-gray-700">
                        Apply to all patients (including existing)
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleClosePopup}
                    className="px-3 sm:px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCustomField}
                    className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-medium"
                  >
                    {editingField !== null ? 'Update' : 'OK'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={setFileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b border-gray-200 pb-4 sm:pb-6 mb-4 sm:mb-6 gap-4">
              <div className="flex items-start space-x-2">
            <button
              onClick={handleBackClick}
              className="flex items-center text-gray-700 hover:text-gray-900 cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Add New Patient</h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Create a new patient record with complete information
              </p>
            </div>
          </div>
              <div className="relative self-center sm:self-auto">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden cursor-pointer">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Patient Avatar"
                      className="w-full h-full object-cover cursor-pointer"
                    />
                  ) : (
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={triggerFileUpload}
                  className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg cursor-pointer"
                >
                  <Camera size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <div className="w-full">
                {renderSectionHeader('Personal Information', 'personal')}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                      Patient ID
                    </label>
                    <input
                      type="text"
                      name="patientId"
                      value={formData.patientId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-xs sm:text-sm focus:bg-gray-200 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                      Gender
                    </label>
                    <div className="relative">
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="" disabled>Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                      Blood Type
                    </label>
                    <div className="relative">
                      <select
                        name="bloodType"
                        value={formData.bloodType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="" disabled>Select blood type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                      Member Since
                    </label>
                    <input
                      type="date"
                      name="memberSince"
                      value={formData.memberSince}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                      Last Visit
                    </label>
                    <input
                      type="date"
                      name="lastVisit"
                      value={formData.lastVisit}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                {renderCustomFields(formData.personalCustomFields, 'personal')}
              </div>

              <div className="w-full">
                {renderSectionHeader('Contact Information', 'contact')}
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Primary Phone Number
                      </label>
                      <div className="flex gap-2">
                        <div className="w-20 sm:w-24">
                          <CountrySelect
                            name="primaryCountryCode"
                            value={formData.primaryCountryCode}
                            onChange={handleInputChange}
                          />
                        </div>
                        <input
                          type="tel"
                          name="primaryNumber"
                          value={formData.primaryNumber}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                     <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Secondary Phone Number
                      </label>
                      <div className="flex gap-2">
                        <div className="w-20 sm:w-24">
                          <CountrySelect
                            name="phoneCountryCode"
                            value={formData.phoneCountryCode}
                            onChange={handleInputChange}
                          />
                        </div>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                   <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="emailAddress"
                        value={formData.emailAddress}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        State/Province
                      </label>
                      <input
                        type="text"
                        name="stateProvince"
                        value={formData.stateProvince}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      name="zipPostalCode"
                      value={formData.zipPostalCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {renderCustomFields(formData.contactCustomFields, 'contact')}
                </div>
              </div>

              <div className="w-full">
                {renderSectionHeader('Emergency Contact', 'emergency')}
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Relationship
                      </label>
                      <div className="relative">
                        <select
                          name="relationship"
                          value={formData.relationship}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="" disabled>Select Relationship</option>
                          <option value="spouse">Spouse</option>
                          <option value="parent">Parent</option>
                          <option value="child">Child</option>
                          <option value="sibling">Sibling</option>
                          <option value="friend">Friend</option>
                          <option value="other">Other</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Emergency Contact Number
                      </label>
                      <div className="flex gap-2">
                        <div className="w-20 sm:w-24">
                          <CountrySelect
                            name="emergencyCountryCode"
                            value={formData.emergencyCountryCode}
                            onChange={handleInputChange}
                          />
                        </div>
                        <input
                          type="tel"
                          name="emergencyContactNumber"
                          value={formData.emergencyContactNumber}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Emergency Contact Email
                      </label>
                      <input
                        type="email"
                        name="emergencyContactEmail"
                        value={formData.emergencyContactEmail}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  {renderCustomFields(formData.emergencyCustomFields, 'emergency')}
                </div>
              </div>

              <div className="w-full">
                {renderSectionHeader('Medical Information', 'medical')}
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Primary Dental Issue
                      </label>
                      <input
                        type="text"
                        name="primaryDentalIssue"
                        value={formData.primaryDentalIssue}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Current Symptoms
                      </label>
                      <input
                        type="text"
                        name="currentSymptoms"
                        value={formData.currentSymptoms}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Blood Pressure (B.P)
                      </label>
                      <input
                        type="text"
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                      Medical History
                    </label>
                    <div className="border border-gray-200 rounded-md p-3 sm:p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 cursor-pointer">
                        <label className="flex items-center space-x-2 text-gray-600 text-xs sm:text-sm cursor-pointer">
                          <input
                            id="diabetes"
                            name="diabetes"
                            type="checkbox"
                            checked={formData.diabetes}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                          />
                          <span>Diabetes</span>
                        </label>
                        <label className="flex items-center space-x-2 text-gray-600 text-xs sm:text-sm cursor-pointer">
                          <input
                            id="hypertension"
                            name="hypertension"
                            type="checkbox"
                            checked={formData.hypertension}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                          />
                          <span>Hypertension (B.P)</span>
                        </label>
                        <label className="flex items-center space-x-2 text-gray-600 text-xs sm:text-sm cursor-pointer">
                          <input
                            id="cardiacHeartProblems"
                            name="cardiacHeartProblems"
                            type="checkbox"
                            checked={formData.cardiacHeartProblems}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                          />
                          <span>Cardiac/Heart Problems</span>
                        </label>
                        <label className="flex items-center space-x-2 text-gray-600 text-xs sm:text-sm cursor-pointer">
                          <input
                            id="disordersOthersSpecify"
                            name="disordersOthersSpecify"
                            type="checkbox"
                            checked={formData.disordersOthersSpecify || false}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                          />
                          <span>Disorders Others specify</span>
                        </label>
                        <label className="flex items-center space-x-2 text-gray-600 text-xs sm:text-sm cursor-pointer">
                          <input
                            id="smoking"
                            name="smoking"
                            type="checkbox"
                            checked={formData.smoking}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                          />
                          <span>Smoking</span>
                        </label>
                        <label className="flex items-center space-x-2 text-gray-600 text-xs sm:text-sm cursor-pointer">
                          <input
                            id="drinking"
                            name="drinking"
                            type="checkbox"
                            checked={formData.drinking}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                          />
                          <span>Drinking</span>
                        </label>
                        <label className="flex items-center space-x-2 text-gray-600 text-xs sm:text-sm cursor-pointer">
                          <input
                            id="gutkaChewing"
                            name="gutkaChewing"
                            type="checkbox"
                            checked={formData.gutkaChewing}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                          />
                          <span>Gutka Chewing</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  {renderCustomFields(formData.medicalCustomFields, 'medical')}
                </div>
              </div>

              <div className="w-full">
                {renderSectionHeader('Payment Information', 'payment')}
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        OP Fee
                      </label>
                      <input
                        type="text"
                        name="opFee"
                        value={formData.opFee}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Total Paid(OP Fee)
                      </label>
                      <input
                        type="text"
                        name="totalPaid"
                        value={formData.totalPaid}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Last Payment
                      </label>
                      <input
                        type="text"
                        name="lastPayment"
                        value={formData.lastPayment}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Payment Method
                      </label>
                      <div className="relative">
                        <select
                          name="paymentMethod"
                          value={formData.paymentMethod}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Manual</option>
                          <option value="manual">Manual</option>
                          <option value="credit">Credit Card</option>
                          <option value="debit">Debit Card</option>
                          <option value="online">Online Payment</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  {renderCustomFields(formData.paymentCustomFields, 'payment')}
                </div>
              </div>

              <div className="w-full">
                {renderSectionHeader('Appointment Information', 'appointment')}
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Appointment Date
                      </label>
                      <input
                        type="date"
                        name="appointmentDate"
                        value={formData.appointments[0].appointmentDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Appointment Time
                      </label>
                      <input
                        type="time"
                        name="appointmentTime"
                        value={formData.appointments[0].appointmentTime}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Treatment
                      </label>
                      <input
                        type="text"
                        name="treatment"
                        value={formData.appointments[0].treatment}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        Doctor
                      </label>
                      <input
                        type="text"
                        name="doctor"
                        value={formData.appointments[0].doctor}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  {renderCustomFields(formData.appointmentCustomFields, 'appointment')}
                </div>
              </div>
            </div>

            <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg mt-6">
              <div className="flex justify-end items-center">
                <div className="flex flex-col w-full sm:w-auto sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                  <button
                    type="button"
                    onClick={handleBackClick}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-gray-600 cursor-pointer border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-medium flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-gray-600 border cursor-pointer border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-medium flex items-center justify-center"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    disabled={!formData.createdPatientDetails}
                    className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-md focus:outline-none focus:ring-2 text-xs sm:text-sm font-medium flex items-center justify-center ${
                      formData.createdPatientDetails 
                        ? 'bg-green-600 text-white cursor-pointer hover:bg-green-700 focus:ring-green-500' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    title={!formData.createdPatientDetails ? 'Save patient first to print receipt' : 'Print patient receipt'}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10a2 2 0 002-2z"
                      />
                    </svg>
                    Print Receipt
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndProceed}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 cursor-pointer text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-medium flex items-center justify-center"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPatient;