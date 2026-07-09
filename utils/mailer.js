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

  // The Resend SDK does NOT throw on API errors — it returns { data, error }.
  // Without this check, rejected sends (unverified domain, bad from address,
  // free-tier restrictions) are silently logged as "success".
  if (response && response.error) {
    throw new Error(
      `Resend rejected the email: ${response.error.message || JSON.stringify(response.error)}`
    );
  }

  console.log("Email sent successfully", response && response.data);
  return response;
}

module.exports = sendEmail;
