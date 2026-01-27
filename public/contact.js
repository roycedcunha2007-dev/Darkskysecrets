document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".contact-form");

  if (!form) {
    console.error("❌ Contact form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.querySelector("input[type='text']").value;
    const email = form.querySelector("input[type='email']").value;
    const message = form.querySelector("textarea").value;

    const payload = { name, email, message };

    console.log("📤 Sending contact message:", payload);

    try {
      const res = await fetch("/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        alert("Message sent successfully 🚀");
        form.reset();
      } else {
        alert("Failed to send message");
      }
    } catch (err) {
      console.error("❌ Contact fetch error:", err);
      alert("Something went wrong");
    }
  });
});
