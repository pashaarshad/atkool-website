const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    className: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true,
        default: 'A'
    },
    dayOfWeek: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
    },
    periods: [{
        periodNumber: {
            type: Number,
            required: true
        },
        subject: {
            type: String,
            required: true
        },
        startTime: {
            type: String, // e.g. "08:30"
            required: true
        },
        endTime: {
            type: String, // e.g. "09:20"
            required: true
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher',
            default: null
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

timetableSchema.index({ schoolId: 1 });
timetableSchema.index({ schoolId: 1, className: 1, section: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
