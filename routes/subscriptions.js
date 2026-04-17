const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const School = require('../models/School');
const auth = require('../middleware/auth');

// Get all subscriptions with school details
router.get('/', auth, async (req, res) => {
    try {
        const { schoolId, status } = req.query;
        let query = {};

        if (schoolId) {
            query.schoolId = schoolId;
        }
        if (status && status !== 'all') {
            query.status = status;
        }

        const subscriptions = await Subscription.find(query)
            .populate('schoolId', 'name email mobileNo')
            .sort({ createdAt: -1 });

        res.json(subscriptions);
    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single subscription
router.get('/:id', auth, async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id)
            .populate('schoolId', 'name email mobileNo');

        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        res.json(subscription);
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new subscription
router.post('/', auth, async (req, res) => {
    try {
        const { schoolId, startDate, endDate, dueDate, amount, numberOfTeachers, numberOfStudents, status } = req.body;

        if (!schoolId || !startDate || !endDate || !dueDate) {
            return res.status(400).json({ message: 'School, start date, end date, and due date are required' });
        }

        // Check if school exists
        const school = await School.findById(schoolId);
        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }

        const subscription = await Subscription.create({
            schoolId,
            startDate,
            endDate,
            dueDate,
            amount: amount || 0,
            numberOfTeachers: numberOfTeachers || 0,
            numberOfStudents: numberOfStudents || 0,
            status: status || 'Pending'
        });

        // Update school with subscription info
        await School.findByIdAndUpdate(schoolId, {
            teachers: numberOfTeachers || school.teachers,
            students: numberOfStudents || school.students,
            amount: amount || school.amount,
            status: status === 'Active' ? 'Paid' : (status === 'Pending' ? 'Pending' : 'Unpaid')
        });

        const populatedSubscription = await Subscription.findById(subscription._id)
            .populate('schoolId', 'name email mobileNo');

        res.status(201).json(populatedSubscription);
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update subscription
router.put('/:id', auth, async (req, res) => {
    try {
        const { schoolId, startDate, endDate, dueDate, amount, numberOfTeachers, numberOfStudents, status } = req.body;

        const subscription = await Subscription.findByIdAndUpdate(
            req.params.id,
            { schoolId, startDate, endDate, dueDate, amount, numberOfTeachers, numberOfStudents, status },
            { new: true, runValidators: true }
        ).populate('schoolId', 'name email mobileNo');

        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        // Update school status based on subscription
        if (schoolId) {
            await School.findByIdAndUpdate(schoolId, {
                teachers: numberOfTeachers,
                students: numberOfStudents,
                amount: amount,
                status: status === 'Active' ? 'Paid' : (status === 'Pending' ? 'Pending' : 'Unpaid')
            });
        }

        res.json(subscription);
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete subscription
router.delete('/:id', auth, async (req, res) => {
    try {
        const subscription = await Subscription.findByIdAndDelete(req.params.id);

        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        res.json({ message: 'Subscription deleted successfully' });
    } catch (error) {
        console.error('Delete subscription error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Renew subscription - extend by 1 month from end date
router.put('/renew/:schoolId', auth, async (req, res) => {
    try {
        // Find the latest subscription for this school
        const subscription = await Subscription.findOne({ schoolId: req.params.schoolId })
            .sort({ createdAt: -1 });

        if (!subscription) {
            return res.status(404).json({ message: 'No subscription found for this school' });
        }

        // Calculate new end date (1 month from current end date)
        const currentEndDate = new Date(subscription.endDate);
        const newEndDate = new Date(currentEndDate);
        newEndDate.setMonth(newEndDate.getMonth() + 1);

        // Also extend due date by 1 month
        const currentDueDate = new Date(subscription.dueDate);
        const newDueDate = new Date(currentDueDate);
        newDueDate.setMonth(newDueDate.getMonth() + 1);

        // Update the subscription
        subscription.endDate = newEndDate;
        subscription.dueDate = newDueDate;
        subscription.status = 'Active';
        await subscription.save();

        // Update school status to Paid/Active
        await School.findByIdAndUpdate(req.params.schoolId, {
            status: 'Paid'
        });

        const updatedSubscription = await Subscription.findById(subscription._id)
            .populate('schoolId', 'name email mobileNo');

        res.json({
            message: 'Subscription renewed successfully',
            subscription: updatedSubscription,
            newEndDate: newEndDate,
            newDueDate: newDueDate
        });
    } catch (error) {
        console.error('Renew subscription error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
