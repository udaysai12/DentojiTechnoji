//paymentRoutes
import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import PaymentOrder from '../models/PaymentOrder.js';
import Admin from '../models/Admin.js';
import Subscription from '../models/Subscription.js';
import { SubscriptionService } from '../services/subscriptionService.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { getFreeTrialUsers, getPaidSubscriptionUsers, getUserSubscriptionDetails ,getPaymentHistory, getCurrentPlan} from '../controllers/paymentController.js';

dotenv.config();
const router = express.Router();

// Simple logger replacement for pino
const logger = {
  info: (obj, msg) => console.log('[INFO]', msg || '', obj),
  warn: (obj, msg) => console.warn('[WARN]', msg || '', obj),
  error: (obj, msg) => console.error('[ERROR]', msg || '', obj)
};

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Helper functions
const getPlanDuration = (planType) => {
  const durations = {
    'Free Trial': 7,
    'Monthly Plan': 30,
    'Yearly Plan': 365,
  };
  return durations[planType] || 30;
};

const getPlanEndDate = (planType) => {
  const duration = getPlanDuration(planType);
  return new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
};

const getPlanAmount = (planType) => {
  const amounts = {
    'Free Trial': 0,
    'Monthly Plan': 170000, // in paise
    'Yearly Plan': 1800000, // in paise
  };
  return amounts[planType] || 0;
};

const generateShortReceipt = (adminId) => {
  const timestamp = Date.now().toString().slice(-8);
  const shortAdminId = adminId.toString().slice(-8);
  return `rcpt_${timestamp}_${shortAdminId}`;
};

// GET: Available Plans
router.get('/plans', (req, res) => {
  const requestId = crypto.randomUUID();
  try {
    logger.info({ requestId, message: 'Fetching available plans' });
    const plans = [
      {
        planType: 'Free Trial',
        title: '7-Day Free Trial',
        price: 'Free',
        period: '7 days',
        amount: 0,
        description: 'Perfect for trying out Dentoji',
        features: [
          'Up to 50 patients',
          'Basic appointment scheduling',
          'Patient record management',
          'Basic reporting',
          'Email support',
          'Mobile app access',
        ],
        icon: 'Sparkles',
        button: 'Start Free Trial',
        buttonClass: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
        borderClass: 'border-blue-200 hover:border-blue-300',
        bgClass: 'bg-white hover:bg-blue-50/30',
        gradient: 'from-blue-500 to-cyan-500',
        popular: false,
      },
      {
        planType: 'Monthly Plan',
        title: 'Professional Monthly',
        price: '₹1,700',
        period: '/month',
        amount: 170000,
        originalPrice: '₹3,000',
        savings: 'Save ₹286',
        description: 'Perfect for growing dental practices',
        features: [
          'Everything in Free Trial',
          'Unlimited patients',
          'Advanced scheduling & reminders',
          'Detailed analytics & reports',
          'Priority phone support',
          'Custom templates',
          'Data backup & restore',
          'Multi-device sync',
        ],
        icon: 'Zap',
        button: 'Choose Professional',
        buttonClass: 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600',
        borderClass: 'border-indigo-200 hover:border-indigo-300',
        bgClass: 'bg-white hover:bg-indigo-50/30',
        gradient: 'from-indigo-500 to-purple-500',
        popular: true,
        badge: 'Most Popular',
      },
      {
        planType: 'Yearly Plan',
        title: 'Enterprise Yearly',
        price: '₹18,000',
        period: '/year',
        amount: 1800000,
        originalPrice: '₹36,000',
        savings: 'Save 25%',
        description: 'Best value for established practices',
        features: [
          'Everything in Professional',
          'Advanced integrations',
          'Custom branding & white-label',
          'API access for developers',
          'Dedicated account manager',
          'Advanced security features',
          'Priority feature requests',
          'Custom training sessions',
        ],
        icon: 'Crown',
        button: 'Choose Enterprise',
        buttonClass: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
        borderClass: 'border-yellow-200 hover:border-yellow-300',
        bgClass: 'bg-white hover:bg-yellow-50/30',
        gradient: 'from-yellow-500 to-orange-500',
        popular: false,
      },
    ];

    res.json({ success: true, plans });
  } catch (error) {
    logger.error({ requestId, error: error.message, stack: error.stack, message: 'Error fetching plans' });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plans',
      error: error.message,
      requestId,
    });
  }
});

// POST: Create Free Trial
router.post('/create-free-trial', verifyToken, async (req, res) => {
  const requestId = crypto.randomUUID();
  try {
    const adminId = req.user.id;
    logger.info({ requestId, adminId, message: 'Creating free trial' });

    const existingSubscription = await SubscriptionService.getCurrentSubscription(adminId);
    if (existingSubscription) {
      logger.warn({
        requestId,
        adminId,
        planType: existingSubscription.planType,
        message: 'User already has an active subscription',
      });
      return res.status(409).json({
        success: false,
        message: `You already have an active ${existingSubscription.planType} subscription`,
        currentPlan: existingSubscription.planType,
        daysRemaining: existingSubscription.getDaysRemaining(),
        requestId,
      });
    }

    const subscription = await SubscriptionService.createSubscription(adminId, 'Free Trial');

    logger.info({
      requestId,
      adminId,
      subscriptionId: subscription._id,
      planType: subscription.planType,
      endDate: subscription.endDate,
      message: 'Free trial created successfully',
    });

    res.json({
      success: true,
      message: 'Free trial activated successfully! Welcome to Dentoji!',
      subscription: {
        id: subscription._id,
        planType: subscription.planType,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        daysRemaining: subscription.getDaysRemaining(),
        features: subscription.features,
      },
      nextStep: {
        redirectTo: '/hospitalform',
        message: 'Please complete your hospital setup to get started',
      },
      requestId,
    });
  } catch (error) {
    logger.error({ requestId, adminId: req.user.id, error: error.message, stack: error.stack, message: 'Free trial creation error' });
    res.status(500).json({
      success: false,
      message: 'Failed to create free trial',
      error: error.message,
      requestId,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// POST: Create Razorpay Order
router.post('/create-order', verifyToken, async (req, res) => {
  const requestId = crypto.randomUUID();
  try {
    const { planType } = req.body;
    const adminId = req.user.id;

    logger.info({ requestId, adminId, planType, message: 'Creating order' });

    const validPlanTypes = ['Monthly Plan', 'Yearly Plan'];
    if (!validPlanTypes.includes(planType)) {
      logger.warn({ requestId, adminId, planType, message: 'Invalid plan type' });
      return res.status(400).json({
        success: false,
        message: 'Invalid plan type for payment. Only Monthly Plan and Yearly Plan require payment.',
        requestId,
      });
    }

    const existingSubscription = await SubscriptionService.getCurrentSubscription(adminId);
    if (existingSubscription) {
      logger.warn({
        requestId,
        adminId,
        planType: existingSubscription.planType,
        message: 'User already has an active subscription',
      });
      return res.status(409).json({
        success: false,
        message: `You already have an active ${existingSubscription.planType} subscription`,
        currentPlan: existingSubscription.planType,
        daysRemaining: existingSubscription.getDaysRemaining(),
        requestId,
      });
    }

    const amount = getPlanAmount(planType);
    if (amount <= 0) {
      logger.warn({ requestId, adminId, planType, message: 'Invalid plan amount' });
      return res.status(400).json({
        success: false,
        message: 'Invalid plan amount',
        requestId,
      });
    }

    const shortReceipt = generateShortReceipt(adminId);
    logger.info({ requestId, adminId, receipt: shortReceipt, message: `Generated receipt (length: ${shortReceipt.length})` });

    const orderOptions = {
      amount,
      currency: 'INR',
      receipt: shortReceipt,
      payment_capture: 1,
      notes: {
        planType,
        adminId,
        adminEmail: req.user.email || '',
        createdAt: new Date().toISOString(),
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);
    logger.info({ requestId, adminId, orderId: razorpayOrder.id, message: 'Razorpay order created successfully' });

    const paymentOrderData = {
      adminId,
      orderId: shortReceipt,
      razorpayOrderId: razorpayOrder.id,
      amount: amount / 100,
      currency: 'INR',
      planType,
      planDuration: getPlanDuration(planType),
      planEndDate: getPlanEndDate(planType),
      receipt: shortReceipt,
      status: 'created',
      userDetails: {
        id: req.user.id,
        name: req.user.name || '',
        email: req.user.email || '',
        phone: req.user.phone || '',
        qualification: req.user.qualification || '',
      },
      metadata: {
        adminName: req.user.name || '',
        adminEmail: req.user.email || '',
        type: 'subscription_payment',
        userAgent: req.get('User-Agent') || '',
        ip: req.ip || '',
        reason: 'New subscription purchase',
        timestamp: new Date().toISOString(),
      },
      paymentDetails: {
        payment_method: 'razorpay',
        payment_status: 'pending',
        razorpay_order_id: razorpayOrder.id,
        created_at: razorpayOrder.created_at,
      },
    };

    const savedPaymentOrder = await PaymentOrder.create(paymentOrderData);
    logger.info({ requestId, adminId, paymentOrderId: savedPaymentOrder._id, message: 'Payment order saved successfully' });

    res.json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
      },
      paymentOrderId: savedPaymentOrder._id,
      planDetails: {
        planType,
        planDuration: getPlanDuration(planType),
        formattedAmount: `₹${(amount / 100).toLocaleString('en-IN')}`,
      },
      requestId,
    });
  } catch (error) {
    logger.error({ requestId, adminId: req.user.id, error: error.message, stack: error.stack, message: 'Error creating order' });
    let errorMessage = 'Failed to create payment order';
    let statusCode = 500;

    if (error.message && error.message.includes('receipt')) {
      errorMessage = 'Receipt generation error. Please try again.';
      statusCode = 400;
    } else if (error.statusCode) {
      statusCode = error.statusCode;
      errorMessage = error.error?.description || error.message || errorMessage;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      requestId,
      details: process.env.NODE_ENV === 'development' ? { razorpayError: error.error || null, stack: error.stack } : undefined,
    });
  }
});

// POST: Verify Payment
router.post('/verify-payment', verifyToken, async (req, res) => {
  const requestId = crypto.randomUUID();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = req.body;
    const adminId = req.user.id;

    logger.info({ requestId, adminId, razorpay_order_id, razorpay_payment_id, planType, message: 'Verifying payment' });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      logger.warn({ requestId, adminId, message: 'Missing required payment parameters' });
      return res.status(400).json({
        success: false,
        message: 'Missing required payment parameters',
        required: ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'],
        requestId,
      });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET).update(body.toString()).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      logger.error({
        requestId,
        adminId,
        expectedSignature,
        receivedSignature: razorpay_signature,
        message: 'Payment signature verification failed',
      });

      await PaymentOrder.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: 'failed',
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          'paymentDetails.payment_status': 'failed',
          'paymentDetails.error_description': 'Invalid payment signature',
          updatedAt: new Date(),
        }
      );

      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed. This transaction is not authentic.',
        errorCode: 'SIGNATURE_VERIFICATION_FAILED',
        requestId,
      });
    }

    logger.info({ requestId, adminId, message: 'Payment signature verified successfully' });

    let paymentDetails = null;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      logger.info({
        requestId,
        adminId,
        paymentId: paymentDetails.id,
        status: paymentDetails.status,
        method: paymentDetails.method,
        amount: paymentDetails.amount,
        message: 'Payment details fetched from Razorpay',
      });
    } catch (fetchError) {
      logger.error({ requestId, adminId, error: fetchError.message, stack: fetchError.stack, message: 'Error fetching payment details from Razorpay' });
    }

    const updatedPaymentOrder = await PaymentOrder.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        status: 'completed',
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        paymentDetails: {
          payment_method: paymentDetails?.method || 'card',
          payment_status: 'completed',
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
          amount: paymentDetails?.amount || 0,
          currency: paymentDetails?.currency || 'INR',
          created_at: paymentDetails?.created_at || Math.floor(Date.now() / 1000),
          captured_at: paymentDetails?.captured_at || Math.floor(Date.now() / 1000),
          verified_at: new Date(),
        },
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedPaymentOrder) {
      logger.warn({ requestId, adminId, razorpay_order_id, message: 'Payment order record not found' });
      return res.status(404).json({
        success: false,
        message: 'Payment order record not found in our database',
        requestId,
      });
    }

    logger.info({ requestId, adminId, paymentOrderId: updatedPaymentOrder._id, message: 'Payment order updated successfully' });

    const subscriptionPaymentDetails = {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      payment_method: paymentDetails?.method || 'card',
      payment_status: 'completed',
    };

    const subscription = await SubscriptionService.createSubscription(adminId, planType, subscriptionPaymentDetails);

    logger.info({ requestId, adminId, subscriptionId: subscription._id, message: 'Subscription created successfully' });

    res.json({
      success: true,
      message: `Payment verified successfully! Your ${planType} subscription is now active.`,
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        planType,
        status: 'completed',
        subscriptionId: subscription._id,
        subscription: {
          id: subscription._id,
          planType: subscription.planType,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          daysRemaining: subscription.getDaysRemaining(),
          features: subscription.features,
        },
      },
      nextStep: {
        redirectTo: '/hospitalform',
        message: 'Your subscription is active! Please complete your hospital setup to start using Dentoji.',
      },
      requestId,
    });
  } catch (error) {
    logger.error({ requestId, adminId: req.user.id, error: error.message, stack: error.stack, message: 'Error verifying payment' });
    res.status(500).json({
      success: false,
      message: 'Payment verification failed due to server error',
      error: error.message,
      requestId,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// GET: Subscription Status
router.get('/subscription-status', verifyToken, async (req, res) => {
  const requestId = crypto.randomUUID();
  try {
    const adminId = req.user.id;
    logger.info({ requestId, adminId, message: 'Checking subscription status' });

    const subscriptionStatus = await SubscriptionService.checkSubscriptionStatus(adminId);

    logger.info({
      requestId,
      adminId,
      hasActive: subscriptionStatus.hasActiveSubscription,
      planType: subscriptionStatus.planType,
      daysRemaining: subscriptionStatus.daysRemaining,
      message: 'Subscription status retrieved',
    });

    res.json({
      success: true,
      message: subscriptionStatus.message,
      ...subscriptionStatus,
      requestId,
    });
  } catch (error) {
    logger.error({ requestId, adminId: req.user.id, error: error.message, stack: error.stack, message: 'Error getting subscription status' });
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription status',
      error: error.message,
      hasActiveSubscription: false,
      needsPricing: true,
      requestId,
    });
  }
});

// DELETE: Delete User Trial (Admin only)
router.delete('/delete-trial/:userId', verifyToken, async (req, res) => {
  const requestId = crypto.randomUUID();
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn({ requestId, userId, message: 'Invalid user ID' });
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required',
        requestId,
      });
    }

    const admin = await Admin.findById(userId);
    if (!admin) {
      logger.warn({ requestId, userId, message: 'User not found' });
      return res.status(404).json({
        success: false,
        message: 'User not found',
        requestId,
      });
    }

    const freeTrialSubscription = await Subscription.findOne({
      adminId: userId,
      planType: 'Free Trial',
      status: 'active',
    });

    if (!freeTrialSubscription) {
      logger.warn({ requestId, userId, message: 'No active free trial found' });
      return res.status(400).json({
        success: false,
        message: 'User does not have an active free trial',
        requestId,
      });
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Subscription.findByIdAndUpdate(
          freeTrialSubscription._id,
          {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancellationReason: 'Deleted by admin',
            updatedAt: new Date(),
          },
          { session }
        );

        await Admin.findByIdAndUpdate(
          userId,
          {
            subscriptionStatus: 'cancelled',
            currentPlan: null,
            subscriptionId: null,
            lastSubscriptionUpdate: new Date(),
          },
          { session }
        );

        await PaymentOrder.updateMany(
          {
            adminId: userId,
            planType: 'Free Trial',
            status: 'completed',
          },
          {
            status: 'cancelled',
            updatedAt: new Date(),
          },
          { session }
        );
      });
    } catch (transactionError) {
      logger.error({ requestId, userId, error: transactionError.message, stack: transactionError.stack, message: 'Transaction failed' });
      throw transactionError;
    } finally {
      await session.endSession();
    }

    logger.info({ requestId, userId, message: `Free trial deleted for user ${userId} by admin` });

    res.status(200).json({
      success: true,
      message: 'Free trial deleted successfully',
      data: {
        userId,
        userName: admin.name,
        deletedAt: new Date(),
      },
      requestId,
    });
  } catch (error) {
    logger.error({ requestId, userId: req.params.userId, error: error.message, stack: error.stack, message: 'Error deleting user trial' });
    res.status(500).json({
      success: false,
      message: 'Failed to delete user trial',
      error: error.message,
      requestId,
    });
  }
});

// GET: Debug subscription data (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/:adminId', async (req, res) => {
    const requestId = crypto.randomUUID();
    try {
      const { adminId } = req.params;
      logger.info({ requestId, adminId, message: 'Fetching debug subscription data' });
      const debugData = await SubscriptionService.debugSubscriptionData(adminId);
      res.json({ success: true, debug: debugData, requestId });
    } catch (error) {
      logger.error({ requestId, adminId: req.params.adminId, error: error.message, stack: error.stack, message: 'Error fetching debug data' });
      res.status(500).json({ success: false, error: error.message, requestId });
    }
  });
}

// GET: Free Trial Users
router.get('/free-trials', verifyToken, getFreeTrialUsers);

// GET: Paid Subscription Users
router.get('/paid-subscriptions', verifyToken, getPaidSubscriptionUsers);
router.get('/current-plan', verifyToken, getCurrentPlan);

// GET: Specific User Details
router.get('/user-details/:userId', verifyToken, getUserSubscriptionDetails);
router.get('/payment-history', verifyToken, getPaymentHistory);
export default router;