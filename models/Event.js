const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    eventFor: {
        type: String,
        enum: ['All', 'Teachers', 'Students'],
        default: 'All'
    },
    image: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Cancelled'],
        default: 'Active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

eventSchema.index({ schoolId: 1 });
eventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Event', eventSchema);
