const express = require('express');
const router = express.Router();
const EmailVerification = require('../models/EmailVerification');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// GET verify email
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const verification = await EmailVerification.findOne({ token });
        if (!verification) {
            return res.status(400).send(`
                <html>
                <head>
                    <title>Verification Failed</title>
                    <style>
                        body { font-family: sans-serif; background-color: #f1f5f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center; max-width: 400px; }
                        h2 { color: #ef4444; }
                        p { color: #64748b; font-size: 14px; line-height: 1.5; }
                        .btn { background: #4338ca; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 20px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h2>Verification Failed</h2>
                        <p>This verification link is invalid or has expired. Please contact your school administrator to request a new link.</p>
                    </div>
                </body>
                </html>
            `);
        }

        if (verification.userType === 'teacher') {
            await Teacher.findByIdAndUpdate(verification.userId, { isEmailVerified: true });
        } else if (verification.userType === 'parent') {
            await Student.findByIdAndUpdate(verification.userId, { isEmailVerified: true });
        }

        // Delete verification record
        await EmailVerification.deleteOne({ _id: verification._id });

        res.send(`
            <html>
            <head>
                <title>Verification Success</title>
                <style>
                    body { font-family: sans-serif; background-color: #f1f5f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center; max-width: 400px; }
                    h2 { color: #10b981; }
                    p { color: #64748b; font-size: 14px; line-height: 1.5; }
                    .btn { background: #4338ca; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 20px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Email Verified!</h2>
                    <p>Your email has been successfully verified. You can now log in to the portal using your credentials.</p>
                    <a href="/" class="btn">Go to Login</a>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
