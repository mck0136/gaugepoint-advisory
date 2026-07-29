(() => {
const processContent = {
  order: {
    label: "Order received",
    time: "14:18:02",
    title: "Information arrives faster than the operation can structure it.",
    copy: "People become the integration layer between tenders, emails, calls, and customer requirements.",
    oneLabel: "Source",
    one: "Customer inbox",
    twoLabel: "Owner",
    two: "Customer service",
    status: "Received"
  },
  plan: {
    label: "Plan load",
    time: "+03:14",
    title: "The same work is handled differently by person, branch, or customer.",
    copy: "Process variation creates rework, weakens measurement, and makes an automated recommendation harder to trust.",
    oneLabel: "Source",
    one: "Planning sheet",
    twoLabel: "Owner",
    two: "Local planner",
    status: "Planned"
  },
  move: {
    label: "Dispatch / move",
    time: "+09:42",
    title: "Critical information exists, but it does not move with the decision.",
    copy: "Disconnected systems force teams to search, re-key, interpret, and reconcile before they can act.",
    oneLabel: "Source",
    one: "TMS status",
    twoLabel: "Owner",
    two: "Dispatch",
    status: "In transit"
  },
  exception: {
    label: "Exception detected",
    time: "14:32:08",
    title: "Ownership becomes unclear when the standard process breaks.",
    copy: "A missing appointment and a waiting driver expose the absence of explicit decision rights and escalation rules.",
    oneLabel: "Process",
    one: "Standard flow broken",
    twoLabel: "Owner",
    two: "No explicit owner",
    status: "Manual intervention"
  },
  close: {
    label: "Resolve / close",
    time: "+27:06",
    title: "AI does not fix a fragmented operation. It accelerates it.",
    copy: "Readiness begins by making the work visible, measurable, connected, and accountable.",
    oneLabel: "Future state",
    one: "Owner assigned",
    twoLabel: "Control",
    two: "Escalation rule",
    status: "Evidence retained"
  }
};

const processRoot = document.querySelector("[data-mf-process]");
if (processRoot) {
  const processButtons = [...processRoot.querySelectorAll("[data-process-key]")];
  const processFields = {
    label: processRoot.querySelector("[data-process-label]"),
    time: processRoot.querySelector("[data-process-time]"),
    title: processRoot.querySelector("[data-process-title]"),
    copy: processRoot.querySelector("[data-process-copy]"),
    oneLabel: processRoot.querySelector("[data-process-meta-one-label]"),
    one: processRoot.querySelector("[data-process-meta-one]"),
    twoLabel: processRoot.querySelector("[data-process-meta-two-label]"),
    two: processRoot.querySelector("[data-process-meta-two]"),
    status: processRoot.querySelector("[data-process-status]")
  };

  const selectProcessStep = (key) => {
    const next = processContent[key];
    if (!next) return;
    processButtons.forEach((button) => {
      const selected = button.dataset.processKey === key;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    Object.entries(processFields).forEach(([field, node]) => {
      if (node) node.textContent = next[field];
    });
  };

  processButtons.forEach((button) => {
    button.addEventListener("click", () => selectProcessStep(button.dataset.processKey));
  });
}

const readinessRoot = document.querySelector("[data-mf-readiness]");
if (readinessRoot) {
  const readinessItems = [...readinessRoot.querySelectorAll(".mf-readiness-item")];
  readinessItems.forEach((item) => {
    const button = item.querySelector("button");
    button?.addEventListener("click", () => {
      const wasActive = item.classList.contains("is-active");
      readinessItems.forEach((candidate) => {
        candidate.classList.remove("is-active");
        candidate.querySelector("button")?.setAttribute("aria-expanded", "false");
      });
      if (!wasActive) {
        item.classList.add("is-active");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });
}

const osRoot = document.querySelector("[data-mf-os]");
if (osRoot) {
  const osButtons = [...osRoot.querySelectorAll("[data-os-key]")];
  const osPanels = [...osRoot.querySelectorAll("[data-os-panel]")];
  const osKeys = osButtons.map((button) => button.dataset.osKey);
  let activeOsIndex = 0;

  const selectOsPanel = (key, focus = false) => {
    activeOsIndex = osKeys.indexOf(key);
    osButtons.forEach((button) => {
      const selected = button.dataset.osKey === key;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    });
    osPanels.forEach((panel) => {
      const selected = panel.dataset.osPanel === key;
      panel.classList.toggle("is-active", selected);
      panel.hidden = !selected;
    });
  };

  osButtons.forEach((button) => {
    button.addEventListener("click", () => selectOsPanel(button.dataset.osKey));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (activeOsIndex + direction + osKeys.length) % osKeys.length;
      selectOsPanel(osKeys[nextIndex], true);
    });
  });

  let touchStartX = null;
  osRoot.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0]?.clientX ?? null;
  }, { passive: true });
  osRoot.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
    touchStartX = null;
    if (Math.abs(delta) < 54) return;
    const direction = delta < 0 ? 1 : -1;
    const nextIndex = (activeOsIndex + direction + osKeys.length) % osKeys.length;
    selectOsPanel(osKeys[nextIndex]);
  }, { passive: true });
}

const comparisonRoot = document.querySelector("[data-mf-comparison]");
if (comparisonRoot) {
  const comparisonButtons = [...comparisonRoot.querySelectorAll("[data-comparison-key]")];
  const comparisonPanels = [...comparisonRoot.querySelectorAll("[data-comparison-panel]")];
  const desktopComparison = window.matchMedia("(min-width: 1024px)");
  let activeComparison = "fragmented";

  const selectComparison = (key) => {
    activeComparison = key;
    comparisonButtons.forEach((button) => {
      const selected = button.dataset.comparisonKey === key;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    comparisonPanels.forEach((panel) => {
      const selected = panel.dataset.comparisonPanel === key;
      panel.classList.toggle("is-active", selected);
      panel.setAttribute("aria-hidden", String(desktopComparison.matches ? false : !selected));
    });
  };

  comparisonButtons.forEach((button) => {
    button.addEventListener("click", () => selectComparison(button.dataset.comparisonKey));
  });
  desktopComparison.addEventListener("change", () => selectComparison(activeComparison));
  selectComparison(activeComparison);
}

const audienceData = {
  fleets: {
    label: "Fleets",
    theme: "AI-optimized operations",
    summary: "Improve asset utilization, network performance, dispatch flow, and exception control.",
    capabilities: ["Asset velocity", "Dispatch workflow", "Network performance"],
    image: "assets/audiences-mobile/fleets.jpg",
    imageLarge: "assets/audiences/fleets.jpg"
  },
  brokers: {
    label: "Brokers",
    theme: "AI-led operating leverage",
    summary: "Create operating leverage across pricing, carrier procurement, exception handling, and high-volume workflows.",
    capabilities: ["AI workflow design", "Pricing discipline", "Carrier procurement"],
    image: "assets/audiences-mobile/brokers.jpg",
    imageLarge: "assets/audiences/brokers.jpg"
  },
  "3pls": {
    label: "3PLs",
    theme: "Connected network execution",
    summary: "Connect visibility, customer requirements, carrier execution, and operating decisions across the network.",
    capabilities: ["Network design", "Customer workflows", "Exception ownership"],
    image: "assets/audiences-mobile/3pls.jpg",
    imageLarge: "assets/audiences/3pls.jpg"
  },
  "4pls": {
    label: "4PLs",
    theme: "Orchestration at scale",
    summary: "Strengthen control-tower workflows, decision rights, and measurable coordination across partners.",
    capabilities: ["Control towers", "Partner orchestration", "Decision governance"],
    image: "assets/audiences-mobile/4pls.jpg",
    imageLarge: "assets/audiences/4pls.jpg"
  },
  drayage: {
    label: "Drayage",
    theme: "Faster operating handoffs",
    summary: "Improve dispatch flow, gate and yard coordination, appointment management, and driver communication.",
    capabilities: ["Dispatch flow", "Yard coordination", "Handoff control"],
    image: "assets/audiences-mobile/drayage.jpg",
    imageLarge: "assets/audiences/drayage.jpg"
  },
  intermodal: {
    label: "Intermodal",
    theme: "Connected modal decisions",
    summary: "Improve modal decisions, terminal connectivity, equipment visibility, and exception coordination.",
    capabilities: ["Modal decisions", "Terminal connectivity", "Equipment velocity"],
    image: "assets/audiences-mobile/drayage.jpg",
    imageLarge: "assets/audiences/drayage.jpg"
  },
  "shortline-railways": {
    label: "Shortline railways",
    theme: "Equipment velocity",
    summary: "Build precision operating workflows around interchange, customer service, assets, and local execution.",
    capabilities: ["Interchange flow", "Asset visibility", "Service design"],
    image: "assets/audiences-mobile/shortline-railways.jpg",
    imageLarge: "assets/audiences/shortline-railways.jpg"
  },
  "regional-railways": {
    label: "Regional railways",
    theme: "Network discipline",
    summary: "Strengthen network decisions, equipment velocity, service reliability, and management routines.",
    capabilities: ["Network discipline", "Service reliability", "Decision routines"],
    image: "assets/audiences-mobile/regional-railways.jpg",
    imageLarge: "assets/audiences/regional-railways.jpg"
  },
  "ports-terminals": {
    label: "Ports and terminals",
    theme: "Operational control",
    summary: "Connect gates, yards, assets, labour, and handoffs into clearer operating workflows.",
    capabilities: ["Gate events", "Yard visibility", "Handoff control"],
    image: "assets/audiences-mobile/ports-terminals.jpg",
    imageLarge: "assets/audiences/ports-terminals.jpg"
  },
  "industrial-shippers": {
    label: "Industrial shippers",
    theme: "Transportation control",
    summary: "Improve sourcing, transportation-cost control, status workflows, and AI-assisted procurement.",
    capabilities: ["Cost containment", "Sourcing strategy", "Procurement workflow"],
    image: "assets/audiences-mobile/industrial-shippers.jpg",
    imageLarge: "assets/audiences/industrial-shippers.jpg"
  }
};

const audienceRoot = document.querySelector("[data-mf-audiences]");
if (audienceRoot) {
  const select = audienceRoot.querySelector("[data-audience-select]");
  const buttonHost = audienceRoot.querySelector("[data-audience-buttons]");
  const image = audienceRoot.querySelector("[data-audience-image]");
  const theme = audienceRoot.querySelector("[data-audience-theme]");
  const title = audienceRoot.querySelector("[data-audience-title]");
  const summary = audienceRoot.querySelector("[data-audience-summary]");
  const capabilities = audienceRoot.querySelector("[data-audience-capabilities]");

  Object.entries(audienceData).forEach(([key, item]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.role = "tab";
    button.dataset.audienceKey = key;
    button.textContent = item.label;
    button.setAttribute("aria-selected", String(key === "fleets"));
    button.classList.toggle("is-active", key === "fleets");
    buttonHost?.appendChild(button);
  });

  const audienceButtons = [...audienceRoot.querySelectorAll("[data-audience-key]")];
  const selectAudience = (key) => {
    const item = audienceData[key];
    if (!item) return;
    if (select) select.value = key;
    audienceButtons.forEach((button) => {
      const selected = button.dataset.audienceKey === key;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    if (image) {
      image.src = item.image;
      image.srcset = `${item.image} 900w, ${item.imageLarge} 1800w`;
      image.alt = "";
    }
    if (theme) theme.textContent = item.theme;
    if (title) title.textContent = item.label;
    if (summary) summary.textContent = item.summary;
    if (capabilities) {
      capabilities.replaceChildren(...item.capabilities.map((capability) => {
        const itemNode = document.createElement("li");
        itemNode.textContent = capability;
        return itemNode;
      }));
    }
  };

  select?.addEventListener("change", () => selectAudience(select.value));
  audienceButtons.forEach((button) => {
    button.addEventListener("click", () => selectAudience(button.dataset.audienceKey));
  });
}

const observeVideo = document.querySelector("[data-mf-video]");
if (observeVideo) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const loadVideo = () => {
    const source = observeVideo.querySelector("source[data-src]");
    if (!source || source.src) return;
    source.src = source.dataset.src;
    observeVideo.load();
    observeVideo.play().catch(() => {});
  };

  if (!reducedMotion && "IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      loadVideo();
      observer.disconnect();
    }, { rootMargin: "300px 0px" });
    videoObserver.observe(observeVideo);
  }
}
})();
