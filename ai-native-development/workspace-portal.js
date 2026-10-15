window.GaugepointWorkspace.mounts.portal = function (root, platform, helpers) {
  const esc = helpers.escape;
  const views = platform.views;
  const modules = [['overview', 'Home'], ['orders', 'Orders'], ['quotes', 'Quotes'], ['documents', 'Documents'], ['invoices', 'Billing'], ['service', 'Support']];
  const orders = views.orders.rows;
  const featured = orders.find((row) => row.id === 'NS-10482') || orders[0];
  const state = {
    view: 'overview', mode: 'order', lookup: '', homeOrder: featured.id, lookupMiss: false,
    query: '', selected: null, followed: new Set(), documentNotes: new Set(),
    quote: { origin: '', destination: '', equipment: '', pickup: '', notes: '' },
    draft: null, supportNotes: {}, supportText: {}, invoiceContext: ''
  };
  const arrow = '<svg class="portal-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M4 12h15m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="square"/></svg>';
  const value = (key, row, column) => {
    if (!row) return '';
    const index = views[key].columns.indexOf(column);
    return index < 0 ? '' : String(row.values[index] || '');
  };
  const orderById = (id) => orders.find((row) => row.id === id);
  const shipment = (row) => value('orders', row, 'Shipment');
  const orderForShipment = (id) => orders.find((row) => shipment(row) === id);
  const overview = (row) => views.overview.rows.find((item) => item.id === row.id);
  const arrival = (row) => value('overview', overview(row), 'Arrival estimate') || 'To be confirmed';
  const docsFor = (row) => views.documents.rows.filter((item) => value('documents', item, 'Shipment') === shipment(row));
  const relatedOrder = (key, row) => orderForShipment(value(key, row, 'Shipment') || value(key, row, 'Related shipment'));
  const currentOrder = () => orderById(state.homeOrder) || featured;
  const status = (text) => `<span class="portal-status${/^(available|resolved|delivered)$/i.test(text) ? ' portal-status-ready' : /transit|progress|awaiting|review/i.test(text) ? ' portal-status-active' : ''}">${esc(text)}</span>`;
  const facts = (pairs) => `<dl class="portal-facts">${pairs.filter(([, text]) => text !== '').map(([label, text]) => `<div><dt>${esc(label)}</dt><dd>${esc(text)}</dd></div>`).join('')}</dl>`;
  const heading = (label, title, description) => `<header class="portal-page-heading"><span class="portal-index">${esc(label)}</span><h4 tabindex="-1">${esc(title)}</h4><p>${esc(description)}</p></header>`;
  const app = document.createElement('div');
  app.className = 'portal-app';
  app.innerHTML = `
    <div class="portal-announcement"><span>Your next arrival / <strong>${esc(arrival(featured))}</strong> / ${esc(value('orders', featured, 'Destination'))}</span><button type="button" data-open-order="${esc(featured.id)}">${esc(featured.id)} ${arrow}</button></div>
    <header class="portal-header"><button type="button" class="portal-brand" data-nav="overview" aria-label="Folio Supply home"><img src="assets/folio-mark.png" width="32" height="32" alt=""><span>FOLIO <i>/</i> SUPPLY</span></button><nav class="portal-nav" aria-label="Folio customer workspace">${modules.map(([key, label]) => `<button type="button" data-nav="${esc(key)}"${key === state.view ? ' aria-current="page"' : ''}>${esc(label)}</button>`).join('')}</nav></header>
    <div class="portal-content"></div><p class="portal-feedback" role="status" aria-live="polite"></p>
    <footer class="portal-footer"><span>FOLIO / SUPPLY</span><span>Fictional sample data. Local preview.</span></footer>`;
  root.replaceChildren(app);
  const content = app.querySelector('.portal-content');
  const feedback = app.querySelector('.portal-feedback');
  const announce = (message) => { feedback.textContent = message; };
  const focusRecord = (id) => [...content.querySelectorAll('[data-record]')].find((button) => button.dataset.record === id)?.focus({ preventScroll: true });

  function journey(row) {
    const actual = value('orders', row, 'Status');
    const step = /delivered/i.test(actual) ? 3 : /in transit/i.test(actual) ? 2 : /accepted|confirmed|pickup/i.test(actual) ? 1 : 0;
    return `<ol class="portal-journey" aria-label="Shipment progress">${['Order received', 'Carrier confirmed', 'In transit', 'Delivered'].map((label, index) => `<li class="${index < step ? 'portal-step-done' : index === step ? 'portal-step-current' : ''}"${index === step ? ' aria-current="step"' : ''}><span class="portal-step-mark" aria-hidden="true"></span><span>${esc(label)}</span>${index === step ? `<small>${esc(actual)}</small>` : ''}</li>`).join('')}</ol>`;
  }

  function orderEvidence(row, includeProgress) {
    const details = (row.facts || []).filter(([label]) => ['Carrier', 'Equipment', 'Service owner'].includes(label));
    return `${includeProgress ? journey(row) : ''}${facts([
      ['Customer order', row.id], ['Shipment reference', shipment(row)],
      ['Origin', value('orders', row, 'Origin')], ['Destination', value('orders', row, 'Destination')],
      ['Estimated arrival', arrival(row)], ...details
    ])}`;
  }

  function documentEvidence(row) {
    const documents = docsFor(row);
    return `<div class="portal-document-evidence">${documents.length ? documents.map((doc) => `<div class="portal-evidence-line"><div><span class="portal-index">${esc(doc.id)} / ${esc(shipment(row))}</span><strong>${esc(value('documents', doc, 'Type'))}</strong><span class="portal-muted">${esc(value('documents', doc, 'Owner'))}</span></div><div>${status(value('documents', doc, 'Status'))}<button type="button" class="portal-text-button" data-open-doc="${esc(doc.id)}">View record ${arrow}</button></div></div>`).join('') : '<p class="portal-empty-copy">No documents are attached to this shipment yet.</p>'}</div>`;
  }

  function renderLookup() {
    const target = content.querySelector('[data-lookup-body]');
    if (!target) return;
    app.querySelectorAll('[data-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode)));
    if (state.lookupMiss) {
      target.innerHTML = '<div class="portal-empty"><h5>No matching reference.</h5><p>Try an order, shipment or document reference.</p><button type="button" class="portal-button" data-clear-lookup>Clear lookup</button></div>';
      return;
    }
    const row = currentOrder();
    const title = state.mode === 'shipment' ? shipment(row) : state.mode === 'document' ? 'Documents for ' + row.id : row.id;
    target.innerHTML = `<div class="portal-object-heading"><div><span class="portal-index">${esc(state.mode === 'document' ? 'DOCUMENT FILE' : state.mode === 'shipment' ? 'SHIPMENT FILE' : 'CUSTOMER ORDER')}</span><h5>${esc(title)}</h5></div>${status(value('orders', row, 'Status'))}</div>${state.mode === 'document' ? documentEvidence(row) : orderEvidence(row, state.mode === 'shipment')}<div class="portal-object-footer"><span class="portal-index">${esc(platform.organization)}</span><button type="button" class="portal-text-button" data-open-order="${esc(row.id)}">Open order ${arrow}</button></div>`;
  }

  function home() {
    const next = orders.filter((row) => row.id !== featured.id);
    const featuredDoc = docsFor(featured)[0];
    content.innerHTML = `<section class="portal-intro"><span class="portal-index">${esc(platform.organization)} / Customer workspace</span><h4 tabindex="-1">What’s moving.<br><em>What comes next.</em></h4><p>Your orders, their next milestone, and the details that belong with them.</p></section>
      <section class="portal-lookup" aria-label="Customer order lookup"><div class="portal-lookup-tabs" role="group" aria-label="Record views">${[['order', 'Order'], ['shipment', 'Shipment'], ['document', 'Document']].map(([key, label]) => `<button type="button" data-mode="${key}" aria-pressed="${state.mode === key}">${esc(label)}</button>`).join('')}<span class="portal-index">YOUR REFERENCE, CONNECTED</span></div><form class="portal-lookup-form" data-lookup-form><label for="portal-reference">Look up a reference</label><div><input id="portal-reference" name="reference" type="search" value="${esc(state.lookup)}" placeholder="Order, shipment or document" autocomplete="off"><button type="button" class="portal-clear" data-clear-lookup aria-label="Clear reference">Clear</button><button type="submit" class="portal-button">Look up ${arrow}</button></div></form><div class="portal-lookup-body" data-lookup-body></div></section>
      <div class="portal-home-columns"><section class="portal-next"><div class="portal-section-heading"><div><span class="portal-index">ORDER BOOK</span><h5>Next arrivals</h5></div><button type="button" class="portal-text-button" data-nav="orders">All orders ${arrow}</button></div>${next.map((row) => `<button type="button" class="portal-arrival-row" data-open-order="${esc(row.id)}"><span class="portal-arrival-date">${esc(arrival(row).split('/')[0].trim())}</span><span><strong>${esc(row.id)}</strong><span>${esc(value('orders', row, 'Origin'))} ${arrow} ${esc(value('orders', row, 'Destination'))}</span><small>${esc(arrival(row))}</small></span>${status(value('orders', row, 'Status'))}</button>`).join('')}</section>
      <section class="portal-note"><span class="portal-index">ON THE RECORD / ${esc(featured.id)}</span><h5>${esc(featuredDoc ? value('documents', featuredDoc, 'Type') : 'Your shipment file')}</h5><p>${esc(featuredDoc ? value('documents', featuredDoc, 'Status') : value('orders', featured, 'Status'))}</p>${featuredDoc ? `<p class="portal-muted">Owner / ${esc(value('documents', featuredDoc, 'Owner'))}</p><button type="button" class="portal-text-button" data-open-doc="${esc(featuredDoc.id)}">Document status ${arrow}</button>` : `<button type="button" class="portal-text-button" data-open-order="${esc(featured.id)}">Open the file ${arrow}</button>`}</section></div>`;
    renderLookup();
  }

  function rowLabel(key, row) {
    if (key === 'orders') return { title: row.id, subtitle: value(key, row, 'Origin') + ' / ' + value(key, row, 'Destination'), meta: arrival(row), status: value(key, row, 'Status') };
    if (key === 'documents') return { title: value(key, row, 'Type'), subtitle: row.id + ' / ' + value(key, row, 'Shipment'), meta: 'Owner / ' + value(key, row, 'Owner'), status: value(key, row, 'Status') };
    if (key === 'invoices') return { title: row.id, subtitle: value(key, row, 'Shipment'), meta: value(key, row, 'Amount') + ' ' + value(key, row, 'Currency'), status: value(key, row, 'Status') };
    if (key === 'quotes') return { title: row.id, subtitle: value(key, row, 'Lane'), meta: value(key, row, 'Required pickup'), status: value(key, row, 'Status') };
    return { title: value(key, row, 'Subject'), subtitle: row.id + ' / ' + value(key, row, 'Related shipment'), meta: 'Owner / ' + value(key, row, 'Owner'), status: value(key, row, 'Status') };
  }

  function renderRows() {
    const target = content.querySelector('[data-record-list]');
    if (!target) return;
    const rows = helpers.filterRows(views[state.view].rows, state.query);
    if (state.selected && !rows.some((row) => row.id === state.selected)) {
      state.selected = null;
      renderDetail();
    }
    target.innerHTML = rows.length ? rows.map((row) => {
      const item = rowLabel(state.view, row);
      return `<button type="button" class="portal-record${row.id === state.selected ? ' portal-record-selected' : ''}" data-record="${esc(row.id)}" aria-expanded="${row.id === state.selected}"><span class="portal-record-title"><strong>${esc(item.title)}</strong><span>${esc(item.subtitle)}</span></span><span class="portal-record-meta">${esc(item.meta)}</span>${status(item.status)}${arrow}</button>`;
    }).join('') : '<div class="portal-empty"><h5>No matching records.</h5><p>Try another reference or clear your search.</p><button type="button" class="portal-button" data-clear-search>Clear search</button></div>';
    content.querySelector('[data-result-count]').textContent = `${rows.length} ${rows.length === 1 ? 'record' : 'records'}`;
    content.querySelector('[data-search-clear]').hidden = !state.query;
  }

  function renderDetail() {
    const target = content.querySelector('[data-detail]');
    if (!target) return;
    const key = state.view;
    const row = views[key].rows.find((item) => item.id === state.selected);
    target.hidden = !row;
    if (!row) { target.innerHTML = ''; return; }
    const linked = key === 'orders' ? row : relatedOrder(key, row);
    const rowStatus = value(key, row, 'Status');
    const contextInvoice = key === 'service' && views.invoices.rows.find((item) => item.id === state.invoiceContext && value('invoices', item, 'Shipment') === value(key, row, 'Related shipment'));
    let body = '';
    if (key === 'orders') {
      body = `${orderEvidence(row, true)}<div class="portal-detail-actions"><button type="button" class="portal-button" data-follow="${esc(row.id)}" aria-pressed="${state.followed.has(row.id)}">${state.followed.has(row.id) ? 'Saved to your list' : 'Save to your list'}</button><button type="button" class="portal-text-button" data-order-docs="${esc(shipment(row))}">Related documents ${arrow}</button></div>`;
    } else if (key === 'documents') {
      const available = /^available$/i.test(rowStatus);
      body = `${facts([['Shipment', value(key, row, 'Shipment')], ['Customer order', linked?.id || ''], ['Document type', value(key, row, 'Type')], ['Owner', value(key, row, 'Owner')], ['Availability', rowStatus]])}<p class="portal-record-note">${available ? 'Availability is confirmed in this sample record. No document file is attached to the preview.' : 'The delivery record will follow the shipment’s delivery milestone.'}</p><button type="button" class="portal-button" data-document-note="${esc(row.id)}" aria-pressed="${state.documentNotes.has(row.id)}">${state.documentNotes.has(row.id) ? 'Follow-up saved locally' : 'Save a follow-up'}</button>`;
    } else if (key === 'invoices') {
      body = `<div class="portal-invoice-total"><span class="portal-index">CUSTOMER INVOICE TOTAL</span><strong>${esc(value(key, row, 'Amount'))} <small>${esc(value(key, row, 'Currency'))}</small></strong></div>${facts([['Invoice', row.id], ['Customer order', linked?.id || ''], ['Shipment', value(key, row, 'Shipment')], ['Invoice status', rowStatus]])}<button type="button" class="portal-button" data-invoice-question="${esc(row.id)}">Add a billing question ${arrow}</button>`;
    } else if (key === 'service') {
      body = `${facts([['Request', row.id], ['Owner', value(key, row, 'Owner')], ['Related order', linked?.id || ''], ['Shipment', value(key, row, 'Related shipment')]])}<div class="portal-conversation"><span class="portal-index">${esc(value(key, row, 'Owner'))} / LATEST SAMPLE UPDATE</span><p>${esc(row.detail)}</p></div>${state.supportNotes[row.id] ? `<div class="portal-local-note"><span class="portal-index">YOUR LOCAL NOTE</span><p>${esc(state.supportNotes[row.id])}</p></div>` : ''}<form data-support-form data-request="${esc(row.id)}" class="portal-support-form"><label for="portal-support-note">Add a note${contextInvoice ? ' about ' + esc(contextInvoice.id) : ''}</label><textarea id="portal-support-note" name="message" rows="3" required>${esc(state.supportText[row.id] || '')}</textarea><div class="portal-form-end"><span class="portal-index">Local draft. Not sent.</span><button type="submit" class="portal-button">Save note</button></div></form>`;
    } else body = facts(views[key].columns.map((column, index) => [column, row.values[index]]));
    target.innerHTML = `<div class="portal-detail-heading"><div><span class="portal-index">${esc(key === 'orders' ? 'ORDER FILE' : key === 'invoices' ? 'BILLING RECORD' : views[key].label.toUpperCase())}</span><h5>${esc(row.id)}</h5></div><div>${status(rowStatus)}<button type="button" class="portal-close" data-close-detail aria-label="Close record details">Close</button></div></div>${body}`;
  }

  function draftMarkup() {
    return state.draft ? `<div class="portal-local-note" tabindex="-1" data-saved-draft><span class="portal-index">LOCAL DRAFT</span><h5>${esc(state.draft.origin)} / ${esc(state.draft.destination)}</h5>${facts([['Equipment', state.draft.equipment], ['Requested pickup', state.draft.pickup], ['Notes', state.draft.notes]])}</div>` : '';
  }

  function quoteForm() {
    return `<section class="portal-quote-layout"><form class="portal-quote-form" data-quote-form><div class="portal-section-heading"><div><span class="portal-index">NEW QUOTE / LOCAL DRAFT</span><h5>The next move.</h5></div></div><div class="portal-form-grid"><label>Origin<input name="origin" value="${esc(state.quote.origin)}" placeholder="City, state" required></label><label>Destination<input name="destination" value="${esc(state.quote.destination)}" placeholder="City, state" required></label><label>Equipment<select name="equipment" required>${[['', 'Select equipment'], ['Dry van', 'Dry van'], ['Intermodal container', 'Intermodal container'], ['Refrigerated trailer', 'Refrigerated trailer']].map(([key, label]) => `<option value="${esc(key)}"${state.quote.equipment === key ? ' selected' : ''}>${esc(label)}</option>`).join('')}</select></label><label>Requested pickup<input type="date" name="pickup" value="${esc(state.quote.pickup)}" required></label><label class="portal-form-wide">Shipment notes <span class="portal-index">OPTIONAL</span><textarea name="notes" rows="3">${esc(state.quote.notes)}</textarea></label></div><div class="portal-form-end"><span class="portal-index">Saved here. No request is submitted.</span><button type="submit" class="portal-button portal-button-accent">Save quote draft ${arrow}</button></div></form><div class="portal-draft-slot" data-draft-slot>${draftMarkup() || '<span class="portal-index">YOUR NEXT QUOTE</span><p class="portal-serif-note">A place for the details<br>before the next move.</p>'}</div></section>`;
  }

  function moduleView() {
    const titles = {
      orders: ['ORDER BOOK', 'Every order, accounted for.', 'References, arrivals and the milestone that comes next.'],
      quotes: ['QUOTE DESK', 'Put your next move on paper.', 'Start with the lane, equipment and pickup date.'],
      documents: ['DOCUMENT ROOM', 'The evidence, together.', 'Document availability and ownership, grouped by shipment.'],
      invoices: ['CUSTOMER BILLING', 'A clear record of the bill.', 'Your customer invoices and their related orders.'],
      service: ['SUPPORT DESK', 'A conversation with an owner.', 'Shipment questions, current updates and your local notes.']
    };
    content.innerHTML = `<div class="portal-module">${heading(...titles[state.view])}${state.view === 'quotes' ? quoteForm() : ''}<section class="portal-register"><div class="portal-register-header"><span class="portal-index">${esc(state.view === 'quotes' ? 'EXISTING REQUESTS' : views[state.view].label.toUpperCase())}</span><span class="portal-index" data-result-count></span></div><div class="portal-search"><label for="portal-search">Search ${esc(state.view === 'orders' ? 'orders or shipment references' : views[state.view].label.toLowerCase())}</label><div><input id="portal-search" type="search" value="${esc(state.query)}" placeholder="Find a reference" autocomplete="off"><button type="button" class="portal-clear" data-clear-search data-search-clear${state.query ? '' : ' hidden'}>Clear</button></div></div><div class="portal-record-list" data-record-list></div></section><section class="portal-detail" aria-label="Selected record details" data-detail hidden></section></div>`;
    renderRows(); renderDetail();
  }

  function render() {
    app.querySelectorAll('.portal-nav [data-nav]').forEach((button) => {
      if (button.dataset.nav === state.view) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (state.view === 'overview') home(); else moduleView();
  }

  function navigate(key, selected) {
    if (!modules.some(([id]) => id === key)) return;
    state.view = key; state.query = ''; state.selected = selected || null;
    announce(''); render(); content.querySelector('h4')?.focus({ preventScroll: true });
  }

  function lookUp() {
    const query = state.lookup.trim().toLowerCase();
    let row = orders.find((item) => item.id.toLowerCase() === query || shipment(item).toLowerCase() === query);
    if (!row) {
      const doc = views.documents.rows.find((item) => item.id.toLowerCase() === query);
      if (doc) { row = relatedOrder('documents', doc); state.mode = 'document'; }
    }
    if (!row && query) row = helpers.filterRows(orders, query)[0];
    if (!query) row = featured;
    state.lookupMiss = !row;
    if (row) state.homeOrder = row.id;
    renderLookup(); announce(row ? `Showing ${row.id}, ${value('orders', row, 'Status')}.` : 'No matching reference.');
  }

  app.addEventListener('input', (event) => {
    const input = event.target;
    if (input.id === 'portal-search') { state.query = input.value; renderRows(); }
    else if (input.id === 'portal-reference') state.lookup = input.value;
    else if (input.closest('[data-quote-form]') && Object.prototype.hasOwnProperty.call(state.quote, input.name)) state.quote[input.name] = input.value;
    else if (input.closest('[data-support-form]')) state.supportText[input.closest('form').dataset.request] = input.value;
  });
  app.addEventListener('change', (event) => {
    const input = event.target;
    if (input.closest('[data-quote-form]') && Object.prototype.hasOwnProperty.call(state.quote, input.name)) state.quote[input.name] = input.value;
  });
  app.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !app.contains(button)) return;
    if (button.dataset.nav) navigate(button.dataset.nav);
    else if (button.dataset.openOrder) navigate('orders', button.dataset.openOrder);
    else if (button.dataset.openDoc) navigate('documents', button.dataset.openDoc);
    else if (button.dataset.mode) { state.mode = button.dataset.mode; renderLookup(); }
    else if (button.hasAttribute('data-clear-lookup')) {
      state.lookup = ''; state.lookupMiss = false; state.homeOrder = featured.id;
      const input = content.querySelector('#portal-reference'); input.value = ''; renderLookup(); input.focus(); announce('Lookup cleared.');
    } else if (button.hasAttribute('data-clear-search')) {
      state.query = ''; const input = content.querySelector('#portal-search'); input.value = ''; renderRows(); input.focus();
    } else if (button.dataset.record) {
      state.selected = button.dataset.record; renderRows(); renderDetail(); focusRecord(state.selected);
    } else if (button.hasAttribute('data-close-detail')) {
      const prior = state.selected; state.selected = null; renderRows(); renderDetail(); focusRecord(prior);
    } else if (button.dataset.follow) {
      const id = button.dataset.follow;
      if (state.followed.has(id)) state.followed.delete(id); else state.followed.add(id);
      button.setAttribute('aria-pressed', String(state.followed.has(id)));
      button.textContent = state.followed.has(id) ? 'Saved to your list' : 'Save to your list';
      announce(state.followed.has(id) ? `${id} saved to your local list.` : `${id} removed from your local list.`);
    } else if (button.dataset.orderDocs) {
      const doc = views.documents.rows.find((row) => value('documents', row, 'Shipment') === button.dataset.orderDocs);
      navigate('documents', doc?.id); state.query = button.dataset.orderDocs;
      content.querySelector('#portal-search').value = state.query; renderRows();
    } else if (button.dataset.documentNote) {
      state.documentNotes.add(button.dataset.documentNote);
      button.textContent = 'Follow-up saved locally'; button.setAttribute('aria-pressed', 'true');
      announce('Document follow-up saved locally. No message was sent.');
    } else if (button.dataset.invoiceQuestion) {
      state.invoiceContext = button.dataset.invoiceQuestion;
      const invoice = views.invoices.rows.find((row) => row.id === state.invoiceContext);
      const service = views.service.rows.find((row) => value('service', row, 'Related shipment') === value('invoices', invoice, 'Shipment'));
      navigate('service', service?.id); content.querySelector('#portal-support-note')?.focus({ preventScroll: true });
    }
  });
  app.addEventListener('submit', (event) => {
    const form = event.target;
    if (!form.matches('[data-lookup-form], [data-quote-form], [data-support-form]')) return;
    event.preventDefault(); if (!form.reportValidity()) return;
    if (form.hasAttribute('data-lookup-form')) { lookUp(); return; }
    const values = new FormData(form);
    if (form.hasAttribute('data-quote-form')) {
      Object.keys(state.quote).forEach((key) => { state.quote[key] = String(values.get(key) || '').trim(); });
      state.draft = { ...state.quote }; content.querySelector('[data-draft-slot]').innerHTML = draftMarkup();
      announce('Quote saved as a local draft. No quote request was submitted.');
    } else {
      const id = form.dataset.request; state.supportNotes[id] = String(values.get('message') || '').trim();
      state.supportText[id] = state.supportNotes[id]; renderDetail();
      content.querySelector('#portal-support-note')?.focus({ preventScroll: true });
      announce('Support note saved locally. No message was sent.');
    }
  });
  render();
};
