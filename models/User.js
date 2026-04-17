const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    odishaId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Teacher', 'Student', 'Staff', 'Admin'],
        default: 'Teacher'
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    mobile: {
        type: String
    },
    otp: {
        type: String
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Pending'],
        default: 'Active'
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
