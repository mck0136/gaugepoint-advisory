(() => {
const row = (id, values, detail, facts = []) => ({ id, values, detail, facts });
const view = (label, title, description, columns, rows, options = {}) => ({ label, title, description, columns, rows, ...options });

const platforms = {
  managed: {
    name: 'Managed Transportation', organization: 'Relayport Logistics', role: '4PL operations',
    metrics: [['30-day shipments', '248', 'Across 18 contracted lanes'], ['On-time delivery', '96.8%', '30-day network performance'], ['Guide compliance', '91.4%', 'Contracted carrier utilization'], ['30-day freight spend', '$418.6k', 'All values in USD']],
    insight: { title: 'One lane. Three connected decisions.', text: 'Joliet–Dallas needs a carrier service review, a proof-of-delivery follow-up, and a $180 invoice exception. The same shipment record connects them.', target: 'routing', link: 'Review the routing guide' },
    views: {
      overview: view('Network overview', 'The network, in one operating view.', 'Shipper priorities, carrier execution, outsourced work, and financial controls, connected.', ['Shipment', 'Lane', 'Carrier', 'Status'], [
        row('MT-48271', ['MT-48271', 'Joliet → Dallas', 'Canyon Freight', 'In transit'], 'Alder Foods / intermodal / 40-ft container. Arrival estimate: Oct 15, 14:30–15:00 CT.', [['BPO owner', 'NA execution team'], ['Routing guide', 'Primary contracted carrier'], ['Invoice exception', '$180 detention / evidence required']]),
        row('MT-48272', ['MT-48272', 'Columbus → Atlanta', 'Summit Linehaul', 'Tender accepted'], 'Alder Foods / dry van. Pickup appointment: Oct 14, 16:00 ET.'),
        row('MT-48273', ['MT-48273', 'Memphis → Savannah', 'Mesa Transport', 'Delivered'], 'Cobalt Distribution / dry van. Delivery recorded Oct 14, 09:12 ET.')
      ], { overview: true }),
      shipments: view('Shipments', 'Plan and execute every move.', 'Order intake, tender acceptance, appointment coordination, milestones, and exceptions share one record.', ['Shipment', 'Shipper', 'Lane', 'Mode', 'Status'], [
        row('MT-48271', ['MT-48271', 'Alder Foods', 'Joliet → Dallas', 'Intermodal', 'In transit'], 'Arrival estimate: Oct 15, 14:30–15:00 CT. Customer notification is owned by the NA execution team.', [['Container', '40-ft / example equipment'], ['Carrier', 'Canyon Freight'], ['Tender', 'Primary contracted carrier accepted'], ['Document', 'POD requested after delivery']]),
        row('MT-48272', ['MT-48272', 'Alder Foods', 'Columbus → Atlanta', 'Truckload', 'Tender accepted'], 'Summit Linehaul accepted the contracted tender. Pickup appointment is confirmed.'),
        row('MT-48273', ['MT-48273', 'Cobalt Distribution', 'Memphis → Savannah', 'Truckload', 'Delivered'], 'Delivery complete; document package is ready for audit.')
      ]),
      routing: view('Routing guide', 'The right carrier, by policy.', 'Rank contracted carriers by lane, mode, service, capacity, and rate. Manage tender waterfalls and approved spot exceptions.', ['Lane', 'Mode', 'Primary carrier', 'Backup carrier', 'Policy'], [
        row('RG-018', ['Joliet → Dallas', 'Intermodal', 'Canyon Freight', 'Continental Rail Services', 'Review service'], 'Tender primary carrier first; allow 30 minutes to respond, then advance to the approved backup. Spot freight requires shipper authorization.', [['Guide', 'RG-018 / active contracted lane'], ['Target OTD', '98.0%'], ['Actual OTD', '94.2% / rolling 30 days'], ['Linked shipment', 'MT-48271']]),
        row('RG-022', ['Columbus → Atlanta', 'Truckload', 'Summit Linehaul', 'Canyon Freight', 'Active'], 'Primary tender window: 30 minutes. Backup carrier meets the same service and equipment requirements.'),
        row('RG-031', ['Memphis → Savannah', 'Truckload', 'Mesa Transport', 'Pioneer Transport', 'Active'], 'Daily capacity allocation: four contracted loads. Exceptions route to the shipper transport manager.')
      ], { note: 'Guide changes remain proposals until an authorized shipper owner approves them.' }),
      bpo: view('BPO operations', 'Outsourced work. Explicit ownership.', 'Business process outsourcing queues cover tender follow-up, track-and-trace, appointments, documents, customer updates, and audit support.', ['Case', 'Shipment', 'Work queue', 'Owner', 'Priority', 'Due'], [
        row('BPO-061', ['BPO-061', 'MT-48271', 'Delivery document follow-up', 'Unassigned', 'High', 'After delivery'], 'Collect proof of delivery after the Oct 15 delivery. Do not close the document case before evidence is attached.', [['Service standard', 'Document follow-up within 2 hours of delivery'], ['Escalation', 'NA execution lead'], ['Audit dependency', 'INV-271 / detention evidence']]),
        row('BPO-062', ['BPO-062', 'MT-48272', 'Appointment confirmation', 'Alex R.', 'Normal', '14:00 ET'], 'Confirm the pickup appointment with the shipper and carrier.'),
        row('BPO-063', ['BPO-063', 'MT-48271', 'Customer ETA update', 'Jordan M.', 'Normal', '15:00 ET'], 'Verify the carrier milestone before communicating the revised estimate.')
      ], { assignable: true }),
      carriers: view('Carrier scorecards', 'Measure the carrier relationship.', 'Service, tender acceptance, milestone quality, claims, and cost variance inform reviews and routing-guide decisions.', ['Carrier', 'On-time delivery', 'Tender acceptance', 'Milestone data', 'Claims / 100', 'Review'], [
        row('CR-014', ['Canyon Freight', '94.2%', '91.4%', '96.0%', '0.7', 'Action plan'], 'Joliet–Dallas is below the 98% service target. Schedule a carrier review before changing the routing guide.', [['Window', 'Rolling 30 days'], ['Lane', 'RG-018 / Joliet–Dallas'], ['Related shipment', 'MT-48271'], ['Owner', 'Carrier relationship manager']]),
        row('CR-020', ['Summit Linehaul', '98.6%', '97.1%', '99.2%', '0.2', 'On target'], 'Service and milestone completeness meet the illustrated shipper targets.'),
        row('CR-031', ['Mesa Transport', '98.1%', '95.6%', '98.4%', '0.3', 'On target'], 'Continue monthly service review and capacity planning.')
      ]),
      audit: view('Freight audit', 'From invoice to defensible payment.', 'Match invoices to contracted rates, fuel schedules, accessorial rules, and delivery evidence. Route discrepancies for review before release.', ['Invoice', 'Shipment', 'Expected', 'Invoiced', 'Variance', 'Status'], [
        row('INV-271', ['INV-271', 'MT-48271', '$1,700', '$1,880', '$180', 'Evidence required'], 'The $180 detention charge is held for supporting evidence and shipper approval. No payment is released in this preview.', [['Contracted linehaul', '$1,480 USD'], ['Fuel surcharge', '$220 USD'], ['Disputed detention', '$180 USD'], ['Linked BPO case', 'BPO-061']]),
        row('INV-272', ['INV-272', 'MT-48272', '$1,245', '$1,245', '$0', 'Matched'], 'Rate and fuel schedule match. Delivery evidence is required before the normal payment workflow.'),
        row('INV-273', ['INV-273', 'MT-48273', '$1,930', '$1,930', '$0', 'Ready for review'], 'Invoice and document package are matched, pending authorized release.')
      ]),
      shipper: view('Shipper portal', 'Visibility with the context attached.', 'Shippers see shipment milestones, service issues, spend, documents, and the accountable owner, within their access rights.', ['Shipment', 'Customer order', 'Destination', 'Arrival estimate', 'Status'], [
        row('MT-48271', ['MT-48271', 'NS-10482', 'Dallas, TX', 'Oct 15 / 14:30–15:00 CT', 'In transit'], 'Carrier: Canyon Freight. Customer updates are owned by the NA execution team.', [['Customer', 'Alder Foods'], ['Document', 'POD requested after delivery'], ['Invoice', 'INV-271 / exception under review'], ['Origin', 'Joliet, IL']]),
        row('MT-48272', ['MT-48272', 'NS-10483', 'Atlanta, GA', 'Oct 15 / 09:00 ET', 'Tender accepted'], 'Pickup appointment confirmed; next update follows the collection milestone.'),
        row('MT-48273', ['MT-48273', 'WL-08210', 'Savannah, GA', 'Oct 14 / 09:12 ET', 'Delivered'], 'Delivery and document package recorded.')
      ])
    }
  },
  commercial: {
    name: 'Commercial Intelligence', organization: 'Milemark Freight', role: 'Commercial leadership',
    metrics: [['30-day revenue', '$582.4k', 'Illustrative portfolio'], ['Contribution', '$94.6k', 'After allocated service cost'], ['Contribution margin', '16.2%', 'Portfolio view'], ['Accounts to review', '2', 'Cost-to-serve signals']],
    insight: { title: 'A service issue becomes a commercial decision.', text: 'Alder Foods contribution is down 12.6%. Joliet–Dallas accessorials and service recovery costs connect to the managed transportation record.', target: 'lanes', link: 'Explore lane economics' },
    views: {
      overview: view('Performance overview', 'See the business behind the volume.', 'Revenue, contribution, operating cost, and customer decisions in one commercial view.', ['Customer', 'Revenue', 'Contribution', '90-day change', 'Status'], [
        row('AC-014', ['Alder Foods', '$184.2k', '$18.4k', '-12.6%', 'Review'], 'Service recovery and accessorial costs are compressing contribution. Review the Joliet–Dallas lane.'),
        row('AC-020', ['Summit Retail', '$142.8k', '$24.7k', '-8.2%', 'Review'], 'Contract terms and actual order profile need an account review.'),
        row('AC-031', ['Beacon Supply', '$118.5k', '$29.2k', '+2.4%', 'On target'], 'Stable service cost and improving contribution.')
      ], { overview: true }),
      customers: view('Customer portfolio', 'Account economics, not just revenue.', 'Compare contribution, cost-to-serve, service demand, and account ownership.', ['Customer', 'Revenue', 'Contribution', 'Margin', 'Owner'], [
        row('AC-014', ['Alder Foods', '$184.2k', '$18.4k', '10.0%', 'Jordan M.'], '90-day contribution change: -12.6%. Linked lane: Joliet–Dallas. Account plan: AP-014.'),
        row('AC-020', ['Summit Retail', '$142.8k', '$24.7k', '17.3%', 'Alex R.'], 'Review order-profile changes against contracted service assumptions.'),
        row('AC-031', ['Beacon Supply', '$118.5k', '$29.2k', '24.6%', 'Morgan L.'], 'Protect account service quality while assessing network growth opportunities.')
      ]),
      lanes: view('Lane economics', 'Trace the margin to the move.', 'Allocated linehaul, fuel, accessorials, and support cost expose where the operating model changes the economics.', ['Lane', 'Customer', 'Revenue / move', 'Cost / move', 'Margin', 'Status'], [
        row('RG-018', ['Joliet → Dallas', 'Alder Foods', '$2,150', '$1,970', '8.4%', 'Review'], 'Accessorial and service recovery costs exceed the planning baseline.', [['Linked shipment', 'MT-48271'], ['Invoice exception', 'INV-271 / $180 detention'], ['Carrier review', 'Canyon Freight / 94.2% OTD']]),
        row('RG-022', ['Columbus → Atlanta', 'Alder Foods', '$1,680', '$1,360', '19.0%', 'On target'], 'Actual cost-to-serve remains within the commercial planning baseline.'),
        row('RG-031', ['Memphis → Savannah', 'Beacon Supply', '$2,610', '$2,060', '21.1%', 'On target'], 'Capacity utilization and appointment discipline support the current margin.')
      ]),
      contracts: view('Contracts', 'Keep commercial terms connected.', 'Service commitments, rate terms, renewal windows, and operating assumptions stay visible together.', ['Contract', 'Customer', 'Renewal', 'Scope', 'Status'], [
        row('CT-014', ['CT-014', 'Alder Foods', 'Jan 31, 2027', 'Managed transportation', 'Review terms'], 'Review detention terms and lane-service commitments before the renewal.'),
        row('CT-020', ['CT-020', 'Summit Retail', 'Mar 31, 2027', 'Distribution network', 'Active'], 'Compare the current order profile with the agreed operating assumptions.'),
        row('CT-031', ['CT-031', 'Beacon Supply', 'Jun 30, 2027', 'Regional freight', 'Active'], 'Quarterly service and economics review scheduled.')
      ]),
      plans: view('Account plans', 'Turn evidence into owned action.', 'Commercial and operating teams share priorities, review dates, and accountable next steps.', ['Plan', 'Customer', 'Next action', 'Owner', 'Status'], [
        row('AP-014', ['AP-014', 'Alder Foods', 'Review lane and accessorial terms', 'Jordan M.', 'In review'], 'Combine carrier performance evidence with the customer contract review.'),
        row('AP-020', ['AP-020', 'Summit Retail', 'Validate cost-to-serve assumptions', 'Alex R.', 'Planned'], 'Review the changed order profile with operations and finance.'),
        row('AP-031', ['AP-031', 'Beacon Supply', 'Assess adjacent-lane growth', 'Morgan L.', 'Planned'], 'Assess available capacity before making a commercial commitment.')
      ])
    }
  },
  portal: {
    name: 'Customer & Partner', organization: 'Folio Supply', role: 'Customer workspace',
    metrics: [['Open orders', '24', 'Illustrative customer account'], ['In transit', '16', 'Shared shipment milestones'], ['Awaiting documents', '3', 'Owned service follow-ups'], ['Service requests', '2', 'Assigned response teams']],
    insight: { title: 'The same record, without the status chase.', text: 'Order NS-10482 connects to shipment MT-48271. Arrival estimates, documents, invoice questions, and service ownership stay together.', target: 'orders', link: 'Open the order view' },
    views: {
      overview: view('Customer overview', 'Your business, connected to the move.', 'Orders, partners, documents, invoices, and service conversations, in your own branded environment.', ['Order', 'Shipment', 'Destination', 'Arrival estimate', 'Status'], [
        row('NS-10482', ['NS-10482', 'MT-48271', 'Dallas, TX', 'Oct 15 / 14:30–15:00 CT', 'In transit'], 'Joliet–Dallas / Canyon Freight. Shared update from the NA execution team.'),
        row('NS-10483', ['NS-10483', 'MT-48272', 'Atlanta, GA', 'Oct 15 / 09:00 ET', 'Tender accepted'], 'Pickup appointment confirmed.'),
        row('NS-10484', ['NS-10484', 'MT-48274', 'Indianapolis, IN', 'Oct 16 / 11:00 ET', 'Order received'], 'Equipment and collection requirements are being validated.')
      ], { overview: true }),
      orders: view('Orders', 'One place for each customer commitment.', 'Orders and milestones link to the internal operating record, with customer-relevant information and access boundaries.', ['Order', 'Shipment', 'Origin', 'Destination', 'Status'], [
        row('NS-10482', ['NS-10482', 'MT-48271', 'Joliet, IL', 'Dallas, TX', 'In transit'], 'Arrival estimate: Oct 15, 14:30–15:00 CT.', [['Carrier', 'Canyon Freight'], ['Equipment', '40-ft intermodal container'], ['Documents', 'POD requested after delivery'], ['Service owner', 'NA execution team']]),
        row('NS-10483', ['NS-10483', 'MT-48272', 'Columbus, OH', 'Atlanta, GA', 'Tender accepted'], 'Pickup appointment confirmed for Oct 14.'),
        row('NS-10484', ['NS-10484', 'MT-48274', 'Joliet, IL', 'Indianapolis, IN', 'Order received'], 'Transport planning is reviewing the requested collection window.')
      ]),
      quotes: view('Quotes', 'From request to reviewed offer.', 'Lane, equipment, timing, and service requirements inform a quote, subject to commercial review.', ['Request', 'Lane', 'Mode', 'Required pickup', 'Status'], [
        row('QT-104', ['QT-104', 'Joliet → Indianapolis', 'Truckload', 'Oct 16', 'In review'], 'Illustrative quote request only. No price or capacity commitment is made.'),
        row('QT-105', ['QT-105', 'Columbus → Atlanta', 'Truckload', 'Oct 17', 'Draft'], 'Confirm equipment and appointment requirements before preparing an offer.')
      ]),
      documents: view('Documents', 'Evidence travels with the order.', 'Bookings, delivery records, and supporting documents are linked to the shipment and the responsible team.', ['Document', 'Shipment', 'Type', 'Owner', 'Status'], [
        row('DOC-271', ['DOC-271', 'MT-48271', 'Proof of delivery', 'NA execution team', 'Awaiting delivery'], 'Requested after delivery. Linked to BPO-061 and the shipment document package.'),
        row('DOC-272', ['DOC-272', 'MT-48272', 'Booking confirmation', 'NA execution team', 'Available'], 'Booking confirmation verified against the accepted carrier tender.')
      ]),
      invoices: view('Invoices', 'Commercial questions in context.', 'Invoice status and review conversations stay attached to the customer order and its evidence.', ['Invoice', 'Shipment', 'Amount', 'Currency', 'Status'], [
        row('CI-271', ['CI-271', 'MT-48271', '$2,150', 'USD', 'Draft'], 'Illustrative customer invoice. Underlying carrier detention remains under review in INV-271.'),
        row('CI-272', ['CI-272', 'MT-48272', '$1,680', 'USD', 'Draft'], 'The invoice becomes eligible for review after delivery and evidence matching.')
      ]),
      service: view('Service requests', 'A conversation with an owner.', 'Customer and partner questions connect to a record, an accountable team, and a response commitment.', ['Request', 'Related shipment', 'Subject', 'Owner', 'Status'], [
        row('SR-061', ['SR-061', 'MT-48271', 'Confirm delivery estimate', 'NA execution team', 'In progress'], 'Latest estimate: Oct 15, 14:30–15:00 CT. The team will verify the next carrier milestone before responding.'),
        row('SR-062', ['SR-062', 'MT-48272', 'Confirm pickup appointment', 'Alex R.', 'Resolved'], 'Pickup appointment confirmed and linked to the order record.')
      ])
    }
  }
};

function filterRows(rows, query) {
  const term = query.trim().toLowerCase();
  return rows.filter((item) => !term || item.values.some((value) => value.toLowerCase().includes(term)));
}

window.GaugepointWorkspace = { platforms, filterRows, mounts: {} };
})();
