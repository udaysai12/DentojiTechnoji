//MedicationTable-present code
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
//import DentalSidebar from '@/components/DentalSidebar';

const MedicationTable = () => {
  // Router hooks
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [medications, setMedications] = useState([]);
  const [originalMedications, setOriginalMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hospitalId, setHospitalId] = useState(null);

  // Get mode from location state or URL params
  const mode = location.state?.mode || 'fromCard';

  // Utility functions
  const getHospitalId = () => {
    const sources = [
      location.state?.hospitalId,
      localStorage.getItem('hospitalId'),
      sessionStorage.getItem('hospitalId'),
      'default-hospital'
    ];
    return sources.find(Boolean);
  };

  const getApiHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getStoredToken()}`
  });

  const getStoredToken = () => {
    try {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    } catch {
      return null;
    }
  };

  const handleApiError = async (response) => {
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || `HTTP ${response.status}`);
    }
    return response.json();
  };

  // Generate unique ID for new medications
  const generateUniqueId = () => {
    return `medication_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // API functions


const fetchExistingMedications = async () => {
  if (!patientId || !hospitalId) {
    console.log('Missing patientId or hospitalId for fetching medications');
    return [];
  }

  try {
    const url = `${import.meta.env.VITE_BACKEND_URL}/api/medications/patient/${patientId}?hospitalId=${hospitalId}`;
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiHeaders()
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('No medications found (404)');
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Backend response:', data);
    
    // The key fix: data structure is different - it's data.medications, not data.data
    if (data?.success && data?.medications) {
      const allMedications = [];
      
      // data.medications is the array of prescriptions
      const prescriptions = data.medications;
      console.log('Processing prescriptions:', prescriptions.length);
      
      prescriptions.forEach((prescription, prescIndex) => {
        if (prescription?.medications && Array.isArray(prescription.medications)) {
          prescription.medications.forEach((medication, medIndex) => {
            if (medication.medicationName && medication.medicationName.trim()) {
              allMedications.push({
                id: `existing_${prescription._id}_${medIndex}`,
                medicationName: medication.medicationName,
                dosage: medication.dosage || '',
                frequency: medication.frequency || 'Once Daily',
                when: medication.instruction || 'After Food',
                duration: medication.duration || '',
                prescriptionId: prescription._id,
                prescriptionNumber: prescription.prescriptionNumber,
                isNew: false,
                isExisting: true
              });
            }
          });
        }
      });
      
      console.log('Processed medications:', allMedications);
      return allMedications;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching medications:', error);
    return [];
  }
};

const initializeMedications = async () => {
  if (!patientId || !hospitalId) return;

  try {
    setLoading(true);
    console.log('Initializing medications for:', { patientId, hospitalId });
    
    const existingMedications = await fetchExistingMedications();
    console.log('Fetched existing medications:', existingMedications);
    
    // Always add one empty row for new entries
    const emptyMedication = getEmptyMedication();
    const allMedications = [...existingMedications, emptyMedication];
    
    setMedications(allMedications);
    setOriginalMedications([...existingMedications]);
    setError(null);
    
  } catch (error) {
    console.error('Error initializing medications:', error);
    setError('Failed to load medications');
    setMedications([getEmptyMedication()]);
    setOriginalMedications([]);
  } finally {
    setLoading(false);
  }
};

  const getEmptyMedication = () => ({
    id: generateUniqueId(),
    medicationName: '',
    dosage: '',
    frequency: 'Once Daily',
    when: 'After Food',
    duration: '',
    isNew: true,
    isExisting: false
  });

  // Event handlers
  const saveMedications = async () => {
    if (!patientId || !hospitalId) {
      setError('Missing required information');
      toast.error('Missing required information');
      return false;
    }

    try {
      setSaving(true);
      
      // Only save NEW medications (isNew: true and has content)
      const newMedications = medications
        .filter(medication => {
          // Must be new AND have content
          const hasContent = 
            (medication.medicationName && medication.medicationName.trim()) ||
            (medication.dosage && medication.dosage.trim()) ||
            (medication.duration && medication.duration.trim());
          
          return medication.isNew && hasContent;
        })
        .map(medication => ({
          medicationName: medication.medicationName?.trim() || '',
          dosage: medication.dosage?.trim() || '',
          frequency: medication.frequency || 'Once Daily',
          duration: medication.duration?.trim() || '',
          instruction: medication.when || 'After Food'
        }));

      if (newMedications.length === 0) {
        toast.error('Please add at least one new medication with valid details');
        return false;
      }

      console.log('Saving NEW medications only:', newMedications);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/medications/patient/${patientId}`,
        {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            hospitalId,
            appointmentDate: new Date().toISOString(),
            diagnosis: 'General prescription',
            medications: newMedications,
            prescribedBy: 'Doctor'
          })
        }
      );

      const data = await handleApiError(response);
      
      if (data.success) {
        toast.success(`${newMedications.length} new medication(s) saved successfully!`);
        return true;
      } else {
        toast.error(data.message || 'Failed to save medications');
        return false;
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save medications. Please try again.');
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (mode === 'fromProforma') {
      navigate(`/treatmentencounters/${patientId}`);
    } else {
      // Navigate back exactly like TreatmentEncounters does
      const backHospitalId = hospitalId || location.state?.hospitalId || 'default-hospital';
      
      // Get the most complete patient data available from multiple sources
      const currentPatientData = location.state?.patient || location.state?.patientData || null;
      
      navigate(backHospitalId !== 'default-hospital' 
        ? `/patientdata/${backHospitalId}/${patientId}` 
        : -1, {
        state: {
          patient: currentPatientData, // Pass whatever patient data we have
          hospitalId: backHospitalId,
          patientId: patientId,
          refresh: ['medications'] // Only refresh medications section
        }
      });
    }
  };

  const handleAddRow = () => {
    const newMedication = getEmptyMedication();
    setMedications(prev => [...prev, newMedication]);
  };

  const handleDeleteRow = (id) => {
    setMedications(prev => {
      const medicationToDelete = prev.find(med => med.id === id);
      
      // Don't allow deletion of existing medications from backend
      if (medicationToDelete && medicationToDelete.isExisting) {
        toast.warning('Cannot delete existing medications. You can only add new ones.');
        return prev;
      }
      
      const filtered = prev.filter(medication => medication.id !== id);
      
      // Ensure at least one empty row for new medication entry
      const hasEmptyRow = filtered.some(med => 
        med.isNew && !med.medicationName && !med.dosage && !med.duration
      );
      
      if (!hasEmptyRow) {
        filtered.push(getEmptyMedication());
      }
      
      toast.info('New medication row deleted');
      return filtered;
    });
  };

  const handleInputChange = (id, field, value) => {
    setMedications(prev =>
      prev.map(medication => {
        if (medication.id === id) {
          // Don't allow editing existing medications
          if (medication.isExisting) {
            toast.warning('Cannot edit existing medications. Add new medications in the empty rows.');
            return medication;
          }
          return { ...medication, [field]: value };
        }
        return medication;
      })
    );
  };

  const handleSave = async () => {
    const success = await saveMedications();
    if (success) {
      setError(null);
      toast.success('Medications saved successfully!');
      
      // Navigate back like TreatmentEncounters - immediate navigation
      if (mode === 'fromProforma') {
        navigate(`/treatmentencounters/${patientId}`);
      } else {
        const backHospitalId = hospitalId || location.state?.hospitalId || 'default-hospital';
        navigate(backHospitalId !== 'default-hospital' 
          ? `/patientdata/${backHospitalId}/${patientId}` 
          : -1, {
          state: {
            patient: location.state?.patient, // Preserve patient data
            hospitalId: backHospitalId,
            patientId: patientId,
            refresh: ['medications'] // Only refresh medications section
          }
        });
      }
    }
  };
 
  const handleCancel = () => {
    // Reset to original medications plus one empty row
    const resetMedications = [...originalMedications, getEmptyMedication()];
    setMedications(resetMedications);
    setError(null);
    toast.info('Changes cancelled');
    
    // Navigate back with preserved patient data like TreatmentEncounters
    if (mode === 'fromProforma') {
      navigate(`/treatmentencounters/${patientId}`);
    } else {
      const backHospitalId = hospitalId || location.state?.hospitalId || 'default-hospital';
      navigate(backHospitalId !== 'default-hospital' 
        ? `/patientdata/${backHospitalId}/${patientId}` 
        : -1, {
        state: {
          patient: location.state?.patient, // Preserve patient data
          hospitalId: backHospitalId,
          patientId: patientId
        }
      });
    }
  };




  // Effects
  useEffect(() => {
    setHospitalId(getHospitalId());
  }, [location]);

  useEffect(() => {
    if (patientId && hospitalId) {

      initializeMedications();
    }
  }, [patientId, hospitalId]);

  useEffect(() => {
    const refresh = location.state?.refresh;
    if (refresh === 'medications' && patientId && hospitalId) {
      initializeMedications();
    }
  }, [location.state?.refresh, patientId, hospitalId]);

  // Render helpers
  const renderTableCell = (medication, field, index) => {
    const commonClasses = "border border-gray-300 py-3 px-3 align-top";
    const isExistingMedication = medication.isExisting;
    const readOnlyClasses = isExistingMedication ? "bg-gray-50 text-gray-600" : "";
    
    if (field === 'serialNo') {
      return (
        <td className={`${commonClasses} bg-gray-50 text-center font-medium w-16`}>
          {index + 1}
        </td>
      );
    }

    if (field === 'medicationName') {
      return (
        <td className={`${commonClasses} min-w-60`}>
          <input
            type="text"
            value={medication.medicationName}
            onChange={(e) => handleInputChange(medication.id, 'medicationName', e.target.value)}
            className={`w-full py-2 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 rounded border border-gray-300 ${readOnlyClasses}`}
            placeholder={isExistingMedication ? "" : "Medicine name"}
            readOnly={isExistingMedication}
            disabled={isExistingMedication}
          />
        </td>
      );
    }

    if (field === 'dosage') {
      return (
        <td className={`${commonClasses} w-32`}>
          <input
            type="text"
            value={medication.dosage}
            onChange={(e) => handleInputChange(medication.id, 'dosage', e.target.value)}
            className={`w-full py-2 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 rounded border border-gray-300 ${readOnlyClasses}`}
            placeholder={isExistingMedication ? "" : "Dosage"}
            readOnly={isExistingMedication}
            disabled={isExistingMedication}
          />
        </td>
      );
    }

    if (field === 'frequency') {
      return (
        <td className={`${commonClasses} w-40`}>
          <select
            value={medication.frequency}
            onChange={(e) => handleInputChange(medication.id, 'frequency', e.target.value)}
            className={`w-full py-2 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 rounded border border-gray-300 ${readOnlyClasses}`}
            disabled={isExistingMedication}
          >
            <option value="Once Daily">Once Daily</option>
            <option value="Twice Daily">Twice Daily</option>
            <option value="Three times Daily">Three times Daily</option>
            <option value="As needed">As needed</option>
          </select>
        </td>
      );
    }

    if (field === 'when') {
      return (
        <td className={`${commonClasses} w-36`}>
          <select
            value={medication.when}
            onChange={(e) => handleInputChange(medication.id, 'when', e.target.value)}
            className={`w-full py-2 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 rounded border border-gray-300 ${readOnlyClasses}`}
            disabled={isExistingMedication}
          >
            <option value="After Food">After Food</option>
            <option value="Before Food">Before Food</option>
            <option value="With Food">With Food</option>
          </select>
        </td>
      );
    }

    if (field === 'duration') {
      return (
        <td className={`${commonClasses} w-32`}>
          <input
            type="text"
            value={medication.duration}
            onChange={(e) => handleInputChange(medication.id, 'duration', e.target.value)}
            className={`w-full py-2 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 rounded border border-gray-300 ${readOnlyClasses}`}
            placeholder={isExistingMedication ? "" : "Duration"}
            readOnly={isExistingMedication}
            disabled={isExistingMedication}
          />
        </td>
      );
    }

    if (field === 'actions') {
      return (
        <td className={`${commonClasses} w-20 text-center`}>
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={handleAddRow}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer rounded transition-colors"
              title="Add New Medication"
            >
              <Plus className="w-4 h-4" />
            </button>
            {!isExistingMedication && (
              <button
                onClick={() => handleDeleteRow(medication.id)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer rounded transition-colors"
                title="Delete Medication"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {isExistingMedication && (
              <div className="w-8 h-8 flex items-center justify-center">
                <span className="text-xs text-gray-400">Saved</span>
              </div>
            )}
          </div>
        </td>
      );
    }

    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading medications...</p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 cursor-pointer rounded-md hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">Medications</h1>
              <span className="text-sm text-gray-500">
                ({originalMedications.length} existing, {medications.filter(m => m.isNew).length} new)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Info Banner */}
        {/* {originalMedications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <p className="text-blue-700 text-sm">
              <strong>Note:</strong> Existing medications are shown in gray and cannot be edited. 
              Add new medications in the white rows below.
            </p>
          </div>
        )} */}

        {/* Table */}
        <div className="rounded-lg overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed mt-10">
              <thead className="bg-white border border-gray-200">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-700 w-16">S.No</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-700 w-60">Medicine</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-700 w-32">Dosage</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-700 w-40">Frequency</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-700 w-36">When</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-700 w-32">Duration</th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-gray-700 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {medications.map((medication, index) => (
                  <tr key={medication.id} className={`hover:bg-gray-50 ${medication.isExisting ? 'bg-gray-25' : ''}`}>
                    {renderTableCell(medication, 'serialNo', index)}
                    {renderTableCell(medication, 'medicationName')}
                    {renderTableCell(medication, 'dosage')}
                    {renderTableCell(medication, 'frequency')}
                    {renderTableCell(medication, 'when')}
                    {renderTableCell(medication, 'duration')}
                    {renderTableCell(medication, 'actions')}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Action Bar */}
          <div className="px-4 py-4 border-t border-gray-200 flex justify-end items-center">
            <div className="flex gap-3 items-center">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2 text-gray-700 bg-white cursor-pointer border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {mode === 'fromProforma' ? 'Saving & Next...' : 'Saving...'}
                  </>
                ) : (
                  mode === 'fromProforma' ? 'Next' : 'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationTable;