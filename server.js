// =======================
// 🌐 DNS FIX (KEEP)
// =======================
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// =======================
// 🌱 ENV VARIABLES
// =======================
require("dotenv").config();

// =======================
// 📦 IMPORTS
// =======================
const express = require("express");
const mongoose = require("mongoose");

const Survey = require("./models/Survey");
const Contact = require("./models/Contact");
const sendEmail = require("./utils/mailer");

// =======================
// 🚀 APP INIT
// =======================
const app = express();

// =======================
// 🔐 ADMIN AUTH MIDDLEWARE
// =======================
function adminAuth(req, res, next) {
  const password = req.headers["x-admin-password"];

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
    });
  }

  next();
}

// =======================
// 🧩 MIDDLEWARE
// =======================
app.use(express.json());
app.use(express.static("public"));

// =======================
// 🗄️ MONGODB CONNECTION
// =======================
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

mongoose
  .connect(uri)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) =>
    console.error("❌ MongoDB connection error:", err)
  );

// =======================
// 📥 SURVEY SUBMISSION
// =======================
app.post("/submit-survey", async (req, res) => {
  try {
    const survey = new Survey(req.body);
    await survey.save();

    // 📧 Email (NON-BLOCKING)
    sendEmail(
      "📊 New Survey Submitted",
      `New survey submitted by: ${req.body.name || "Anonymous"}`
    );

    res.json({
      success: true,
      message: "Survey response saved successfully",
    });
  } catch (error) {
    console.error("❌ Error saving survey:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save survey response",
    });
  }
});

// =======================
// 📩 CONTACT MESSAGE
// =======================
app.post("/contact", async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();

    // 📧 Email (NON-BLOCKING)
    sendEmail(
      "📩 New Contact Message",
      `Name: ${req.body.name}
Email: ${req.body.email}

Message:
${req.body.message}`
    );

    res.json({
      success: true,
      message: "Contact message sent successfully",
    });
  } catch (error) {
    console.error("❌ Error saving contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send contact message",
    });
  }
});

// =======================
// 🔐 ADMIN: VIEW SURVEYS (PAGINATED)
// =======================
app.get("/admin/surveys", adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Survey.countDocuments();

    const surveys = await Survey.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: surveys,
    });
  } catch (error) {
    console.error("❌ Error fetching surveys:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch survey responses",
    });
  }
});

// =======================
// 🚀 START SERVER
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});




