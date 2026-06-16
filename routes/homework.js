const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Homework = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// ============ AUTH MIDDLEWARES ============
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

async function teacherCanAccessClass(teacherId, className, section) {
    const teacher = await Teacher.findById(teacherId).lean();
    if (!teacher) {
        return false;
    }

    const normalizedSection = section || 'A';
    const assignments = Array.isArray(teacher.classAssignments) ? teacher.classAssignments : [];
    const inAssignments = assignments.some(item => item.className === className && (item.section || 'A') === normalizedSection);
    const isClassTeacher = teacher.isClassTeacher &&
        teacher.classTeacherFor &&
        teacher.classTeacherFor.className === className &&
        (teacher.classTeacherFor.section || 'A') === normalizedSection;

    return inAssignments || isClassTeacher;
}

// ============ TEACHER ENDPOINTS ============

// Get homeworks assigned by the teacher
router.get('/teacher', teacherAuth, async (req, res) => {
    try {
        const homeworks = await Homework.find({
            schoolId: req.schoolId,
            teacherId: req.teacherId
        }).sort({ createdAt: -1 });

        // Get submission stats for each homework
        const stats = await Promise.all(homeworks.map(async (hw) => {
            const totalSubmissions = await HomeworkSubmission.countDocuments({ homeworkId: hw._id });
            const gradedCount = await HomeworkSubmission.countDocuments({ homeworkId: hw._id, status: 'Graded' });
            return {
                ...hw.toObject(),
                submissionsCount: totalSubmissions,
                gradedCount
            };
        }));

        res.json(stats);
    } catch (error) {
        console.error('Teacher get homework error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new homework
router.post('/teacher', teacherAuth, async (req, res) => {
    try {
        const { className, section, subject, title, description, dueDate, attachments } = req.body;

        if (!className || !section || !subject || !title || !description || !dueDate) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        const canAccess = await teacherCanAccessClass(req.teacherId, className, section);
        if (!canAccess) {
            return res.status(403).json({ message: 'You are not assigned to this class/section' });
        }

        const newHomework = await Homework.create({
            schoolId: req.schoolId,
            teacherId: req.teacherId,
            className,
            section,
            subject,
            title,
            description,
            dueDate: new Date(dueDate),
            attachments: attachments || []
        });

        res.status(201).json(newHomework);
    } catch (error) {
        console.error('Teacher create homework error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/teacher/:id', teacherAuth, async (req, res) => {
    try {
        const { className, section, subject, title, description, dueDate, attachments } = req.body;
        const homework = await Homework.findOne({ _id: req.params.id, schoolId: req.schoolId, teacherId: req.teacherId });
        if (!homework) {
            return res.status(404).json({ message: 'Homework not found' });
        }

        const targetClass = className || homework.className;
        const targetSection = section || homework.section || 'A';
        const canAccess = await teacherCanAccessClass(req.teacherId, targetClass, targetSection);
        if (!canAccess) {
            return res.status(403).json({ message: 'You are not assigned to this class/section' });
        }

        homework.className = targetClass;
        homework.section = targetSection;
        homework.subject = subject || homework.subject;
        homework.title = title || homework.title;
        homework.description = description || homework.description;
        homework.dueDate = dueDate ? new Date(dueDate) : homework.dueDate;
        homework.attachments = Array.isArray(attachments) ? attachments : (homework.attachments || []);
        await homework.save();

        res.json(homework);
    } catch (error) {
        console.error('Teacher update homework error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/teacher/:id', teacherAuth, async (req, res) => {
    try {
        const homework = await Homework.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId, teacherId: req.teacherId });
        if (!homework) {
            return res.status(404).json({ message: 'Homework not found' });
        }

        await HomeworkSubmission.deleteMany({ homeworkId: homework._id });
        res.json({ message: 'Homework deleted successfully' });
    } catch (error) {
        console.error('Teacher delete homework error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get submissions for a specific homework
router.get('/teacher/:id/submissions', teacherAuth, async (req, res) => {
    try {
        const homework = await Homework.findOne({ _id: req.params.id, schoolId: req.schoolId, teacherId: req.teacherId });
        if (!homework) {
            return res.status(404).json({ message: 'Homework not found' });
        }

        const submissions = await HomeworkSubmission.find({ homeworkId: homework._id })
            .populate('studentId', 'name rollNo studentId')
            .sort({ submittedAt: -1 });

        res.json(submissions);
    } catch (error) {
        console.error('Teacher get submissions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Grade/Feedback on submission
router.post('/teacher/grade/:submissionId', teacherAuth, async (req, res) => {
    try {
        const { grade, feedback } = req.body;

        const submission = await HomeworkSubmission.findById(req.params.submissionId)
            .populate('homeworkId');

        if (!submission || !submission.homeworkId || submission.homeworkId.schoolId.toString() !== req.schoolId.toString()) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        if (submission.homeworkId.teacherId.toString() !== req.teacherId.toString()) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        submission.grade = grade || '';
        submission.feedback = feedback || '';
        submission.status = 'Graded';
        await submission.save();

        res.json(submission);
    } catch (error) {
        console.error('Teacher grade submission error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============ PARENT/STUDENT ENDPOINTS ============

// Get homework assignments for parent's student
router.get('/parent', parentAuth, async (req, res) => {
    try {
        const student = await Student.findById(req.studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Find homeworks matching student class and section
        const homeworks = await Homework.find({
            schoolId: req.schoolId,
            className: student.className,
            section: student.section || 'A'
        }).populate('teacherId', 'name').sort({ dueDate: 1 });

        // Get submission status for each homework
        const homeworksWithStatus = await Promise.all(homeworks.map(async (hw) => {
            const submission = await HomeworkSubmission.findOne({
                homeworkId: hw._id,
                studentId: req.studentId
            });

            return {
                ...hw.toObject(),
                submission: submission ? {
                    _id: submission._id,
                    submittedAt: submission.submittedAt,
                    content: submission.content,
                    attachments: submission.attachments,
                    grade: submission.grade,
                    feedback: submission.feedback,
                    status: submission.status
                } : null
            };
        }));

        res.json(homeworksWithStatus);
    } catch (error) {
        console.error('Parent get homework error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Parent submit homework
router.post('/parent/submit', parentAuth, async (req, res) => {
    try {
        const { homeworkId, content, attachments } = req.body;

        if (!homeworkId || !content) {
            return res.status(400).json({ message: 'Homework ID and content are required' });
        }

        // Verify homework is for student class
        const student = await Student.findById(req.studentId);
        const homework = await Homework.findOne({
            _id: homeworkId,
            schoolId: req.schoolId,
            className: student.className,
            section: student.section || 'A'
        });

        if (!homework) {
            return res.status(404).json({ message: 'Homework not found or access denied' });
        }

        // Check if submission already exists (Update or create)
        let submission = await HomeworkSubmission.findOne({ homeworkId, studentId: req.studentId });
        if (submission) {
            submission.content = content;
            submission.attachments = attachments || [];
            submission.submittedAt = new Date();
            // Reset grade/feedback if resubmitted
            submission.grade = '';
            submission.feedback = '';
            submission.status = 'Submitted';
            await submission.save();
        } else {
            submission = await HomeworkSubmission.create({
                homeworkId,
                studentId: req.studentId,
                content,
                attachments: attachments || []
            });
        }

        res.status(201).json(submission);
    } catch (error) {
        console.error('Parent submit homework error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
