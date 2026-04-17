const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const School = require('../models/School');
const auth = require('../middleware/auth');

// Get all teachers from all schools
router.get('/', auth, async (req, res) => {
    try {
        const { name, school, mobile, status } = req.query;
        let query = {};

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        if (school) {
            query.schoolId = school;
        }
        if (mobile) {
            query.mobileNo = { $regex: mobile, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = status;
        }

        const teachers = await Teacher.find(query)
            .populate('schoolId', 'name city')
            .sort({ createdAt: -1 });

        res.json(teachers);
    } catch (error) {
        console.error('Get all teachers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single teacher
router.get('/:id', auth, async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id)
            .populate('schoolId', 'name city email');

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        res.json(teacher);
    } catch (error) {
        console.error('Get teacher error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all schools for dropdown
router.get('/schools/list', auth, async (req, res) => {
    try {
        const schools = await School.find().select('_id name city').sort({ name: 1 });
        res.json(schools);
    } catch (error) {
        console.error('Get schools error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark teacher as On Leave or restore to Active
router.put('/:id/mark-leave', auth, async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        const newStatus = teacher.status === 'On Leave' ? 'Active' : 'On Leave';
        teacher.status = newStatus;
        await teacher.save();

        res.json({
            message: newStatus === 'On Leave' ? 'Teacher marked as On Leave' : 'Teacher marked as Active',
            status: newStatus
        });
    } catch (error) {
        console.error('Mark leave error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset device lock for a teacher
router.put('/:id/reset-device', auth, async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Clear device lock
        teacher.deviceId = null;
        teacher.deviceName = null;
        teacher.deviceLockedAt = null;
        await teacher.save();

        res.json({ message: 'Device reset successfully. Teacher can now login from any device.' });
    } catch (error) {
        console.error('Reset device error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
