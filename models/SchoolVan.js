const mongoose = require('mongoose');

const schoolVanSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    vehicleNumber: {
        type: String,
        required: true
    },
    driverName: {
        type: String,
        required: true
    },
    driverContact: {
        type: String,
        required: true
    },
    routeDetails: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index by schoolId for fast lookups
schoolVanSchema.index({ schoolId: 1 });

module.exports = mongoose.model('SchoolVan', schoolVanSchema);
