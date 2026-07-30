const FIELD_LIMITS = {
  name: 120,
  company: 160,
  email: 254,
  role: 160,
  businessType: 160,
  timeframe: 120,
  challenge: 4000,
  initiative: 3000
};

const cleanText = (value, maxLength) =>
  String(value ?? "").trim().replace(/\r\n?/g, "\n").slice(0, maxLength);

const cleanSubjectText = (value, maxLength) =>
  cleanText(value, maxLength).replace(/[\r\n]+/g, " ");

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const isEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[\r\n]/.test(value);

const line = (label, value) => `${label}: ${value || "Not provided"}`;

const htmlRow = (label, value) => `
  <tr>
    <th align="left" style="padding:8px 16px 8px 0;color:#466078;font:600 12px/1.4 Arial,sans-serif;text-transform:uppercase;vertical-align:top">${escapeHtml(label)}</th>
    <td style="padding:8px 0;color:#0b1825;font:400 15px/1.5 Arial,sans-serif">${escapeHtml(value || "Not provided").replaceAll("\n", "<br>")}</td>
  </tr>`;

export async function submitContact(payload, env = {}) {
  const website = cleanText(payload?.website, 200);
  const startedAt = Number(payload?.startedAt);
  const elapsed = Date.now() - startedAt;

  // Silently accept common bot patterns so the form cannot be used as a feedback oracle.
  if (website || !Number.isFinite(startedAt) || elapsed < 1500 || elapsed > 86400000) {
    return {
      status: 200,
      body: { ok: true, message: "Thank you. Your inquiry has been sent to Mark." }
    };
  }

  const data = {
    name: cleanText(payload?.name, FIELD_LIMITS.name),
    company: cleanText(payload?.company, FIELD_LIMITS.company),
    email: cleanText(payload?.email, FIELD_LIMITS.email).toLowerCase(),
    role: cleanText(payload?.role, FIELD_LIMITS.role),
    businessType: cleanText(payload?.["business-type"], FIELD_LIMITS.businessType),
    timeframe: cleanText(payload?.timeframe, FIELD_LIMITS.timeframe),
    challenge: cleanText(payload?.challenge, FIELD_LIMITS.challenge),
    initiative: cleanText(payload?.initiative, FIELD_LIMITS.initiative)
  };

  if (!data.name || !data.company || !data.email || !data.challenge || !isEmail(data.email)) {
    return {
      status: 400,
      body: { ok: false, message: "Please complete the required fields and provide a valid email address." }
    };
  }

  if (!env.RESEND_API_KEY) {
    return {
      status: 503,
      body: { ok: false, message: "Form delivery is temporarily unavailable. Please try again shortly." }
    };
  }

  const recipient = env.CONTACT_TO_EMAIL || "mark.mckendry@gaugepointconsulting.com";
  const sender = env.CONTACT_FROM_EMAIL || "Gaugepoint Website <info@gaugepointconsulting.com>";
  const subject = `New Gaugepoint inquiry: ${cleanSubjectText(data.company, 80)}`;

  const text = [
    "New inquiry from gaugepointconsulting.com",
    "",
    line("Name", data.name),
    line("Company", data.company),
    line("Email", data.email),
    line("Role", data.role),
    line("Type of business", data.businessType),
    line("Desired timeframe", data.timeframe),
    "",
    "Primary operating challenge:",
    data.challenge,
    "",
    "Current AI or automation initiative:",
    data.initiative || "Not provided"
  ].join("\n");

  const html = `
    <div style="max-width:680px;margin:0 auto;padding:32px;background:#f4f5f3">
      <div style="padding:32px;background:#ffffff;border-top:4px solid #d2a34a">
        <p style="margin:0 0 8px;color:#a67622;font:600 12px/1.4 monospace;letter-spacing:.08em;text-transform:uppercase">Gaugepoint website inquiry</p>
        <h1 style="margin:0 0 24px;color:#0b1825;font:600 28px/1.1 Arial,sans-serif">${escapeHtml(data.company)}</h1>
        <table role="presentation" style="width:100%;border-collapse:collapse">
          ${htmlRow("Name", data.name)}
          ${htmlRow("Company", data.company)}
          ${htmlRow("Email", data.email)}
          ${htmlRow("Role", data.role)}
          ${htmlRow("Business type", data.businessType)}
          ${htmlRow("Timeframe", data.timeframe)}
          ${htmlRow("Operating challenge", data.challenge)}
          ${htmlRow("AI or automation initiative", data.initiative)}
        </table>
      </div>
    </div>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: data.email,
        subject,
        text,
        html
      })
    });

    if (!response.ok) {
      const providerMessage = await response.text();
      console.error(`Resend delivery failed (${response.status}): ${providerMessage.slice(0, 500)}`);
      return {
        status: 502,
        body: { ok: false, message: "We could not send your inquiry. Please try again in a moment." }
      };
    }
  } catch (error) {
    console.error("Contact delivery failed:", error instanceof Error ? error.message : "Unknown error");
    return {
      status: 502,
      body: { ok: false, message: "We could not send your inquiry. Please try again in a moment." }
    };
  }

  return {
    status: 200,
    body: { ok: true, message: "Thank you. Your inquiry has been sent to Mark." }
  };
}
