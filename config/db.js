const mongoose = require('mongoose');
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

loadEnv();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected: ' + conn.connection.host);
        return conn;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
