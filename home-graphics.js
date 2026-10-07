const graphics = [
  ['#measurable-value-graphic', './assets/graphics/measurable-value.svg'],
  ['#scale-comparison-graphic', './assets/graphics/scale-comparison.svg'],
  ['#governance-graphic', './assets/graphics/governance.svg']
];

const conditions = [
  ['Strategy', 'A defined business problem comes first.', 'Clarify the operating outcome, executive ownership, and evidence that will define success before selecting a tool.'],
  ['Workflows', 'Understand the work before automating it.', 'Map the decisions, handoffs, exceptions, and delays that shape the operation before introducing intelligent automation.'],
  ['Data', 'AI can only act on information the operation can trust.', 'Identify the data required, where it originates, who owns it, and how its quality will be measured and maintained.'],
  ['Financial', 'The business case must survive implementation.', 'Establish the baseline, investment requirement, measurable benefit, and conditions required for the use case to create durable value.'],
  ['Systems', 'Technology must connect to the operating environment.', 'Evaluate how the TMS, ERP, CRM, telematics, and workflow tools exchange information and support action.'],
  ['People', 'Adoption is an operating requirement.', 'Define how roles will change, where human judgement remains essential, and how teams will be prepared to work differently.'],
  ['Governance', 'Authority and accountability must remain explicit.', 'Set permissions, approval points, escalation rules, audit trails, and responsibility before AI participates in operational decisions.']
];

const mobile = window.matchMedia('(max-width: 760px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function setViewBox(svg) {
  svg.setAttribute('viewBox', mobile.matches ? svg.dataset.mobileViewbox : svg.dataset.desktopViewbox);
}

function freezeMotion(svg) {
  svg.querySelectorAll('animate, animateTransform, animateMotion').forEach(animation => animation.remove());
  svg.querySelectorAll('[opacity="0"]').forEach(element => element.setAttribute('opacity', '1'));
  svg.querySelectorAll('[stroke-dashoffset="1"]').forEach(element => element.setAttribute('stroke-dashoffset', '0'));

  if (svg.classList.contains('measurable-value')) {
    const highlights = [...svg.querySelectorAll('.desktop-view g > animate[attributeName="opacity"]')]
      .map(animation => animation.parentElement);
    highlights.forEach((group, index) => group.setAttribute('opacity', index === 0 ? '1' : '0'));
  }

  if (svg.classList.contains('governance')) {
    svg.querySelectorAll('text').forEach(text => {
      if (/Awaiting|AUTHORITY GATE \/ CLOSED/.test(text.textContent)) text.remove();
    });
    svg.querySelectorAll('circle[fill="#f0cf94"], circle[stroke="#f0cf94"]').forEach(circle => circle.remove());
    svg.querySelectorAll('[stroke-dasharray="150 541"]').forEach(element => element.remove());
    svg.querySelectorAll('line[x1="395"]').forEach((line, index) => {
      line.setAttribute('y1', index === 0 ? '100' : '263');
      line.setAttribute('y2', index === 0 ? '157' : '320');
    });
    svg.querySelectorAll('line[x1="50"]').forEach(line => {
      line.setAttribute('y1', '268');
      line.setAttribute('y2', '317');
    });
    svg.querySelectorAll('line[x1="310"]').forEach(line => {
      line.setAttribute('y1', '373');
      line.setAttribute('y2', '422');
    });
  }
}

function updateCondition(index) {
  const [label, title, copy] = conditions[index];
  document.querySelector('#condition-label').textContent = label.toUpperCase();
  document.querySelector('#condition-title').textContent = title;
  document.querySelector('#condition-copy').textContent = copy;
  document.querySelectorAll('.condition-hit').forEach(hit => {
    hit.setAttribute('aria-pressed', String(Number(hit.dataset.condition) === index));
  });
}

function enableConditionControls(svg) {
  const activate = event => {
    const hit = event.target.closest?.('.condition-hit');
    if (hit) updateCondition(Number(hit.dataset.condition));
  };
  svg.addEventListener('click', activate);
  svg.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.condition-hit')) {
      event.preventDefault();
      updateCondition(Number(event.target.dataset.condition));
    }
  });
}

for (const [selector, path] of graphics) {
  const host = document.querySelector(selector);
  try {
    const response = await fetch(new URL(path, import.meta.url));
    if (!response.ok) throw new Error(`Graphic request failed: ${response.status}`);
    host.innerHTML = await response.text();
    const svg = host.querySelector('svg');
    setViewBox(svg);
    if (selector === '#measurable-value-graphic') enableConditionControls(svg);
    if (reducedMotion.matches) freezeMotion(svg);
  } catch (error) {
    host.textContent = 'This animated graphic could not be loaded.';
    console.error(error);
  }
}

window.addEventListener('resize', () => {
  document.querySelectorAll('.graphic-svg').forEach(setViewBox);
});

reducedMotion.addEventListener?.('change', event => {
  if (event.matches) document.querySelectorAll('.graphic-svg').forEach(freezeMotion);
  else window.location.reload();
});
