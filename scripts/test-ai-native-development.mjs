import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(path.join(projectRoot, "ai-native-development/index.html"), "utf8");
const script = readFileSync(path.join(projectRoot, "ai-native-development/development.js"), "utf8");
const css = readFileSync(path.join(projectRoot, "ai-native-development/development.css"), "utf8");

class MockElement {
  constructor(id = "", attributes = {}) {
    this.id = id;
    this.attributes = { ...attributes };
    this.listeners = {};
    this.classes = new Set();
    this.style = { values: {}, setProperty(name, value) { this.values[name] = value; } };
    this.hidden = false;
    this.tabIndex = -1;
    this.offsetTop = 0;
  }

  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  focus() { this.focused = true; }
  get offsetWidth() { return 1; }
  getBoundingClientRect() { return { top: 200, height: 300 }; }
  classList = {
    add: (name) => this.classes.add(name),
    contains: (name) => this.classes.has(name)
  };
}

function createRuntime() {
  const tabs = [1, 2, 3].map((n) => new MockElement(`tab-${n}`));
  const panels = [1, 2, 3].map((n) => new MockElement(`panel-${n}`));
  const revealItems = [new MockElement("reveal-1"), new MockElement("reveal-2")];
  const tablist = new MockElement("tablist");
  const hero = new MockElement("hero");
  const model = new MockElement("model");
  const economics = new MockElement("economics");
  const ownership = new MockElement("ownership");
  economics.offsetTop = 1000;
  ownership.offsetTop = 2000;
  const documentElement = new MockElement("document");
  const document = {
    documentElement,
    querySelectorAll(selector) {
      if (selector === ".demo-tab") return tabs;
      if (selector === ".demo-panel") return panels;
      if (selector.startsWith(".gp-section-heading")) return revealItems;
      return [];
    },
    querySelector(selector) {
      return {
        ".demo-tabs": tablist,
        ".gp-hero": hero,
        ".gp-model": model,
        ".gp-economics": economics,
        ".gp-ownership": ownership
      }[selector] ?? null;
    }
  };
  const windowListeners = {};
  const window = {
    innerHeight: 800,
    scrollY: 0,
    pageYOffset: 0,
    addEventListener(name, callback) { windowListeners[name] = callback; },
    requestAnimationFrame(callback) { callback(); }
  };
  vm.runInNewContext(script, { document, window });
  return { tabs, panels, revealItems, tablist, documentElement, hero, model, windowListeners };
}

function keyEvent(key) {
  return { key, prevented: false, preventDefault() { this.prevented = true; } };
}

function mediaBlock(source, query) {
  const start = source.indexOf(query);
  assert.notEqual(start, -1, `missing ${query}`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}" && --depth === 0) return source.slice(open + 1, index);
  }
  throw new Error(`unclosed block for ${query}`);
}

test("all illustrative panels are present and visible in source without JavaScript", () => {
  const panelTags = [...html.matchAll(/<section\s+class="demo-panel"[^>]*>/g)].map(([tag]) => tag);
  assert.equal(panelTags.length, 3);
  assert.ok(panelTags.every((tag) => !/\shidden(?:\s|>)/.test(tag)));
  assert.equal([...html.matchAll(/<div\s+id="request-tab-[123]"\s+class="demo-tab"/g)].length, 3);
});

test("tab initialization, keyboard navigation, focus, and panel state stay synchronized", () => {
  const { tabs, panels, tablist, documentElement } = createRuntime();
  assert.equal(tablist.getAttribute("role"), "tablist");
  assert.ok(tabs.every((tab) => tab.getAttribute("role") === "tab"));
  assert.ok(panels.every((panel) => panel.getAttribute("role") === "tabpanel"));
  assert.equal(tabs[0].getAttribute("aria-selected"), "true");
  assert.deepEqual(panels.map((panel) => panel.hidden), [false, true, true]);
  assert.ok(documentElement.classList.contains("demo-tabs-ready"));

  const right = keyEvent("ArrowRight");
  tabs[0].listeners.keydown(right);
  assert.equal(right.prevented, true);
  assert.equal(tabs[1].getAttribute("aria-selected"), "true");
  assert.equal(tabs[1].focused, true);
  assert.deepEqual(panels.map((panel) => panel.hidden), [true, false, true]);

  tabs[1].listeners.keydown(keyEvent("End"));
  assert.equal(tabs[2].getAttribute("aria-selected"), "true");
  assert.equal(tabs[2].focused, true);
  assert.deepEqual(panels.map((panel) => panel.hidden), [true, true, false]);

  tabs[2].listeners.keydown(keyEvent("ArrowRight"));
  assert.equal(tabs[0].getAttribute("aria-selected"), "true");
  assert.deepEqual(panels.map((panel) => panel.hidden), [false, true, true]);

  tabs[0].listeners.keydown(keyEvent("Home"));
  assert.equal(tabs[0].getAttribute("aria-selected"), "true");
  tabs[0].listeners.keydown(keyEvent("ArrowLeft"));
  assert.equal(tabs[2].getAttribute("aria-selected"), "true");
  assert.deepEqual(panels.map((panel) => panel.hidden), [true, true, false]);
  tabs[2].listeners.keydown(keyEvent("ArrowUp"));
  assert.equal(tabs[1].getAttribute("aria-selected"), "true");
  tabs[1].listeners.keydown(keyEvent("Home"));
  assert.equal(tabs[0].getAttribute("aria-selected"), "true");
  tabs[0].listeners.keydown(keyEvent("End"));
  assert.equal(tabs[2].getAttribute("aria-selected"), "true");
});

test("Enter and Space activate the focused tab and expose its panel", () => {
  const { tabs, panels } = createRuntime();
  for (const [index, key] of [[1, "Enter"], [2, " "]]) {
    tabs[index].focus();
    const event = keyEvent(key);
    tabs[index].listeners.keydown(event);
    assert.equal(event.prevented, true);
    assert.equal(tabs[index].getAttribute("aria-selected"), "true");
    assert.equal(tabs[index].focused, true);
    assert.deepEqual(panels.map((panel) => panel.hidden), panels.map((_, panelIndex) => panelIndex !== index));
  }
});

test("without IntersectionObserver, reveal content stays unmarked and scroll scenes initialize", () => {
  const { revealItems, hero, model, documentElement } = createRuntime();
  assert.ok(documentElement.classList.contains("js-motion"));
  assert.ok(revealItems.every((item) => item.getAttribute("data-reveal") === null));
  assert.equal(hero.style.values["--hero-question-progress"], "0.214");
  assert.equal(model.style.values["--model-progress"], "1.000");
  assert.equal(model.style.values["--software-shift"], "0.000");
});

test("reduced-motion media rules reveal content and neutralize animated scenes", () => {
  const reducedMotion = mediaBlock(css, "@media (prefers-reduced-motion: reduce)");
  assert.match(reducedMotion, /html\s*\{[^}]*scroll-behavior:\s*auto/s);
  assert.match(reducedMotion, /\.js-motion\s+\[data-reveal\]\s*\{[^}]*opacity:\s*1/s);
  assert.match(reducedMotion, /\.js-motion\s+\.gp-hero-question\s*\{[^}]*opacity:\s*1\s*!important/s);
  assert.match(reducedMotion, /\.js-motion\s+\.gp-model\s+\.network-node[^}]*opacity:\s*1\s*!important/s);
  assert.match(reducedMotion, /\.js-motion\s+\.gp-model\s+\.network-vendor\s*\{[^}]*opacity:\s*1\s*!important/s);
});
