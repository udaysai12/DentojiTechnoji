
// Updated receptionistController.js - Fixed Authentication
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Receptionist from '../models/Receptionist.js';
import Admin from '../models/Admin.js';
import Hospital from '../models/Hospital.js';
import { jwtDecode } from 'jwt-decode';

// Helper function to generate readable passwords
const generateReadablePassword = () => {
  const adjectives = ['Happy', 'Bright', 'Swift', 'Smart', 'Quick', 'Fresh', 'Clean', 'Sharp', 'Bold', 'Cool'];
  const nouns = ['Tiger', 'Eagle', 'River', 'Ocean', 'Mountain', 'Forest', 'Garden', 'Bridge', 'Star', 'Moon'];
  const numbers = Math.floor(Math.random() * 99) + 10; // 10-99
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${numbers}!`;
};

// Hash password helper
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password helper - FIXED VERSION
const comparePassword = async (plainPassword, hashedPassword) => {
  // Handle case where password might not be hashed properly
  if (!hashedPassword) {
    return false;
  }
  
  // If stored password doesn't start with $2a$ or $2b$, it's plain text
  if (!hashedPassword.startsWith('$2a$') && !hashedPassword.startsWith('$2b$')) {
    console.log('WARNING: Plain text password detected, comparing directly');
    return plainPassword === hashedPassword;
  }
  
  // Use bcrypt for hashed passwords
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Generate JWT token
const generateToken = (user, role) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: role,
      hospitalId: user.hospitalId
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Migration helper to fix existing records without proper password encryption
export const fixPasswordEncryption = async (req, res) => {
  try {
    // Find all receptionists with plain text passwords or missing passwords
    const receptionists = await Receptionist.find({
      $or: [
        { password: { $regex: /^(?!\$2[ab]\$).*/ } }, // Not bcrypt hash
        { password: { $exists: false } },
        { password: null },
        { password: '' }
      ]
    });

    let fixed = 0;
    const results = [];

    for (let receptionist of receptionists) {
      try {
        let newTempPassword;
        let shouldGenerateNew = false;

        // Check if we need to generate a new password
        if (!receptionist.password || receptionist.password === '' || receptionist.password === null) {
          shouldGenerateNew = true;
          newTempPassword = generateReadablePassword();
        } else if (!receptionist.password.startsWith('$2a$') && !receptionist.password.startsWith('$2b$')) {
          // Password exists but is plain text
          newTempPassword = receptionist.password; // Keep the existing password as temp
          console.log(`Found plain text password for ${receptionist.email}, converting to hash`);
        }

        if (shouldGenerateNew || newTempPassword) {
          const passwordToHash = shouldGenerateNew ? newTempPassword : receptionist.password;
          
          // Hash the password
          const hashedPassword = await hashPassword(passwordToHash);
          
          // Update the receptionist
          receptionist.password = hashedPassword;
          receptionist.tempPassword = shouldGenerateNew ? newTempPassword : receptionist.tempPassword || passwordToHash;
          receptionist.isFirstLogin = true;
          receptionist.passwordResetAt = new Date();
          receptionist.loginAttempts = 0;
          receptionist.lockUntil = null;
          
          await receptionist.save({ validateBeforeSave: false });
          fixed++;
          
          results.push({
            email: receptionist.email,
            action: shouldGenerateNew ? 'Generated new password' : 'Converted plain text to hash',
            tempPassword: shouldGenerateNew ? newTempPassword : '[Existing password hashed]'
          });

          console.log(`Fixed password for receptionist: ${receptionist.email} - Action: ${shouldGenerateNew ? 'Generated new' : 'Hashed existing'}`);
        }
      } catch (updateError) {
        console.error(`Failed to fix password for ${receptionist.email}:`, updateError);
        results.push({
          email: receptionist.email,
          action: 'FAILED',
          error: updateError.message
        });
      }
    }

    res.status(200).json({
      message: `Password encryption fix completed. Fixed ${fixed} receptionist accounts.`,
      count: fixed,
      totalChecked: receptionists.length,
      results
    });

  } catch (error) {
    console.error('Password encryption fix error:', error);
    res.status(500).json({ message: 'Password encryption fix failed', error: error.message });
  }
};

export const registerReceptionist = async (req, res) => {
  try {
    const { name, email, password, phone, admin, hospitalId, position = 'Receptionist', status = 'Active' } = req.body;

    console.log('Register request received:', { name, email, admin, hospitalId, position, status });

    // Validate required fields
    if (!name || !email || !admin || !hospitalId) {
      return res.status(400).json({ message: 'Missing required fields: name, email, admin, and hospitalId are required.' });
    }

    // Check if email already exists
    const existingReceptionist = await Receptionist.findOne({ email });
    if (existingReceptionist) {
      return res.status(400).json({ message: 'Email is already used by another receptionist.' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'This email is already used as an admin email.' });
    }

    // Validate ObjectIDs
    if (!mongoose.Types.ObjectId.isValid(admin)) {
      return res.status(400).json({ message: 'Invalid admin ID format.' });
    }

    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ message: 'Invalid hospital ID format.' });
    }

    // Verify admin and hospital exist
    const adminDoc = await Admin.findById(admin);
    if (!adminDoc) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    const hospitalDoc = await Hospital.findById(hospitalId);
    if (!hospitalDoc) {
      return res.status(404).json({ message: 'Hospital not found.' });
    }

    // Generate temp password if not provided
    let tempPassword = password && password.trim() ? password.trim() : generateReadablePassword();
    
    // ALWAYS hash the password - FIXED
    const hashedPassword = await hashPassword(tempPassword);

    console.log('Creating receptionist with temp password:', tempPassword);

    const newReceptionist = new Receptionist({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword, // ALWAYS store hashed password
      tempPassword: tempPassword, // Store plain text for admin viewing
      phone: phone ? phone.trim() : null,
      position,
      status,
      admin,
      hospitalId,
      isFirstLogin: true,
      role: 'Receptionist'
    });

    await newReceptionist.save();
    console.log('Receptionist created successfully:', newReceptionist._id);

    // Populate response data
    const populatedReceptionist = await Receptionist.findById(newReceptionist._id)
      .select('-password')
      .populate('hospitalId', 'name location')
      .populate('admin', 'name email');

    res.status(201).json({
      message: 'Receptionist registered successfully.',
      receptionist: populatedReceptionist,
      tempPassword: tempPassword,
    });

  } catch (error) {
    console.error('Error registering receptionist:', error);
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const loginReceptionist = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Receptionist login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find receptionist with password field - ALWAYS SELECT PASSWORD
    const receptionist = await Receptionist.findOne({ email: email.toLowerCase().trim() })
      .select('+password +tempPassword') // Include both password and tempPassword
      .populate('hospitalId', 'name location')
      .populate('admin', 'name email');

    if (!receptionist) {
      console.log('Receptionist not found for email:', email);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    console.log('Found receptionist:', {
      email: receptionist.email,
      hasPassword: !!receptionist.password,
      hasTempPassword: !!receptionist.tempPassword,
      isFirstLogin: receptionist.isFirstLogin,
      status: receptionist.status,
      isLocked: receptionist.isLocked,
      loginAttempts: receptionist.loginAttempts || 0,
      passwordStartsWith: receptionist.password ? receptionist.password.substring(0, 4) + '...' : 'NO_PASSWORD'
    });

    // Check account status
    if (receptionist.status === 'Suspended') {
      return res.status(403).json({ message: 'Account suspended. Please contact administration.' });
    }

    if (receptionist.status === 'Inactive') {
      return res.status(403).json({ message: 'Account inactive. Please contact administration.' });
    }

    // Check if account is locked
    if (receptionist.isLocked) {
      const lockExpiry = new Date(receptionist.lockUntil);
      const now = new Date();
      
      if (lockExpiry > now) {
        const minutesLeft = Math.ceil((lockExpiry - now) / (1000 * 60));
        return res.status(423).json({ 
          message: `Account temporarily locked. Try again in ${minutesLeft} minutes.` 
        });
      } else {
        // Lock has expired, reset attempts
        receptionist.loginAttempts = 0;
        receptionist.lockUntil = null;
        await receptionist.save({ validateBeforeSave: false });
      }
    }

    // FIXED PASSWORD VALIDATION
    let isPasswordValid = false;

    if (!receptionist.password) {
      console.log('No password hash found for receptionist');
      return await handleFailedLogin(receptionist, 'Invalid email or password.');
    }

    try {
      // Use the improved comparePassword function
      isPasswordValid = await comparePassword(password, receptionist.password);
      console.log('Password validation result:', isPasswordValid);
    } catch (compareError) {
      console.error('Password comparison error:', compareError);
      return res.status(500).json({ message: 'Authentication error. Please try again.' });
    }
    
    if (!isPasswordValid) {
      console.log('Password validation failed for:', email);
      return await handleFailedLogin(receptionist, 'Invalid email or password.');
    }

    console.log('Password validated successfully for:', email);

    // Success - reset login attempts and update login info
    receptionist.loginAttempts = 0;
    receptionist.lockUntil = null;
    receptionist.lastLogin = new Date();
    
    // Update first login status
    if (receptionist.isFirstLogin) {
      receptionist.isFirstLogin = false;
    }
    
    await receptionist.save({ validateBeforeSave: false });

    // Generate JWT token
    const token = generateToken(receptionist, 'Receptionist');

    // Prepare response data
    const responseData = {
      id: receptionist._id,
      name: receptionist.name,
      email: receptionist.email,
      phone: receptionist.phone,
      role: 'Receptionist',
      position: receptionist.position,
      status: receptionist.status,
      permissions: receptionist.permissions || [],
      adminId: receptionist.admin,
      hospitalId: receptionist.hospitalId,
      isFirstLogin: false,
      lastLogin: receptionist.lastLogin
    };

    console.log('Login successful for receptionist:', receptionist.email);

    res.status(200).json({
      message: 'Login successful',
      token: token,
      receptionist: responseData,
      hospital: receptionist.hospitalId
    });

  } catch (error) {
    console.error('Error logging in receptionist:', error);
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Helper function to handle failed login attempts
const handleFailedLogin = async (receptionist, message) => {
  receptionist.loginAttempts = (receptionist.loginAttempts || 0) + 1;
  
  // Lock account after 5 failed attempts for 15 minutes
  if (receptionist.loginAttempts >= 5) {
    receptionist.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    await receptionist.save({ validateBeforeSave: false });
    return { status: 423, json: { message: 'Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.' } };
  }
  
  await receptionist.save({ validateBeforeSave: false });
  return { status: 401, json: { message } };
};

export const updateReceptionist = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, phone, status, position } = req.body;

    console.log('Update receptionist request:', { id, name, email, status, position, hasPassword: !!password });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid receptionist ID format.' });
    }

    const existingReceptionist = await Receptionist.findById(id);
    if (!existingReceptionist) {
      return res.status(404).json({ message: 'Receptionist not found.' });
    }

    // Check email uniqueness if email is being changed
    if (email && email !== existingReceptionist.email) {
      const emailExists = await Receptionist.findOne({ 
        email: email.toLowerCase().trim(), 
        _id: { $ne: id } 
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already used by another receptionist.' });
      }
      
      const adminEmailExists = await Admin.findOne({ email: email.toLowerCase().trim() });
      if (adminEmailExists) {
        return res.status(400).json({ message: 'This email is already used as an admin email.' });
      }
    }

    // Validate status and position
    if (status && !['Active', 'Inactive', 'On Leave', 'Suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: Active, Inactive, On Leave, Suspended.' });
    }

    if (position && !['Receptionist', 'Senior Receptionist', 'Head Receptionist'].includes(position)) {
      return res.status(400).json({ message: 'Invalid position.' });
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (status) updateData.status = status;
    if (position) updateData.position = position;

    // Handle password update - ALWAYS HASH NEW PASSWORDS
    if (password && password.trim() !== '') {
      const newPassword = password.trim();
      console.log('Updating password for receptionist:', id);
      
      // ALWAYS hash the new password
      updateData.password = await hashPassword(newPassword);
      updateData.tempPassword = newPassword; // Store plain text for admin viewing
      updateData.isFirstLogin = true;
      updateData.passwordResetAt = new Date();
      updateData.loginAttempts = 0;
      updateData.lockUntil = null;
    }

    const updatedReceptionist = await Receptionist.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('hospitalId', 'name location')
      .populate('admin', 'name email');

    console.log('Receptionist updated successfully:', updatedReceptionist._id);

    res.status(200).json({
      message: 'Receptionist updated successfully.',
      receptionist: updatedReceptionist,
    });

  } catch (error) {
    console.error('Error updating receptionist:', error);
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token format.' });
    }

    const role = decoded.role?.toLowerCase();
    
    if (role === 'receptionist' && decoded.id !== id) {
      return res.status(403).json({ message: 'You can only change your own password' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid receptionist ID format.' });
    }

    const receptionist = await Receptionist.findById(id).select('+password');
    if (!receptionist) {
      return res.status(404).json({ message: 'Receptionist not found.' });
    }

    // Verify current password for receptionist role
    if (role === 'receptionist') {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required.' });
      }
      
      if (!receptionist.password) {
        return res.status(400).json({ message: 'No current password set. Please contact admin.' });
      }
      
      const isCurrentPasswordValid = await comparePassword(currentPassword, receptionist.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }
    }

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    // ALWAYS hash the new password
    const hashedNewPassword = await hashPassword(newPassword.trim());
    
    receptionist.password = hashedNewPassword;
    receptionist.tempPassword = newPassword.trim(); // Keep plain text for admin viewing
    receptionist.isFirstLogin = false;
    receptionist.passwordResetAt = new Date();
    receptionist.loginAttempts = 0;
    receptionist.lockUntil = null;
    
    await receptionist.save({ validateBeforeSave: false });

    console.log('Password changed successfully for receptionist:', receptionist.email);

    res.status(200).json({ 
      message: 'Password changed successfully.',
      changedAt: new Date()
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Keep other functions unchanged...
export const deleteReceptionist = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid receptionist ID format.' });
    }

    const deletedReceptionist = await Receptionist.findByIdAndDelete(id);
    if (!deletedReceptionist) {
      return res.status(404).json({ message: 'Receptionist not found.' });
    }

    console.log('Receptionist deleted successfully:', deletedReceptionist._id);

    res.status(200).json({
      message: 'Receptionist deleted successfully.',
      receptionist: {
        _id: deletedReceptionist._id,
        name: deletedReceptionist.name,
        email: deletedReceptionist.email,
      },
    });
  } catch (error) {
    console.error('Error deleting receptionist:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const listofReceptionist = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided.' });
    }

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token format.' });
    }

    const role = decoded.role?.toLowerCase();
    const userId = decoded.id;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token: missing user ID.' });
    }

    let query = {};
    let hospitalId = null;

    if (role === 'admin') {
      hospitalId = decoded.hospitalId;

      if (!hospitalId) {
        const admin = await Admin.findById(userId);
        if (admin && admin.hospitalId) {
          hospitalId = admin.hospitalId;
        }
      }

      if (!hospitalId) {
        const Hospital = mongoose.model('Hospital');
        const hospital = await Hospital.findOne({ adminId: userId });
        if (hospital) {
          hospitalId = hospital._id;
        }
      }

      if (!hospitalId) {
        return res.status(400).json({ message: 'No hospital ID found for admin. Please complete hospital setup.' });
      }

      query.admin = userId;
      query.hospitalId = hospitalId;

    } else if (role === 'receptionist') {
      hospitalId = decoded.hospitalId;

      if (!hospitalId) {
        const receptionist = await Receptionist.findById(userId);
        if (!receptionist) {
          return res.status(404).json({ message: 'Receptionist not found.' });
        }
        hospitalId = receptionist.hospitalId;
      }

      if (!hospitalId) {
        return res.status(400).json({ message: 'No hospital ID found for receptionist.' });
      }

      query.hospitalId = hospitalId;

    } else {
      return res.status(403).json({ message: 'Unauthorized role.' });
    }

    const receptionists = await Receptionist.find(query)
      .select('-password')
      .populate('hospitalId', 'name location')
      .populate('admin', 'name email')
      .sort({ createdAt: -1 });

    const transformedReceptionists = receptionists.map((receptionist) => ({
      _id: receptionist._id,
      name: receptionist.name,
      email: receptionist.email,
      phone: receptionist.phone || 'N/A',
      role: receptionist.role,
      position: receptionist.position || 'Receptionist',
      status: receptionist.status || 'Active',
      permissions: receptionist.permissions || [],
      admin: receptionist.admin,
      hospitalId: receptionist.hospitalId?._id,
      hospital: {
        _id: receptionist.hospitalId?._id,
        name: receptionist.hospitalId?.name || 'Unknown Hospital',
      },
      createdAt: receptionist.createdAt,
      updatedAt: receptionist.updatedAt,
      isFirstLogin: receptionist.isFirstLogin || false,
      lastLogin: receptionist.lastLogin,
      isLocked: receptionist.isLocked,
      loginAttempts: receptionist.loginAttempts || 0
    }));

    res.status(200).json(transformedReceptionists);
  } catch (error) {
    console.error('Error fetching receptionists:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getTempPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token format.' });
    }

    if (decoded.role?.toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only Admin users can access passwords' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid receptionist ID format.' });
    }

    const receptionist = await Receptionist.findById(id).select('+tempPassword');
    if (!receptionist) {
      return res.status(404).json({ message: 'Receptionist not found' });
    }

    const adminId = decoded.id;
    if (receptionist.admin.toString() !== adminId) {
      return res.status(403).json({ message: 'Access denied. You can only view passwords for your own receptionists.' });
    }

    const tempPassword = receptionist.tempPassword;
    
    if (!tempPassword) {
      return res.status(200).json({ 
        tempPassword: 'No password available',
        hasTemp: false,
        isFirstLogin: receptionist.isFirstLogin || false,
        message: 'Password not available. Please update password through edit.'
      });
    }
    
    res.status(200).json({ 
      tempPassword: tempPassword,
      hasTemp: true,
      isFirstLogin: receptionist.isFirstLogin || false,
      lastReset: receptionist.passwordResetAt
    });

  } catch (error) {
    console.error('Error fetching temporary password:', error);
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message,
      tempPassword: 'Error loading password'
    });
  }
};

// Add to receptionistController.js

export const checkReceptionistLimit = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // Count existing receptionists
    const count = await Receptionist.countDocuments({ admin: adminId });
    
    // Check paid permissions
    const { default: ReceptionistPayment } = await import('../models/ReceptionistPayment.js');
    const paidSlots = await ReceptionistPayment.countDocuments({
      adminId,
      status: 'paid'
    });
    
    const maxAllowed = 30 + paidSlots; // 30 free + paid slots
    const canAdd = count < maxAllowed;
    
    res.status(200).json({
      canAdd,
      currentCount: count,
      maxAllowed,
      paidSlots,
      message: canAdd ? 'Can add receptionist' : 'Payment required for additional receptionist'
    });
    
  } catch (error) {
    console.error('Error checking receptionist limit:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getReceptionistCount = async (req, res) => {
  try {
    const adminId = req.user.id;
    const count = await Receptionist.countDocuments({ admin: adminId });
    
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error getting receptionist count:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};