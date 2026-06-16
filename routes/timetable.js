const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Timetable = require('../models/Timetable');
const Teacher = require('../models/Teacher');

// ============ AUTH MIDDLEWARES ============
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

function anyUserAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_admin_secret_key_2024');
        
        req.schoolId = decoded.schoolId;
        req.userType = decoded.type;
        if (decoded.type === 'parent') {
            req.studentId = decoded.studentId;
        } else if (decoded.type === 'teacher') {
            req.teacherId = decoded.teacherId;
        }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// Get timetable for a specific class and section
router.get('/', anyUserAuth, async (req, res) => {
    try {
        const { className, section } = req.query;

        if (!className || !section) {
            return res.status(400).json({ message: 'className and section are required' });
        }

        const timetable = await Timetable.find({
            schoolId: req.schoolId,
            className,
            section
        }).populate('periods.teacherId', 'name');

        res.json(timetable);
    } catch (error) {
        console.error('Get timetable error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create/Update timetable for a class, section, and day
router.post('/', schoolAuth, async (req, res) => {
    try {
        const { className, section, dayOfWeek, periods } = req.body;

        if (!className || !section || !dayOfWeek || !periods || !Array.isArray(periods)) {
            return res.status(400).json({ message: 'Required fields are missing or invalid' });
        }

        // Validate periods structure
        for (const p of periods) {
            if (p.periodNumber === undefined || !p.subject || !p.startTime || !p.endTime) {
                return res.status(400).json({ message: 'Each period must have number, subject, startTime, and endTime' });
            }
        }

        // Find existing or upsert
        const timetable = await Timetable.findOneAndUpdate(
            { schoolId: req.schoolId, className, section, dayOfWeek },
            { periods },
            { new: true, upsert: true }
        );

        res.status(200).json(timetable);
    } catch (error) {
        console.error('Create/Update timetable error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
