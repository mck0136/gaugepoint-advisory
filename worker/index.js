import { submitContact } from "./contact-service.js";

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") {
        return Response.json(
          { ok: false, message: "Method not allowed." },
          { status: 405, headers: { Allow: "POST" } }
        );
      }

      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength > 20000) {
        return Response.json({ ok: false, message: "Submission is too large." }, { status: 413 });
      }

      let payload;
      try {
        payload = await request.json();
      } catch {
        return Response.json({ ok: false, message: "Invalid submission." }, { status: 400 });
      }

      const result = await submitContact(payload, env);
      return Response.json(result.body, { status: result.status });
    }

    if (
      request.method === "GET" &&
      (url.pathname === "/insights" || url.pathname === "/insights/")
    ) {
      return Response.redirect(new URL("/insights/freight-market-tightening/", url), 301);
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== "GET") {
      return response;
    }

    if (url.pathname.includes(".")) {
      return response;
    }

    const directoryPath = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
    const fallbackUrl = new URL(`${directoryPath}index.html`, url);
    return env.ASSETS.fetch(new Request(fallbackUrl, request));
  }
};

export default worker;
