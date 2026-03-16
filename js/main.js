/* ════════════════════════════════════════════════
   QuVaultX-PC — Main JS  (v3 · Three.js edition)
   Loader · Cursor · Nav · Chapter reveals · Glitch
════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── LOADER ── */
  const loader     = document.getElementById("loader");
  const loaderFill = document.getElementById("loaderFill");
  let progress = 0;
  const loadInterval = setInterval(() => {
    progress += Math.random() * 18 + 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(loadInterval);
      setTimeout(() => loader && loader.classList.add("done"), 500);
    }
    if (loaderFill) loaderFill.style.width = progress + "%";
  }, 120);

  /* ── CUSTOM CURSOR ── */
  const cursorDot  = document.getElementById("cursorDot");
  const cursorRing = document.getElementById("cursorRing");
  let mouseX = -200, mouseY = -200;
  let ringX  = -200, ringY  = -200;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    if (cursorDot) { cursorDot.style.left = mouseX + "px"; cursorDot.style.top = mouseY + "px"; }
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    if (cursorRing) { cursorRing.style.left = ringX + "px"; cursorRing.style.top = ringY + "px"; }
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll("a, button, .pillar-card, .chapter-inner").forEach((el) => {
    el.addEventListener("mouseenter", () => cursorRing && cursorRing.classList.add("hovered"));
    el.addEventListener("mouseleave", () => cursorRing && cursorRing.classList.remove("hovered"));
  });

  /* ── NAV SCROLL ── */
  const nav = document.getElementById("nav");
  window.addEventListener("scroll", () => {
    nav && nav.classList.toggle("scrolled", window.scrollY > 60);
  }, { passive: true });

  /* ── MOBILE BURGER ── */
  const navBurger = document.getElementById("navBurger");
  const mobileNav = document.getElementById("mobileNav");
  if (navBurger) navBurger.addEventListener("click", () => mobileNav && mobileNav.classList.toggle("open"));
  document.querySelectorAll(".mob-link").forEach((l) => l.addEventListener("click", () => mobileNav && mobileNav.classList.remove("open")));

  /* ── SCROLL HINT HIDE ── */
  const scrollHint = document.getElementById("scrollHint");
  window.addEventListener("scroll", () => {
    if (scrollHint) scrollHint.style.opacity = window.scrollY > 80 ? "0" : "1";
  }, { passive: true });

  /* ── HERO TITLE TYPEWRITER ── */
  const heroSub = document.getElementById("heroSubTitle");
  if (heroSub) {
    const text = heroSub.textContent;
    heroSub.textContent = "";
    let i = 0;
    setTimeout(() => {
      const iv = setInterval(() => {
        heroSub.textContent += text[i++];
        if (i >= text.length) clearInterval(iv);
      }, 55);
    }, 1200);
  }

  /* ── CHAPTER INTERSECTION REVEALS ── */
  const chapterInners = document.querySelectorAll(".chapter-inner");
  const chapterObs = new IntersectionObserver(
    (entries) => { entries.forEach((e) => e.target.classList.toggle("visible", e.isIntersecting)); },
    { threshold: 0.25 }
  );
  chapterInners.forEach((el) => chapterObs.observe(el));

  /* ── INTERSECTION OBSERVER FOR REVEAL CARDS ── */
  const revealEls = document.querySelectorAll(
    ".pillar-card, .cg-item, .rt-item, .contact-card, .wp-card, .cryp-node"
  );
  revealEls.forEach((el) => {
    el.style.opacity = "0"; el.style.transform = "translateY(28px)";
    el.style.transition = "opacity 0.65s ease, transform 0.65s ease";
  });
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.style.opacity = "1"; e.target.style.transform = "translateY(0)"; }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => revealObs.observe(el));

  /* ── STAGGERED DELAYS ── */
  document.querySelectorAll(".pillars-grid, .cryp-guarantees, .contact-grid").forEach((grid) => {
    Array.from(grid.children).forEach((child, i) => { child.style.transitionDelay = `${i * 0.08}s`; });
  });

  /* ── GLITCH on nav logo ── */
  const navLogo = document.querySelector(".nav-logo-text");
  if (navLogo) {
    setInterval(() => {
      if (Math.random() > 0.93) {
        navLogo.style.textShadow = "2px 0 var(--accent-pink), -2px 0 var(--accent-cyan)";
        navLogo.style.transform  = "skewX(-2deg)";
        setTimeout(() => { navLogo.style.textShadow = ""; navLogo.style.transform = ""; }, 90);
      }
    }, 2200);
  }

  /* ── ACTIVE NAV HIGHLIGHT ── */
  const navLinks = document.querySelectorAll(".nav-links a");
  const sections = document.querySelectorAll("section[id]");
  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach((s) => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
    navLinks.forEach((l) => { l.style.color = l.getAttribute("href") === `#${current}` ? "var(--accent-cyan)" : ""; });
  }, { passive: true });

})();
