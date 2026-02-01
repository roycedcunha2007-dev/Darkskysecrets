const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(subject, text) {
  try {
    await resend.emails.send({
      from: "DarkSkySecrets <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL, // ✅ THIS WAS MISSING
      subject,
      text,
    });

    console.log("📧 Email sent successfully");
  } catch (error) {
    console.error("❌ Email error:", error);
  }
}

module.exports = sendEmail;

