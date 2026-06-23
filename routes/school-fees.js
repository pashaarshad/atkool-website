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

        if (decoded.type === 'school') {
            req.schoolId = decoded.schoolId;
            next();
        } else if (decoded.type === 'teacher' && decoded.role === 'Principal') {
            req.schoolId = decoded.schoolId;
            next();
        } else {
            return res.status(401).json({ message: 'Invalid token type' });
        }
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

// Configure a new fee structure
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
        
        // Auto-allocate this fee as unpaid (Full mode by default) to all target students
        const paymentPromises = students.map(student => {
            return FeePayment.create({
                studentId: student._id,
                schoolId: req.schoolId,
                feeStructureId: newStructure._id,
                paymentMode: 'Full',
                totalAmount: parseFloat(amount),
                amountPaid: 0,
                status: 'Unpaid',
                installments: [{
                    installmentNumber: 1,
                    label: 'Full Payment',
                    amount: parseFloat(amount),
                    status: 'Unpaid'
                }]
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

// Delete a fee structure
router.delete('/structures/:id', schoolAuth, async (req, res) => {
    try {
        const structure = await FeeStructure.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
        if (!structure) {
            return res.status(404).json({ message: 'Fee structure not found' });
        }
        // Also delete all payments linked to this structure
        await FeePayment.deleteMany({ feeStructureId: req.params.id, schoolId: req.schoolId });
        res.json({ message: 'Fee structure and all associated records deleted' });
    } catch (error) {
        console.error('Delete fee structure error:', error);
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

        let payments = await FeePayment.find(matchQuery)
            .populate('studentId')
            .populate('feeStructureId')
            .sort({ createdAt: -1 });

        // Filter in memory for className and search name
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

// Change payment mode for a student's fee record
router.put('/payments/:id/mode', schoolAuth, async (req, res) => {
    try {
        const { paymentMode, customInstallments } = req.body;

        if (!paymentMode || !['Full', '3 Installments', 'Customized'].includes(paymentMode)) {
            return res.status(400).json({ message: 'Valid payment mode is required (Full / 3 Installments / Customized)' });
        }

        const payment = await FeePayment.findOne({ _id: req.params.id, schoolId: req.schoolId })
            .populate('feeStructureId');

        if (!payment) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        const totalAmount = payment.feeStructureId.amount;

        // Build installments based on mode
        let installments = [];

        if (paymentMode === 'Full') {
            installments = [{
                installmentNumber: 1,
                label: 'Full Payment',
                amount: totalAmount,
                status: 'Unpaid'
            }];
        } else if (paymentMode === '3 Installments') {
            const perInstallment = Math.floor(totalAmount / 3);
            const remainder = totalAmount - (perInstallment * 3);
            installments = [
                { installmentNumber: 1, label: '1st Installment', amount: perInstallment, status: 'Unpaid' },
                { installmentNumber: 2, label: '2nd Installment', amount: perInstallment, status: 'Unpaid' },
                { installmentNumber: 3, label: '3rd Installment', amount: perInstallment + remainder, status: 'Unpaid' }
            ];
        } else if (paymentMode === 'Customized') {
            if (!customInstallments || !Array.isArray(customInstallments) || customInstallments.length === 0) {
                return res.status(400).json({ message: 'Custom installments are required for Customized mode' });
            }

            // Validate that custom installments sum to total
            const customSum = customInstallments.reduce((sum, ci) => sum + (parseFloat(ci.amount) || 0), 0);
            if (Math.abs(customSum - totalAmount) > 1) { // allow ₹1 rounding tolerance
                return res.status(400).json({ 
                    message: `Custom installments total (₹${customSum}) must equal fee amount (₹${totalAmount})` 
                });
            }

            installments = customInstallments.map((ci, index) => ({
                installmentNumber: index + 1,
                label: ci.label || ('Installment ' + (index + 1)),
                amount: parseFloat(ci.amount),
                status: 'Unpaid'
            }));
        }

        payment.paymentMode = paymentMode;
        payment.installments = installments;
        payment.amountPaid = 0;
        payment.status = 'Unpaid';
        payment.totalAmount = totalAmount;

        await payment.save();

        res.json({ message: 'Payment mode updated to ' + paymentMode, payment });
    } catch (error) {
        console.error('Update payment mode error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify (mark as paid) a specific installment
router.put('/payments/:id/verify/:installmentId', schoolAuth, async (req, res) => {
    try {
        const payment = await FeePayment.findOne({ _id: req.params.id, schoolId: req.schoolId })
            .populate('feeStructureId');

        if (!payment) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        const installment = payment.installments.id(req.params.installmentId);
        if (!installment) {
            return res.status(404).json({ message: 'Installment not found' });
        }

        if (installment.status === 'Paid') {
            return res.status(400).json({ message: 'This installment is already marked as paid' });
        }

        installment.status = 'Paid';
        installment.paidDate = new Date();
        installment.verifiedBy = 'School Admin';

        // Recalculate total paid and overall status
        let totalPaid = 0;
        let allPaid = true;
        payment.installments.forEach(inst => {
            if (inst.status === 'Paid') {
                totalPaid += (inst.submittedAmount || inst.amount);
            } else {
                allPaid = false;
            }
        });

        payment.amountPaid = totalPaid;
        payment.status = allPaid ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid');

        await payment.save();

        res.json({ 
            message: installment.label + ' verified as paid',
            payment 
        });
    } catch (error) {
        console.error('Verify installment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Unverify (mark as unpaid) a specific installment
router.put('/payments/:id/unverify/:installmentId', schoolAuth, async (req, res) => {
    try {
        const payment = await FeePayment.findOne({ _id: req.params.id, schoolId: req.schoolId })
            .populate('feeStructureId');

        if (!payment) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        const installment = payment.installments.id(req.params.installmentId);
        if (!installment) {
            return res.status(404).json({ message: 'Installment not found' });
        }

        installment.status = 'Unpaid';
        installment.paidDate = null;
        installment.verifiedBy = '';

        // Recalculate
        let totalPaid = 0;
        let allPaid = true;
        payment.installments.forEach(inst => {
            if (inst.status === 'Paid') {
                totalPaid += (inst.submittedAmount || inst.amount);
            } else {
                allPaid = false;
            }
        });

        payment.amountPaid = totalPaid;
        payment.status = allPaid ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid');

        await payment.save();

        res.json({ 
            message: installment.label + ' marked as unpaid',
            payment 
        });
    } catch (error) {
        console.error('Unverify installment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get school UPI QR Code and UPI ID
router.get('/upi-qr', schoolAuth, async (req, res) => {
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
        console.error('Get school QR error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update school UPI QR Code and UPI ID
router.post('/upi-qr', schoolAuth, async (req, res) => {
    try {
        const School = require('../models/School');
        const { upiqrCode, upiId } = req.body;
        
        const updateData = {};
        if (upiqrCode !== undefined) updateData.upiqrCode = upiqrCode;
        if (upiId !== undefined) updateData.upiId = upiId;

        const school = await School.findByIdAndUpdate(req.schoolId, updateData, { new: true });
        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }
        res.json({ 
            message: 'UPI settings updated successfully', 
            upiqrCode: school.upiqrCode || '',
            upiId: school.upiId || ''
        });
    } catch (error) {
        console.error('Update school QR error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all pending payment verifications for the school
router.get('/pending-verifications', schoolAuth, async (req, res) => {
    try {
        const payments = await FeePayment.find({
            schoolId: req.schoolId,
            'installments.status': 'Verification Pending'
        }).populate('studentId').populate('feeStructureId');

        const pendingList = [];
        payments.forEach(p => {
            p.installments.forEach(inst => {
                if (inst.status === 'Verification Pending') {
                    pendingList.push({
                        paymentId: p._id,
                        installmentId: inst._id,
                        student: p.studentId ? {
                            id: p.studentId._id,
                            name: p.studentId.name,
                            studentId: p.studentId.studentId,
                            className: p.studentId.className,
                            section: p.studentId.section
                        } : null,
                        feeName: p.feeStructureId ? p.feeStructureId.feeName : 'N/A',
                        label: inst.label,
                        amount: inst.amount,
                        submittedAmount: inst.submittedAmount || inst.amount,
                        submittedDate: inst.submittedDate,
                        utrNumber: inst.utrNumber,
                        transactionId: inst.transactionId,
                        screenshot: inst.screenshot
                    });
                }
            });
        });

        res.json(pendingList);
    } catch (error) {
        console.error('Get pending verifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject an installment payment
router.put('/payments/:id/reject/:installmentId', schoolAuth, async (req, res) => {
    try {
        const payment = await FeePayment.findOne({ _id: req.params.id, schoolId: req.schoolId });
        if (!payment) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        const installment = payment.installments.id(req.params.installmentId);
        if (!installment) {
            return res.status(404).json({ message: 'Installment not found' });
        }

        installment.status = 'Unpaid';
        // Clear UTR details and screenshot on rejection
        installment.screenshot = '';
        installment.utrNumber = '';
        installment.transactionId = '';
        installment.paidDate = null;
        installment.verifiedBy = '';

        // Recalculate overall status
        let totalPaid = 0;
        let allPaid = true;
        payment.installments.forEach(inst => {
            if (inst.status === 'Paid') {
                totalPaid += (inst.submittedAmount || inst.amount);
            } else {
                allPaid = false;
            }
        });

        payment.amountPaid = totalPaid;
        payment.status = allPaid ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid');

        await payment.save();
        res.json({ message: 'Payment verification rejected', payment });
    } catch (error) {
        console.error('Reject installment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
