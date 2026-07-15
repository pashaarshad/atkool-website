const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    receiverType: {
        type: String,
        enum: ['parent', 'teacher'],
        required: true
    },
    senderType: {
        type: String,
        enum: ['parent', 'teacher'],
        required: true
    },
    message: {
        type: String,
        required: true
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
// Indexes for universal chat
chatMessageSchema.index({ schoolId: 1, senderId: 1, receiverId: 1, createdAt: -1 });
chatMessageSchema.index({ receiverId: 1, isRead: 1 });

// Pre-validate hook for backward compatibility
chatMessageSchema.pre('validate', function(next) {
    if (!this.senderId) {
        if (this.senderType === 'teacher') {
            this.senderId = this.teacherId;
            this.receiverId = this.studentId;
            this.receiverType = 'parent';
        } else if (this.senderType === 'parent') {
            this.senderId = this.studentId;
            this.receiverId = this.teacherId;
            this.receiverType = 'teacher';
        }
    }
    next();
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
