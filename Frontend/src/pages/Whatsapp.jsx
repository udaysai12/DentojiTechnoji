// import React, { useState } from "react";
// import { FaWhatsapp, FaTrash, FaTelegram } from "react-icons/fa";
// import { HiOutlineUpload } from "react-icons/hi";
// import Send from "../assets/icons/Sent.png"
// export default function WhatsappBusiness() {
//     const [connected, setConnected] = useState(false);

//     return (
//         <div className="min-h-screen bg-gray-100 p-6">
//             {!connected ? (
//                 // ------------------- CONNECT PAGE -------------------
//                 <div className="flex items-center justify-center min-h-screen">
//                     <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full">
//                         {/* Icon */}
//                         <div className="flex justify-center mb-4">
//                             <div className="bg-green-100 p-4 rounded-full">
//                                 <FaWhatsapp className="text-green-500 text-4xl" />
//                             </div>
//                         </div>

//                         {/* Welcome Text */}
//                         <h2 className="text-center text-lg font-semibold">
//                             Welcome Dr.Gowthami !
//                         </h2>
//                         <p className="text-center text-gray-500 text-sm mt-1">
//                             Connect your WhatsApp Business Account to send messages,
//                             reminders, and updates directly to your patients.
//                         </p>

//                         {/* Phone Input */}
//                         <div className="mt-6">
//                             <label className="block text-sm font-medium text-gray-700">
//                                 WhatsApp Business Phone Number
//                             </label>
//                             <div className="flex mt-1">
//                                 <input
//                                     type="text"
//                                     value="+91"
//                                     readOnly
//                                     className="w-16 px-2 py-2 border border-gray-300 rounded-l-md bg-gray-100 text-gray-600 text-center"
//                                 />
//                                 <input
//                                     type="text"
//                                     maxLength={10}
//                                     className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md bg-gray-100 text-gray-800"
//                                 />
//                             </div>
//                             <p className="text-xs text-gray-400 mt-1">
//                                 This should be your WhatsApp Business Number
//                             </p>
//                         </div>

//                         {/* Connect Button */}
//                         <button
//                             onClick={() => setConnected(true)}
//                             className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-md cursor-pointer"
//                         >
//                             Connect Whatsapp Business
//                         </button>

//                         {/* Benefits Box */}
//                         <div className="mt-6 border border-blue-300 rounded-md p-4 bg-blue-50">
//                             <h3 className="text-sm font-semibold text-blue-600">
//                                 Benefits of WhatsApp Integration
//                             </h3>
//                             <ul className="list-disc list-inside text-sm text-blue-600 mt-2 space-y-1">
//                                 <li>Send appointments reminders automatically</li>
//                                 <li>Share treatment updates and reports</li>
//                                 <li>Provide instant patient support</li>
//                                 <li>Reduce no-shows with timely notifications</li>
//                             </ul>
//                         </div>
//                     </div>
//                 </div>
//             ) : (
//                 // ------------------- DASHBOARD PAGE -------------------
//                 <>
//                     {/* Header */}
//                     <div className="flex justify-between items-center bg-white rounded-lg shadow p-4">
//                         <div className="flex items-center gap-3">
//                             <FaWhatsapp className="text-green-500 text-2xl" />
//                             <div>
//                                 <h1 className="text-lg font-semibold">WhatsApp Business</h1>
//                                 <p className="text-sm text-gray-500">
//                                     Send messages and updates to your patients.
//                                 </p>
//                             </div>
//                         </div>

//                         <div className="flex items-center gap-4">
//                             <span className="flex  items-center text-green-500 text-sm">
//                                 <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
//                                 Connected
                                
//                             </span>
//                             <span className="text-gray-600 text-sm">7075974182</span>
//                             <button
//                                 onClick={() => setConnected(false)}
//                                 className="flex items-center gap-2 border border-red-300 text-red-500 hover:bg-red-50 px-3 py-1 rounded-md text-sm font-medium"
//                             >
//                                 <FaTrash /> Remove Account
//                             </button>
//                         </div>
//                     </div>

//                     {/* Content */}
//                     <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
//                         {/* Create Message */}
//                         <div className="bg-white rounded-lg shadow p-5">
//                             <h2 className="text-base font-semibold mb-4">Create Message</h2>

//                             {/* Upload */}
//                             <div className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-6 text-center text-gray-400">
//                                 <HiOutlineUpload className="text-4xl mb-2" />
//                                 <p className="text-sm">
//                                     Drag and drop your bill here, or click to browse
//                                     <br />
//                                     PNG, JPG, PDF up to 10 MB
//                                 </p>
//                             </div>

//                             {/* Message Text */}
//                             <div className="mt-4">
//                                 <label className="block text-sm font-medium text-gray-700">
//                                     Message Text
//                                 </label>
//                                 <textarea
//                                     placeholder="Type your message ...."
//                                     maxLength={100}
//                                     className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-green-500 focus:border-green-500"
//                                     rows={3}
//                                 ></textarea>
//                                 <p className="text-xs text-gray-400 mt-1">0/100 characters</p>
//                             </div>

//                             {/* Send Button */}
//                             <button className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-md">
//                                 Send Message
//                             </button>
//                         </div>

//                         {/* Recent Messages */}
//                         <div className="bg-white rounded-lg shadow p-5">
//                             <h2 className="text-base font-semibold mb-4">
//                                 Recent Messages Templates
//                             </h2>

//                             <div className="space-y-3">
//                                 <div className="border border-gray-200 rounded-lg p-3 flex justify-between items-center">
//                                     <div>
//                                         <p className="text-xs text-gray-400">2024-08-11</p>
//                                         <p className="text-sm text-gray-700">
//                                             Hello ! This is a reminder about your upcoming dental
//                                             appointment. Please confirm your attendance.
//                                         </p>
//                                     </div>
//                                     <button className="border border-gray-300 px-4 py-1 text-sm rounded-md hover:bg-gray-50 flex items-center gap-2">
//                                         <img src={Send} alt="send icon" className="w-4 h-4" />
//                                         Use
//                                     </button>

//                                 </div>

//                                 <div className="border border-gray-200 rounded-lg p-3 flex justify-between items-center">
//                                     <div>
//                                         <p className="text-xs text-gray-400">2024-08-05</p>
//                                         <p className="text-sm text-gray-700">
//                                             Thank you for visiting our dental clinic. Your oral health
//                                             report is ready for pickup.
//                                         </p>
//                                     </div>
//                                     <button className="border border-gray-300 px-4 py-1 text-sm rounded-md hover:bg-gray-50 flex items-center gap-2">
//                                         <img src={Send} alt="send icon" className="w-4 h-4" />
//                                         Use
//                                     </button>

//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </>
//             )}
//         </div>
//     );
// }


import React, { useState, useEffect } from "react";
import { FaWhatsapp, FaTrash, FaSearch, FaUser, FaPhone, FaEdit, FaPlus, FaTimes, FaCheck } from "react-icons/fa";
import { HiOutlineUpload } from "react-icons/hi";
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Mock Send icon component
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m22 2-7 20-4-9-9-4zm0 0-10 10"/>
  </svg>
);

export default function WhatsappBusiness() {
    const [connected, setConnected] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [patients, setPatients] = useState([]);
    const [selectedPatients, setSelectedPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPatientSelector, setShowPatientSelector] = useState(false);
    const [hospitalId, setHospitalId] = useState(null);
    const [adminId, setAdminId] = useState(null);
    const [characterCount, setCharacterCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectAll, setSelectAll] = useState(false);
    
    // Template management states
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        message: '',
        type: 'general'
    });
    const [messageTemplates, setMessageTemplates] = useState([
        {
            id: 1,
            name: 'Appointment Reminder',
            date: '2024-08-11',
            message: 'Hello {name}! This is a reminder about your upcoming dental appointment on {date} at {time}. Please confirm your attendance.',
            type: 'appointment_reminder'
        },
        {
            id: 2,
            name: 'Report Ready',
            date: '2024-08-05',
            message: 'Dear {name}, thank you for visiting our dental clinic. Your oral health report is ready for pickup.',
            type: 'report_ready'
        },
        {
            id: 3,
            name: 'Appointment Confirmation',
            date: '2024-08-01',
            message: 'Hi {name}, your next appointment is scheduled for {date} at {time} with {doctor}. Please arrive 15 minutes early.',
            type: 'appointment_confirmation'
        }
    ]);

    useEffect(() => {
        const initializeIds = async () => {
            const token = localStorage.getItem('token');
            const storedHospital = localStorage.getItem('hospital');

            if (!token) {
                toast.error('No authentication token found. Please log in.');
                return;
            }

            try {
                const decoded = jwtDecode(token);
                const fetchedAdminId = decoded.id;
                setAdminId(fetchedAdminId);

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

                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const fetchedHospitalId = response.data.hospital?._id;
                if (fetchedHospitalId) {
                    setHospitalId(fetchedHospitalId);
                    localStorage.setItem('hospital', JSON.stringify({ _id: fetchedHospitalId, adminId: fetchedAdminId }));
                } else {
                    toast.error('No hospital ID found. Please complete hospital setup.');
                }
            } catch (err) {
                console.error('Error initializing IDs:', err);
                toast.error('Failed to initialize. Please refresh and try again.');
            }
        };

        initializeIds();
        if (connected && hospitalId) {
            fetchPatients();
        }
    }, [connected, hospitalId]);

    const fetchPatients = async () => {
        try {
            if (!hospitalId) return;
            
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/patients/${hospitalId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setPatients(response.data);
            toast.success('Patients loaded successfully!');
        } catch (err) {
            console.error('Error fetching patients:', err);
            toast.error('Failed to fetch patients');
            
            // Fallback mock data
            const mockPatients = [
                {
                    _id: '1',
                    firstName: 'Leela',
                    lastName: 'Doe',
                    primaryNumber: '7075870927',
                    phoneNumber: '7075870927',
                    emailAddress: 'leela.doe@email.com',
                    appointments: [{
                        appointmentDate: new Date('2024-08-15'),
                        appointmentTime: '10:30',
                        treatment: 'Dental Cleaning',
                        doctor: 'Dr. Smith'
                    }]
                },
                {
                    _id: '2',
                    firstName: 'Manju',
                    lastName: 'Smith',
                    primaryNumber: '7799113131',
                    phoneNumber: '7799113131',
                    emailAddress: 'manju.smith@email.com',
                    appointments: []
                }
            ];
            setPatients(mockPatients);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        if (!phoneNumber || phoneNumber.length !== 10) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        try {
            // Simulate WhatsApp Business API authentication
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/v17.0/7075974182/phone_numbers`, {
                phone_number: `+91${phoneNumber}`,
                // Add other required fields for WhatsApp Business API
            }, {
                headers: {
                    Authorization: `Bearer ${process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN}`
                }
            });

            if (response.data.success) {
                setConnected(true);
                toast.success('WhatsApp Business connected successfully!');
            } else {
                throw new Error('Connection failed');
            }
        } catch (err) {
            console.error('Error connecting WhatsApp Business:', err);
            toast.error('Failed to connect WhatsApp Business');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                return;
            }
            setUploadedFile(file);
            toast.success('File uploaded successfully!');
        }
    };

    const handleMessageChange = (e) => {
        const value = e.target.value;
        if (value.length <= 1000) {
            setMessage(value);
            setCharacterCount(value.length);
        }
    };

    const handleUseTemplate = (template) => {
        setMessage(template.message);
        setCharacterCount(template.message.length);
        setShowPatientSelector(true);
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedPatients([]);
            setSelectAll(false);
        } else {
            setSelectedPatients([...filteredPatients]);
            setSelectAll(true);
        }
    };

    const handlePatientSelection = (patient) => {
        const isSelected = selectedPatients.some(p => p._id === patient._id);
        if (isSelected) {
            const newSelected = selectedPatients.filter(p => p._id !== patient._id);
            setSelectedPatients(newSelected);
            if (newSelected.length === 0) setSelectAll(false);
        } else {
            const newSelected = [...selectedPatients, patient];
            setSelectedPatients(newSelected);
            if (newSelected.length === filteredPatients.length) setSelectAll(true);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) {
            toast.error('Please enter a message');
            return;
        }

        if (selectedPatients.length === 0) {
            toast.error('Please select at least one patient');
            return;
        }

        try {
            setLoading(true);
            
            const recipients = selectedPatients.map(patient => ({
                name: `${patient.firstName} ${patient.lastName}`,
                number: `+91${patient.primaryNumber || patient.phoneNumber}`,
                personalizedMessage: personalizeMessage(message, patient)
            }));

            // WhatsApp Business API integration
            for (const recipient of recipients) {
                const messageData = {
                    messaging_product: 'whatsapp',
                    to: recipient.number,
                    type: 'text',
                    text: {
                        body: recipient.personalizedMessage
                    }
                };

                if (uploadedFile) {
                    // Handle file upload to WhatsApp Business API
                    const formData = new FormData();
                    formData.append('file', uploadedFile);
                    const uploadResponse = await axios.post(
                        'https://graph.facebook.com/v17.0/7075974182/media',
                        formData,
                        {
                            headers: {
                                Authorization: `Bearer ${process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN}`,
                                'Content-Type': 'multipart/form-data'
                            }
                        }
                    );

                    messageData.type = uploadedFile.type.includes('image') ? 'image' : 'document';
                    messageData[messageData.type] = { id: uploadResponse.data.id };
                }

                await axios.post(
                    `https://graph.facebook.com/v17.0/7075974182/messages`,
                    messageData,
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN}`
                        }
                    }
                );
            }
            
            toast.success(`Message sent to ${selectedPatients.length} patient(s) successfully from +917075974182!`);
            
            setMessage('');
            setCharacterCount(0);
            setSelectedPatients([]);
            setUploadedFile(null);
            setShowPatientSelector(false);
            setSelectAll(false);

        } catch (err) {
            console.error('Error sending message:', err);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const personalizeMessage = (template, patient) => {
        let personalizedMsg = template;
        
        personalizedMsg = personalizedMsg.replace(/{name}/g, `${patient.firstName} ${patient.lastName}`);
        
        if (patient.appointments && patient.appointments.length > 0) {
            const nextAppt = patient.appointments[0];
            personalizedMsg = personalizedMsg.replace(/{date}/g, new Date(nextAppt.appointmentDate).toLocaleDateString());
            personalizedMsg = personalizedMsg.replace(/{time}/g, nextAppt.appointmentTime);
            personalizedMsg = personalizedMsg.replace(/{treatment}/g, nextAppt.treatment || 'your treatment');
            personalizedMsg = personalizedMsg.replace(/{doctor}/g, nextAppt.doctor || 'our team');
        }
        
        return personalizedMsg;
    };

    const handleAddTemplate = () => {
        if (!newTemplate.name.trim() || !newTemplate.message.trim()) {
            toast.error('Please fill in template name and message');
            return;
        }

        const template = {
            id: Date.now(),
            name: newTemplate.name,
            date: new Date().toISOString().split('T')[0],
            message: newTemplate.message,
            type: newTemplate.type
        };

        if (editingTemplate) {
            setMessageTemplates(templates => 
                templates.map(t => t.id === editingTemplate.id ? template : t)
            );
            toast.success('Template updated successfully!');
        } else {
            setMessageTemplates(templates => [...templates, template]);
            toast.success('Template added successfully!');
        }

        setNewTemplate({ name: '', message: '', type: 'general' });
        setEditingTemplate(null);
        setShowTemplateModal(false);
    };

    const handleEditTemplate = (template) => {
        setEditingTemplate(template);
        setNewTemplate({
            name: template.name,
            message: template.message,
            type: template.type
        });
        setShowTemplateModal(true);
    };

    const handleDeleteTemplate = (templateId) => {
        setMessageTemplates(templates => templates.filter(t => t.id !== templateId));
        toast.success('Template deleted successfully!');
    };

    const filteredPatients = patients.filter(patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.primaryNumber?.includes(searchTerm) ||
        patient.phoneNumber?.includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {!connected ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full">
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-100 p-4 rounded-full">
                                <FaWhatsapp className="text-green-500 text-4xl" />
                            </div>
                        </div>

                        <h2 className="text-center text-lg font-semibold">
                            Welcome Dr. Gowthami!
                        </h2>
                        <p className="text-center text-gray-500 text-sm mt-1">
                            Connect your WhatsApp Business Account to send messages,
                            reminders, and updates directly to your patients.
                        </p>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700">
                                WhatsApp Business Phone Number
                            </label>
                            <div className="flex mt-1">
                                <input
                                    type="text"
                                    value="+91"
                                    readOnly
                                    className="w-16 px-2 py-2 border border-gray-300 rounded-l-md bg-gray-100 text-gray-600 text-center"
                                />
                                <input
                                    type="text"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                    maxLength={10}
                                    placeholder="Enter 10-digit number"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                This should be your WhatsApp Business Number
                            </p>
                        </div>

                        <button
                            onClick={handleConnect}
                            disabled={loading}
                            className="mt-6 w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-md transition duration-200"
                        >
                            {loading ? 'Connecting...' : 'Connect WhatsApp Business'}
                        </button>

                        <div className="mt-6 border border-blue-300 rounded-md p-4 bg-blue-50">
                            <h3 className="text-sm font-semibold text-blue-600">
                                Benefits of WhatsApp Integration
                            </h3>
                            <ul className="list-disc list-inside text-sm text-blue-600 mt-2 space-y-1">
                                <li>Send appointment reminders automatically</li>
                                <li>Share treatment updates and reports</li>
                                <li>Provide instant patient support</li>
                                <li>Reduce no-shows with timely notifications</li>
                            </ul>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center bg-white rounded-lg shadow p-4">
                        <div className="flex items-center gap-3">
                            <FaWhatsapp className="text-green-500 text-2xl" />
                            <div>
                                <h1 className="text-lg font-semibold">WhatsApp Business</h1>
                                <p className="text-sm text-gray-500">
                                    Send messages and updates to your patients from +917075974182
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="flex items-center text-green-500 text-sm">
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                                Connected
                            </span>
                            <span className="text-gray-600 text-sm">+91{phoneNumber}</span>
                            <button
                                onClick={() => {
                                    setConnected(false);
                                    setPhoneNumber('');
                                    setSelectedPatients([]);
                                    setMessage('');
                                    setSelectAll(false);
                                }}
                                className="flex items-center gap-2 border border-red-300 text-red-500 hover:bg-red-50 px-3 py-1 rounded-md text-sm font-medium transition duration-200"
                            >
                                <FaTrash /> Remove Account
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
                            <h2 className="text-base font-semibold mb-4">Create Message</h2>

                            <div className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-6 text-center text-gray-400 hover:border-gray-400 transition duration-200">
                                <input
                                    type="file"
                                    accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer w-full">
                                    <HiOutlineUpload className="text-4xl mb-2 mx-auto" />
                                    <p className="text-sm">
                                        {uploadedFile ? (
                                            <span className="text-green-600">✓ {uploadedFile.name}</span>
                                        ) : (
                                            <>
                                                Drag and drop your file here, or click to browse
                                                <br />
                                                PNG, JPG, PDF, DOC up to 10 MB
                                            </>
                                        )}
                                    </p>
                                </label>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Message Text
                                </label>
                                <textarea
                                    placeholder="Type your message or select a template... Use {name}, {date}, {time}, {doctor}, {treatment} for personalization"
                                    value={message}
                                    onChange={handleMessageChange}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-green-500 focus:border-green-500 resize-none"
                                    rows={5}
                                />
                                <p className="text-xs text-gray-400 mt-1">{characterCount}/1000 characters</p>
                            </div>

                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Recipients ({selectedPatients.length} selected)
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSelectAll}
                                            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                                        >
                                            {selectAll ? 'Deselect All' : 'Select All'}
                                        </button>
                                        <button
                                            onClick={() => setShowPatientSelector(!showPatientSelector)}
                                            className="text-green-500 hover:text-green-600 text-sm font-medium"
                                        >
                                            {showPatientSelector ? 'Hide' : 'Select Patients'}
                                        </button>
                                    </div>
                                </div>

                                {selectedPatients.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3 max-h-24 overflow-y-auto">
                                        {selectedPatients.map(patient => (
                                            <span
                                                key={patient._id}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                            >
                                                {patient.firstName} {patient.lastName}
                                                <button
                                                    onClick={() => handlePatientSelection(patient)}
                                                    className="ml-1 text-green-600 hover:text-green-800"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {showPatientSelector && (
                                    <div className="border border-gray-300 rounded-md p-3 max-h-64 overflow-y-auto">
                                        <div className="relative mb-3">
                                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search patients by name or phone..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                                            />
                                        </div>
                                        
                                        {loading ? (
                                            <div className="text-center py-4 text-gray-500">Loading patients...</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {filteredPatients.map(patient => (
                                                    <label
                                                        key={patient._id}
                                                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPatients.some(p => p._id === patient._id)}
                                                            onChange={() => handlePatientSelection(patient)}
                                                            className="mr-3 text-green-500 focus:ring-green-500"
                                                        />
                                                        <div className="flex items-center flex-1">
                                                            <FaUser className="text-gray-400 mr-2" />
                                                            <div className="flex-1">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {patient.firstName} {patient.lastName}
                                                                </div>
                                                                <div className="text-xs text-gray-500 flex items-center">
                                                                    <FaPhone className="mr-1" />
                                                                    {patient.primaryNumber || patient.phoneNumber}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                                {filteredPatients.length === 0 && !loading && (
                                                    <div className="text-center py-4 text-gray-500">
                                                        No patients found
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleSendMessage}
                                disabled={!message.trim() || selectedPatients.length === 0 || loading}
                                className="mt-4 w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-md transition duration-200"
                            >
                                {loading ? 'Sending...' : `Send Message to ${selectedPatients.length} Patient(s) from +917075974182`}
                            </button>
                        </div>

                        <div className="bg-white rounded-lg shadow p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold">Message Templates</h2>
                                <button
                                    onClick={() => {
                                        setEditingTemplate(null);
                                        setNewTemplate({ name: '', message: '', type: 'general' });
                                        setShowTemplateModal(true);
                                    }}
                                    className="flex items-center gap-1 text-green-500 hover:text-green-600 text-sm font-medium"
                                >
                                    <FaPlus /> Add Template
                                </button>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {messageTemplates.map(template => (
                                    <div key={template.id} className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{template.name}</p>
                                                <p className="text-xs text-gray-400">{template.date}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEditTemplate(template)}
                                                    className="text-blue-500 hover:text-blue-600 p-1"
                                                >
                                                    <FaEdit size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                    className="text-red-500 hover:text-red-600 p-1"
                                                >
                                                    <FaTimes size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded mb-2 inline-block">
                                            {template.type.replace('_', ' ')}
                                        </span>
                                        <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                                            {template.message}
                                        </p>
                                        <button
                                            onClick={() => handleUseTemplate(template)}
                                            className="w-full border border-gray-300 px-4 py-2 text-sm rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 transition duration-200"
                                        >
                                            <SendIcon />
                                            Use Template
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {showTemplateModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                                <h3 className="text-lg font-semibold mb-4">
                                    {editingTemplate ? 'Edit Template' : 'Add New Template'}
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Template Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newTemplate.name}
                                            onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="Enter template name"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Template Type
                                        </label>
                                        <select
                                            value={newTemplate.type}
                                            onChange={(e) => setNewTemplate({...newTemplate, type: e.target.value})}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                                        >
                                            <option value="general">General</option>
                                            <option value="appointment_reminder">Appointment Reminder</option>
                                            <option value="report_ready">Report Ready</option>
                                            <option value="appointment_confirmation">Appointment Confirmation</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Template Message
                                        </label>
                                        <textarea
                                            value={newTemplate.message}
                                            onChange={(e) => setNewTemplate({...newTemplate, message: e.target.value})}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                            rows={5}
                                            placeholder="Enter template message... Use {name}, {date}, {time}, {doctor}, {treatment} for personalization"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setShowTemplateModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddTemplate}
                                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                                    >
                                        {editingTemplate ? 'Update Template' : 'Add Template'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
