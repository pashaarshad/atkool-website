const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const EmailVerification = require('../models/EmailVerification');

// Send verification email function
async function sendVerificationEmail(user, userType) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token in DB
    await EmailVerification.create({
        userId: user._id,
        userType: userType,
        token: token
    });

    const userEmail = user.email || (userType === 'parent' ? user.parentEmail : null);
    if (!userEmail) {
        console.log(`Skipping verification email: no email address for user ID ${user._id}`);
        return null;
    }

    const verificationLink = `http://localhost:3000/api/email-verification/verify/${token}`;

    const debugFilePath = path.join(__dirname, '..', '..', 'email-debug.txt');
    const logMessage = `[${new Date().toISOString()}] Email Verification Link generated:
User Name: ${user.name}
User Type: ${userType}
Email: ${userEmail}
Link: ${verificationLink}
Token: ${token}
-------------------------------------------\n`;

    // 1. Log to debug file
    try {
        fs.appendFileSync(debugFilePath, logMessage, 'utf8');
        console.log(`\n✉️ [EMAIL DEBUG] Verification link for "${user.name}" is: ${verificationLink}\n(Written to: ${debugFilePath})\n`);
    } catch (err) {
        console.error('Failed to write email verification debug file:', err);
    }

    // 2. Try sending real email if SMTP is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || 'no-reply@atkool.com';

    if (smtpHost && smtpUser && smtpPass) {
        try {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: parseInt(smtpPort),
                secure: parseInt(smtpPort) === 465,
                auth: {
                    user: smtpUser,
                    pass: smtpPass
                }
            });

            await transporter.sendMail({
                from: smtpFrom,
                to: userEmail,
                subject: `🔒 ATKool Email Verification Required`,
                text: `Hello ${user.name},\n\nPlease verify your email by clicking the following link:\n\n${verificationLink}\n\nThis link is valid for 24 hours.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #faf5ff;">
                        <h2 style="color: #4338ca; border-bottom: 2px solid #4338ca; padding-bottom: 10px;">🔒 Verify Your ATKool Account</h2>
                        <p>Hello ${user.name},</p>
                        <p>An account was created for you on the ATKool school management platform. Please click the button below to verify your email address and activate your account:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" style="background-color: #4338ca; color: #ffffff; text-decoration: none; border-radius: 8px; padding: 12px 30px; font-size: 16px; font-weight: bold; display: inline-block;">
                                Verify Email Address
                            </a>
                        </div>
                        <p style="font-size: 12px; color: #6b7280; text-align: center;">Or copy and paste this link in your browser: <br/> <a href="${verificationLink}">${verificationLink}</a></p>
                        <p style="color: #ef4444; font-weight: bold; font-size: 13px;">This verification link expires in 24 hours.</p>
                    </div>
                `
            });
            console.log(`Verification email successfully sent to ${userEmail}`);
        } catch (error) {
            console.error('Error sending SMTP verification email:', error);
        }
    } else {
        console.log('SMTP not fully configured. Skipping real verification email send (using local email-debug.txt file).');
    }

    return token;
}

module.exports = {
    sendVerificationEmail
};
