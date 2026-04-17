const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    ownBrandingSetup: {
        type: Number,
        default: 4000
    },
    perYearSubscription: {
        type: Number,
        default: 5000
    },
    perStudentSubscription: {
        type: Number,
        default: 20
    },
    teachersLimit: {
        type: Number,
        default: 50
    },
    classLimit: {
        type: Number,
        default: 50
    },
    studentsLimit: {
        type: Number,
        default: 500
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Plan', planSchema);
