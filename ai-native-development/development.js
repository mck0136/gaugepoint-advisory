(() => {
  document.documentElement.classList.add('js-motion');

  const tabs = [...document.querySelectorAll('.demo-tab')];
  const panels = [...document.querySelectorAll('.demo-panel')];
  const tablist = document.querySelector('.demo-tabs');

  if (tablist && tabs.length === panels.length && tabs.length) {
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', 'Illustrative platform concepts');
    tabs.forEach((tab, index) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panels[index].id);
      panels[index].setAttribute('role', 'tabpanel');
      panels[index].setAttribute('aria-labelledby', tab.id);
      panels[index].tabIndex = 0;
    });
  }

  function selectDemo(tab, moveFocus = false) {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      const selected = panel.id === tab.getAttribute('aria-controls');
      panel.hidden = !selected;
      if (selected) {
        panel.style.animation = 'none';
        void panel.offsetWidth;
        panel.style.animation = '';
      }
    });
    if (moveFocus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectDemo(tab));
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        selectDemo(tab);
        return;
      }
      let nextIndex = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      selectDemo(tabs[nextIndex], true);
    });
  });
  if (tabs.length && tabs.length === panels.length) {
    selectDemo(tabs[0]);
    document.documentElement.classList.add('demo-tabs-ready');
  }

  const revealItems = [...document.querySelectorAll('.gp-section-heading, .gp-saas-copy, .gp-model, .gp-section-close, .economics-copy, .gp-decision, .gp-transition-line, .gp-ownership-diagram, .gp-offer-note, .gp-demo-shell, .gp-closing .gp-section-inner')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach((item) => {
      item.setAttribute('data-reveal', '');
      observer.observe(item);
    });
  }

  const hero = document.querySelector('.gp-hero');
  const model = document.querySelector('.gp-model');
  const economics = document.querySelector('.gp-economics');
  const ownership = document.querySelector('.gp-ownership');
  let framePending = false;

  function clamp01(value) {
    return Math.min(1, Math.max(0, value));
  }

  function updateScrollScenes() {
    const viewport = window.innerHeight || 1;
    const scrollY = window.scrollY || window.pageYOffset;
    if (hero) {
      const heroProgress = clamp01((scrollY - hero.offsetTop + 24) / 112);
      hero.style.setProperty('--hero-question-progress', heroProgress.toFixed(3));
    }
    if (model) {
      const rect = model.getBoundingClientRect();
      const modelProgress = clamp01(((viewport * 0.9) - rect.top) / (viewport * 0.65));
      model.style.setProperty('--model-progress', modelProgress.toFixed(3));
      if (economics && ownership) {
        const start = economics.offsetTop - viewport * 0.2;
        const end = ownership.offsetTop + viewport * 0.25;
        model.style.setProperty('--software-shift', clamp01((scrollY - start) / Math.max(1, end - start)).toFixed(3));
      }
    }
    framePending = false;
  }

  function requestScrollUpdate() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateScrollScenes);
  }

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });
  updateScrollScenes();
})();
