//authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import Admin from "../models/Admin.js";
import Hospital from "../models/Hospital.js";
import Receptionist from "../models/Receptionist.js";
import Subscription from "../models/Subscription.js";
import PaymentOrder from "../models/PaymentOrder.js";
import Patient from "../models/Patient.js";
import { SubscriptionService } from "../services/subscriptionService.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallbackSecretKey";

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

// Email configuration
// const emailTransporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// Email configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  debug: true, // Enable debug logs
  logger: true // Log to console
});

// Test connection on startup
emailTransporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});

// Helper function for password hashing
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Helper function for password comparison
const comparePassword = async (plainPassword, hashedPassword) => {
  if (hashedPassword.startsWith("$2a$") || hashedPassword.startsWith("$2b$")) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  return plainPassword === hashedPassword;
};

// Generate 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Mask email function
const maskEmail = (email) => {
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
};

// Send OTP email
export const sendOTPForEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP with email as key
    otpStore.set(email.trim().toLowerCase(), {
      otp,
      expiry: otpExpiry,
      attempts: 0,
      lastSent: new Date()
    });

    // Send OTP email
   // Send OTP email
const mailOptions = {
  from: process.env.EMAIL_FROM,
  to: email.trim(),
  subject: 'Email Verification - Dentoji',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
      <!-- Header Section -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; border-bottom: 3px solid white; display: inline-block; padding-bottom: 10px;">
          Your Dentoji Journey Begins Now
        </h1>
      </div>
      
      <!-- Content Section -->
      <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #333; font-size: 20px; margin: 0 0 20px 0;">Welcome to Dentoji</h2>
        
        <p style="color: #555; line-height: 1.6; margin: 15px 0;">Thank you for signing up with Dentoji.</p>
        <p style="color: #555; line-height: 1.6; margin: 15px 0;">
          You now have access to an all-in-one platform designed to simplify clinic operations and give you more time for patient care.
        </p>
        
        <p style="color: #555; line-height: 1.6; margin: 25px 0 15px 0; font-weight: 600;">
          Your OTP for email verification is:
        </p>
        
        <!-- OTP Box -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; text-align: center; border-radius: 8px; margin: 25px 0;">
          <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #555; line-height: 1.6; margin: 15px 0; font-size: 14px;">
          This OTP will expire in 10 minutes.
        </p>
        
        <p style="color: #555; line-height: 1.6; margin: 25px 0 15px 0;">
          Start exploring your account today and discover how Dentoji can help you:
        </p>
        
        <!-- Features List -->
        <div style="margin: 20px 0;">
          <p style="color: #555; line-height: 1.8; margin: 10px 0;">
            <span style="color: #667eea; font-size: 18px; margin-right: 8px;">◆</span>
            <strong>Keep patient records organized</strong>
          </p>
          <p style="color: #555; line-height: 1.8; margin: 10px 0;">
            <span style="color: #667eea; font-size: 18px; margin-right: 8px;">◆</span>
            <strong>Automate daily workflows</strong>
          </p>
          <p style="color: #555; line-height: 1.8; margin: 10px 0;">
            <span style="color: #667eea; font-size: 18px; margin-right: 8px;">◆</span>
            <strong>Gain insights into clinic performance</strong>
          </p>
        </div>
        
        
        
        <p style="color: #666; line-height: 1.6; margin: 25px 0 0 0; font-size: 14px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          Got questions? Our team is just an email away – we're here to help you anytime.
        </p>
        
        <p style="color: #999; line-height: 1.6; margin: 15px 0 0 0; font-size: 12px;">
          If you didn't request this, please ignore this email.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p style="margin: 0;">© 2025 Dentoji. All rights reserved.</p>
      </div>
    </div>
  `
};
    await emailTransporter.sendMail(mailOptions);

    res.status(200).json({
      message: "OTP sent successfully",
      maskedEmail: maskEmail(email.trim()),
      canResendAfter: new Date(Date.now() + 60 * 1000) // 1 minute
    });

  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

// Verify OTP
export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const storedOTPData = otpStore.get(email.trim().toLowerCase());

    if (!storedOTPData) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    // Check expiry
    if (new Date() > storedOTPData.expiry) {
      otpStore.delete(email.trim().toLowerCase());
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Check attempts
    if (storedOTPData.attempts >= 3) {
      otpStore.delete(email.trim().toLowerCase());
      return res.status(400).json({ message: "Too many invalid attempts. Please request a new OTP." });
    }

    // Verify OTP
    if (storedOTPData.otp !== otp.trim()) {
      storedOTPData.attempts++;
      otpStore.set(email.trim().toLowerCase(), storedOTPData);
      return res.status(400).json({ 
        message: "Invalid OTP", 
        attemptsLeft: 3 - storedOTPData.attempts 
      });
    }

    // Mark as verified
    otpStore.set(email.trim().toLowerCase(), {
      ...storedOTPData,
      verified: true,
      verifiedAt: new Date()
    });

    res.status(200).json({
      message: "Email verified successfully",
      emailVerified: true
    });

  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Failed to verify OTP. Please try again." });
  }
};


// Verify OTP for password reset
export const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const storedOTPData = otpStore.get(`reset_${email.trim().toLowerCase()}`);

    if (!storedOTPData) {
      return res.status(400).json({ message: "OTP not found or expired. Please request a new one." });
    }

    // Check expiry
    if (new Date() > storedOTPData.expiry) {
      otpStore.delete(`reset_${email.trim().toLowerCase()}`);
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Check attempts
    if (storedOTPData.attempts >= 3) {
      otpStore.delete(`reset_${email.trim().toLowerCase()}`);
      return res.status(400).json({ 
        message: "Too many invalid attempts. Please request a new OTP." 
      });
    }

    // Verify OTP
    if (storedOTPData.otp !== otp.trim()) {
      storedOTPData.attempts++;
      otpStore.set(`reset_${email.trim().toLowerCase()}`, storedOTPData);
      return res.status(400).json({ 
        message: "Invalid OTP", 
        attemptsLeft: 3 - storedOTPData.attempts 
      });
    }

    // Mark as verified - create temporary verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    otpStore.set(`reset_${email.trim().toLowerCase()}`, {
      ...storedOTPData,
      verified: true,
      verifiedAt: new Date(),
      verificationToken: verificationToken,
      // Extend expiry by 5 more minutes for password reset
      expiry: new Date(Date.now() + 5 * 60 * 1000)
    });

    res.status(200).json({
      message: "OTP verified successfully",
      verified: true,
      verificationToken: verificationToken,
      email: email.trim().toLowerCase()
    });

  } catch (error) {
    console.error("Verify reset OTP error:", error);
    res.status(500).json({ message: "Failed to verify OTP. Please try again." });
  }
};


// Send password reset email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });
    
    if (!admin) {
      console.log('Admin not found for email:', email.trim().toLowerCase());
      // For security, don't reveal if email exists or not
      return res.status(200).json({ 
        message: "If an account with that email exists, a password reset OTP has been sent.",
        success: true
      });
    }

    console.log('Admin found:', admin._id, admin.name);

    // Generate 6-digit OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP with attempts tracking
    otpStore.set(`reset_${email.trim().toLowerCase()}`, {
      otp: otp,
      expiry: otpExpiry,
      adminId: admin._id,
      attempts: 0,
      lastSent: new Date()
    });

    console.log('OTP generated and stored:', otp);

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email.trim(),
      subject: 'Password Reset OTP - Dentoji',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #155DFC;">Password Reset Request</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hey ${admin.name},</p>
            
            <p style="font-size: 14px; color: #333; margin-bottom: 20px;">
              You requested to reset your Dentoji password. Use the OTP below to proceed:
            </p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; text-align: center; border-radius: 8px; margin: 25px 0;">
              <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </span>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              This OTP will expire in 10 minutes.
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 15px;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="font-size: 14px; color: #333; margin: 0;">Stay secure,</p>
              <p style="font-size: 14px; color: #333; margin: 5px 0 0 0;">The Dentoji Team</p>
            </div>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log('OTP email sent successfully to:', email.trim());

    res.status(200).json({
      message: "OTP sent successfully to your email",
      success: true,
      maskedEmail: maskEmail(email.trim()),
      canResendAfter: new Date(Date.now() + 60 * 1000) // 1 minute
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

// Reset password with token
export const resetPassword = async (req, res) => {
  try {
    const { email, verificationToken, newPassword } = req.body;

    if (!email || !verificationToken || !newPassword) {
      return res.status(400).json({ 
        message: "Email, verification token, and new password are required" 
      });
    }

    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({ 
        message: "Password must contain uppercase, lowercase, and number" 
      });
    }

    // Get stored data
    const resetData = otpStore.get(`reset_${email.trim().toLowerCase()}`);

    if (!resetData) {
      return res.status(400).json({ 
        message: "Invalid or expired verification. Please start over." 
      });
    }

    // Check if OTP was verified
    if (!resetData.verified || resetData.verificationToken !== verificationToken) {
      return res.status(400).json({ 
        message: "Invalid verification. Please verify OTP first." 
      });
    }

    // Check expiry
    if (new Date() > resetData.expiry) {
      otpStore.delete(`reset_${email.trim().toLowerCase()}`);
      return res.status(400).json({ 
        message: "Verification expired. Please request a new OTP." 
      });
    }

    // Find admin and update password
    const admin = await Admin.findById(resetData.adminId);
    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword);
    admin.password = hashedPassword;
    await admin.save();

    // Clean up
    otpStore.delete(`reset_${email.trim().toLowerCase()}`);

    // Send confirmation email (keep existing email code)
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: admin.email,
      subject: 'Password Changed Successfully - Dentoji',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #155DFC; text-align: center;">Password Changed Successfully</h2>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
            <p>Hey ${admin.name},</p>
            <p>Your Dentoji password has been successfully changed.</p>
            <p>You can now log in with your new password.</p>
            <p style="margin-top: 20px;">If you didn't make this change, please contact us immediately.</p>
            <p style="margin-top: 30px;">Stay secure,<br/>The Dentoji Team</p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Password reset successful",
      success: true
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password. Please try again." });
  }
};


// --- ENHANCED SIGNUP WITH SUBSCRIPTION REDIRECT ---
export const signup = async (req, res) => {
  try {
    const { name, email, password, qualification,phone,country } = req.body;

    console.log("Signup request received:", { name, email, qualification });

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, Email, and Password are required"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        message: "Please enter a valid email address"
      });
    }

    // Check if email is verified
    const storedOTPData = otpStore.get(email.trim().toLowerCase());
    if (!storedOTPData || !storedOTPData.verified) {
      return res.status(400).json({
        message: "Please verify your email address first"
      });
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({
      email: email.trim().toLowerCase()
    });

    if (existingAdmin) {
      console.log("Email already exists:", email.trim().toLowerCase());
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const hashedPassword = await hashPassword(password.trim());

    // Create new admin with pending subscription status
    const newAdmin = new Admin({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      qualification: qualification?.trim() || "",
       phone: phone?.trim() || "",
      country: country?.trim() || "",
      role: "Admin",
      subscriptionStatus: "pending",
      signupDate: new Date()
    });

    await newAdmin.save();
    console.log("Admin created successfully:", newAdmin._id);

    // Clean up OTP data after successful signup
    otpStore.delete(email.trim().toLowerCase());

    // Generate token for pricing page access
    const token = jwt.sign(
      {
        id: newAdmin._id,
        email: newAdmin.email,
        role: newAdmin.role,
        adminId: newAdmin._id.toString(),
        isNewSignup: true,
        needsSubscription: true
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: "Signup successful! Please choose your subscription plan.",
      token: token,
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        qualification: newAdmin.qualification,
        phone: newAdmin.phone,
        country: newAdmin.country,

      },
      redirectTo: "/pricing",
      requiresPricing: true,
      isNewSignup: true
    });

  } catch (err) {
    console.error("Signup error:", err);
    
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// --- LOGIN ---
export const login = async (req, res) => {
  try {
    console.log("Login route hit");
    const { email, password } = req.body;

    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedPassword = password?.trim();

    console.log("Received credentials:", { email: trimmedEmail });

    if (!trimmedEmail || !trimmedPassword) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    let user = null;
    let role = null;
    let hospital = null;
    let hospitalId = null;

    // Check both Admin and Receptionist collections
    const [adminResult, receptionistResult] = await Promise.allSettled([
      Admin.findOne({ email: trimmedEmail }).select('+password').lean(),
      Receptionist.findOne({ email: trimmedEmail })
        .select('+password +tempPassword +loginAttempts +lockUntil +isFirstLogin +status +adminId')
        .populate("hospitalId", "_id name address phone")
        .lean()
    ]);

    // Determine user type
    if (adminResult.status === 'fulfilled' && adminResult.value) {
      user = adminResult.value;
      role = "Admin";
      console.log("Found Admin user:", { email: user.email, id: user._id });
    }
    else if (receptionistResult.status === 'fulfilled' && receptionistResult.value) {
      user = receptionistResult.value;
      role = "Receptionist";
      console.log("Found Receptionist user:", { 
        email: user.email, 
        id: user._id, 
        hospitalId: user.hospitalId,
        adminId: user.adminId || user.admin,
        status: user.status
      });
      hospitalId = user.hospitalId?._id || user.hospitalId;
      hospital = user.hospitalId;
    }

    if (!user) {
      console.log("No user found for email:", trimmedEmail);
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    // Handle Receptionist specific checks
    if (role === "Receptionist") {
      if (user.lockUntil && user.lockUntil > new Date()) {
        const lockTimeRemaining = Math.ceil((user.lockUntil - new Date()) / (1000 * 60));
        return res.status(423).json({ 
          message: `Account temporarily locked. Please try again in ${lockTimeRemaining} minutes.` 
        });
      }

      if (user.status === 'inactive') {
        return res.status(403).json({ 
          message: "Account is inactive. Please contact your administrator." 
        });
      }
    }

    // Verify password
    const isMatch = await comparePassword(trimmedPassword, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      if (role === "Receptionist") {
        const loginAttempts = (user.loginAttempts || 0) + 1;
        const maxAttempts = 5;

        if (loginAttempts >= maxAttempts) {
          const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
          await Receptionist.findByIdAndUpdate(user._id, {
            loginAttempts,
            lockUntil
          });
          return res.status(423).json({ 
            message: "Too many failed attempts. Account locked for 30 minutes." 
          });
        } else {
          await Receptionist.findByIdAndUpdate(user._id, { loginAttempts });
        }
      }
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    // --- SUBSCRIPTION CHECKS ---
    let subscriptionData = null;

    // --- ADMIN SUBSCRIPTION CHECK ---
    if (role === "Admin") {
      console.log("=== ADMIN LOGIN: Checking subscription status ===");
      
      // Check hospital existence
      try {
        hospital = await Hospital.findOne({ adminId: user._id }).lean();
        if (hospital) {
          hospitalId = hospital._id;
          console.log("Found existing hospital:", hospital.name, "ID:", hospitalId);
        } else {
          console.log("No hospital found for admin:", user._id);
        }
      } catch (hospitalErr) {
        console.log("Hospital lookup failed:", hospitalErr.message);
      }

      // Check subscription status
      try {
        subscriptionData = await SubscriptionService.checkSubscriptionStatus(user._id.toString());
        console.log("Admin subscription result:", subscriptionData);
      } catch (subscriptionError) {
        console.error("Subscription check failed:", subscriptionError);
        subscriptionData = { 
          hasActiveSubscription: false, 
          needsPricing: true,
          message: "Subscription check failed" 
        };
      }

      // Handle subscription expiry
      if (!subscriptionData.hasActiveSubscription) {
        console.log("Admin subscription expired");
        
        const tokenPayload = {
          id: user._id,
          email: user.email,
          role,
          adminId: user._id.toString(),
          hospitalId: hospitalId?.toString() || null,
          hasSubscription: false,
          subscriptionExpired: true
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

        const adminResponse = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          qualification: user.qualification || "",
          phone: user.phone || "",
          location: user.location || ""
        };

        const response = {
          message: "Your subscription has expired. Please recharge your plan.",
          subscriptionExpired: true,
          redirectTo: "/pricing",
          token,
          admin: adminResponse
        };

        // Include hospital data if exists
        if (hospital) {
          response.hospital = {
            id: hospital._id,
            _id: hospital._id,
            name: hospital.name,
            address: hospital.address,
            phone: hospital.phone
          };
          response.hasExistingHospital = true;
          console.log("Including existing hospital data for pricing page");
        } else {
          response.hasExistingHospital = false;
          console.log("No hospital - will need hospital form after subscription");
        }

        return res.status(402).json(response);
      }

      // Admin has active subscription, check hospital
      if (!hospital) {
        console.log("Admin has subscription but no hospital - redirecting to hospital form");
        
        const tokenPayload = {
          id: user._id,
          email: user.email,
          role,
          adminId: user._id.toString(),
          hospitalId: null,
          hasSubscription: true,
          planType: subscriptionData.planType,
          subscriptionStatus: 'active'
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

        return res.status(412).json({
          message: "Please complete your hospital registration.",
          redirectTo: "/hospitalform",
          requiresHospitalSetup: true,
          token,
          admin: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            qualification: user.qualification || "",
          },
          subscription: {
            planType: subscriptionData.planType,
            daysRemaining: subscriptionData.daysRemaining,
            isExpiringSoon: subscriptionData.isExpiringSoon,
            endDate: subscriptionData.subscription?.endDate
          }
        });
      }

      // Update admin status
      if (user.subscriptionStatus !== "active") {
        await Admin.findByIdAndUpdate(user._id, { 
          subscriptionStatus: "active",
          lastLoginDate: new Date()
        });
      }
    }

    // --- RECEPTIONIST SUBSCRIPTION CHECK ---
    if (role === "Receptionist") {
      console.log("=== RECEPTIONIST LOGIN: Checking admin subscription ===");
      
      // Reset failed login attempts
      if (user.loginAttempts > 0) {
        await Receptionist.findByIdAndUpdate(user._id, {
          loginAttempts: 0,
          lockUntil: null
        });
      }

      // Check adminId
      const adminId = user.adminId || user.admin;
      if (!adminId) {
        console.log("Receptionist missing adminId");
        return res.status(500).json({
          message: "Account configuration error. Please contact your doctor."
        });
      }

      // Check admin's subscription
      try {
        console.log("Checking admin subscription for:", adminId);
        const adminSubscriptionStatus = await SubscriptionService.checkSubscriptionStatus(adminId.toString());
        console.log("Admin subscription result:", adminSubscriptionStatus);

        if (!adminSubscriptionStatus.hasActiveSubscription) {
          console.log("Receptionist's admin subscription expired - preventing login");
          
          return res.status(402).json({
            message: "Your doctor doesn't have an active subscription. Please contact your doctor.",
            subscriptionExpired: true,
            isReceptionist: true
          });
        }

        console.log("Admin has active subscription - receptionist can proceed");
        
      } catch (subscriptionError) {
        console.error("Admin subscription check failed:", subscriptionError);
        
        return res.status(402).json({
          message: "Unable to verify doctor's subscription status. Please contact your doctor.",
          subscriptionCheckFailed: true,
          isReceptionist: true
        });
      }

      // Get hospital information if not populated
      if (!hospital) {
        try {
          hospital = await Hospital.findById(user.hospitalId).lean();
          if (hospital) {
            hospitalId = hospital._id;
          }
        } catch (hospitalErr) {
          console.log("Hospital lookup failed:", hospitalErr.message);
        }
      }

      // Update successful login data
      const updateData = {
        lastLogin: new Date()
      };

      if (user.isFirstLogin) {
        updateData.isFirstLogin = false;
        updateData.tempPassword = null;
      }

      await Receptionist.updateOne({ _id: user._id }, updateData);
    }

    // --- SUCCESSFUL LOGIN ---
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role,
      hospitalId: hospitalId?.toString() || null,
    };

    if (role === "Admin") {
      tokenPayload.adminId = user._id.toString();
      tokenPayload.hasSubscription = true;
      tokenPayload.subscriptionStatus = 'active';
    } else if (role === "Receptionist") {
      tokenPayload.adminId = (user.adminId || user.admin)?.toString() || null;
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    // Build user response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      qualification: user.qualification || "",
      specialization: user.specialization || "",
      phone: user.phone || user.primaryNumber || "",
      location: user.location || "",
      bio: user.bio || "",
      profileImage: user.profileImage || "",
      role,
      hospitalId: hospitalId?.toString() || null,
    };

    const response = {
      message: "Login successful",
      token,
      [role.toLowerCase()]: userResponse,
    };

    // Add hospital data
    if (hospital) {
      response.hospital = {
        _id: hospital._id,
        name: hospital.name,
        address: hospital.address,
        phone: hospital.phone
      };
    }

    // Add subscription info for Admin
    if (role === "Admin" && subscriptionData) {
      response.subscription = {
        planType: subscriptionData.planType,
        daysRemaining: subscriptionData.daysRemaining,
        isExpiringSoon: subscriptionData.isExpiringSoon,
        endDate: subscriptionData.subscription?.endDate,
        features: subscriptionData.subscription?.features
      };

      // Add expiry warning if needed
      if (subscriptionData.isExpiringSoon) {
        response.subscriptionWarning = {
          daysRemaining: subscriptionData.daysRemaining,
          planType: subscriptionData.planType,
          message: `Your subscription expires in ${subscriptionData.daysRemaining} days`
        };
      }
    }

    // Set redirect destination
    response.redirectTo = role === "Admin" ? "/dashboard" : "/patients";

    console.log("Login successful for:", user._id, "Role:", role);
    res.status(200).json(response);

  } catch (err) {
    console.error("Login error:", err);
    
    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      return res.status(500).json({ 
        message: "Database connection error. Please try again." 
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(500).json({ 
        message: "Token generation error. Please try again." 
      });
    }
    
    res.status(500).json({ 
      message: "Internal server error. Please try again." 
    });
  }
};

// --- CREATE FREE TRIAL SUBSCRIPTION ---
export const createFreeTrialSubscription = async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ 
        message: "Admin ID is required" 
      });
    }

    console.log("Creating free trial for admin:", adminId);

    // Check if admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ 
        message: "Admin not found" 
      });
    }

    // Check if admin already has an active subscription
    const existingSubscription = await SubscriptionService.getCurrentSubscription(adminId);
    if (existingSubscription) {
      console.log("Existing subscription found:", existingSubscription.planType);
      return res.status(409).json({ 
        message: "Admin already has an active subscription",
        currentPlan: existingSubscription.planType
      });
    }

    // Create free trial subscription
    const subscription = await SubscriptionService.createSubscription(adminId, "Free Trial");

    // Update admin subscription status to active
    await Admin.findByIdAndUpdate(adminId, { 
      subscriptionStatus: "active" 
    });

    console.log("Free trial subscription created successfully:", {
      adminId,
      subscriptionId: subscription._id,
      planType: subscription.planType,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      status: subscription.status
    });

    res.status(201).json({
      message: "Free trial subscription created successfully",
      subscription: {
        id: subscription._id,
        planType: subscription.planType,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        daysRemaining: subscription.getDaysRemaining(),
        features: subscription.features
      },
      redirectTo: "/hospitalform",
      requiresHospitalSetup: true
    });

  } catch (err) {
    console.error("Create free trial subscription error:", err);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
};

// --- GET CURRENT SUBSCRIPTION STATUS ---
export const getSubscriptionStatus = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== "Admin") {
      return res.status(403).json({ 
        message: "Only admins can check subscription status" 
      });
    }

    const subscriptionStatus = await SubscriptionService.checkSubscriptionStatus(decoded.id);

    res.status(200).json({
      ...subscriptionStatus,
      adminId: decoded.id
    });

  } catch (err) {
    console.error("Get subscription status error:", err);
    
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
};

// --- GET USAGE STATS ---
export const getUsageStats = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== "Admin") {
      return res.status(403).json({ 
        message: "Only admins can check usage stats" 
      });
    }

    const usageStats = await SubscriptionService.getUsageStats(decoded.id);

    if (!usageStats) {
      return res.status(404).json({ 
        message: "No active subscription found" 
      });
    }

    res.status(200).json(usageStats);

  } catch (err) {
    console.error("Get usage stats error:", err);
    
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
};

// --- GET USER PROFILE ---
export const getUserProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    let user;
    let hospital = null;
    let subscriptionInfo = null;

    if (decoded.role === "Admin") {
      const [userResult, hospitalResult] = await Promise.allSettled([
        Admin.findById(decoded.id).select("-password").lean(),
        Hospital.findOne({ adminId: decoded.id }).lean()
      ]);

      if (userResult.status === 'fulfilled') {
        user = userResult.value;
      }
      if (hospitalResult.status === 'fulfilled') {
        hospital = hospitalResult.value;
      }

      // Get subscription info for Admin
      try {
        const subscriptionStatus = await SubscriptionService.checkSubscriptionStatus(decoded.id);
        if (subscriptionStatus.hasActiveSubscription) {
          subscriptionInfo = {
            planType: subscriptionStatus.planType,
            daysRemaining: subscriptionStatus.daysRemaining,
            isExpiringSoon: subscriptionStatus.isExpiringSoon,
            endDate: subscriptionStatus.endDate,
            features: subscriptionStatus.features
          };
        }
      } catch (subscriptionError) {
        console.log("Subscription info fetch failed:", subscriptionError.message);
      }

    } else if (decoded.role === "Receptionist") {
      user = await Receptionist.findById(decoded.id)
        .select("-password")
        .populate("hospitalId", "_id name address phone")
        .lean();
      
      if (user?.hospitalId) {
        hospital = user.hospitalId;
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const response = {
      [decoded.role.toLowerCase()]: {
        id: user._id,
        name: user.name,
        email: user.email,
        qualification: user.qualification || "",
        specialization: user.specialization || "",
        phone: user.phone || user.primaryNumber || "",
        location: user.location || "",
        bio: user.bio || "",
        profileImage: user.profileImage || "",
        role: decoded.role,
        hospitalId: decoded.hospitalId,
      },
    };

    if (hospital) {
      response.hospital = {
        _id: hospital._id,
        name: hospital.name,
        phone: hospital.phone,
        address: hospital.address
      };
    }

    if (subscriptionInfo) {
      response.subscription = subscriptionInfo;
    }

    if (decoded.role === "Receptionist" && (user.adminId || user.admin)) {
      response[decoded.role.toLowerCase()].admin = user.adminId || user.admin;
    }

    res.status(200).json(response);
  } catch (err) {
    console.error("Get profile error:", err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// --- UPDATE PROFILE ---
export const updateProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { 
      name, 
      qualification, 
      specialization, 
      phone, 
      primaryNumber,
      location, 
      bio, 
      profileImage 
    } = req.body;

    let updateData = {};
    const fields = { name, qualification, specialization, phone, primaryNumber, location, bio, profileImage };
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && (typeof value !== 'string' || value.trim())) {
        updateData[key] = typeof value === 'string' ? value.trim() : value;
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    let user;
    let hospital = null;

    if (decoded.role === "Admin") {
      const [userResult, hospitalResult] = await Promise.allSettled([
        Admin.findByIdAndUpdate(decoded.id, updateData, { new: true, runValidators: true })
          .select("-password").lean(),
        Hospital.findOne({ adminId: decoded.id }).lean()
      ]);

      if (userResult.status === 'fulfilled') {
        user = userResult.value;
      }
      if (hospitalResult.status === 'fulfilled') {
        hospital = hospitalResult.value;
      }
    } else if (decoded.role === "Receptionist") {
      user = await Receptionist.findByIdAndUpdate(decoded.id, updateData, { new: true, runValidators: true })
        .select("-password")
        .populate("hospitalId", "_id name address phone")
        .lean();
      
      if (user?.hospitalId) {
        hospital = user.hospitalId;
      }
    }

    if (!user) {
      return res.status(404).json({ message: `${decoded.role} not found` });
    }

    const response = {
      message: "Profile updated successfully",
      [decoded.role.toLowerCase()]: {
        id: user._id,
        name: user.name,
        email: user.email,
        qualification: user.qualification || "",
        specialization: user.specialization || "",
        phone: user.phone || user.primaryNumber || "",
        location: user.location || "",
        bio: user.bio || "",
        profileImage: user.profileImage || "",
        role: decoded.role,
        hospitalId: decoded.hospitalId,
      },
    };

    if (hospital) {
      response.hospital = {
        _id: hospital._id,
        name: hospital.name,
        phone: hospital.phone,
        address: hospital.address
      };
    }

    res.status(200).json(response);

  } catch (err) {
    console.error("Update profile error:", err);
    
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: "Validation error", errors });
    }
    
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// --- UPLOAD PROFILE IMAGE ---
export const uploadProfileImage = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    console.log("Image upload request:", { 
      userId: decoded.id, 
      role: decoded.role,
      fileName: req.file.filename,
      fileSize: req.file.size 
    });

    const profileImagePath = `/uploads/profiles/${req.file.filename}`;
    let user;

    if (decoded.role === "Admin") {
      user = await Admin.findByIdAndUpdate(
        decoded.id, 
        { profileImage: profileImagePath },
        { new: true, runValidators: true }
      ).select("-password");
      
      if (!user) {
        return res.status(404).json({ message: "Admin not found" });
      }
    } 
    else if (decoded.role === "Receptionist") {
      user = await Receptionist.findByIdAndUpdate(
        decoded.id, 
        { profileImage: profileImagePath },
        { new: true, runValidators: true }
      ).select("-password");
      
      if (!user) {
        return res.status(404).json({ message: "Receptionist not found" });
      }
    }
    else {
      return res.status(400).json({ message: "Invalid user role" });
    }

    console.log("Profile image updated successfully for user:", decoded.id);

    res.status(200).json({
      message: "Profile image uploaded successfully",
      profileImage: user.profileImage,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        qualification: user.qualification || "",
        specialization: user.specialization || "",
        phone: user.phone || user.primaryNumber || "",
        location: user.location || "",
        bio: user.bio || "",
        profileImage: user.profileImage,
        role: decoded.role
      }
    });

  } catch (err) {
    console.error("Upload profile image error:", err);
    
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// --- DELETE PROFILE IMAGE ---
export const deleteProfileImage = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    console.log("Delete profile image request:", { 
      userId: decoded.id, 
      role: decoded.role 
    });

    let user;

    if (decoded.role === "Admin") {
      user = await Admin.findByIdAndUpdate(
        decoded.id, 
        { profileImage: "" },
        { new: true, runValidators: true }
      ).select("-password");
      
      if (!user) {
        return res.status(404).json({ message: "Admin not found" });
      }
    } 
    else if (decoded.role === "Receptionist") {
      user = await Receptionist.findByIdAndUpdate(
        decoded.id, 
        { profileImage: "" },
        { new: true, runValidators: true }
      ).select("-password");
      
      if (!user) {
        return res.status(404).json({ message: "Receptionist not found" });
      }
    }
    else {
      return res.status(400).json({ message: "Invalid user role" });
    }

    console.log("Profile image deleted successfully for user:", decoded.id);

    res.status(200).json({
      message: "Profile image deleted successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        qualification: user.qualification || "",
        specialization: user.specialization || "",
        phone: user.phone || user.primaryNumber || "",
        location: user.location || "",
        bio: user.bio || "",
        profileImage: user.profileImage,
        role: decoded.role
      }
    });

  } catch (err) {
    console.error("Delete profile image error:", err);
    
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// --- UPDATE APPOINTMENT ---
export const updateAppointment = async (req, res) => {
  try {
    const { hospitalId, patientId, appointmentId } = req.params;
    const updateData = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    console.log('🔄 Updating appointment:', { hospitalId, patientId, appointmentId, updateData });

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(patientId) || 
        !mongoose.Types.ObjectId.isValid(hospitalId) ||
        !mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Build filter based on user role
    let filter = { 
      _id: new mongoose.Types.ObjectId(patientId), 
      hospitalId: new mongoose.Types.ObjectId(hospitalId) 
    };

    if (userRole === 'Receptionist') {
      const receptionist = await Receptionist.findById(userId);
      if (receptionist) {
        filter.hospitalId = receptionist.hospitalId;
      }
    } else if (userRole === 'Admin') {
      filter.adminId = new mongoose.Types.ObjectId(userId);
    }

    // Find the patient first
    const patient = await Patient.findOne(filter);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Find and update the specific appointment
    const appointmentIndex = patient.appointments.findIndex(
      apt => apt._id.toString() === appointmentId
    );

    if (appointmentIndex === -1) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Update appointment fields
    const allowedFields = ['appointmentDate', 'appointmentTime', 'treatment', 'doctor', 'status', 'priority', 'duration', 'additionalNotes'];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        patient.appointments[appointmentIndex][field] = updateData[field];
      }
    });

    // Save the updated patient
    await patient.save();

    console.log('✅ Appointment updated successfully');
    res.json({ 
      message: 'Appointment updated successfully', 
      appointment: patient.appointments[appointmentIndex] 
    });

  } catch (error) {
    console.error('❌ Error updating appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- DELETE APPOINTMENT ---
export const deleteAppointment = async (req, res) => {
  try {
    const { hospitalId, patientId, appointmentId } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    console.log('🗑️ Deleting appointment:', { hospitalId, patientId, appointmentId });

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(patientId) || 
        !mongoose.Types.ObjectId.isValid(hospitalId) ||
        !mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Build filter based on user role
    let filter = { 
      _id: new mongoose.Types.ObjectId(patientId), 
      hospitalId: new mongoose.Types.ObjectId(hospitalId) 
    };

    if (userRole === 'Receptionist') {
      const receptionist = await Receptionist.findById(userId);
      if (receptionist) {
        filter.hospitalId = receptionist.hospitalId;
      }
    } else if (userRole === 'Admin') {
      filter.adminId = new mongoose.Types.ObjectId(userId);
    }

    // Find the patient and remove the appointment
    const patient = await Patient.findOne(filter);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Find the appointment to delete
    const appointmentIndex = patient.appointments.findIndex(
      apt => apt._id.toString() === appointmentId
    );

    if (appointmentIndex === -1) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Store the appointment data before deletion
    const deletedAppointment = patient.appointments[appointmentIndex];

    // Remove the appointment
    patient.appointments.splice(appointmentIndex, 1);

    // Save the updated patient
    await patient.save();

    console.log('✅ Appointment deleted successfully');
    res.json({ 
      message: 'Appointment deleted successfully', 
      deletedAppointment 
    });

  } catch (error) {
    console.error('❌ Error deleting appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- GET ALL APPOINTMENTS ---
export const getAllAppointments = async (req, res) => {
  try {
    const { hospitalId, status, priority, limit = 50, page = 1 } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    console.log('📋 Getting all appointments:', { hospitalId, status, priority, limit, page });

    // Build patient filter based on user role
    let patientFilter = {};

    if (userRole === 'Receptionist') {
      if (hospitalId) {
        if (mongoose.Types.ObjectId.isValid(hospitalId)) {
          patientFilter.hospitalId = new mongoose.Types.ObjectId(hospitalId);
        } else {
          return res.status(400).json({ message: 'Invalid hospital ID format' });
        }
      } else {
        return res.status(400).json({ message: 'Hospital ID is required for receptionist' });
      }
    } else if (userRole === 'Admin') {
      patientFilter.adminId = new mongoose.Types.ObjectId(userId);
    }

    // Aggregation pipeline to get all appointments with patient details
    const pipeline = [
      { $match: patientFilter },
      { $unwind: '$appointments' },
      {
        $project: {
          _id: '$appointments._id',
          patientId: '$_id',
          patientName: { $concat: ['$firstName', ' ', '$lastName'] },
          patientPhone: { $ifNull: ['$primaryNumber', '$phoneNumber'] },
          hospitalId: '$hospitalId',
          appointmentDate: '$appointments.appointmentDate',
          appointmentTime: '$appointments.appointmentTime',
          treatment: '$appointments.treatment',
          doctor: '$appointments.doctor',
          status: '$appointments.status',
          priority: '$appointments.priority',
          duration: '$appointments.duration',
          additionalNotes: '$appointments.additionalNotes',
          createdAt: '$appointments.createdAt'
        }
      }
    ];

    // Add filters if specified
    const matchConditions = {};
    if (status && status !== 'All Status') {
      matchConditions['status'] = status;
    }
    if (priority && priority !== 'All Priorities') {
      matchConditions['priority'] = priority;
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Add sorting
    pipeline.push({ $sort: { appointmentDate: 1, appointmentTime: 1 } });

    // Execute aggregation
    const appointments = await Patient.aggregate(pipeline);

    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedAppointments = appointments.slice(skip, skip + parseInt(limit));

    const totalAppointments = appointments.length;
    const totalPages = Math.ceil(totalAppointments / parseInt(limit));

    console.log(`✅ Found ${totalAppointments} appointments`);

    res.json({
      appointments: paginatedAppointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalAppointments,
        limit: parseInt(limit),
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- GET APPOINTMENT STATS ---
export const getAppointmentStats = async (req, res) => {
  try {
    const { hospitalId } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    console.log('📊 Getting appointment stats:', { hospitalId });

    // Build patient filter based on user role
    let patientFilter = {};

    if (userRole === 'Receptionist') {
      if (hospitalId) {
        if (mongoose.Types.ObjectId.isValid(hospitalId)) {
          patientFilter.hospitalId = new mongoose.Types.ObjectId(hospitalId);
        } else {
          return res.status(400).json({ message: 'Invalid hospital ID format' });
        }
      } else {
        return res.status(400).json({ message: 'Hospital ID is required for receptionist' });
      }
    } else if (userRole === 'Admin') {
      patientFilter.adminId = new mongoose.Types.ObjectId(userId);
    }

    // Aggregation pipeline to get appointment statistics
    const pipeline = [
      { $match: patientFilter },
      { $unwind: '$appointments' },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          scheduledAppointments: {
            $sum: {
              $cond: [
                { $in: ['$appointments.status', ['Scheduled', 'Confirmed', 'Pending']] },
                1,
                0
              ]
            }
          },
          completedAppointments: {
            $sum: {
              $cond: [{ $eq: ['$appointments.status', 'Completed'] }, 1, 0]
            }
          },
          cancelledAppointments: {
            $sum: {
              $cond: [{ $eq: ['$appointments.status', 'Cancelled'] }, 1, 0]
            }
          },
          activePatientsWithAppointments: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          _id: 0,
          totalAppointments: 1,
          scheduledAppointments: 1,
          completedAppointments: 1,
          cancelledAppointments: 1,
          activePatientsWithAppointments: { $size: '$activePatientsWithAppointments' }
        }
      }
    ];

    const stats = await Patient.aggregate(pipeline);

    const result = stats[0] || {
      totalAppointments: 0,
      scheduledAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      activePatientsWithAppointments: 0
    };

    console.log('✅ Appointment stats:', result);
    res.json(result);

  } catch (error) {
    console.error('❌ Error fetching appointment stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- COMPLETE SUBSCRIPTION SETUP AFTER PAYMENT ---
export const completeSubscriptionSetup = async (req, res) => {
  try {
    const { adminId, paymentDetails, planType } = req.body;

    console.log("Completing subscription setup:", { adminId, planType });

    if (!adminId || !paymentDetails || !planType) {
      return res.status(400).json({ 
        message: "Admin ID, payment details, and plan type are required" 
      });
    }

    // Verify payment order exists and is paid
    const paymentOrder = await PaymentOrder.findOne({
      adminId: adminId,
      status: 'paid',
      planType: planType
    }).sort({ createdAt: -1 });

    if (!paymentOrder) {
      return res.status(400).json({ 
        message: "Valid payment not found. Please complete payment first." 
      });
    }

    // Check if subscription already exists for this payment
    const existingSubscription = await Subscription.findOne({
      adminId: adminId,
      orderId: paymentOrder.razorpayOrderId,
      status: 'active'
    });

    if (existingSubscription) {
      console.log("Subscription already exists for this payment");
      return res.status(200).json({
        message: "Subscription already active",
        subscription: {
          id: existingSubscription._id,
          planType: existingSubscription.planType,
          daysRemaining: existingSubscription.getDaysRemaining()
        },
        redirectTo: "/hospitalform"
      });
    }

    // Create subscription using the service
    const subscription = await SubscriptionService.createSubscription(
      adminId, 
      planType, 
      paymentDetails
    );

    // Update admin subscription status
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { 
        subscriptionStatus: "active",
        currentPlan: planType,
        subscriptionId: subscription._id,
        lastSubscriptionUpdate: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedAdmin) {
      return res.status(404).json({ 
        message: "Admin not found" 
      });
    }

    console.log("Subscription setup completed for admin:", adminId);

    res.status(200).json({
      message: "Subscription activated successfully",
      admin: {
        id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        subscriptionStatus: updatedAdmin.subscriptionStatus,
        currentPlan: updatedAdmin.currentPlan
      },
      subscription: {
        id: subscription._id,
        planType: subscription.planType,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        daysRemaining: subscription.getDaysRemaining(),
        features: subscription.features
      },
      redirectTo: "/hospitalform",
      requiresHospitalSetup: true
    });

  } catch (err) {
    console.error("Complete subscription setup error:", err);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
};