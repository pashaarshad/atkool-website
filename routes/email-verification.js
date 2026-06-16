const express = require('express');
const router = express.Router();
const EmailVerification = require('../models/EmailVerification');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { getPortalLoginPath, sendVerificationEmail } = require('../utils/emailService');

function getBaseUrl(req) {
    return process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

function renderPage({ title, heading, message, success, loginPath }) {
    return `
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: sans-serif; background-color: #f1f5f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center; max-width: 420px; }
                h2 { color: ${success ? '#10b981' : '#ef4444'}; }
                p { color: #64748b; font-size: 14px; line-height: 1.5; }
                .btn { background: #4338ca; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 20px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>${heading}</h2>
                <p>${message}</p>
                ${loginPath ? `<a href="${loginPath}" class="btn">Go to Login</a>` : ''}
            </div>
        </body>
        </html>
    `;
}

router.post('/request', async (req, res) => {
    try {
        const { userType, email, username } = req.body;

        if (!userType || !['teacher', 'parent'].includes(userType)) {
            return res.status(400).json({ message: 'Valid userType is required' });
        }

        let user = null;
        if (userType === 'teacher') {
            if (!email) {
                return res.status(400).json({ message: 'Teacher email is required' });
            }
            user = await Teacher.findOne({
                email: { $regex: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
            });
        } else {
            if (!username && !email) {
                return res.status(400).json({ message: 'Parent username or email is required' });
            }
            if (username) {
                user = await Student.findOne({
                    parentUsername: { $regex: new RegExp('^' + username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
                });
            }
            if (!user && email) {
                user = await Student.findOne({
                    email: { $regex: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
                });
            }
        }

        if (!user) {
            return res.status(404).json({ message: 'Account not found' });
        }

        if (!user.email) {
            return res.status(400).json({ message: 'No email is configured for this account yet' });
        }

        const verification = await sendVerificationEmail(user, userType, { baseUrl: getBaseUrl(req) });

        res.json({
            message: 'Verification email sent successfully',
            verification: verification ? {
                email: verification.email,
                linkGenerated: true
            } : {
                linkGenerated: false
            }
        });
    } catch (error) {
        console.error('Request email verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const verification = await EmailVerification.findOne({ token });
        if (!verification) {
            return res.status(400).send(renderPage({
                title: 'Verification Failed',
                heading: 'Verification Failed',
                message: 'This verification link is invalid or has expired. Please request a fresh verification email.',
                success: false
            }));
        }

        const loginPath = getPortalLoginPath(verification.userType);

        if (verification.userType === 'teacher') {
            await Teacher.findByIdAndUpdate(verification.userId, { isEmailVerified: true });
        } else if (verification.userType === 'parent') {
            await Student.findByIdAndUpdate(verification.userId, { isEmailVerified: true });
        }

        await EmailVerification.deleteOne({ _id: verification._id });

        res.send(renderPage({
            title: 'Verification Success',
            heading: 'Email Verified',
            message: 'Your email has been verified successfully. You can now log in to your portal.',
            success: true,
            loginPath
        }));
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
