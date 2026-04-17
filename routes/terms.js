const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');

const termsFilePath = path.join(__dirname, '..', 'data', 'terms.txt');

router.get('/', auth, async (req, res) => {
    try {
        if (!fs.existsSync(termsFilePath)) {
            return res.json({ content: 'Terms and conditions not found.' });
        }

        const content = fs.readFileSync(termsFilePath, 'utf8');
        res.json({ content });
    } catch (error) {
        console.error('Get terms error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/', auth, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        const dataDir = path.dirname(termsFilePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(termsFilePath, content, 'utf8');
        res.json({ message: 'Terms updated successfully' });
    } catch (error) {
        console.error('Update terms error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
