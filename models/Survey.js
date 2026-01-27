const mongoose = require("mongoose");

const surveySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      required: false,          // ✅ not hard-required
      min: 1,
      max: 120,
    },

    area: {
      type: String,
      default: "",
    },

    nightSky: {
      type: String,
      default: "",
    },

    milkyWay: {
      type: String,
      default: "",
    },

    mystery: {
      type: String,
      default: "",
    },

    alienLikelihood: {
      type: Number,
      min: 0,
      max: 10,
    },

    celestialEvents: {
      type: [String],
      default: [],
    },

    powerOutageEffect: {
      type: String,
      default: "",
    },

    futureMission: {
      type: String,
      default: "",
    },

    govtInvestment: {
      type: String,
      default: "",
    },

    reasonInvestment: {
      type: String,
      default: "",
    },

    biggestBenefit: {
      type: String,
      default: "",
    },

    supportMore: {
      type: [String],
      default: [],
    },

    priorityOverEarth: {
      type: String,
      default: "",
    },

    astronomyPerception: {
      type: String,
      default: "",
    },

    humanIdentity: {
      type: String,
      default: "",
    },

    awarenessTrend: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Survey", surveySchema);
