const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const FeeStructure = require('../models/FeeStructure');
const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');

// School Auth Middleware
function schoolAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_admin_secret_key_2024');

        if (decoded.type !== 'school') {
            return res.status(401).json({ message: 'Invalid token type' });
        }

        req.schoolId = decoded.schoolId;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// Get all fee structures configured by school
router.get('/structures', schoolAuth, async (req, res) => {
    try {
        const structures = await FeeStructure.find({ schoolId: req.schoolId })
            .sort({ createdAt: -1 });
        res.json(structures);
    } catch (error) {
        console.error('Get fee structures error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Configure a new fee structure ( Tuition, Transport, Exam etc )
router.post('/structures', schoolAuth, async (req, res) => {
    try {
        const { feeName, amount, className, dueDate } = req.body;

        if (!feeName || !amount || !className || !dueDate) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newStructure = await FeeStructure.create({
            schoolId: req.schoolId,
            feeName,
            amount: parseFloat(amount),
            className,
            dueDate: new Date(dueDate)
        });

        // Query students that this fee structure applies to
        let studentQuery = { schoolId: req.schoolId, approvalStatus: 'Approved' };
        if (className !== 'All') {
            studentQuery.className = className;
        }

        const students = await Student.find(studentQuery);
        
        // Auto-allocate this fee as unpaid to all target students
        const paymentPromises = students.map(student => {
            return FeePayment.create({
                studentId: student._id,
                schoolId: req.schoolId,
                feeStructureId: newStructure._id,
                amountPaid: 0,
                status: 'Unpaid',
                paymentMethod: 'None'
            });
        });

        await Promise.all(paymentPromises);

        res.status(201).json({
            message: `Fee structure created and allocated to ${students.length} students.`,
            feeStructure: newStructure
        });
    } catch (error) {
        console.error('Create fee structure error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all student fee ledgers / payments
router.get('/payments', schoolAuth, async (req, res) => {
    try {
        const { status, className, search } = req.query;

        let matchQuery = { schoolId: req.schoolId };
        if (status) {
            matchQuery.status = status;
        }

        // Fetch payments and populate Student and FeeStructure
        let payments = await FeePayment.find(matchQuery)
            .populate('studentId')
            .populate('feeStructureId')
            .sort({ createdAt: -1 });

        // Filter in memory for className and search name since populate queries are nested
        if (className || search) {
            payments = payments.filter(p => {
                const student = p.studentId;
                if (!student) return false;

                const matchesClass = className ? student.className === className : true;
                const matchesSearch = search ? student.name.toLowerCase().includes(search.toLowerCase()) : true;

                return matchesClass && matchesSearch;
            });
        }

        res.json(payments);
    } catch (error) {
        console.error('Get fee payments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Collect manual cash / check payment
router.post('/payments/:id/collect', schoolAuth, async (req, res) => {
    try {
        const { paymentMethod } = req.body;
        if (!paymentMethod || !['Cash', 'Card'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'Valid payment method (Cash/Card) is required' });
        }

        const payment = await FeePayment.findOne({ _id: req.params.id, schoolId: req.schoolId })
            .populate('feeStructureId');

        if (!payment) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        if (payment.status === 'Paid') {
            return res.status(400).json({ message: 'Fee already paid' });
        }

        payment.status = 'Paid';
        payment.amountPaid = payment.feeStructureId.amount;
        payment.paymentMethod = paymentMethod;
        payment.paymentDate = new Date();
        payment.transactionId = 'CASH-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        await payment.save();

        res.json({
            message: 'Payment recorded successfully',
            payment
        });
    } catch (error) {
        console.error('Collect fee error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
