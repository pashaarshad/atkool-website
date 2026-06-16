const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    feeName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    className: {
        type: String,
        required: true // e.g. "3", "All"
    },
    dueDate: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
