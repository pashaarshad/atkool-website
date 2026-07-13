const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
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
    subject: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    attachments: [String], // Array of base64 strings or URLs
    academicYear: {
        type: String,
        default: '2026-2027'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

homeworkSchema.index({ schoolId: 1 });
homeworkSchema.index({ className: 1, section: 1 });
homeworkSchema.index({ teacherId: 1 });

module.exports = mongoose.model('Homework', homeworkSchema);
