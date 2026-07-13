const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const School = require('../models/School');
const Student = require('../models/Student');

// Auth middleware for school admin
function schoolAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_admin_secret_key_2024');
        if (decoded.type === 'school' || (decoded.type === 'teacher' && decoded.role === 'Principal')) {
            req.schoolId = decoded.schoolId;
            next();
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// GET current academic year
router.get('/', schoolAuth, async (req, res) => {
    try {
        const school = await School.findById(req.schoolId);
        if (!school) return res.status(404).json({ message: 'School not found' });
        res.json({ academicYear: school.currentAcademicYear || '2026-2027' });
    } catch (error) {
        console.error('Get academic year error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT update academic year (just view, no promotion)
router.put('/', schoolAuth, async (req, res) => {
    try {
        const { academicYear } = req.body;
        if (!academicYear) return res.status(400).json({ message: 'Academic year is required' });
        
        await School.findByIdAndUpdate(req.schoolId, { currentAcademicYear: academicYear });
        res.json({ message: 'Academic year updated', academicYear });
    } catch (error) {
        console.error('Update academic year error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST promote students to next academic year
router.post('/promote', schoolAuth, async (req, res) => {
    try {
        const { fromYear, toYear } = req.body;
        if (!fromYear || !toYear) {
            return res.status(400).json({ message: 'Both fromYear and toYear are required' });
        }

        const school = await School.findById(req.schoolId);
        if (!school) return res.status(404).json({ message: 'School not found' });

        // Get all active students for this school
        const students = await Student.find({ schoolId: req.schoolId, status: 'Active' });

        let promoted = 0;
        let graduated = 0;

        // Class promotion mapping
        const promotionMap = {
            'nursery': 'LKG',
            'lkg': 'UKG',
            'ukg': '1',
            'pre-nursery': 'Nursery',
            'playgroup': 'Nursery',
            'pg': 'Nursery'
        };

        for (const student of students) {
            const currentClass = student.className;
            const lowerClass = currentClass.toLowerCase().trim();
            let newClass = currentClass;

            // Pre-promotion details to push into history
            const historyEntry = {
                academicYear: student.academicYear || fromYear,
                className: student.className,
                section: student.section || 'A',
                status: student.status || 'Active'
            };

            // Initialize classHistory if undefined
            if (!student.classHistory) {
                student.classHistory = [];
            }
            student.classHistory.push(historyEntry);

            // Check if it's a named class (Nursery, LKG, UKG, etc.)
            if (promotionMap[lowerClass]) {
                newClass = promotionMap[lowerClass];
            } else {
                // Try numeric promotion
                const classNum = parseInt(currentClass);
                if (!isNaN(classNum)) {
                    if (classNum >= 12) {
                        // Highest class - graduate the student
                        student.status = 'Graduated';
                        student.academicYear = toYear;
                        await student.save();
                        graduated++;
                        continue;
                    } else {
                        newClass = String(classNum + 1);
                    }
                }
            }

            student.className = newClass;
            student.academicYear = toYear;
            await student.save();
            promoted++;
        }

        // Update school's current academic year
        school.currentAcademicYear = toYear;
        await school.save();

        res.json({
            message: 'Promotion completed successfully',
            promoted,
            graduated,
            totalStudents: students.length,
            newAcademicYear: toYear
        });
    } catch (error) {
        console.error('Promote students error:', error);
        res.status(500).json({ message: 'Server error during promotion' });
    }
});

module.exports = router;
