const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SchoolMessage = require('../models/SchoolMessage');

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

router.get('/', schoolAuth, async (req, res) => {
    try {
        const messages = await SchoolMessage.find({ schoolId: req.schoolId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', schoolAuth, async (req, res) => {
    try {
        const { sendTo, heading, message, targetTeacherId } = req.body;

        if (!heading || !message) {
            return res.status(400).json({ message: 'Heading and message are required' });
        }

        if (heading.length > 30) {
            return res.status(400).json({ message: 'Heading must be 30 characters or less' });
        }

        if (message.length > 180) {
            return res.status(400).json({ message: 'Message must be 180 characters or less' });
        }

        // Validate targetTeacherId if sending to specific teacher
        if (sendTo === 'SpecificTeacher' && !targetTeacherId) {
            return res.status(400).json({ message: 'Target teacher is required for specific teacher messages' });
        }

        const newMessage = await SchoolMessage.create({
            schoolId: req.schoolId,
            sendTo: sendTo || 'All',
            heading,
            message,
            targetTeacherId: sendTo === 'SpecificTeacher' ? targetTeacherId : null
        });

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Create message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', schoolAuth, async (req, res) => {
    try {
        const message = await SchoolMessage.findOneAndDelete({
            _id: req.params.id,
            schoolId: req.schoolId
        });

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
