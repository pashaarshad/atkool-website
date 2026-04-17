const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SupportTicket = require('../models/SupportTicket');
const School = require('../models/School');

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

function adminAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_admin_secret_key_2024');

        // Admin tokens have 'id' and 'role', not 'type'
        if (!decoded.id || !decoded.role) {
            return res.status(401).json({ message: 'Admin access required' });
        }

        req.adminId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// Get support contact info
router.get('/contact', (req, res) => {
    res.json({
        phones: ['+91 4985754785', '+91 4985754785'],
        email: 'support.ams@gmail.com',
        address: 'Rana tower, Jina Maharashtra, India',
        instagram: '@ATTENDANCEMANAGMENT',
        facebook: '@ATTENDANCEMANAGMENT'
    });
});

// Get all tickets for school
router.get('/tickets', schoolAuth, async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ schoolId: req.schoolId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(tickets);
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new support ticket
router.post('/tickets', schoolAuth, async (req, res) => {
    try {
        const { subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ message: 'Subject and message are required' });
        }

        const newTicket = await SupportTicket.create({
            schoolId: req.schoolId,
            subject,
            message
        });

        res.status(201).json(newTicket);
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Super Admin - Get all tickets
router.get('/admin/tickets', adminAuth, async (req, res) => {
    try {
        const tickets = await SupportTicket.find()
            .populate('schoolId', 'name email')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(tickets);
    } catch (error) {
        console.error('Get all tickets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Super Admin - Update ticket status and/or reply
router.put('/admin/tickets/:id', adminAuth, async (req, res) => {
    try {
        const { status, reply } = req.body;
        const updateData = {};

        if (status) {
            if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }
            updateData.status = status;
        }

        if (reply !== undefined) {
            updateData.reply = reply;
            updateData.repliedAt = new Date();
            updateData.isReadBySchool = false;
        }

        const ticket = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('schoolId', 'name email');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        console.error('Update ticket error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Super Admin - Get ticket stats
router.get('/admin/stats', adminAuth, async (req, res) => {
    try {
        const total = await SupportTicket.countDocuments();
        const pending = await SupportTicket.countDocuments({ status: 'Pending' });
        const inProgress = await SupportTicket.countDocuments({ status: 'In Progress' });
        const resolved = await SupportTicket.countDocuments({ status: 'Resolved' });

        res.json({ total, pending, inProgress, resolved });
    } catch (error) {
        console.error('Get ticket stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// School - Get unread reply count
router.get('/unread-count', schoolAuth, async (req, res) => {
    try {
        const count = await SupportTicket.countDocuments({
            schoolId: req.schoolId,
            isReadBySchool: false,
            reply: { $ne: '' }
        });
        res.json({ unreadCount: count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// School - Mark ticket as read
router.put('/tickets/:id/read', schoolAuth, async (req, res) => {
    try {
        const ticket = await SupportTicket.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.schoolId },
            { isReadBySchool: true },
            { new: true }
        );

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        console.error('Mark ticket read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

