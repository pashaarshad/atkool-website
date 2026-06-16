const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const FeePayment = require('../models/FeePayment');

// Parent Auth Middleware
function parentAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_admin_secret_key_2024');

        if (decoded.type !== 'parent') {
            return res.status(401).json({ message: 'Invalid token type' });
        }

        req.studentId = decoded.studentId;
        req.schoolId = decoded.schoolId;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

function getRazorpayConfig() {
    return {
        keyId: process.env.RAZORPAY_KEY_ID || '',
        keySecret: process.env.RAZORPAY_KEY_SECRET || ''
    };
}

function buildMockOrder(payment) {
    return {
        id: 'order_mock_' + Math.random().toString(36).slice(2, 11),
        amount: Math.round((payment.feeStructureId.amount || 0) * 100),
        currency: 'INR',
        receipt: String(payment._id)
    };
}

async function createRazorpayOrder(payment) {
    const { keyId, keySecret } = getRazorpayConfig();
    if (!keyId || !keySecret) {
        return {
            mode: 'mock',
            keyId: '',
            order: buildMockOrder(payment)
        };
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            amount: Math.round((payment.feeStructureId.amount || 0) * 100),
            currency: 'INR',
            receipt: String(payment._id),
            notes: {
                feePaymentId: String(payment._id),
                studentId: String(payment.studentId)
            }
        })
    });

    const order = await response.json();
    if (!response.ok) {
        throw new Error(order.error?.description || 'Unable to create Razorpay order');
    }

    return {
        mode: 'razorpay',
        keyId,
        order
    };
}

// Get all fee bills / invoices for logged in parent/student
router.get('/', parentAuth, async (req, res) => {
    try {
        const payments = await FeePayment.find({ studentId: req.studentId })
            .populate('feeStructureId')
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        console.error('Get parent fees error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mock online payment checkout simulation
router.post('/:paymentId/pay', parentAuth, async (req, res) => {
    try {
        const payment = await FeePayment.findOne({ _id: req.params.paymentId, studentId: req.studentId })
            .populate('feeStructureId');

        if (!payment) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        if (payment.status === 'Paid') {
            return res.status(400).json({ message: 'Fee already paid' });
        }

        // Simulate successful card payment processing
        payment.status = 'Paid';
        payment.amountPaid = payment.feeStructureId.amount;
        payment.paymentMethod = 'Online';
        payment.paymentDate = new Date();
        payment.transactionId = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        await payment.save();

        res.json({
            message: 'Payment simulated successfully',
            payment
        });
    } catch (error) {
        console.error('Simulate payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/:paymentId/create-order', parentAuth, async (req, res) => {
    try {
        const payment = await FeePayment.findOne({
            _id: req.params.paymentId,
            studentId: req.studentId,
            schoolId: req.schoolId
        }).populate('feeStructureId');

        if (!payment) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        if (payment.status === 'Paid') {
            return res.status(400).json({ message: 'Fee already paid' });
        }

        const checkout = await createRazorpayOrder(payment);
        res.json({
            ...checkout,
            payment: {
                id: payment._id,
                amount: payment.feeStructureId.amount,
                feeName: payment.feeStructureId.feeName
            }
        });
    } catch (error) {
        console.error('Create parent payment order error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

router.post('/:paymentId/verify', parentAuth, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const { keySecret } = getRazorpayConfig();

        if (!keySecret) {
            return res.status(400).json({ message: 'Razorpay is not configured on the server' });
        }

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification payload is incomplete' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed' });
        }

        const payment = await FeePayment.findOne({
            _id: req.params.paymentId,
            studentId: req.studentId,
            schoolId: req.schoolId
        }).populate('feeStructureId');

        if (!payment) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        payment.status = 'Paid';
        payment.amountPaid = payment.feeStructureId.amount;
        payment.paymentMethod = 'Online';
        payment.paymentDate = new Date();
        payment.transactionId = razorpay_payment_id;
        await payment.save();

        res.json({
            message: 'Payment verified successfully',
            payment
        });
    } catch (error) {
        console.error('Verify parent payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
