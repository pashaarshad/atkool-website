const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Generate a 6-digit random numeric OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
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

    // 2. Try sending real email if SMTP is configured
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@atkool.com';
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
                secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
                auth: {
                    user: smtpUser,
                    pass: smtpPass
                }
            });

            await transporter.sendMail({
                from: smtpFrom,
                to: adminEmail,
                subject: `⚠️ ATKool School Deletion Verification - ${schoolName}`,
                text: `Hello Super Admin,\n\nYou have requested to delete the school "${schoolName}" (ID: ${schoolId}).\n\nYour 6-digit verification OTP is: ${otp}\n\nThis OTP is valid for 5 minutes. If you did not initiate this request, please change your password immediately.`,
                html: `
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
                `
            });
            console.log(`Email successfully sent to Super Admin at ${adminEmail}`);
        } catch (error) {
            console.error('Error sending SMTP email:', error);
        }
    } else {
        console.log('SMTP not fully configured. Skipping real email send (using local OTP debug file).');
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
                subject: `🔐 ATKool School Activation OTP - ${schoolName}`,
                text: `Hello,\n\nWelcome to ATKool!\nYour school account "${schoolName}" has been created.\n\nYour 6-digit email verification OTP code is: ${otp}\n\nThis code is valid for 15 minutes. Enter this code to verify your email and activate your account.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #faf5ff;">
                        <h2 style="color: #4338ca; border-bottom: 2px solid #4338ca; padding-bottom: 10px;">🔐 Verify & Activate Your Account</h2>
                        <p>Hello,</p>
                        <p>Welcome to ATKool! Your school account for <strong>${schoolName}</strong> was created.</p>
                        <p>Please enter the 6-digit verification code below to verify your school email address and activate your account:</p>
                        <div style="background-color: #ffffff; border: 2px dashed #4338ca; border-radius: 8px; padding: 15px 30px; text-align: center; margin: 20px 0; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #4338ca;">
                            ${otp}
                        </div>
                        <p style="color: #ef4444; font-weight: bold;">This code expires in 15 minutes.</p>
                        <p>If you did not request this, please ignore this email.</p>
                    </div>
                `
            });
            console.log(`Email successfully sent to school admin at ${schoolEmail}`);
        } catch (error) {
            console.error('Error sending school activation SMTP email:', error);
        }
    } else {
        console.log('SMTP not fully configured. Skipping real school activation email send (using local OTP debug file).');
    }

    return { otp, expiresAt };
}

module.exports = {
    generateOTP,
    sendDeleteOTP,
    sendActivationOTP
};
