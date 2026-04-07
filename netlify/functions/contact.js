const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    formStatus.textContent = "Sending...";

    const formData = new FormData(contactForm);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      message: String(formData.get("message") || ""),
    };

    try {
      const res = await fetch("/.netlify/functions/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        formStatus.textContent = "Message sent. Thank you!";
        contactForm.reset();
      } else {
        formStatus.textContent = "Failed to send. Please try again.";
      }
    } catch {
      formStatus.textContent = "Network error. Please try again.";
    }
  });
}