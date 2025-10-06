//subscriptionService.js
import Subscription from '../models/Subscription.js';
import PaymentOrder from '../models/payment.js';
import mongoose from 'mongoose';

export class SubscriptionService {
  
  /**
   * Create a new subscription with proper validation and transaction handling
   */
  static async createSubscription(adminId, planType, paymentDetails = null) {
    try {
      console.log('Creating subscription:', { adminId, planType, hasPaymentDetails: !!paymentDetails });
      
      // Validate MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database connection not ready');
      }
      
      // Validate and convert adminId
      const adminObjectId = this._validateAndConvertAdminId(adminId);
      
      // Get plan features and validate plan type
      const planFeatures = Subscription.getPlanFeatures(planType);
      if (!planFeatures) {
        throw new Error(`Invalid plan type: ${planType}`);
      }
      
      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + (planFeatures.duration * 24 * 60 * 60 * 1000));
      
      console.log('Plan details:', { 
        planType, 
        duration: planFeatures.duration, 
        amount: planFeatures.amount,
        startDate, 
        endDate 
      });

      // Build subscription data
      const subscriptionData = {
        adminId: adminObjectId,
        planType: planType,
        status: 'active',
        startDate: startDate,
        endDate: endDate,
        amount: planFeatures.amount, // Amount in paise for Razorpay compatibility
        currency: 'INR',
        features: {
          maxPatients: planFeatures.maxPatients,
          hasAdvancedReporting: planFeatures.hasAdvancedReporting,
          hasPrioritySupport: planFeatures.hasPrioritySupport,
          hasApiAccess: planFeatures.hasApiAccess,
          hasWhiteLabel: planFeatures.hasWhiteLabel
        },
        autoRenew: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Handle payment details based on plan type
      this._processPaymentDetails(subscriptionData, planType, paymentDetails, planFeatures);

      console.log('Creating subscription with validated data');

      // Use transaction for data consistency
      const session = await mongoose.startSession();
      let savedSubscription;
      
      try {
        await session.withTransaction(async () => {
          // Deactivate existing active subscriptions
          const deactivateResult = await Subscription.updateMany(
            { 
              adminId: adminObjectId, 
              status: { $in: ['active', 'pending'] } 
            },
            { 
              status: 'replaced', 
              updatedAt: new Date(),
              replacedAt: new Date()
            },
            { session }
          );
          console.log(`Deactivated ${deactivateResult.modifiedCount} existing subscriptions`);

          // Create and validate new subscription
          const subscription = new Subscription(subscriptionData);
          
          const validationError = subscription.validateSync();
          if (validationError) {
            console.error('Validation error:', validationError.errors);
            throw new Error(`Validation failed: ${Object.keys(validationError.errors).join(', ')}`);
          }

          savedSubscription = await subscription.save({ session });
          console.log('Subscription saved with ID:', savedSubscription._id);
        });
      } catch (transactionError) {
        console.error('Transaction failed:', transactionError);
        throw transactionError;
      } finally {
        await session.endSession();
      }

      // Post-creation verification
      const verifySubscription = await Subscription.findById(savedSubscription._id);
      if (!verifySubscription) {
        throw new Error('Subscription creation verification failed');
      }
      
      console.log('Subscription created successfully:', {
        id: verifySubscription._id,
        adminId: verifySubscription.adminId,
        planType: verifySubscription.planType,
        daysRemaining: verifySubscription.getDaysRemaining()
      });

      return savedSubscription;

    } catch (error) {
      console.error('Subscription creation error:', {
        message: error.message,
        stack: error.stack,
        adminId,
        planType
      });
      throw error;
    }
  }

  /**
   * Get current active subscription for an admin
   */
  static async getCurrentSubscription(adminId) {
    try {
      if (!adminId) {
        console.log('No adminId provided');
        return null;
      }
      
      const adminObjectId = this._validateAndConvertAdminId(adminId);
      if (!adminObjectId) return null;
      
      // Find active, non-expired subscription
      const subscription = await Subscription.findOne({
        adminId: adminObjectId,
        status: 'active',
        endDate: { $gt: new Date() }
      }).sort({ createdAt: -1 });
      
      if (!subscription) {
        console.log('No active subscription found for admin:', adminObjectId);
        return null;
      }

      // Double-check expiration status
      if (subscription.isExpired()) {
        console.log('Subscription expired, updating status');
        subscription.status = 'expired';
        subscription.expiredAt = new Date();
        await subscription.save();
        return null;
      }

      return subscription;
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      return null; // Return null to prevent login failures
    }
  }

  /**
   * Check comprehensive subscription status
   */
  static async checkSubscriptionStatus(adminId) {
    try {
      const subscription = await this.getCurrentSubscription(adminId);

      if (!subscription) {
        return {
          hasActiveSubscription: false,
          needsPricing: true,
          planType: null,
          daysRemaining: 0,
          isExpiringSoon: false,
          message: 'No active subscription found'
        };
      }

      const daysRemaining = subscription.getDaysRemaining();
      const isExpiringSoon = subscription.isExpiringSoon();

      return {
        hasActiveSubscription: true,
        needsPricing: false,
        subscription: {
          id: subscription._id,
          planType: subscription.planType,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          amount: subscription.amount,
          features: subscription.features,
          daysRemaining,
          isExpiringSoon
        },
        planType: subscription.planType,
        daysRemaining,
        isExpiringSoon,
        endDate: subscription.endDate,
        features: subscription.features,
        message: `Active ${subscription.planType} - ${daysRemaining} days remaining`
      };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return {
        hasActiveSubscription: false,
        needsPricing: true,
        planType: null,
        message: 'Error checking subscription status'
      };
    }
  }

  /**
   * Get subscription history for an admin
   */
  static async getSubscriptionHistory(adminId) {
    try {
      const adminObjectId = this._validateAndConvertAdminId(adminId);
      if (!adminObjectId) return [];

      const subscriptions = await Subscription.find({ adminId: adminObjectId })
        .sort({ createdAt: -1 })
        .lean();

      return subscriptions;
    } catch (error) {
      console.error('Error getting subscription history:', error);
      throw error;
    }
  }

  /**
   * Upgrade existing subscription
   */
  static async upgradeSubscription(adminId, planType, paymentDetails) {
    try {
      console.log('Upgrading subscription:', { adminId, planType });
      
      // Create new subscription (this will automatically handle existing ones via transaction)
      const newSubscription = await this.createSubscription(adminId, planType, paymentDetails);
      
      console.log('Subscription upgraded successfully:', newSubscription._id);
      return newSubscription;
      
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  }

  /**
   * Renew subscription (same as upgrade for this implementation)
   */
  static async renewSubscription(adminId, planType, paymentDetails) {
    try {
      return await this.createSubscription(adminId, planType, paymentDetails);
    } catch (error) {
      console.error('Error renewing subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel active subscription
   */
  static async cancelSubscription(adminId, reason = 'user_requested') {
    try {
      const adminObjectId = this._validateAndConvertAdminId(adminId);
      
      const subscription = await Subscription.findOne({
        adminId: adminObjectId,
        status: 'active'
      });

      if (!subscription) {
        throw new Error('No active subscription found to cancel');
      }

      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      subscription.cancellationReason = reason;
      subscription.updatedAt = new Date();
      
      await subscription.save();

      console.log(`Subscription cancelled for admin: ${adminId}`);
      return subscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Handle expired subscriptions (batch process)
   */
  static async handleExpiredSubscriptions() {
    try {
      const now = new Date();
      const expiredSubscriptions = await Subscription.find({
        status: 'active',
        endDate: { $lt: now }
      });

      console.log('Found expired subscriptions:', expiredSubscriptions.length);

      let processedCount = 0;
      for (const subscription of expiredSubscriptions) {
        try {
          subscription.status = 'expired';
          subscription.expiredAt = now;
          subscription.updatedAt = now;
          await subscription.save();
          processedCount++;
        } catch (error) {
          console.error(`Error updating subscription ${subscription._id}:`, error);
        }
      }

      console.log(`Successfully processed ${processedCount} expired subscriptions`);
      return processedCount;
    } catch (error) {
      console.error('Error handling expired subscriptions:', error);
      throw error;
    }
  }

  /**
   * Check if admin can access a specific feature
   */
  static async canAccessFeature(adminId, featureName) {
    try {
      const subscription = await this.getCurrentSubscription(adminId);
      
      if (!subscription) {
        console.log('No subscription found, denying feature access:', featureName);
        return false;
      }

      const hasFeature = subscription.features && subscription.features[featureName];
      console.log(`Feature access check - ${featureName}:`, hasFeature);
      
      return hasFeature || false;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Get usage statistics for admin
   */
  static async getUsageStats(adminId) {
    try {
      const subscription = await this.getCurrentSubscription(adminId);
      
      if (!subscription) {
        return {
          hasSubscription: false,
          message: 'No active subscription found'
        };
      }

      // Dynamically import Patient model to avoid circular dependencies
      let currentPatientCount = 0;
      try {
        const { default: Patient } = await import('../models/Patient.js');
        currentPatientCount = await Patient.countDocuments({ 
          adminId: this._validateAndConvertAdminId(adminId)
        });
      } catch (importError) {
        console.warn('Could not import Patient model:', importError.message);
      }
      
      const maxPatients = subscription.features.maxPatients;
      const isUnlimited = maxPatients === -1;
      
      return {
        hasSubscription: true,
        subscription: {
          id: subscription._id,
          planType: subscription.planType,
          status: subscription.status,
          daysRemaining: subscription.getDaysRemaining()
        },
        usage: {
          currentPatients: currentPatientCount,
          maxPatients: isUnlimited ? 'Unlimited' : maxPatients,
          patientUsagePercentage: isUnlimited ? 0 : Math.round((currentPatientCount / maxPatients) * 100),
          isNearLimit: !isUnlimited && (currentPatientCount / maxPatients) > 0.8
        },
        features: subscription.features
      };
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      throw error;
    }
  }

  /**
   * Get plan amount in paise (for Razorpay)
   */
  static getPlanAmount(planType) {
    const planFeatures = Subscription.getPlanFeatures(planType);
    return planFeatures ? planFeatures.amount : 0;
  }

  /**
   * Get all available plan details
   */
  static getPlanDetails() {
    return [
      {
        title: "7-Day Free Trial",
        planType: "Free Trial",
        price: "Free",
        period: "for testing",
        amount: 0,
        originalAmount: 0,
        features: [
          "Up to 50 Patients",
          "Basic appointment scheduling",
          "Patient record management",
          "Basic reporting",
          "Email support",
          "Mobile app access"
        ],
        duration: 7,
        isRecommended: false
      },
      {
        title: "Monthly Plan",
        planType: "Monthly Plan",
        price: "₹1,700",
        period: "per month",
        amount: 170000, // Amount in paise
        originalAmount: 300000,
        savings: "Save ₹286",
        features: [
          "Everything in Free Trial",
          "Unlimited patients",
          "Advanced scheduling & reminders",
          "Detailed analytics & reports",
          "Priority phone support",
          "Custom templates",
          "Data backup & restore",
          "Multi-device sync"
        ],
        duration: 30,
        isRecommended: false
      },
      {
        title: "Yearly Plan",
        planType: "Yearly Plan",
        price: "₹18,000",
        period: "per year",
        amount: 1800000, // Amount in paise
        originalAmount: 3600000,
        savings: "Save ₹9,000 (25%)",
        features: [
          "Everything in Monthly Plan",
          "Advanced integrations",
          "Custom branding & white-label",
          "API access for developers",
          "Dedicated account manager",
          "Advanced security features",
          "Priority feature requests",
          "Custom training sessions"
        ],
        duration: 365,
        isRecommended: true
      }
    ];
  }

  /**
   * Debug subscription data for troubleshooting
   */
  static async debugSubscriptionData(adminId) {
    try {
      console.log('=== SUBSCRIPTION DEBUG REPORT ===');
      
      const adminObjectId = this._validateAndConvertAdminId(adminId);
      if (!adminObjectId) {
        return { error: 'Invalid adminId provided' };
      }
      
      // Check database connection
      const dbState = mongoose.connection.readyState;
      console.log('MongoDB connection state:', dbState, '(1=connected)');
      
      // Collection stats
      const totalInCollection = await Subscription.countDocuments({});
      const adminSubscriptions = await Subscription.countDocuments({ adminId: adminObjectId });
      
      // Get detailed subscription data
      const subscriptions = await Subscription.find({ adminId: adminObjectId })
        .sort({ createdAt: -1 })
        .lean();
      
      const debugInfo = {
        database: {
          connected: dbState === 1,
          connectionState: dbState,
          databaseName: mongoose.connection.name
        },
        counts: {
          totalInCollection,
          adminSubscriptions
        },
        subscriptions: subscriptions.map(sub => ({
          id: sub._id,
          planType: sub.planType,
          status: sub.status,
          startDate: sub.startDate,
          endDate: sub.endDate,
          daysRemaining: sub.endDate ? Math.ceil((sub.endDate - new Date()) / (1000 * 60 * 60 * 24)) : null,
          amount: sub.amount,
          createdAt: sub.createdAt
        }))
      };
      
      console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
      console.log('=== DEBUG REPORT END ===');
      
      return debugInfo;
      
    } catch (error) {
      console.error('Debug error:', error);
      throw error;
    }
  }

  // ============= PRIVATE HELPER METHODS =============

  /**
   * Validate and convert adminId to ObjectId
   * @private
   */
  static _validateAndConvertAdminId(adminId) {
    if (!adminId) {
      throw new Error('AdminId is required');
    }

    if (typeof adminId === 'string') {
      if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new Error('Invalid adminId format');
      }
      return new mongoose.Types.ObjectId(adminId);
    } else if (adminId instanceof mongoose.Types.ObjectId) {
      return adminId;
    } else {
      throw new Error('Invalid adminId type - must be string or ObjectId');
    }
  }

  /**
   * Process payment details based on plan type
   * @private
   */
  static _processPaymentDetails(subscriptionData, planType, paymentDetails, planFeatures) {
    if (planType === 'Free Trial') {
      // Free trial doesn't require payment
      subscriptionData.paymentDetails = {
        payment_method: 'free_trial',
        payment_status: 'completed',
        created_at: Math.floor(Date.now() / 1000)
      };
    } else if (planFeatures.amount > 0) {
      // Paid plan requires payment details
      if (!paymentDetails || !paymentDetails.razorpay_payment_id || !paymentDetails.razorpay_order_id) {
        throw new Error('Payment details required for paid plans');
      }

      subscriptionData.paymentId = paymentDetails.razorpay_payment_id;
      subscriptionData.orderId = paymentDetails.razorpay_order_id;
      subscriptionData.paymentDetails = {
        razorpay_payment_id: paymentDetails.razorpay_payment_id,
        razorpay_order_id: paymentDetails.razorpay_order_id,
        razorpay_signature: paymentDetails.razorpay_signature || '',
        payment_method: paymentDetails.payment_method || 'card',
        payment_status: 'completed',
        verified_at: new Date(),
        amount: planFeatures.amount,
        currency: 'INR'
      };
    }
  }
}