const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const School = require('../models/School');
const auth = require('../middleware/auth');

// Public endpoint - no auth required (for school-admin plans page)
router.get('/public', async (req, res) => {
    try {
        const plan = await Plan.findOne({ name: 'SUPER PLAN', isActive: true });
        if (!plan) {
            return res.json({
                perYearSubscription: 5000,
                perStudentSubscription: 20,
                ownBrandingSetup: 4000,
                teachersLimit: 50,
                classLimit: 50,
                studentsLimit: 500
            });
        }
        res.json({
            perYearSubscription: plan.perYearSubscription,
            perStudentSubscription: plan.perStudentSubscription,
            ownBrandingSetup: plan.ownBrandingSetup,
            teachersLimit: plan.teachersLimit,
            classLimit: plan.classLimit,
            studentsLimit: plan.studentsLimit
        });
    } catch (error) {
        console.error('Get public plan error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/stats', auth, async (req, res) => {
    try {
        const totalSchools = await School.countDocuments();
        const activePlans = await School.countDocuments({ status: 'Paid' });
        const systemUse = totalSchools > 0 ? Math.round((activePlans / totalSchools) * 100) : 0;

        res.json({
            totalSchools,
            activePlans,
            systemUse
        });
    } catch (error) {
        console.error('Get plan stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const plans = await Plan.find().sort({ createdAt: -1 });
        res.json(plans);
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }
        res.json(plan);
    } catch (error) {
        console.error('Get plan error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { ownBrandingSetup, perYearSubscription, perStudentSubscription, teachersLimit, classLimit, studentsLimit } = req.body;

        const plan = await Plan.findByIdAndUpdate(
            req.params.id,
            { ownBrandingSetup, perYearSubscription, perStudentSubscription, teachersLimit, classLimit, studentsLimit },
            { new: true, runValidators: true }
        );

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        res.json(plan);
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/seed', auth, async (req, res) => {
    try {
        const existingPlan = await Plan.findOne({ name: 'SUPER PLAN' });
        if (existingPlan) {
            return res.json({ message: 'Plan already exists', plan: existingPlan });
        }

        const superPlan = await Plan.create({
            name: 'SUPER PLAN',
            ownBrandingSetup: 4000,
            perYearSubscription: 5000,
            perStudentSubscription: 20,
            teachersLimit: 50,
            classLimit: 50,
            studentsLimit: 500,
            isActive: true
        });

        res.status(201).json({ message: 'Plan created', plan: superPlan });
    } catch (error) {
        console.error('Seed plan error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
