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
  `<a class="text-link external-link" href="${url}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true"> ↗</span></a>`;

const headerTarget = document.querySelector("#site-header");
if (headerTarget) {
  const navLinks = navigation.map(([key, label, href]) => {
    const current = currentPage === key ? ' aria-current="page"' : "";
    return `<a href="${pageUrl(href)}"${current}>${label}</a>`;
  }).join("");

  headerTarget.innerHTML = `
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

const footerTarget = document.querySelector("#site-footer");
if (footerTarget) {
  footerTarget.innerHTML = `
    <footer class="site-footer">
      <div class="container footer-grid">
        <a href="${pageUrl()}" aria-label="Gaugepoint Advisory home">
          <img src="${pageUrl("assets/gaugepoint-advisory.png")}" alt="Gaugepoint Advisory">
        </a>
        <div>
          <p>AI readiness and operating transformation for transportation.</p>
          <a class="text-link" href="${pageUrl("contact/")}">Start a Conversation</a>
        </div>
        <p class="small">© <span id="year">${new Date().getFullYear()}</span> Gaugepoint. All rights reserved.</p>
      </div>
    </footer>`;
}

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector("#site-nav");
if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const open = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  siteNav.addEventListener("click", () => {
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
}

const caseStudyTarget = document.querySelector('[data-render="case-studies"]');
if (caseStudyTarget && content.caseStudies) {
  caseStudyTarget.innerHTML = content.caseStudies.map((item) => `
    <article class="source-card">
      <div class="card-meta"><span>${item.category}</span><span>${item.publicationDate}</span></div>
      <p class="company-name">${item.company}</p>
      <h3>${item.headline}</h3>
      <p>${item.summary}</p>
      <p class="reported-result">${item.resultMetric}</p>
      ${externalLink(item.url, `Read the external source: ${item.sourceName}`)}
      <p class="disclaimer">${item.disclaimer}</p>
    </article>`).join("");
}

const webinarTarget = document.querySelector('[data-render="webinars"]');
if (webinarTarget && content.webinars) {
  webinarTarget.innerHTML = content.webinars.map((item) => `
    <article class="media-card">
      <p class="card-date">${item.date}</p>
      <h3>${item.title}</h3>
      <ul class="compact-list">${item.topics.map((topic) => `<li>${topic}</li>`).join("")}</ul>
      <div class="link-row">
        ${externalLink(item.listingUrl, "View public IANA listing")}
        ${externalLink(item.memberUrl, "Open member session")}
      </div>
      <p class="disclaimer">Presented through IANA. Membership or login may be required to view the full session.</p>
    </article>`).join("");
}

const videoTarget = document.querySelector('[data-render="videos"]');
if (videoTarget && content.videos) {
  videoTarget.innerHTML = content.videos.map((item) => `
    <article class="video-card">
      <div class="video-frame">
        <iframe src="https://www.youtube-nocookie.com/embed/${item.youtubeId}" title="${item.title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
      </div>
      <div class="video-copy">
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        ${externalLink(item.url, "Watch on YouTube")}
      </div>
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
            <h3>${item.title}</h3>
            <p>${item.summary}</p>
            ${item.href ? `<a class="text-link" href="${item.href}">Read the market perspective</a>` : `<span class="coming-soon">In development</span>`}
          </article>`).join("")}
      </div>
    </section>`).join("");
}

const sourceTarget = document.querySelector('[data-render="market-sources"]');
if (sourceTarget && content.marketSources) {
  sourceTarget.innerHTML = content.marketSources.map((item) =>
    `<li>${externalLink(item.url, item.name)}</li>`).join("");
}

const contactForm = document.querySelector(".contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = contactForm.querySelector(".form-status");
    if (status) {
      status.textContent = "This private review site does not send submissions yet. Form delivery will be connected before public launch.";
      status.focus();
    }
  });
}
