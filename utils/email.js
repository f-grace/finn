const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Email templates
const emailTemplates = {
  verification: (verificationUrl, firstName) => ({
    subject: 'Verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to CareerConnect!</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for joining CareerConnect. Please verify your email address to complete your registration.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The CareerConnect Team</p>
      </div>
    `
  }),

  passwordReset: (resetUrl, firstName) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>You requested a password reset for your CareerConnect account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The CareerConnect Team</p>
      </div>
    `
  }),

  connectionRequest: (senderName, recipientName, message, acceptUrl, declineUrl) => ({
    subject: `${senderName} wants to connect with you`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Connection Request</h2>
        <p>Hi ${recipientName},</p>
        <p><strong>${senderName}</strong> wants to connect with you on CareerConnect.</p>
        ${message ? `<p><em>"${message}"</em></p>` : ''}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${acceptUrl}" 
             style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
            Accept
          </a>
          <a href="${declineUrl}" 
             style="background-color: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Decline
          </a>
        </div>
        <p>Best regards,<br>The CareerConnect Team</p>
      </div>
    `
  }),

  outreachMessage: (senderName, recipientName, subject, message, replyUrl) => ({
    subject: subject || `Message from ${senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Message from ${senderName}</h2>
        <p>Hi ${recipientName},</p>
        <p>You received a new message on CareerConnect:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; line-height: 1.6;">${message}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${replyUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reply to Message
          </a>
        </div>
        <p>Best regards,<br>The CareerConnect Team</p>
      </div>
    `
  }),

  weeklyDigest: (userName, stats) => ({
    subject: 'Your Weekly CareerConnect Digest',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Weekly CareerConnect Digest</h2>
        <p>Hi ${userName},</p>
        <p>Here's your weekly summary:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>This Week's Activity:</h3>
          <ul>
            <li>New connections: ${stats.newConnections}</li>
            <li>Messages sent: ${stats.messagesSent}</li>
            <li>Messages received: ${stats.messagesReceived}</li>
            <li>Profile views: ${stats.profileViews}</li>
          </ul>
        </div>
        <p>Keep building your network and advancing your career!</p>
        <p>Best regards,<br>The CareerConnect Team</p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async ({ email, subject, html, text }) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@careerconnect.com',
      to: email,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// Send template email
const sendTemplateEmail = async (templateName, email, data) => {
  const template = emailTemplates[templateName];
  if (!template) {
    throw new Error(`Email template '${templateName}' not found`);
  }

  const emailData = typeof template === 'function' ? template(data) : template;
  return sendEmail({
    email,
    subject: emailData.subject,
    html: emailData.html
  });
};

module.exports = {
  sendEmail,
  sendTemplateEmail,
  emailTemplates
};