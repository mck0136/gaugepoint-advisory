(() => {
  const model = document.querySelector('#saas-arrangement');
  if (!model) return;

  const button = model.querySelector('[data-vendor-change]');
  if (!button) return;

  const copy = [...model.querySelectorAll('[data-normal][data-changed]')];
  const signals = [...model.querySelectorAll('.dependency-signal')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animations = [];

  function cancelAnimations() {
    animations.forEach(animation => animation.cancel());
    animations = [];
  }

  function setChanged(changed) {
    cancelAnimations();
    model.dataset.vendorChanged = String(changed);
    button.setAttribute('aria-pressed', String(changed));
    button.textContent = changed ? 'Reset example' : 'Change a vendor rule';
    copy.forEach(node => {
      node.textContent = changed ? node.dataset.changed : node.dataset.normal;
    });

    if (changed && !reducedMotion.matches) {
      animations = signals.map((signal, index) => signal.animate([
        { transform: 'translateX(0px)', opacity: 0 },
        { transform: 'translateX(-90px)', opacity: 1, offset: 0.5 },
        { transform: 'translateX(-90px)', opacity: 0 }
      ], { duration: 1000, delay: index * 180, iterations: 1 }));
    }
  }

  model.dataset.vendorChanged = 'false';
  button.setAttribute('aria-pressed', 'false');
  button.textContent = 'Change a vendor rule';
  copy.forEach(node => { node.textContent = node.dataset.normal; });
  button.disabled = false;
  button.hidden = false;
  button.addEventListener('click', () => setChanged(model.dataset.vendorChanged !== 'true'));
  reducedMotion.addEventListener?.('change', event => {
    if (event.matches) cancelAnimations();
  });
})();
