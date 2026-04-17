const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    numberOfTeachers: {
        type: Number,
        default: 0
    },
    numberOfStudents: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Pending', 'Cancelled'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

subscriptionSchema.index({ schoolId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
