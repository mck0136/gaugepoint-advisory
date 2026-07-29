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
  strategy: ["Strategy", "A defined business problem comes first.", "Clarify the operating outcome, executive ownership, and evidence that will define success before selecting a tool."],
  workflows: ["Workflows", "Make the real work visible.", "Map decisions, handoffs, exceptions, delay, rework, and the people who own the workflow."],
  data: ["Data", "Trust depends on more than cleanliness.", "Assess quality, access, timeliness, ownership, baselines, and how AI output will be verified."],
  systems: ["Systems", "The workflow must move across the technology.", "Understand the TMS and workflow environment, integration paths, permissions, and write-back requirements."],
  people: ["People", "Adoption changes roles and routines.", "Design the skills, capacity, training, and stakeholder involvement required to use the capability well."],
  governance: ["Governance", "Authority must remain explicit.", "Define approvals, risk controls, permissions, audit trails, escalation paths, and accountability for outcomes."],
  economics: ["Economics", "A use case needs a measurable reason to exist.", "Connect labour, cycle time, service, error, and margin to a credible investment and measurement case."]
};

let readinessTimer;
document.querySelectorAll("[data-readiness]").forEach((node) => {
  node.addEventListener("click", () => {
    const key = node.dataset.readiness;
    const detail = readinessContent[key];
    const detailCard = document.querySelector(".readiness-detail");
    document.querySelectorAll("[data-readiness]").forEach((item) => {
      const active = item === node;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-connector]").forEach((connector) => {
      connector.classList.toggle("is-active", connector.dataset.connector === key);
    });
    const updateDetail = () => {
      document.querySelector("[data-readiness-label]").textContent = detail[0];
      document.querySelector("[data-readiness-title]").textContent = detail[1];
      document.querySelector("[data-readiness-copy]").textContent = detail[2];
      detailCard?.classList.remove("is-updating");
    };
    window.clearTimeout(readinessTimer);
    detailCard?.classList.add("is-updating");
    if (reducedMotion) updateDetail();
    else readinessTimer = window.setTimeout(updateDetail, 150);
  });
});
document.querySelector('[data-readiness="strategy"]')?.setAttribute("aria-pressed", "true");
document.querySelector('[data-connector="strategy"]')?.classList.add("is-active");

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
