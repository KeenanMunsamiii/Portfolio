/*const contactForm = document.getElementById("contactForm");
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
}*/

exports.handler = async function (event) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Parse body
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { name, email, message } = payload;

  // Basic validation
  if (!name || !email || !message) {
    return { statusCode: 400, body: "Missing required fields" };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return { statusCode: 500, body: "Server misconfiguration" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // ⚠️  Change this to your real email address
        from: "Portfolio Contact <onboarding@resend.dev>",
        to: ["keenanmunsamiii@gmail.com"], 
        reply_to: email,
        subject: `New message from ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: auto;">
            <h2 style="color: #0ea5e9; margin-bottom: 4px;">New Contact Form Submission</h2>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20px;" />

            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>

            <p style="margin-top: 16px;"><strong>Message:</strong></p>
            <p style="background: #f9fafb; border-left: 3px solid #0ea5e9; padding: 12px 16px; border-radius: 4px; white-space: pre-wrap;">${message}</p>

            <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">Sent from your portfolio contact form.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend error:", error);
      return { statusCode: 500, body: "Failed to send email" };
    }

    return { statusCode: 200, body: "OK" };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { statusCode: 500, body: "Server error" };
  }
};