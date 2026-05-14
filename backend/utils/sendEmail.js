const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, html, text }) => {
  // Skip silently if SMTP not configured
  if (!process.env.SMTP_EMAIL || process.env.SMTP_EMAIL === 'your_email@gmail.com') {
    console.log(`📧 [Email skipped - SMTP not configured] To: ${email}, Subject: ${subject}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD.replace(/\s/g, ''),
    },
  });

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: email,
    subject,
    html,
    text,
  };

  await transporter.sendMail(mailOptions);
};

// Email templates
exports.sendWelcomeEmail = async (user) => {
  await sendEmail({
    email: user.email,
    subject: 'Welcome to SmartDine AI! 🍽️',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">SmartDine AI</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Welcome, ${user.name}! 🎉</h2>
          <p>Thank you for joining SmartDine AI. Discover amazing restaurants and order your favorite food with AI-powered recommendations.</p>
          <a href="${process.env.CLIENT_URL}" style="background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px;">Start Exploring</a>
        </div>
      </div>
    `,
  });
};

exports.sendPasswordResetEmail = async (user, resetUrl) => {
  await sendEmail({
    email: user.email,
    subject: 'Password Reset Request - SmartDine AI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">SmartDine AI</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Click the button below to reset your password. This link expires in 15 minutes.</p>
          <a href="${resetUrl}" style="background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px;">Reset Password</a>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
  });
};

exports.sendOrderConfirmationEmail = async (user, order) => {
  const itemsList = order.items
    .map((item) => `<li>${item.name} x${item.quantity} - ₹${item.price * item.quantity}</li>`)
    .join('');

  await sendEmail({
    email: user.email,
    subject: `Order Confirmed #${order.orderNumber} - SmartDine AI`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Order Confirmed! ✅</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Hi ${user.name},</h2>
          <p>Your order <strong>#${order.orderNumber}</strong> has been placed successfully!</p>
          <h3>Order Summary:</h3>
          <ul>${itemsList}</ul>
          <p><strong>Total: ₹${order.total}</strong></p>
          <p>Estimated delivery: ${order.estimatedDeliveryTime || '30-45 mins'}</p>
          <a href="${process.env.CLIENT_URL}/orders/${order._id}" style="background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px;">Track Order</a>
        </div>
      </div>
    `,
  });
};

module.exports = { sendEmail, ...exports };
