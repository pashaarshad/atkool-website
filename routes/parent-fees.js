const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
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

module.exports = router;
