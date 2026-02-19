document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("surveyForm");
  if (!form) {
    console.error("❌ surveyForm not found");
    return;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // ======================
    // REMOVE PREVIOUS ERRORS
    // ======================
    document.querySelectorAll('.card.error').forEach(card => {
      card.classList.remove('error');
    });

    let isValid = true;
    let firstErrorElement = null;
    const errors = [];

    // ======================
    // VALIDATION HELPER
    // ======================
    const markError = (questionNum, message) => {
      const card = document.querySelector(`[data-question="${questionNum}"]`);
      if (card) {
        card.classList.add('error');
        if (!firstErrorElement) firstErrorElement = card;
      }
      errors.push(message);
      isValid = false;
    };

    // ======================
    // BASIC FIELDS VALIDATION
    // ======================
    const name = document.getElementById("username")?.value?.trim();
    if (!name) {
      markError(1, "Name is required");
    }

    const age = document.getElementById("age")?.value;
    if (!age || age < 1 || age > 120) {
      markError(2, "Valid age is required");
    }

    // ======================
    // SELECT QUESTIONS VALIDATION
    // ======================
    const area = document.getElementById("area")?.value;
    if (!area) {
      markError(3, "Area selection is required");
    }

    const nightSky = document.getElementById("sky_darkness")?.value;
    if (!nightSky) {
      markError(4, "Night sky darkness selection is required");
    }

    const milkyWay = document.getElementById("milky_way")?.value;
    if (!milkyWay) {
      markError(5, "Milky Way visibility selection is required");
    }

    const mystery = document.getElementById("mysterious_space")?.value;
    if (!mystery) {
      markError(6, "Mysterious space selection is required");
    }

    const alienLifeValue = document.getElementById("alien_life")?.value;
    if (!alienLifeValue) {
      markError(7, "Alien life likelihood selection is required");
    }
    const alienLikelihood = alienLifeValue ? Number(alienLifeValue.charAt(0)) : null;

    // ======================
    // CHECKBOX VALIDATION - CELESTIAL EVENTS
    // ======================
    const celestialEventsChecked = document.querySelectorAll('input[name="celestial_events"]:checked');
    if (celestialEventsChecked.length === 0) {
      markError(8, "Please select at least one celestial event");
    }
    const celestialEvents = Array.from(celestialEventsChecked).map(cb => cb.value);

    // ======================
    // MORE SELECT VALIDATIONS
    // ======================
    const powerOutageEffect = document.getElementById("power_outages")?.value;
    if (!powerOutageEffect) {
      markError(9, "Power outage effect selection is required");
    }

    const futureMission = document.getElementById("future_mission")?.value;
    if (!futureMission) {
      markError(10, "Future mission selection is required");
    }

    const govtInvestment = document.getElementById("govt_investment")?.value;
    if (!govtInvestment) {
      markError(11, "Government investment opinion is required");
    }

    // ======================
    // TEXTAREA VALIDATIONS
    // ======================
    const reasonInvestment = document.getElementById("investment_reason")?.value?.trim();
    if (!reasonInvestment) {
      markError(12, "Investment reasoning is required");
    }

    const biggestBenefit = document.getElementById("biggest_benefit")?.value;
    if (!biggestBenefit) {
      markError(13, "Biggest benefit selection is required");
    }

    // ======================
    // CHECKBOX VALIDATION - SUPPORT MORE
    // ======================
    const supportMoreChecked = document.querySelectorAll('input[name="support_more"]:checked');
    if (supportMoreChecked.length === 0) {
      markError(14, "Please select at least one support option");
    }
    const supportMore = Array.from(supportMoreChecked).map(cb => cb.value);

    const priorityOverEarth = document.getElementById("prioritization")?.value?.trim();
    if (!priorityOverEarth) {
      markError(15, "Prioritization answer is required");
    }

    const astronomyPerception = document.getElementById("area_perception")?.value?.trim();
    if (!astronomyPerception) {
      markError(16, "Astronomy perception answer is required");
    }

    const humanIdentity = document.getElementById("human_identity")?.value?.trim();
    if (!humanIdentity) {
      markError(17, "Human identity answer is required");
    }

    const awarenessTrend = document.getElementById("awareness_trend")?.value?.trim();
    if (!awarenessTrend) {
      markError(18, "Awareness trend answer is required");
    }

    // ======================
    // IF VALIDATION FAILS
    // ======================
    if (!isValid) {
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      alert(`Please fill in all required fields:\n\n${errors.join('\n')}`);
      return;
    }

    // ======================
    // FINAL PAYLOAD
    // ======================
    const payload = {
      name,
      age: age ? Number(age) : null,
      area,
      nightSky,
      milkyWay,
      mystery,
      alienLikelihood,
      celestialEvents,
      powerOutageEffect,
      futureMission,
      govtInvestment,
      reasonInvestment,
      biggestBenefit,
      supportMore,
      priorityOverEarth,
      astronomyPerception,
      humanIdentity,
      awarenessTrend,
    };

    console.log("📤 Sending payload:", payload);

    // Disable submit button during submission
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      const response = await fetch("/submit-survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("✅ Server response:", data);

      if (response.ok && data.success) {
        // Show certificate on success
        const certName = document.getElementById("certName");
        const cert = document.getElementById("certificate");
        if (certName && cert) {
          certName.textContent = name;
          cert.style.display = "flex";
        }
        alert("Survey submitted successfully! 🎉");
      } else {
        alert(data.message || "Submission failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      alert("Something went wrong! Please check your connection and try again.");
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});

