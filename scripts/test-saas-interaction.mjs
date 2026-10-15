import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const previewRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = readFileSync(path.join(previewRoot, 'ai-native-development/saas-arrangement.js'), 'utf8');

class MockElement {
  constructor({ text = '', dataset = {} } = {}) {
    this.dataset = { ...dataset };
    this.textContent = text;
    this.hidden = false;
    this.disabled = false;
    this.attributes = {};
    this.listeners = {};
    this.animations = [];
  }

  addEventListener(type, callback) { this.listeners[type] = callback; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  click() { this.listeners.click?.({ currentTarget: this }); }
  animate(keyframes, options) {
    const animation = { keyframes, options, cancelled: false, cancel() { this.cancelled = true; } };
    this.animations.push(animation);
    return animation;
  }
}

function createRuntime({ hasHost = true, hasButton = true, reducedMotion = false } = {}) {
  const button = hasButton ? new MockElement() : null;
  if (button) {
    button.setAttribute('type', 'button');
    button.setAttribute('aria-controls', 'dependency-network dependency-result');
    button.hidden = true;
    button.disabled = true;
  }
  const copy = [
    new MockElement({ text: 'normal summary', dataset: { normal: 'normal summary', changed: 'changed summary' } }),
    new MockElement({ text: 'normal team effect', dataset: { normal: 'normal team effect', changed: 'changed team effect' } })
  ];
  const signals = Array.from({ length: 3 }, () => new MockElement());
  signals.forEach(signal => { signal.cx = 100; signal.cy = 10; });
  const model = hasHost ? new MockElement() : null;
  if (model) {
    model.querySelector = selector => selector === '[data-vendor-change]' ? button : null;
    model.querySelectorAll = selector => {
      if (selector === '[data-normal][data-changed]') return copy;
      if (selector === '.dependency-signal') return signals;
      return [];
    };
  }
  const document = { querySelector: selector => selector === '#saas-arrangement' ? model : null };
  const mediaListeners = {};
  const mediaQuery = {
    matches: reducedMotion,
    addEventListener(type, callback) { mediaListeners[type] = callback; }
  };
  const window = { matchMedia: query => query === '(prefers-reduced-motion: reduce)' ? mediaQuery : { matches: false } };
  vm.runInNewContext(script, { document, window });
  return { model, button, copy, signals, mediaQuery, mediaListeners };
}

test('mock HTML contract exposes a native toggle, text pairs, and three department-row signals', () => {
  const runtime = createRuntime();
  assert.equal(runtime.button.getAttribute('type'), 'button');
  assert.equal(runtime.button.getAttribute('aria-controls'), 'dependency-network dependency-result');
  assert.equal(runtime.button.hidden, false);
  assert.equal(runtime.button.disabled, false);
  assert.equal(runtime.button.getAttribute('aria-pressed'), 'false');
  assert.equal(runtime.button.textContent, 'Change a vendor rule');
  assert.equal(runtime.signals.length, 3);
  assert.ok(runtime.signals.every(signal => signal.cx === 100 && signal.cy === 10));
  assert.deepEqual(runtime.copy.map(node => node.textContent), runtime.copy.map(node => node.dataset.normal));
});

test('missing model or toggle exits without throwing', () => {
  assert.doesNotThrow(() => createRuntime({ hasHost: false }));
  assert.doesNotThrow(() => createRuntime({ hasButton: false }));
});

test('initializes unchanged and toggles the example text and accessible state', () => {
  const runtime = createRuntime();
  assert.equal(runtime.model.dataset.vendorChanged, 'false');
  assert.equal(runtime.button.getAttribute('aria-pressed'), 'false');
  assert.equal(runtime.button.textContent, 'Change a vendor rule');
  assert.deepEqual(runtime.copy.map(node => node.textContent), ['normal summary', 'normal team effect']);
  assert.ok(runtime.signals.every(signal => signal.animations.length === 0));

  runtime.button.click();
  assert.equal(runtime.model.dataset.vendorChanged, 'true');
  assert.equal(runtime.button.getAttribute('aria-pressed'), 'true');
  assert.equal(runtime.button.textContent, 'Reset example');
  assert.deepEqual(runtime.copy.map(node => node.textContent), ['changed summary', 'changed team effect']);
  assert.deepEqual(runtime.signals.map(signal => signal.animations[0].options.delay), [0, 180, 360]);

  runtime.button.click();
  assert.equal(runtime.model.dataset.vendorChanged, 'false');
  assert.equal(runtime.button.getAttribute('aria-pressed'), 'false');
  assert.equal(runtime.button.textContent, 'Change a vendor rule');
  assert.deepEqual(runtime.copy.map(node => node.textContent), ['normal summary', 'normal team effect']);
});

test('each changed-state signal animation travels right-to-left once for one second', () => {
  const runtime = createRuntime();
  runtime.button.click();
  for (const signal of runtime.signals) {
    const animation = signal.animations[0];
    assert.equal(animation.options.duration, 1000);
    assert.equal(animation.options.iterations, 1);
    assert.equal(animation.keyframes[0].transform, 'translateX(0px)');
    assert.equal(animation.keyframes.at(-1).transform, 'translateX(-90px)');
  }
});

test('rapid toggle/reset cancels every in-flight signal animation', () => {
  const runtime = createRuntime();
  runtime.button.click();
  const started = runtime.signals.map(signal => signal.animations[0]);
  runtime.button.click();
  assert.ok(started.every(animation => animation.cancelled));
  assert.ok(runtime.signals.every(signal => signal.animations.length === 1));

  runtime.button.click();
  const secondRun = runtime.signals.map(signal => signal.animations[1]);
  runtime.button.click();
  assert.ok(secondRun.every(animation => animation.cancelled));
});

test('reduced motion suppresses animation and switching preference cancels active motion', () => {
  const reduced = createRuntime({ reducedMotion: true });
  reduced.button.click();
  assert.ok(reduced.signals.every(signal => signal.animations.length === 0));

  const runtime = createRuntime();
  runtime.button.click();
  const running = runtime.signals.map(signal => signal.animations[0]);
  runtime.mediaQuery.matches = true;
  runtime.mediaListeners.change({ matches: true });
  assert.ok(running.every(animation => animation.cancelled));
});
