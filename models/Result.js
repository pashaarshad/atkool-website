const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    marksObtained: {
        type: Number,
        required: true
    },
    maxMarks: {
        type: Number,
        required: true,
        default: 100
    },
    grade: {
        type: String,
        default: ''
    },
    remarks: {
        type: String,
        default: ''
    },
    academicYear: {
        type: String,
        default: '2026-2027'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

resultSchema.index({ schoolId: 1 });
resultSchema.index({ studentId: 1 });
resultSchema.index({ examId: 1 });
resultSchema.index({ studentId: 1, examId: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
