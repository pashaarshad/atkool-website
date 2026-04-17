const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    ownerName: {
        type: String
    },
    teachers: {
        type: Number,
        default: 0
    },
    students: {
        type: Number,
        default: 0
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String
    },
    zipCode: {
        type: String
    },
    status: {
        type: String,
        enum: ['Paid', 'Unpaid', 'Pending'],
        default: 'Pending'
    },
    amount: {
        type: Number,
        default: 0
    },
    mobileNo: {
        type: String
    },
    email: {
        type: String
    },
    address: {
        type: String
    },
    gstNo: {
        type: String
    },
    gstFile: {
        type: String
    },
    password: {
        type: String
    },
    logo: {
        type: String
    },
    // PAN Card fields
    panCardNo: {
        type: String
    },
    panCardFront: {
        type: String
    },
    panCardBack: {
        type: String
    },
    // Aadhar Card fields
    aadharCardNo: {
        type: String
    },
    aadharCardFront: {
        type: String
    },
    aadharCardBack: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('School', schoolSchema);
