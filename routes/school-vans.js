const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SchoolVan = require('../models/SchoolVan');
const School = require('../models/School');

// School / Principal authentication middleware
function schoolAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_admin_secret_key_2024');

        if (decoded.type === 'school') {
            req.schoolId = decoded.schoolId;
            req.userRole = 'school_admin';
            next();
        } else if (decoded.type === 'teacher') {
            req.schoolId = decoded.schoolId;
            req.userRole = decoded.role === 'Principal' ? 'principal' : 'teacher';
            
            // Restrict write operations (POST, PUT, DELETE) to Principal role only for teachers
            if (req.method !== 'GET' && decoded.role !== 'Principal') {
                return res.status(403).json({ message: 'Access denied: Principal permissions required' });
            }
            next();
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// Get all vans for a school
router.get('/', schoolAuth, async (req, res) => {
    try {
        const vans = await SchoolVan.find({ schoolId: req.schoolId }).sort({ createdAt: -1 });
        res.json(vans);
    } catch (error) {
        console.error('Get school vans error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single van details
router.get('/:id', schoolAuth, async (req, res) => {
    try {
        const van = await SchoolVan.findOne({ _id: req.params.id, schoolId: req.schoolId });
        if (!van) {
            return res.status(404).json({ message: 'School van not found' });
        }
        res.json(van);
    } catch (error) {
        console.error('Get school van error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a new van
router.post('/', schoolAuth, async (req, res) => {
    try {
        const { vehicleNumber, driverName, driverContact, routeDetails } = req.body;

        if (!vehicleNumber || !driverName || !driverContact) {
            return res.status(400).json({ message: 'Vehicle number, driver name, and driver contact number are required' });
        }

        const newVan = await SchoolVan.create({
            schoolId: req.schoolId,
            vehicleNumber,
            driverName,
            driverContact,
            routeDetails
        });

        res.status(201).json(newVan);
    } catch (error) {
        console.error('Create school van error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update van details
router.put('/:id', schoolAuth, async (req, res) => {
    try {
        const { vehicleNumber, driverName, driverContact, routeDetails } = req.body;

        const van = await SchoolVan.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.schoolId },
            { vehicleNumber, driverName, driverContact, routeDetails },
            { new: true, runValidators: true }
        );

        if (!van) {
            return res.status(404).json({ message: 'School van not found' });
        }

        res.json(van);
    } catch (error) {
        console.error('Update school van error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a van
router.delete('/:id', schoolAuth, async (req, res) => {
    try {
        // Find and delete the van
        const van = await SchoolVan.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });

        if (!van) {
            return res.status(404).json({ message: 'School van not found' });
        }

        // Dissociate from students who were assigned to this van
        const Student = require('../models/Student');
        await Student.updateMany({ vanId: req.params.id }, { $set: { vanId: null, pickupPoint: '' } });

        res.json({ message: 'School van deleted successfully and students unassigned' });
    } catch (error) {
        console.error('Delete school van error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
