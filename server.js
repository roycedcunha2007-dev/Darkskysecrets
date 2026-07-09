require("dotenv").config();

// Local-network workaround: forcing Google DNS fixes Mongo SRV lookups on
// some home ISPs, but BREAKS on many hosting providers (outbound UDP to
// 8.8.8.8 is often blocked), silently killing Mongo and Resend in deployment.
// Keep it on locally, auto-disable on known hosts / production.
const onHostingPlatform =
  process.env.NODE_ENV === "production" ||
  process.env.RENDER || process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT ||
  process.env.DYNO || process.env.FLY_APP_NAME;
if (!onHostingPlatform && process.env.USE_GOOGLE_DNS !== "0") {
  const dns = require("dns");
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  console.log("Using Google DNS resolvers (local workaround; disabled on hosting platforms)");
}

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const Survey = require("./models/Survey");
const Contact = require("./models/Contact");
const sendEmail = require("./utils/mailer");

const app = express();

// Notification emails must never fail a request that already saved data.
// Awaited (not fire-and-forget) so it also completes on serverless hosts,
// which freeze the process as soon as the response is sent.
async function notify(subject, text) {
  try {
    await sendEmail(subject, text);
  } catch (err) {
    console.error("Email notification failed (data was saved):", err.message);
  }
}

// tiny in-memory rate limiter for public POST endpoints
const hits = new Map();
function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = req.ip + ":" + req.path;
    const now = Date.now();
    const rec = hits.get(key) || { count: 0, start: now };
    if (now - rec.start > windowMs) { rec.count = 0; rec.start = now; }
    rec.count++;
    hits.set(key, rec);
    if (hits.size > 5000) hits.clear(); // keep memory bounded
    if (rec.count > max) {
      return res.status(429).json({ success: false, message: "Too many requests — please try again later" });
    }
    next();
  };
}

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

function validateSurvey(req, res, next) {
  const errors = [];
  const body = req.body;

  // cap free-text lengths so nobody can store essays (or worse) in the DB
  const MAX_TEXT = 2000;
  ["reasonInvestment", "priorityOverEarth", "astronomyPerception", "humanIdentity", "awarenessTrend"]
    .forEach((f) => {
      if (typeof body[f] === "string" && body[f].length > MAX_TEXT) {
        errors.push(`${f} must be under ${MAX_TEXT} characters`);
      }
    });
  if (typeof body.name === "string" && body.name.length > 120) {
    errors.push("Name must be under 120 characters");
  }

  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    errors.push("Name is required");
  }

  if (!body.age || typeof body.age !== "number" || body.age < 1 || body.age > 120) {
    errors.push("Valid age (1-120) is required");
  }

  const validAreas = ["Rural", "Semi-rural", "Semi-urban", "Urban"];
  if (!body.area || !validAreas.includes(body.area)) {
    errors.push("Valid area selection is required");
  }

  const validSkyDarkness = [
    "Very bright",
    "Bright",
    "Moderately dark",
    "Dark",
    "Very dark",
  ];
  if (!body.nightSky || !validSkyDarkness.includes(body.nightSky)) {
    errors.push("Night sky darkness selection is required");
  }

  const validMilkyWay = ["Yes, clearly", "Faintly", "Occasionally", "No, never", "Not sure"];
  if (!body.milkyWay || !validMilkyWay.includes(body.milkyWay)) {
    errors.push("Milky Way visibility selection is required");
  }

  const validMystery = [
    "Dark matter / Dark energy",
    "Black holes",
    "Origin of the universe",
    "Multiverse theory",
    "Extraterrestrial life",
  ];
  if (!body.mystery || !validMystery.includes(body.mystery)) {
    errors.push("Mysterious space selection is required");
  }

  if (
    !body.alienLikelihood ||
    typeof body.alienLikelihood !== "number" ||
    body.alienLikelihood < 1 ||
    body.alienLikelihood > 5
  ) {
    errors.push("Alien life likelihood (1-5) is required");
  }

  if (!Array.isArray(body.celestialEvents) || body.celestialEvents.length === 0) {
    errors.push("At least one celestial event must be selected");
  }

  const validPowerOutage = ["Very often", "Sometimes", "Rarely", "Never", "No idea"];
  if (!body.powerOutageEffect || !validPowerOutage.includes(body.powerOutageEffect)) {
    errors.push("Power outage effect selection is required");
  }

  const validMissions = [
    "Artemis",
    "Mars Sample Return",
    "Europa Clipper",
    "Interstellar Probe",
    "Gaganyaan",
  ];
  if (!body.futureMission || !validMissions.includes(body.futureMission)) {
    errors.push("Future mission selection is required");
  }

  const validGovtInvestment = [
    "Yes, much more",
    "A little more",
    "Current level is fine",
    "Less",
    "Should not invest",
  ];
  if (!body.govtInvestment || !validGovtInvestment.includes(body.govtInvestment)) {
    errors.push("Government investment opinion is required");
  }

  if (
    !body.reasonInvestment ||
    typeof body.reasonInvestment !== "string" ||
    body.reasonInvestment.trim().length === 0
  ) {
    errors.push("Investment reasoning is required");
  }

  const validBenefits = [
    "Technology & innovation",
    "Understanding the universe",
    "Protecting Earth",
    "Discovering life",
    "Human survival",
    "Inspiration",
  ];
  if (!body.biggestBenefit || !validBenefits.includes(body.biggestBenefit)) {
    errors.push("Biggest benefit selection is required");
  }

  if (!Array.isArray(body.supportMore) || body.supportMore.length === 0) {
    errors.push("At least one support option must be selected");
  }

  if (
    !body.priorityOverEarth ||
    typeof body.priorityOverEarth !== "string" ||
    body.priorityOverEarth.trim().length === 0
  ) {
    errors.push("Prioritization answer is required");
  }

  if (
    !body.astronomyPerception ||
    typeof body.astronomyPerception !== "string" ||
    body.astronomyPerception.trim().length === 0
  ) {
    errors.push("Astronomy perception answer is required");
  }

  if (
    !body.humanIdentity ||
    typeof body.humanIdentity !== "string" ||
    body.humanIdentity.trim().length === 0
  ) {
    errors.push("Human identity answer is required");
  }

  if (
    !body.awarenessTrend ||
    typeof body.awarenessTrend !== "string" ||
    body.awarenessTrend.trim().length === 0
  ) {
    errors.push("Awareness trend answer is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
}

app.use(express.json({ limit: "64kb" }));
// resolve relative to this file, not the process cwd
app.use(express.static(path.join(__dirname, "public")));

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI missing in environment");
  process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
  console.error("RESEND_API_KEY missing in environment");
  process.exit(1);
}

if (!process.env.ADMIN_EMAIL) {
  console.error("ADMIN_EMAIL missing in environment");
  process.exit(1);
}

mongoose
  .connect(uri)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.post("/submit-survey", rateLimit(6, 10 * 60 * 1000), validateSurvey, async (req, res) => {
  try {
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
    // an email hiccup must not turn a saved survey into a 500
    await notify("New Survey Submitted", `New survey submitted by: ${sanitizedData.name}`);

    res.json({
      success: true,
      message: "Survey response saved successfully",
    });
  } catch (error) {
    console.error("Error saving survey:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save survey response",
    });
  }
});

app.post("/contact", rateLimit(5, 10 * 60 * 1000), async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required",
      });
    }
    if (name.length > 120 || email.length > 254 || message.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "One of the fields is too long",
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // only the fields we expect — never the raw request body
    const contact = new Contact({ name, email, message });
    await contact.save();
    await notify(
      "New Contact Message",
      `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`
    );

    res.json({
      success: true,
      message: "Contact message sent successfully",
    });
  } catch (error) {
    console.error("Error saving contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save contact message",
    });
  }
});

app.get("/admin/surveys", adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Survey.countDocuments();
    const surveys = await Survey.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: surveys,
    });
  } catch (error) {
    console.error("Error fetching surveys:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch survey responses",
    });
  }
});

app.get("/admin/contacts", adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Contact.countDocuments();
    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: contacts,
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact messages",
    });
  }
});

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
    console.error("Error fetching survey:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch survey",
    });
  }
});

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
    console.error("Error deleting survey:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete survey",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
