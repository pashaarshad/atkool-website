const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
    installmentNumber: {
        type: Number,
        required: true
    },
    label: {
        type: String,
        required: true // e.g. "1st Installment", "2nd Installment", "Custom - April"
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Paid', 'Unpaid', 'Verification Pending'],
        default: 'Unpaid'
    },
    paidDate: {
        type: Date
    },
    verifiedBy: {
        type: String, // Name or ID of school admin who verified
        default: ''
    },
    screenshot: {
        type: String, // Base64 payment proof screenshot
        default: ''
    },
    utrNumber: {
        type: String, // Extracted UTR
        default: ''
    },
    transactionId: {
        type: String, // Extracted transaction ID
        default: ''
    },
    submittedDate: {
        type: Date
    },
    submittedAmount: {
        type: Number,
        default: 0
    }
}, { _id: true });

const feePaymentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    feeStructureId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeStructure',
        required: true
    },
    paymentMode: {
        type: String,
        enum: ['Full', '3 Installments', 'Customized'],
        default: 'Full'
    },
    installments: [installmentSchema],
    totalAmount: {
        type: Number,
        default: 0
    },
    amountPaid: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Paid', 'Unpaid', 'Partial'],
        default: 'Unpaid'
    },
    academicYear: {
        type: String,
        default: '2026-2027'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FeePayment', feePaymentSchema);
