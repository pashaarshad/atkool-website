const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    schoolName: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Initialize', 'Pending', 'Completed', 'Failed'],
        default: 'Initialize'
    },
    transactionId: {
        type: String
    },
    endDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Payment', paymentSchema);
