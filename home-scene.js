import * as THREE from './assets/vendor/three/three.module.js';

const host = document.querySelector('#scene');
const pauseButton = document.querySelector('#pause');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches;
let dragging = false;
let visible = true;
let previousPointer = { x: 0, y: 0 };
let targetX = 0.55, targetY = -0.2, hoverX = 0, hoverY = 0;
let scrollProgress = 0;
const gold = 0xcba660;
const toPoint = (lon, lat, r = 2.5) => {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
};

function insideRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > lat) !== (b[1] > lat) && lon < (b[0] - a[0]) * (lat - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

try {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setClearColor(0x060b10);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.z = 11.4;
  const world = new THREE.Group();
  scene.add(world);
  world.rotation.set(targetX, targetY, -0.12);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(2.48, 64, 48), new THREE.MeshPhongMaterial({ color: 0x08131c, shininess: 12, specular: 0x152b38 }));
  world.add(sphere);
  scene.add(new THREE.AmbientLight(0x749db7, 1.2));
  const light = new THREE.DirectionalLight(0xb6d4e7, 2.1);
  light.position.set(4, 4, 6); scene.add(light);

  const data = await fetch('/assets/vendor/three/countries.geojson').then(response => {
    if (!response.ok) throw new Error('Globe geography unavailable');
    return response.json();
  });
  const polygons = data.features.flatMap(feature => feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates)
    .map(rings => ({ rings, minX: Math.min(...rings[0].map(p => p[0])), maxX: Math.max(...rings[0].map(p => p[0])), minY: Math.min(...rings[0].map(p => p[1])), maxY: Math.max(...rings[0].map(p => p[1])) }));
  const positions = [], colors = [];
  // Equal-area sampling keeps the dotted geography even near the poles.
  for (let i = 0; i < 52000; i++) {
    const lat = THREE.MathUtils.radToDeg(Math.asin(1 - 2 * (i + 0.5) / 52000));
    const lon = ((i * 137.507764) % 360) - 180;
    const land = polygons.some(p => lon >= p.minX && lon <= p.maxX && lat >= p.minY && lat <= p.maxY && insideRing(lon, lat, p.rings[0]) && !p.rings.slice(1).some(ring => insideRing(lon, lat, ring)));
    if (!land) continue;
    const point = toPoint(lon, lat); positions.push(point.x, point.y, point.z);
    const northAmerica = lon > -165 && lon < -52 && lat > 14 && lat < 72;
    const c = new THREE.Color(northAmerica ? 0xdbe5e9 : 0x8ba8ba); colors.push(c.r, c.g, c.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  world.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.021, vertexColors: true, sizeAttenuation: true })));

  const routes = [
    [[-123.1,49.3],[-79.4,43.7]], [[-118.2,33.9],[-87.6,41.9]], [[-87.6,41.9],[-74,40.7]],
    [[-96.8,32.8],[-79.4,43.7]], [[-74,40.7],[-0.1,51.5]], [[-123.1,49.3],[139.7,35.7]],
    [[-79.4,43.7],[-99.1,19.4]], [[-0.1,51.5],[4.5,51.9]],
    [[4.5,51.9],[103.8,1.3]], [[103.8,1.3],[151.2,-33.9]], [[121.5,31.2],[-118.2,33.9]],
    [[55.3,25.2],[72.9,19.1]], [[-46.6,-23.5],[-74,40.7]], [[18.4,-33.9],[4.5,51.9]]
  ];
  const signals = [];
  for (const [index, route] of routes.entries()) {
    const start = toPoint(...route[0]), end = toPoint(...route[1]);
    const points = Array.from({ length: 81 }, (_, i) => {
      const t = i / 80;
      return start.clone().lerp(end, t).normalize().multiplyScalar(2.52 + Math.sin(t * Math.PI) * 0.38);
    });
    const path = new THREE.CatmullRomCurve3(points);
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: index < 4 ? gold : 0x526978, transparent: true, opacity: index < 4 ? .48 : .25 })));
    for (const endpoint of [start, end]) {
      const node = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), new THREE.MeshBasicMaterial({ color: gold }));
      node.position.copy(endpoint.clone().normalize().multiplyScalar(2.53)); world.add(node);
    }
    const signal = new THREE.Mesh(new THREE.SphereGeometry(.027, 10, 8), new THREE.MeshBasicMaterial({ color: 0xf2cf89 }));
    world.add(signal); signals.push({ mesh: signal, path, offset: index / routes.length });
  }
  for (const radius of [2.8, 3.03]) {
    const ring = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2).getPoints(200).map(p => new THREE.Vector3(p.x,p.y,0));
    const orbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ring), new THREE.LineBasicMaterial({ color: 0x405563, transparent: true, opacity: .2 }));
    orbit.rotation.x = 1.05; orbit.rotation.y = .4; world.add(orbit);
  }
  document.querySelector('#fallback').hidden = true;

  function resize() {
    const width = host.clientWidth, height = host.clientHeight;
    renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix();
    if (width <= 700) { world.position.set(0, 1.65, 0); world.scale.setScalar(.38); camera.position.z = 11.8; }
    else { world.position.set(2.45, .05, 0); world.scale.setScalar(1.08); camera.position.z = 11.4; }
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize();
  host.addEventListener('pointerdown', event => {
    dragging = true; previousPointer = { x: event.clientX, y: event.clientY }; host.setPointerCapture(event.pointerId); host.classList.add('dragging');
  });
  host.addEventListener('pointermove', event => {
    if (dragging) { targetY += (event.clientX - previousPointer.x) * .005; targetX = THREE.MathUtils.clamp(targetX + (event.clientY - previousPointer.y) * .003, -.7,.7); previousPointer = { x: event.clientX, y: event.clientY }; }
    else if (!reduced.matches) { hoverY = (event.clientX / innerWidth - .5) * .12; hoverX = (event.clientY / innerHeight - .5) * .06; }
  });
  const stopDrag = () => { dragging = false; host.classList.remove('dragging'); };
  host.addEventListener('pointerup',stopDrag); host.addEventListener('pointercancel',stopDrag);
  host.addEventListener('pointerleave', () => { hoverX = hoverY = 0; });
  function updatePause() { pauseButton.textContent = paused ? '▷' : 'Ⅱ'; pauseButton.setAttribute('aria-label', paused ? 'Resume globe motion' : 'Pause globe motion'); pauseButton.title = pauseButton.getAttribute('aria-label'); }
  updatePause();
  pauseButton.addEventListener('click', () => { paused = !paused; updatePause(); });
  document.querySelector('#reset').addEventListener('click', () => { targetX = .55; targetY = -.2; hoverX = hoverY = 0; });
  reduced.addEventListener('change', () => { paused = reduced.matches; updatePause(); });
  addEventListener('scroll', () => { scrollProgress = reduced.matches ? 0 : Math.min(scrollY / host.clientHeight, 1); }, { passive: true });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }).observe(host);
  const clock = new THREE.Clock(); let elapsed = 0;
  renderer.setAnimationLoop(() => {
    const delta = Math.min(clock.getDelta(), .05);
    if (!visible) return;
    if (!paused && !dragging) { targetY += delta * .025; elapsed += delta; }
    const easing = reduced.matches ? 1 : 1 - Math.exp(-delta * 6);
    world.rotation.x += (targetX + hoverX - world.rotation.x) * easing;
    world.rotation.y += (targetY + hoverY - world.rotation.y) * easing;
    world.rotation.z = -.12 + scrollProgress * .09;
    signals.forEach(signal => signal.mesh.position.copy(signal.path.getPoint((elapsed * .055 + signal.offset) % 1)));
    renderer.render(scene, camera);
  });
  host.dataset.ready = 'true';
} catch (error) {
  console.error(error);
  document.querySelector('#fallback').hidden = false;
  document.querySelector('#fallback p').textContent = 'Interactive globe unavailable. Explore our approach below.';
  pauseButton.disabled = true;
  document.querySelector('#reset').disabled = true;
}

const processData = [
  ['ORDER RECEIVED / 14:18:02','Information arrives faster than the operation can structure it.','People become the integration layer between tenders, emails, calls, and customer requirements.'],
  ['PLAN LOAD / +03:14','The same work is handled differently by person, branch, or customer.','Process variation creates rework, weakens measurement, and makes an automated recommendation harder to trust.'],
  ['DISPATCH / +09:42','Critical information exists, but it does not move with the decision.','Disconnected systems force teams to search, re-key, interpret, and reconcile before they can act.'],
  ['EXCEPTION DETECTED / 14:32:08 / NO EXPLICIT OWNER','Ownership becomes unclear when the standard process breaks.','A missing appointment and a waiting driver expose the absence of explicit decision rights and escalation rules.'],
  ['RESOLVE / +27:06 / EVIDENCE RETAINED','AI does not fix a fragmented operation. It accelerates it.','Readiness begins by making the work visible, measurable, connected, and accountable.']
];
document.querySelectorAll('[data-process]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-process]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const data=processData[Number(button.dataset.process)];['#process-state','#process-title','#process-copy'].forEach((selector,index)=>document.querySelector(selector).textContent=data[index]);
}));
const observeVideo=document.querySelector('.observe-media video');
document.querySelectorAll('[data-flow]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-flow]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  document.querySelectorAll('[data-flow-panel]').forEach(panel=>panel.hidden=panel.dataset.flowPanel!==button.dataset.flow);
  if(button.dataset.flow!=='observe')observeVideo.pause();else if(!reduced.matches&&observeVideo.dataset.loaded)observeVideo.play().catch(()=>{});
}));
new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting&&!reduced.matches){if(!observeVideo.dataset.loaded){observeVideo.querySelector('source').src=observeVideo.querySelector('source').dataset.src;observeVideo.load();observeVideo.dataset.loaded='true';}observeVideo.play().catch(()=>{});}else observeVideo.pause();
}),{threshold:.2}).observe(observeVideo);
const audienceData = [
  ['fleets','Fleets','AI-first advisory','Apply AI to fleet planning, asset utilization, operating decisions and scalable exception management.',['AI workflow design','Asset utilization','Network performance']],
  ['brokers','Brokers','AI-led operating leverage','Create operating leverage across pricing, carrier procurement, exception handling and high-volume brokerage workflows.',['AI workflow design','Pricing discipline','Carrier procurement']],
  ['3pls','3PLs','AI-enabled network execution','Modernize network planning, customer visibility, transportation execution and exception management with practical AI.',['Network intelligence','Customer visibility','Workflow automation']],
  ['4pls','4PLs','AI and operating-model governance','Strengthen control-tower operations, provider orchestration, decision speed and accountability across complex networks.',['Control-tower design','Network orchestration','Decision governance']],
  ['drayage','Drayage','Operating transformation','Improve dispatch, terminal coordination, chassis visibility, exception handling and the handoffs that determine daily performance.',['Dispatch redesign','Yard and chassis flow','Terminal handoffs']],
  ['intermodal','Intermodal','AI-enabled intermodal execution','Connect modal strategy, rail performance, drayage execution and terminal information through scalable AI-enabled workflows.',['Modal optimization','Terminal connectivity','Exception intelligence']],
  ['shortline-railways','Shortline railways','Precision operating models','Improve equipment turns, local service execution and asset productivity through disciplined precision operating models.',['Equipment velocity','Precision operations','Service design']],
  ['regional-railways','Regional railways','Railway operating transformation','Improve network flow, terminal discipline, equipment velocity and service reliability across a broader operating footprint.',['Network velocity','Terminal discipline','Service reliability']],
  ['ports-terminals','Ports and terminals','Terminal operating transformation','Improve coordination across gates, yard activity, equipment, drayage, rail interfaces and high-volume operating exceptions.',['Gate and yard flow','Equipment visibility','Handoff control']],
  ['industrial-shippers','Industrial shippers','Commercial and operating transformation','Contain freight cost, strengthen carrier sourcing and use AI to improve procurement, routing and transportation decisions.',['Freight-cost containment','Procurement strategy','AI-assisted sourcing']]
];
const audienceRoot=document.querySelector('#audience-buttons');
audienceData.forEach(([id,label,theme,copy,capabilities],index)=>{
  const button=document.createElement('button');button.type='button';button.setAttribute('aria-pressed',String(index===0));
  const number=document.createElement('small');number.textContent=String(index+1).padStart(2,'0');button.append(number,document.createTextNode(label));const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');button.append(arrow);
  button.addEventListener('click',()=>{audienceRoot.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelector('#audience-title').textContent=label;document.querySelector('#audience-theme').textContent=theme;document.querySelector('#audience-copy').textContent=copy;const image=document.querySelector('#audience-image');image.src=id==='intermodal'?'/assets/hero-intermodal-yard.png':'/assets/audiences/'+id+'.jpg';image.alt=label+' operating environment';const list=document.querySelector('#audience-capabilities');list.replaceChildren(...capabilities.map(capability=>{const li=document.createElement('li');li.textContent=capability;return li;}));});audienceRoot.append(button);
});
const content=window.GAUGEPOINT_CONTENT;
const fragmentList=document.createElement('ol');fragmentList.className='fragment-mobile';
for(const [name,state] of [['Email','INTAKE'],['Spreadsheet','RE-KEYING'],['Manual follow-up','NO OWNER'],['Status chase','REWORK LOOP / 2 TOUCHES / RETURNS THROUGH WAITING'],['Waiting','18 MIN IN'],['Escalation','REACTIVE'],['Exception 061','OWNERSHIP UNCLEAR / MARGIN UNDER PRESSURE']]){const item=document.createElement('li');if(name==='Status chase')item.className='rework';item.append(textElement('strong',name),textElement('small',state));fragmentList.append(item);}
document.querySelector('.fragment-map')?.append(fragmentList);
function textElement(tag,text){const element=document.createElement(tag);element.textContent=text;return element;}
for(const item of content.externalAiExamples){
  const article=document.createElement('article');article.append(textElement('small',item.company+' / PUBLIC APPLICATION'),textElement('h3',item.headline),textElement('p',item.problem),textElement('p',item.applicationCopy),textElement('p','Gaugepoint lesson: '+item.lesson),textElement('p','Readiness conditions: '+item.readiness));const link=textElement('a','Read source ↗');link.href=item.url;link.target='_blank';link.rel='noopener';article.append(link,textElement('p',item.disclaimer));document.querySelector('#public-examples').append(article);
}
for(const item of content.speakingAppearances){const article=document.createElement('article');const copy=document.createElement('div');copy.append(textElement('h3',item.title),textElement('p',item.context),textElement('p',item.topics.join(' / ')));article.append(textElement('small',item.date),copy);document.querySelector('#iana-sessions').append(article);}
for(const item of content.mediaArchive){const article=document.createElement('article');const copy=document.createElement('div');copy.append(textElement('h3',item.title),textElement('p',item.description));if(item.url){const link=textElement('a','Reference content ↗');link.href=item.url;link.target='_blank';link.rel='noopener';copy.append(link);}article.append(textElement('small',item.type+' / '+item.date),copy);document.querySelector('#iana-sessions').append(article);}
