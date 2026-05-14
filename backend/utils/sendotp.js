const nodemailer = require('nodemailer');

/**
 * Send OTP email
 * @param {string} email - recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} type - 'verify' | 'login' | 'delete'
 */
const sendOTP = async (email, otp, type = 'verify') => {
  // Log to console when SMTP not configured
  if (!process.env.SMTP_EMAIL || process.env.SMTP_EMAIL === 'your_email@gmail.com') {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  📧 OTP for ${email}: ${otp} [type: ${type}]`);
    console.log('  (SMTP not configured — showing OTP in console)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    return;
  }

  const isDelete = type === 'delete';
  const accentColor = isDelete ? '#ef4444' : '#FF6B35';

  const subjects = {
    verify: 'SmartDine AI — Email Verification OTP',
    login: 'SmartDine AI — Login OTP',
    delete: 'SmartDine AI — Account Deletion Confirmation',
  };

  const titles = {
    verify: 'Verify your email address',
    login: 'Your login OTP',
    delete: '⚠️ Confirm Account Deletion',
  };

  const bodies = {
    verify: 'Use the OTP below to complete your SmartDine registration. It expires in <strong>5 minutes</strong>.',
    login: 'Use the OTP below to sign in to your SmartDine account. It expires in <strong>5 minutes</strong>.',
    delete: 'You requested to <strong>permanently delete</strong> your SmartDine account. Enter the OTP below to confirm. This action <strong>cannot be undone</strong>. The OTP expires in <strong>10 minutes</strong>.',
  };

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD.replace(/\s/g, ''),
    },
    tls: { rejectUnauthorized: false },
  });

  await transporter.sendMail({
    from: `"${process.env.FROM_NAME || 'SmartDine AI'}" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: subjects[type] || subjects.verify,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: ${accentColor}; padding: 28px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 1px;">SmartDine AI</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">
            ${isDelete ? 'Account Deletion Request' : 'Secure Verification'}
          </p>
        </div>
        <div style="padding: 36px 32px; background: #ffffff;">
          <h2 style="margin: 0 0 12px; color: #1a1a1a; font-size: 20px;">${titles[type]}</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">${bodies[type]}</p>
          <div style="background: ${isDelete ? '#fef2f2' : '#fff7f3'}; border: 2px dashed ${accentColor}; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Your OTP</p>
            <span style="font-size: 44px; font-weight: 800; letter-spacing: 14px; color: ${accentColor}; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #999; font-size: 13px; margin: 0;">
            If you didn't request this, please ignore this email. Your account remains safe.
          </p>
        </div>
        <div style="background: #f9f9f9; padding: 16px; text-align: center; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #bbb; font-size: 12px;">© 2024 SmartDine AI. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `Your SmartDine OTP is: ${otp}. ${isDelete ? 'This will permanently delete your account. Valid for 10 minutes.' : 'Valid for 5 minutes.'}`,
  });

  console.log(`✅ OTP email [${type}] sent to ${email}`);
};

module.exports = sendOTP;
