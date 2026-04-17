const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sendTo: {
        type: String,
        enum: ['All', 'Schools', 'Users', 'Teachers', 'Students', 'SpecificSchool'],
        default: 'Schools'
    },
    targetSchoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        default: null
    },
    targetSchoolName: {
        type: String,
        default: ''
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
    status: {
        type: String,
        enum: ['Sent', 'Pending', 'Failed'],
        default: 'Sent'
    },
    readBy: [{
        schoolId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'School'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);
