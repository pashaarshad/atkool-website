const express = require('express');
const router = express.Router();
const OfficeStaff = require('../models/OfficeStaff');
const auth = require('../middleware/auth');

// Get all office staff
router.get('/', auth, async (req, res) => {
    try {
        const { name, phone } = req.query;
        let query = {};

        if (name) {
            query.$or = [
                { firstName: { $regex: name, $options: 'i' } },
                { lastName: { $regex: name, $options: 'i' } }
            ];
        }
        if (phone) {
            query.phone = { $regex: phone, $options: 'i' };
        }

        const staff = await OfficeStaff.find(query).sort({ createdAt: -1 });
        res.json(staff);
    } catch (error) {
        console.error('Get office staff error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single staff member
router.get('/:id', auth, async (req, res) => {
    try {
        const staff = await OfficeStaff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }
        res.json(staff);
    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new staff member
router.post('/', auth, async (req, res) => {
    try {
        const { firstName, lastName, phone, email, age, address, idCard } = req.body;

        if (!firstName || !lastName || !phone) {
            return res.status(400).json({ message: 'First name, last name, and phone are required' });
        }

        const staff = await OfficeStaff.create({
            firstName,
            lastName,
            phone,
            email,
            age,
            address,
            idCard
        });

        res.status(201).json(staff);
    } catch (error) {
        console.error('Create staff error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update staff member
router.put('/:id', auth, async (req, res) => {
    try {
        const { firstName, lastName, phone, email, age, address, idCard } = req.body;

        const staff = await OfficeStaff.findByIdAndUpdate(
            req.params.id,
            { firstName, lastName, phone, email, age, address, idCard },
            { new: true, runValidators: true }
        );

        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        res.json(staff);
    } catch (error) {
        console.error('Update staff error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete staff member
router.delete('/:id', auth, async (req, res) => {
    try {
        const staff = await OfficeStaff.findByIdAndDelete(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        res.json({ message: 'Staff member deleted successfully' });
    } catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
