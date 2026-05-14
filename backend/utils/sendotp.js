const nodemailer = require('nodemailer');

const sendOTP = async (email, otp) => {
  // Log OTP to console in development when SMTP not configured
  if (!process.env.SMTP_EMAIL || process.env.SMTP_EMAIL === 'your_email@gmail.com') {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  📧 OTP for ${email}: ${otp}`);
    console.log('  (SMTP not configured — showing OTP in console)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD.replace(/\s/g, ''), // strip spaces from app password
    },
    tls: { rejectUnauthorized: false },
  });

  await transporter.sendMail({
    from: `"${process.env.FROM_NAME || 'SmartDine AI'}" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'SmartDine AI — Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 28px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 26px; letter-spacing: 1px;">SmartDine AI</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Email Verification</p>
        </div>
        <div style="padding: 36px 32px; background: #ffffff;">
          <h2 style="margin: 0 0 12px; color: #1a1a1a; font-size: 20px;">Verify your email address</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Use the OTP below to complete your SmartDine registration. This code expires in <strong>5 minutes</strong>.
          </p>
          <div style="background: #fff7f3; border: 2px dashed #FF6B35; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Your OTP</p>
            <span style="font-size: 44px; font-weight: 800; letter-spacing: 14px; color: #FF6B35; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #999; font-size: 13px; margin: 0;">
            If you didn't create a SmartDine account, you can safely ignore this email.
          </p>
        </div>
        <div style="background: #f9f9f9; padding: 16px; text-align: center; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #bbb; font-size: 12px;">© 2024 SmartDine AI. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `Your SmartDine OTP is: ${otp}. It expires in 5 minutes.`,
  });

  console.log(`✅ OTP email sent to ${email}`);
};

module.exports = sendOTP;
