/* ════════════════════════════════════════════════
   QuVaultX-PC — Main JS
   Loader · Cursor · Particles · Scrollytelling · Intersection Observer
════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── LOADER ── */
  const loader = document.getElementById("loader");
  const loaderFill = document.getElementById("loaderFill");
  let progress = 0;
  const loadInterval = setInterval(() => {
    progress += Math.random() * 18 + 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(loadInterval);
      setTimeout(() => loader.classList.add("done"), 400);
    }
    loaderFill.style.width = progress + "%";
  }, 120);

  /* ── CUSTOM CURSOR ── */
  const cursorDot = document.getElementById("cursorDot");
  const cursorRing = document.getElementById("cursorRing");
  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + "px";
    cursorDot.style.top = mouseY + "px";
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorRing.style.left = ringX + "px";
    cursorRing.style.top = ringY + "px";
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll("a, button, .pillar-card, .cryp-node").forEach((el) => {
    el.addEventListener("mouseenter", () => cursorRing.classList.add("hovered"));
    el.addEventListener("mouseleave", () => cursorRing.classList.remove("hovered"));
  });

  /* ── NAV SCROLL ── */
  const nav = document.getElementById("nav");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 60);
  });

  /* ── MOBILE BURGER ── */
  const navBurger = document.getElementById("navBurger");
  const mobileNav = document.getElementById("mobileNav");
  navBurger.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
  });
  document.querySelectorAll(".mob-link").forEach((l) => {
    l.addEventListener("click", () => mobileNav.classList.remove("open"));
  });

  /* ── PARTICLE CANVAS ── */
  const canvas = document.getElementById("particleCanvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  let particles = [];

  function resizeCanvas() {
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.alpha = Math.random() * 0.6 + 0.1;
      this.size = Math.random() * 2 + 0.5;
      this.color = Math.random() > 0.5 ? "#00f5d4" : "#7209b7";
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function initParticles() {
    if (!canvas) return;
    resizeCanvas();
    particles = Array.from({ length: 80 }, () => new Particle());
  }

  function animateParticles() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / 80) * 0.15;
          ctx.strokeStyle = "#00f5d4";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    particles.forEach((p) => { p.update(); p.draw(); });
    requestAnimationFrame(animateParticles);
  }

  initParticles();
  animateParticles();
  window.addEventListener("resize", () => { resizeCanvas(); particles.forEach((p) => p.reset()); });

  /* ── CHIP PARALLAX ON MOUSE ── */
  const chipUniverse = document.getElementById("chipUniverse");
  const heroSection = document.getElementById("hero");
  if (chipUniverse) {
    heroSection.addEventListener("mousemove", (e) => {
      const rect = heroSection.getBoundingClientRect();
      const cx = rect.width / 2, cy = rect.height / 2;
      const dx = (e.clientX - rect.left - cx) / cx;
      const dy = (e.clientY - rect.top - cy) / cy;
      chipUniverse.style.transform = `translate(-20%, -50%) rotateY(${dx * 8}deg) rotateX(${-dy * 5}deg)`;
    });
    heroSection.addEventListener("mouseleave", () => {
      chipUniverse.style.transform = "translate(-20%, -50%) rotateY(0deg) rotateX(0deg)";
    });
  }

  /* ── SCROLL HINT HIDE ── */
  const scrollHint = document.getElementById("scrollHint");
  window.addEventListener("scroll", () => {
    if (scrollHint) scrollHint.style.opacity = window.scrollY > 80 ? "0" : "1";
  }, { passive: true });

  /* ══════════════════════════════════════
     SCROLLYTELLING — EXPLODE SECTION
  ══════════════════════════════════════ */
  const explodeSection = document.getElementById("explodeSection");
  const explodeSteps = document.querySelectorAll(".explode-step");
  const exLayers = [
    document.getElementById("exL5"),
    document.getElementById("exL4"),
    document.getElementById("exL3"),
    document.getElementById("exL2"),
    document.getElementById("exL1"),
  ];

  // Layer initial stacked positions (z-offset illusion)
  const layerOffsets = [0, 0, 0, 0, 0]; // base is flat

  function setLayerStyle(layer, index, progress) {
    if (!layer) return;
    // At progress 0 all layers overlap; as progress increases, they separate
    const separation = progress * 70; // px
    const yOffset = (index - 2) * separation;
    const scale = 1 - index * 0.04 * (1 - progress);
    layer.style.transform = `translateY(${yOffset}px) scale(${scale})`;
    layer.style.opacity = progress > 0.05 ? 1 : 0.6;
    layer.classList.toggle("revealed", progress > 0.3);
  }

  function getExplodeProgress() {
    if (!explodeSection) return 0;
    const rect = explodeSection.getBoundingClientRect();
    const sectionH = explodeSection.scrollHeight - window.innerHeight;
    const scrolled = -rect.top;
    return Math.max(0, Math.min(1, scrolled / sectionH));
  }

  function getActiveStep(progress) {
    // 5 steps across 0-1
    return Math.min(4, Math.floor(progress * 5));
  }

  function updateExplode() {
    const progress = getExplodeProgress();
    const activeStep = getActiveStep(progress);

    // Update step text
    explodeSteps.forEach((step, i) => {
      step.classList.toggle("active", i === activeStep);
    });

    // Update layer positions — spread them out gradually
    exLayers.forEach((layer, i) => {
      if (layer) setLayerStyle(layer, i, progress);
    });
  }

  /* ── INTERSECTION OBSERVER FOR REVEALS ── */
  const revealEls = document.querySelectorAll(
    ".pillar-card, .cg-item, .rt-item, .contact-card, .wp-card, .h-stat, .cryp-node"
  );
  revealEls.forEach((el) => el.classList.add("reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => observer.observe(el));

  /* ── STAGGERED CARD REVEALS ── */
  document.querySelectorAll(".pillars-grid, .cryp-guarantees, .contact-grid").forEach((grid) => {
    const children = grid.children;
    Array.from(children).forEach((child, i) => {
      child.style.transitionDelay = `${i * 0.08}s`;
    });
  });

  /* ── SCROLL LOOP ── */
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateExplode();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  updateExplode(); // initial call

  /* ── CHIP PHOTO CLICK EFFECT ── */
  const chipPhoto = document.getElementById("chipPhoto");
  if (chipPhoto) {
    let clickCount = 0;
    const filters = [
      "brightness(0.9) saturate(0.8) contrast(1.1)",
      "brightness(1.1) saturate(1.4) contrast(1.2) hue-rotate(10deg)",
      "brightness(1.2) saturate(0.3) contrast(1.4)",
      "brightness(0.85) saturate(2) contrast(1.3) hue-rotate(180deg)",
      "brightness(0.9) saturate(0.8) contrast(1.1)",
    ];
    chipPhoto.addEventListener("click", () => {
      clickCount = (clickCount + 1) % filters.length;
      chipPhoto.style.filter = filters[clickCount];
      // Pulse glow
      const frame = chipPhoto.closest(".chip-frame");
      if (frame) {
        frame.style.boxShadow = "0 0 40px rgba(0,245,212,0.5)";
        setTimeout(() => (frame.style.boxShadow = ""), 600);
      }
    });
    chipPhoto.style.cursor = "crosshair";
    chipPhoto.title = "Click to scan";
  }

  /* ── SMOOTH ACTIVE NAV ── */
  const navLinks = document.querySelectorAll(".nav-links a");
  const sections = document.querySelectorAll("section[id]");
  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) current = section.getAttribute("id");
    });
    navLinks.forEach((link) => {
      link.style.color = link.getAttribute("href") === `#${current}` ? "var(--accent-cyan)" : "";
    });
  }, { passive: true });

  /* ── GLITCH EFFECT ON LOGO ── */
  const navLogo = document.querySelector(".nav-logo-text");
  if (navLogo) {
    setInterval(() => {
      if (Math.random() > 0.92) {
        navLogo.style.textShadow = "2px 0 var(--accent-pink), -2px 0 var(--accent-cyan)";
        navLogo.style.transform = "skewX(-2deg)";
        setTimeout(() => {
          navLogo.style.textShadow = "";
          navLogo.style.transform = "";
        }, 80);
      }
    }, 2000);
  }

  /* ── HERO TITLE TYPEWRITER ── */
  const heroSub = document.querySelector(".hero-title-sub");
  if (heroSub) {
    const text = heroSub.textContent;
    heroSub.textContent = "";
    let i = 0;
    setTimeout(() => {
      const typeInterval = setInterval(() => {
        heroSub.textContent += text[i];
        i++;
        if (i >= text.length) clearInterval(typeInterval);
      }, 50);
    }, 1400);
  }

  /* ── PCB TRACES ANIMATION ── */
  const pcbTraces = document.querySelector(".pcb-traces");
  if (pcbTraces) {
    let angle = 0;
    setInterval(() => {
      angle += 0.5;
      pcbTraces.style.transform = `rotate(${Math.sin(angle * 0.02) * 0.3}deg)`;
    }, 50);
  }

})();
