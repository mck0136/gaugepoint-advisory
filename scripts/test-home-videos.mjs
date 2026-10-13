import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initInterstate, initSupplyChainVideo } from '../home-videos.js';

class Events {
  listeners = new Map();
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
  }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  emit(type) { for (const callback of [...(this.listeners.get(type) || [])]) callback(); }
  get listenerCount() { return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0); }
}

// Model the media boundary, not the controller: retargeting restarts decoding.
// currentTime immediately reports the requested position, before a frame arrives.
class SlowVideo extends Events {
  readyState = 0;
  duration = 10;
  seeking = false;
  paused = true;
  src = '';
  preload = 'none';
  position = 0;
  decodedTime = null;
  writes = [];
  loads = 0;
  loadRequests = [];
  constructor(clock, seekDelay) { super(); this.clock = clock; this.seekDelay = seekDelay; }
  get currentTime() { return this.position; }
  set currentTime(time) {
    assert.ok(this.readyState >= 1, 'must not seek before metadata');
    this.position = time;
    this.writes.push(time);
    this.seeking = true;
    this.completesAt = this.clock.now + this.seekDelay;
  }
  finishIfReady() {
    if (!this.seeking || this.clock.now < this.completesAt) return;
    this.decodedTime = this.position;
    this.readyState = 2;
    this.seeking = false;
    this.emit('seeked');
  }
  pause() { this.paused = true; }
  play() { assert.fail('scroll-scrubbing must not call play()'); }
  load() {
    this.loadRequests.push({ src: this.src, preload: this.preload });
    this.loads++; this.readyState = 0; this.position = 0; this.seeking = false;
  }
  receiveInitialData() {
    assert.equal(this.loadRequests.at(-1)?.preload, 'auto', 'initial data must be explicitly requested at load time');
    assert.ok(this.loadRequests.at(-1)?.src);
    this.decodedTime = 0;
    this.readyState = 2;
    this.emit('loadeddata');
  }
  removeAttribute(name) { if (name === 'src') this.src = ''; }
  querySelector() { return null; }
}

function fixture(t, { reduced = false, mobile = false, supply = false, seekDelay = 180 } = {}) {
  const clock = { now: 0 };
  const timers = new Map(), frames = new Map();
  let nextId = 1;
  const video = new SlowVideo(clock, seekDelay);
  if (supply) video.duration = 20;
  const motion = Object.assign(new Events(), { matches: reduced });
  const win = new Events();
  win.setTimeout = (callback, delay) => {
    const id = nextId++;
    timers.set(id, { callback, at: clock.now + delay });
    return id;
  };
  const globals = {
    window: win,
    innerHeight: 800,
    performance: { now: () => clock.now },
    matchMedia: query => query.includes('reduced-motion') ? motion : { matches: mobile },
    clearTimeout: id => timers.delete(id),
    requestAnimationFrame: callback => { const id = nextId++; frames.set(id, callback); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    IntersectionObserver: class {
      constructor(callback) { this.callback = callback; }
      observe() { fixtureObserver = this; }
      disconnect() { this.disconnected = true; }
    }
  };
  let fixtureObserver;
  const restoreGlobals = [];
  for (const [name, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
    restoreGlobals.push(() => {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else delete globalThis[name];
    });
  }
  const cards = Array.from({ length: supply ? 3 : 5 }, () => ({ hidden: false, dataset: {} }));
  const chapters = Array.from({ length: 3 }, () => Object.assign(new Events(), {
    attributes: new Map(),
    setAttribute(name, value) { this.attributes.set(name, value); },
    removeAttribute(name) { this.attributes.delete(name); },
    style: { setProperty() {} }
  }));
  const classes = new Set();
  const fallback = { hidden: true }, scale = { style: {} };
  const root = {
    innerHTML: '', dataset: {}, offsetHeight: 1800, top: 0,
    classList: {
      add: name => classes.add(name),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name)
    },
    getBoundingClientRect() { return { top: this.top }; },
    querySelector(selector) {
      return {
        '.is-video': video, '.is-pin': { clientHeight: 800 }, '.is-scale i': scale, '.is-fallback': fallback,
        '.sc-video': video, '.sc-pin': { clientHeight: 800 }, '.sc-state': {}, '.sc-stage-number': {}, '.sc-fallback': fallback
      }[selector];
    },
    querySelectorAll(selector) { return selector === '[data-sc-video-stage]' ? chapters : cards; }
  };
  const api = supply ? initSupplyChainVideo(root) : initInterstate(root);
  t.after(() => {
    try { if (root.__interstate || root.__supplyChain) api.destroy(); }
    finally { restoreGlobals.forEach(restore => restore()); }
  });
  function flushFrames() {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach(callback => callback());
  }
  function advance(ms) {
    clock.now += ms;
    for (const [id, timer] of [...timers]) {
      if (timer.at <= clock.now) { timers.delete(id); timer.callback(); }
    }
    video.finishIfReady();
  }
  function metadata() { video.readyState = 1; video.emit('loadedmetadata'); flushFrames(); }
  return { api, video, root, cards, motion, win, timers, frames, advance, metadata, flushFrames,
    near: visible => fixtureObserver.callback([{ isIntersecting: visible }]),
    get observer() { return fixtureObserver; } };
}

test('drayage starts once near the viewport and seeks with metadata only', t => {
  const f = fixture(t);
  assert.equal(f.video.loads, 0);
  assert.equal(f.video.src, '');
  assert.match(f.root.innerHTML, /preload="none"/);
  assert.doesNotMatch(f.root.innerHTML, /<source/);
  f.near(true);
  f.flushFrames();
  assert.equal(f.video.loads, 1);
  assert.equal(f.video.preload, 'auto');
  assert.equal(f.video.src, '/assets/videos/drayage-dock.mp4?v=safari-video-4');
  assert.deepEqual(f.video.writes, []);
  f.metadata();
  assert.deepEqual(f.video.writes, [.04], 'initial seek must not require loadeddata or exceed the normal tolerance');
  f.advance(180);
  assert.equal(f.video.decodedTime, .04);
  f.near(false);
  f.near(true);
  assert.equal(f.video.loads, 1, 're-entry must not reset media');
  assert.equal(f.video.paused, true);
});

test('road video requests initial data only near the viewport and retains media on re-entry', t => {
  const f = fixture(t, { supply: true });
  f.flushFrames();
  f.near(false);
  f.win.emit('scroll');
  f.flushFrames();
  assert.equal(f.video.loads, 0);
  assert.equal(f.video.src, '');
  assert.match(f.root.innerHTML, /preload="none"/);
  assert.doesNotMatch(f.root.innerHTML, /<source|<video[^>]*\ssrc=/);
  f.near(true);
  assert.deepEqual(f.video.loadRequests, [{
    src: '/assets/videos/supply-chain-in-motion.mp4?v=safari-video-4', preload: 'auto'
  }]);
  f.metadata();
  assert.deepEqual(f.video.writes, [], 'road starts at time zero, so data loading cannot depend on an initial seek');
  f.video.receiveInitialData();
  f.flushFrames();
  assert.equal(f.video.decodedTime, 0);
  f.api.setProgress(.24);
  f.advance(180);
  assert.equal(f.video.decodedTime, 5);
  f.near(false);
  f.near(true);
  assert.equal(f.video.loads, 1, 'viewport re-entry must not discard the loaded road video');
  assert.equal(f.video.decodedTime, 5);
  assert.equal(f.video.paused, true);
});

test('scroll updates before metadata retain the latest position without requiring loadeddata', t => {
  const f = fixture(t);
  f.near(true);
  f.root.top = -700;
  f.win.emit('scroll');
  f.flushFrames();
  f.root.top = -200;
  f.win.emit('scroll');
  f.flushFrames();
  assert.deepEqual(f.video.writes, []);
  f.metadata();
  assert.deepEqual(f.video.writes, [2]);
  f.advance(180);
  assert.equal(f.video.decodedTime, 2);
});

for (const mobile of [false, true]) {
  test(`30fps cadence coalesces targets without skipping adjacent frames (${mobile ? 'mobile' : 'desktop'})`, t => {
    const f = fixture(t, { mobile, seekDelay: 10 });
    f.near(true);
    f.metadata();
    f.advance(10);
    const latest = .04 + 2 / 30;
    f.api.setProgress((.04 + 1 / 30) / 10);
    f.advance(10);
    f.api.setProgress(latest / 10);
    f.advance(13);
    assert.deepEqual(f.video.writes, [.04], 'updates before one frame interval must be coalesced');
    f.advance(1);
    assert.equal(f.video.writes.length, 2, 'latest target must start at the 30fps cadence on both viewport sizes');
    assert.ok(Math.abs(f.video.writes.at(-1) - latest) < 1e-9);
    f.advance(10);
    assert.ok(Math.abs(f.video.decodedTime - latest) < 1e-9);
    f.advance(40);
    f.api.setProgress((latest + 1 / 120) / 10);
    assert.equal(f.video.writes.length, 2, 'sub-half-frame jitter should not seek');
    f.api.setProgress((latest + 1 / 50) / 10);
    assert.equal(f.video.writes.length, 3, 'more than half a frame must not be suppressed');
    f.advance(10);
    const reverse = latest + 1 / 50 - 1 / 30;
    f.api.setProgress(reverse / 10);
    f.advance(24);
    assert.equal(f.video.writes.length, 4, 'an adjacent reverse frame must not be skipped');
    f.advance(10);
    assert.ok(Math.abs(f.video.decodedTime - reverse) < 1e-9);
    assert.equal(f.video.seeking, false);
  });

  test(`slow seeks finish and the latest reverse target wins (${mobile ? 'mobile' : 'desktop'})`, t => {
    const f = fixture(t, { mobile });
    f.near(true);
    f.metadata();
    f.advance(180);
    f.api.setProgress(.9);
    for (const progress of [.8, .6, .3]) {
      f.advance(50);
      f.api.setProgress(progress);
    }
    assert.deepEqual(f.video.writes, [.04, 9], 'scroll updates must not restart an in-flight decode');
    f.advance(30);
    assert.equal(f.video.decodedTime, 9);
    assert.deepEqual(f.video.writes, [.04, 9, 3], 'seeked must apply only the latest pending target');
    f.advance(180);
    assert.equal(f.video.decodedTime, 3);
    assert.equal(f.video.seeking, false);
    assert.equal(f.root.dataset.touchpoint, '1');
  });
}

test('reduced motion stays at one representative frame and shows all touchpoints', t => {
  const f = fixture(t, { reduced: true });
  f.near(true);
  f.metadata();
  f.advance(180);
  assert.equal(f.video.decodedTime, 5);
  f.root.top = -900;
  f.win.emit('scroll');
  f.flushFrames();
  f.advance(180);
  assert.equal(f.video.decodedTime, 5);
  assert.ok(f.cards.every(card => !card.hidden));
  assert.equal(f.video.paused, true);
});

test('destroy cancels pending work and removes media listeners', t => {
  const f = fixture(t);
  f.near(true);
  f.metadata();
  f.advance(180);
  f.api.setProgress(.8);
  // Finish early to exercise a throttled retry in addition to in-flight cleanup.
  f.video.seeking = false;
  f.video.readyState = 2;
  f.api.setProgress(.2);
  assert.equal(f.timers.size, 1);
  f.video.emit('progress');
  assert.equal(f.frames.size, 1);
  f.api.destroy();
  assert.equal(f.timers.size, 0);
  assert.equal(f.frames.size, 0);
  assert.equal(f.video.listenerCount, 0);
  assert.equal(f.win.listenerCount, 0);
  assert.equal(f.motion.listenerCount, 0);
  assert.equal(f.observer.disconnected, true);
  const count = f.video.writes.length, loads = f.video.loads;
  for (const event of ['loadedmetadata', 'loadeddata', 'canplay', 'progress', 'seeked', 'error']) f.video.emit(event);
  f.near(true);
  f.api.setProgress(.7);
  f.advance(1000);
  assert.equal(f.video.writes.length, count);
  assert.equal(f.video.loads, loads);
  assert.equal(f.root.innerHTML, '');
});
