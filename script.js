const body = document.body;
const root = body.dataset.root || "";
const currentPage = body.dataset.page || "home";
const content = window.GAUGEPOINT_CONTENT || {};

const navigation = [
  ["ai-readiness", "AI Readiness", "ai-readiness/"],
  ["operating-transformation", "Operating Transformation", "operating-transformation/"],
  ["ai-in-transportation", "AI in Transportation", "ai-in-transportation/"],
  ["insights", "Insights", "insights/"],
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
        <img src="${pageUrl("assets/gaugepoint-advisory.png")}" alt="Gaugepoint Advisory">
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
          <img src="${pageUrl("assets/gaugepoint-advisory.png")}" alt="Gaugepoint Advisory">
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

const workflowSteps = [...document.querySelectorAll("[data-workflow-step]")];
const workflowMap = document.querySelector(".workflow-map");
if (workflowSteps.length && workflowMap) {
  const progressByStep = { order: "8%", plan: "28%", move: "49%", exception: "70%", close: "94%" };
  const setWorkflowStep = (step) => {
    const key = step.dataset.workflowStep;
    workflowSteps.forEach((item) => item.classList.toggle("is-current", item === step));
    document.querySelectorAll(".workflow-node").forEach((node) => {
      node.classList.toggle("is-active", node.classList.contains(`node-${key}`));
    });
    workflowMap.style.setProperty("--workflow-progress", progressByStep[key]);
  };
  setWorkflowStep(workflowSteps[0]);
  const workflowObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setWorkflowStep(visible.target);
  }, { threshold: [0.35, 0.55, 0.75] });
  workflowSteps.forEach((step) => workflowObserver.observe(step));
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

document.querySelectorAll("[data-readiness]").forEach((node) => {
  node.addEventListener("click", () => {
    const key = node.dataset.readiness;
    const detail = readinessContent[key];
    document.querySelectorAll("[data-readiness]").forEach((item) => item.classList.toggle("is-active", item === node));
    document.querySelector("[data-readiness-label]").textContent = detail[0];
    document.querySelector("[data-readiness-title]").textContent = detail[1];
    document.querySelector("[data-readiness-copy]").textContent = detail[2];
  });
});

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
        <p>${item.role}</p>
        <ul class="compact-list">${item.topics.map((topic) => `<li>${topic}</li>`).join("")}</ul>
        <div class="link-row">${externalLink(item.listingUrl, "View public listing")}${externalLink(item.memberUrl, "Open member session")}</div>
        <p class="disclaimer">Presented through IANA. Membership or login may be required for the full session.</p>
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

const insightsTarget = document.querySelector('[data-render="insights"]');
if (insightsTarget && content.articles) {
  const categories = ["AI in Transportation", "Operating Transformation", "Freight Market"];
  insightsTarget.innerHTML = categories.map((category) => `
    <section class="insight-group" aria-labelledby="${category.toLowerCase().replaceAll(" ", "-")}">
      <p class="eyebrow">${category}</p>
      <h2 id="${category.toLowerCase().replaceAll(" ", "-")}">${category}</h2>
      <div class="article-grid">
        ${content.articles.filter((item) => item.category === category).map((item) => `
          <article class="article-card">
            <div class="card-meta"><span>${item.category}</span><span>${item.status}</span></div>
            <h3>${item.title}</h3><p>${item.summary}</p>
            ${item.href ? `<a class="text-link" href="${item.href}">Read the perspective</a>` : `<span class="disclaimer">In development</span>`}
          </article>`).join("")}
      </div>
    </section>`).join("");
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
