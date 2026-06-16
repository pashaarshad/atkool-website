const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
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
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    senderType: {
        type: String,
        enum: ['parent', 'teacher'],
        required: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 2000
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for fast chat lookup between a specific student-teacher pair
chatMessageSchema.index({ schoolId: 1, studentId: 1, teacherId: 1, createdAt: -1 });
// Index for unread count queries
chatMessageSchema.index({ teacherId: 1, senderType: 1, isRead: 1 });
chatMessageSchema.index({ studentId: 1, senderType: 1, isRead: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
