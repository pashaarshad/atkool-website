const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const School = require('../models/School');
const { sendVerificationEmail } = require('../utils/emailService');

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
            next();
        } else if (decoded.type === 'teacher' && decoded.role === 'Principal') {
            req.schoolId = decoded.schoolId;
            next();
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

function getBaseUrl(req) {
    return process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

router.get('/', schoolAuth, async (req, res) => {
    try {
        const { name, id, mobileNo } = req.query;
        let query = { schoolId: req.schoolId };

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        if (id) {
            query._id = id;
        }
        if (mobileNo) {
            query.mobileNo = { $regex: mobileNo, $options: 'i' };
        }

        const teachers = await Teacher.find(query).sort({ createdAt: -1 });
        res.json(teachers);
    } catch (error) {
        console.error('Get teachers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', schoolAuth, async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ _id: req.params.id, schoolId: req.schoolId });
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        res.json(teacher);
    } catch (error) {
        console.error('Get teacher error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', schoolAuth, async (req, res) => {
    try {
        const { name, email, mobileNo, className, classAssignments, subject, students, status, salary, address, photo, password, role, isClassTeacher, classTeacherFor } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Teacher name is required' });
        }

        const teacherData = {
            schoolId: req.schoolId,
            name,
            email,
            mobileNo,
            className,
            classAssignments: classAssignments || [],
            subject,
            students: students || 0,
            status: status || 'Active',
            salary: salary || 0,
            address,
            photo,
            role: role || 'Teacher',
            isClassTeacher: isClassTeacher || false,
            classTeacherFor: classTeacherFor || null,
            isEmailVerified: !email
        };

        // Hash password if provided
        if (password) {
            teacherData.password = await bcrypt.hash(password, 10);
        }

        const teacher = await Teacher.create(teacherData);

        let verification = null;
        if (teacher.email) {
            verification = await sendVerificationEmail(teacher, 'teacher', { baseUrl: getBaseUrl(req) });
        }

        await School.findByIdAndUpdate(req.schoolId, { $inc: { teachers: 1 } });

        res.status(201).json({
            teacher,
            verification: verification ? {
                email: verification.email,
                linkGenerated: true
            } : {
                linkGenerated: false
            }
        });
    } catch (error) {
        console.error('Create teacher error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id/reset-device', schoolAuth, async (req, res) => {
    try {
        const teacher = await Teacher.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.schoolId },
            { $unset: { deviceId: 1, deviceName: 1 } },
            { new: true }
        );

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        res.json({ message: 'Device reset successfully' });
    } catch (error) {
        console.error('Reset device error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id/mark-leave', schoolAuth, async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ _id: req.params.id, schoolId: req.schoolId });

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

router.put('/:id', schoolAuth, async (req, res) => {
    try {
        const { name, email, password, mobileNo, className, classAssignments, subject, students, status, salary, address, photo, role, isClassTeacher, classTeacherFor } = req.body;

        const existingTeacher = await Teacher.findOne({ _id: req.params.id, schoolId: req.schoolId });
        if (!existingTeacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        const updateData = { name, email, mobileNo, className, classAssignments: classAssignments || [], subject, students, status, salary, address, photo, role, isClassTeacher, classTeacherFor };
        const emailChanged = email && email !== existingTeacher.email;
        if (emailChanged) {
            updateData.isEmailVerified = false;
        }

        // Hash password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const teacher = await Teacher.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.schoolId },
            updateData,
            { new: true, runValidators: true }
        );

        let verification = null;
        if (emailChanged) {
            verification = await sendVerificationEmail(teacher, 'teacher', { baseUrl: getBaseUrl(req) });
        }

        res.json({
            teacher,
            verification: verification ? {
                email: verification.email,
                linkGenerated: true
            } : {
                linkGenerated: false
            }
        });
    } catch (error) {
        console.error('Update teacher error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', schoolAuth, async (req, res) => {
    try {
        const teacher = await Teacher.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        await School.findByIdAndUpdate(req.schoolId, { $inc: { teachers: -1 } });

        res.json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        console.error('Delete teacher error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
