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
// ✅ SURVEY VALIDATION MIDDLEWARE
// =======================
function validateSurvey(req, res, next) {
  const errors = [];
  const body = req.body;

  // Q1: Name (required)
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push("Name is required");
  }

  // Q2: Age (required, must be number between 1-120)
  if (!body.age || typeof body.age !== 'number' || body.age < 1 || body.age > 120) {
    errors.push("Valid age (1-120) is required");
  }

  // Q3: Area (required)
  const validAreas = ["Rural", "Semi-rural", "Semi-urban", "Urban"];
  if (!body.area || !validAreas.includes(body.area)) {
    errors.push("Valid area selection is required");
  }

  // Q4: Night Sky Darkness (required)
  const validSkyDarkness = ["Very bright", "Bright", "Moderately dark", "Dark", "Very dark"];
  if (!body.nightSky || !validSkyDarkness.includes(body.nightSky)) {
    errors.push("Night sky darkness selection is required");
  }

  // Q5: Milky Way Visibility (required)
  const validMilkyWay = ["Yes, clearly", "Faintly", "Occasionally", "No, never", "Not sure"];
  if (!body.milkyWay || !validMilkyWay.includes(body.milkyWay)) {
    errors.push("Milky Way visibility selection is required");
  }

  // Q6: Mysterious Space (required)
  const validMystery = ["Dark matter / Dark energy", "Black holes", "Origin of the universe", "Multiverse theory", "Extraterrestrial life"];
  if (!body.mystery || !validMystery.includes(body.mystery)) {
    errors.push("Mysterious space selection is required");
  }

  // Q7: Alien Likelihood (required, must be 1-5)
  if (!body.alienLikelihood || typeof body.alienLikelihood !== 'number' || body.alienLikelihood < 1 || body.alienLikelihood > 5) {
    errors.push("Alien life likelihood (1-5) is required");
  }

  // Q8: Celestial Events (required, at least one)
  if (!Array.isArray(body.celestialEvents) || body.celestialEvents.length === 0) {
    errors.push("At least one celestial event must be selected");
  }

  // Q9: Power Outage Effect (required)
  const validPowerOutage = ["Very often", "Sometimes", "Rarely", "Never", "No idea"];
  if (!body.powerOutageEffect || !validPowerOutage.includes(body.powerOutageEffect)) {
    errors.push("Power outage effect selection is required");
  }

  // Q10: Future Mission (required)
  const validMissions = ["Artemis", "Mars Sample Return", "Europa Clipper", "Interstellar Probe", "Gaganyaan"];
  if (!body.futureMission || !validMissions.includes(body.futureMission)) {
    errors.push("Future mission selection is required");
  }

  // Q11: Government Investment (required)
  const validGovtInvestment = ["Yes, much more", "A little more", "Current level is fine", "Less", "Should not invest"];
  if (!body.govtInvestment || !validGovtInvestment.includes(body.govtInvestment)) {
    errors.push("Government investment opinion is required");
  }

  // Q12: Investment Reason (required)
  if (!body.reasonInvestment || typeof body.reasonInvestment !== 'string' || body.reasonInvestment.trim().length === 0) {
    errors.push("Investment reasoning is required");
  }

  // Q13: Biggest Benefit (required)
  const validBenefits = ["Technology & innovation", "Understanding the universe", "Protecting Earth", "Discovering life", "Human survival", "Inspiration"];
  if (!body.biggestBenefit || !validBenefits.includes(body.biggestBenefit)) {
    errors.push("Biggest benefit selection is required");
  }

  // Q14: Support More (required, at least one)
  if (!Array.isArray(body.supportMore) || body.supportMore.length === 0) {
    errors.push("At least one support option must be selected");
  }

  // Q15: Priority Over Earth (required)
  if (!body.priorityOverEarth || typeof body.priorityOverEarth !== 'string' || body.priorityOverEarth.trim().length === 0) {
    errors.push("Prioritization answer is required");
  }

  // Q16: Astronomy Perception (required)
  if (!body.astronomyPerception || typeof body.astronomyPerception !== 'string' || body.astronomyPerception.trim().length === 0) {
    errors.push("Astronomy perception answer is required");
  }

  // Q17: Human Identity (required)
  if (!body.humanIdentity || typeof body.humanIdentity !== 'string' || body.humanIdentity.trim().length === 0) {
    errors.push("Human identity answer is required");
  }

  // Q18: Awareness Trend (required)
  if (!body.awarenessTrend || typeof body.awarenessTrend !== 'string' || body.awarenessTrend.trim().length === 0) {
    errors.push("Awareness trend answer is required");
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors,
    });
  }

  // Validation passed, proceed
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
// 📥 SURVEY SUBMISSION (WITH VALIDATION)
// =======================
app.post("/submit-survey", validateSurvey, async (req, res) => {
  try {
    // Sanitize data before saving
    const sanitizedData = {
      name: req.body.name.trim(),
      age: req.body.age,
      area: req.body.area,
      nightSky: req.body.nightSky,
      milkyWay: req.body.milkyWay,
      mystery: req.body.mystery,
      alienLikelihood: req.body.alienLikelihood,
      celestialEvents: req.body.celestialEvents,
      powerOutageEffect: req.body.powerOutageEffect,
      futureMission: req.body.futureMission,
      govtInvestment: req.body.govtInvestment,
      reasonInvestment: req.body.reasonInvestment.trim(),
      biggestBenefit: req.body.biggestBenefit,
      supportMore: req.body.supportMore,
      priorityOverEarth: req.body.priorityOverEarth.trim(),
      astronomyPerception: req.body.astronomyPerception.trim(),
      humanIdentity: req.body.humanIdentity.trim(),
      awarenessTrend: req.body.awarenessTrend.trim(),
    };

    const survey = new Survey(sanitizedData);
    await survey.save();

    // 📧 Email (NON-BLOCKING)
    sendEmail(
      "📊 New Survey Submitted",
      `New survey submitted by: ${sanitizedData.name}`
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
      error: error.message,
    });
  }
});

// =======================
// 📩 CONTACT MESSAGE
// =======================
app.post("/contact", async (req, res) => {
  try {
    // Basic validation for contact form
    if (!req.body.name || !req.body.email || !req.body.message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required",
      });
    }

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
// 🔐 ADMIN: VIEW SINGLE SURVEY
// =======================
app.get("/admin/surveys/:id", adminAuth, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: "Survey not found",
      });
    }
    res.json({
      success: true,
      data: survey,
    });
  } catch (error) {
    console.error("❌ Error fetching survey:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch survey",
    });
  }
});

// =======================
// 🔐 ADMIN: DELETE SURVEY
// =======================
app.delete("/admin/surveys/:id", adminAuth, async (req, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: "Survey not found",
      });
    }
    res.json({
      success: true,
      message: "Survey deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting survey:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete survey",
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




