const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Generate a 6-digit random numeric OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper to send email via Resend API
async function sendResendEmail(to, subject, text, html) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        return false;
    }

    try {
        const fromEmail = process.env.SMTP_FROM || "ATKool <support@atkool.com>";
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: fromEmail,
                to: to,
                subject: subject,
                text: text,
                html: html
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log(`Email successfully sent via Resend API to ${to}. ID: ${data.id}`);
            return true;
        } else {
            console.error('Resend API error:', data);
            return false;
        }
    } catch (error) {
        console.error('Exception sending via Resend API:', error);
        return false;
    }
}

// Send OTP function
async function sendDeleteOTP(schoolName, schoolId) {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Ensure we write to an easy to find file in the workspace
    const debugFilePath = path.join(__dirname, '..', 'otp-debug.txt');
    const logMessage = `[${new Date().toISOString()}] School Delete OTP generated:
School Name: ${schoolName}
School ID: ${schoolId}
OTP Code: ${otp}
Expires At: ${expiresAt.toLocaleString()}
-------------------------------------------\n`;

    // 1. Log to debug file
    try {
        fs.appendFileSync(debugFilePath, logMessage, 'utf8');
        console.log(`\n🔥 [OTP DEBUG] OTP Code for deleting "${schoolName}" is: ${otp}\n(Written to: ${debugFilePath})\n`);
    } catch (err) {
        console.error('Failed to write OTP debug file:', err);
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@atkool.com';
    const subject = `⚠️ ATKool School Deletion Verification - ${schoolName}`;
    const text = `Hello Super Admin,\n\nYou have requested to delete the school "${schoolName}" (ID: ${schoolId}).\n\nYour 6-digit verification OTP is: ${otp}\n\nThis OTP is valid for 5 minutes. If you did not initiate this request, please change your password immediately.`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #faf5ff;">
            <h2 style="color: #4338ca; border-bottom: 2px solid #4338ca; padding-bottom: 10px;">⚠️ Confirm School Deletion</h2>
            <p>Hello Super Admin,</p>
            <p>A request was made to permanently delete the school <strong>${schoolName}</strong> (ID: ${schoolId}).</p>
            <div style="background-color: #ffffff; border: 2px dashed #4338ca; border-radius: 8px; padding: 15px 30px; text-align: center; margin: 20px 0; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #4338ca;">
                ${otp}
            </div>
            <p style="color: #ef4444; font-weight: bold;">This code expires in 5 minutes.</p>
            <p>If you did not initiate this request, please secure your super admin account immediately.</p>
        </div>
    `;

    // 2. Try sending via Resend API first
    const sentViaResend = await sendResendEmail(adminEmail, subject, text, html);
    if (sentViaResend) {
        return { otp, expiresAt };
    }

    // 3. Fallback: Try sending real email if SMTP is configured
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
                to: adminEmail,
                subject: subject,
                text: text,
                html: html
            });
            console.log(`Email successfully sent to Super Admin via SMTP at ${adminEmail}`);
        } catch (error) {
            console.error('Error sending SMTP email:', error);
        }
    } else {
        console.log('SMTP not fully configured. Skipping SMTP fallback email send.');
    }

    return { otp, expiresAt };
}

// Send activation OTP function
async function sendActivationOTP(schoolName, schoolEmail) {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

    const debugFilePath = path.join(__dirname, '..', 'otp-debug.txt');
    const logMessage = `[${new Date().toISOString()}] School Activation OTP generated:
School Name: ${schoolName}
School Email: ${schoolEmail}
OTP Code: ${otp}
Expires At: ${expiresAt.toLocaleString()}
-------------------------------------------\n`;

    try {
        fs.appendFileSync(debugFilePath, logMessage, 'utf8');
        console.log(`\n🔥 [OTP DEBUG] School Activation OTP for "${schoolName}" (${schoolEmail}) is: ${otp}\n(Written to: ${debugFilePath})\n`);
    } catch (err) {
        console.error('Failed to write OTP debug file:', err);
    }

    const subject = `🔐 ATKool School Verification OTP - ${schoolName}`;
    const text = `Hello,\n\nWelcome to ATKool!\nYour school account "${schoolName}" is being created.\n\nYour 6-digit email verification OTP code is: ${otp}\n\nThis code is valid for 15 minutes. Enter this code to verify your email and activate your account.`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #faf5ff;">
            <h2 style="color: #4338ca; border-bottom: 2px solid #4338ca; padding-bottom: 10px;">🔐 Verify Your School Email</h2>
            <p>Hello,</p>
            <p>Welcome to ATKool! You are verifying the school email address for <strong>${schoolName}</strong>.</p>
            <p>Please enter the 6-digit verification code below to verify your school email address and continue registration:</p>
            <div style="background-color: #ffffff; border: 2px dashed #4338ca; border-radius: 8px; padding: 15px 30px; text-align: center; margin: 20px 0; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #4338ca;">
                ${otp}
            </div>
            <p style="color: #ef4444; font-weight: bold;">This code expires in 15 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        </div>
    `;

    // 1. Try sending via Resend API first
    const sentViaResend = await sendResendEmail(schoolEmail, subject, text, html);
    if (sentViaResend) {
        return { otp, expiresAt };
    }

    // 2. Fallback: SMTP
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
                to: schoolEmail,
                subject: subject,
                text: text,
                html: html
            });
            console.log(`Email successfully sent to school admin via SMTP at ${schoolEmail}`);
        } catch (error) {
            console.error('Error sending school activation SMTP email:', error);
        }
    } else {
        console.log('SMTP not fully configured. Skipping SMTP fallback email send.');
    }

    return { otp, expiresAt };
}

module.exports = {
    generateOTP,
    sendDeleteOTP,
    sendActivationOTP
};
