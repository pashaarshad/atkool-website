const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    mobileNo: {
        type: String
    },
    className: {
        type: String
    },
    // Multiple class assignments
    classAssignments: [{
        className: { type: String },
        section: { type: String }
    }],
    subject: {
        type: String
    },
    students: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'On Leave'],
        default: 'Active'
    },
    salary: {
        type: Number,
        default: 0
    },
    joiningDate: {
        type: Date,
        default: Date.now
    },
    address: {
        type: String
    },
    photo: {
        type: String
    },
    password: {
        type: String
    },
    // Device lock fields
    deviceId: {
        type: String,
        default: null
    },
    deviceName: {
        type: String,
        default: null
    },
    deviceLockedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

teacherSchema.index({ schoolId: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);
