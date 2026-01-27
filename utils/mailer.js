const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

// NON-BLOCKING email sender
async function sendEmail(subject, text) {
  try {
    await transporter.sendMail({
      from: `"Cosmic Survey" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject,
      text,
    });

    console.log("📧 Email sent:", subject);
  } catch (err) {
    console.error("📧 Email failed:", err.message);
  }
}

module.exports = sendEmail;
