const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '..', 'env.txt');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=');
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

if (!process.env.JWT_SECRET) {
    loadEnv();
}

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
        const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
