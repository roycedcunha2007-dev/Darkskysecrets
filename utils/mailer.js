const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587, // IMPORTANT
  secure: false, // MUST be false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000, // 10 seconds
});

async function sendEmail(subject, text) {
  try {
    const info = await transporter.sendMail({
      from: `"Cosmic Survey" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject,
      text,
    });

    console.log("📧 Email sent:", info.response);
  } catch (error) {
    console.error("❌ Email error:", error.message);
  }
}

module.exports = sendEmail;
