const worker = {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== "GET") {
      return response;
    }

    const url = new URL(request.url);
    if (url.pathname.includes(".")) {
      return response;
    }

    const directoryPath = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
    const fallbackUrl = new URL(`${directoryPath}index.html`, url);
    return env.ASSETS.fetch(new Request(fallbackUrl, request));
  }
};

export default worker;
