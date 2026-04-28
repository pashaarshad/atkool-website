const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Load from .env file
const connectDB = require('./config/db');

const app = express();

app.use(cors());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api', (req, res) => {
    res.json({ message: 'API is working', status: 'success' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/schools', require('./routes/schools'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));

app.get('/', (req, res) => {
    const host = req.headers.host || '';
    if (host.startsWith('admin.')) {
        res.sendFile(path.join(__dirname, 'public', 'school-admin', 'index.html'));
    } else if (host.startsWith('teachers.')) {
        res.sendFile(path.join(__dirname, 'public', 'teacher-login.html'));
    } else if (host.startsWith('student.')) {
        res.sendFile(path.join(__dirname, 'public', 'parent-login.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});


app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/schools', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'schools.html'));
});

app.get('/add-school', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add-school.html'));
});

app.get('/users', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'users.html'));
});

app.use('/api/payments', require('./routes/payments'));

app.get('/payments', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payments.html'));
});

app.use('/api/plans', require('./routes/plans'));

app.get('/plans', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'plans.html'));
});

app.use('/api/overview', require('./routes/overview'));

app.get('/overview', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'overview.html'));
});

app.use('/api/messages', require('./routes/messages'));

app.get('/send-message', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'send-message.html'));
});

app.use('/api/terms', require('./routes/terms'));

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

app.use('/api/school-auth', require('./routes/school-auth'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/students', require('./routes/students'));
app.use('/api/school-messages', require('./routes/school-messages'));
app.use('/api/support', require('./routes/support'));
app.use('/api/events', require('./routes/events'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/teacher-auth', require('./routes/teacher-auth'));
app.use('/api/parent-auth', require('./routes/parent-auth'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/office-staff', require('./routes/office-staff'));

app.get('/support', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'support.html'));
});

app.get('/subscription-list', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'subscription-list.html'));
});

app.get('/office-staff', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'office-staff.html'));
});


const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log('Server running on port ' + PORT);
        console.log('Open http://localhost:' + PORT + ' in your browser');
    });
});
