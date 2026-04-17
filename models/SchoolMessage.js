const mongoose = require('mongoose');

const schoolMessageSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    sendTo: {
        type: String,
        enum: ['All', 'Teachers', 'Students', 'SpecificTeacher'],
        default: 'All'
    },
    targetTeacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        default: null
    },
    heading: {
        type: String,
        required: true,
        maxlength: 30
    },
    message: {
        type: String,
        required: true,
        maxlength: 180
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

schoolMessageSchema.index({ schoolId: 1 });
schoolMessageSchema.index({ createdAt: -1 });
schoolMessageSchema.index({ targetTeacherId: 1 });

module.exports = mongoose.model('SchoolMessage', schoolMessageSchema);
