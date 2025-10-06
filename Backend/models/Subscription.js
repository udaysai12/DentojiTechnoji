// models/Subscription.js - CLEANED AND FIXED
import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
        index: true
    },
    planType: {
        type: String,
        required: true,
        enum: ['Free Trial', 'Monthly Plan', 'Yearly Plan']
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'cancelled', 'expired', 'pending', 'replaced'],
        default: 'active'
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    // Optional payment fields - only required for paid plans
    paymentId: {
        type: String,
        required: function() { 
            return this.planType !== 'Free Trial' && this.amount > 0; 
        }
    },
    orderId: {
        type: String,
        required: function() { 
            return this.planType !== 'Free Trial' && this.amount > 0; 
        }
    },
    paymentDetails: {
        payment_method: {
            type: String,
            default: 'free_trial'
        },
        payment_status: {
            type: String,
            default: 'completed'
        },
        razorpay_payment_id: String,
        razorpay_order_id: String,
        razorpay_signature: String,
        created_at: Number,
        verified_at: Date
    },
    features: {
        maxPatients: {
            type: Number,
            default: function() {
                const planFeatures = {
                    'Free Trial': 50,
                    'Monthly Plan': -1, // Unlimited
                    'Yearly Plan': -1   // Unlimited
                };
                return planFeatures[this.planType] || 50;
            }
        },
        hasAdvancedReporting: {
            type: Boolean,
            default: function() {
                return ['Monthly Plan', 'Yearly Plan'].includes(this.planType);
            }
        },
        hasPrioritySupport: {
            type: Boolean,
            default: function() {
                return ['Monthly Plan', 'Yearly Plan'].includes(this.planType);
            }
        },
        hasApiAccess: {
            type: Boolean,
            default: function() {
                return this.planType === 'Yearly Plan';
            }
        },
        hasWhiteLabel: {
            type: Boolean,
            default: function() {
                return this.planType === 'Yearly Plan';
            }
        }
    },
    autoRenew: {
        type: Boolean,
        default: false
    },
    // Cancellation details
    cancelledAt: Date,
    cancellationReason: String,
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

subscriptionSchema.methods.isActive = function() {
    const now = new Date();
    return this.status === 'active' && this.endDate > now;
};

// Indexes for performance
subscriptionSchema.index({ adminId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ planType: 1 });

// Instance methods
subscriptionSchema.methods.getDaysRemaining = function() {
    const now = new Date();
    if (this.endDate <= now) return 0;
    const diff = this.endDate - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

subscriptionSchema.methods.isExpiringSoon = function() {
    return this.getDaysRemaining() <= 7 && this.getDaysRemaining() > 0;
};

subscriptionSchema.methods.isExpired = function() {
    return this.endDate <= new Date();
};

// Static methods
subscriptionSchema.statics.getPlanFeatures = function(planType) {
    const plans = {
        'Free Trial': {
            maxPatients: 50,
            hasAdvancedReporting: false,
            hasPrioritySupport: false,
            hasApiAccess: false,
            hasWhiteLabel: false,
            duration: 7,
            amount: 0
        },
        'Monthly Plan': {
            maxPatients: -1, // Unlimited
            hasAdvancedReporting: true,
            hasPrioritySupport: true,
            hasApiAccess: false,
            hasWhiteLabel: false,
            duration: 30,
            amount: 170000 // in paise
        },
        'Yearly Plan': {
            maxPatients: -1, // Unlimited
            hasAdvancedReporting: true,
            hasPrioritySupport: true,
            hasApiAccess: true,
            hasWhiteLabel: true,
            duration: 365,
            amount: 1800000 // in paise
        }
    };
    return plans[planType] || null;
};

subscriptionSchema.statics.getPlanAmount = function(planType) {
    const features = this.getPlanFeatures(planType);
    return features ? features.amount : 0;
};

// Pre-save middleware
subscriptionSchema.pre('save', function(next) {
    if (this.isNew) {
        // Set features based on plan type if not already set
        const planFeatures = this.constructor.getPlanFeatures(this.planType);
        if (planFeatures && !this.features.maxPatients) {
            this.features = {
                maxPatients: planFeatures.maxPatients,
                hasAdvancedReporting: planFeatures.hasAdvancedReporting,
                hasPrioritySupport: planFeatures.hasPrioritySupport,
                hasApiAccess: planFeatures.hasApiAccess,
                hasWhiteLabel: planFeatures.hasWhiteLabel
            };
        }
    }
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Subscription', subscriptionSchema);