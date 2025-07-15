const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();


// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: true, // protects against MITM attacks
  },
  connectionTimeout: 5000, // 5 seconds
});

/**
 * Send an email using nodemailer
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML content
 */
async function sendEmail({ to, subject, html }) {
  if (!to || !subject || !html) {
    console.warn('Missing email parameters:', { to, subject });
    throw new Error('Missing email details');
  }

  try {
    const info = await transporter.sendMail({
      from: `"ChatFlow Support" <${process.env.EMAIL_USER || 'no-reply@chatflow.com'}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to} - Message ID: ${info.messageId}`);
  } catch (err) {
    console.error('❌ Failed to send email:', err);
    throw new Error('Email delivery failed');
  }
}

module.exports = sendEmail;
