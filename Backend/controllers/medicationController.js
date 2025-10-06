
// // };

// // controllers/medicationController.js
// import mongoose from 'mongoose';
// import Medication from '../models/Medication.js';
// import Patient from '../models/Patient.js';
// import Receptionist from '../models/Receptionist.js';

// // Create new medication/prescription
// export const createMedication = async (req, res) => {
//   try {
//     console.log('📝 Creating new medication/prescription:', req.body);
    
//     const userRole = req.user.role;
//     const userId = req.user.id;
//     const { patientId } = req.params;

//     // Validate patient ID
//     if (!mongoose.Types.ObjectId.isValid(patientId)) {
//       return res.status(400).json({ message: 'Invalid patient ID format' });
//     }

//     // Get patient first to extract hospital and admin info
//     const patient = await Patient.findById(patientId);
//     if (!patient) {
//       return res.status(404).json({ message: 'Patient not found' });
//     }

//     let medicationData = { ...req.body };
//     medicationData.patientId = patientId;

//     // Set hospital and admin IDs based on user role
//     if (userRole === 'Receptionist') {
//       const receptionist = await Receptionist.findById(userId);
//       if (!receptionist) {
//         return res.status(404).json({ message: 'Receptionist not found' });
//       }
      
//       // Verify receptionist belongs to same hospital as patient
//       if (receptionist.hospitalId.toString() !== patient.hospitalId.toString()) {
//         return res.status(403).json({ message: 'Unauthorized: Patient not in your hospital' });
//       }
      
//       medicationData.hospitalId = receptionist.hospitalId;
//       medicationData.adminId = receptionist.admin;
//       medicationData.prescribedBy = `${receptionist.firstName} ${receptionist.lastName} (Receptionist)`;
//     } else if (userRole === 'Admin') {
//       // Verify admin owns this patient
//       if (patient.adminId.toString() !== userId) {
//         return res.status(403).json({ message: 'Unauthorized: Patient not in your practice' });
//       }
      
//       medicationData.adminId = userId;
//       medicationData.hospitalId = patient.hospitalId;
//       medicationData.prescribedBy = `Doctor/Admin`; // You can improve this by fetching admin name
//     }

//     // Validation for required fields
//     if (!medicationData.diagnosis || !medicationData.diagnosis.trim()) {
//       return res.status(400).json({ message: 'Diagnosis is required' });
//     }

//     if (!medicationData.medications || medicationData.medications.length === 0) {
//       return res.status(400).json({ message: 'At least one medication is required' });
//     }

//     if (!medicationData.appointmentDate) {
//       return res.status(400).json({ message: 'Appointment date is required' });
//     }

//     // Validate each medication in the array
//     for (let i = 0; i < medicationData.medications.length; i++) {
//       const med = medicationData.medications[i];
//       if (!med.medicationName || !med.medicationName.trim()) {
//         return res.status(400).json({ message: `Medication name is required for medication ${i + 1}` });
//       }
//       if (!med.dosage || !med.dosage.trim()) {
//         return res.status(400).json({ message: `Dosage is required for medication ${i + 1}` });
//       }
//       if (!med.duration || !med.duration.trim()) {
//         return res.status(400).json({ message: `Duration is required for medication ${i + 1}` });
//       }
//       if (!med.instruction || !med.instruction.trim()) {
//         return res.status(400).json({ message: `Instruction is required for medication ${i + 1}` });
//       }
//     }

//     // Ensure valid appointment date
//     const appointmentDate = new Date(medicationData.appointmentDate);
//     if (isNaN(appointmentDate.getTime())) {
//       return res.status(400).json({ message: 'Invalid appointment date format' });
//     }

//     // Set payment and treatment status defaults if not provided
//     medicationData.totalAmount = parseFloat(medicationData.totalAmount) || 0;
//     medicationData.paidAmount = parseFloat(medicationData.paidAmount) || 0;
    
//     // Ensure paidAmount doesn't exceed totalAmount
//     if (medicationData.paidAmount > medicationData.totalAmount) {
//       return res.status(400).json({ message: 'Paid amount cannot exceed total amount' });
//     }

//     // The schema pre-save middleware will handle:
//     // - Calculating pendingAmount
//     // - Setting paymentStatus
//     // - Generating prescriptionNumber

//     const medication = new Medication(medicationData);
//     const savedMedication = await medication.save();

//     console.log('✅ Medication created successfully:', savedMedication._id);
    
//     // Populate patient data in response
//     const populatedMedication = await Medication.findById(savedMedication._id)
//       .populate('patientId', 'firstName lastName patientId phoneNumber age gender');

//     res.status(201).json({
//       message: 'Medication record created successfully',
//       medication: populatedMedication,
//       prescriptionNumber: savedMedication.prescriptionNumber
//     });
//   } catch (error) {
//     console.error('❌ Error creating medication:', error);
    
//     // Handle validation errors specifically
//     if (error.name === 'ValidationError') {
//       const validationErrors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({ 
//         message: 'Validation failed', 
//         errors: validationErrors 
//       });
//     }

//     // Handle duplicate prescription number (unlikely but possible)
//     if (error.code === 11000 && error.keyPattern?.prescriptionNumber) {
//       return res.status(500).json({ message: 'Failed to generate unique prescription number. Please try again.' });
//     }

//     res.status(500).json({ message: 'Server error while creating medication record', error: error.message });
//   }
// };

// // Get medications for a specific patient
// export const getPatientMedications = async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const userRole = req.user.role;
//     const userId = req.user.id;

//     if (!mongoose.Types.ObjectId.isValid(patientId)) {
//       return res.status(400).json({ message: 'Invalid patient ID format' });
//     }

//     let filter = { patientId: new mongoose.Types.ObjectId(patientId) };

//     // Add role-based filtering
//     if (userRole === 'Receptionist') {
//       const receptionist = await Receptionist.findById(userId);
//       if (receptionist) {
//         filter.hospitalId = receptionist.hospitalId;
//       }
//     } else if (userRole === 'Admin') {
//       filter.adminId = new mongoose.Types.ObjectId(userId);
//     }

//     const medications = await Medication.find(filter)
//       .populate('patientId', 'firstName lastName patientId phoneNumber age gender')
//       .sort({ createdAt: -1 });

//     res.json({
//       medications,
//       count: medications.length
//     });
//   } catch (error) {
//     console.error('❌ Error fetching patient medications:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Get all medications with role-based filtering and improved pagination
// export const getAllMedications = async (req, res) => {
//   try {
//     const userRole = req.user.role;
//     const userId = req.user.id;
//     const { hospitalId, page = 1, limit = 10, search, status } = req.query;

//     let filter = {};

//     if (userRole === 'Receptionist') {
//       if (hospitalId) {
//         if (mongoose.Types.ObjectId.isValid(hospitalId)) {
//           filter.hospitalId = new mongoose.Types.ObjectId(hospitalId);
//         } else {
//           return res.status(400).json({ message: 'Invalid hospital ID format' });
//         }
//       } else {
//         const receptionist = await Receptionist.findById(userId);
//         if (receptionist) {
//           filter.hospitalId = receptionist.hospitalId;
//         }
//       }
//     } else if (userRole === 'Admin') {
//       filter.adminId = new mongoose.Types.ObjectId(userId);
//     }

//     // Add search functionality
//     if (search) {
//       filter.$or = [
//         { diagnosis: { $regex: search, $options: 'i' } },
//         { prescriptionNumber: { $regex: search, $options: 'i' } },
//         { 'medications.medicationName': { $regex: search, $options: 'i' } }
//       ];
//     }

//     // Add status filtering
//     if (status) {
//       filter.treatmentStatus = status;
//     }

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     const medications = await Medication.find(filter)
//       .populate('patientId', 'firstName lastName patientId phoneNumber')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     const total = await Medication.countDocuments(filter);

//     res.json({
//       medications,
//       pagination: {
//         current: parseInt(page),
//         pages: Math.ceil(total / parseInt(limit)),
//         total,
//         hasNext: skip + medications.length < total,
//         hasPrev: parseInt(page) > 1
//       }
//     });
//   } catch (error) {
//     console.error('❌ Error fetching medications:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Get medication by ID with enhanced error handling
// export const getMedicationById = async (req, res) => {
//   try {
//     const { medicationId } = req.params;
//     const userRole = req.user.role;
//     const userId = req.user.id;

//     if (!mongoose.Types.ObjectId.isValid(medicationId)) {
//       return res.status(400).json({ message: 'Invalid medication ID format' });
//     }

//     let filter = { _id: new mongoose.Types.ObjectId(medicationId) };

//     // Add role-based filtering
//     if (userRole === 'Receptionist') {
//       const receptionist = await Receptionist.findById(userId);
//       if (receptionist) {
//         filter.hospitalId = receptionist.hospitalId;
//       }
//     } else if (userRole === 'Admin') {
//       filter.adminId = new mongoose.Types.ObjectId(userId);
//     }

//     const medication = await Medication.findOne(filter)
//       .populate('patientId', 'firstName lastName patientId phoneNumber age gender bloodType');

//     if (!medication) {
//       return res.status(404).json({ message: 'Medication record not found or access denied' });
//     }

//     res.json(medication);
//   } catch (error) {
//     console.error('❌ Error fetching medication:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Update medication with enhanced validation
// export const updateMedication = async (req, res) => {
//   try {
//     const { medicationId } = req.params;
//     const userRole = req.user.role;
//     const userId = req.user.id;

//     if (!mongoose.Types.ObjectId.isValid(medicationId)) {
//       return res.status(400).json({ message: 'Invalid medication ID format' });
//     }

//     let filter = { _id: new mongoose.Types.ObjectId(medicationId) };

//     // Add role-based filtering
//     if (userRole === 'Receptionist') {
//       const receptionist = await Receptionist.findById(userId);
//       if (receptionist) {
//         filter.hospitalId = receptionist.hospitalId;
//       }
//     } else if (userRole === 'Admin') {
//       filter.adminId = new mongoose.Types.ObjectId(userId);
//     }

//     // Validate medications array if provided
//     if (req.body.medications) {
//       for (let i = 0; i < req.body.medications.length; i++) {
//         const med = req.body.medications[i];
//         if (!med.medicationName || !med.dosage || !med.duration || !med.instruction) {
//           return res.status(400).json({ 
//             message: `Incomplete medication data for medication ${i + 1}` 
//           });
//         }
//       }
//     }

//     // Validate payment amounts
//     if (req.body.totalAmount !== undefined && req.body.paidAmount !== undefined) {
//       const total = parseFloat(req.body.totalAmount);
//       const paid = parseFloat(req.body.paidAmount);
      
//       if (paid > total) {
//         return res.status(400).json({ message: 'Paid amount cannot exceed total amount' });
//       }
//     }

//     const updatedMedication = await Medication.findOneAndUpdate(
//       filter,
//       { ...req.body, updatedAt: Date.now() },
//       { new: true, runValidators: true }
//     ).populate('patientId', 'firstName lastName patientId');

//     if (!updatedMedication) {
//       return res.status(404).json({ message: 'Medication record not found or access denied' });
//     }

//     res.json({
//       message: 'Medication record updated successfully',
//       medication: updatedMedication
//     });
//   } catch (error) {
//     console.error('❌ Error updating medication:', error);
    
//     if (error.name === 'ValidationError') {
//       const validationErrors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({ 
//         message: 'Validation failed', 
//         errors: validationErrors 
//       });
//     }

//     res.status(500).json({ message: 'Server error while updating medication record', error: error.message });
//   }
// };

// // Delete medication with proper authorization
// export const deleteMedication = async (req, res) => {
//   try {
//     const { medicationId } = req.params;
//     const userRole = req.user.role;
//     const userId = req.user.id;

//     if (!mongoose.Types.ObjectId.isValid(medicationId)) {
//       return res.status(400).json({ message: 'Invalid medication ID format' });
//     }

//     let filter = { _id: new mongoose.Types.ObjectId(medicationId) };

//     // Add role-based filtering
//     if (userRole === 'Receptionist') {
//       const receptionist = await Receptionist.findById(userId);
//       if (receptionist) {
//         filter.hospitalId = receptionist.hospitalId;
//       }
//     } else if (userRole === 'Admin') {
//       filter.adminId = new mongoose.Types.ObjectId(userId);
//     }

//     const deletedMedication = await Medication.findOneAndDelete(filter);

//     if (!deletedMedication) {
//       return res.status(404).json({ message: 'Medication record not found or access denied' });
//     }

//     res.json({ 
//       message: 'Medication record deleted successfully', 
//       prescriptionNumber: deletedMedication.prescriptionNumber 
//     });
//   } catch (error) {
//     console.error('❌ Error deleting medication:', error);
//     res.status(500).json({ message: 'Server error while deleting medication record', error: error.message });
//   }
// };

// // Get medication statistics with enhanced metrics
// export const getMedicationStats = async (req, res) => {
//   try {
//     const userRole = req.user.role;
//     const userId = req.user.id;
//     const { timeRange = '30' } = req.query; // Default to 30 days

//     let filter = {};
//     const dateFilter = new Date();
//     dateFilter.setDate(dateFilter.getDate() - parseInt(timeRange));
    
//     filter.createdAt = { $gte: dateFilter };

//     if (userRole === 'Receptionist') {
//       const receptionist = await Receptionist.findById(userId);
//       if (receptionist) {
//         filter.hospitalId = receptionist.hospitalId;
//       }
//     } else if (userRole === 'Admin') {
//       filter.adminId = new mongoose.Types.ObjectId(userId);
//     }

//     const [
//       totalPrescriptions,
//       pendingPayments,
//       completedTreatments,
//       inProgressTreatments,
//       totalRevenue,
//       pendingAmount
//     ] = await Promise.all([
//       Medication.countDocuments(filter),
//       Medication.countDocuments({
//         ...filter,
//         paymentStatus: { $in: ['Payment Pending', 'Partially Paid'] }
//       }),
//       Medication.countDocuments({
//         ...filter,
//         treatmentStatus: 'Completed'
//       }),
//       Medication.countDocuments({
//         ...filter,
//         treatmentStatus: 'Treatment in Progress'
//       }),
//       Medication.aggregate([
//         { $match: filter },
//         { $group: { _id: null, total: { $sum: '$totalAmount' } } }
//       ]),
//       Medication.aggregate([
//         { $match: filter },
//         { $group: { _id: null, total: { $sum: '$pendingAmount' } } }
//       ])
//     ]);

//     res.json({
//       timeRange: `${timeRange} days`,
//       totalPrescriptions,
//       pendingPayments,
//       completedTreatments,
//       inProgressTreatments,
//       totalRevenue: totalRevenue[0]?.total || 0,
//       pendingAmount: pendingAmount[0]?.total || 0,
//       collectionRate: totalRevenue[0]?.total > 0 
//         ? ((totalRevenue[0].total - (pendingAmount[0]?.total || 0)) / totalRevenue[0].total * 100).toFixed(2) + '%'
//         : '0%'
//     });
//   } catch (error) {
//     console.error('❌ Error fetching medication stats:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };


// controllers/medicationController.js
import mongoose from 'mongoose';
import Medication from '../models/Medication.js';
import Patient from '../models/Patient.js';
import Receptionist from '../models/Receptionist.js';

// Test export first
export const testFunction = () => {
  console.log('Test function works');
};

// Create new medication/prescription
export const createMedication = async (req, res) => {
  try {
    console.log('📝 Creating new medication/prescription:', req.body);
    
    const userRole = req.user.role;
    const userId = req.user.id;
    const { patientId } = req.params;

    // Validate patient ID
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid patient ID format' 
      });
    }

    // Get patient first to extract hospital and admin info
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient not found' 
      });
    }

    let medicationData = { ...req.body };
    medicationData.patientId = patientId;

    // Set hospital and admin IDs based on user role
    if (userRole === 'Receptionist') {
      const receptionist = await Receptionist.findById(userId);
      if (!receptionist) {
        return res.status(404).json({ 
          success: false,
          message: 'Receptionist not found' 
        });
      }
      
      // Verify receptionist belongs to same hospital as patient
      if (receptionist.hospitalId.toString() !== patient.hospitalId.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'Unauthorized: Patient not in your hospital' 
        });
      }
      
      medicationData.hospitalId = receptionist.hospitalId;
      medicationData.adminId = receptionist.admin;
      medicationData.prescribedBy = `${receptionist.firstName} ${receptionist.lastName} (Receptionist)`;
    } else if (userRole === 'Admin') {
      // Verify admin owns this patient
      if (patient.adminId.toString() !== userId) {
        return res.status(403).json({ 
          success: false,
          message: 'Unauthorized: Patient not in your practice' 
        });
      }
      
      medicationData.adminId = userId;
      medicationData.hospitalId = patient.hospitalId;
      medicationData.prescribedBy = `Doctor/Admin`;
    }

    // Validation for required fields
    if (!medicationData.diagnosis || !medicationData.diagnosis.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Diagnosis is required' 
      });
    }

    if (!medicationData.medications || medicationData.medications.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'At least one medication is required' 
      });
    }

    if (!medicationData.appointmentDate) {
      medicationData.appointmentDate = new Date();
    }

    // Validate each medication in the array
    for (let i = 0; i < medicationData.medications.length; i++) {
      const med = medicationData.medications[i];
      if (!med.medicationName || !med.medicationName.trim()) {
        return res.status(400).json({ 
          success: false,
          message: `Medication name is required for medication ${i + 1}` 
        });
      }
      if (!med.dosage || !med.dosage.trim()) {
        return res.status(400).json({ 
          success: false,
          message: `Dosage is required for medication ${i + 1}` 
        });
      }
      if (!med.duration || !med.duration.trim()) {
        return res.status(400).json({ 
          success: false,
          message: `Duration is required for medication ${i + 1}` 
        });
      }
      if (!med.instruction || !med.instruction.trim()) {
        return res.status(400).json({ 
          success: false,
          message: `Instruction is required for medication ${i + 1}` 
        });
      }
    }

    // Set payment and treatment status defaults if not provided
    medicationData.totalAmount = parseFloat(medicationData.totalAmount) || 0;
    medicationData.paidAmount = parseFloat(medicationData.paidAmount) || 0;
    
    // Ensure paidAmount doesn't exceed totalAmount
    if (medicationData.paidAmount > medicationData.totalAmount) {
      return res.status(400).json({ 
        success: false,
        message: 'Paid amount cannot exceed total amount' 
      });
    }

    const medication = new Medication(medicationData);
    const savedMedication = await medication.save();

    console.log('✅ Medication created successfully:', savedMedication._id);
    
    // Populate patient data in response
    const populatedMedication = await Medication.findById(savedMedication._id)
      .populate('patientId', 'firstName lastName patientId phoneNumber age gender');

    res.status(201).json({
      success: true,
      message: 'Medication created successfully',
      medication: populatedMedication,
      prescriptionNumber: savedMedication.prescriptionNumber
    });
  } catch (error) {
    console.error('❌ Error creating medication:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Failed to create medication',
      error: error.message 
    });
  }
};

// Get medications for a specific patient
export const getPatientMedications = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid patient ID format' 
      });
    }

    let filter = { patientId: new mongoose.Types.ObjectId(patientId) };

    // Add role-based filtering
    if (userRole === 'Receptionist') {
      const receptionist = await Receptionist.findById(userId);
      if (receptionist) {
        filter.hospitalId = receptionist.hospitalId;
      }
    } else if (userRole === 'Admin') {
      filter.adminId = new mongoose.Types.ObjectId(userId);
    }

    const medications = await Medication.find(filter)
      .populate('patientId', 'firstName lastName patientId phoneNumber age gender')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: medications.length,
      medications
    });
  } catch (error) {
    console.error('❌ Error fetching patient medications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch patient medications',
      error: error.message 
    });
  }
};

// Get all medications
export const getAllMedications = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get all medications endpoint'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching all medications'
    });
  }
};

// Get medication by ID
export const getMedicationById = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get medication by ID endpoint'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching medication by ID'
    });
  }
};

// Update medication
export const updateMedication = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Update medication endpoint'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating medication'
    });
  }
};

// Delete medication
export const deleteMedication = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Delete medication endpoint'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting medication'
    });
  }
};

// Get medication statistics
export const getMedicationStats = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get medication stats endpoint'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching medication stats'
    });
  }
};