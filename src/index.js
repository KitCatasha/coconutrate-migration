function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact" && request.method === "POST") {
      try {
        const contentType = request.headers.get("content-type") || "";

        let data;

        if (contentType.includes("application/json")) {
          data = await request.json();
        } else {
          const formData = await request.formData();
          data = Object.fromEntries(formData);
        }

        const firstName = String(data.first_name || "").trim();
        const lastName = String(data.last_name || "").trim();
        const email = String(data.email || "").trim();

        const subject = String(data.subject || "")
          .replace(/[\r\n]+/g, " ")
          .trim();

        const message = String(data.message || "").trim();

        if (!firstName || !lastName || !email || !subject || !message) {
          return Response.json(
            {
              success: false,
              message: "Please fill in all required fields.",
            },
            { status: 400 }
          );
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
          return Response.json(
            {
              success: false,
              message: "Please enter a valid email address.",
            },
            { status: 400 }
          );
        }

        if (
          firstName.length > 100 ||
          lastName.length > 100 ||
          email.length > 254 ||
          subject.length > 150 ||
          message.length > 5000
        ) {
          return Response.json(
            {
              success: false,
              message: "Your message is too long.",
            },
            { status: 400 }
          );
        }

        const fullName = `${firstName} ${lastName}`;

        await env.EMAIL.send({
          from: {
            email: "contact@coconutrate.com",
            name: "Coconutrate",
          },

          to: "dmachate@yahoo.com",

          replyTo: {
            email: email,
            name: fullName,
          },

          subject: `[COCONUTRATE] ${subject} — ${fullName}`,

          html: `
            <h2>Coconutrate Website Inquiry</h2>

            <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>

            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replaceAll("\n", "<br>")}</p>
          `,

          text:
            `COCONUTRATE WEBSITE INQUIRY\n\n` +
            `Name: ${fullName}\n` +
            `Email: ${email}\n` +
            `Subject: ${subject}\n\n` +
            `Message:\n${message}`,
        });

        return Response.json({
          success: true,
          message:
            "Thanks for your message. We will respond as soon as possible.",
        });
      } catch (error) {
        console.error("Contact form error:", error);

        return Response.json(
          {
            success: false,
            message: "Something went wrong. Please try again.",
          },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  },
};