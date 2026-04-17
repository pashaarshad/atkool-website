const express = require('express');
const router = express.Router();
const School = require('../models/School');
const User = require('../models/User');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
    try {
        const totalRevenue = await Payment.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const activePlans = await School.countDocuments({ status: 'Paid' });
        const totalSchools = await School.countDocuments();
        const growth = totalSchools > 0 ? Math.round((activePlans / totalSchools) * 100) : 0;

        const totalUsers = await User.countDocuments();
        const totalPayments = await Payment.countDocuments();

        const avgPayment = await Payment.aggregate([
            { $group: { _id: null, avg: { $avg: '$amount' } } }
        ]);

        res.json({
            totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
            activePlans,
            growth,
            totalSchools,
            totalUsers,
            totalPayments,
            avgPayment: avgPayment.length > 0 ? Math.round(avgPayment[0].avg) : 0
        });
    } catch (error) {
        console.error('Get overview stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/chart-data', auth, async (req, res) => {
    try {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const monthlyPayments = await Payment.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const monthlySchools = await School.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const monthlyUsers = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const statusCounts = await School.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const roleCounts = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var labels = [];
        var revenueData = [];
        var schoolsData = [];
        var usersData = [];

        for (var i = 5; i >= 0; i--) {
            var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(months[d.getMonth()] + ' ' + d.getFullYear());

            var payment = monthlyPayments.find(function (p) {
                return p._id.year === d.getFullYear() && p._id.month === d.getMonth() + 1;
            });
            revenueData.push(payment ? payment.total : 0);

            var school = monthlySchools.find(function (s) {
                return s._id.year === d.getFullYear() && s._id.month === d.getMonth() + 1;
            });
            schoolsData.push(school ? school.count : 0);

            var user = monthlyUsers.find(function (u) {
                return u._id.year === d.getFullYear() && u._id.month === d.getMonth() + 1;
            });
            usersData.push(user ? user.count : 0);
        }

        var statusData = {
            labels: [],
            values: []
        };
        statusCounts.forEach(function (item) {
            statusData.labels.push(item._id || 'Unknown');
            statusData.values.push(item.count);
        });

        var rolesData = {
            labels: [],
            values: []
        };
        roleCounts.forEach(function (item) {
            rolesData.labels.push(item._id || 'Unknown');
            rolesData.values.push(item.count);
        });

        res.json({
            labels,
            revenueData,
            schoolsData,
            usersData,
            statusData,
            rolesData
        });
    } catch (error) {
        console.error('Get chart data error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
