const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const School = require('../models/School');
const Attendance = require('../models/Attendance');

// Teacher authentication middleware
function teacherAuth(req, res, next) {
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

        req.teacherId = decoded.teacherId;
        req.schoolId = decoded.schoolId;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// Get students for teacher (optionally filtered by class/section)
router.get('/students', teacherAuth, async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacherId);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        const { className, section } = req.query;
        const classAssignments = teacher.classAssignments || [];

        let query = { schoolId: req.schoolId, teacherId: req.teacherId, approvalStatus: 'Approved' };

        // If className and section are provided as query params, filter by them
        if (className && section) {
            query.className = className;
            query.section = section;
        }
        // No class filter needed otherwise — teacherId already scopes to this teacher's students

        const students = await Student.find(query).sort({ rollNo: 1, name: 1 });

        console.log('Student query:', JSON.stringify(query));
        console.log('Students found:', students.length);

        res.json(students);
    } catch (error) {
        console.error('Get teacher students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add student by teacher
router.post('/students', teacherAuth, async (req, res) => {
    try {
        const { name, className, section, rollNo, email, mobileNo, parentName, parentMobile, address } = req.body;

        if (!name || !className) {
            return res.status(400).json({ message: 'Name and class are required' });
        }

        const student = await Student.create({
            schoolId: req.schoolId,
            teacherId: req.teacherId,
            name,
            className,
            section: section || 'A',
            rollNo,
            email,
            mobileNo,
            parentName,
            parentMobile,
            address,
            status: 'Active',
            approvalStatus: 'Pending' // New students start as Pending until admin approves
        });

        // Don't increment school student count - will be done when admin approves

        res.status(201).json({
            ...student.toObject(),
            message: 'Student added and pending approval from school admin'
        });
    } catch (error) {
        console.error('Add student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get teacher's student requests (all statuses - Pending, Approved, Rejected)
router.get('/my-requests', teacherAuth, async (req, res) => {
    try {
        // Get all students added by this teacher, regardless of approval status
        const students = await Student.find({
            teacherId: req.teacherId,
            schoolId: req.schoolId
        }).sort({ createdAt: -1 });

        // Group by approval status
        const pending = students.filter(s => s.approvalStatus === 'Pending');
        const approved = students.filter(s => s.approvalStatus === 'Approved');
        const rejected = students.filter(s => s.approvalStatus === 'Rejected');

        res.json({
            pending,
            approved,
            rejected,
            total: students.length,
            pendingCount: pending.length,
            approvedCount: approved.length,
            rejectedCount: rejected.length
        });
    } catch (error) {
        console.error('Get my requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Generate parent login for student
router.post('/generate-parent-login', teacherAuth, async (req, res) => {
    try {
        const { studentId } = req.body;

        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        const student = await Student.findOne({ _id: studentId, schoolId: req.schoolId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if already has login
        if (student.parentUsername && student.parentPassword) {
            return res.json({
                parentUsername: student.parentUsername,
                parentPassword: student.parentPassword,
                existing: true
            });
        }

        // Generate username based on student name
        const baseName = student.name.toLowerCase().replace(/\s+/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const parentUsername = `${baseName}${randomNum}`;

        // Generate random password
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let parentPassword = '';
        for (let i = 0; i < 8; i++) {
            parentPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Update student with login credentials
        student.parentUsername = parentUsername;
        student.parentPassword = parentPassword;
        await student.save();

        res.json({
            parentUsername,
            parentPassword,
            existing: false
        });
    } catch (error) {
        console.error('Generate parent login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get teachers list (for assignment)
router.get('/list', teacherAuth, async (req, res) => {
    try {
        const teachers = await Teacher.find({ schoolId: req.schoolId })
            .select('name className subject')
            .sort({ name: 1 });
        res.json(teachers);
    } catch (error) {
        console.error('Get teachers list error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit attendance for today
router.post('/attendance', teacherAuth, async (req, res) => {
    try {
        const { attendanceData, date } = req.body;

        if (!attendanceData || !Array.isArray(attendanceData) || attendanceData.length === 0) {
            return res.status(400).json({ message: 'Attendance data is required' });
        }

        const attendanceDate = date ? new Date(date) : new Date();
        // Normalize to start of day
        attendanceDate.setHours(0, 0, 0, 0);

        const results = [];
        for (const item of attendanceData) {
            try {
                // Upsert attendance record
                const result = await Attendance.findOneAndUpdate(
                    {
                        studentId: item.studentId,
                        date: attendanceDate
                    },
                    {
                        schoolId: req.schoolId,
                        teacherId: req.teacherId,
                        studentId: item.studentId,
                        date: attendanceDate,
                        status: item.status,
                        className: item.className,
                        section: item.section
                    },
                    { upsert: true, new: true }
                );
                results.push(result);
            } catch (err) {
                console.error('Error saving attendance for student:', item.studentId, err);
            }
        }

        res.json({
            message: 'Attendance submitted successfully',
            count: results.length,
            date: attendanceDate
        });
    } catch (error) {
        console.error('Submit attendance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get attendance for a date
router.get('/attendance', teacherAuth, async (req, res) => {
    try {
        const { date } = req.query;
        const attendanceDate = date ? new Date(date) : new Date();
        attendanceDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(attendanceDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const attendance = await Attendance.find({
            teacherId: req.teacherId,
            date: { $gte: attendanceDate, $lt: nextDay }
        }).populate('studentId', 'name rollNo className section');

        res.json(attendance);
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

const Event = require('../models/Event');
const Exam = require('../models/Exam');

// Get events for teacher's school
router.get('/events', teacherAuth, async (req, res) => {
    try {
        const events = await Event.find({
            schoolId: req.schoolId,
            eventFor: { $in: ['All', 'Teachers'] },
            status: 'Active'
        }).sort({ createdAt: -1 });

        // Get teacher's read events from localStorage tracking (we'll add a model later if needed)
        // For now, return all events and client will track read status locally
        res.json(events);
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get exams for teacher's school - shows all upcoming exams for the school
router.get('/exams', teacherAuth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all upcoming/scheduled exams for teacher's school
        const exams = await Exam.find({
            schoolId: req.schoolId,
            status: { $in: ['Scheduled', 'Ongoing'] },
            examDate: { $gte: today }
        }).sort({ examDate: 1, startTime: 1 });

        res.json(exams);
    } catch (error) {
        console.error('Get exams error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

const SchoolMessage = require('../models/SchoolMessage');

// Get messages/alerts for teacher
router.get('/messages', teacherAuth, async (req, res) => {
    try {
        // Get messages that are:
        // 1. Sent to All
        // 2. Sent to Teachers
        // 3. Sent to this specific teacher
        const messages = await SchoolMessage.find({
            schoolId: req.schoolId,
            $or: [
                { sendTo: 'All' },
                { sendTo: 'Teachers' },
                { sendTo: 'SpecificTeacher', targetTeacherId: req.teacherId }
            ]
        }).sort({ createdAt: -1 }).limit(50);

        // Add isRead field based on whether teacher is in readBy array
        const messagesWithReadStatus = messages.map(msg => ({
            _id: msg._id,
            heading: msg.heading,
            message: msg.message,
            sendTo: msg.sendTo,
            createdAt: msg.createdAt,
            isRead: msg.readBy.includes(req.teacherId)
        }));

        res.json(messagesWithReadStatus);
    } catch (error) {
        console.error('Get teacher messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark message as read
router.post('/messages/:id/read', teacherAuth, async (req, res) => {
    try {
        const message = await SchoolMessage.findOneAndUpdate(
            {
                _id: req.params.id,
                schoolId: req.schoolId,
                readBy: { $ne: req.teacherId } // Only add if not already in array
            },
            { $addToSet: { readBy: req.teacherId } },
            { new: true }
        );

        if (!message) {
            // Message might already be read or not found
            return res.json({ success: true, alreadyRead: true });
        }

        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        console.error('Mark message read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get unread message count
router.get('/messages/unread-count', teacherAuth, async (req, res) => {
    try {
        const count = await SchoolMessage.countDocuments({
            schoolId: req.schoolId,
            readBy: { $ne: req.teacherId },
            $or: [
                { sendTo: 'All' },
                { sendTo: 'Teachers' },
                { sendTo: 'SpecificTeacher', targetTeacherId: req.teacherId }
            ]
        });

        res.json({ count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

const Subscription = require('../models/Subscription');

// Check subscription status for teacher's school
router.get('/subscription-status', teacherAuth, async (req, res) => {
    try {
        const today = new Date();
        const activeSubscription = await Subscription.findOne({
            schoolId: req.schoolId,
            status: 'Active',
            endDate: { $gte: today }
        });

        if (!activeSubscription) {
            return res.json({
                active: false,
                message: 'No active subscription plan. Please contact your school administrator.'
            });
        }

        res.json({
            active: true,
            subscription: {
                endDate: activeSubscription.endDate,
                dueDate: activeSubscription.dueDate
            }
        });
    } catch (error) {
        console.error('Check subscription error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
