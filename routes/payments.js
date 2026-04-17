const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const { fromDate, toDate, search, status } = req.query;
        let query = {};

        if (fromDate) {
            query.createdAt = { ...query.createdAt, $gte: new Date(fromDate) };
        }
        if (toDate) {
            query.createdAt = { ...query.createdAt, $lte: new Date(toDate) };
        }
        if (search) {
            query.$or = [
                { schoolName: { $regex: search, $options: 'i' } },
                { userName: { $regex: search, $options: 'i' } },
                { transactionId: { $regex: search, $options: 'i' } }
            ];
        }
        if (status && status !== 'all') {
            query.status = status;
        }

        const payments = await Payment.find(query).sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.json(payment);
    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { schoolName, userName, mobileNumber, amount, status, transactionId, endDate, dueDate } = req.body;

        if (!schoolName || !userName || !amount) {
            return res.status(400).json({ message: 'School Name, User Name and Amount are required' });
        }

        const payment = await Payment.create({
            schoolName,
            userName,
            mobileNumber,
            amount,
            status: status || 'Initialize',
            transactionId,
            endDate,
            dueDate
        });

        res.status(201).json(payment);
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { schoolName, userName, mobileNumber, amount, status, transactionId, endDate, dueDate } = req.body;

        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            { schoolName, userName, mobileNumber, amount, status, transactionId, endDate, dueDate },
            { new: true, runValidators: true }
        );

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json(payment);
    } catch (error) {
        console.error('Update payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const payment = await Payment.findByIdAndDelete(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('Delete payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/seed', auth, async (req, res) => {
    try {
        const existingPayment = await Payment.findOne({ schoolName: 'BRM Se Sec School' });
        if (existingPayment) {
            return res.json({ message: 'Dummy payment already exists', payment: existingPayment });
        }

        const dummyPayment = await Payment.create({
            schoolName: 'BRM Se Sec School',
            userName: 'Rajiv Shingh',
            mobileNumber: '9075593746',
            amount: 89500,
            status: 'Initialize',
            transactionId: 'TXN' + Date.now(),
            endDate: new Date('2025-09-25'),
            dueDate: new Date('2025-09-18')
        });

        res.status(201).json({ message: 'Dummy payment created', payment: dummyPayment });
    } catch (error) {
        console.error('Seed payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
