import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.join(projectRoot, "ai-native-development");
const read = (file) => readFileSync(path.join(workspaceRoot, file), "utf8");
const html = read("index.html");
const rootHtml = readFileSync(path.join(projectRoot, "index.html"), "utf8");
const dataScript = read("workspace-data.js");
const bootstrapScript = read("workspace.js");
const buildScript = readFileSync(path.join(projectRoot, "scripts/build.mjs"), "utf8");
const navigationScript = readFileSync(path.join(projectRoot, "script.js"), "utf8");
const rendererFiles = {
  managed: "workspace-managed.js",
  commercial: "workspace-commercial.js",
  portal: "workspace-portal.js"
};
const rendererScripts = Object.fromEntries(Object.entries(rendererFiles).map(([key, file]) => [key, read(file)]));

function evaluateData() {
  const window = {};
  vm.runInNewContext(dataScript, { window }, { filename: "workspace-data.js" });
  return window.GaugepointWorkspace;
}

function createRoot(platform, fallback) {
  return { dataset: { platform }, innerHTML: fallback };
}

test("workspace data is exposed by a classic-script IIFE and every row matches its view schema", () => {
  const workspace = evaluateData();
  assert.deepEqual(Object.keys(workspace.platforms), ["managed", "commercial", "portal"]);
  assert.deepEqual(Object.keys(workspace.mounts), []);
  assert.equal(typeof workspace.filterRows, "function");

  for (const [platformKey, platform] of Object.entries(workspace.platforms)) {
    assert.ok(platform.name && platform.organization && platform.role, `${platformKey} identity is complete`);
    assert.ok(platform.metrics.length > 0, `${platformKey} has metrics`);
    assert.ok(platform.insight.title && platform.insight.text, `${platformKey} has a complete insight`);
    assert.ok(platform.views[platform.insight.target], `${platformKey} insight points to an existing view`);

    for (const [viewKey, view] of Object.entries(platform.views)) {
      assert.ok(view.label && view.title && view.description, `${platformKey}.${viewKey} has descriptive metadata`);
      assert.ok(view.columns.length > 0, `${platformKey}.${viewKey} has columns`);
      assert.ok(view.rows.length > 0, `${platformKey}.${viewKey} has sample rows`);
      assert.equal(new Set(view.rows.map((item) => item.id)).size, view.rows.length, `${platformKey}.${viewKey} record ids are unique`);
      for (const item of view.rows) {
        assert.ok(item.id && item.detail, `${platformKey}.${viewKey} row has an id and detail`);
        assert.equal(item.values.length, view.columns.length, `${platformKey}.${viewKey}/${item.id} value count matches columns`);
        assert.ok(item.values.every((value) => typeof value === "string"), `${platformKey}.${viewKey}/${item.id} values are display strings`);
        assert.ok(item.facts.every((fact) => Array.isArray(fact) && fact.length === 2 && fact.every(Boolean)), `${platformKey}.${viewKey}/${item.id} facts are label/value pairs`);
      }
    }
  }
});

test("managed, commercial, and customer records retain a coherent shared lineage", () => {
  const { platforms } = evaluateData();
  const managed = platforms.managed.views;
  const commercial = platforms.commercial.views;
  const portal = platforms.portal.views;
  const row = (view, id) => view.rows.find((item) => item.id === id);
  const hasFact = (item, label, text) => item.facts.some(([name, value]) => name === label && value.includes(text));
  const cell = (view, item, column) => {
    const index = view.columns.indexOf(column);
    assert.notEqual(index, -1, `${view.label} declares ${column}`);
    return item.values[index];
  };

  const shipment = row(managed.shipments, "MT-48271");
  const route = row(managed.routing, "RG-018");
  const bpoCase = row(managed.bpo, "BPO-061");
  const carrierInvoice = row(managed.audit, "INV-271");
  const lane = row(commercial.lanes, "RG-018");
  const account = row(commercial.customers, "AC-014");
  const accountPlan = row(commercial.plans, "AP-014");
  const order = row(portal.orders, "NS-10482");
  const document = row(portal.documents, "DOC-271");
  const customerInvoice = row(portal.invoices, "CI-271");
  const shipperRecord = row(managed.shipper, "MT-48271");

  for (const [name, item] of Object.entries({ shipment, route, bpoCase, carrierInvoice, lane, account, accountPlan, order, document, customerInvoice, shipperRecord })) {
    assert.ok(item, `expected linked example record ${name}`);
  }
  assert.ok(route.facts.some(([, value]) => value.includes(shipment.id)));
  assert.ok(bpoCase.values.includes(shipment.id));
  assert.ok(hasFact(bpoCase, "Audit dependency", carrierInvoice.id));
  assert.ok(carrierInvoice.values.includes(shipment.id));
  assert.ok(hasFact(carrierInvoice, "Linked BPO case", bpoCase.id));
  const customer = cell(managed.shipments, shipment, "Shipper");
  assert.equal(cell(commercial.lanes, lane, "Customer"), customer);
  assert.equal(cell(commercial.customers, account, "Customer"), customer);
  assert.equal(cell(commercial.plans, accountPlan, "Customer"), customer);
  assert.equal(cell(commercial.lanes, lane, "Lane"), cell(managed.routing, route, "Lane"));
  assert.equal(cell(managed.shipments, shipment, "Lane"), cell(managed.routing, route, "Lane"));
  assert.ok(hasFact(lane, "Linked shipment", shipment.id));
  assert.ok(hasFact(lane, "Invoice exception", carrierInvoice.id));
  assert.match(account.detail, /-12\.6%/);
  assert.ok(account.detail.includes(accountPlan.id));
  assert.equal(cell(portal.orders, order, "Shipment"), shipment.id);
  assert.equal(cell(portal.orders, order, "Destination"), cell(managed.shipper, shipperRecord, "Destination"));
  assert.equal(cell(portal.orders, order, "Status"), cell(managed.shipments, shipment, "Status"));
  assert.ok(hasFact(order, "Carrier", cell(managed.routing, route, "Primary carrier")));
  const arrivalEstimate = shipment.detail.match(/Arrival estimate:\s*([^.]*)\./)?.[1];
  assert.ok(arrivalEstimate, "linked shipment provides an arrival estimate");
  assert.ok(order.detail.includes(arrivalEstimate), "customer and managed records share the arrival estimate");
  assert.ok(document.values.includes(shipment.id));
  assert.ok(document.detail.includes(bpoCase.id));
  assert.ok(customerInvoice.values.includes(shipment.id));
  assert.ok(customerInvoice.detail.includes(carrierInvoice.id));
  assert.equal(cell(portal.invoices, customerInvoice, "Amount"), cell(commercial.lanes, lane, "Revenue / move"));

  const expected = cell(managed.audit, carrierInvoice, "Expected");
  const invoiced = cell(managed.audit, carrierInvoice, "Invoiced");
  const variance = cell(managed.audit, carrierInvoice, "Variance");
  assert.equal(expected, "$1,700");
  assert.equal(invoiced, "$1,880");
  assert.equal(variance, "$180");
  assert.equal(Number(invoiced.replace(/[$,]/g, "")) - Number(expected.replace(/[$,]/g, "")), 180);
  assert.match(carrierInvoice.detail, /held for supporting evidence/);
});

test("filterRows trims and case-folds searches over display values", () => {
  const { filterRows } = evaluateData();
  const rows = [
    { id: "sample-1", values: ["Joliet to Dallas", "Canyon Freight"], detail: "Hidden detail" },
    { id: "sample-2", values: ["Columbus to Atlanta", "Summit Linehaul"], detail: "Hidden detail" }
  ];
  assert.deepEqual(Array.from(filterRows(rows, "  JOLIET "), (item) => item.id), ["sample-1"]);
  assert.deepEqual(Array.from(filterRows(rows, "canyon freight"), (item) => item.id), ["sample-1"]);
  assert.deepEqual(Array.from(filterRows(rows, "no such lane")), []);
  assert.deepEqual(Array.from(filterRows(rows, "Hidden detail")), []);
  assert.equal(filterRows(rows, "   ").length, rows.length);
});

test("concept data uses distinct organizations and USD without the previous Canadian sample copy", () => {
  const { platforms } = evaluateData();
  const organizations = {
    managed: "Relayport Logistics",
    commercial: "Milemark Freight",
    portal: "Folio Supply"
  };
  for (const [key, organization] of Object.entries(organizations)) {
    assert.equal(platforms[key].organization, organization);
  }
  const invoices = platforms.portal.views.invoices;
  const currencyIndex = invoices.columns.indexOf("Currency");
  assert.notEqual(currencyIndex, -1);
  for (const invoice of invoices.rows) assert.equal(invoice.values[currencyIndex], "USD", `${invoice.id} uses USD`);

  const previousCopy = /\b(?:Northstar(?:\s+(?:Foods|Group))?|Maple\s+(?:Retail|Freight)|Harbour\s+(?:Supply|Linehaul)|Prairie\s+Connect|Toronto|Montreal|Montr\u00e9al|Calgary|Vancouver|CAD)\b/i;
  for (const [file, source] of Object.entries({ "workspace-data.js": dataScript, ...rendererScripts })) {
    const staleText = source.match(previousCopy);
    assert.equal(staleText?.[0], undefined, `${file} retains previous sample text: ${staleText?.[0]}`);
  }
});

test("each renderer references its own distinct generated logo asset", () => {
  const logos = {
    managed: "assets/relayport-mark.png",
    commercial: "assets/milemark-mark.png",
    portal: "assets/folio-mark.png"
  };
  assert.equal(new Set(Object.values(logos)).size, 3);
  for (const [key, logo] of Object.entries(logos)) {
    const references = [...new Set([...rendererScripts[key].matchAll(/\bsrc=["']([^"']*(?:relayport|milemark|folio)-mark\.png(?:\?[^"']*)?)["']/g)]
      .map(([, reference]) => reference.split("?")[0]))];
    assert.deepEqual(references, [logo], `${key} renderer uses its own logo`);
  }
});

test("homepage navigation leads to capability concepts without embedding their apps or assets", () => {
  const navigation = rootHtml.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/i)?.[1];
  assert.ok(navigation, "homepage has primary navigation");
  assert.match(navigation, /<a\b(?=[^>]*\bhref=["']\/ai-native-development\/#software-demo["'])[^>]*>\s*Software platforms\s*<\/a>/i);
  assert.doesNotMatch(rootHtml, /\bdata-(?:platform|platform-choice|platform-panel|workspace-showcase)\b/);
  assert.doesNotMatch(rootHtml, /\b(?:href|src)=["'][^"']*(?:workspace(?:-[\w-]+)?\.(?:js|css)|commercial\.css|portal\.css|home-platforms\.css)[^"']*["']/);
  assert.doesNotMatch(buildScript, /["']home-platforms\.css["']/);
  assert.match(rootHtml, /<a\b[^>]*href="\/ai-native-development\/"[^>]*>[\s\S]*?<h3>AI-native development<\/h3>/);
  const teaser = rootHtml.match(/<aside\b(?=[^>]*\bid="platforms")[^>]*>([\s\S]*?)<\/aside>/)?.[1];
  assert.ok(teaser, "legacy platforms anchor remains on the homepage teaser");
  assert.match(teaser, /<a\b(?=[^>]*class="development-feature-link")(?=[^>]*href="\/ai-native-development\/#software-demo")[^>]*>/);
  assert.match(navigationScript, /\["ai-native-development",\s*"Software Platforms",\s*"ai-native-development\/"\]/);
});

test("capability navigation connects the platform preview and homepage", () => {
  const navigation = html.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/i)?.[1];
  assert.ok(navigation, "capability page has primary navigation");
  assert.match(navigation, /<a\b(?=[^>]*\bhref=["']#software-demo["'])[^>]*>\s*Software platforms\s*<\/a>/i);
  assert.match(navigation, /<a\b(?=[^>]*\bhref=["']\/["'])[^>]*>\s*Home\s*<\/a>/i);
  const breadcrumb = html.match(/<nav\b(?=[^>]*\baria-label="Breadcrumb")[^>]*>([\s\S]*?)<\/nav>/i)?.[1];
  assert.ok(breadcrumb, "capability hero provides a breadcrumb outside the primary navigation");
  assert.match(breadcrumb, /<a\b(?=[^>]*\bhref=["']\/["'])[^>]*>\s*Home\s*<\/a>/i);
  assert.match(breadcrumb, /aria-current="page">AI-native development<\/span>/);
  assert.match(html, /<section\b[^>]*\bid="software-demo"/);
});

test("compact header menus provide Home and software platform navigation on both pages", () => {
  for (const [page, source, softwareRoute] of [
    ["homepage", rootHtml, "/ai-native-development/#software-demo"],
    ["capability page", html, "#software-demo"]
  ]) {
    const header = source.match(/<header\b[^>]*>([\s\S]*?)<\/header>/i)?.[1];
    assert.ok(header, `${page} has a header`);
    const menu = header.match(/<details\b(?=[^>]*\bclass="[^"]*\bcompact-navigation\b[^"]*")[^>]*>([\s\S]*?)<\/details>/i)?.[1];
    assert.ok(menu, `${page} header has a native compact menu`);
    assert.match(menu, /<summary\b[^>]*>\s*Menu\s*<\/summary>/i);
    const navigation = menu.match(/<div\b(?=[^>]*\brole="navigation")(?=[^>]*\baria-label="Mobile navigation")[^>]*>([\s\S]*?)<\/div>/i)?.[1];
    assert.ok(navigation, `${page} compact menu has a labeled navigation region`);
    const links = [...navigation.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .map(([, href, label]) => ({ href, label: label.trim() }));
    assert.ok(links.some(({ href, label }) => href === "/" && label === "Home"), `${page} compact menu links Home`);
    assert.ok(links.some(({ href, label }) => href === softwareRoute && label === "Software platforms"), `${page} compact menu links the platform preview`);
  }
});

test("capability page loads classic deferred scripts in data-to-renderer-to-bootstrap order", () => {
  const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const scriptPaths = scriptTags.map(([, attributes, inline]) => {
    assert.match(attributes, /\bdefer\b/i, "workspace scripts should defer execution");
    assert.doesNotMatch(attributes, /\btype\s*=\s*["']module["']/i, "workspace scripts must remain classic scripts");
    assert.equal(inline.trim(), "", "workspace behavior belongs in classic script files");
    return attributes.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1].split("?")[0];
  });
  assert.deepEqual(scriptPaths, [
    "development.js",
    "saas-arrangement.js",
    "workspace-data.js",
    "workspace-managed.js",
    "workspace-commercial.js",
    "workspace-portal.js",
    "workspace.js",
    "/site-shell.js"
  ]);
  assert.match(buildScript, /"ai-native-development"/);
});

test("capability concepts map all three tabs and panels to matching platform fallbacks", () => {
  const choices = [...html.matchAll(/\bdata-demo="([^"]+)"/g)].map(([, key]) => key);
  const panels = [...html.matchAll(/<section\b[^>]*\bdata-preview="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)];
  const roots = [...html.matchAll(/\bdata-platform="([^"]+)"/g)].map(([, key]) => key);
  assert.deepEqual(choices, ["commercial", "portal", "managed"]);
  assert.deepEqual(panels.map(([, key]) => key), choices);
  assert.deepEqual(roots, choices);
  for (const [panel, key, content] of panels) {
    assert.match(content, new RegExp(`<div class="platform-app" data-platform="${key}">[\\s\\S]*?platform-fallback`));
    assert.match(content, /<h4>[^<]+<\/h4>/);
    assert.doesNotMatch(panel.slice(0, panel.indexOf(">")), /\bhidden\b/, `${key} fallback remains visible without JavaScript`);
  }
});

test("workspace data, bootstrap, and all renderers have no module or network-loading dependencies", () => {
  const scripts = { "workspace-data.js": dataScript, "workspace.js": bootstrapScript, ...rendererScripts };
  for (const [file, source] of Object.entries(scripts)) {
    assert.doesNotMatch(source, /^\s*import\s/m, `${file} must not use static imports`);
    assert.doesNotMatch(source, /^\s*export\s/m, `${file} must not use exports`);
    assert.doesNotMatch(source, /\bimport\s*\(/, `${file} must not use dynamic imports`);
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${file} must not fetch workspace code or data`);
  }
});

test("each platform registers its own renderer and domain-specific navigation", () => {
  const expected = {
    managed: ["mounts.managed", "Network", "Routing guides", "BPO desk", "Carrier scorecards", "Freight audit", "Shipper view"],
    commercial: ["mounts.commercial", "Commercial overview", "Accounts", "Lane economics", "Contracts", "Growth plans"],
    portal: ["mounts.portal", "Home", "Orders", "Quotes", "Documents", "Billing", "Support"]
  };
  const genericNavigation = /\[['"](?:overview|dashboard|records|settings)['"],\s*['"](?:Overview|Dashboard|Records|Settings)['"]\]/;

  for (const [platform, markers] of Object.entries(expected)) {
    const source = rendererScripts[platform];
    for (const marker of markers) assert.ok(source.includes(marker), `${platform} renderer includes ${marker}`);
    assert.doesNotMatch(source, genericNavigation, `${platform} navigation should describe its domain`);
  }

  const window = { GaugepointWorkspace: evaluateData() };
  for (const [platform, source] of Object.entries(rendererScripts)) {
    vm.runInNewContext(source, { window }, { filename: rendererFiles[platform] });
    assert.equal(typeof window.GaugepointWorkspace.mounts[platform], "function", `${platform} renderer registers a mount function`);
  }
});

test("managed routing and carrier searches find record IDs without changing row data", () => {
  const workspace = evaluateData();
  vm.runInNewContext(rendererScripts.managed, { window: { GaugepointWorkspace: workspace } }, { filename: rendererFiles.managed });
  const platform = workspace.platforms.managed;
  const originalViews = JSON.stringify(platform.views);
  const elements = new Map([
    "[data-headline]", "[data-intro]", "[data-screen]", "[data-result-count]",
    "[data-work-list]", "[data-inspector]", "[data-selection]", "[data-feedback]", ".managed-search input"
  ].map((selector) => [selector, { innerHTML: "", textContent: "", value: "", focus() {} }]));
  const listeners = {};
  const root = {
    innerHTML: "",
    querySelector(selector) { return elements.get(selector) || null; },
    querySelectorAll() { return []; },
    addEventListener(name, callback) { listeners[name] = callback; },
    contains() { return true; }
  };
  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  workspace.mounts.managed(root, platform, { escape, filterRows: workspace.filterRows });

  for (const [view, id, otherId] of [["routing", "RG-018", "RG-022"], ["carriers", "CR-014", "CR-020"]]) {
    const button = { dataset: { view } };
    listeners.click({ target: { closest() { return button; } } });
    assert.equal(elements.get("[data-result-count]").textContent, `${platform.views[view].rows.length} records`);
    for (const query of [id, `  ${id.toLowerCase()}  `]) {
      listeners.input({ target: { value: query, matches(selector) { return selector === ".managed-search input"; } } });
      assert.equal(elements.get("[data-result-count]").textContent, "1 record", `${view} search finds ${query}`);
      const records = elements.get("[data-work-list]").innerHTML;
      assert.ok(records.includes(`data-record="${id}"`), `${id} remains in the rendered results`);
      assert.ok(!records.includes(`data-record="${otherId}"`), `${otherId} is excluded from the rendered results`);
    }
  }
  assert.equal(JSON.stringify(platform.views), originalViews, "ID searches preserve the shared row schema and values");
});

test("bootstrap mounts every registered platform with escaped and filtered helpers", () => {
  const workspace = evaluateData();
  const roots = Object.keys(workspace.platforms).map((platform) => createRoot(platform, `<div class="platform-fallback">${platform} outline</div>`));
  const calls = [];
  const document = { querySelectorAll: (selector) => selector === "[data-platform]" ? roots : [] };

  for (const platform of Object.keys(workspace.platforms)) {
    workspace.mounts[platform] = (root, data, helpers) => {
      calls.push(platform);
      assert.equal(data, workspace.platforms[platform]);
      assert.equal(helpers.escape(`<${platform}&`), `&lt;${platform}&amp;`);
      assert.deepEqual(Array.from(helpers.filterRows(data.views[Object.keys(data.views)[0]].rows, "no match")), []);
      root.innerHTML = `<main>${platform} preview</main>`;
    };
  }

  vm.runInNewContext(bootstrapScript, { window: { GaugepointWorkspace: workspace }, document, console: { error() {} } }, { filename: "workspace.js" });
  assert.deepEqual(calls, ["managed", "commercial", "portal"]);
  for (const root of roots) {
    assert.equal(root.dataset.ready, "true", `${root.dataset.platform} is marked ready after mount`);
    assert.match(root.innerHTML, new RegExp(`<main>${root.dataset.platform} preview<\\/main>`));
  }
});

test("a mount error restores only its fallback and later platform mounts still run", () => {
  const workspace = evaluateData();
  const roots = Object.keys(workspace.platforms).map((platform) => createRoot(platform, `<div class="platform-fallback">${platform} outline</div>`));
  const calls = [];
  const errors = [];
  const document = { querySelectorAll: (selector) => selector === "[data-platform]" ? roots : [] };
  workspace.mounts.managed = (root) => { calls.push("managed"); root.innerHTML = "managed mounted"; };
  workspace.mounts.commercial = () => { calls.push("commercial"); throw new Error("simulated renderer failure"); };
  workspace.mounts.portal = (root) => { calls.push("portal"); root.innerHTML = "portal mounted"; };

  vm.runInNewContext(bootstrapScript, {
    window: { GaugepointWorkspace: workspace },
    document,
    console: { error: (...args) => errors.push(args) }
  }, { filename: "workspace.js" });

  assert.deepEqual(calls, ["managed", "commercial", "portal"]);
  assert.equal(roots[0].innerHTML, "managed mounted");
  assert.equal(roots[0].dataset.ready, "true");
  assert.match(roots[1].innerHTML, /workspace-error/);
  assert.match(roots[1].innerHTML, /commercial outline/);
  assert.equal(roots[1].dataset.ready, undefined);
  assert.equal(roots[2].innerHTML, "portal mounted");
  assert.equal(roots[2].dataset.ready, "true");
  assert.equal(errors.length, 1);
  assert.match(errors[0][0], /Gaugepoint commercial preview failed/);
});

test("bootstrap leaves unknown or unavailable platforms untouched", () => {
  const workspace = evaluateData();
  const roots = [createRoot("unknown", "unknown fallback"), createRoot("managed", "managed fallback")];
  workspace.mounts.managed = (root) => { root.innerHTML = "mounted"; };
  vm.runInNewContext(bootstrapScript, {
    window: { GaugepointWorkspace: workspace },
    document: { querySelectorAll: (selector) => selector === "[data-platform]" ? roots : [] },
    console: { error() {} }
  }, { filename: "workspace.js" });

  assert.equal(roots[0].innerHTML, "unknown fallback");
  assert.equal(roots[0].dataset.ready, undefined);
  assert.equal(roots[1].innerHTML, "mounted");
  assert.equal(roots[1].dataset.ready, "true");
});

test("preview copy identifies fictional data and limits actions to the local browser preview", () => {
  assert.match(html, /Illustrative platforms and fictional data/);
  assert.match(html, /Preview actions stay in this browser session/);
  assert.match(html, /no freight is booked, assigned, or paid/);
  for (const source of Object.values(rendererScripts)) {
    assert.match(source, /\b(?:sample|fictional)\s+(?:data|records?|company)\b|\billustrative\b/i);
  }
});
