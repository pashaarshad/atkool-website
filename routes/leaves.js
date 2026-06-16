const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const LeaveRequest = require('../models/LeaveRequest');
const Teacher = require('../models/Teacher');

// Authentication Middlewares
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

// Get leave balances for teacher
router.get('/balances', teacherAuth, async (req, res) => {
    try {
        const defaults = { Casual: 12, Sick: 12, Earned: 15 };

        // Fetch all approved leave requests for this teacher
        const approvedRequests = await LeaveRequest.find({
            teacherId: req.teacherId,
            status: 'Approved'
        });

        // Subtract days in inclusive range
        approvedRequests.forEach(req => {
            const start = new Date(req.startDate);
            const end = new Date(req.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            if (defaults[req.leaveType] !== undefined) {
                defaults[req.leaveType] = Math.max(0, defaults[req.leaveType] - diffDays);
            }
        });

        res.json({
            allocated: { Casual: 12, Sick: 12, Earned: 15 },
            remaining: defaults
        });
    } catch (error) {
        console.error('Get leave balances error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit a new leave request (Staff)
router.post('/request', teacherAuth, async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;

        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const request = await LeaveRequest.create({
            teacherId: req.teacherId,
            schoolId: req.schoolId,
            leaveType,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason
        });

        res.status(201).json(request);
    } catch (error) {
        console.error('Request leave error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get leaves requested by teacher
router.get('/list', teacherAuth, async (req, res) => {
    try {
        const requests = await LeaveRequest.find({ teacherId: req.teacherId })
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('Get teacher leaves error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin endpoint: List all leave applications in school
router.get('/admin/list', schoolAuth, async (req, res) => {
    try {
        const requests = await LeaveRequest.find({ schoolId: req.schoolId })
            .populate('teacherId', 'name email role mobileNo')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('Get school leaves list error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin endpoint: Approve or Reject leave request
router.post('/admin/review/:id', schoolAuth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Valid status (Approved/Rejected) is required' });
        }

        const request = await LeaveRequest.findOne({ _id: req.params.id, schoolId: req.schoolId });
        if (!request) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        request.status = status;
        await request.save();

        // If approved, update teacher status to 'On Leave'
        if (status === 'Approved') {
            await Teacher.findByIdAndUpdate(request.teacherId, { status: 'On Leave' });
        }

        res.json({
            message: `Leave request ${status.toLowerCase()} successfully`,
            request
        });
    } catch (error) {
        console.error('Review leave request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
