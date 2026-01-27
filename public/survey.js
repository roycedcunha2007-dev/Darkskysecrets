document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("surveyForm");

  if (!form) {
    console.error("❌ surveyForm not found");
    return;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // ======================
    // BASIC FIELDS
    // ======================
    const name = document.getElementById("username")?.value || "Anonymous";
    const age = document.querySelector('input[type="number"]')?.value || null;

    // ======================
    // SELECT QUESTIONS (ORDER MATTERS – matches your HTML)
    // ======================
    const selects = document.querySelectorAll("select");

    const area = selects[0]?.value || "";
    const nightSky = selects[1]?.value || "";
    const milkyWay = selects[2]?.value || "";
    const mystery = selects[3]?.value || "";
    const alienLikelihood = Number(selects[4]?.value?.charAt(0)) || null;
    const powerOutageEffect = selects[5]?.value || "";
    const futureMission = selects[6]?.value || "";
    const govtInvestment = selects[7]?.value || "";
    const biggestBenefit = selects[8]?.value || "";

    // ======================
    // TEXTAREA QUESTIONS
    // ======================
    const textareas = document.querySelectorAll("textarea");

    const reasonInvestment = textareas[0]?.value || "";
    const priorityOverEarth = textareas[1]?.value || "";
    const astronomyPerception = textareas[2]?.value || "";
    const humanIdentity = textareas[3]?.value || "";
    const awarenessTrend = textareas[4]?.value || "";

    // ======================
    // CHECKBOX GROUPS
    // ======================
    const getCheckedValues = (labels) =>
      Array.from(labels)
        .filter(label => label.querySelector("input")?.checked)
        .map(label => label.textContent.trim());

    const checkboxGroups = document.querySelectorAll(".options");

    const celestialEvents = getCheckedValues(
      checkboxGroups[0]?.querySelectorAll("label") || []
    );

    const supportMore = getCheckedValues(
      checkboxGroups[1]?.querySelectorAll("label") || []
    );

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

      if (data.success) {
        alert("Survey submitted successfully!");
      } else {
        alert("Submission failed");
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      alert("Something went wrong!");
    }
  });
});


