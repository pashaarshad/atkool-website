const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    className: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    examDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true,
        default: 60
    },
    totalMarks: {
        type: Number,
        required: true,
        default: 100
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
        default: 'Scheduled'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

examSchema.index({ schoolId: 1 });
examSchema.index({ examDate: 1 });

module.exports = mongoose.model('Exam', examSchema);
