const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const School = require('../models/School');

// Parent Login (using student's parentUsername and parentPassword)
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const student = await Student.findOne({
            parentUsername: { $regex: new RegExp('^' + username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
        });

        if (!student) {
            return res.status(401).json({ message: 'Invalid username' });
        }

        if (!student.parentPassword || student.parentPassword === '') {
            return res.status(401).json({ message: 'Password not set. Please contact teacher.' });
        }

        if (student.parentPassword !== password) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Get school info
        const school = await School.findById(student.schoolId);

        const token = jwt.sign(
            { studentId: student._id, schoolId: student.schoolId, username: student.parentUsername, type: 'parent' },
            process.env.JWT_SECRET || 'super_admin_secret_key_2024',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            student: {
                id: student._id,
                name: student.name,
                rollNo: student.rollNo,
                className: student.className,
                section: student.section,
                parentName: student.parentName,
                status: student.status || 'Active'
            },
            school: school ? {
                id: school._id,
                name: school.name,
                logo: school.logo
            } : null
        });
    } catch (error) {
        console.error('Parent login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Parent/Student Profile
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_admin_secret_key_2024');

        if (decoded.type !== 'parent') {
            return res.status(401).json({ message: 'Invalid token type' });
        }

        const student = await Student.findById(decoded.studentId).populate('teacherId', 'name');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const school = await School.findById(student.schoolId);

        res.json({
            id: student._id,
            name: student.name,
            rollNo: student.rollNo,
            className: student.className,
            section: student.section,
            email: student.email,
            mobileNo: student.mobileNo,
            parentName: student.parentName,
            parentMobile: student.parentMobile,
            status: student.status,
            teacher: student.teacherId ? {
                id: student.teacherId._id,
                name: student.teacherId.name
            } : null,
            school: school ? {
                id: school._id,
                name: school.name,
                logo: school.logo
            } : null
        });
    } catch (error) {
        console.error('Get parent profile error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

const Attendance = require('../models/Attendance');

// Parent auth middleware
function parentAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_admin_secret_key_2024');

        if (decoded.type !== 'parent') {
            return res.status(401).json({ message: 'Invalid token type' });
        }

        req.studentId = decoded.studentId;
        req.schoolId = decoded.schoolId;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// Get child's attendance records
router.get('/attendance', parentAuth, async (req, res) => {
    try {
        const { month, year } = req.query;

        let query = { studentId: req.studentId };

        // Filter by month/year if provided
        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0);
            query.date = { $gte: startDate, $lte: endDate };
        } else {
            // Default: last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            query.date = { $gte: thirtyDaysAgo };
        }

        const attendance = await Attendance.find(query)
            .sort({ date: -1 })
            .limit(100);

        // Calculate stats
        const totalDays = attendance.length;
        const presentDays = attendance.filter(a => a.status === 'present').length;
        const absentDays = attendance.filter(a => a.status === 'absent').length;
        const lateDays = attendance.filter(a => a.status === 'late').length;

        res.json({
            records: attendance.map(a => ({
                date: a.date,
                status: a.status,
                remarks: a.remarks || ''
            })),
            stats: {
                total: totalDays,
                present: presentDays,
                absent: absentDays,
                late: lateDays,
                percentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
            }
        });
    } catch (error) {
        console.error('Get parent attendance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
