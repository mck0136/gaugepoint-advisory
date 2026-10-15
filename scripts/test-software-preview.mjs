import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const previewRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "ai-native-development");
const html = readFileSync(path.join(previewRoot, "index.html"), "utf8");

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/g)].map(([, key, , value]) => [key, value]));
}

function classTags(source, className, tagName = String.raw`[a-z][\w-]*`) {
  return [...source.matchAll(new RegExp(`<${tagName}\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, "gi"))]
    .map(([tag]) => ({ tag, attrs: attributes(tag) }))
    .filter(({ attrs }) => attrs.class?.split(/\s+/).includes(className));
}

function elementBody(source, className) {
  const opening = new RegExp(`<div\\b(?=[^>]*\\bclass=["'][^"']*\\b${className}\\b)[^>]*>`, "i").exec(source);
  if (!opening) return null;
  const tokens = /<div\b[^>]*>|<\/div\s*>/gi;
  tokens.lastIndex = opening.index;
  let depth = 0;
  let match;
  while ((match = tokens.exec(source))) {
    depth += /^<div\b/i.test(match[0]) ? 1 : -1;
    if (depth === 0) return source.slice(opening.index + opening[0].length, match.index);
  }
  return null;
}

function divContent(source, className) {
  const opening = new RegExp(`<div\\b(?=[^>]*\\bclass=["'][^"']*\\b${className}\\b)[^>]*>`, "i").exec(source);
  if (!opening) return null;
  const tokens = /<div\b[^>]*>|<\/div\s*>/gi;
  tokens.lastIndex = opening.index;
  let depth = 0;
  let match;
  while ((match = tokens.exec(source))) {
    depth += /^<div\b/i.test(match[0]) ? 1 : -1;
    if (depth === 0) return source.slice(opening.index + opening[0].length, match.index);
  }
  return null;
}

test("SaaS preview expresses the business-to-vendor arrangement and original tradeoffs", () => {
  const model = html.match(/<[^>]+\bid=["']saas-arrangement["'][^>]*>/i)?.[0];
  assert.ok(model, "SaaS model has the stable saas-arrangement id");
  assert.match(model, /\bclass=["'][^"']*\bgp-model\b[^"']*\bsaas-model\b|\bclass=["'][^"']*\bsaas-model\b[^"']*\bgp-model\b/i);

  const linkedStylesheets = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map(([tag]) => attributes(tag))
    .filter(({ rel }) => rel?.split(/\s+/).includes("stylesheet"));
  const saasStylesheet = linkedStylesheets.find(({ href }) => /(?:^|\/)saas-arrangement\.css(?:\?|$)/.test(href ?? ""));
  assert.ok(saasStylesheet, "saas-arrangement.css is linked");

  const diagram = divContent(html, "dependency-network");
  assert.ok(diagram, "diagram shows the organizational dependency network");
  assert.equal(classTags(diagram, "dependency-team").length, 3);
  assert.equal(classTags(diagram, "dependency-app").length, 3);
  assert.equal(classTags(diagram, "dependency-bridge").length, 3);
  assert.equal(classTags(diagram, "dependency-signal").length, 3);
  assert.deepEqual(classTags(diagram, "dependency-app").map(({ attrs }) => attrs['data-dependency-app']), ['tms', 'portal', 'erp']);
  assert.doesNotMatch(diagram, /\bdata-platform=/, 'diagram nodes must not mount live platform concepts');
  for (const label of ['OPERATIONS', 'CUSTOMER SERVICE', 'FINANCE', 'Shipment data from TMS', 'Delivery data from TMS']) assert.ok(diagram.includes(label));
  const action = html.match(/<button\b[^>]*\bdata-vendor-change[^>]*>/)[0];
  assert.match(action, /type="button"/);
  assert.match(action, /aria-controls="dependency-network dependency-result"/);
  assert.match(action, /\bhidden\b/);
  assert.match(action, /\bdisabled\b/);
  assert.match(html, /id="dependency-result" role="status" aria-live="polite"/);
  assert.match(html, /In this example, dispatch, customer updates and billing all use TMS data/);
  assert.doesNotMatch(html, /class=["'][^"']*\bnetwork-links\b|class=["'][^"']*\bnetwork-node\b/i);

  const tradeoffs = html.match(/<ol\b[^>]*class=["'][^"']*\bsaas-tradeoffs\b[^"']*["'][^>]*>([\s\S]*?)<\/ol>/i);
  assert.ok(tradeoffs, "tradeoffs are an ordered list");
  const items = [...tradeoffs[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(([, item]) =>
    item.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim()
  );
  assert.deepEqual(items, [
    "Recurring costs compound.",
    "Vendors set the product direction.",
    "Teams adapt to product limits."
  ]);
});

test("platform concepts are reordered while ids remain stable by platform", () => {
  const tabsContent = elementBody(html, "demo-tabs");
  assert.ok(tabsContent, "platform demo tabs exist");
  const tabs = [...tabsContent.matchAll(/<([a-z][\w-]*)\b[^>]*class=["'][^"']*\bdemo-tab\b[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi)]
    .map(([, , body]) => body);
  const tabTags = [...tabsContent.matchAll(/<([a-z][\w-]*)\b[^>]*class=["'][^"']*\bdemo-tab\b[^"']*["'][^>]*>/gi)].map(([tag]) => tag);
  assert.equal(tabs.length, 3);
  const tabInfo = tabTags.map((tag, index) => ({
    id: attributes(tag).id,
    concept: attributes(tag)["data-demo"],
    number: tabs[index].match(/<span\b[^>]*>\s*(\d+)\s*<\/span>/i)?.[1],
    copy: tabs[index].replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()
  }));
  assert.deepEqual(tabInfo.map(({ concept }) => concept), ["commercial", "portal", "managed"]);
  assert.deepEqual(tabInfo.map(({ number }) => number), ["01", "02", "03"]);
  assert.deepEqual(tabInfo.map(({ id }) => id), ["request-tab-2", "request-tab-3", "request-tab-1"]);
  assert.match(tabInfo[0].copy, /Milemark/);
  assert.match(tabInfo[1].copy, /Folio/);
  assert.match(tabInfo[2].copy, /Relayport/);

  const panels = [...html.matchAll(/<section\b(?=[^>]*\bclass=["'][^"']*\bdemo-panel\b)([^>]*)>([\s\S]*?)<\/section>/gi)]
    .map(([, attrText, body]) => ({ attrs: attributes(`<section ${attrText}>`), body }));
  assert.deepEqual(panels.map(({ attrs }) => attrs["data-preview"]), ["commercial", "portal", "managed"]);
  assert.deepEqual(panels.map(({ attrs }) => attrs.id), ["request-panel-2", "request-panel-3", "request-panel-1"]);
  assert.ok(panels.every(({ attrs }) => !Object.hasOwn(attrs, "hidden")), "panels remain present without hidden attributes");
  assert.ok(panels.every(({ body }) => /class=["'][^"']*\bplatform-fallback\b/.test(body) && /<p\b[^>]*>\s*[^<\s]/i.test(body)), "every panel retains readable fallback content");
});

test("dependency pairs stay adjacent on mobile and the changed state highlights organizational effects", () => {
  const cssPath = path.join(previewRoot, "saas-arrangement.css");
  const css = readFileSync(cssPath, "utf8");
  const mobile = css.match(/@media\s*\(max-width:\s*760px\)\s*\{([\s\S]*?)\n\}/i)?.[1];
  assert.ok(mobile, "diagram has a 760px mobile breakpoint");
  assert.match(css, /grid-template-columns\s*:[^;]*minmax\(\s*0\s*,\s*1fr\s*\)/i, "layout uses shrinkable minmax tracks");
  assert.match(css, /\.dependency-lanes\s*>\s*li\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) var\(--dep-gap\) minmax\(0, 1fr\)/);
  assert.match(mobile, /--dep-gap:\s*32px/);
  assert.match(css, /data-vendor-changed="true"\][^}]*\.dependency-impact\s*\{[^}]*font-weight:\s*500/);
  assert.match(css, /\.dependency-team \.dependency-impact\s*\{[^}]*min-height:/);
  assert.doesNotMatch(css, /network-line|network-links|network-node|@keyframes|transform\s*:\s*scale\s*\(/i);
  assert.doesNotMatch(css, /(?:font-size|zoom)\s*:\s*(?:[1-9]px|0\.[0-9]+(?:px)?)/i, "diagram avoids tiny forced scaling");
});
