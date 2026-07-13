const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    name: {
        type: String,
        required: true
    },
    rollNo: {
        type: String
    },
    studentId: {
        type: String
    },
    className: {
        type: String,
        required: true
    },
    section: {
        type: String,
        default: 'A'
    },
    email: {
        type: String
    },
    mobileNo: {
        type: String
    },
    parentName: {
        type: String
    },
    parentMobile: {
        type: String
    },
    guardianMobile: {
        type: String
    },
    vanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SchoolVan',
        default: null
    },
    pickupPoint: {
        type: String
    },
    address: {
        type: String
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Graduated'],
        default: 'Active'
    },
    approvalStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    photo: {
        type: String
    },
    parentUsername: {
        type: String
    },
    parentPassword: {
        type: String
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    academicYear: {
        type: String,
        default: '2026-2027'
    },
    previousClassName: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

studentSchema.index({ schoolId: 1 });
studentSchema.index({ className: 1 });
studentSchema.index({ teacherId: 1 });
studentSchema.index({ email: 1 }, { unique: true, sparse: true });
studentSchema.index({ mobileNo: 1 }, { unique: true, sparse: true });
studentSchema.index({ parentMobile: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Student', studentSchema);
