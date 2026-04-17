const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const School = require('../models/School');
const Subscription = require('../models/Subscription');

// Teacher Login
router.post('/login', async (req, res) => {
    try {
        const { email, password, deviceId, deviceName } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const teacher = await Teacher.findOne({
            email: { $regex: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
        });

        if (!teacher) {
            return res.status(401).json({ message: 'No teacher found with this email' });
        }

        if (!teacher.password || teacher.password === '') {
            return res.status(401).json({ message: 'Password not set. Please contact school admin.' });
        }

        const isMatch = await bcrypt.compare(password, teacher.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Block login if teacher is on leave
        if (teacher.status === 'On Leave') {
            return res.status(403).json({
                message: 'Your account is currently on leave. Please contact your school administrator.',
                onLeave: true
            });
        }

        // Device lock check
        if (teacher.deviceId && deviceId && teacher.deviceId !== deviceId) {
            return res.status(403).json({
                message: 'This account is already logged in on another device. Please contact admin to reset device.',
                deviceLocked: true
            });
        }

        // Save device info if provided
        if (deviceId) {
            teacher.deviceId = deviceId;
            teacher.deviceName = deviceName || 'Unknown Device';
            teacher.deviceLockedAt = new Date();
            await teacher.save();
        }

        // Check for active subscription
        const today = new Date();
        const activeSubscription = await Subscription.findOne({
            schoolId: teacher.schoolId,
            status: 'Active',
            endDate: { $gte: today }
        });

        if (!activeSubscription) {
            return res.status(403).json({
                message: 'No active subscription plan. Please contact your school administrator.',
                subscriptionRequired: true
            });
        }

        // Get school info
        const school = await School.findById(teacher.schoolId);

        const token = jwt.sign(
            { teacherId: teacher._id, schoolId: teacher.schoolId, email: teacher.email, type: 'teacher' },
            process.env.JWT_SECRET || 'super_admin_secret_key_2024',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            teacher: {
                id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                mobileNo: teacher.mobileNo,
                className: teacher.className,
                classAssignments: teacher.classAssignments || [],
                subject: teacher.subject
            },
            school: school ? {
                id: school._id,
                name: school.name,
                logo: school.logo
            } : null
        });
    } catch (error) {
        console.error('Teacher login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Teacher Profile
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_admin_secret_key_2024');

        if (decoded.type !== 'teacher') {
            return res.status(401).json({ message: 'Invalid token type' });
        }

        const teacher = await Teacher.findById(decoded.teacherId);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        const school = await School.findById(teacher.schoolId);

        console.log('Teacher classAssignments:', teacher.classAssignments);

        res.json({
            id: teacher._id,
            name: teacher.name,
            email: teacher.email,
            mobileNo: teacher.mobileNo,
            className: teacher.className,
            classAssignments: teacher.classAssignments || [],
            subject: teacher.subject,
            status: teacher.status,
            school: school ? {
                id: school._id,
                name: school.name,
                logo: school.logo
            } : null
        });
    } catch (error) {
        console.error('Get teacher profile error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router;
