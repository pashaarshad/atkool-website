const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');

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

// Get all events for school
router.get('/', schoolAuth, async (req, res) => {
    try {
        const events = await Event.find({ schoolId: req.schoolId })
            .sort({ createdAt: -1 });
        res.json(events);
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new event
router.post('/', schoolAuth, async (req, res) => {
    try {
        const { name, description, eventFor, image } = req.body;

        if (!name || !description) {
            return res.status(400).json({ message: 'Name and description are required' });
        }

        const newEvent = await Event.create({
            schoolId: req.schoolId,
            name,
            description,
            eventFor: eventFor || 'All',
            image
        });

        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update event status
router.patch('/:id/status', schoolAuth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['Active', 'Completed', 'Cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const event = await Event.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.schoolId },
            { status },
            { new: true }
        );

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        console.error('Update event status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete event
router.delete('/:id', schoolAuth, async (req, res) => {
    try {
        const event = await Event.findOneAndDelete({
            _id: req.params.id,
            schoolId: req.schoolId
        });

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
