const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Please provide username and password' });
        }

        let admin = await Admin.findOne({ username });

        if (!admin) {
            if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
                admin = await Admin.create({
                    username: process.env.ADMIN_USERNAME,
                    password: process.env.ADMIN_PASSWORD,
                    role: 'super_admin'
                });
            } else {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
        } else {
            const isMatch = await admin.matchPassword(password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
        }

        const token = jwt.sign(
            { id: admin._id, username: admin.username, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/verify', require('../middleware/auth'), (req, res) => {
    res.json({ valid: true, admin: req.admin });
});

module.exports = router;
