exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { name, email, message } = payload;

  if (!name || !email || !message) {
    return { statusCode: 400, body: "Missing required fields" };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "RESEND_API_KEY env variable is not set" }) 
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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

    // Return the full Resend response so we can see exactly what went wrong
    const resBody = await res.text();

    if (!res.ok) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ 
          error: "Resend API error", 
          status: res.status, 
          details: resBody 
        }) 
      };
    }

    return { statusCode: 200, body: "OK" };

  } catch (err) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Unexpected error", details: err.message }) 
    };
  }
};