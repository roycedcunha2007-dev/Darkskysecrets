const { Resend } = require("resend");

let resend = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing");
  }

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
}

async function sendEmail(subject, text) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL is missing");
  }

  const response = await getResendClient().emails.send({
    from: process.env.EMAIL_FROM || "DarkSkySecrets <onboarding@resend.dev>",
    to: adminEmail,
    subject,
    text,
  });

  console.log("Email sent successfully", response);
  return response;
}

module.exports = sendEmail;
