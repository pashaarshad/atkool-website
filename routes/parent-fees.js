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

// Get UPI QR Code of the school
router.get('/school-qr', parentAuth, async (req, res) => {
    try {
        const School = require('../models/School');
        const school = await School.findById(req.schoolId);
        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }
        res.json({ 
            upiqrCode: school.upiqrCode || '',
            upiId: school.upiId || ''
        });
    } catch (error) {
        console.error('Get school QR for parent error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Parent submits payment proof for verification
router.post('/payments/:id/submit-verification/:installmentId', parentAuth, async (req, res) => {
    try {
        const { screenshot, utrNumber, transactionId } = req.body;

        if (!screenshot) {
            return res.status(400).json({ message: 'Payment screenshot proof is required' });
        }

        const payment = await FeePayment.findOne({ _id: req.params.id, studentId: req.studentId });
        if (!payment) {
            return res.status(404).json({ message: 'Fee record not found or unauthorized' });
        }

        const installment = payment.installments.id(req.params.installmentId);
        if (!installment) {
            return res.status(404).json({ message: 'Installment not found' });
        }

        if (installment.status === 'Paid') {
            return res.status(400).json({ message: 'This installment is already paid' });
        }

        // Save proof details and mark verification pending
        installment.status = 'Verification Pending';
        installment.screenshot = screenshot;
        installment.utrNumber = utrNumber || '';
        installment.transactionId = transactionId || '';
        installment.submittedDate = new Date();

        await payment.save();

        res.json({ 
            message: 'Payment proof submitted successfully. Verification is pending with school admin.',
            payment 
        });
    } catch (error) {
        console.error('Submit payment proof error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
