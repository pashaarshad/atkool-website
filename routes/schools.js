const express = require('express');
const router = express.Router();
const School = require('../models/School');
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const { name, id, mobileNo } = req.query;
        let query = {};

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        if (id) {
            query._id = id;
        }
        if (mobileNo) {
            query.mobileNo = { $regex: mobileNo, $options: 'i' };
        }

        const schools = await School.find(query).sort({ createdAt: -1 });

        // Fetch latest subscription for each school
        const schoolsWithSubscription = await Promise.all(
            schools.map(async (school) => {
                const subscription = await Subscription.findOne({ schoolId: school._id })
                    .sort({ createdAt: -1 });

                return {
                    ...school.toObject(),
                    subscriptionEndDate: subscription ? subscription.endDate : null,
                    subscriptionDueDate: subscription ? subscription.dueDate : null,
                    subscriptionStatus: subscription ? subscription.status : null
                };
            })
        );

        res.json(schoolsWithSubscription);
    } catch (error) {
        console.error('Get schools error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }
        res.json(school);
    } catch (error) {
        console.error('Get school error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { name, ownerName, teachers, students, city, state, zipCode, status, amount, mobileNo, email, address, gstNo, gstFile, password, logo } = req.body;

        if (!name || !city) {
            return res.status(400).json({ message: 'Name and city are required' });
        }

        const school = await School.create({
            name,
            ownerName,
            teachers: teachers || 0,
            students: students || 0,
            city,
            state,
            zipCode,
            status: status || 'Pending',
            amount: amount || 0,
            mobileNo,
            email,
            address,
            gstNo,
            gstFile,
            password,
            logo
        });

        res.status(201).json(school);
    } catch (error) {
        console.error('Create school error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { name, ownerName, teachers, students, city, state, zipCode, status, amount, mobileNo, email, address, gstNo, gstFile, password, logo } = req.body;

        const school = await School.findByIdAndUpdate(
            req.params.id,
            { name, ownerName, teachers, students, city, state, zipCode, status, amount, mobileNo, email, address, gstNo, gstFile, password, logo },
            { new: true, runValidators: true }
        );

        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }

        res.json(school);
    } catch (error) {
        console.error('Update school error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const school = await School.findByIdAndDelete(req.params.id);

        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }

        res.json({ message: 'School deleted successfully' });
    } catch (error) {
        console.error('Delete school error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/export/all', auth, async (req, res) => {
    try {
        const schools = await School.find().sort({ createdAt: -1 });

        let csv = 'ID,Name,Teachers,Students,City,Status,Amount,Mobile,Email,Address\n';
        schools.forEach((school, index) => {
            csv += `${index + 1},${school.name},${school.teachers},${school.students},${school.city},${school.status},${school.amount},${school.mobileNo || ''},${school.email || ''},${school.address || ''}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('schools.csv');
        res.send(csv);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

const Student = require('../models/Student');

// Get pending students for a school (for admin approval)
router.get('/:schoolId/pending-students', auth, async (req, res) => {
    try {
        const pendingStudents = await Student.find({
            schoolId: req.params.schoolId,
            approvalStatus: 'Pending'
        }).populate('teacherId', 'name').sort({ createdAt: -1 });

        res.json(pendingStudents);
    } catch (error) {
        console.error('Get pending students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve a student
router.post('/:schoolId/approve-student/:studentId', auth, async (req, res) => {
    try {
        const student = await Student.findOneAndUpdate(
            { _id: req.params.studentId, schoolId: req.params.schoolId },
            { approvalStatus: 'Approved' },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Increment school student count
        await School.findByIdAndUpdate(req.params.schoolId, { $inc: { students: 1 } });

        res.json({ message: 'Student approved successfully', student });
    } catch (error) {
        console.error('Approve student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject a student
router.post('/:schoolId/reject-student/:studentId', auth, async (req, res) => {
    try {
        const student = await Student.findOneAndUpdate(
            { _id: req.params.studentId, schoolId: req.params.schoolId },
            { approvalStatus: 'Rejected' },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ message: 'Student rejected', student });
    } catch (error) {
        console.error('Reject student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
