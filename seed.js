const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, 'env.txt');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) process.env[key.trim()] = value.trim();
    });
}

const School = require('./models/School');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Admin = require('./models/Admin');
const Plan = require('./models/Plan');
const Subscription = require('./models/Subscription');
const bcrypt = require('bcryptjs');

const hashPassword = async (pw) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(pw, salt);
};

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management');
        console.log('Connected to MongoDB for seeding...');

        // 1. Create Super Admin if not exists
        const hashedAdminPw = await hashPassword('admin123');
        const admin = await Admin.findOneAndUpdate(
            { username: 'admin' },
            { password: hashedAdminPw, role: 'super_admin' },
            { upsert: true, new: true }
        );
        console.log('Super Admin ensured: admin / admin123');

        // 2. Create a Plan
        const plan = await Plan.findOneAndUpdate(
            { name: 'Pro Plan' },
            { price: 999, duration: 365, features: ['All Features'], status: 'Active' },
            { upsert: true, new: true }
        );

        // 3. Create a School
        const school = await School.findOneAndUpdate(
            { email: 'school@test.com' },
            { 
                name: 'Test Academy', 
                password: 'school123',
                ownerName: 'Principal Test',
                mobileNo: '1234567890',
                status: 'Active'
            },
            { upsert: true, new: true }
        );
        console.log('School ensured: school@test.com / school123');

        // 4. Create a Subscription for the school
        await Subscription.findOneAndUpdate(
            { schoolId: school._id },
            { 
                planId: plan._id,
                status: 'Active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                amount: 999
            },
            { upsert: true }
        );

        // 5. Create a Teacher
        const hashedTeacherPw = await hashPassword('teacher123');
        const teacher = await Teacher.findOneAndUpdate(
            { email: 'teacher@test.com' },
            { 
                name: 'John Doe', 
                password: hashedTeacherPw,
                schoolId: school._id,
                mobileNo: '9876543210',
                designation: 'Senior Teacher',
                status: 'Active'
            },
            { upsert: true, new: true }
        );
        console.log('Teacher ensured: teacher@test.com / teacher123');

        // 6. Create a Student (Parent Login)
        // Parent login uses 'parentUsername' and 'parentPassword'
        const student = await Student.findOneAndUpdate(
            { rollNo: 'S101' },
            { 
                name: 'Jane Smith', 
                parentUsername: 'parent123',
                parentPassword: 'parent123',
                className: '10th',
                schoolId: school._id,
                teacherId: teacher._id,
                status: 'Active',
                approvalStatus: 'Approved'
            },
            { upsert: true, new: true }
        );
        console.log('Parent/Student ensured: parent123 / parent123');

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();
