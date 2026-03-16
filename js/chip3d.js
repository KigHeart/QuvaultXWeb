/**
 * QuVaultX-PC — chip3d.js  v4 (DEFINITIVE)
 * ─────────────────────────────────────────
 * Three.js r128 + GSAP 3 + ScrollTrigger
 *
 * Architecture
 * ────────────
 *  Six BoxGeometry "wafers" stacked on a Group:
 *    0  HBM3 substrate   (teal)
 *    1  UCIe PHY         (cyan)
 *    2  Algebra Core     (purple)
 *    3  Five Pillars     (orange)   ← photo texture on top face
 *    4  KLV Vault        (pink)
 *    5  CEU / Die cap    (white)   ← photo texture on top face
 *
 *  On scroll, GSAP scrubs layer separation (explode Y).
 *  Camera orbits slowly; on scroll it moves to reveal each layer.
 *  Pillar "hot-spots" are HTML divs overlaid in screen space —
 *    hover triggers emissive glow on the 3D layer + a sidebar card.
 *
 *  Single <canvas id="threeCanvas"> is fixed/full-viewport.
 *  The canvas is BEHIND all HTML content (z-index: 0).
 */

(function () {
  "use strict";

  /* ─────────────────────────────────────────
     GUARD
  ───────────────────────────────────────── */
  if (typeof THREE === "undefined") {
    console.warn("[chip3d] Three.js not loaded");
    return;
  }

  /* ─────────────────────────────────────────
     LAYER DEFINITIONS  (bottom → top index)
  ───────────────────────────────────────── */
  const DEFS = [
    { name: "HBM3 Memory",        tag:"HBM3 · 3.28 TB/s",  col:0x06d6a0, emi:0x012418, w:3.8, d:3.8, h:0.12 },
    { name: "UCIe 3.0 PHY",       tag:"UCIe · 512 Gb/s",   col:0x00c9b0, emi:0x002820, w:3.5, d:3.5, h:0.10 },
    { name: "Shared Algebra Core", tag:"NTT×16 · MSM×8",   col:0x7209b7, emi:0x180030, w:3.2, d:3.2, h:0.16 },
    { name: "Five Crypto Pillars", tag:"ZKPE·FHES·MPCF·FEOE·CEU", col:0xfb8500, emi:0x2a1500, w:3.2, d:3.2, h:0.20 },
    { name: "Key Lifecycle Vault", tag:"CC EAL6+ · TRNG · PUF", col:0xf72585, emi:0x300010, w:2.8, d:2.8, h:0.12 },
    { name: "Cryptomaton CEU",     tag:"Encrypted Exec · ZK Proof", col:0xe0f0ff, emi:0x0a1520, w:2.6, d:2.6, h:0.10 },
  ];

  const REST_GAP  = 0.015;   // gap between layers when stacked
  const EXPLODE_Y = 0.72;    // extra Y per layer when fully open

  /* ─────────────────────────────────────────
     RENDERER
  ───────────────────────────────────────── */
  const canvas = document.getElementById("threeCanvas");
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);

  /* ─────────────────────────────────────────
     SCENE & CAMERA
  ───────────────────────────────────────── */
  const scene  = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 3.8, 7.5);
  camera.lookAt(0, 0.3, 0);

  /* ─────────────────────────────────────────
     LIGHTS
  ───────────────────────────────────────── */
  scene.add(new THREE.AmbientLight(0x0d1f2d, 0.9));

  const key = new THREE.DirectionalLight(0x00f5d4, 2.2);
  key.position.set(5, 10, 6);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(1024);
  key.shadow.camera.near = 1; key.shadow.camera.far = 30;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xf72585, 0.7);
  fill.position.set(-6, 4, -4);
  scene.add(fill);

  const back = new THREE.DirectionalLight(0x7209b7, 0.4);
  back.position.set(0, -5, -8);
  scene.add(back);

  /* ─────────────────────────────────────────
     CHIP PHOTO TEXTURE
  ───────────────────────────────────────── */
  let chipTex = null;
  new THREE.TextureLoader().load("quvaultX.png", (t) => {
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    chipTex = t;
    // apply to top-face of top two layers
    [3, 5].forEach((i) => {
      if (!meshes[i]) return;
      const m = meshes[i].material;
      // face order for BoxGeometry: px,nx,py,ny,pz,nz → index 2 = +Y
      m[2] = new THREE.MeshStandardMaterial({
        map: chipTex,
        roughness: 0.18, metalness: 0.85,
        emissive: new THREE.Color(0x001628),
        emissiveIntensity: 0.12,
      });
    });
  });

  /* ─────────────────────────────────────────
     BUILD LAYERS
  ───────────────────────────────────────── */
  const group  = new THREE.Group();
  scene.add(group);

  const meshes  = [];
  const ptLights = [];

  // Compute rest Y positions (stacked flush)
  let stackY = 0;
  const restY = [];
  DEFS.forEach((d, i) => {
    restY[i] = stackY + d.h / 2;
    stackY += d.h + REST_GAP;
  });
  const stackCenter = stackY / 2;

  function makeSideMat(def) {
    return new THREE.MeshStandardMaterial({
      color:    def.col,
      emissive: def.emi,
      emissiveIntensity: 0.08,
      roughness: 0.30, metalness: 0.88,
    });
  }
  function makeTopMat(def) {
    // procedural canvas texture simulating circuit traces
    const sz = 256;
    const cv = document.createElement("canvas");
    cv.width = cv.height = sz;
    const cx = cv.getContext("2d");

    cx.fillStyle = "#" + def.col.toString(16).padStart(6,"0") + "22";
    cx.fillRect(0, 0, sz, sz);

    const hex = "#" + def.col.toString(16).padStart(6,"0");
    cx.strokeStyle = hex;
    cx.globalAlpha = 0.18;
    cx.lineWidth = 1;
    // grid
    for (let g = 0; g <= sz; g += 16) {
      cx.beginPath(); cx.moveTo(g,0); cx.lineTo(g,sz); cx.stroke();
      cx.beginPath(); cx.moveTo(0,g); cx.lineTo(sz,g); cx.stroke();
    }
    // random trace lines
    cx.globalAlpha = 0.35; cx.lineWidth = 1.5;
    for (let t = 0; t < 12; t++) {
      const x1 = Math.random()*sz, y1 = Math.random()*sz;
      const x2 = x1 + (Math.random()-0.5)*sz*0.6;
      const y2 = y1 + (Math.random()-0.5)*sz*0.6;
      cx.beginPath(); cx.moveTo(x1,y1); cx.lineTo(x2,y2); cx.stroke();
    }
    // pads
    cx.globalAlpha = 0.5;
    for (let p = 0; p < 20; p++) {
      const px = Math.round(Math.random()*14)*16 + 8;
      const py = Math.round(Math.random()*14)*16 + 8;
      cx.fillStyle = hex;
      cx.fillRect(px-3, py-3, 6, 6);
    }

    const tex = new THREE.CanvasTexture(cv);
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.15, metalness: 0.92,
      emissive: new THREE.Color(def.emi),
      emissiveIntensity: 0.1,
    });
  }
  function makeBottomMat() {
    return new THREE.MeshStandardMaterial({ color:0x030d15, roughness:0.8, metalness:0.2 });
  }

  DEFS.forEach((def, i) => {
    const geo = new THREE.BoxGeometry(def.w, def.h, def.d);
    // 6 materials: px,nx,py(top),ny(bottom),pz,nz
    const mats = [
      makeSideMat(def), makeSideMat(def),
      makeTopMat(def),  makeBottomMat(),
      makeSideMat(def), makeSideMat(def),
    ];
    const mesh = new THREE.Mesh(geo, mats);
    mesh.position.y = restY[i] - stackCenter;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { def, idx: i, restY: restY[i] - stackCenter, explodeY: 0, hovering: false };
    group.add(mesh);
    meshes.push(mesh);

    // Per-layer point light (off by default)
    const pt = new THREE.PointLight(def.col, 0, 4.5);
    pt.position.y = restY[i] - stackCenter;
    group.add(pt);
    ptLights.push(pt);
  });

  /* ─────────────────────────────────────────
     EDGE GLOW LINES (outline each layer)
  ───────────────────────────────────────── */
  DEFS.forEach((def, i) => {
    const hw = def.w/2, hh = def.h/2, hd = def.d/2;
    const pts = [
      [-hw,-hh,-hd],[ hw,-hh,-hd],[ hw,-hh, hd],[-hw,-hh, hd],[-hw,-hh,-hd],
      [-hw, hh,-hd],[ hw, hh,-hd],[ hw, hh, hd],[-hw, hh, hd],[-hw, hh,-hd],
    ].flatMap(p => p);
    const laterals = [
      [-hw,-hh,-hd],[-hw,hh,-hd],
      [ hw,-hh,-hd],[ hw,hh,-hd],
      [ hw,-hh, hd],[ hw,hh, hd],
      [-hw,-hh, hd],[-hw,hh, hd],
    ].flatMap(p => p);

    const col = new THREE.Color(def.col);
    const mat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.22 });

    const g1 = new THREE.BufferGeometry();
    g1.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute("position", new THREE.Float32BufferAttribute(laterals, 3));

    const l1 = new THREE.Line(g1, mat);
    const l2 = new THREE.LineSegments(g2, mat);
    meshes[i].add(l1);
    meshes[i].add(l2);
    meshes[i].userData.edgeMat = mat;
  });

  /* ─────────────────────────────────────────
     FLOATING PARTICLES
  ───────────────────────────────────────── */
  const N_PARTICLES = 280;
  const pPos  = new Float32Array(N_PARTICLES * 3);
  const pCol  = new Float32Array(N_PARTICLES * 3);
  const pVel  = new Float32Array(N_PARTICLES * 3);
  const palette = [0x00f5d4, 0xf72585, 0x7209b7, 0x06d6a0, 0xfb8500]
    .map(c => new THREE.Color(c));

  for (let i = 0; i < N_PARTICLES; i++) {
    pPos[i*3]   = (Math.random()-0.5)*14;
    pPos[i*3+1] = (Math.random()-0.5)*10;
    pPos[i*3+2] = (Math.random()-0.5)*14;
    pVel[i*3]   = (Math.random()-0.5)*0.006;
    pVel[i*3+1] = (Math.random()-0.5)*0.004;
    pVel[i*3+2] = (Math.random()-0.5)*0.006;
    const c = palette[i % palette.length];
    pCol[i*3]=c.r; pCol[i*3+1]=c.g; pCol[i*3+2]=c.b;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("color",    new THREE.BufferAttribute(pCol, 3));
  const pMat = new THREE.PointsMaterial({ size:0.05, vertexColors:true, transparent:true, opacity:0.55, sizeAttenuation:true });
  const pts3d = new THREE.Points(pGeo, pMat);
  scene.add(pts3d);

  /* ─────────────────────────────────────────
     SHARED ANIMATION STATE
     (GSAP will tween these values)
  ───────────────────────────────────────── */
  const S = {
    explode:  0,      // 0=stacked, 1=fully open
    groupRotY: 0,     // overall Y rotation (radians)
    groupRotX: -0.18, // slight downward tilt
    camY:     3.8,
    camZ:     7.5,
    hlLayer:  -1,     // highlighted layer index
  };

  /* ─────────────────────────────────────────
     GSAP ScrollTrigger — SCROLL SCRUB
  ───────────────────────────────────────── */
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    // ── Main scrub timeline ──────────────────
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#explodeSection",
        start:   "top top",
        end:     "bottom bottom",
        scrub:   1.4,
      }
    });

    tl
      // ch0→ch1: start separating layers, slight tilt
      .to(S, { explode:0.35, groupRotY: 0.45, duration:1 }, 0)
      // ch1→ch2: fully explode, camera pull back + look up
      .to(S, { explode:1.0,  groupRotY: 0.9,  groupRotX:-0.05, camY:2.8, camZ:8.5, duration:2 }, 1)
      // ch2→ch3: swing around, highlight KLV
      .to(S, { groupRotY:-0.5, groupRotX:0.08, camY:2.2, camZ:7, duration:1.5 }, 3)
      // ch3→ch4: tilt down to HBM base
      .to(S, { explode:0.55, groupRotY:0.15, groupRotX:0.55, camY:6.5, camZ:5, duration:1.5 }, 4.5)
      // ch4→ch5: re-stack, zoom into top die face
      .to(S, { explode:0,    groupRotY:0.05, groupRotX:-0.42, camY:5.2, camZ:4.5, duration:1.5 }, 6);

    // ── Per-chapter layer highlight ──────────
    const chapterHighlights = [-1, 2, 3, 4, 0, 5];
    document.querySelectorAll(".chapter").forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top center",
        end:   "bottom center",
        onEnter:     () => { S.hlLayer = chapterHighlights[i] ?? -1; },
        onEnterBack: () => { S.hlLayer = chapterHighlights[i] ?? -1; },
        onLeave:     () => { S.hlLayer = -1; },
        onLeaveBack: () => { S.hlLayer = -1; },
      });
    });
  }

  /* ─────────────────────────────────────────
     HTML PILLAR HOTSPOT OVERLAYS
     (positioned in screen space each frame)
  ───────────────────────────────────────── */
  const PILLARS = [
    { name:"ZKPE",  full:"ZK Proof Engine",          col:"#00f5d4", desc:"PLONK · Groth16 · Nova  |  <200ms",  layerIdx:3, ox:-0.9, oz:-0.9 },
    { name:"FHES",  full:"FHE Substrate",             col:"#f72585", desc:"CKKS Bootstrap  |  ~1s",           layerIdx:3, ox: 0.9, oz:-0.9 },
    { name:"MPCF",  full:"MPC Fabric",                col:"#7209b7", desc:"Garbled Circuits · tFHE",          layerIdx:3, ox:-0.9, oz: 0.9 },
    { name:"FEOE",  full:"FE & Obfuscation",          col:"#fb8500", desc:"k-Linear Maps · iO Sandbox",       layerIdx:3, ox: 0.9, oz: 0.9 },
    { name:"CEU",   full:"Cryptomaton Exec Unit",     col:"#06d6a0", desc:"Opaque Execution · ZK Proofs",     layerIdx:5, ox: 0,   oz: 0   },
    { name:"KLV",   full:"Key Lifecycle Vault",       col:"#ff4dc4", desc:"EAL6+ · TRNG · PUF · Anti-DPA",   layerIdx:4, ox: 0,   oz: 0   },
  ];

  // Build overlay container
  const overlay = document.createElement("div");
  overlay.id = "chip3dOverlay";
  overlay.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:3;";
  document.body.appendChild(overlay);

  // X-ray info card
  const infoCard = document.createElement("div");
  infoCard.id = "pillarCard";
  infoCard.style.cssText = `
    position:fixed; right:40px; top:50%; transform:translateY(-50%) translateX(30px);
    width:260px; padding:24px 20px;
    background:rgba(2,4,8,0.88); backdrop-filter:blur(20px);
    border:1px solid rgba(0,245,212,0.25); border-radius:6px;
    font-family:'Rajdhani','Segoe UI',sans-serif;
    opacity:0; transition:opacity 0.3s ease, transform 0.3s ease;
    pointer-events:none; z-index:4;
  `;
  document.body.appendChild(infoCard);

  // Build hotspot dots
  const hotspotEls = PILLARS.map((p) => {
    const dot = document.createElement("div");
    dot.style.cssText = `
      position:absolute; width:14px; height:14px; border-radius:50%;
      background:${p.col}; box-shadow:0 0 12px ${p.col};
      pointer-events:auto; cursor:crosshair;
      transform:translate(-50%,-50%);
      transition:width 0.2s, height 0.2s, box-shadow 0.2s;
      display:none;
    `;
    const ring = document.createElement("div");
    ring.style.cssText = `
      position:absolute; width:28px; height:28px; border-radius:50%;
      border:1.5px solid ${p.col}; opacity:0.5;
      top:50%; left:50%; transform:translate(-50%,-50%);
      animation:hotspotPulse 2s infinite;
    `;
    dot.appendChild(ring);

    dot.addEventListener("mouseenter", () => {
      dot.style.width = "20px"; dot.style.height = "20px";
      dot.style.boxShadow = `0 0 24px ${p.col}, 0 0 48px ${p.col}44`;
      // Highlight 3D layer
      S.hlLayer = p.layerIdx;
      // Show info card
      infoCard.innerHTML = `
        <div style="font-family:'Orbitron','Courier New',monospace;font-size:0.6rem;color:${p.col};
                    letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px;">
          Layer ${p.layerIdx + 1} · X-Ray
        </div>
        <div style="font-family:'Orbitron','Courier New',monospace;font-size:1.2rem;font-weight:900;
                    color:${p.col};letter-spacing:0.08em;margin-bottom:4px;">${p.name}</div>
        <div style="font-size:0.8rem;color:#7ab3c8;margin-bottom:12px;">${p.full}</div>
        <div style="font-family:'Share Tech Mono','Courier New',monospace;font-size:0.72rem;
                    color:#00f5d4;padding:8px 10px;background:rgba(0,245,212,0.06);
                    border:1px solid rgba(0,245,212,0.15);border-radius:3px;">${p.desc}</div>
      `;
      infoCard.style.opacity = "1";
      infoCard.style.borderColor = p.col + "66";
      infoCard.style.transform = "translateY(-50%) translateX(0)";
    });
    dot.addEventListener("mouseleave", () => {
      dot.style.width = "14px"; dot.style.height = "14px";
      dot.style.boxShadow = `0 0 12px ${p.col}`;
      S.hlLayer = -1;
      infoCard.style.opacity = "0";
      infoCard.style.transform = "translateY(-50%) translateX(30px)";
    });

    overlay.appendChild(dot);
    return dot;
  });

  // Inject pulse keyframes
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    @keyframes hotspotPulse {
      0%,100%{ transform:translate(-50%,-50%) scale(1); opacity:0.5; }
      50%    { transform:translate(-50%,-50%) scale(1.6); opacity:0; }
    }
  `;
  document.head.appendChild(styleEl);

  /* ─────────────────────────────────────────
     PROJECT 3D → SCREEN  helper
  ───────────────────────────────────────── */
  const _v3 = new THREE.Vector3();
  function toScreen(worldX, worldY, worldZ) {
    _v3.set(worldX, worldY, worldZ);
    _v3.project(camera);
    return {
      x: (_v3.x * 0.5 + 0.5) * window.innerWidth,
      y: (-_v3.y * 0.5 + 0.5) * window.innerHeight,
      behind: _v3.z > 1,
    };
  }

  /* ─────────────────────────────────────────
     MOUSE PARALLAX (hero only)
  ───────────────────────────────────────── */
  let mx = 0, my = 0;
  document.addEventListener("mousemove", (e) => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ─────────────────────────────────────────
     RENDER LOOP
  ───────────────────────────────────────── */
  let t = 0;
  const _q = new THREE.Quaternion();
  const _e = new THREE.Euler();

  function tick() {
    requestAnimationFrame(tick);
    t += 0.012;

    /* ── 1. Update layer Y positions ── */
    meshes.forEach((mesh, i) => {
      const targetY = mesh.userData.restY + i * S.explode * EXPLODE_Y;
      mesh.position.y += (targetY - mesh.position.y) * 0.07;
      ptLights[i].position.y = mesh.position.y;

      /* Highlight glow */
      const isHL = (i === S.hlLayer);
      const tgtIntensity = isHL ? 2.8 : 0;
      ptLights[i].intensity += (tgtIntensity - ptLights[i].intensity) * 0.07;

      /* Emissive pulse */
      if (mesh.userData.edgeMat) {
        const tgtOpacity = isHL ? 0.7 + Math.sin(t * 4) * 0.15 : 0.22;
        mesh.userData.edgeMat.opacity += (tgtOpacity - mesh.userData.edgeMat.opacity) * 0.08;
      }
      mesh.material.forEach((m) => {
        if (m && m.emissiveIntensity !== undefined) {
          const base = isHL ? 0.55 + Math.sin(t * 3) * 0.12 : 0.08;
          m.emissiveIntensity += (base - m.emissiveIntensity) * 0.06;
        }
      });
    });

    /* ── 2. Group rotation ── */
    // Add idle spin when stacked, dampen when exploded
    const idleSpin = S.explode < 0.05 ? 0.0025 : 0;
    const targetRotY = S.groupRotY + idleSpin * t;
    group.rotation.y += (S.groupRotY + idleSpin * t * 0 - group.rotation.y) * 0.04;
    if (S.explode < 0.05) group.rotation.y += idleSpin;

    // Mouse parallax on hero
    const heroVisible = window.scrollY < window.innerHeight * 0.5;
    if (heroVisible) {
      group.rotation.y += (mx * 0.28 - group.rotation.y) * 0.03;
      group.rotation.x += (-0.18 + my * 0.10 - group.rotation.x) * 0.03;
    } else {
      group.rotation.x += (S.groupRotX - group.rotation.x) * 0.04;
      // GSAP controls Y during scroll
    }

    /* ── 3. Camera ── */
    camera.position.y += (S.camY - camera.position.y) * 0.04;
    camera.position.z += (S.camZ - camera.position.z) * 0.04;
    camera.lookAt(0, 0.3, 0);

    /* ── 4. Particles ── */
    for (let i = 0; i < N_PARTICLES; i++) {
      pPos[i*3]   += pVel[i*3];
      pPos[i*3+1] += pVel[i*3+1];
      pPos[i*3+2] += pVel[i*3+2];
      // bounce
      if (Math.abs(pPos[i*3])   > 7) pVel[i*3]   *= -1;
      if (Math.abs(pPos[i*3+1]) > 5) pVel[i*3+1] *= -1;
      if (Math.abs(pPos[i*3+2]) > 7) pVel[i*3+2] *= -1;
    }
    pGeo.attributes.position.needsUpdate = true;
    pMat.opacity = 0.25 + S.explode * 0.45;

    /* ── 5. Hotspot positions (screen-space overlay) ── */
    const showHotspots = S.explode > 0.25;
    PILLARS.forEach((p, i) => {
      const mesh = meshes[p.layerIdx];
      if (!mesh) return;
      // World position = mesh world pos + local offset
      const wx = group.position.x + (mesh.position.x + p.ox) * Math.cos(group.rotation.y) - (mesh.position.z + p.oz) * Math.sin(group.rotation.y);
      const wy = group.position.y + mesh.position.y + DEFS[p.layerIdx].h / 2 + 0.05;
      const wz = group.position.z + (mesh.position.x + p.ox) * Math.sin(group.rotation.y) + (mesh.position.z + p.oz) * Math.cos(group.rotation.y);
      const sc = toScreen(wx, wy, wz);
      const dot = hotspotEls[i];
      if (showHotspots && !sc.behind) {
        dot.style.display  = "block";
        dot.style.left     = sc.x + "px";
        dot.style.top      = sc.y + "px";
      } else {
        dot.style.display  = "none";
      }
    });

    renderer.render(scene, camera);
  }

  resize();
  tick();

})();
