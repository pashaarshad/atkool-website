const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// ============ AUTH MIDDLEWARES ============
function staffOrAdminAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_admin_secret_key_2024');
        
        if (decoded.type === 'school') {
            req.schoolId = decoded.schoolId;
            req.isAdmin = true;
            next();
        } else if (decoded.type === 'teacher') {
            req.schoolId = decoded.schoolId;
            req.teacherId = decoded.teacherId;
            req.isAdmin = false;
            next();
        } else {
            return res.status(401).json({ message: 'Invalid token type' });
        }
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

async function teacherCanAccessExam(teacherId, exam) {
    const teacher = await Teacher.findById(teacherId).lean();
    if (!teacher) {
        return false;
    }

    const assignments = Array.isArray(teacher.classAssignments) ? teacher.classAssignments : [];
    const inAssignments = assignments.some(c => c.className === exam.className);
    const isClassTeacher = teacher.isClassTeacher &&
        teacher.classTeacherFor &&
        teacher.classTeacherFor.className === exam.className;

    return inAssignments || isClassTeacher;
}

// ============ STAFF/ADMIN ENDPOINTS ============

router.get('/exams', staffOrAdminAuth, async (req, res) => {
    try {
        const query = { schoolId: req.schoolId };
        if (!req.isAdmin) {
            const teacher = await Teacher.findById(req.teacherId).lean();
            if (!teacher) {
                return res.status(404).json({ message: 'Teacher not found' });
            }

            const classNames = new Set();
            (teacher.classAssignments || []).forEach(c => {
                if (c.className) classNames.add(c.className);
            });
            if (teacher.isClassTeacher && teacher.classTeacherFor && teacher.classTeacherFor.className) {
                classNames.add(teacher.classTeacherFor.className);
            }

            if (classNames.size === 0) {
                return res.json([]);
            }
            query.className = { $in: Array.from(classNames) };
        }

        const exams = await Exam.find(query).sort({ examDate: -1, createdAt: -1 });
        res.json(exams);
    } catch (error) {
        console.error('Get results exams error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all results for a specific exam
router.get('/exam/:examId', staffOrAdminAuth, async (req, res) => {
    try {
        const exam = await Exam.findOne({ _id: req.params.examId, schoolId: req.schoolId });
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Optional: If teacher, verify they teach this class
        if (!req.isAdmin) {
            const isAssigned = await teacherCanAccessExam(req.teacherId, exam);
            if (!isAssigned) {
                return res.status(403).json({ message: 'Access denied to this class exam' });
            }
        }

        // Fetch all students in that class
        const students = await Student.find({
            schoolId: req.schoolId,
            className: exam.className,
            approvalStatus: 'Approved'
        }).sort({ name: 1 });

        // Fetch existing results for this exam
        const results = await Result.find({ examId: exam._id });

        // Map results to student list
        const studentResults = students.map(s => {
            const studentResult = results.find(r => r.studentId.toString() === s._id.toString());
            return {
                student: {
                    _id: s._id,
                    name: s.name,
                    rollNo: s.rollNo || s.studentId || ''
                },
                result: studentResult ? {
                    _id: studentResult._id,
                    marksObtained: studentResult.marksObtained,
                    maxMarks: studentResult.maxMarks,
                    grade: studentResult.grade,
                    remarks: studentResult.remarks
                } : null
            };
        });

        res.json({ exam, studentResults });
    } catch (error) {
        console.error('Get exam results error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Bulk upsert results
router.post('/bulk', staffOrAdminAuth, async (req, res) => {
    try {
        const { examId, results } = req.body; // results is array of { studentId, marksObtained, maxMarks, grade, remarks }

        if (!examId || !results || !Array.isArray(results)) {
            return res.status(400).json({ message: 'Invalid payload' });
        }

        const exam = await Exam.findOne({ _id: examId, schoolId: req.schoolId });
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        if (!req.isAdmin) {
            const isAssigned = await teacherCanAccessExam(req.teacherId, exam);
            if (!isAssigned) {
                return res.status(403).json({ message: 'Access denied to this class exam' });
            }
        }

        const operations = results.map(r => {
            return {
                updateOne: {
                    filter: { studentId: r.studentId, examId: examId, subject: exam.subject },
                    update: {
                        $set: {
                            schoolId: req.schoolId,
                            studentId: r.studentId,
                            examId,
                            subject: exam.subject,
                            marksObtained: Number(r.marksObtained) || 0,
                            maxMarks: Number(r.maxMarks) || exam.totalMarks || 100,
                            grade: r.grade || '',
                            remarks: r.remarks || ''
                        }
                    },
                    upsert: true
                }
            };
        });

        await Result.bulkWrite(operations);

        res.json({ success: true, message: 'Results saved successfully' });
    } catch (error) {
        console.error('Bulk save results error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============ PARENT/STUDENT ENDPOINTS ============

// Get report card for parent's student
router.get('/parent', parentAuth, async (req, res) => {
    try {
        const student = await Student.findById(req.studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Fetch all results for the student
        const results = await Result.find({ studentId: req.studentId, schoolId: req.schoolId })
            .populate('examId', 'name examDate totalMarks')
            .sort({ createdAt: -1 });

        res.json({ student, results });
    } catch (error) {
        console.error('Parent get results error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
