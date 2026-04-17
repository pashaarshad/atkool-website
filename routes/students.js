const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
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

router.get('/classes', schoolAuth, async (req, res) => {
    try {
        const { teacherName, className } = req.query;

        const schoolObjectId = new mongoose.Types.ObjectId(req.schoolId);
        let matchQuery = { schoolId: schoolObjectId };

        const classes = await Student.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { className: '$className', section: '$section', teacherId: '$teacherId' },
                    studentCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'teachers',
                    localField: '_id.teacherId',
                    foreignField: '_id',
                    as: 'teacher'
                }
            },
            { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    className: '$_id.className',
                    section: '$_id.section',
                    teacherId: '$_id.teacherId',
                    teacherName: { $ifNull: ['$teacher.name', 'Not Assigned'] },
                    studentCount: 1
                }
            },
            { $sort: { className: 1, section: 1 } }
        ]);

        let filteredClasses = classes;

        if (teacherName) {
            filteredClasses = filteredClasses.filter(c =>
                c.teacherName.toLowerCase().includes(teacherName.toLowerCase())
            );
        }

        if (className) {
            filteredClasses = filteredClasses.filter(c =>
                c.className.toLowerCase().includes(className.toLowerCase())
            );
        }

        res.json(filteredClasses);
    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', schoolAuth, async (req, res) => {
    try {
        const { className, section, name } = req.query;
        let query = { schoolId: req.schoolId };

        if (className) query.className = className;
        if (section) query.section = section;
        if (name) query.name = { $regex: name, $options: 'i' };

        const students = await Student.find(query)
            .populate('teacherId', 'name')
            .sort({ rollNo: 1, name: 1 });
        res.json(students);
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', schoolAuth, async (req, res) => {
    try {
        const student = await Student.findOne({ _id: req.params.id, schoolId: req.schoolId })
            .populate('teacherId', 'name');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', schoolAuth, async (req, res) => {
    try {
        const { name, rollNo, className, section, email, mobileNo, parentName, parentMobile, address, teacherId, status, parentUsername, parentPassword } = req.body;

        if (!name || !className) {
            return res.status(400).json({ message: 'Name and class are required' });
        }

        const student = await Student.create({
            schoolId: req.schoolId,
            name,
            rollNo,
            className,
            section: section || 'A',
            email,
            mobileNo,
            parentName,
            parentMobile,
            address,
            teacherId,
            status: status || 'Active',
            approvalStatus: 'Approved', // School admin adds directly = auto approved
            parentUsername,
            parentPassword
        });

        await School.findByIdAndUpdate(req.schoolId, { $inc: { students: 1 } });

        res.status(201).json(student);
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id', schoolAuth, async (req, res) => {
    try {
        const { name, rollNo, className, section, email, mobileNo, parentName, parentMobile, address, teacherId, status, parentUsername, parentPassword } = req.body;

        const updateData = { name, rollNo, className, section, email, mobileNo, parentName, parentMobile, address, teacherId, status };
        if (parentUsername) updateData.parentUsername = parentUsername;
        if (parentPassword) updateData.parentPassword = parentPassword;

        const student = await Student.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.schoolId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json(student);
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', schoolAuth, async (req, res) => {
    try {
        const student = await Student.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        await School.findByIdAndUpdate(req.schoolId, { $inc: { students: -1 } });

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/seed-dummy', schoolAuth, async (req, res) => {
    try {
        let teacher = await Teacher.findOne({ schoolId: req.schoolId });

        if (!teacher) {
            teacher = await Teacher.create({
                schoolId: req.schoolId,
                name: 'Mrs. Priya Sharma',
                email: 'priya.sharma@school.com',
                mobileNo: '+91 98765 11111',
                className: '9th A',
                subject: 'Mathematics',
                students: 10,
                status: 'Active'
            });
            await School.findByIdAndUpdate(req.schoolId, { $inc: { teachers: 1 } });
        }

        const existingStudents = await Student.countDocuments({ schoolId: req.schoolId });
        if (existingStudents >= 10) {
            return res.json({ message: 'Dummy data already exists', teacher, studentCount: existingStudents });
        }

        const dummyStudents = [
            { name: 'Rahul Kumar', rollNo: '001', className: '9th', section: 'A' },
            { name: 'Priya Singh', rollNo: '002', className: '9th', section: 'A' },
            { name: 'Amit Patel', rollNo: '003', className: '9th', section: 'A' },
            { name: 'Sneha Gupta', rollNo: '004', className: '9th', section: 'A' },
            { name: 'Vikram Shah', rollNo: '005', className: '9th', section: 'A' },
            { name: 'Neha Verma', rollNo: '006', className: '10th', section: 'A' },
            { name: 'Arjun Reddy', rollNo: '007', className: '10th', section: 'A' },
            { name: 'Kavya Nair', rollNo: '008', className: '10th', section: 'A' },
            { name: 'Rohan Joshi', rollNo: '009', className: '10th', section: 'B' },
            { name: 'Ananya Das', rollNo: '010', className: '10th', section: 'B' }
        ];

        const createdStudents = [];
        for (const s of dummyStudents) {
            const student = await Student.create({
                schoolId: req.schoolId,
                teacherId: teacher._id,
                ...s,
                status: 'Active'
            });
            createdStudents.push(student);
        }

        await School.findByIdAndUpdate(req.schoolId, { $inc: { students: 10 } });

        res.json({ message: 'Dummy data created', teacher, students: createdStudents });
    } catch (error) {
        console.error('Seed dummy error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
