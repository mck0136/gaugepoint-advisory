(function () {
  const modules = [
    ['overview', 'Network'], ['routing', 'Routing guides'], ['bpo', 'BPO desk'],
    ['carriers', 'Carrier scorecards'], ['audit', 'Freight audit'], ['shipper', 'Shipper view']
  ];
  const copy = {
    overview: ['Your entire 4PL network.', 'Working as one.', 'Every shipment, carrier decision and service team. One connected operation.', 'Network activity', 'Shipments'],
    shipments: ['Every move.', 'The full picture.', 'The route, the carrier and the next decision, connected to the same record.', 'Shipment activity', 'Shipments'],
    routing: ['A better route starts', 'with the right carrier.', 'Contracted capacity, ranked alternatives and clear tender authority.', 'Lane coverage', 'Routing guides'],
    bpo: ['Good execution.', 'Accounted for.', 'The work behind every move, with an owner and a response standard.', 'Execution desk', 'Work queue'],
    carriers: ['Service you can see.', 'Partners you can trust.', 'Compare carrier performance with the commitments behind your network.', 'Carrier performance', 'Carriers'],
    audit: ['Every charge.', 'Backed by evidence.', 'Contracted rates, invoice differences and the documents that explain them.', 'Freight audit', 'Invoices'],
    shipper: ['Closer to the move.', 'Clearer on what comes next.', 'Shipment progress and service ownership, shared with the shipper.', 'Shipper visibility', 'Shipments']
  };
  const icons = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>'
  };

  window.GaugepointWorkspace.mounts.managed = function (root, platform, helpers) {
    const views = platform.views;
    const e = (value) => helpers.escape(String(value ?? '').replace(/\s*\u2192\s*/g, ' / '));
    const state = { view: 'overview', query: '', selected: views.overview.rows[0]?.id || null, assigned: new Set(), done: new Set(), message: '' };
    const rowsFor = (key) => views[key]?.rows || [];
    const find = (key, id) => rowsFor(key).find((item) => item.id === id);
    const cell = (row, index) => row?.values?.[index] || '';
    const fact = (row, name) => (row?.facts || []).find(([label]) => label === name)?.[1] || '';
    const label = () => modules.find(([key]) => key === state.view)?.[1] || 'Network';
    const owner = (row) => state.assigned.has(row?.id) ? 'Jordan M.' : cell(row, 3);

    function visibleRows() {
      const rows = rowsFor(state.view).map((row) => {
        if (state.view !== 'bpo' || !state.assigned.has(row.id)) return row;
        return { ...row, values: row.values.map((value, index) => index === 3 ? 'Jordan M.' : value) };
      });
      const term = state.query.trim().toLowerCase();
      return rows.filter((row) => !term || [row.id, ...row.values].some((value) => String(value).toLowerCase().includes(term)));
    }

    function fields(items) {
      return `<dl class="managed-fields">${items.filter(([, value]) => value !== '' && value != null).map(([name, value]) => `<div class="managed-field"><dt>${e(name)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>`;
    }

    function metadata(row, key) {
      return fields([...row.values.map((value, index) => [views[key].columns[index] || 'Detail', value]), ...(row.facts || [])]);
    }

    function action(row, key, text, completed) {
      const done = state.done.has(`${row.id}:${key}`);
      return `<button type="button" class="managed-action" data-action="${e(key)}" data-id="${e(row.id)}" aria-pressed="${done}">${e(done ? completed : text)}</button>`;
    }

    function linked(key, id, title, note) {
      return `<button type="button" class="managed-related" data-open-view="${e(key)}" data-open-record="${e(id)}"><span><strong>${e(title)}</strong><small>${e(note)}</small></span><span class="managed-related-id">${e(id)}</span></button>`;
    }

    function section(title, content) {
      return `<section class="managed-detail-section"><h6>${e(title)}</h6>${content}</section>`;
    }

    function shipment(row) {
      const move = find('shipments', row.id) || row;
      const overview = find('overview', row.id);
      const shared = find('shipper', row.id);
      const lane = cell(move, 2);
      const carrier = fact(move, 'Carrier') || cell(overview, 2);
      const guide = rowsFor('routing').find((item) => cell(item, 0) === lane);
      const caseRow = rowsFor('bpo').find((item) => cell(item, 1) === row.id);
      const invoice = rowsFor('audit').find((item) => cell(item, 1) === row.id);
      const serviceOwner = state.assigned.has(caseRow?.id) ? owner(caseRow) : fact(overview, 'BPO owner') || owner(caseRow);
      const stops = String(lane).split(/\s*(?:\u2192|\u2013)\s*/);
      const details = fields([
        ['Shipper', cell(move, 1)], ['Carrier', carrier], ['Mode', cell(move, 3)],
        ['Service owner', serviceOwner], ['Arrival', cell(shared, 3)], ['Equipment', fact(move, 'Container')]
      ]);
      const journey = row.id === 'MT-48271' ? section('Along the route', `<ol class="managed-journey"><li class="managed-complete"><span></span><div><strong>Pickup confirmed</strong><small>${e(stops[0] || lane)}</small></div></li><li class="managed-current"><span></span><div><strong>${e(cell(move, 4))}</strong><small>${e(carrier)}</small></div></li><li><span></span><div><strong>Delivery window</strong><small>${e(cell(shared, 3) || 'Not yet listed')}</small></div></li></ol>`) : '';
      const related = [
        guide ? linked('routing', guide.id, 'Routing guide', cell(guide, 4)) : '',
        caseRow ? linked('bpo', caseRow.id, cell(caseRow, 2), owner(caseRow)) : '',
        invoice ? linked('audit', invoice.id, 'Freight audit', cell(invoice, 5)) : ''
      ].join('');
      return `<p class="managed-record-label">${e(row.id)}</p><h5 class="managed-record-title">${e(lane)}</h5><p class="managed-detail-copy">${e(move.detail)}</p>${details}${journey}${related ? section('Connected work', related) : ''}<div class="managed-actions">${action(row, 'dispatch-note', 'Log dispatch check', 'Dispatch check noted')}</div>`;
    }

    function routing(row) {
      const primary = cell(row, 2);
      const carrier = rowsFor('carriers').find((item) => cell(item, 0) === primary);
      const actual = fact(row, 'Actual OTD') || cell(carrier, 1) || 'Not listed';
      const response = /30 minutes?/i.test(row.detail) ? '30 minutes' : 'Not listed';
      const ranks = [
        ['Primary', primary, response === 'Not listed' ? 'Response window not listed' : `${response} to respond`],
        ['Backup', cell(row, 3), 'After the primary declines or its response window ends'],
        ['Approved spot', 'Shipper authorization', 'Approval required before a spot tender']
      ];
      return `<p class="managed-record-label">${e(row.id)}</p><h5 class="managed-record-title">${e(cell(row, 0))}</h5><p class="managed-detail-copy">${e(row.detail)}</p>${fields([['Mode', cell(row, 1)], ['Policy', cell(row, 4)], ['Actual on-time', actual], ['Service target', fact(row, 'Target OTD') || '98.0%']])}${section('Ranked tender sequence', `<ol class="managed-waterfall">${ranks.map(([rank, name, note], index) => `<li><span class="managed-rank">${e(index + 1)}</span><div><span class="managed-caption">${e(rank)}</span><strong>${e(name)}</strong><small>${e(note)}</small></div></li>`).join('')}</ol>`)}<p class="managed-policy">Guide changes require the authorized shipper owner.</p><div class="managed-actions">${action(row, 'guide-review', 'Note guide review', 'Guide review noted')}</div>`;
    }

    function bpo(row) {
      const assigned = state.assigned.has(row.id);
      const values = row.values.map((value, index) => index === 3 ? owner(row) : value);
      const dependency = fact(row, 'Audit dependency');
      const invoice = row.id === 'BPO-061' && dependency ? rowsFor('audit').find((item) => dependency.includes(item.id)) : null;
      return `<p class="managed-record-label">${e(row.id)}</p><h5 class="managed-record-title">${e(cell(row, 2))}</h5><p class="managed-detail-copy">${e(row.detail)}</p>${metadata({ ...row, values }, 'bpo')}${section('Service commitment', `<p class="managed-commitment">${e(fact(row, 'Service standard') || 'No additional response standard listed')}</p><p class="managed-detail-copy">Due: ${e(cell(row, 5) || 'Not scheduled')}</p>`)}${section('Connected work', linked('overview', cell(row, 1), 'Shipment', cell(row, 1)) + (invoice ? linked('audit', invoice.id, 'Invoice evidence', dependency) : ''))}<div class="managed-actions"><button type="button" class="managed-action" data-action="assign" data-id="${e(row.id)}" aria-pressed="${assigned}">${assigned ? 'Assigned to Jordan M.' : 'Assign to Jordan M.'}</button>${action(row, 'case-note', 'Add case note', 'Case note added')}</div>`;
    }

    function carriers(row) {
      const comparisons = rowsFor('carriers').map((item) => {
        const actual = Math.max(0, Math.min(100, parseFloat(cell(item, 1)) || 0));
        return `<div class="managed-carrier-line"><div><span>${e(cell(item, 0))}</span><strong>${e(cell(item, 1))}</strong></div><div class="managed-service-bar" role="img" aria-label="${e(`${cell(item, 0)}: ${cell(item, 1)} on time, 98.0% target`)}"><span style="width:${actual}%"></span><i></i></div></div>`;
      }).join('');
      const guide = rowsFor('routing').find((item) => cell(item, 2) === cell(row, 0));
      return `<p class="managed-record-label">${e(row.id)}</p><h5 class="managed-record-title">${e(cell(row, 0))}</h5><p class="managed-detail-copy">${e(row.detail)}</p>${fields(row.values.slice(1).map((value, index) => [views.carriers.columns[index + 1], value]))}${section('30-day service comparison', `<p class="managed-chart-key">On-time delivery <span>Target 98.0%</span></p>${comparisons}`)}${guide ? section('Routing decision', linked('routing', guide.id, cell(guide, 0), cell(guide, 4))) : ''}<div class="managed-actions">${action(row, 'carrier-review', 'Prepare review note', 'Review note prepared')}</div>`;
    }

    function audit(row) {
      const featured = row.id === 'INV-271';
      const amounts = `<div class="managed-invoice-figures"><div><span>Invoiced</span><strong>${e(cell(row, 3))}</strong></div><div><span>Expected</span><strong>${e(cell(row, 2))}</strong></div><div><span>Difference</span><strong>${e(cell(row, 4))}</strong></div></div>`;
      const charges = featured ? section('Rate reconciliation', `<dl class="managed-charges"><div><dt>Contracted linehaul</dt><dd>${e(fact(row, 'Contracted linehaul'))}</dd></div><div><dt>Fuel surcharge</dt><dd>${e(fact(row, 'Fuel surcharge'))}</dd></div><div class="managed-disputed"><dt>Detention held for evidence</dt><dd>${e(fact(row, 'Disputed detention'))}</dd></div></dl>`) : metadata(row, 'audit');
      const evidence = featured ? section('Evidence needed', '<p class="managed-commitment">Arrival and departure timestamps</p><p class="managed-detail-copy">Detention stays on hold pending evidence and shipper approval.</p>') : '';
      const bpoRow = featured ? find('bpo', fact(row, 'Linked BPO case')) : null;
      return `<p class="managed-record-label">${e(row.id)} <span>USD</span></p><h5 class="managed-record-title">${e(cell(row, 5))}</h5><p class="managed-detail-copy">${e(row.detail)}</p>${amounts}${charges}${evidence}${bpoRow ? section('Document follow-up', linked('bpo', bpoRow.id, cell(bpoRow, 2), owner(bpoRow))) : ''}<div class="managed-actions">${featured ? action(row, 'evidence-request', 'Request evidence', 'Evidence request noted') : action(row, 'audit-note', 'Add audit note', 'Audit note added')}</div>`;
    }

    function shipper(row) {
      const arrival = cell(row, 3);
      const featured = row.id === 'MT-48271';
      const carrier = cell(find('overview', row.id), 2);
      const context = featured ? section('Delivery context', fields([['Carrier', carrier], ['Origin', fact(row, 'Origin')], ['Document', fact(row, 'Document')], ['Invoice', fact(row, 'Invoice')]])) : '';
      return `<p class="managed-record-label">${e(row.id)}</p><h5 class="managed-record-title">${e(cell(row, 2))}</h5><p class="managed-detail-copy">${e(row.detail)}</p><div class="managed-arrival"><span class="managed-caption">${e(cell(row, 4) === 'Delivered' ? 'Delivery recorded' : 'Estimated arrival')}</span><strong>${e(arrival || 'Not yet listed')}</strong><span>${e(cell(row, 4))}</span></div>${fields([['Customer order', cell(row, 1)], ['Shipment', row.id]])}${context}<div class="managed-actions">${action(row, 'seen', 'Mark update seen', 'Update marked seen')}</div>`;
    }

    function detail(row) {
      if (!row) return '<div class="managed-empty-detail"><h5>Choose a record</h5><p>Select a result to see its route, decisions and accountable owner.</p></div>';
      const renderers = { routing, bpo, carriers, audit, shipper };
      return (renderers[state.view] || shipment)(row);
    }

    function summary(row) {
      if (state.view === 'routing') return [cell(row, 0), `${cell(row, 2)} / ${cell(row, 1)}`, cell(row, 4)];
      if (state.view === 'bpo') return [cell(row, 2), `${cell(row, 1)} / ${owner(row)}`, cell(row, 5)];
      if (state.view === 'carriers') return [cell(row, 0), `${cell(row, 1)} on time / ${cell(row, 2)} acceptance`, cell(row, 5)];
      if (state.view === 'audit') return [row.id, `${cell(row, 1)} / invoiced ${cell(row, 3)}`, cell(row, 5)];
      if (state.view === 'shipper') return [cell(row, 2), `${row.id} / ${cell(row, 1)}`, cell(row, 4)];
      const move = find('shipments', row.id);
      return [cell(move, 2) || cell(row, 1), `${row.id} / ${cell(find('overview', row.id), 2)}`, cell(move, 4) || cell(row, 3)];
    }

    function renderRecords() {
      const rows = visibleRows();
      root.querySelector('[data-result-count]').textContent = `${rows.length} ${rows.length === 1 ? 'record' : 'records'}`;
      root.querySelector('[data-work-list]').innerHTML = rows.length ? `<ul class="managed-record-list">${rows.map((row) => {
        const [title, subtitle, status] = summary(row);
        return `<li><button type="button" class="managed-record${state.selected === row.id ? ' managed-record-selected' : ''}" data-record="${e(row.id)}" aria-pressed="${state.selected === row.id}"><span class="managed-record-text"><strong>${e(title)}</strong><small>${e(subtitle)}</small></span><span class="managed-record-status">${e(status)}</span></button></li>`;
      }).join('')}</ul>` : '<div class="managed-no-results"><h5>No matching records</h5><p>Try a different lane, ID, carrier or status.</p><button type="button" class="managed-text-button" data-clear>Clear search</button></div>';
      const selected = rows.find((row) => row.id === state.selected);
      root.querySelector('[data-inspector]').innerHTML = detail(selected);
      root.querySelector('[data-selection]').textContent = selected ? selected.id : 'Record details';
      root.querySelector('[data-feedback]').textContent = state.message;
    }

    function renderScreen() {
      const current = copy[state.view] || copy.overview;
      root.querySelector('[data-headline]').innerHTML = `${e(current[0])}<span>${e(current[1])}</span>`;
      root.querySelector('[data-intro]').textContent = current[2];
      root.querySelector('[data-screen]').innerHTML = `<section class="managed-workspace" aria-label="${e(label())}"><header class="managed-workspace-heading"><div><p class="managed-caption">${e(current[3])}</p><h5>${e(current[4])}</h5></div><label class="managed-search"><span class="managed-sr-only">Search ${e(label())}</span>${icons.search}<input type="search" value="${e(state.query)}" placeholder="Search records" autocomplete="off"><button type="button" data-clear aria-label="Clear search">${icons.close}</button></label></header><div class="managed-workbench"><div class="managed-records"><div class="managed-list-heading"><span>${e(current[4])}</span><span data-result-count></span></div><div data-work-list></div>${state.view === 'overview' || state.view === 'shipments' ? '<div class="managed-network-foot">Shipments, service ownership and freight evidence.</div>' : ''}</div><aside class="managed-detail" aria-label="Selected record"><header class="managed-detail-heading"><span class="managed-caption">In focus</span><h5 data-selection tabindex="-1">Record details</h5></header><div data-inspector></div></aside></div><p class="managed-feedback" role="status" aria-live="polite" data-feedback></p></section>`;
      root.querySelectorAll('[data-view]').forEach((button) => {
        const currentView = state.view === 'shipments' ? 'overview' : state.view;
        if (button.dataset.view === currentView) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      });
      renderRecords();
    }

    function focusControl(attribute, value) {
      const button = [...root.querySelectorAll(`[${attribute}]`)].find((item) => item.getAttribute(attribute) === value);
      button?.focus({ preventScroll: true });
      return Boolean(button);
    }

    function selectView(key, record) {
      if (!views[key]) return;
      state.view = key;
      state.query = '';
      state.selected = find(key, record)?.id || rowsFor(key)[0]?.id || null;
      state.message = '';
      renderScreen();
    }

    root.innerHTML = `<div class="managed-shell"><header class="managed-header"><div class="managed-brand" aria-label="relayport"><img src="assets/relayport-mark.png" alt="" width="34" height="34"><span>relayport</span></div><nav class="managed-nav" aria-label="Transportation modules">${modules.map(([key, name]) => `<button type="button" data-view="${e(key)}">${e(name)}</button>`).join('')}</nav></header><div class="managed-hero"><p class="managed-eyebrow">Managed transportation. Connected.</p><h4 data-headline></h4><p class="managed-hero-copy" data-intro></p></div><div class="managed-content" data-screen></div><footer class="managed-footer"><span>relayport / your network, together.</span><span>Fictional data. Actions stay in this preview.</span></footer></div>`;

    root.addEventListener('input', (event) => {
      if (!event.target.matches('.managed-search input')) return;
      state.query = event.target.value;
      state.message = '';
      if (!visibleRows().some((row) => row.id === state.selected)) state.selected = null;
      renderRecords();
    });

    root.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button || !root.contains(button)) return;
      if (button.dataset.view) {
        selectView(button.dataset.view);
        focusControl('data-view', button.dataset.view);
      } else if (button.dataset.openView) {
        selectView(button.dataset.openView, button.dataset.openRecord);
        root.querySelector('[data-selection]')?.focus({ preventScroll: true });
      } else if (button.dataset.record) {
        state.selected = button.dataset.record;
        state.message = '';
        renderRecords();
        focusControl('data-record', state.selected);
      } else if (button.hasAttribute('data-clear')) {
        state.query = '';
        state.selected = rowsFor(state.view)[0]?.id || null;
        state.message = '';
        const input = root.querySelector('.managed-search input');
        input.value = '';
        renderRecords();
        input.focus({ preventScroll: true });
      } else if (button.dataset.action) {
        const { id, action: key } = button.dataset;
        if (key === 'assign') state.assigned.add(id);
        else state.done.add(`${id}:${key}`);
        const messages = {
          assign: 'Assigned to Jordan M.', 'dispatch-note': 'Dispatch check noted.', 'guide-review': 'Guide review noted; the tender sequence is unchanged.',
          'case-note': 'Case note added.', 'carrier-review': 'Carrier review note prepared.', 'evidence-request': 'Evidence request noted. The charge remains on hold.',
          'audit-note': 'Audit note added.', seen: 'Shipment update marked seen.'
        };
        state.message = `${id}: ${messages[key] || 'Update noted.'} Saved in this preview.`;
        renderRecords();
        if (!focusControl('data-action', key)) root.querySelector('.managed-search input')?.focus({ preventScroll: true });
      }
    });
    renderScreen();
  };
})();
