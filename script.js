const body = document.body;
const root = body.dataset.root || "";
const currentPage = body.dataset.page || "home";
const content = window.GAUGEPOINT_CONTENT || {};

const navigation = [
  ["ai-readiness", "AI Readiness", "ai-readiness/"],
  ["operating-transformation", "Operating Transformation", "operating-transformation/"],
  ["ai-in-transportation", "AI in Transportation", "ai-in-transportation/"],
  ["speaking-media", "Speaking & Media", "speaking-media/"],
  ["about", "About", "about/"]
];

const pageUrl = (path = "") => `${root}${path}`;
const externalLink = (url, label) =>
  `<a class="text-link external-link" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;

const headerTarget = document.querySelector("#site-header");
if (headerTarget) {
  const navLinks = navigation.map(([key, label, href]) => {
    const current = currentPage === key ? ' aria-current="page"' : "";
    return `<a href="${pageUrl(href)}"${current}>${label}</a>`;
  }).join("");

  headerTarget.innerHTML = `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="site-header">
      <a class="brand" href="${pageUrl()}" aria-label="Gaugepoint Advisory home">
        <img src="${pageUrl("assets/gaugepoint-advisory-lockup.png")}" alt="Gaugepoint Advisory">
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
        <span></span><span></span><span></span><span class="sr-only">Open menu</span>
      </button>
      <nav id="site-nav" class="site-nav" aria-label="Primary navigation">
        ${navLinks}
        <a href="${pageUrl("contact/")}" class="nav-cta">Assess Your AI Readiness</a>
      </nav>
    </header>`;
}

const main = document.querySelector("main");
if (main && !main.id) main.id = "main-content";

const footerTarget = document.querySelector("#site-footer");
if (footerTarget) {
  footerTarget.innerHTML = `
    <footer class="site-footer">
      <div class="container footer-grid">
        <a class="footer-logo" href="${pageUrl()}" aria-label="Gaugepoint Advisory home">
          <img src="${pageUrl("assets/gaugepoint-advisory-lockup.png")}" alt="Gaugepoint Advisory">
        </a>
        <div>
          <p><strong>AI readiness and operating transformation for transportation.</strong></p>
          <a class="text-link" href="${pageUrl("contact/")}">Start a Conversation</a>
        </div>
        <p class="small">&copy; ${new Date().getFullYear()} Gaugepoint. All rights reserved.</p>
      </div>
    </footer>`;
}

const siteHeader = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector("#site-nav");
const closeMenu = () => {
  siteNav?.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
  body.classList.remove("menu-open");
};

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const open = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    body.classList.toggle("menu-open", open);
  });
  siteNav.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      navToggle.focus();
    }
  });
}

const updateScrollState = () => {
  const scrollY = window.scrollY;
  siteHeader?.classList.toggle("is-scrolled", scrollY > 24);
  document.documentElement.style.setProperty("--page-scroll", String(Math.min(scrollY, 1200)));
};
updateScrollState();
window.addEventListener("scroll", updateScrollState, { passive: true });

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");
if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });
  revealItems.forEach((item) => revealObserver.observe(item));
}

document.querySelectorAll("[data-leverage-connectors]").forEach((svg) => {
  const system = svg.closest(".leverage-system");
  const routes = svg.querySelector("[data-leverage-routes]");
  const svgNamespace = "http://www.w3.org/2000/svg";
  let drawingFrame;
  let routeOrder = 0;

  const relativeBounds = (element, rootBounds) => {
    const bounds = element.getBoundingClientRect();
    const left = bounds.left - rootBounds.left;
    const top = bounds.top - rootBounds.top;
    return {
      left,
      top,
      right: left + bounds.width,
      bottom: top + bounds.height,
      width: bounds.width,
      height: bounds.height,
      centerX: left + bounds.width / 2,
      centerY: top + bounds.height / 2
    };
  };

  const routeData = (points) => points
    .map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");

  const addRoute = (points, className, from, to) => {
    const path = document.createElementNS(svgNamespace, "path");
    path.setAttribute("class", `leverage-route ${className}`);
    path.setAttribute("d", routeData(points));
    path.setAttribute("pathLength", "1");
    path.dataset.from = from;
    path.dataset.to = to;
    path.style.setProperty("--route-order", routeOrder++);
    routes.appendChild(path);
  };

  const addJunction = (point, label) => {
    const junction = document.createElementNS(svgNamespace, "circle");
    junction.setAttribute("class", "leverage-junction");
    junction.setAttribute("cx", point.x.toFixed(1));
    junction.setAttribute("cy", point.y.toFixed(1));
    junction.setAttribute("r", label === "shared-fork" ? "5" : "3.5");
    junction.dataset.junction = label;
    routes.appendChild(junction);
  };

  const connectCards = (source, destination, from, to, className = "") => {
    if (destination.top >= source.bottom) {
      const middleY = (source.bottom + destination.top) / 2;
      addRoute([
        { x: source.centerX, y: source.bottom },
        { x: source.centerX, y: middleY },
        { x: destination.centerX, y: middleY },
        { x: destination.centerX, y: destination.top }
      ], className, from, to);
      return;
    }
    if (source.top >= destination.bottom) {
      const middleY = (source.top + destination.bottom) / 2;
      addRoute([
        { x: source.centerX, y: source.top },
        { x: source.centerX, y: middleY },
        { x: destination.centerX, y: middleY },
        { x: destination.centerX, y: destination.bottom }
      ], className, from, to);
      return;
    }
    const middleX = (source.right + destination.left) / 2;
    addRoute([
      { x: source.right, y: source.centerY },
      { x: middleX, y: source.centerY },
      { x: middleX, y: destination.centerY },
      { x: destination.left, y: destination.centerY }
    ], className, from, to);
  };

  const drawRoutes = () => {
    if (!system || !routes) return;

    const rootBounds = system.getBoundingClientRect();
    if (!rootBounds.width || !rootBounds.height) return;

    svg.setAttribute("viewBox", `0 0 ${rootBounds.width} ${rootBounds.height}`);
    routes.replaceChildren();
    routeOrder = 0;

    const source = relativeBounds(system.querySelector("[data-flow-source]"), rootBounds);
    const fragmentedLane = relativeBounds(system.querySelector(".fragmented-lane"), rootBounds);
    const scalableLane = relativeBounds(system.querySelector(".scalable-lane"), rootBounds);
    const fragmentedSystem = relativeBounds(system.querySelector('[data-flow-system="fragmented"]'), rootBounds);
    const scalableSystem = relativeBounds(system.querySelector('[data-flow-system="scalable"]'), rootBounds);
    const fragmentedOutcome = relativeBounds(system.querySelector('[data-flow-outcome="fragmented"]'), rootBounds);
    const scalableOutcome = relativeBounds(system.querySelector('[data-flow-outcome="scalable"]'), rootBounds);
    const fragmentNames = ["frag-email", "frag-sheet", "frag-followup", "frag-chase", "frag-wait", "frag-escalation", "frag-terminal"];
    const fragmentNodes = fragmentNames.map((name) =>
      relativeBounds(system.querySelector(`[data-flow-node="${name}"]`), rootBounds));
    const scaleNames = ["scale-intake", "scale-owner", "scale-rule", "scale-exception", "scale-update", "scale-resolution"];
    const scaleCards = scaleNames.map((name) =>
      relativeBounds(system.querySelector(`[data-flow-node="${name}"] .scale-copy`), rootBounds));
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    let sharedJunction;

    if (mobile) {
      sharedJunction = { x: source.centerX, y: source.bottom + 28 };
      addRoute([
        { x: source.centerX, y: source.bottom },
        sharedJunction
      ], "is-shared", "shared-volume", "shared-fork");
      addJunction(sharedJunction, "shared-fork");

      const mobileForkX = fragmentedLane.left - 10;
      const fragmentedPanelEntry = { x: fragmentedLane.left, y: fragmentedLane.top + 20 };
      addRoute([
        sharedJunction,
        { x: mobileForkX, y: sharedJunction.y },
        { x: mobileForkX, y: fragmentedPanelEntry.y },
        fragmentedPanelEntry
      ], "is-fork", "shared-fork", "fragmented-panel");

      const scaleBackboneX = scalableSystem.left + 26;
      const scaleJunctions = scaleCards.map((card) => ({ x: scaleBackboneX, y: card.centerY }));
      const scalablePanelEntry = { x: scalableLane.left, y: scalableLane.top + 20 };
      addRoute([
        sharedJunction,
        { x: mobileForkX, y: sharedJunction.y },
        { x: mobileForkX, y: scalablePanelEntry.y },
        scalablePanelEntry
      ], "is-fork", "shared-fork", "scalable-panel");

      const fragmentSequence = [0, 1, 2, 4, 5, 6];
      fragmentSequence.slice(0, -1).forEach((nodeIndex, index) => {
        const nextIndex = fragmentSequence[index + 1];
        connectCards(
          fragmentNodes[nodeIndex],
          fragmentNodes[nextIndex],
          fragmentNames[nodeIndex],
          fragmentNames[nextIndex],
          "is-fragmented"
        );
      });
      connectCards(fragmentNodes[2], fragmentNodes[3], "frag-followup", "frag-chase", "is-rework");
      connectCards(fragmentNodes[3], fragmentNodes[4], "frag-chase", "frag-wait", "is-rework");

      const fragmentedTerminal = fragmentNodes.at(-1);
      const fragmentedOutcomeMidY = (fragmentedTerminal.bottom + fragmentedOutcome.top) / 2;
      addRoute([
        { x: fragmentedTerminal.centerX, y: fragmentedTerminal.bottom },
        { x: fragmentedTerminal.centerX, y: fragmentedOutcomeMidY },
        { x: fragmentedOutcome.centerX, y: fragmentedOutcomeMidY },
        { x: fragmentedOutcome.centerX, y: fragmentedOutcome.top }
      ], "is-fragmented", "frag-terminal", "fragmented-outcomes");

      scaleJunctions.forEach((junction, index) => {
        const card = scaleCards[index];
        addRoute([
          junction,
          { x: card.left, y: card.centerY }
        ], "is-scalable is-stem", scaleNames[index], `${scaleNames[index]}-card`);
        addJunction(junction, scaleNames[index]);
        if (index < scaleJunctions.length - 1) {
          addRoute([junction, scaleJunctions[index + 1]], "is-scalable", scaleNames[index], scaleNames[index + 1]);
        }
      });

      const lastScaleJunction = scaleJunctions.at(-1);
      const scalableExitY = scalableSystem.bottom - 6;
      addRoute([
        lastScaleJunction,
        { x: lastScaleJunction.x, y: scalableExitY },
        { x: scalableOutcome.centerX, y: scalableExitY },
        { x: scalableOutcome.centerX, y: scalableOutcome.top }
      ], "is-scalable", "scale-resolution", "scalable-outcomes");
      return;
    }

    sharedJunction = {
      x: Math.min(source.right + 18, fragmentedLane.left - 12),
      y: source.centerY
    };
    addRoute([
      { x: source.right, y: source.centerY },
      sharedJunction
    ], "is-shared", "shared-volume", "shared-fork");
    addJunction(sharedJunction, "shared-fork");

    const fragmentedPanelEntry = { x: fragmentedLane.left, y: fragmentedLane.top + 24 };
    addRoute([
      sharedJunction,
      { x: sharedJunction.x, y: fragmentedPanelEntry.y },
      fragmentedPanelEntry
    ], "is-fork", "shared-fork", "fragmented-panel");

    const scaleBackboneY = Math.max(...scaleCards.map((card) => card.bottom)) + 16;
    const scaleJunctions = scaleCards.map((card) => ({ x: card.centerX, y: scaleBackboneY }));
    const scalablePanelEntry = { x: scalableLane.left, y: scalableLane.top + 24 };
    addRoute([
      sharedJunction,
      { x: sharedJunction.x, y: scalablePanelEntry.y },
      scalablePanelEntry
    ], "is-fork", "shared-fork", "scalable-panel");

    const fragmentSequence = [0, 1, 2, 4, 5, 6];
    fragmentSequence.slice(0, -1).forEach((nodeIndex, index) => {
      const nextIndex = fragmentSequence[index + 1];
      connectCards(
        fragmentNodes[nodeIndex],
        fragmentNodes[nextIndex],
        fragmentNames[nodeIndex],
        fragmentNames[nextIndex],
        "is-fragmented"
      );
    });
    connectCards(fragmentNodes[2], fragmentNodes[3], "frag-followup", "frag-chase", "is-rework");
    connectCards(fragmentNodes[3], fragmentNodes[4], "frag-chase", "frag-wait", "is-rework");

    const fragmentedTerminal = fragmentNodes.at(-1);
    if (fragmentedOutcome.left >= fragmentedTerminal.right) {
      addRoute([
        { x: fragmentedTerminal.right, y: fragmentedTerminal.centerY },
        { x: fragmentedOutcome.left, y: fragmentedTerminal.centerY }
      ], "is-fragmented", "frag-terminal", "fragmented-outcomes");
    } else {
      const fragmentedOutcomeMidY = (fragmentedTerminal.bottom + fragmentedOutcome.top) / 2;
      addRoute([
        { x: fragmentedTerminal.centerX, y: fragmentedTerminal.bottom },
        { x: fragmentedTerminal.centerX, y: fragmentedOutcomeMidY },
        { x: fragmentedOutcome.centerX, y: fragmentedOutcomeMidY },
        { x: fragmentedOutcome.centerX, y: fragmentedOutcome.top }
      ], "is-fragmented", "frag-terminal", "fragmented-outcomes");
    }

    const scaleBackboneStart = { x: scalableSystem.left + 12, y: scaleBackboneY };
    addRoute([scaleBackboneStart, scaleJunctions[0]], "is-scalable", "scale-backbone-start", "scale-intake");

    scaleJunctions.forEach((junction, index) => {
      const card = scaleCards[index];
      const cardAnchor = card.centerY < scaleBackboneY
        ? { x: card.centerX, y: card.bottom }
        : { x: card.centerX, y: card.top };
      addRoute([cardAnchor, junction], "is-scalable is-stem", `${scaleNames[index]}-card`, scaleNames[index]);
      addJunction(junction, scaleNames[index]);
      if (index < scaleJunctions.length - 1) {
        addRoute([junction, scaleJunctions[index + 1]], "is-scalable", scaleNames[index], scaleNames[index + 1]);
      }
    });

    const lastScaleJunction = scaleJunctions.at(-1);
    if (scalableOutcome.left >= scalableSystem.right - 2) {
      addRoute([
        lastScaleJunction,
        { x: scalableOutcome.left, y: lastScaleJunction.y }
      ], "is-scalable", "scale-resolution", "scalable-outcomes");
    } else {
      const scalableExitX = scalableSystem.right - 7;
      const scalableExitY = scalableSystem.bottom - 7;
      addRoute([
        lastScaleJunction,
        { x: scalableExitX, y: lastScaleJunction.y },
        { x: scalableExitX, y: scalableExitY },
        { x: scalableOutcome.centerX, y: scalableExitY },
        { x: scalableOutcome.centerX, y: scalableOutcome.top }
      ], "is-scalable", "scale-resolution", "scalable-outcomes");
    }
  };

  const scheduleRoutes = () => {
    window.cancelAnimationFrame(drawingFrame);
    drawingFrame = window.requestAnimationFrame(drawRoutes);
  };

  drawRoutes();
  window.addEventListener("resize", scheduleRoutes, { passive: true });
  document.fonts?.ready.then(scheduleRoutes);
});

const workflowSteps = [...document.querySelectorAll("[data-workflow-step]")];
const workflowMap = document.querySelector(".workflow-map");
if (workflowSteps.length && workflowMap) {
  const progressByStep = { order: "8%", plan: "28%", move: "49%", exception: "70%", close: "94%" };
  const setWorkflowStep = (step) => {
    const key = step.dataset.workflowStep;
    const activeIndex = workflowSteps.indexOf(step);
    workflowSteps.forEach((item) => item.classList.toggle("is-current", item === step));
    document.querySelectorAll(".workflow-node").forEach((node, index) => {
      node.classList.toggle("is-active", node.classList.contains(`node-${key}`));
      node.classList.toggle("is-complete", index < activeIndex);
    });
    workflowMap.dataset.current = key;
    workflowMap.classList.toggle("is-exception", key === "exception");
    workflowMap.style.setProperty("--workflow-progress", progressByStep[key]);
  };
  setWorkflowStep(workflowSteps[0]);
  const workflowVisibility = new Map(workflowSteps.map((step) => [step, 0]));
  const workflowObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => workflowVisibility.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0));
    const visible = [...workflowVisibility.entries()].sort((a, b) => b[1] - a[1])[0];
    if (visible?.[1] > 0) setWorkflowStep(visible[0]);
  }, { threshold: [0.35, 0.55, 0.75] });
  workflowSteps.forEach((step) => workflowObserver.observe(step));
}

const lazyVideos = [...document.querySelectorAll("[data-lazy-video]")];
const loadVideo = (video) => {
  if (video.dataset.loaded === "true") return;
  video.querySelectorAll("source[data-src]").forEach((source) => {
    source.src = source.dataset.src;
  });
  video.dataset.loaded = "true";
  video.load();
};
if (!reducedMotion && lazyVideos.length) {
  if ("IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          loadVideo(video);
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { rootMargin: "180px 0px", threshold: 0.08 });
    lazyVideos.forEach((video) => {
      video.addEventListener("playing", () => video.closest("[data-observe-system]")?.classList.add("is-video-active"));
      videoObserver.observe(video);
    });
  } else {
    lazyVideos.forEach((video) => {
      loadVideo(video);
      video.play().catch(() => {});
    });
  }
}

const readinessContent = {
  strategy: {
    label: "Strategy",
    headline: ["A defined business", "problem comes first."],
    description: "Clarify the operating outcome, executive ownership, and evidence that will define success before selecting a tool."
  },
  workflows: {
    label: "Workflows",
    headline: ["Understand the work", "before automating it."],
    description: "Map the decisions, handoffs, exceptions, and delays that shape the operation before introducing intelligent automation."
  },
  data: {
    label: "Data",
    headline: ["AI can only act on", "information the", "operation can trust."],
    description: "Identify the data required, where it originates, who owns it, and how its quality will be measured and maintained."
  },
  systems: {
    label: "Systems",
    headline: ["Technology must", "connect to the", "operating environment."],
    description: "Evaluate how the TMS, ERP, CRM, telematics, and workflow tools exchange information and support action."
  },
  people: {
    label: "People",
    headline: ["Adoption is an", "operating requirement."],
    description: "Define how roles will change, where human judgement remains essential, and how teams will be prepared to work differently."
  },
  governance: {
    label: "Governance",
    headline: ["Authority and", "accountability must", "remain explicit."],
    description: "Set permissions, approval points, escalation rules, audit trails, and responsibility before AI participates in operational decisions."
  },
  economics: {
    label: "Economics",
    headline: ["The business case", "must survive", "implementation."],
    description: "Establish the baseline, investment requirement, measurable benefit, and conditions required for the use case to create durable value."
  }
};

const buildReadinessDiagram = () => {
  const connectorLayer = document.querySelector("[data-readiness-connectors]");
  const nodeLayer = document.querySelector("[data-readiness-nodes]");
  if (!connectorLayer || !nodeLayer) return;

  const svgNamespace = "http://www.w3.org/2000/svg";
  const centerX = 450;
  const centerY = 450;
  const centralHubRadius = 155;
  const nodeOrbitRadius = 285;
  const outerNodeRadius = 66;
  const connectorStartRadius = centralHubRadius + 10;
  const connectorEndRadius = nodeOrbitRadius - outerNodeRadius - 8;
  const nodes = [
    { id: "strategy", label: "Strategy" },
    { id: "workflows", label: "Workflows" },
    { id: "data", label: "Data" },
    { id: "economics", label: "Economics" },
    { id: "systems", label: "Systems" },
    { id: "people", label: "People" },
    { id: "governance", label: "Governance" }
  ];
  const angleStep = 360 / nodes.length;
  const startingAngle = -90;
  const createSvgElement = (name, attributes = {}) => {
    const element = document.createElementNS(svgNamespace, name);
    Object.entries(attributes).forEach(([attribute, value]) => element.setAttribute(attribute, String(value)));
    return element;
  };

  nodes.forEach((node, index) => {
    const angleDegrees = startingAngle + index * angleStep;
    const angleRadians = angleDegrees * (Math.PI / 180);
    const cosine = Math.cos(angleRadians);
    const sine = Math.sin(angleRadians);
    const x = centerX + nodeOrbitRadius * cosine;
    const y = centerY + nodeOrbitRadius * sine;
    const connector = {
      x1: centerX + connectorStartRadius * cosine,
      y1: centerY + connectorStartRadius * sine,
      x2: centerX + connectorEndRadius * cosine,
      y2: centerY + connectorEndRadius * sine
    };

    const connectorLine = createSvgElement("line", {
      class: `readiness-radial${node.id === "strategy" ? " is-active" : ""}`,
      x1: connector.x1,
      y1: connector.y1,
      x2: connector.x2,
      y2: connector.y2,
      "data-connector": node.id,
      pathLength: 1,
      "vector-effect": "non-scaling-stroke"
    });
    const signalLine = createSvgElement("line", {
      class: "readiness-signal",
      x1: connector.x1,
      y1: connector.y1,
      x2: connector.x2,
      y2: connector.y2,
      "data-signal": node.id,
      pathLength: 1,
      "vector-effect": "non-scaling-stroke"
    });
    const junction = createSvgElement("circle", {
      class: `readiness-junction${node.id === "strategy" ? " is-active" : ""}`,
      cx: connector.x2,
      cy: connector.y2,
      r: 4,
      "data-junction": node.id,
      "vector-effect": "non-scaling-stroke"
    });
    connectorLayer.append(connectorLine, signalLine, junction);

    const nodeGroup = createSvgElement("g", {
      class: `readiness-node-group readiness-node-${node.id}${node.id === "strategy" ? " is-active" : ""}`,
      transform: `translate(${x} ${y})`,
      role: "button",
      tabindex: "0",
      "aria-pressed": String(node.id === "strategy"),
      "aria-label": `${node.label}. ${readinessContent[node.id].headline.join(" ")}`,
      "data-readiness": node.id,
      "data-angle": angleDegrees,
      "data-node-x": x,
      "data-node-y": y,
      "data-orbit-radius": nodeOrbitRadius
    });
    const halo = createSvgElement("circle", {
      class: "readiness-node-halo",
      cx: 0,
      cy: 0,
      r: outerNodeRadius + 12,
      filter: "url(#readiness-strategy-glow)"
    });
    const focusRing = createSvgElement("circle", {
      class: "readiness-node-focus",
      cx: 0,
      cy: 0,
      r: outerNodeRadius + 6
    });
    const surface = createSvgElement("circle", {
      class: "readiness-node-surface",
      cx: 0,
      cy: 0,
      r: outerNodeRadius,
      filter: "url(#readiness-node-shadow)",
      "vector-effect": "non-scaling-stroke"
    });
    const rim = createSvgElement("path", {
      class: "readiness-node-rim",
      d: "M -49.8 -41.8 A 66 66 0 0 1 49.8 -41.8"
    });
    const icon = createSvgElement("use", {
      class: "readiness-node-icon",
      href: `#readiness-icon-${node.id}`,
      x: -15,
      y: -40,
      width: 30,
      height: 30
    });
    const label = createSvgElement("text", {
      class: "readiness-node-label",
      x: 0,
      y: 29,
      "text-anchor": "middle"
    });
    label.textContent = node.label.toUpperCase();
    nodeGroup.append(halo, focusRing, surface, rim, icon, label);
    nodeLayer.append(nodeGroup);
  });
};

buildReadinessDiagram();

const readinessKeys = ["strategy", "workflows", "data", "economics", "systems", "people", "governance"];
const readinessNodes = [...document.querySelectorAll("[data-readiness]")];
const readinessDetail = document.querySelector(".readiness-detail");
const readinessTitle = document.querySelector("[data-readiness-title]");
let readinessTimer;
let readinessHoverTimer;
let activeReadiness = "strategy";

const renderReadinessTitle = (lines) => {
  if (!readinessTitle) return;
  readinessTitle.replaceChildren(...lines.map((line, index) => {
    const span = document.createElement("span");
    span.textContent = `${line}${index < lines.length - 1 ? " " : ""}`;
    return span;
  }));
};

const illuminateReadinessPath = (key) => {
  const signal = document.querySelector(`[data-signal="${key}"]`);
  if (!signal || reducedMotion) return;
  signal.classList.remove("is-signaling");
  void signal.getBoundingClientRect();
  signal.classList.add("is-signaling");
};

const activateReadiness = (key) => {
  const detail = readinessContent[key];
  if (!detail) return;

  activeReadiness = key;
  readinessNodes.forEach((node) => {
    const active = node.dataset.readiness === key;
    node.classList.toggle("is-active", active);
    node.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll("[data-connector]").forEach((connector) => {
    connector.classList.toggle("is-active", connector.dataset.connector === key);
  });
  document.querySelectorAll("[data-junction]").forEach((junction) => {
    junction.classList.toggle("is-active", junction.dataset.junction === key);
  });

  const updateDetail = () => {
    document.querySelector("[data-readiness-label]").textContent = detail.label;
    renderReadinessTitle(detail.headline);
    document.querySelector("[data-readiness-copy]").textContent = detail.description;
    readinessDetail?.classList.remove("is-updating");
    illuminateReadinessPath(key);
  };

  window.clearTimeout(readinessTimer);
  readinessDetail?.classList.add("is-updating");
  if (reducedMotion) updateDetail();
  else readinessTimer = window.setTimeout(updateDetail, 210);
};

const visibleReadinessNode = (key) => readinessNodes.find((node) => {
  if (node.dataset.readiness !== key || getComputedStyle(node).display === "none") return false;
  const bounds = node.getBoundingClientRect();
  return bounds.width > 0 && bounds.height > 0;
});

readinessNodes.forEach((node) => {
  node.addEventListener("click", () => activateReadiness(node.dataset.readiness));
  node.addEventListener("pointerenter", () => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    window.clearTimeout(readinessHoverTimer);
    readinessHoverTimer = window.setTimeout(() => activateReadiness(node.dataset.readiness), 140);
  });
  node.addEventListener("pointerleave", () => window.clearTimeout(readinessHoverTimer));
  node.addEventListener("keydown", (event) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const direction = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
    const currentIndex = readinessKeys.indexOf(node.dataset.readiness);
    const nextKey = readinessKeys[(currentIndex + direction + readinessKeys.length) % readinessKeys.length];
    activateReadiness(nextKey);
    visibleReadinessNode(nextKey)?.focus();
  });
});

window.setTimeout(() => illuminateReadinessPath(activeReadiness), 900);

const caseStudyTarget = document.querySelector('[data-render="case-studies"]');
if (caseStudyTarget && content.externalAiExamples) {
  const isRail = caseStudyTarget.classList.contains("evidence-rail");
  caseStudyTarget.innerHTML = content.externalAiExamples.map((item) => isRail ? `
    <article class="evidence-card">
      <div class="card-meta"><span>${item.application}</span><span>${item.year}</span></div>
      <p class="company-name">${item.company}</p>
      <h3>${item.headline}</h3>
      <p><strong>Operating problem:</strong> ${item.problem}</p>
      <p><strong>Public application:</strong> ${item.applicationCopy}</p>
      <p class="reported-result"><strong>Gaugepoint lesson:</strong> ${item.lesson}</p>
      <p><strong>Readiness conditions:</strong> ${item.readiness}</p>
      ${externalLink(item.url, `Read the ${item.sourceName} source`)}
      <p class="disclaimer">${item.disclaimer}</p>
    </article>` : `
    <article class="source-card">
      <div class="card-meta"><span>${item.application}</span><span>${item.year}</span></div>
      <p class="company-name">${item.company}</p>
      <h3>${item.headline}</h3>
      <p>${item.applicationCopy}</p>
      <p class="reported-result">${item.lesson}</p>
      ${externalLink(item.url, `Read the ${item.sourceName} source`)}
      <p class="disclaimer">${item.disclaimer}</p>
    </article>`).join("");
}

const evidenceRail = document.querySelector(".evidence-rail");
document.querySelectorAll("[data-rail-direction]").forEach((button) => {
  button.addEventListener("click", () => {
    evidenceRail?.scrollBy({ left: Number(button.dataset.railDirection) * Math.min(560, window.innerWidth * 0.82), behavior: reducedMotion ? "auto" : "smooth" });
  });
});

const webinarTarget = document.querySelector('[data-render="webinars"]');
if (webinarTarget && content.speakingAppearances) {
  webinarTarget.innerHTML = content.speakingAppearances
    .filter((item) => item.category === "ai")
    .map((item) => `
      <article class="media-card">
        <p class="card-date">${item.date}</p>
        <h3>${item.title}</h3>
        <p>${item.context}</p>
        <ul class="compact-list">${item.topics.map((topic) => `<li>${topic}</li>`).join("")}</ul>
        <p class="disclaimer">Session focus and topics are summarized here for reference.</p>
      </article>`).join("");
}

const archiveTarget = document.querySelector('[data-render="media-archive"]');
if (archiveTarget && content.mediaArchive) {
  archiveTarget.innerHTML = content.mediaArchive.map((item) => `
    <article class="archive-item" data-archive-category="${item.category}">
      <span class="archive-type">${item.type}</span>
      <span>${item.date}</span>
      <div><h3>${item.title}</h3><p>${item.description}</p></div>
      ${item.url ? externalLink(item.url, "View source") : ""}
    </article>`).join("");
}

const audienceSegments = [
  {
    id: "fleets",
    label: "Fleets",
    descriptor: "AI-optimized asset utilization and network performance",
    theme: "AI-first advisory",
    summary: "Apply AI to fleet planning, asset utilization, operating decisions and scalable exception management.",
    capabilities: ["AI workflow design", "Asset utilization", "Network performance"],
    icon: "truck",
    poster: "assets/audiences/fleets.jpg",
    objectPosition: "64% center",
    mediaAlt: "An aerial view of truck trailers arranged across a freight yard.",
    credit: "Giant Asparagus / Pexels",
    sourcePage: "https://www.pexels.com/photo/aerial-view-of-truck-and-trailer-parking-lot-35501714/"
  },
  {
    id: "brokers",
    label: "Brokers",
    descriptor: "AI-led pricing, procurement and workflow excellence",
    theme: "AI-led operating leverage",
    summary: "Create operating leverage across pricing, carrier procurement, exception handling and high-volume brokerage workflows.",
    capabilities: ["AI workflow design", "Pricing discipline", "Carrier procurement"],
    icon: "broker",
    poster: "assets/audiences/brokers.jpg",
    objectPosition: "66% center",
    mediaAlt: "A transportation operations team working across multiple monitors.",
    credit: "Pixabay / Pexels",
    sourcePage: "https://www.pexels.com/photo/software-engineers-working-on-computers-256219/"
  },
  {
    id: "3pls",
    label: "3PLs",
    descriptor: "AI-powered network design, visibility and execution",
    theme: "AI-enabled network execution",
    summary: "Modernize network planning, customer visibility, transportation execution and exception management with practical AI.",
    capabilities: ["Network intelligence", "Customer visibility", "Workflow automation"],
    icon: "warehouse",
    poster: "assets/audiences/3pls.jpg",
    objectPosition: "67% center",
    mediaAlt: "Warehouse employees and material-handling equipment working inside a distribution facility.",
    credit: "GB The Green Brand / Pexels",
    sourcePage: "https://www.pexels.com/photo/modern-warehouse-operations-with-employees-and-forklift-30824313/"
  },
  {
    id: "4pls",
    label: "4PLs",
    descriptor: "AI-driven control towers and orchestration at scale",
    theme: "AI and operating-model governance",
    summary: "Strengthen control-tower operations, provider orchestration, decision speed and accountability across complex networks.",
    capabilities: ["Control-tower design", "Network orchestration", "Decision governance"],
    icon: "network",
    poster: "assets/audiences/4pls.jpg",
    objectPosition: "66% center",
    mediaAlt: "Technicians coordinating activity from a multi-screen industrial control room.",
    credit: "Sergey Sergeev / Pexels",
    sourcePage: "https://www.pexels.com/photo/technicians-in-control-room-operating-machinery-32845695/"
  },
  {
    id: "drayage",
    label: "Drayage",
    descriptor: "Dispatch flow, yard coordination and handoff control",
    theme: "Operating transformation",
    summary: "Improve dispatch, terminal coordination, chassis visibility, exception handling and the handoffs that determine daily performance.",
    capabilities: ["Dispatch redesign", "Yard and chassis flow", "Terminal handoffs"],
    icon: "container-truck",
    poster: "assets/audiences/drayage.jpg",
    objectPosition: "68% center",
    mediaAlt: "A container yard where cranes and operating equipment coordinate freight movement.",
    credit: "Alex Levis / Pexels",
    sourcePage: "https://www.pexels.com/photo/container-yard-with-crane-moving-shipping-containers-36771186/"
  },
  {
    id: "intermodal",
    label: "Intermodal",
    descriptor: "AI-optimized modal decisions and terminal connectivity",
    theme: "AI-enabled intermodal execution",
    summary: "Connect modal strategy, rail performance, drayage execution and terminal information through scalable AI-enabled workflows.",
    capabilities: ["Modal optimization", "Terminal connectivity", "Exception intelligence"],
    icon: "intermodal",
    poster: "assets/hero-intermodal-yard.png",
    objectPosition: "68% center",
    mediaAlt: "An intermodal terminal with rail tracks, stacked containers and lifting equipment.",
    credit: "Gaugepoint site media",
    sourcePage: ""
  },
  {
    id: "shortline-railways",
    label: "Shortline railways",
    descriptor: "Equipment velocity through precision operating models",
    theme: "Precision operating models",
    summary: "Improve equipment turns, local service execution and asset productivity through disciplined precision operating models.",
    capabilities: ["Equipment velocity", "Precision operations", "Service design"],
    icon: "shortline",
    poster: "assets/audiences/shortline-railways.jpg",
    objectPosition: "64% center",
    mediaAlt: "A North American freight train moving along a local rail corridor.",
    credit: "Tom Fisk / Pexels",
    sourcePage: "https://www.pexels.com/photo/photo-of-a-freight-train-18512161/"
  },
  {
    id: "regional-railways",
    label: "Regional railways",
    descriptor: "Network discipline, equipment velocity and service reliability",
    theme: "Railway operating transformation",
    summary: "Improve network flow, terminal discipline, equipment velocity and service reliability across a broader operating footprint.",
    capabilities: ["Network velocity", "Terminal discipline", "Service reliability"],
    icon: "regional",
    poster: "assets/audiences/regional-railways.jpg",
    objectPosition: "62% center",
    mediaAlt: "An aerial view of a freight rail yard with multiple tracks and railcars.",
    credit: "Quantum Prophet AI / Pexels",
    sourcePage: ""
  },
  {
    id: "ports-terminals",
    label: "Ports and terminals",
    descriptor: "Operational control across gates, yards and handoffs",
    theme: "Terminal operating transformation",
    summary: "Improve coordination across gates, yard activity, equipment, drayage, rail interfaces and high-volume operating exceptions.",
    capabilities: ["Gate and yard flow", "Equipment visibility", "Handoff control"],
    icon: "port",
    poster: "assets/audiences/ports-terminals.jpg",
    objectPosition: "68% center",
    mediaAlt: "An aerial view of a large container terminal and its organized operating lanes.",
    credit: "Giant Asparagus / Pexels",
    sourcePage: "https://www.pexels.com/photo/aerial-view-of-shipping-containers-at-port-terminal-35627339/"
  },
  {
    id: "industrial-shippers",
    label: "Industrial shippers",
    descriptor: "Cost containment, sourcing strategy and AI-assisted procurement",
    theme: "Commercial and operating transformation",
    summary: "Contain freight cost, strengthen carrier sourcing and use AI to improve procurement, routing and transportation decisions.",
    capabilities: ["Freight-cost containment", "Procurement strategy", "AI-assisted sourcing"],
    icon: "factory",
    poster: "assets/audiences/industrial-shippers.jpg",
    objectPosition: "66% center",
    mediaAlt: "A freight vehicle moving through an industrial loading and shipping facility.",
    credit: "Juan R. Real / Pexels",
    sourcePage: "https://www.pexels.com/photo/warehouse-with-delivery-truck-exiting-the-loading-dock-29786116/"
  }
];

const audienceIconPaths = {
  truck: '<path d="M3 6h11v10H3zM14 9h4l3 4v3h-7zM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>',
  broker: '<circle cx="6" cy="8" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M3 18c.5-3 2-4.5 4.5-4.5S11.5 15 12 18M12 18c.5-3 2-4.5 4.5-4.5S20.5 15 21 18M9 9.5h6"/>',
  warehouse: '<path d="M3 10 12 4l9 6v10H3zM7 20v-6h10v6M7 10h.01M12 10h.01M17 10h.01"/>',
  network: '<circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="18" r="2.2"/><circle cx="19" cy="18" r="2.2"/><path d="m10.9 6.9-4.8 9M13.1 6.9l4.8 9M7.2 18h9.6"/>',
  "container-truck": '<path d="M2.5 7h11v9h-11zM5.5 10h5M13.5 10h4l3 3.2V16h-7zM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>',
  intermodal: '<path d="M5 4h14v9H5zM8 7h8M4 17h16M7 13v4M17 13v4M7 20h.01M17 20h.01"/>',
  shortline: '<path d="M7 4h10l2 5v7H5V9zM8 9h8M8 13h.01M16 13h.01M7 20l3-4M17 20l-3-4M5 20h14"/>',
  regional: '<path d="M6 3h12v12H6zM9 6h6M9 10h.01M15 10h.01M8 19l2-4M16 19l-2-4M5 21h14"/>',
  port: '<path d="M4 20V5h11M7 8h10l3 4M15 5v15M11 12h4M9 12v5h4M3 20h18"/>',
  factory: '<path d="M3 20V9l6 3V8l6 4V5h6v15zM7 16h.01M12 16h.01M17 16h.01"/>'
};

const audienceRoot = document.querySelector("[data-audiences]");
if (audienceRoot) {
  const preview = audienceRoot.querySelector("#audience-preview-panel");
  const selector = audienceRoot.querySelector("[data-audience-tabs]");
  const previewContent = audienceRoot.querySelector("[data-audience-content]");
  const previewTitle = audienceRoot.querySelector("[data-audience-title]");
  const previewTheme = audienceRoot.querySelector("[data-audience-theme]");
  const previewSummary = audienceRoot.querySelector("[data-audience-summary]");
  const previewCapabilities = audienceRoot.querySelector("[data-audience-capabilities]");
  const mediaAlt = audienceRoot.querySelector("[data-audience-media-alt]");
  const status = audienceRoot.querySelector("[data-audience-status]");
  const mediaLayers = [
    audienceRoot.querySelector("[data-audience-media-current]"),
    audienceRoot.querySelector("[data-audience-media-next]")
  ];
  let activeAudienceId = "brokers";
  let activeMediaIndex = 0;
  let mediaRequest = 0;
  let hoverTimer;
  let resizeFrame;

  const audienceIcon = (name) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true">${audienceIconPaths[name] || audienceIconPaths.network}</svg>`;

  selector.innerHTML = audienceSegments.map((segment) => `
    <button class="audience-tab" type="button" role="tab"
      id="audience-tab-${segment.id}" aria-controls="audience-preview-panel"
      aria-selected="${String(segment.id === activeAudienceId)}"
      tabindex="${segment.id === activeAudienceId ? "0" : "-1"}"
      data-audience-id="${segment.id}">
      <span class="audience-tab__icon">${audienceIcon(segment.icon)}</span>
      <span class="audience-tab__name">${segment.label}</span>
      <span class="audience-tab__descriptor">${segment.descriptor}</span>
    </button>`).join("");

  const audienceTabs = [...selector.querySelectorAll("[data-audience-id]")];

  const updateAudienceConnector = () => {
    const activeTab = selector.querySelector('[aria-selected="true"]');
    if (!activeTab) return;
    const rootBounds = audienceRoot.getBoundingClientRect();
    const tabBounds = activeTab.getBoundingClientRect();
    audienceRoot.style.setProperty("--active-segment-x", `${tabBounds.left - rootBounds.left + tabBounds.width / 2}px`);
  };

  const renderAudienceContent = (segment) => {
    previewTitle.textContent = segment.label;
    previewTheme.textContent = segment.theme;
    previewSummary.textContent = segment.summary;
    previewCapabilities.innerHTML = segment.capabilities
      .map((capability) => `<span class="capability-chip"><i aria-hidden="true"></i>${capability}</span>`)
      .join("");
    mediaAlt.textContent = segment.mediaAlt;
    preview.setAttribute("aria-labelledby", `audience-tab-${segment.id}`);
  };

  const setActiveAudience = (id, announce = true) => {
    const segment = audienceSegments.find((item) => item.id === id);
    if (!segment) return;

    activeAudienceId = id;
    audienceTabs.forEach((tab) => {
      const selected = tab.dataset.audienceId === id;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    updateAudienceConnector();

    const requestId = ++mediaRequest;
    const preload = new Image();
    preload.src = segment.poster;
    const commit = () => {
      if (requestId !== mediaRequest) return;
      const nextMediaIndex = activeMediaIndex === 0 ? 1 : 0;
      const currentMedia = mediaLayers[activeMediaIndex];
      const nextMedia = mediaLayers[nextMediaIndex];
      nextMedia.src = segment.poster;
      nextMedia.style.objectPosition = segment.objectPosition;

      previewContent.classList.add("is-updating");
      window.setTimeout(() => {
        if (requestId !== mediaRequest) return;
        renderAudienceContent(segment);
        nextMedia.classList.add("is-active");
        currentMedia.classList.remove("is-active");
        previewContent.classList.remove("is-updating");
        activeMediaIndex = nextMediaIndex;
        if (announce) status.textContent = `${segment.label} preview selected.`;
      }, reducedMotion ? 0 : 150);
    };
    if (preload.complete) commit();
    else {
      preload.addEventListener("load", commit, { once: true });
      preload.addEventListener("error", commit, { once: true });
    }
  };

  audienceTabs.forEach((tab, index) => {
    tab.addEventListener("pointerenter", () => {
      if (!window.matchMedia("(hover: hover)").matches) return;
      window.clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => setActiveAudience(tab.dataset.audienceId, false), 90);
    });
    tab.addEventListener("pointerleave", () => window.clearTimeout(hoverTimer));
    tab.addEventListener("focus", () => setActiveAudience(tab.dataset.audienceId, false));
    tab.addEventListener("click", () => setActiveAudience(tab.dataset.audienceId));
    tab.addEventListener("keydown", (event) => {
      let nextIndex = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % audienceTabs.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + audienceTabs.length) % audienceTabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = audienceTabs.length - 1;
      else return;
      event.preventDefault();
      audienceTabs[nextIndex].focus();
    });
  });

  mediaLayers.forEach((media) => {
    media.style.objectPosition = audienceSegments.find((segment) => segment.id === activeAudienceId).objectPosition;
  });
  updateAudienceConnector();
  document.fonts?.ready.then(updateAudienceConnector);
  window.addEventListener("resize", () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(updateAudienceConnector);
  }, { passive: true });
}

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-archive-category]").forEach((item) => {
      item.hidden = category !== "all" && item.dataset.archiveCategory !== category;
    });
  });
});

const videoTarget = document.querySelector('[data-render="videos"]');
if (videoTarget && content.videos) {
  videoTarget.innerHTML = content.videos.map((item) => `
    <article class="video-card">
      <div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${item.youtubeId}" title="${item.title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>
      <div class="video-copy"><h3>${item.title}</h3><p>${item.description}</p>${externalLink(item.url, "Watch on YouTube")}</div>
    </article>`).join("");
}

const sourceTarget = document.querySelector('[data-render="market-sources"]');
if (sourceTarget && content.marketSources) {
  sourceTarget.innerHTML = content.marketSources.map((item) => `<li>${externalLink(item.url, item.name)}</li>`).join("");
}

const contactForm = document.querySelector(".contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = contactForm.querySelector(".form-status");
    if (status) {
      status.textContent = "This private review site does not send submissions yet. Form delivery will be connected before public launch.";
      status.setAttribute("tabindex", "-1");
      status.focus();
    }
  });
}
