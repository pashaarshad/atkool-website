const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// School auth middleware
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

// Get messages for specific school (requires school auth)
router.get('/for-my-school', schoolAuth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sendTo: 'All' },
                { sendTo: 'Schools' },
                { targetSchoolId: req.schoolId }
            ]
        }).sort({ createdAt: -1 }).limit(20);

        // Add isRead flag for this school
        const messagesWithReadStatus = messages.map(msg => {
            const msgObj = msg.toObject();
            msgObj.isRead = msg.readBy && msg.readBy.some(r => r.schoolId && r.schoolId.toString() === req.schoolId.toString());
            return msgObj;
        });

        res.json(messagesWithReadStatus);
    } catch (error) {
        console.error('Get school messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark message as read by school
router.post('/mark-read/:messageId', schoolAuth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if already read by this school
        const alreadyRead = message.readBy && message.readBy.some(
            r => r.schoolId && r.schoolId.toString() === req.schoolId.toString()
        );

        if (!alreadyRead) {
            message.readBy = message.readBy || [];
            message.readBy.push({ schoolId: req.schoolId, readAt: new Date() });
            await message.save();
        }

        res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        console.error('Mark message read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Public endpoint for schools to get messages (fallback) - MUST be before /:id
router.get('/for-schools', async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sendTo: 'All' },
                { sendTo: 'Schools' }
            ]
        }).sort({ createdAt: -1 }).limit(20);
        res.json(messages);
    } catch (error) {
        console.error('Get school messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get messages for specific school (public)
router.get('/for-school/:schoolId', async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sendTo: 'All' },
                { sendTo: 'Schools' },
                { targetSchoolId: req.params.schoolId }
            ]
        }).sort({ createdAt: -1 }).limit(20);
        res.json(messages);
    } catch (error) {
        console.error('Get school specific messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.json(message);
    } catch (error) {
        console.error('Get message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { sendTo, heading, message, targetSchoolId, targetSchoolName } = req.body;

        if (!heading || !message) {
            return res.status(400).json({ message: 'Heading and message are required' });
        }

        if (heading.length > 30) {
            return res.status(400).json({ message: 'Heading must be 30 characters or less' });
        }

        if (message.length > 180) {
            return res.status(400).json({ message: 'Message must be 180 characters or less' });
        }

        const messageData = {
            sendTo: sendTo || 'Schools',
            heading,
            message
        };

        // If sending to specific school
        if (targetSchoolId) {
            messageData.targetSchoolId = targetSchoolId;
            messageData.targetSchoolName = targetSchoolName || '';
        }

        const newMessage = await Message.create(messageData);

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Create message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const message = await Message.findByIdAndDelete(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
