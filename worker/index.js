const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
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
