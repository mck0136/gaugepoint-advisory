import { submitContact } from "../worker/contact-service.js";

export const config = {
  maxDuration: 10
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false, message: "Method not allowed." });
  }

  const contentLength = Number(request.headers["content-length"] || 0);
  if (contentLength > 20000) {
    return response.status(413).json({ ok: false, message: "Submission is too large." });
  }

  let payload = request.body;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      return response.status(400).json({ ok: false, message: "Invalid submission." });
    }
  }

  const result = await submitContact(payload, process.env);
  return response.status(result.status).json(result.body);
}
