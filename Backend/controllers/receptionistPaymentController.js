import Razorpay from 'razorpay';
import crypto from 'crypto';
import ReceptionistPayment from '../models/ReceptionistPayment.js';
import Receptionist from '../models/Receptionist.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_R99HrubJ0gN8ko',
  key_secret: process.env.RAZORPAY_SECRET || 'your_secret_key'
});

export const createOrder = async (req, res) => {
  try {
    const { receptionistCount } = req.body;
    const adminId = req.user.id;

    const amount = 29900; // ₹299 in paise
    const receipt = `receipt_receptionist_${Date.now()}`;
    const orderId = `order_receptionist_${adminId}_${Date.now()}`;

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: receipt
    });

    // Save payment record
    const payment = new ReceptionistPayment({
      adminId,
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount,
      receptionistCount,
      status: 'created',
      receipt,
      description: `Payment for additional receptionist #${receptionistCount}`
    });

    await payment.save();

    res.status(200).json({
      success: true,
      order: {
        orderId,
        razorpayOrderId: razorpayOrder.id,
        amount,
        currency: 'INR',
        receipt
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    const adminId = req.user.id;

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET || 'your_secret_key');
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      throw new Error('Payment signature verification failed');
    }

    // Update payment record
    const payment = await ReceptionistPayment.findOneAndUpdate(
      { orderId, adminId },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'paid',
        paidAt: new Date()
      },
      { new: true }
    );

    if (!payment) {
      throw new Error('Payment record not found');
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        receptionistCount: payment.receptionistCount
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(400).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};