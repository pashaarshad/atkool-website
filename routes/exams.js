const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Exam = require('../models/Exam');

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

// Get all exams for school
router.get('/', schoolAuth, async (req, res) => {
    try {
        const exams = await Exam.find({ schoolId: req.schoolId })
            .sort({ examDate: 1 });
        res.json(exams);
    } catch (error) {
        console.error('Get exams error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get upcoming exams
router.get('/upcoming', schoolAuth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const exams = await Exam.find({
            schoolId: req.schoolId,
            examDate: { $gte: today },
            status: { $in: ['Scheduled', 'Ongoing'] }
        }).sort({ examDate: 1 }).limit(10);

        res.json(exams);
    } catch (error) {
        console.error('Get upcoming exams error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new exam
router.post('/', schoolAuth, async (req, res) => {
    try {
        const { name, className, subject, examDate, startTime, duration, totalMarks } = req.body;

        if (!name || !className || !subject || !examDate || !startTime) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newExam = await Exam.create({
            schoolId: req.schoolId,
            name,
            className,
            subject,
            examDate: new Date(examDate),
            startTime,
            duration: duration || 60,
            totalMarks: totalMarks || 100
        });

        res.status(201).json(newExam);
    } catch (error) {
        console.error('Create exam error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update exam status
router.patch('/:id/status', schoolAuth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['Scheduled', 'Ongoing', 'Completed', 'Cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const exam = await Exam.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.schoolId },
            { status },
            { new: true }
        );

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        res.json(exam);
    } catch (error) {
        console.error('Update exam status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete exam
router.delete('/:id', schoolAuth, async (req, res) => {
    try {
        const exam = await Exam.findOneAndDelete({
            _id: req.params.id,
            schoolId: req.schoolId
        });

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        console.error('Delete exam error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
