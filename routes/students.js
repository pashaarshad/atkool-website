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

        if (decoded.type === 'school') {
            req.schoolId = decoded.schoolId;
            next();
        } else if (decoded.type === 'teacher' && decoded.role === 'Principal') {
            req.schoolId = decoded.schoolId;
            next();
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }
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
        const { name, rollNo, studentId, className, section, email, mobileNo, parentName, parentMobile, guardianMobile, vanId, pickupPoint, address, teacherId, status, parentUsername, parentPassword, photo } = req.body;

        if (!name || !className) {
            return res.status(400).json({ message: 'Name and class are required' });
        }

        if (!email || !parentMobile) {
            return res.status(400).json({ message: 'Gmail ID and parent mobile number are mandatory' });
        }

        if (!/^\d{10}$/.test(parentMobile)) {
            return res.status(400).json({ message: 'Parent mobile number must be exactly 10 digits' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid Gmail/email format' });
        }

        const existingEmail = await Student.findOne({ email: { $regex: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } });
        if (existingEmail) {
            return res.status(400).json({ message: 'A student/parent with this email already exists' });
        }

        const existingMobile = await Student.findOne({ parentMobile });
        if (existingMobile) {
            return res.status(400).json({ message: 'A student/parent with this mobile number already exists' });
        }

        const student = await Student.create({
            schoolId: req.schoolId,
            name,
            rollNo: rollNo || studentId, // map rollNo to studentId for backwards compatibility
            studentId,
            className,
            section: section || 'A',
            email,
            mobileNo,
            parentName,
            parentMobile,
            guardianMobile,
            vanId: vanId || null,
            pickupPoint,
            address,
            teacherId: teacherId || null,
            status: status || 'Active',
            approvalStatus: 'Approved', // School admin adds directly = auto approved
            parentUsername,
            parentPassword,
            photo
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
        const { name, rollNo, studentId, className, section, email, mobileNo, parentName, parentMobile, guardianMobile, vanId, pickupPoint, address, teacherId, status, parentUsername, parentPassword, photo } = req.body;

        if (!email || !parentMobile) {
            return res.status(400).json({ message: 'Gmail ID and parent mobile number are mandatory' });
        }

        if (!/^\d{10}$/.test(parentMobile)) {
            return res.status(400).json({ message: 'Parent mobile number must be exactly 10 digits' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid Gmail/email format' });
        }

        const existingEmail = await Student.findOne({ email: { $regex: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }, _id: { $ne: req.params.id } });
        if (existingEmail) {
            return res.status(400).json({ message: 'A student/parent with this email already exists' });
        }

        const existingMobile = await Student.findOne({ parentMobile, _id: { $ne: req.params.id } });
        if (existingMobile) {
            return res.status(400).json({ message: 'A student/parent with this mobile number already exists' });
        }

        const updateData = { 
            name, 
            rollNo: rollNo || studentId, 
            studentId, 
            className, 
            section, 
            email, 
            mobileNo, 
            parentName, 
            parentMobile, 
            guardianMobile, 
            vanId: vanId || null, 
            pickupPoint, 
            address, 
            teacherId: teacherId || null, 
            status 
        };
        
        if (parentUsername) updateData.parentUsername = parentUsername;
        if (parentPassword) updateData.parentPassword = parentPassword;
        if (photo) updateData.photo = photo;

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
        const bcrypt = require('bcryptjs');
        const existingStudents = await Student.countDocuments({ schoolId: req.schoolId });
        if (existingStudents >= 10) {
            return res.json({ message: 'Test data already exists (' + existingStudents + ' students). Delete existing students first to re-seed.' });
        }

        // Create 3 teachers if none exist
        let teachers = await Teacher.find({ schoolId: req.schoolId });
        const teacherSeedData = [
            {
                name: 'Mrs. Priya Sharma',
                email: 'priya.sharma.t@testschool.com',
                mobileNo: '9876500001',
                role: 'Teacher',
                subject: 'Mathematics, Science',
                classAssignments: [
                    { className: '1', section: 'A' },
                    { className: '1', section: 'B' },
                    { className: '2', section: 'A' },
                    { className: '2', section: 'B' }
                ],
                isClassTeacher: true,
                classTeacherFor: { className: '1', section: 'A' },
                status: 'Active'
            },
            {
                name: 'Mr. Rajesh Kumar',
                email: 'rajesh.kumar.t@testschool.com',
                mobileNo: '9876500002',
                role: 'Teacher',
                subject: 'English, Hindi',
                classAssignments: [
                    { className: '3', section: 'A' },
                    { className: '3', section: 'B' },
                    { className: '4', section: 'A' },
                    { className: '4', section: 'B' }
                ],
                isClassTeacher: true,
                classTeacherFor: { className: '3', section: 'A' },
                status: 'Active'
            },
            {
                name: 'Ms. Anita Desai',
                email: 'anita.desai.t@testschool.com',
                mobileNo: '9876500003',
                role: 'Teacher',
                subject: 'Social Studies, Computer Science',
                classAssignments: [
                    { className: '1', section: 'A' },
                    { className: '2', section: 'B' },
                    { className: '4', section: 'A' }
                ],
                isClassTeacher: false,
                status: 'Active'
            }
        ];

        if (teachers.length < 3) {
            for (const td of teacherSeedData) {
                const existing = await Teacher.findOne({ email: td.email });
                if (!existing) {
                    const hashedPw = await bcrypt.hash('Test@123', 10);
                    const t = await Teacher.create({
                        schoolId: req.schoolId,
                        password: hashedPw,
                        ...td
                    });
                    teachers.push(t);
                    await School.findByIdAndUpdate(req.schoolId, { $inc: { teachers: 1 } });
                }
            }
            teachers = await Teacher.find({ schoolId: req.schoolId, role: 'Teacher' });
        }

        // Assign teachers to classes
        const classTeacherMap = {};
        teachers.forEach(function(t) {
            (t.classAssignments || []).forEach(function(ca) {
                var key = ca.className + '_' + ca.section;
                if (!classTeacherMap[key]) classTeacherMap[key] = t._id;
            });
        });

        const dummyStudents = [
            // Class 1A
            { name: 'Aarav Mehta',    rollNo: 'S001', studentId: 'S001', className: '1', section: 'A', email: 'aarav.mehta@testmail.com',    mobileNo: '9800100001', parentName: 'Mr. Rohit Mehta',    parentMobile: '9800200001' },
            { name: 'Ishita Sharma',  rollNo: 'S002', studentId: 'S002', className: '1', section: 'A', email: 'ishita.sharma@testmail.com',  mobileNo: '9800100002', parentName: 'Mrs. Kavita Sharma',  parentMobile: '9800200002' },
            { name: 'Vihaan Patel',   rollNo: 'S003', studentId: 'S003', className: '1', section: 'A', email: 'vihaan.patel@testmail.com',   mobileNo: '9800100003', parentName: 'Mr. Suresh Patel',    parentMobile: '9800200003' },
            // Class 1B
            { name: 'Diya Gupta',     rollNo: 'S004', studentId: 'S004', className: '1', section: 'B', email: 'diya.gupta@testmail.com',     mobileNo: '9800100004', parentName: 'Mr. Anil Gupta',      parentMobile: '9800200004' },
            { name: 'Reyansh Singh',  rollNo: 'S005', studentId: 'S005', className: '1', section: 'B', email: 'reyansh.singh@testmail.com',  mobileNo: '9800100005', parentName: 'Mrs. Pooja Singh',    parentMobile: '9800200005' },
            // Class 2A
            { name: 'Ananya Reddy',   rollNo: 'S006', studentId: 'S006', className: '2', section: 'A', email: 'ananya.reddy@testmail.com',   mobileNo: '9800100006', parentName: 'Mr. Venkat Reddy',    parentMobile: '9800200006' },
            { name: 'Kabir Joshi',    rollNo: 'S007', studentId: 'S007', className: '2', section: 'A', email: 'kabir.joshi@testmail.com',    mobileNo: '9800100007', parentName: 'Mrs. Sunita Joshi',   parentMobile: '9800200007' },
            { name: 'Myra Nair',      rollNo: 'S008', studentId: 'S008', className: '2', section: 'A', email: 'myra.nair@testmail.com',      mobileNo: '9800100008', parentName: 'Mr. Krishna Nair',    parentMobile: '9800200008' },
            // Class 2B
            { name: 'Arjun Das',      rollNo: 'S009', studentId: 'S009', className: '2', section: 'B', email: 'arjun.das@testmail.com',      mobileNo: '9800100009', parentName: 'Mrs. Sita Das',       parentMobile: '9800200009' },
            { name: 'Saanvi Bose',    rollNo: 'S010', studentId: 'S010', className: '2', section: 'B', email: 'saanvi.bose@testmail.com',    mobileNo: '9800100010', parentName: 'Mr. Tapan Bose',      parentMobile: '9800200010' },
            // Class 3A
            { name: 'Vivaan Kapoor',  rollNo: 'S011', studentId: 'S011', className: '3', section: 'A', email: 'vivaan.kapoor@testmail.com',  mobileNo: '9800100011', parentName: 'Mr. Aakash Kapoor',   parentMobile: '9800200011' },
            { name: 'Aanya Verma',    rollNo: 'S012', studentId: 'S012', className: '3', section: 'A', email: 'aanya.verma@testmail.com',    mobileNo: '9800100012', parentName: 'Mrs. Neha Verma',     parentMobile: '9800200012' },
            { name: 'Advait Saxena',  rollNo: 'S013', studentId: 'S013', className: '3', section: 'A', email: 'advait.saxena@testmail.com',  mobileNo: '9800100013', parentName: 'Mr. Manish Saxena',   parentMobile: '9800200013' },
            // Class 3B
            { name: 'Riya Thakur',    rollNo: 'S014', studentId: 'S014', className: '3', section: 'B', email: 'riya.thakur@testmail.com',    mobileNo: '9800100014', parentName: 'Mrs. Lata Thakur',    parentMobile: '9800200014' },
            { name: 'Dhruv Malhotra', rollNo: 'S015', studentId: 'S015', className: '3', section: 'B', email: 'dhruv.malhotra@testmail.com', mobileNo: '9800100015', parentName: 'Mr. Vikram Malhotra', parentMobile: '9800200015' },
            // Class 4A
            { name: 'Kiara Bansal',   rollNo: 'S016', studentId: 'S016', className: '4', section: 'A', email: 'kiara.bansal@testmail.com',   mobileNo: '9800100016', parentName: 'Mr. Prakash Bansal',  parentMobile: '9800200016' },
            { name: 'Ayaan Rao',      rollNo: 'S017', studentId: 'S017', className: '4', section: 'A', email: 'ayaan.rao@testmail.com',      mobileNo: '9800100017', parentName: 'Mrs. Meena Rao',      parentMobile: '9800200017' },
            { name: 'Navya Pillai',   rollNo: 'S018', studentId: 'S018', className: '4', section: 'A', email: 'navya.pillai@testmail.com',   mobileNo: '9800100018', parentName: 'Mr. Ajay Pillai',     parentMobile: '9800200018' },
            // Class 4B
            { name: 'Rohan Iyer',     rollNo: 'S019', studentId: 'S019', className: '4', section: 'B', email: 'rohan.iyer@testmail.com',     mobileNo: '9800100019', parentName: 'Mrs. Padma Iyer',     parentMobile: '9800200019' },
            { name: 'Siya Agarwal',   rollNo: 'S020', studentId: 'S020', className: '4', section: 'B', email: 'siya.agarwal@testmail.com',   mobileNo: '9800100020', parentName: 'Mr. Rahul Agarwal',   parentMobile: '9800200020' }
        ];

        const createdStudents = [];
        for (const s of dummyStudents) {
            const existing = await Student.findOne({ email: s.email });
            if (existing) continue;

            const teacherIdForClass = classTeacherMap[s.className + '_' + s.section] || (teachers.length > 0 ? teachers[0]._id : null);
            const student = await Student.create({
                schoolId: req.schoolId,
                teacherId: teacherIdForClass,
                ...s,
                parentPassword: 'Test@123',
                status: 'Active',
                approvalStatus: 'Approved'
            });
            createdStudents.push(student);
        }

        await School.findByIdAndUpdate(req.schoolId, { $inc: { students: createdStudents.length } });

        res.json({ 
            message: 'Test data created: ' + teachers.length + ' teachers, ' + createdStudents.length + ' students across Classes 1-4 (Sections A & B)',
            teacherCount: teachers.length,
            studentCount: createdStudents.length
        });
    } catch (error) {
        console.error('Seed dummy error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

module.exports = router;
