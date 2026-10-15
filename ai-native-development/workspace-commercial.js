window.GaugepointWorkspace.mounts.commercial = function (root, platform, helpers) {
  const esc = helpers.escape;
  const views = platform.views;
  const modules = [['overview', 'Commercial overview'], ['customers', 'Accounts'], ['lanes', 'Lane economics'], ['contracts', 'Contracts'], ['plans', 'Growth plans']];
  const state = { view: 'overview', query: '', selected: null, lens: 'contribution', drafts: {}, saved: new Set(), flags: new Set() };
  const icon = (name) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false">${({ arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>', search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>' })[name]}</svg>`;
  const rows = (key = state.view) => views[key].rows;
  const filteredRows = () => helpers.filterRows(rows().map((item) => ({ ...item, values: [...item.values, item.id], original: item })), state.query).map((item) => item.original);
  const selected = () => rows().find((item) => item.id === state.selected);
  const label = (key) => modules.find(([value]) => value === key)[1];
  const money = (value) => Number(String(value).replace(/[^\d.-]/g, '')) || 0;
  const descriptions = {
    overview: 'Commercial intelligence for every mile ahead.',
    customers: 'Know which relationships move the business forward.',
    lanes: 'Follow the revenue. Understand the cost of every move.',
    contracts: 'Bring operating evidence to the next renewal.',
    plans: 'Give every growth opportunity an owner and a next step.'
  };

  root.innerHTML = `<section class="commercial-shell" data-commercial-view="overview" aria-label="Milemark Freight commercial intelligence">
    <header class="commercial-masthead">
      <img class="commercial-freight-photo" src="../assets/audiences/fleets.jpg" alt="Aerial view of a tractor-trailer moving through a freight terminal" width="1800" height="1350">
      <div class="commercial-rulings" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="commercial-topbar"><button type="button" class="commercial-brand" data-view="overview" aria-label="Milemark Freight commercial overview"><img src="assets/milemark-mark.png" alt="" width="44" height="44"><span><strong>MILEMARK</strong><small>FREIGHT</small></span></button><button type="button" class="commercial-menu" data-menu aria-label="Toggle commercial navigation" aria-expanded="false" aria-controls="commercial-navigation">${icon('menu')}</button><nav class="commercial-navigation" id="commercial-navigation" aria-label="Commercial modules">${modules.map(([key, text]) => `<button type="button" data-view="${key}"${key === 'overview' ? ' aria-current="page"' : ''}>${esc(text)}</button>`).join('')}</nav></div>
      <div class="commercial-intro"><div><p class="commercial-eyebrow">MILEMARK / COMMERCIAL INTELLIGENCE</p><h4 data-title tabindex="-1"><span>Find the margin.</span><span>Grow the freight.</span></h4><p class="commercial-intro-description" data-description>${esc(descriptions.overview)}</p></div><button type="button" class="commercial-cta" data-view="customers" data-hero-action>Explore account economics ${icon('arrow')}</button></div>
    </header>
    <div class="commercial-content" data-content></div>
    <footer class="commercial-footer"><strong>MILEMARK / FREIGHT</strong><p>Fictional company and sample data. Notes and review flags stay in this preview.</p><span>USD / 30-day view</span></footer>
  </section>`;
  const shell = root.querySelector('.commercial-shell');
  const content = root.querySelector('[data-content]');
  const announce = (message) => { content.querySelector('[data-feedback]').textContent = message; };

  function analysis() {
    const customers = rows('customers');
    const maximum = Math.max(1, ...customers.map((item) => money(item.values[1])));
    return `<section class="commercial-analysis" aria-labelledby="commercial-analysis-title"><div class="commercial-section-heading"><div><p class="commercial-eyebrow">THE LAST 30 DAYS / USD</p><h5 id="commercial-analysis-title">The commercial picture.</h5></div><div class="commercial-lenses" role="group" aria-label="Analysis measure"><button type="button" data-lens="contribution" aria-pressed="${state.lens === 'contribution'}">Contribution bridge</button><button type="button" data-lens="revenue" aria-pressed="${state.lens === 'revenue'}">Account revenue</button></div></div>
      ${state.lens === 'contribution' ? `<figure class="commercial-bridge"><figcaption class="commercial-bridge-caption"><span>Revenue into contribution</span><strong>16.2% <small>portfolio margin</small></strong></figcaption><div class="commercial-waterfall" role="img" aria-label="582.4 thousand dollars revenue minus 431.6 thousand transport cost minus 56.2 thousand service cost equals 94.6 thousand dollars contribution, a 16.2 percent margin.">${[['Revenue', '$582.4k', 0, 100, 'revenue'], ['Transport cost', '-$431.6k', 0, 74.11, 'cost'], ['Service cost', '-$56.2k', 74.11, 9.65, 'cost'], ['Contribution', '$94.6k', 83.76, 16.24, 'result']].map(([name, amount, top, height, type]) => `<div class="commercial-waterfall-step commercial-waterfall-${type}"><strong>${esc(amount)}</strong><div class="commercial-waterfall-plot"><i style="--bar-top:${top}%;--bar-height:${height}%"></i></div><span>${esc(name)}</span></div>`).join('')}</div><p class="commercial-chart-note">Portfolio totals include accounts beyond the three examples shown below.</p></figure>` : `<figure class="commercial-revenue"><figcaption>Revenue across sample accounts / USD</figcaption>${customers.map((item) => `<div class="commercial-revenue-row"><span>${esc(item.values[0])}</span><div><i style="--bar-width:${(money(item.values[1]) / maximum * 100).toFixed(2)}%"></i></div><strong>${esc(item.values[1])}</strong></div>`).join('')}<p class="commercial-chart-note">Selected examples, not the full portfolio.</p></figure>`}</section>`;
  }

  function search() {
    return `<div class="commercial-search"><label for="commercial-search-input">Search ${state.view === 'overview' ? 'accounts' : esc(label(state.view).toLowerCase())}</label><div class="commercial-search-field">${icon('search')}<input id="commercial-search-input" type="search" data-search placeholder="Name, route or record ID" value="${esc(state.query)}" autocomplete="off"><button type="button" data-clear aria-label="Clear search"${state.query ? '' : ' disabled'}>${icon('close')}</button></div></div>`;
  }

  function renderResults() {
    const current = views[state.view];
    const result = filteredRows();
    const target = content.querySelector('[data-results]');
    target.innerHTML = result.length ? `<div class="commercial-ledger" style="--columns:${current.columns.length}"><div class="commercial-ledger-head" aria-hidden="true">${current.columns.map((column) => `<span>${esc(column)}</span>`).join('')}<span></span></div>${result.map((item) => `<button type="button" class="commercial-record" data-record="${esc(item.id)}" aria-pressed="${item.id === state.selected}" aria-label="${esc(current.columns.map((column, index) => `${column}: ${item.values[index]}`).join(', '))}">${item.values.map((value, index) => `<span data-label="${esc(current.columns[index])}" class="${index === 0 ? 'commercial-record-name' : ''} ${/90-day/i.test(current.columns[index]) ? (value.startsWith('-') ? 'commercial-negative' : 'commercial-positive') : ''}">${esc(value)}${index === 0 ? `<small>${esc(item.id)}</small>` : ''}</span>`).join('')}<span class="commercial-record-arrow">${icon('arrow')}</span></button>`).join('')}</div>` : `<div class="commercial-empty"><h5>No matching records.</h5><p>Try a customer name, lane or record ID.</p><button type="button" class="commercial-outline-button" data-clear>Clear search</button></div>`;
    content.querySelector('[data-count]').textContent = `${result.length} of ${rows().length} sample records`;
  }

  function relatedRecord(item) {
    const customer = state.view === 'overview' || state.view === 'customers' ? item.values[0] : item.values[1];
    const key = state.view === 'overview' || state.view === 'customers' ? 'lanes' : state.view === 'lanes' ? 'contracts' : state.view === 'contracts' ? 'plans' : 'customers';
    const found = rows(key).find((candidate) => candidate.values[key === 'customers' ? 0 : 1] === customer);
    return found ? { key, item: found } : null;
  }

  function renderDetail() {
    const target = content.querySelector('[data-detail]');
    const item = selected();
    target.hidden = !item;
    if (!item) { target.innerHTML = ''; return; }
    const related = relatedRecord(item);
    const current = views[state.view];
    const draft = state.drafts[item.id] || '';
    target.innerHTML = `<div class="commercial-detail-heading"><div><p class="commercial-eyebrow">RECORD EVIDENCE / ${esc(item.id)}</p><h5 tabindex="-1" data-detail-title>${esc(item.values[0])}</h5></div><button type="button" class="commercial-icon-button" data-close aria-label="Close record evidence">${icon('close')}</button></div><div class="commercial-evidence-grid"><div><p class="commercial-detail-summary">${esc(item.detail)}</p><dl class="commercial-facts">${item.values.map((value, index) => `<div><dt>${esc(current.columns[index])}</dt><dd>${esc(value)}</dd></div>`).join('')}${(item.facts || []).map(([name, value]) => `<div><dt>${esc(name)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${related ? `<button type="button" class="commercial-evidence-link" data-related-view="${related.key}" data-related-record="${esc(related.item.id)}">${esc(label(related.key))}: ${esc(related.item.values[0])} ${icon('arrow')}</button>` : ''}</div><form class="commercial-note-form" data-note-form><label for="commercial-note">Review note</label><textarea id="commercial-note" name="note" rows="4" placeholder="Capture a next step for this account" data-note>${esc(draft)}</textarea><div class="commercial-note-actions"><button type="submit" class="commercial-cta">Save note ${icon('arrow')}</button><button type="button" class="commercial-outline-button" data-flag aria-pressed="${state.flags.has(item.id)}">${state.flags.has(item.id) ? 'Review flagged' : 'Flag for review'}</button></div><p class="commercial-note-status" data-note-status>${state.saved.has(item.id) ? 'Saved to this preview.' : 'Local draft.'}</p></form></div>`;
  }

  function renderContent() {
    const titles = { overview: 'Accounts behind the margin.', customers: 'Account contribution.', lanes: 'Economics by lane.', contracts: 'The next renewal starts here.', plans: 'Growth with a next step.' };
    const eyebrows = { overview: 'ACCOUNT SIGNALS', customers: 'CUSTOMER ECONOMICS', lanes: 'REVENUE & COST PER MOVE', contracts: 'TERMS & RENEWAL DATES', plans: 'OWNERS & PRIORITIES' };
    content.innerHTML = `${state.view === 'overview' ? `<div data-analysis>${analysis()}</div>` : ''}<section class="commercial-register" aria-labelledby="commercial-register-title"><div class="commercial-section-heading commercial-register-heading"><div><p class="commercial-eyebrow">${eyebrows[state.view]}</p><h5 id="commercial-register-title">${titles[state.view]}</h5><p class="commercial-record-count" data-count></p></div>${search()}</div><div data-results></div><section class="commercial-detail" data-detail aria-label="Selected commercial record" hidden></section></section><p class="commercial-feedback" data-feedback role="status" aria-live="polite"></p>`;
    renderResults(); renderDetail();
  }

  function navigate(key, recordId) {
    if (!views[key]) return;
    state.view = key; state.query = ''; state.selected = recordId || null;
    shell.dataset.commercialView = key;
    root.querySelector('[data-title]').innerHTML = key === 'overview' ? '<span>Find the margin.</span><span>Grow the freight.</span>' : esc(label(key));
    root.querySelector('[data-description]').textContent = descriptions[key];
    root.querySelector('[data-hero-action]').hidden = key !== 'overview';
    root.querySelectorAll('.commercial-navigation [data-view]').forEach((button) => {
      if (button.dataset.view === key) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    root.querySelector('[data-menu]').setAttribute('aria-expanded', 'false');
    root.querySelector('.commercial-navigation').classList.remove('commercial-navigation-open');
    renderContent();
    (recordId ? content.querySelector('[data-detail-title]') : root.querySelector('[data-title]')).focus({ preventScroll: true });
  }

  function closeDetail() {
    const id = state.selected; state.selected = null; renderResults(); renderDetail();
    [...content.querySelectorAll('[data-record]')].find((button) => button.dataset.record === id)?.focus({ preventScroll: true });
  }

  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-note]') && state.selected) {
      state.drafts[state.selected] = event.target.value;
      state.saved.delete(state.selected);
      content.querySelector('[data-note-status]').textContent = 'Local draft.';
    }
    if (!event.target.matches('[data-search]')) return;
    state.query = event.target.value;
    content.querySelector('.commercial-search [data-clear]').disabled = !state.query;
    if (state.selected && !filteredRows().some((item) => item.id === state.selected)) { state.selected = null; renderDetail(); }
    renderResults();
  });
  root.addEventListener('submit', (event) => {
    if (!event.target.matches('[data-note-form]')) return;
    event.preventDefault();
    state.saved.add(state.selected);
    content.querySelector('[data-note-status]').textContent = 'Saved to this preview.';
    announce(`Note saved for ${selected().values[0]} in this preview.`);
  });
  root.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !root.contains(button)) return;
    if (button.hasAttribute('data-menu')) {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      root.querySelector('.commercial-navigation').classList.toggle('commercial-navigation-open', open);
    } else if (button.dataset.view) navigate(button.dataset.view);
    else if (button.dataset.relatedView) navigate(button.dataset.relatedView, button.dataset.relatedRecord);
    else if (button.dataset.lens) {
      state.lens = button.dataset.lens;
      content.querySelector('[data-analysis]').innerHTML = analysis();
      [...content.querySelectorAll('[data-lens]')].find((item) => item.dataset.lens === state.lens).focus({ preventScroll: true });
    } else if (button.dataset.record) {
      state.selected = button.dataset.record; renderResults(); renderDetail();
      const heading = content.querySelector('[data-detail-title]');
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    } else if (button.hasAttribute('data-close')) closeDetail();
    else if (button.hasAttribute('data-clear')) {
      state.query = ''; const input = content.querySelector('[data-search]'); input.value = '';
      content.querySelector('.commercial-search [data-clear]').disabled = true;
      renderResults(); input.focus({ preventScroll: true });
    } else if (button.hasAttribute('data-flag')) {
      const id = state.selected;
      if (state.flags.has(id)) state.flags.delete(id); else state.flags.add(id);
      button.setAttribute('aria-pressed', String(state.flags.has(id)));
      button.textContent = state.flags.has(id) ? 'Review flagged' : 'Flag for review';
      announce(`${selected().values[0]} ${state.flags.has(id) ? 'flagged for review' : 'review flag removed'} in this preview.`);
    }
  });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (state.selected && content.querySelector('[data-detail]').contains(event.target)) closeDetail();
      else if (root.querySelector('[data-menu]').getAttribute('aria-expanded') === 'true') {
        root.querySelector('[data-menu]').setAttribute('aria-expanded', 'false');
        root.querySelector('.commercial-navigation').classList.remove('commercial-navigation-open');
        root.querySelector('[data-menu]').focus({ preventScroll: true });
      }
    }
  });
  renderContent();
};
