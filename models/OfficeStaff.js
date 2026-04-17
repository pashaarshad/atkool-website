const mongoose = require('mongoose');

const officeStaffSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    age: {
        type: Number
    },
    address: {
        type: String
    },
    idCard: {
        type: String  // Base64 encoded image
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
officeStaffSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

officeStaffSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updatedAt: new Date() });
    next();
});

module.exports = mongoose.model('OfficeStaff', officeStaffSchema);
