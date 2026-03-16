/* ════════════════════════════════════════════════
   QuVaultX-PC — Main JS  v4
   Loader · Cursor · Nav · Chapter switcher · Glitch
════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ── LOADER ── */
  const loader     = document.getElementById("loader");
  const loaderFill = document.getElementById("loaderFill");
  let progress = 0;
  const loadInterval = setInterval(() => {
    progress += Math.random() * 16 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(loadInterval);
      setTimeout(() => loader && loader.classList.add("done"), 500);
    }
    if (loaderFill) loaderFill.style.width = progress + "%";
  }, 100);

  /* ── CUSTOM CURSOR ── */
  const cursorDot  = document.getElementById("cursorDot");
  const cursorRing = document.getElementById("cursorRing");
  let mouseX = -200, mouseY = -200, ringX = -200, ringY = -200;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    if (cursorDot) { cursorDot.style.left = mouseX+"px"; cursorDot.style.top = mouseY+"px"; }
  });
  (function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    if (cursorRing) { cursorRing.style.left = ringX+"px"; cursorRing.style.top = ringY+"px"; }
    requestAnimationFrame(animateRing);
  })();

  document.querySelectorAll("a,button,.pillar-card,.chapter-inner").forEach(el => {
    el.addEventListener("mouseenter", () => cursorRing && cursorRing.classList.add("hovered"));
    el.addEventListener("mouseleave", () => cursorRing && cursorRing.classList.remove("hovered"));
  });

  /* ── NAV ── */
  const nav = document.getElementById("nav");
  window.addEventListener("scroll", () => nav && nav.classList.toggle("scrolled", window.scrollY > 60), { passive:true });

  const navBurger = document.getElementById("navBurger");
  const mobileNav = document.getElementById("mobileNav");
  if (navBurger) navBurger.addEventListener("click", () => mobileNav && mobileNav.classList.toggle("open"));
  document.querySelectorAll(".mob-link").forEach(l => l.addEventListener("click", () => mobileNav && mobileNav.classList.remove("open")));

  /* ── SCROLL HINT ── */
  const scrollHint = document.getElementById("scrollHint");
  window.addEventListener("scroll", () => {
    if (scrollHint) scrollHint.style.opacity = window.scrollY > 80 ? "0" : "1";
  }, { passive:true });

  /* ── TYPEWRITER ── */
  const heroSub = document.getElementById("heroSubTitle");
  if (heroSub) {
    const txt = heroSub.textContent; heroSub.textContent = ""; let i = 0;
    setTimeout(() => {
      const iv = setInterval(() => { heroSub.textContent += txt[i++]; if(i>=txt.length) clearInterval(iv); }, 55);
    }, 1200);
  }

  /* ── CHAPTER SCROLL SWITCHER ──
     The explode section is 600vh.
     We divide it into 6 equal chunks — one per chapter.
     On scroll we compute which chunk is active and show that chapter panel.
  ── */
  const explodeSection = document.getElementById("explodeSection");
  const chapters       = Array.from(document.querySelectorAll(".chapter"));
  const NUM_CHAPTERS   = chapters.length;

  function updateChapters() {
    if (!explodeSection || chapters.length === 0) return;
    const rect   = explodeSection.getBoundingClientRect();
    const total  = explodeSection.offsetHeight - window.innerHeight;
    const scrolled = Math.max(0, -rect.top);
    const progress = Math.min(1, scrolled / total);
    const active = Math.min(NUM_CHAPTERS - 1, Math.floor(progress * NUM_CHAPTERS));

    chapters.forEach((ch, i) => {
      const isActive = (i === active);
      ch.classList.toggle("ch-active", isActive);
      const inner = ch.querySelector(".chapter-inner");
      if (inner) {
        // Slight stagger: become visible 80ms after chapter activates
        if (isActive) {
          setTimeout(() => inner.classList.add("visible"), 80);
        } else {
          inner.classList.remove("visible");
        }
      }
    });
  }

  window.addEventListener("scroll", updateChapters, { passive:true });
  updateChapters(); // run once on load

  /* ── CARD REVEALS (sections below explode) ── */
  document.querySelectorAll(".pillar-card,.cg-item,.rt-item,.contact-card,.wp-card,.cryp-node").forEach(el => {
    el.style.cssText += "opacity:0;transform:translateY(28px);transition:opacity 0.65s ease,transform 0.65s ease;";
  });
  new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.opacity="1"; e.target.style.transform="translateY(0)"; }
    });
  }, { threshold:0.12 }).observe
  // observe all at once
  ; // fix: use forEach
  document.querySelectorAll(".pillar-card,.cg-item,.rt-item,.contact-card,.wp-card,.cryp-node").forEach(el => {
    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.style.opacity="1"; e.target.style.transform="translateY(0)"; }
      });
    }, { threshold:0.12 }).observe(el);
  });

  /* ── STAGGER DELAYS ── */
  document.querySelectorAll(".pillars-grid,.cryp-guarantees,.contact-grid").forEach(grid => {
    Array.from(grid.children).forEach((child,i) => { child.style.transitionDelay = i*0.08+"s"; });
  });

  /* ── LOGO GLITCH ── */
  const navLogo = document.querySelector(".nav-logo-text");
  if (navLogo) {
    setInterval(() => {
      if (Math.random() > 0.93) {
        navLogo.style.textShadow = "2px 0 #f72585,-2px 0 #00f5d4";
        navLogo.style.transform  = "skewX(-2deg)";
        setTimeout(() => { navLogo.style.textShadow=""; navLogo.style.transform=""; }, 90);
      }
    }, 2000);
  }

  /* ── ACTIVE NAV ── */
  const navLinks = document.querySelectorAll(".nav-links a");
  const sections = document.querySelectorAll("section[id]");
  window.addEventListener("scroll", () => {
    let cur = "";
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) cur = s.id; });
    navLinks.forEach(l => { l.style.color = l.getAttribute("href")===`#${cur}` ? "var(--accent-cyan)" : ""; });
  }, { passive:true });

})();
