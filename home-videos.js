import * as THREE from './assets/vendor/three/three.module.js';

const VIDEO_STAGES = [
  {
    name: 'Road freight',
    title: 'Visibility starts\nwith the move.',
    text: 'Connect shipment location, arrival timing, and service commitments so the next decision is grounded in what is happening now.',
    state: 'MOVEMENT TRACKED'
  },
  {
    name: 'Intermodal handoff',
    title: 'Transfer without\nlosing control.',
    text: 'At the yard handoff, probabilistic AI can reconcile equipment and timing signals; deterministic rules keep release and responsibility explicit.',
    state: 'HANDOFF VERIFIED'
  },
  {
    name: 'Double-stack rail',
    title: 'One journey.\nConnected decisions.',
    text: 'Keep people accountable for exceptions. Automate only the actions the operation has explicitly authorized.',
    state: 'RAIL MOVEMENT'
  }
];

/** Scroll-scrub the composed road, intermodal-transfer, and rail footage. */
export function initSupplyChainVideo(root) {
  if (!root) throw new Error('Supply-chain section is required');
  if (root.__supplyChain) return root.__supplyChain;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  root.innerHTML = `
    <div class="sc-pin">
      <div class="sc-scene" aria-hidden="true"><video class="sc-video" muted playsinline preload="none" tabindex="-1"><source data-src="./assets/videos/supply-chain-in-motion.mp4" type="video/mp4"></video></div>
      <div class="sc-shade" aria-hidden="true"></div>
      <header class="sc-heading"><span>SUPPLY CHAIN IN MOTION</span><p>One shipment. Three operating contexts.</p></header>
      <div class="sc-stage-number" aria-hidden="true">01</div>
      <div class="sc-captions">${VIDEO_STAGES.map((stage, i) => `
        <article class="sc-caption" ${i ? 'hidden' : ''} aria-labelledby="sc-video-title-${i}">
          <p class="sc-kicker">0${i + 1} / ${stage.name}</p>
          <h2 id="sc-video-title-${i}">${stage.title.replace('\n', '<br>')}</h2>
          <p class="sc-copy">${stage.text}</p>
        </article>`).join('')}</div>
      <div class="sc-record"><span>OPERATING SIGNAL</span><span class="sc-state">MOVEMENT TRACKED</span><span class="sc-record-detail">NORTH AMERICAN FREIGHT</span></div>
      <nav class="sc-chapters" aria-label="Supply-chain stages">${VIDEO_STAGES.map((stage, i) => `<button type="button" data-sc-video-stage="${i}" ${i === 0 ? 'aria-current="step"' : ''}><span>0${i + 1}</span>${stage.name}<i aria-hidden="true"></i></button>`).join('')}</nav>
      <div class="sc-fallback" hidden><p>The journey connects road freight, a verified intermodal handoff, and double-stack rail. Each transition needs shared context, clear ownership, and accountable decisions.</p></div>
    </div>`;

  const video = root.querySelector('.sc-video');
  const captions = [...root.querySelectorAll('.sc-caption')];
  const chapters = [...root.querySelectorAll('[data-sc-video-stage]')];
  const stateText = root.querySelector('.sc-state');
  let frame = 0, disposed = false, mediaRequested = false, mediaUrl = '', viewportHeight = innerHeight, duration = 20;
  const clamp = THREE.MathUtils.clamp;
  const spans = [[0, .48], [.48, .68], [.68, 1]];
  const timeRanges = [[0, 10], [10, 11], [11, 20]];

  function render(value) {
    if (disposed) return;
    const progress = clamp(value, 0, 1);
    const stage = Math.min(VIDEO_STAGES.length - 1, spans.findIndex(([, end]) => progress < end) < 0 ? VIDEO_STAGES.length - 1 : spans.findIndex(([, end]) => progress < end));
    const [start, end] = spans[stage];
    const [timeStart, timeEnd] = timeRanges[stage];
    const local = clamp((progress - start) / (end - start), 0, 1);
    const targetTime = Math.min(duration - .04, timeStart + local * (timeEnd - timeStart));
    if (video.readyState >= 1 && Math.abs(video.currentTime - targetTime) > .045) video.currentTime = targetTime;
    captions.forEach((item, i) => { item.hidden = reduced.matches ? false : i !== stage; });
    chapters.forEach((button, i) => {
      if (i === stage) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      const fill = i < stage ? 100 : i === stage ? local * 100 : 0;
      button.style.setProperty('--sc-fill', `${fill}%`);
    });
    root.querySelector('.sc-stage-number').textContent = `0${stage + 1}`;
    stateText.textContent = VIDEO_STAGES[stage].state;
    root.dataset.stage = String(stage);
    root.dataset.progress = progress.toFixed(4);
  }
  function progressFromScroll() {
    const travel = Math.max(1, root.offsetHeight - viewportHeight);
    return clamp(-root.getBoundingClientRect().top / travel, 0, 1);
  }
  function update() {
    frame = 0;
    render(reduced.matches ? 0 : progressFromScroll());
  }
  function schedule() { if (!frame && !disposed) frame = requestAnimationFrame(update); }
  function resize() {
    viewportHeight = root.querySelector('.sc-pin').clientHeight || innerHeight;
    root.classList.toggle('sc-reduced', reduced.matches);
    schedule();
  }
  function preferenceChanged() {
    root.classList.toggle('sc-reduced', reduced.matches);
    schedule();
  }
  function jumpTo(event) {
    const index = Number(event.currentTarget.dataset.scVideoStage);
    const top = root.getBoundingClientRect().top + scrollY;
    const progress = (spans[index][0] + spans[index][1]) / 2;
    scrollTo({ top: top + (root.offsetHeight - viewportHeight) * progress, behavior: 'instant' });
  }

  video.pause();
  video.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(video.duration)) duration = video.duration;
    schedule();
  });
  function mediaError() {
    if (disposed) return;
    root.classList.add('sc-unavailable');
    root.querySelector('.sc-fallback').hidden = false;
    captions.forEach(item => { item.hidden = false; });
  }
  video.addEventListener('error', mediaError);
  async function loadVideo() {
    if (mediaRequested || disposed) return;
    mediaRequested = true;
    try {
      const response = await fetch(new URL('./assets/videos/supply-chain-in-motion.mp4', import.meta.url));
      if (!response.ok) throw new Error('Supply-chain video unavailable');
      const blob = await response.blob();
      if (disposed) return;
      mediaUrl = URL.createObjectURL(blob);
      video.src = mediaUrl;
      video.load();
    } catch {
      mediaError();
    }
  }
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) loadVideo();
  }, { rootMargin: '100% 0px' });
  observer.observe(root);
  chapters.forEach(button => button.addEventListener('click', jumpTo));
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  reduced.addEventListener('change', preferenceChanged);
  resize();
  const api = {
    setProgress: render,
    destroy() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', resize);
      reduced.removeEventListener('change', preferenceChanged);
      chapters.forEach(button => button.removeEventListener('click', jumpTo));
      video.pause();
      video.removeAttribute('src');
      video.querySelector('source')?.removeAttribute('src');
      video.load();
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
      root.innerHTML = '';
      root.classList.remove('sc-unavailable');
      delete root.__supplyChain;
    }
  };
  root.__supplyChain = api;
  return api;
}

const STAGES = [
  { name: 'Intermodal yard', title: 'The handoff is where\nperformance begins.', text: 'A container moves. So does responsibility. Connect equipment events to verified records, clear ownership, and the next operating decision.', state: ['EQUIPMENT VERIFIED', 'LIFT AUTHORIZED', 'RAIL POSITION CONFIRMED'] },
  { name: 'Rail movement', title: 'Movement needs\nshared context.', text: 'Translate location, service commitments, and changing conditions into decisions that keep the entire operation aligned.', state: ['DEPARTURE RECORDED', 'SERVICE CONTEXT UPDATED', 'ARRIVAL WINDOW SHARED'] },
  { name: 'Drayage transfer', title: 'Make the next move\nan owned action.', text: 'Reconcile availability, appointments, and capacity. Assign the work explicitly and manage exceptions before they become delays.', state: ['CONTAINER AVAILABLE', 'DRIVER ASSIGNED', 'GATE RELEASE CONFIRMED'] },
  { name: 'Warehouse arrival', title: 'Close the loop.\nPreserve control.', text: 'Use probabilistic AI to interpret evidence and deterministic rules to govern execution. Record the decision, the accountable owner, and the outcome.', state: ['APPOINTMENT VERIFIED', 'DOCK POSITION ASSIGNED', 'RECEIPT RECORDED'] }
];

const clamp = THREE.MathUtils.clamp;
const smooth = (a, b, value) => THREE.MathUtils.smoothstep(value, a, b);
const mix = THREE.MathUtils.lerp;
const NAVY = 0x0b1d29;
const GOLD = 0xcba15a;

/** Mount a reversible, scroll-scrubbed four-stage intermodal journey. */
export function initSupplyChain(root) {
  if (!root) throw new Error('Supply-chain section is required');
  if (root.__supplyChain) return root.__supplyChain;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  root.innerHTML = `
    <div class="sc-pin">
      <div class="sc-scene" aria-hidden="true"></div>
      <div class="sc-shade" aria-hidden="true"></div>
      <div class="sc-cut" aria-hidden="true"></div>
      <header class="sc-heading"><span>SUPPLY CHAIN IN MOTION</span><p>One container. An entire operating system.</p></header>
      <div class="sc-stage-number" aria-hidden="true">01</div>
      <div class="sc-captions">${STAGES.map((stage, i) => `
        <article class="sc-caption" ${i ? 'hidden' : ''} aria-labelledby="sc-title-${i}">
          <p class="sc-kicker">0${i + 1} / ${stage.name}</p>
          <h2 id="sc-title-${i}">${stage.title.replace('\n', '<br>')}</h2>
          <p class="sc-copy">${stage.text}</p>
        </article>`).join('')}</div>
      <div class="sc-record"><span>GCPU 4821</span><span class="sc-state">EQUIPMENT VERIFIED</span><span class="sc-record-detail">NORTH AMERICAN INTERMODAL</span></div>
      <nav class="sc-chapters" aria-label="Supply-chain stages">${STAGES.map((stage, i) => `<button type="button" data-sc-stage="${i}" ${i === 0 ? 'aria-current="step"' : ''}><span>0${i + 1}</span>${stage.name}<i aria-hidden="true"></i></button>`).join('')}</nav>
      <div class="sc-fallback" hidden><p>The same container moves through the yard, rail, drayage, and warehouse. Each handoff needs clear ownership and a verified operating record.</p></div>
    </div>`;
  const host = root.querySelector('.sc-scene');
  const captions = [...root.querySelectorAll('.sc-caption')];
  const chapters = [...root.querySelectorAll('[data-sc-stage]')];
  const cut = root.querySelector('.sc-cut');
  const stateText = root.querySelector('.sc-state');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (error) {
    root.classList.add('sc-unavailable');
    root.querySelector('.sc-fallback').hidden = false;
    captions.forEach(item => { item.hidden = false; });
    return { destroy() { root.innerHTML = ''; }, error };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x101f29);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x172c38);
  scene.fog = new THREE.Fog(0x172c38, 48, 125);
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 180);
  scene.add(new THREE.HemisphereLight(0xe1edf5, 0x354551, 2.9));
  const sun = new THREE.DirectionalLight(0xffe6bb, 3.8);
  sun.position.set(-18, 34, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 1, far: 95 });
  sun.shadow.bias = -.0004;
  sun.shadow.normalBias = .03;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(0xa4c9e2, 2);
  rim.position.set(15, 12, -24);
  scene.add(rim);
  const geometries = new Map();
  const materials = new Map();
  const textures = [];
  function material(color, metalness = .25, roughness = .65) {
    const key = `${color}-${metalness}-${roughness}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, metalness, roughness }));
    return materials.get(key);
  }
  function box(parent, w, h, d, x, y, z, color, metalness = .25) {
    const key = `${w}/${h}/${d}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.BoxGeometry(w, h, d));
    const mesh = new THREE.Mesh(geometries.get(key), material(color, metalness));
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function beam(parent, a, b, width, color) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const mesh = box(parent, width, start.distanceTo(end), width, 0, 0, 0, color);
    mesh.position.copy(start.clone().add(end).multiplyScalar(.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    return mesh;
  }
  function wheel(parent, x, y, z, radius = .62, width = .35) {
    const key = `wheel-${radius}-${width}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.CylinderGeometry(radius, radius, width, 20));
    const tire = new THREE.Mesh(geometries.get(key), material(0x171b20, .05, .9));
    tire.rotation.x = Math.PI / 2;
    tire.position.set(x, y, z);
    tire.castShadow = true;
    parent.add(tire);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * .52, radius * .52, width + .02, 12), material(0x8a939a, .75));
    hub.rotation.x = Math.PI / 2;
    hub.position.copy(tire.position);
    parent.add(hub);
    return tire;
  }
  function label(parent, text, w, h, x, y, z, color = '#edf1f2', background = '#1c3443') {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = background; ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = color; ctx.font = '600 53px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 66);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
    const m = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    materials.set(`label-${materials.size}`, m);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    plane.position.set(x, y, z); parent.add(plane);
    return plane;
  }
  function container(parent, color = GOLD, identified = false) {
    const group = new THREE.Group(); parent.add(group);
    box(group, 12.2, 2.6, 2.44, 0, 1.3, 0, color);
    for (let i = 0; i < 40; i++) {
      const x = -5.95 + i * .305;
      for (const z of [-1.25, 1.25]) box(group, .07, 2.4, .07, x, 1.3, z, color);
      box(group, .08, .055, 2.4, x, 2.63, 0, color);
    }
    for (const y of [.09, 2.53]) for (const z of [-1.27, 1.27]) box(group, 12.26, .12, .12, 0, y, z, 0x8b724d);
    for (const x of [-6.1, 6.1]) {
      for (const z of [-1.25, 1.25]) box(group, .13, 2.66, .13, x, 1.3, z, color);
      for (const z of [-.85, -.28, .28, .85]) box(group, .09, 2.3, .07, x + .03, 1.3, z, 0x949a99);
    }
    if (identified) {
      label(group, 'GCPU 4821', 3.8, .85, -2.5, 1.65, 1.3, '#182734', '#d6b371');
      const back = label(group, 'GCPU 4821', 3.8, .85, 2.5, 1.65, -1.3, '#182734', '#d6b371'); back.rotation.y = Math.PI;
    }
    return group;
  }
  function ground(parent, rail = false) {
    box(parent, 180, .2, 100, 0, -.2, 0, rail ? 0x687276 : 0x45545a, .05);
    if (!rail) for (let i = -5; i < 6; i++) box(parent, .08, .01, 26, i * 10, -.09, 9, 0xa49e84, .05);
    for (let i = 0; i < 9; i++) {
      const p = -45 + i * 12;
      box(parent, .15, 14, .15, p, 7, -22, 0x879298);
      box(parent, 3, .18, .38, p, 14, -22, 0xbdc8ce);
    }
  }
  function rails(parent, z, extent = 70) {
    for (const offset of [-.9, .9]) box(parent, extent * 2, .16, .13, 0, .1, z + offset, 0xaaaeb1, .85);
    for (let x = -extent; x <= extent; x += 1.1) box(parent, .25, .12, 2.5, x, -.005, z, 0x343b3d);
  }
  function flatcar(parent, x = 0, z = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    box(g, 15, .38, 2.9, 0, 1.05, 0, 0x7e6950);
    for (const side of [-1.45, 1.45]) box(g, 15, .35, .13, 0, 1.22, side, 0x9b8059);
    for (const end of [-5, 5]) for (const delta of [-.55, .55]) for (const side of [-1.05, 1.05]) wheel(g, end + delta, .48, side, .47, .24);
    box(g, 16, .18, .3, 0, .9, 0, 0x303940);
    return g;
  }
  function truck(parent) {
    const g = new THREE.Group(); parent.add(g);
    box(g, 15.4, .24, 2.3, 0, 1.02, 0, 0x424c54);
    box(g, 3.3, 2.9, 2.35, -8.1, 2.15, 0, 0xe4e8e7);
    box(g, 2, 1.05, 2.15, -10.1, 1.72, 0, 0xdde2e2);
    box(g, 2.4, 1, 2.4, -8.5, 2.85, 0, 0x273e4d);
    box(g, .1, .75, 1.95, -11.12, 1.5, 0, 0x8f999c, .8);
    for (const z of [-.82, .82]) box(g, .12, .22, .4, -11.2, 1.92, z, 0xffffda);
    box(g, .16, 3.5, .16, -6.72, 2.65, -.93, 0xa6b0b3, .8);
    for (const x of [-9.5, -5.9, -4.55, 4.5, 5.85]) for (const z of [-1.22, 1.22]) wheel(g, x, .66, z);
    for (const z of [-1.38, 1.38]) box(g, .4, .25, .25, -8.95, 3, z, 0x546671);
    return g;
  }
  const environments = [];
  function environment() { const g = new THREE.Group(); scene.add(g); environments.push(g); return g; }
  // Yard: a telescopic reach stacker transfers the identified box to a waiting railcar.
  const yard = environment(); ground(yard); rails(yard, -5);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
    const c = container(yard, [0x496978, 0x6a7476, 0x253e51][(row + col) % 3]); c.position.set(col * 13 - 27, row * 2.68, -15);
  }
  flatcar(yard, 0, -5);
  const stacker = new THREE.Group(); yard.add(stacker);
  box(stacker, 5.7, 1.25, 3.4, 0, 1.5, 4.6, NAVY);
  box(stacker, 2.1, 2.25, 2.3, 1.5, 3, 4.6, 0x254b61);
  box(stacker, 1.85, 1.2, 2.36, 1.55, 3.4, 4.6, 0x71929f);
  for (const x of [-2.1, 2]) for (const z of [2.75, 6.45]) wheel(stacker, x, .95, z, .94, .65);
  const boom = beam(stacker, [-1.5, 2.3, 4.6], [-1.5, 8, -1], .8, 0x426277);
  const spreader = box(yard, 10.8, .3, 2, 0, 7.8, 0, 0x354752);
  const yardContainer = container(yard, GOLD, true);
  // Rail: identifiable well-car consist and locomotive against a North American right of way.
  const railway = environment(); ground(railway, true); rails(railway, 0); rails(railway, -6);
  const train = new THREE.Group(); railway.add(train);
  const railContainer = container(flatcar(train), GOLD, true); railContainer.position.y = 1.32;
  for (const x of [-16, 16, 32]) {
    const c = container(flatcar(train, x), x < 0 ? 0x536b75 : 0x415563); c.position.y = 1.32;
  }
  const locomotive = new THREE.Group(); locomotive.position.x = -32; train.add(locomotive);
  box(locomotive, 15, .6, 3, 0, 1.2, 0, 0x182d3c);
  box(locomotive, 10.8, 2.7, 2.5, 1, 2.85, 0, 0x34576a);
  box(locomotive, 3.8, 3.5, 2.9, -5, 3.1, 0, 0x34576a);
  box(locomotive, 2.8, 1, 3, -5.3, 4.05, 0, 0x8cabb7);
  box(locomotive, 15, .2, 3.15, 0, 1.62, 0, GOLD);
  for (const x of [-4.8, -3.6, 3.6, 4.8]) for (const z of [-1.25, 1.25]) wheel(locomotive, x, .57, z, .56, .3);
  for (let i = 0; i < 15; i++) {
    const x = i * 9 - 65;
    box(railway, .16, 8, .16, x, 4, -13, 0x655f56);
    beam(railway, [x, 7.1, -13], [x, 7.1, -10], .1, 0x8b8e89);
    box(railway, 9, .035, .035, x + 4.5, 7.15, -11, 0x797d7a);
    box(railway, 8, 1.7 + (i % 3), 3, x, .65, -28, 0x344b52);
  }
  // Transfer: the crane lowers the same box onto the drayage chassis.
  const transfer = environment(); ground(transfer); rails(transfer, -6);
  const gantry = new THREE.Group(); transfer.add(gantry);
  for (const x of [-8, 8]) for (const z of [-9, 7]) {
    box(gantry, .65, 12, .65, x, 6, z, 0x718b95);
    box(gantry, 2.2, .65, 1.4, x, .45, z, 0x3d525f);
  }
  for (const x of [-8, 8]) beam(gantry, [x, 12, -9], [x, 12, 7], .85, 0x91a6ad);
  for (const z of [-9, 7]) beam(gantry, [-8, 12, z], [8, 12, z], .85, 0x91a6ad);
  beam(gantry, [-8, 12, -1], [8, 12, -1], .7, 0xb1bbc0);
  const trolley = box(transfer, 3, .6, 3, 0, 11.5, -1, GOLD);
  const ropes = [-4, 4].map(x => box(transfer, .035, 5, .035, x, 8, -1, 0xc1c7c8));
  const transferSpreader = box(transfer, 10.5, .3, 2.1, 0, 6, -1, 0x3f535e);
  const drayTruck = truck(transfer); drayTruck.position.z = -1;
  const transferContainer = container(transfer, GOLD, true);
  for (let i = 0; i < 5; i++) {
    const c = container(transfer, 0x455e6c); c.position.set(i * 13 - 25, 0, -20);
  }
  // Final mile: appointment, dock alignment and a recorded receipt.
  const warehouse = environment(); ground(warehouse);
  box(warehouse, 60, 12, 12, 5, 6, -13, 0x8c999d);
  box(warehouse, 61, .65, 13, 5, 12.2, -13, 0x4a626e);
  for (let x = -22; x < 34; x += 1.2) box(warehouse, .035, 11, .06, x, 6.2, -6.94, 0xaeb7b8);
  const doors = [];
  for (const x of [-17, -6, 5, 16, 27]) {
    box(warehouse, 5, 5.6, .25, x, 2.8, -6.73, 0x203743);
    const door = box(warehouse, 4.1, 4.6, .2, x, 3.05, -6.51, 0x8f9d9f); doors.push(door);
    for (let y = 1.1; y < 5.2; y += .42) box(door, 4.05, .025, .025, 0, y - 3.05, .12, 0x657c85);
    box(warehouse, 5.2, .8, 1.2, x, .4, -6.4, 0x344956);
    label(warehouse, `DOCK ${String((x + 17) / 11 + 1).padStart(2, '0')}`, 3.5, .65, x, 6.4, -6.65);
  }
  const arrivalTruck = truck(warehouse); arrivalTruck.rotation.y = -Math.PI / 2;
  const arrivalContainer = container(arrivalTruck, GOLD, true); arrivalContainer.position.y = 1.2;
  label(warehouse, 'RECEIVING', 8, 1.8, 5, 9.4, -6.6);
  const dockLight = box(warehouse, .2, .3, .18, 7.9, 3.8, -6.5, GOLD);
  // One visible container is reparented at each handoff; hidden rigs provide its exact local pose.
  const containerPoses = [yardContainer, railContainer, transferContainer, arrivalContainer];
  containerPoses.forEach(pose => { pose.visible = false; });
  const journeyContainer = container(scene, GOLD, true);
  const cameraTargets = new THREE.Vector3();
  const cameraPositions = [
    [[23, 15, 28], [18, 11, 22], [0, 3, -1]],
    [[19, 11, 26], [6, 7, 24], [0, 2.5, 0]],
    [[22, 16, 26], [17, 9, 22], [-1, 3.6, -1]],
    [[25, 15, 30], [18, 9, 20], [5, 3.4, -2]]
  ];
  let width = 1, height = 1, mobile = false, disposed = false, frame = 0, currentStage = -1;
  function render(progress) {
    if (disposed) return;
    const p = clamp(progress, 0, .999999);
    const stage = Math.min(3, Math.floor(p * 4));
    const t = p * 4 - stage;
    environments.forEach((g, i) => { g.visible = i === stage; });
    const transition = stage < 3 ? smooth(.94, 1, t) : 0;
    const incoming = stage > 0 ? 1 - smooth(0, .055, t) : 0;
    cut.style.opacity = String(Math.max(transition, incoming));
    const lift = smooth(.08, .38, t);
    const lower = smooth(.65, .88, t);
    yardContainer.position.set(0, mix(.04, 4.7, lift) - lower * 3.38, mix(1.2, -5, smooth(.35, .65, t)));
    spreader.position.set(0, yardContainer.position.y + 2.85, yardContainer.position.z);
    const start = new THREE.Vector3(-1.5, 2.3, 4.6), end = new THREE.Vector3(0, spreader.position.y + .3, spreader.position.z);
    boom.position.copy(start.clone().add(end).multiplyScalar(.5));
    boom.scale.y = start.distanceTo(end) / Math.sqrt(5.7 ** 2 + 5.6 ** 2);
    boom.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    train.position.x = mix(12, -18, smooth(.02, .94, t));
    const lowered = smooth(.15, .56, t), departure = smooth(.62, .96, t);
    transferContainer.position.set(-departure * 22, mix(7, 1.2, lowered), -1);
    transferSpreader.position.set(0, mix(9.8, 4.05, lowered) + smooth(.58, .7, t) * 6, -1);
    trolley.position.x = 0;
    ropes.forEach(rope => { const length = 11.2 - transferSpreader.position.y; rope.scale.y = Math.max(.02, length / 5); rope.position.y = transferSpreader.position.y + length / 2; });
    drayTruck.position.x = -departure * 22;
    arrivalTruck.position.set(5, 0, mix(16, -1.9, smooth(.04, .76, t)));
    doors[2].position.y = 3.05 + smooth(.55, .85, t) * 3.8;
    dockLight.material = material(t > .82 ? 0x9dbca8 : GOLD);
    const pose = containerPoses[stage];
    if (journeyContainer.parent !== pose.parent) pose.parent.add(journeyContainer);
    journeyContainer.position.copy(pose.position);
    journeyContainer.quaternion.copy(pose.quaternion);
    const shot = cameraPositions[stage];
    const travel = smooth(0, .9, t);
    camera.position.fromArray(shot[0]).lerp(new THREE.Vector3(...shot[1]), travel);
    cameraTargets.fromArray(shot[2]);
    if (stage === 1) { camera.position.x += train.position.x * .8; cameraTargets.x = train.position.x; }
    if (stage === 2) { camera.position.x += drayTruck.position.x * .45; cameraTargets.x = drayTruck.position.x * .6; }
    if (mobile) {
      // Phone framing keeps the equipment above the caption, rather than shrinking the desktop shot.
      camera.position.y += 11;
      camera.position.z += stage === 3 ? 20 : 16;
      camera.fov = 47;
      cameraTargets.y -= 5.8;
    } else { camera.fov = 38; cameraTargets.x -= 5.5; }
    camera.lookAt(cameraTargets); camera.updateProjectionMatrix();
    if (stage !== currentStage) {
      captions.forEach((item, i) => { item.hidden = i !== stage; });
      chapters.forEach((button, i) => { if (i === stage) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
      root.querySelector('.sc-stage-number').textContent = `0${stage + 1}`;
      currentStage = stage;
    }
    stateText.textContent = STAGES[stage].state[Math.min(2, Math.floor(t * 3))];
    chapters.forEach((button, i) => button.style.setProperty('--sc-fill', `${i < stage ? 100 : i === stage ? t * 100 : 0}%`));
    root.dataset.stage = String(stage);
    root.dataset.progress = p.toFixed(4);
    renderer.render(scene, camera);
  }
  function scrollProgress() {
    const bounds = root.getBoundingClientRect();
    return clamp(-bounds.top / Math.max(1, root.offsetHeight - height), 0, 1);
  }
  function update() { frame = 0; if (!motion.matches) render(scrollProgress()); }
  function schedule() { if (!frame && !disposed) frame = requestAnimationFrame(update); }
  function resize() {
    width = host.clientWidth || root.clientWidth;
    height = host.clientHeight || window.innerHeight;
    mobile = width <= 700;
    renderer.setSize(width, height, false); camera.aspect = width / height;
    if (motion.matches) renderStatic(); else render(scrollProgress());
  }
  function renderStatic() {
    root.classList.add('sc-reduced');
    root.querySelectorAll('.sc-static-scene').forEach(item => item.remove());
    renderer.setSize(Math.max(1, root.clientWidth), Math.max(1, window.innerHeight), false);
    camera.aspect = Math.max(1, root.clientWidth) / Math.max(1, window.innerHeight);
    for (let i = 0; i < 4; i++) {
      render((i + .58) / 4);
      const canvas = document.createElement('canvas'); canvas.width = renderer.domElement.width; canvas.height = renderer.domElement.height;
      canvas.getContext('2d').drawImage(renderer.domElement, 0, 0);
      canvas.className = 'sc-static-scene'; canvas.setAttribute('aria-hidden', 'true'); captions[i].prepend(canvas); captions[i].hidden = false;
    }
    captions.forEach(item => { item.hidden = false; });
    currentStage = -1;
  }
  function preferenceChanged() { root.classList.toggle('sc-reduced', motion.matches); resize(); }
  function goTo(event) {
    const button = event.currentTarget;
    const index = Number(button.dataset.scStage);
    if (motion.matches) { captions[index].scrollIntoView({ behavior: 'auto', block: 'start' }); return; }
    const top = root.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (root.offsetHeight - height) * ((index + .12) / 4), behavior: 'instant' });
    schedule();
  }
  const observer = new ResizeObserver(resize); observer.observe(host);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  motion.addEventListener('change', preferenceChanged);
  chapters.forEach(button => button.addEventListener('click', goTo));
  const contextLost = event => { event.preventDefault(); root.classList.add('sc-unavailable'); root.querySelector('.sc-fallback').hidden = false; captions.forEach(item => { item.hidden = false; }); };
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  resize();
  const api = {
    setProgress: render,
    destroy() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', resize);
      motion.removeEventListener('change', preferenceChanged);
      chapters.forEach(button => button.removeEventListener('click', goTo));
      scene.traverse(object => { if (object.isMesh) object.geometry?.dispose(); });
      materials.forEach(m => m.dispose()); textures.forEach(texture => texture.dispose());
      renderer.dispose(); root.innerHTML = ''; root.classList.remove('sc-reduced', 'sc-unavailable'); delete root.__supplyChain;
    }
  };
  root.__supplyChain = api;
  return api;
}

/** Scroll-scrub cinematic footage while keeping the operating touchpoints in sync. */
export function initInterstate(root) {
  if (!root) throw new Error('Interstate section is required');
  if (root.__interstate) return root.__interstate;
  const points = [
    ['Observe', 'Verify the arriving equipment.', 'Match the truck, container, and arrival event to the shipment record.'],
    ['Understand', 'Interpret the appointment context.', 'Probabilistic AI can reconcile changing ETAs and unstructured updates against the receiving plan.'],
    ['Coordinate', 'Give the handoff a clear owner.', 'Share current status, the next step, and escalation responsibility across dispatch and receiving.'],
    ['Authorize', 'Keep the backing move human-controlled.', 'A qualified driver performs the maneuver; authorized staff confirm the assigned dock and operating plan.'],
    ['Record', 'Make completion auditable.', 'Deterministic rules preserve appointment requirements, and the completed handoff is recorded.']
  ];
  root.innerHTML = `<div class="is-pin"><div class="is-scene" aria-hidden="true"><video class="is-video" muted playsinline preload="metadata" tabindex="-1"><source src="./assets/videos/drayage-dock.mp4" type="video/mp4"></video></div><div class="is-shade" aria-hidden="true"></div><p class="is-eyebrow">AI IN THE FLOW OF TRANSPORTATION</p><div class="is-title"><h2>From dock arrival<br>to accountable handoff.</h2><p>One physical move. Clear context. Human-controlled execution.</p></div><div class="is-touchpoints">${points.map((p, i) => `<article class="is-touchpoint" data-is-point="${i}" ${i ? 'hidden' : ''}><span>0${i + 1} / ${p[0]}</span><h3>${p[1]}</h3><p>${p[2]}</p></article>`).join('')}</div><div class="is-scale"><span>ARRIVAL</span><div><i></i></div><span>DOCK HANDOFF</span></div><p class="is-equipment">DRAYAGE / 40-FT CONTAINER</p><p class="is-fallback" hidden>The sequence shows a drayage arrival and dock handoff, supported by verified shipment context, clear ownership, human-controlled vehicle movement, and an auditable record.</p></div>`;
  const video = root.querySelector('.is-video');
  const cards = [...root.querySelectorAll('.is-touchpoint')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, disposed = false, height = 1, initialOffsetApplied = false;
  let duration = 10;
  const setTime = (video, time) => {
    if (!Number.isFinite(video.duration) || video.readyState < 1) return;
    const next = Math.min(video.duration - .04, Math.max(.04, time));
    if (Math.abs(video.currentTime - next) > .045) video.currentTime = next;
  };
  video.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(video.duration)) duration = Math.max(.1, video.duration);
    if (!initialOffsetApplied) { setTime(video, .04); initialOffsetApplied = true; }
    update();
  });
  video.addEventListener('loadeddata', update);
  function render(value) {
    if (disposed) return;
    const p = THREE.MathUtils.clamp(value, 0, 1);
    setTime(video, p * duration);
    const active = Math.min(points.length - 1, Math.floor(p * points.length));
    cards.forEach((card, i) => { card.hidden = reduced.matches ? false : i !== active; card.dataset.complete = String(i < active); });
    root.querySelector('.is-scale i').style.width = `${p * 100}%`;
    root.dataset.progress = p.toFixed(4); root.dataset.touchpoint = String(active);
  }
  function update() {
    frame = 0;
    if (reduced.matches) render(.5);
    else render(THREE.MathUtils.clamp(-root.getBoundingClientRect().top / Math.max(1, root.offsetHeight - height), 0, 1));
  }
  function schedule() { if (!frame && !disposed) frame = requestAnimationFrame(update); }
  function resize() {
    height = root.querySelector('.is-pin').clientHeight || innerHeight;
    root.classList.toggle('is-reduced', reduced.matches);
    if (reduced.matches) render(.5); else update();
  }
  video.pause();
  video.addEventListener('canplay', update);
  video.addEventListener('progress', update);
  video.addEventListener('error', () => { root.classList.add('is-unavailable'); root.querySelector('.is-fallback').hidden = false; });
  const observer = new IntersectionObserver(entries => {
    const visible = entries[0].isIntersecting;
    if (visible) { if (video.readyState === 0) video.load(); update(); }
    else video.pause();
  }, { rootMargin: '100% 0px' });
  observer.observe(root);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  reduced.addEventListener('change', resize);
  resize();
  root.__interstate = { setProgress: render, destroy() {
    disposed = true; cancelAnimationFrame(frame); observer.disconnect();
    window.removeEventListener('scroll', schedule); window.removeEventListener('resize', resize); reduced.removeEventListener('change', resize);
    video.pause(); video.removeAttribute('src'); video.querySelector('source')?.removeAttribute('src'); video.load();
    root.innerHTML = ''; root.classList.remove('is-reduced', 'is-unavailable'); delete root.__interstate;
  } };
  return root.__interstate;
}

/** Procedural fallback scene retained for comparison in this local prototype. */
export function initInterstateProcedural(root) {
  if (!root) throw new Error('Interstate section is required');
  if (root.__interstate) return root.__interstate;
  const points = [
    ['Observe', 'Recognize the arrival.', 'A physical event becomes a verified operating record.'],
    ['Understand', 'Interpret the service risk.', 'Probabilistic AI reconciles the ETA, appointment, and customer commitment.'],
    ['Coordinate', 'Give the exception an owner.', 'The next action, accountable team, and escalation threshold are explicit.'],
    ['Authorize', 'Preserve human control.', 'A qualified person approves the recovery plan within defined decision rights.'],
    ['Execute', 'Move within the rules.', 'Deterministic logic executes the authorized action and records the outcome.']
  ];
  root.innerHTML = `<div class="is-pin"><div class="is-scene" aria-hidden="true"></div><div class="is-shade" aria-hidden="true"></div><p class="is-eyebrow">AI IN THE FLOW OF TRANSPORTATION</p><div class="is-title"><h2>One journey.<br>Better decisions.</h2><p>The physical move is only part of the operation.</p></div><div class="is-touchpoints">${points.map((p, i) => `<article class="is-touchpoint" data-is-point="${i}"><span>0${i + 1} / ${p[0]}</span><h3>${p[1]}</h3><p>${p[2]}</p></article>`).join('')}</div><div class="is-scale"><span>CLOSE TO THE WORK</span><div><i></i></div><span>THE ENTIRE OPERATION</span></div><p class="is-equipment">NORTH AMERICAN LINEHAUL / DRY VAN</p><p class="is-fallback" hidden>The journey connects arrival recognition, service-risk interpretation, exception ownership, human approval, and controlled execution.</p></div>`;
  const host = root.querySelector('.is-scene');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
  catch (error) { root.classList.add('is-unavailable'); root.querySelector('.is-fallback').hidden = false; return { destroy() { root.innerHTML = ''; }, error }; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x162e3d); scene.fog = new THREE.Fog(0x162e3d, 160, 520);
  scene.add(new THREE.HemisphereLight(0xdbedf8, 0x425c52, 3));
  const sun = new THREE.DirectionalLight(0xffe8c8, 4); sun.position.set(-40, 90, 45); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 1, far: 250 }); sun.shadow.normalBias = .05; scene.add(sun, sun.target);
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 900);
  const materials = new Map(), geometries = new Map();
  function mat(color, metallic = .15) { const key = `${color}-${metallic}`; if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, metalness: metallic, roughness: metallic > .7 ? .22 : .72 })); return materials.get(key); }
  function block(parent, size, position, color, metallic = .15) {
    const key = size.join('/'); if (!geometries.has(key)) geometries.set(key, new THREE.BoxGeometry(...size));
    const mesh = new THREE.Mesh(geometries.get(key), mat(color, metallic)); mesh.position.set(...position); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function cylinder(parent, radius, length, position, color, metallic = .2, horizontal = false) {
    const key = `c-${radius}-${length}`; if (!geometries.has(key)) geometries.set(key, new THREE.CylinderGeometry(radius, radius, length, 20));
    const mesh = new THREE.Mesh(geometries.get(key), mat(color, metallic)); mesh.position.set(...position); if (horizontal) mesh.rotation.x = Math.PI / 2; mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  block(scene, [800, .4, 650], [0, -.45, 0], 0x445c50);
  block(scene, [700, .12, 21], [0, -.17, 0], 0x303e46);
  block(scene, [700, .15, 1.8], [0, -.08, 0], 0x7c856e);
  for (const z of [-9.6, -1.5, 1.5, 9.6]) block(scene, [700, .012, .12], [0, .001, z], z === -1.5 || z === 1.5 ? 0xc2a467 : 0xb5beb8);
  for (let x = -340; x < 350; x += 8) for (const z of [-5.4, 5.4]) block(scene, [3.5, .013, .11], [x, .015, z], 0xb8c2bf);
  for (const z of [-11.5, 11.5]) {
    block(scene, [700, .12, .12], [0, .7, z], 0x9ba7a6, .75);
    for (let x = -330; x < 340; x += 12) block(scene, [.08, .75, .08], [x, .35, z], 0x9ba7a6, .75);
  }
  const rig = new THREE.Group(); scene.add(rig);
  // Conventional North American tractor: long hood, sleeper, chrome grille, tanks and twin stacks.
  block(rig, [19.5, .35, 2.5], [0, 1.15, 0], 0x273c48);
  block(rig, [3.2, 2.7, 2.4], [-10, 2.5, 0], 0x183e55);
  block(rig, [2.5, 1.6, 2.05], [-12.7, 2.05, 0], 0x214e64);
  block(rig, [2.8, 3.2, 2.5], [-7.3, 2.75, 0], 0x183e55);
  block(rig, [1.8, 1, 2.46], [-10.5, 3.2, 0], 0x779cae);
  block(rig, [.14, 1.45, 1.9], [-14.01, 2.04, 0], 0xc6d0d0, .95);
  for (let z = -.78; z <= .79; z += .13) block(rig, [.16, 1.25, .025], [-14.1, 2.04, z], 0x435561, .9);
  block(rig, [.27, .42, 2.65], [-14.2, 1.17, 0], 0xc6d0d0, .95);
  for (const z of [-1.1, 1.1]) {
    block(rig, [.35, .3, .3], [-13.8, 2.28, z], 0xffefbe);
    cylinder(rig, .13, 4.3, [-8.8, 3.05, z * 1.22], 0xc2ced1, .95);
    cylinder(rig, .44, 1.45, [-8, 1.08, z * 1.15], 0xc2ced1, .95, true);
    block(rig, [2, .15, .36], [-9.6, .9, z * 1.3], 0xb2c0c4, .95);
    block(rig, [.45, .35, .25], [-10.6, 3.65, z * 1.3], 0xc2ced1, .9);
  }
  const wheels = [];
  for (const x of [-12.7, -6.3, -4.9, 6.6, 7.9]) for (const z of [-1.3, 1.3]) {
    wheels.push(cylinder(rig, .66, .4, [x, .66, z], 0x171c21, .02, true));
    cylinder(rig, .35, .42, [x, .66, z], 0xabb8be, .9, true);
  }
  // Smooth-sided conventional dry van. No corrugation, ISO corner castings or container chassis.
  block(rig, [16.1, 3.15, 2.65], [2.2, 2.93, 0], 0xe2e7e6);
  for (const z of [-1.34, 1.34]) {
    block(rig, [16.2, .15, .1], [2.2, 1.38, z], 0xa4b4ba, .75);
    block(rig, [16.2, .08, .1], [2.2, 4.49, z], 0xb6c5c8, .8);
    block(rig, [15.7, .12, .02], [2.2, 1.55, z + Math.sign(z) * .04], GOLD);
    for (let x = -5.7; x < 10.1; x += 1.1) block(rig, [.018, 2.92, .015], [x, 2.94, z], 0xc9d1d0);
  }
  block(rig, [.06, 2.97, 2.5], [10.29, 2.94, 0], 0xb9c6c9);
  for (const z of [-.78, -.26, .26, .78]) block(rig, [.08, 2.65, .035], [10.34, 2.95, z], 0x869ba4, .8);
  for (let i = 0; i < 22; i++) {
    const x = i * 24 - 240, z = (i % 2 ? 1 : -1) * (28 + i % 4 * 7);
    block(scene, [9 + i % 3 * 3, 3 + i % 4, 7], [x, 1.5, z], 0x536865);
  }
  // Branch roads emerge in the pullback; they are physical roads, not dashboard connectors.
  for (const x of [-90, 15, 120]) {
    const road = block(scene, [9, .08, 130], [x, -.13, 48], 0x39494e); road.rotation.y = .25;
    block(scene, [52, 8, 24], [x + 30, 4, 98], 0x778b90);
    block(scene, [62, .04, 37], [x + 28, -.1, 89], 0x526166);
  }
  const markers = points.map((p, i) => {
    const group = new THREE.Group(); scene.add(group);
    group.position.set(-55 + i * 35, .2, i % 2 ? -7.8 : 7.8);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, .045, 6, 40), new THREE.MeshBasicMaterial({ color: GOLD })); ring.rotation.x = Math.PI / 2; group.add(ring);
    cylinder(group, .18, 5, [0, 2.5, 0], GOLD, .5);
    cylinder(group, .5, .08, [0, 5.05, 0], GOLD, .5);
    return group;
  });
  let frame = 0, disposed = false, height = 1, mobile = false;
  const cards = [...root.querySelectorAll('.is-touchpoint')];
  function render(value) {
    if (disposed) return;
    const p = clamp(value, 0, 1), zoom = smooth(.05, .94, p);
    rig.position.set(mix(-45, 90, p), 0, 5.3);
    wheels.forEach(wheel => { wheel.rotation.y = -p * 60; });
    const center = new THREE.Vector3(rig.position.x, 1.6, 5.3);
    camera.position.set(center.x - mix(23, 60, zoom), mix(9, mobile ? 145 : 115, zoom), center.z + mix(21, mobile ? 155 : 130, zoom));
    const target = center.clone(); target.y -= mobile ? mix(6, 14, zoom) : mix(0, 14, zoom);
    if (!mobile) target.x -= mix(6, 15, zoom);
    camera.fov = mobile ? 48 : 40; camera.lookAt(target); camera.updateProjectionMatrix();
    const active = Math.min(4, Math.floor(p * 5));
    cards.forEach((card, i) => { const visible = reduced.matches || i === active; card.hidden = !visible; card.dataset.complete = String(i < active); });
    markers.forEach((marker, i) => { marker.visible = p >= i * .18; marker.scale.setScalar(i === active ? 1.2 : 1); });
    root.querySelector('.is-scale i').style.width = `${p * 100}%`;
    root.dataset.progress = p.toFixed(4); root.dataset.touchpoint = String(active);
    renderer.render(scene, camera);
  }
  function update() { frame = 0; if (!reduced.matches) render(clamp(-root.getBoundingClientRect().top / Math.max(1, root.offsetHeight - height), 0, 1)); }
  function schedule() { if (!frame && !disposed) frame = requestAnimationFrame(update); }
  function resize() { height = host.clientHeight || innerHeight; mobile = root.clientWidth <= 700; renderer.setSize(host.clientWidth || root.clientWidth, height, false); camera.aspect = (host.clientWidth || root.clientWidth) / height; if (reduced.matches) { root.classList.add('is-reduced'); render(.42); } else { root.classList.remove('is-reduced'); update(); } }
  const observer = new ResizeObserver(resize); observer.observe(host);
  window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', resize, { passive: true }); reduced.addEventListener('change', resize);
  const lost = event => { event.preventDefault(); root.classList.add('is-unavailable'); root.querySelector('.is-fallback').hidden = false; cards.forEach(card => { card.hidden = false; }); };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  resize();
  const api = { setProgress: render, destroy() { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', resize); reduced.removeEventListener('change', resize); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); scene.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); renderer.dispose(); root.innerHTML = ''; root.classList.remove('is-reduced', 'is-unavailable'); delete root.__interstate; } };
  root.__interstate = api; return api;
}
