const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const ChatMessage = require('../models/ChatMessage');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// ============ AUTH MIDDLEWARE ============

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

// ============ TEACHER CHAT ENDPOINTS ============

// Get all conversations for teacher (list of students they can chat with)
router.get('/teacher/conversations', teacherAuth, async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacherId);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Get all assigned classes
        const classes = [];
        if (teacher.classAssignments && teacher.classAssignments.length > 0) {
            teacher.classAssignments.forEach(c => {
                classes.push({ className: c.className, section: c.section });
            });
        }
        if (teacher.isClassTeacher && teacher.classTeacherFor && teacher.classTeacherFor.className) {
            const exists = classes.some(c => c.className === teacher.classTeacherFor.className && c.section === teacher.classTeacherFor.section);
            if (!exists) {
                classes.push({
                    className: teacher.classTeacherFor.className,
                    section: teacher.classTeacherFor.section
                });
            }
        }

        if (classes.length === 0) {
            return res.json([]);
        }

        // Find all approved students in teacher's classes
        const students = await Student.find({
            schoolId: req.schoolId,
            approvalStatus: 'Approved',
            $or: classes.map(c => ({ className: c.className, section: c.section }))
        }).select('name className section parentName parentMobile photo').sort({ className: 1, section: 1, name: 1 });

        // Get last message and unread count for each student
        const conversations = await Promise.all(students.map(async (student) => {
            const lastMessage = await ChatMessage.findOne({
                schoolId: req.schoolId,
                studentId: student._id,
                teacherId: req.teacherId
            }).sort({ createdAt: -1 });

            const unreadCount = await ChatMessage.countDocuments({
                schoolId: req.schoolId,
                studentId: student._id,
                teacherId: req.teacherId,
                senderType: 'parent',
                isRead: false
            });

            return {
                student: {
                    _id: student._id,
                    name: student.name,
                    className: student.className,
                    section: student.section,
                    parentName: student.parentName,
                    photo: student.photo
                },
                lastMessage: lastMessage ? {
                    message: lastMessage.message,
                    senderType: lastMessage.senderType,
                    createdAt: lastMessage.createdAt
                } : null,
                unreadCount
            };
        }));

        // Sort: conversations with unread first, then by last message time
        conversations.sort((a, b) => {
            if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
            if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
            const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return bTime - aTime;
        });

        res.json(conversations);
    } catch (error) {
        console.error('Get teacher conversations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get chat messages between teacher and a specific student's parent
router.get('/teacher/messages/:studentId', teacherAuth, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const messages = await ChatMessage.find({
            schoolId: req.schoolId,
            studentId: studentId,
            teacherId: req.teacherId
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

        // Mark all parent messages as read
        await ChatMessage.updateMany(
            {
                schoolId: req.schoolId,
                studentId: studentId,
                teacherId: req.teacherId,
                senderType: 'parent',
                isRead: false
            },
            { isRead: true, readAt: new Date() }
        );

        // Return in chronological order
        res.json(messages.reverse());
    } catch (error) {
        console.error('Get teacher messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Teacher sends a message to a student's parent
router.post('/teacher/send', teacherAuth, async (req, res) => {
    try {
        const { studentId, message, messageType } = req.body;

        if (!studentId || !message) {
            return res.status(400).json({ message: 'Student ID and message are required' });
        }

        // Verify student belongs to teacher's school
        const student = await Student.findOne({ _id: studentId, schoolId: req.schoolId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const chatMessage = await ChatMessage.create({
            schoolId: req.schoolId,
            studentId: studentId,
            teacherId: req.teacherId,
            senderType: 'teacher',
            message: message.trim(),
            messageType: messageType || 'text'
        });

        res.status(201).json(chatMessage);
    } catch (error) {
        console.error('Teacher send message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get total unread count for teacher (badge number)
router.get('/teacher/unread-count', teacherAuth, async (req, res) => {
    try {
        const count = await ChatMessage.countDocuments({
            teacherId: req.teacherId,
            senderType: 'parent',
            isRead: false
        });
        res.json({ count });
    } catch (error) {
        console.error('Get teacher unread count error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============ PARENT CHAT ENDPOINTS ============

// Get parent's chat partner (their class teacher)
router.get('/parent/conversations', parentAuth, async (req, res) => {
    try {
        const student = await Student.findById(req.studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Find the class teacher for this student's class
        let teacher = null;

        // First try: find by teacherId reference on student
        if (student.teacherId) {
            teacher = await Teacher.findById(student.teacherId).select('name email mobileNo subject photo className classAssignments');
        }

        // Second try: find by classTeacherFor matching student's class and section
        if (!teacher) {
            teacher = await Teacher.findOne({
                schoolId: req.schoolId,
                isClassTeacher: true,
                'classTeacherFor.className': student.className,
                'classTeacherFor.section': student.section || 'A'
            }).select('name email mobileNo subject photo className classAssignments');
        }

        // Third try: find any teacher assigned to student's class and section
        if (!teacher) {
            teacher = await Teacher.findOne({
                schoolId: req.schoolId,
                'classAssignments': {
                    $elemMatch: {
                        className: student.className,
                        section: student.section || 'A'
                    }
                }
            }).select('name email mobileNo subject photo className classAssignments');
        }

        // Fourth try: find class teacher matching student's class (ignore section)
        if (!teacher) {
            teacher = await Teacher.findOne({
                schoolId: req.schoolId,
                isClassTeacher: true,
                'classTeacherFor.className': student.className
            }).select('name email mobileNo subject photo className classAssignments');
        }

        // Fifth try: find any teacher assigned to student's class (ignore section)
        if (!teacher) {
            teacher = await Teacher.findOne({
                schoolId: req.schoolId,
                'classAssignments.className': student.className
            }).select('name email mobileNo subject photo className classAssignments');
        }

        // Sixth try: fallback to any active teacher in the school
        if (!teacher) {
            teacher = await Teacher.findOne({
                schoolId: req.schoolId,
                status: 'Active'
            }).select('name email mobileNo subject photo className classAssignments');
        }

        // Seventh try: fallback to any teacher in the school
        if (!teacher) {
            teacher = await Teacher.findOne({
                schoolId: req.schoolId
            }).select('name email mobileNo subject photo className classAssignments');
        }

        if (!teacher) {
            return res.json({ conversations: [], message: 'No teacher assigned to your class yet.' });
        }

        // Get last message and unread count
        const lastMessage = await ChatMessage.findOne({
            schoolId: req.schoolId,
            studentId: req.studentId,
            teacherId: teacher._id
        }).sort({ createdAt: -1 });

        const unreadCount = await ChatMessage.countDocuments({
            schoolId: req.schoolId,
            studentId: req.studentId,
            teacherId: teacher._id,
            senderType: 'teacher',
            isRead: false
        });

        res.json({
            conversations: [{
                teacher: {
                    _id: teacher._id,
                    name: teacher.name,
                    subject: teacher.subject,
                    photo: teacher.photo
                },
                lastMessage: lastMessage ? {
                    message: lastMessage.message,
                    senderType: lastMessage.senderType,
                    createdAt: lastMessage.createdAt
                } : null,
                unreadCount
            }]
        });
    } catch (error) {
        console.error('Get parent conversations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get chat messages between parent and their teacher
router.get('/parent/messages', parentAuth, async (req, res) => {
    try {
        const { teacherId, page = 1, limit = 50 } = req.query;

        if (!teacherId) {
            return res.status(400).json({ message: 'Teacher ID is required' });
        }

        const messages = await ChatMessage.find({
            schoolId: req.schoolId,
            studentId: req.studentId,
            teacherId: teacherId
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

        // Mark all teacher messages as read
        await ChatMessage.updateMany(
            {
                schoolId: req.schoolId,
                studentId: req.studentId,
                teacherId: teacherId,
                senderType: 'teacher',
                isRead: false
            },
            { isRead: true, readAt: new Date() }
        );

        // Return in chronological order
        res.json(messages.reverse());
    } catch (error) {
        console.error('Get parent messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Parent sends a message to teacher
router.post('/parent/send', parentAuth, async (req, res) => {
    try {
        const { teacherId, message, messageType } = req.body;

        if (!teacherId || !message) {
            return res.status(400).json({ message: 'Teacher ID and message are required' });
        }

        // Verify teacher exists in same school
        const teacher = await Teacher.findOne({ _id: teacherId, schoolId: req.schoolId });
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        const chatMessage = await ChatMessage.create({
            schoolId: req.schoolId,
            studentId: req.studentId,
            teacherId: teacherId,
            senderType: 'parent',
            message: message.trim(),
            messageType: messageType || 'text'
        });

        res.status(201).json(chatMessage);
    } catch (error) {
        console.error('Parent send message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get total unread count for parent (badge number)
router.get('/parent/unread-count', parentAuth, async (req, res) => {
    try {
        const count = await ChatMessage.countDocuments({
            studentId: req.studentId,
            senderType: 'teacher',
            isRead: false
        });
        res.json({ count });
    } catch (error) {
        console.error('Get parent unread count error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
