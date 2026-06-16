const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userType: {
        type: String,
        enum: ['teacher', 'parent'],
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // expires in 24 hours
    }
});

emailVerificationSchema.index({ token: 1 });

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
