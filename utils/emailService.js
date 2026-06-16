const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const EmailVerification = require('../models/EmailVerification');

function normalizeBaseUrl(baseUrl) {
    const fallback = process.env.APP_BASE_URL || process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
    return String(baseUrl || fallback).replace(/\/+$/, '');
}

function buildVerificationLink(token, baseUrl) {
    return `${normalizeBaseUrl(baseUrl)}/api/email-verification/verify/${token}`;
}

function getPortalLoginPath(userType) {
    return userType === 'teacher' ? '/teacher-login.html' : '/parent-login.html';
}

async function sendVerificationEmail(user, userType, options = {}) {
    const userEmail = user.email || null;
    if (!userEmail) {
        console.log(`Skipping verification email: no email address for user ID ${user._id}`);
        return null;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const verificationLink = buildVerificationLink(token, options.baseUrl);

    await EmailVerification.deleteMany({
        userId: user._id,
        userType
    });

    await EmailVerification.create({
        userId: user._id,
        userType,
        token
    });

    const debugFilePath = path.join(__dirname, '..', 'email-debug.txt');
    const logMessage = `[${new Date().toISOString()}] Email Verification Link generated:
User Name: ${user.name}
User Type: ${userType}
Email: ${userEmail}
Portal Login: ${getPortalLoginPath(userType)}
Link: ${verificationLink}
Token: ${token}
-------------------------------------------\n`;

    try {
        fs.appendFileSync(debugFilePath, logMessage, 'utf8');
        console.log(`\n[EMAIL DEBUG] Verification link for "${user.name}" is: ${verificationLink}\n(Written to: ${debugFilePath})\n`);
    } catch (err) {
        console.error('Failed to write email verification debug file:', err);
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || 'no-reply@atkool.com';

    if (smtpHost && smtpUser && smtpPass) {
        try {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: {
                    user: smtpUser,
                    pass: smtpPass
                }
            });

            await transporter.sendMail({
                from: smtpFrom,
                to: userEmail,
                subject: 'ATKool Email Verification Required',
                text: `Hello ${user.name},\n\nPlease verify your ATKool account by opening this link:\n${verificationLink}\n\nThis link is valid for 24 hours.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #faf5ff;">
                        <h2 style="color: #4338ca; border-bottom: 2px solid #4338ca; padding-bottom: 10px;">Verify Your ATKool Account</h2>
                        <p>Hello ${user.name},</p>
                        <p>Your ATKool account is almost ready. Please verify your email address to continue.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" style="background-color: #4338ca; color: #ffffff; text-decoration: none; border-radius: 8px; padding: 12px 30px; font-size: 16px; font-weight: bold; display: inline-block;">
                                Verify Email Address
                            </a>
                        </div>
                        <p style="font-size: 12px; color: #6b7280; text-align: center;">If the button does not work, copy this link into your browser:<br><a href="${verificationLink}">${verificationLink}</a></p>
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

    return {
        token,
        email: userEmail,
        verificationLink
    };
}

module.exports = {
    buildVerificationLink,
    getPortalLoginPath,
    sendVerificationEmail
};
