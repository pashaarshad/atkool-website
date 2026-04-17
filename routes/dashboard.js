const express = require('express');
const router = express.Router();
const School = require('../models/School');
const OfficeStaff = require('../models/OfficeStaff');
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
    try {
        const totalSchools = await School.countDocuments();
        const activePlans = await School.countDocuments({ status: 'Paid' });

        const systemUse = totalSchools > 0 ? Math.round((activePlans / totalSchools) * 100) : 0;

        // Get real office staff count
        const officeStaffCount = await OfficeStaff.countDocuments();

        // Get real total teachers count
        const totalTeachers = await Teacher.countDocuments();

        res.json({
            totalSchools,
            activePlans,
            systemUse,
            managers: {
                officeStaff: officeStaffCount
            },
            totalUsers: totalTeachers
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
