const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const School = require('../models/School');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

router.post('/login', async (req, res) => {
    try {
        const { email, mobileNo, password } = req.body;

        if ((!email && !mobileNo) || !password) {
            return res.status(400).json({ message: 'Email or phone number and password are required' });
        }

        let query = {};
        if (email) {
            query.email = { $regex: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') };
        } else if (mobileNo) {
            query.mobileNo = mobileNo;
        }

        const school = await School.findOne(query);

        if (!school) {
            return res.status(401).json({ message: email ? 'No school found with this email' : 'No school found with this phone number' });
        }

        if (!school.password || school.password === '' || school.password === 'N/A') {
            return res.status(401).json({ message: 'Password not set for this school. Please contact admin.' });
        }

        if (school.password !== password) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        if (school.isEmailVerified === false) {
            const { sendActivationOTP } = require('../utils/mailer');
            const { otp, expiresAt } = await sendActivationOTP(school.name, school.email);

            school.activationOtp = {
                code: otp,
                expiresAt: expiresAt
            };
            await school.save();

            return res.status(202).json({
                message: 'OTP_VERIFICATION_REQUIRED',
                schoolId: school._id,
                email: school.email
            });
        }

        const token = jwt.sign(
            { schoolId: school._id, email: school.email, type: 'school' },
            process.env.JWT_SECRET || 'super_admin_secret_key_2024',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            school: {
                id: school._id,
                name: school.name,
                email: school.email,
                logo: school.logo
            }
        });
    } catch (error) {
        console.error('School login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_admin_secret_key_2024');

        let isPrincipal = false;
        if (decoded.type === 'teacher' && decoded.role === 'Principal') {
            isPrincipal = true;
        } else if (decoded.type !== 'school') {
            return res.status(401).json({ message: 'Invalid token type' });
        }

        const school = await School.findById(decoded.schoolId);

        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }

        // Check for active subscription
        const Subscription = require('../models/Subscription');
        const now = new Date();
        const activeSubscription = await Subscription.findOne({
            schoolId: school._id,
            status: 'Active',
            endDate: { $gte: now }
        }).sort({ endDate: -1 });

        let subscriptionInfo = null;
        let hasActivePlan = false;

        if (activeSubscription) {
            hasActivePlan = true;
            subscriptionInfo = {
                id: activeSubscription._id,
                startDate: activeSubscription.startDate,
                endDate: activeSubscription.endDate,
                dueDate: activeSubscription.dueDate,
                // Hide amount details from school admin / principal
                amount: null,
                numberOfTeachers: activeSubscription.numberOfTeachers,
                numberOfStudents: activeSubscription.numberOfStudents,
                status: activeSubscription.status
            };
        }

        // Get real counts from DB
        const studentCount = await Student.countDocuments({ schoolId: school._id, status: 'Active' });
        const teacherCount = await Teacher.countDocuments({ schoolId: school._id, status: 'Active' });

        res.json({
            id: school._id,
            name: school.name,
            ownerName: school.ownerName,
            email: school.email,
            mobileNo: school.mobileNo,
            address: school.address,
            city: school.city,
            state: school.state,
            zipCode: school.zipCode,
            gstNo: school.gstNo,
            logo: school.logo,
            teachers: teacherCount,
            students: studentCount,
            status: school.status,
            // Hide subscription amount details
            amount: null,
            createdAt: school.createdAt,
            hasActivePlan: hasActivePlan,
            subscription: subscriptionInfo,
            role: isPrincipal ? 'Principal' : 'School Admin'
        });
    } catch (error) {
        console.error('Get school profile error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Super Admin Login As School (without password)
router.post('/admin-login/:schoolId', async (req, res) => {
    try {
        // Verify super admin token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Admin authentication required' });
        }

        const adminToken = authHeader.split(' ')[1];
        const decoded = jwt.verify(adminToken, process.env.JWT_SECRET || 'super_admin_secret_key_2024');

        // Verify it's an admin token (not school/teacher/parent)
        if (decoded.type === 'school' || decoded.type === 'teacher' || decoded.type === 'parent') {
            return res.status(403).json({ message: 'Only super admin can use this feature' });
        }

        // Find the school
        const school = await School.findById(req.params.schoolId);
        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }

        // Generate school token for super admin
        const schoolToken = jwt.sign(
            {
                schoolId: school._id,
                email: school.email,
                type: 'school',
                adminAccess: true  // Flag to indicate this is admin accessing as school
            },
            process.env.JWT_SECRET || 'super_admin_secret_key_2024',
            { expiresIn: '24h' }
        );

        res.json({
            token: schoolToken,
            school: {
                id: school._id,
                name: school.name,
                email: school.email,
                logo: school.logo
            },
            message: 'Logged in as ' + school.name
        });
    } catch (error) {
        console.error('Admin login as school error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid admin token' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Update school logo (for school admin)
router.put('/update-logo', async (req, res) => {
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

        const { logo } = req.body;
        if (!logo) {
            return res.status(400).json({ message: 'Logo is required' });
        }

        const school = await School.findByIdAndUpdate(
            decoded.schoolId,
            { logo },
            { new: true }
        );

        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }

        res.json({
            message: 'Logo updated successfully',
            logo: school.logo
        });
    } catch (error) {
        console.error('Update logo error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function to verify school token
async function verifySchoolToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_admin_secret_key_2024');
        if (decoded.type !== 'school') {
            return null;
        }
        return decoded;
    } catch (error) {
        return null;
    }
}

// Get pending students for school admin
router.get('/pending-students', async (req, res) => {
    try {
        const decoded = await verifySchoolToken(req);
        if (!decoded) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const pendingStudents = await Student.find({
            schoolId: decoded.schoolId,
            approvalStatus: 'Pending'
        }).populate('teacherId', 'name').sort({ createdAt: -1 });

        res.json(pendingStudents);
    } catch (error) {
        console.error('Get pending students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve a student
router.post('/approve-student/:studentId', async (req, res) => {
    try {
        const decoded = await verifySchoolToken(req);
        if (!decoded) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const student = await Student.findOneAndUpdate(
            { _id: req.params.studentId, schoolId: decoded.schoolId },
            { approvalStatus: 'Approved' },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Increment school student count
        await School.findByIdAndUpdate(decoded.schoolId, { $inc: { students: 1 } });

        res.json({ message: 'Student approved successfully', student });
    } catch (error) {
        console.error('Approve student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject a student
router.post('/reject-student/:studentId', async (req, res) => {
    try {
        const decoded = await verifySchoolToken(req);
        if (!decoded) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const student = await Student.findOneAndUpdate(
            { _id: req.params.studentId, schoolId: decoded.schoolId },
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

// Verify School Email OTP and Activate Account
router.post('/verify-otp', async (req, res) => {
    try {
        const { schoolId, otp } = req.body;

        if (!schoolId || !otp) {
            return res.status(400).json({ message: 'School ID and OTP code are required' });
        }

        const school = await School.findById(schoolId);
        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }

        if (school.isEmailVerified) {
            return res.status(400).json({ message: 'Email address is already verified' });
        }

        if (!school.activationOtp || !school.activationOtp.code || school.activationOtp.code !== otp) {
            return res.status(400).json({ message: 'Invalid OTP code' });
        }

        if (new Date() > new Date(school.activationOtp.expiresAt)) {
            return res.status(400).json({ message: 'OTP code has expired' });
        }

        // Verify and activate
        school.isEmailVerified = true;
        school.status = 'Unpaid'; // Or leave it as configured, but setting status to active/unpaid allows them to access dashboard
        school.activationOtp = { code: '', expiresAt: null };
        await school.save();

        // Generate JWT token
        const token = jwt.sign(
            { schoolId: school._id, email: school.email, type: 'school' },
            process.env.JWT_SECRET || 'super_admin_secret_key_2024',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Email address verified and account activated successfully!',
            token,
            school: {
                id: school._id,
                name: school.name,
                email: school.email,
                logo: school.logo
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Resend School Activation OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { schoolId } = req.body;

        if (!schoolId) {
            return res.status(400).json({ message: 'School ID is required' });
        }

        const school = await School.findById(schoolId);
        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }

        if (school.isEmailVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        const { sendActivationOTP } = require('../utils/mailer');
        const { otp, expiresAt } = await sendActivationOTP(school.name, school.email);

        school.activationOtp = {
            code: otp,
            expiresAt: expiresAt
        };
        await school.save();

        res.json({ message: 'A new activation OTP has been sent to your registered Gmail.' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
