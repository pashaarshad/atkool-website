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

function schoolAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_admin_secret_key_2024');
        if (decoded.type !== 'school') {
            return res.status(401).json({ message: 'Invalid token type' });
        }
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
                    messageType: lastMessage.messageType || 'text',
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
// Get all parent's chat partners (teachers of their student's class/section)
router.get('/parent/conversations', parentAuth, async (req, res) => {
    try {
        const student = await Student.findById(req.studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        let teachers = await Teacher.find({
            schoolId: req.schoolId,
            status: { $ne: 'Inactive' }
        }).select('name email mobileNo subject photo className classAssignments isClassTeacher classTeacherFor');

        if (teachers.length === 0) {
            return res.json({ conversations: [], message: 'No active teachers found in the school.' });
        }

        // Map teachers to conversation objects with last message and unread count
        const conversations = await Promise.all(teachers.map(async (teacher) => {
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

            return {
                teacher: {
                    _id: teacher._id,
                    name: teacher.name,
                    subject: teacher.subject,
                    photo: teacher.photo,
                    isClassTeacher: teacher.isClassTeacher && 
                                     teacher.classTeacherFor && 
                                     teacher.classTeacherFor.className === student.className && 
                                     teacher.classTeacherFor.section === (student.section || 'A')
                },
                lastMessage: lastMessage ? {
                    message: lastMessage.message,
                    messageType: lastMessage.messageType || 'text',
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

        res.json({ conversations });
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

// System/School Admin sends a chat message automatically (e.g., fee receipts)
router.post('/system/send', schoolAuth, async (req, res) => {
    try {
        const { studentId, message, messageType } = req.body;

        if (!studentId || !message) {
            return res.status(400).json({ message: 'Student ID and message are required' });
        }

        // Find student and get their assigned teacher
        const student = await Student.findOne({ _id: studentId, schoolId: req.schoolId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Use assigned teacherId, or find the first active teacher in the school
        let teacherId = student.teacherId;
        if (!teacherId) {
            const activeTeacher = await Teacher.findOne({ schoolId: req.schoolId, status: 'Active' });
            if (!activeTeacher) {
                return res.status(400).json({ message: 'No active teacher found in the school to send the chat message' });
            }
            teacherId = activeTeacher._id;
        }

        const chatMessage = await ChatMessage.create({
            schoolId: req.schoolId,
            studentId: studentId,
            teacherId: teacherId,
            senderType: 'teacher',
            message: message,
            messageType: messageType || 'image'
        });

        res.status(201).json(chatMessage);
    } catch (error) {
        console.error('System send chat message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============ UNIVERSAL CHAT ENDPOINTS ============

function universalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_admin_secret_key_2024');
        req.userId = decoded.type === 'teacher' ? decoded.teacherId : decoded.studentId;
        req.userType = decoded.type; // 'teacher' or 'parent'
        req.schoolId = decoded.schoolId;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// Get all possible contacts in the school
router.get('/universal/contacts', universalAuth, async (req, res) => {
    try {
        let teachers = await Teacher.find({
            schoolId: req.schoolId,
            status: { $ne: 'Inactive' }
        }).select('name email mobileNo subject photo className');

        let students = await Student.find({
            schoolId: req.schoolId,
            approvalStatus: 'Approved'
        }).select('name className section parentName parentMobile photo');

        // Exclude current user from their respective list
        if (req.userType === 'teacher') {
            teachers = teachers.filter(t => t._id.toString() !== req.userId.toString());
        } else {
            students = students.filter(s => s._id.toString() !== req.userId.toString());
        }

        const teacherContacts = teachers.map(t => ({
            id: t._id,
            name: t.name,
            type: 'teacher',
            details: t.subject ? `${t.subject} Teacher` : 'Teacher',
            photo: t.photo
        }));

        const studentContacts = students.map(s => ({
            id: s._id,
            name: s.name,
            type: 'student',
            details: `Parent: ${s.parentName || 'N/A'} • Class ${s.className}-${s.section}`,
            photo: s.photo
        }));

        res.json({ success: true, data: [...teacherContacts, ...studentContacts] });
    } catch (error) {
        console.error('Get universal contacts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all universal conversations for the user
router.get('/universal/conversations', universalAuth, async (req, res) => {
    try {
        const messages = await ChatMessage.find({
            schoolId: req.schoolId,
            $or: [
                { senderId: req.userId },
                { receiverId: req.userId }
            ]
        }).sort({ createdAt: -1 });

        const partners = {};
        messages.forEach(msg => {
            if (!msg.senderId || !msg.receiverId) return;
            const partnerId = msg.senderId.toString() === req.userId.toString()
                ? msg.receiverId.toString()
                : msg.senderId.toString();
            if (!partners[partnerId]) {
                partners[partnerId] = {
                    lastMessage: msg,
                    unreadCount: 0
                };
            }
            if (msg.receiverId.toString() === req.userId.toString() && !msg.isRead) {
                partners[partnerId].unreadCount += 1;
            }
        });

        const conversations = await Promise.all(Object.keys(partners).map(async (partnerId) => {
            const details = partners[partnerId];
            let partner = await Teacher.findById(partnerId).select('name subject photo');
            let partnerType = 'teacher';
            if (!partner) {
                partner = await Student.findById(partnerId).select('name className section parentName photo');
                partnerType = 'student';
            }

            if (!partner) return null;

            return {
                partner: {
                    id: partner._id,
                    name: partner.name,
                    type: partnerType,
                    details: partnerType === 'teacher'
                        ? (partner.subject ? `${partner.subject} Teacher` : 'Teacher')
                        : `Parent: ${partner.parentName || 'N/A'} • Class ${partner.className}-${partner.section}`,
                    photo: partner.photo
                },
                lastMessage: {
                    message: details.lastMessage.message,
                    messageType: details.lastMessage.messageType || 'text',
                    senderId: details.lastMessage.senderId,
                    createdAt: details.lastMessage.createdAt
                },
                unreadCount: details.unreadCount
            };
        }));

        const filteredConversations = conversations.filter(c => c !== null);
        filteredConversations.sort((a, b) => {
            if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
            if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });

        res.json({ success: true, data: filteredConversations });
    } catch (error) {
        console.error('Get universal conversations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get messages between user and partnerId
router.get('/universal/messages/:partnerId', universalAuth, async (req, res) => {
    try {
        const { partnerId } = req.params;
        const messages = await ChatMessage.find({
            schoolId: req.schoolId,
            $or: [
                { senderId: req.userId, receiverId: partnerId },
                { senderId: partnerId, receiverId: req.userId }
            ]
        }).sort({ createdAt: 1 });

        // Mark received messages as read
        await ChatMessage.updateMany(
            {
                schoolId: req.schoolId,
                senderId: partnerId,
                receiverId: req.userId,
                isRead: false
            },
            { isRead: true, readAt: new Date() }
        );

        res.json({ success: true, data: messages });
    } catch (error) {
        console.error('Get universal messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send a universal message
router.post('/universal/send', universalAuth, async (req, res) => {
    try {
        const { receiverId, message, messageType } = req.body;
        if (!receiverId || !message) {
            return res.status(400).json({ message: 'Receiver ID and message are required' });
        }

        let receiverType = 'parent';
        let receiver = await Teacher.findById(receiverId);
        if (receiver) {
            receiverType = 'teacher';
        } else {
            receiver = await Student.findById(receiverId);
            if (!receiver) {
                return res.status(404).json({ message: 'Receiver not found' });
            }
        }

        // Setup legacy fields for old app/web compat
        let teacherId = null;
        let studentId = null;
        if (req.userType === 'teacher') {
            teacherId = req.userId;
            if (receiverType === 'parent') {
                studentId = receiverId;
            }
        } else {
            studentId = req.userId;
            if (receiverType === 'teacher') {
                teacherId = receiverId;
            }
        }

        const chatMessage = await ChatMessage.create({
            schoolId: req.schoolId,
            senderId: req.userId,
            senderType: req.userType,
            receiverId,
            receiverType,
            teacherId,
            studentId,
            message: message.trim(),
            messageType: messageType || 'text'
        });

        res.status(201).json({ success: true, data: chatMessage });
    } catch (error) {
        console.error('Universal send message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
