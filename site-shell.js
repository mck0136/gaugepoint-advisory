(() => {
  const links = [
    ["AI readiness", "/ai-readiness/"],
    ["Expertise", "/#expertise"],
    ["Software platforms", "/ai-native-development/#software-demo"],
    ["AI in transportation", "/ai-in-transportation/"],
    ["Speaking & media", "/speaking-media/"],
    ["About", "/about/"]
  ];
  const homeLink = '<a href="/">Home</a>';
  const linkMarkup = links.map(([label, href]) => `<a href="${href}">${label}</a>`).join("");
  const contactLink = '<a class="gp-site-contact" href="/contact/">Talk with us</a>';
  const menuMarkup = `${homeLink}${linkMarkup}${contactLink}`;
  const headerMarkup = `
    <a class="gp-site-skip" href="#main-content">Skip to main content</a>
    <a class="gp-site-wordmark" href="/" aria-label="Gaugepoint Advisory home">GAUGEPOINT<span>ADVISORY</span></a>
    <nav class="gp-site-nav" aria-label="Primary navigation">${linkMarkup}${contactLink}</nav>
    <details class="gp-site-menu">
      <summary>Menu</summary>
      <nav class="gp-site-menu-panel" aria-label="Mobile navigation">${menuMarkup}</nav>
    </details>`;

  const installShell = () => {
    const main = document.querySelector("main");
    const isHome = Boolean(document.querySelector("body > main > .hero#top"));
    document.body.classList.toggle("gp-site-home-shell", isHome);
    document.body.classList.toggle("gp-site-inner-shell", Boolean(main) && !isHome);
    if (main && !main.id) main.id = "main-content";

    const headerTarget = document.querySelector("#site-header");
    const oldHeader = headerTarget || document.querySelector(".header, .gp-header, .site-header");
    if (oldHeader) {
      const header = document.createElement("header");
      header.className = "gp-site-header";
      header.innerHTML = headerMarkup;
      if (headerTarget) headerTarget.replaceChildren(header);
      else oldHeader.replaceWith(header);
    }

    const footerTarget = document.querySelector("#site-footer");
    const oldFooter = footerTarget || document.querySelector(".gp-footer, footer.site-footer, body > footer");
    if (oldFooter) {
      const footer = document.createElement("footer");
      footer.className = "gp-site-footer";
      footer.innerHTML = `
        <a class="gp-site-wordmark" href="/" aria-label="Gaugepoint Advisory home">GAUGEPOINT<span>ADVISORY</span></a>
        <p>AI readiness and operating transformation for transportation.</p>
        <small><a href="/assets/vendor/three/LICENSE.txt">Open-source notices</a> · © ${new Date().getFullYear()} Gaugepoint. All rights reserved.</small>`;
      if (footerTarget) footerTarget.replaceChildren(footer);
      else oldFooter.replaceWith(footer);
    }

    const menu = document.querySelector(".gp-site-menu");
    menu?.addEventListener("click", (event) => {
      if (event.target.closest("a")) menu.open = false;
    });
    document.addEventListener("click", (event) => {
      if (menu?.open && !menu.contains(event.target)) menu.open = false;
    });
    menu?.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.open) {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      }
    });


  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installShell, { once: true });
  } else {
    installShell();
  }
})();
