import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientRoot = path.join(projectRoot, "dist", "client");
const serverRoot = path.join(projectRoot, "dist", "server");

const siteEntries = [
  "index.html",
  "styles.css",
  "script.js",
  "content-data.js",
  "assets/gaugepoint-advisory.png",
  "assets/gaugepoint-advisory-lockup.png",
  "assets/hero-intermodal-yard.png",
  "assets/transport-yard-observe-poster.jpg",
  "assets/transport-yard-observe.mp4",
  "ai-readiness",
  "operating-transformation",
  "ai-in-transportation",
  "insights",
  "speaking-media",
  "about",
  "contact"
];

await rm(path.join(projectRoot, "dist"), { recursive: true, force: true });
await mkdir(clientRoot, { recursive: true });
await mkdir(serverRoot, { recursive: true });
await mkdir(path.join(clientRoot, "assets"), { recursive: true });

for (const entry of siteEntries) {
  await cp(path.join(projectRoot, entry), path.join(clientRoot, entry), { recursive: true });
}

await cp(path.join(projectRoot, "worker", "index.js"), path.join(serverRoot, "index.js"));
