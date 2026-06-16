const mongoose = require('mongoose');

const homeworkSubmissionSchema = new mongoose.Schema({
    homeworkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Homework',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    content: {
        type: String,
        required: true
    },
    attachments: [String], // Array of base64 strings
    grade: {
        type: String,
        default: ''
    },
    feedback: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Submitted', 'Graded'],
        default: 'Submitted'
    }
});

homeworkSubmissionSchema.index({ homeworkId: 1 });
homeworkSubmissionSchema.index({ studentId: 1 });
homeworkSubmissionSchema.index({ homeworkId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);
