/**
 * QuVaultX-PC — 3D Chip Scene
 * Three.js r128 + GSAP ScrollTrigger
 *
 * Architecture:
 *  - 6 chip layers built from BoxGeometry (no .glb needed)
 *  - Top face of each layer gets the chip photo as texture
 *  - Camera: OrthographicCamera + slight perspective tilt
 *  - GSAP ScrollTrigger scrubs: layer separation Y, camera orbit, bloom glow
 *  - Each scroll "chapter" highlights a different layer with emissive color
 */

(function () {
  "use strict";

  /* ── Guard: only run if Three.js loaded ── */
  if (typeof THREE === "undefined") {
    console.warn("Three.js not loaded — 3D chip scene skipped");
    return;
  }

  /* ════════════════════════════════
     CONSTANTS & CONFIG
  ════════════════════════════════ */
  const LAYER_W  = 3.2;
  const LAYER_D  = 3.2;
  const LAYER_H  = 0.18;
  const GAP_BASE = 0.04;   // resting gap between layers
  const GAP_MAX  = 0.9;    // fully exploded gap

  // Layer definitions (bottom → top)
  const LAYERS = [
    { name: "HBM3 · 32 GiB",           color: 0x06d6a0, emissive: 0x023d2c, w: LAYER_W * 1.15, d: LAYER_D * 1.15, h: LAYER_H * 0.7 },
    { name: "UCIe 3.0 PHY",             color: 0x00f5d4, emissive: 0x003d38, w: LAYER_W * 1.05, d: LAYER_D * 1.05, h: LAYER_H * 0.5 },
    { name: "Shared Algebra Core",      color: 0x7209b7, emissive: 0x1a0040, w: LAYER_W,        d: LAYER_D,        h: LAYER_H },
    { name: "Five Crypto Pillars",      color: 0xfb8500, emissive: 0x3d2000, w: LAYER_W,        d: LAYER_D,        h: LAYER_H * 1.2 },
    { name: "Key Lifecycle Vault",      color: 0xf72585, emissive: 0x3d0020, w: LAYER_W * 0.9,  d: LAYER_D * 0.9,  h: LAYER_H },
    { name: "Cryptomaton Exec Unit",    color: 0xe8f4f8, emissive: 0x102030, w: LAYER_W * 0.85, d: LAYER_D * 0.85, h: LAYER_H * 0.8 },
  ];

  // Which layer gets highlighted per scroll chapter
  const CHAPTER_HIGHLIGHT = [null, 2, 3, 4, 0, 5];

  /* ════════════════════════════════
     SCENE SETUP
  ════════════════════════════════ */
  const canvas = document.getElementById("threeCanvas");
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.background = null; // transparent — CSS bg shows through

  /* ── Camera ── */
  const aspect = canvas.clientWidth / canvas.clientHeight;
  const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
  camera.position.set(0, 4.5, 6);
  camera.lookAt(0, 0, 0);

  /* ── Lighting ── */
  const ambient = new THREE.AmbientLight(0x102030, 0.6);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0x00f5d4, 1.8);
  keyLight.position.set(4, 8, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width  = 1024;
  keyLight.shadow.mapSize.height = 1024;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xf72585, 0.6);
  fillLight.position.set(-4, 3, -2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x7209b7, 0.4);
  rimLight.position.set(0, -4, -6);
  scene.add(rimLight);

  // Point lights for glow effect per layer
  const layerPoints = LAYERS.map((l, i) => {
    const pt = new THREE.PointLight(l.color, 0, 3);
    pt.position.y = i * (LAYER_H + GAP_BASE);
    scene.add(pt);
    return pt;
  });

  /* ════════════════════════════════
     CHIP PHOTO TEXTURE
  ════════════════════════════════ */
  const textureLoader = new THREE.TextureLoader();
  let chipTexture = null;

  // Load texture async — materials update when ready
  textureLoader.load(
    "quvaultX.png",
    (tex) => {
      tex.encoding = THREE.sRGBEncoding;
      chipTexture = tex;
      // Apply to top face of the top layer
      if (layerMeshes.length > 0) {
        const topMesh = layerMeshes[layerMeshes.length - 1];
        // Material index 2 = +Y face on BoxGeometry
        topMesh.material[2] = new THREE.MeshStandardMaterial({
          map: chipTexture,
          roughness: 0.2,
          metalness: 0.8,
          emissiveMap: chipTexture,
          emissive: new THREE.Color(0x001a2e),
          emissiveIntensity: 0.15,
        });
      }
    },
    undefined,
    () => { /* silently use fallback material if image fails */ }
  );

  /* ════════════════════════════════
     BUILD CHIP LAYERS
  ════════════════════════════════ */
  const layerMeshes = [];
  const layerGroup  = new THREE.Group();
  scene.add(layerGroup);

  // Helper: build 6-material array for a box (each face can differ)
  function makeLayerMaterials(layerDef, isTop) {
    const sideMat = new THREE.MeshStandardMaterial({
      color:     layerDef.color,
      emissive:  layerDef.emissive,
      roughness: 0.35,
      metalness: 0.85,
      envMapIntensity: 1,
    });
    const bottomMat = new THREE.MeshStandardMaterial({
      color:     0x050b12,
      roughness: 0.8,
      metalness: 0.3,
    });
    // Top face: circuit-board like procedural texture or chip photo on top layer
    const topMat = new THREE.MeshStandardMaterial({
      color:     isTop ? 0x1a3040 : layerDef.color,
      emissive:  isTop ? 0x001020 : layerDef.emissive,
      roughness: 0.15,
      metalness: 0.95,
    });

    // BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
    return [sideMat, sideMat, topMat, bottomMat, sideMat, sideMat];
  }

  LAYERS.forEach((layerDef, i) => {
    const geo = new THREE.BoxGeometry(layerDef.w, layerDef.h, layerDef.d);
    const mats = makeLayerMaterials(layerDef, i === LAYERS.length - 1);
    const mesh = new THREE.Mesh(geo, mats);
    mesh.castShadow    = true;
    mesh.receiveShadow = true;

    // Resting Y position (stacked)
    const restY = i * (LAYER_H + GAP_BASE);
    mesh.position.y = restY;
    mesh.userData.restY    = restY;
    mesh.userData.layerIdx = i;
    mesh.userData.layerDef = layerDef;

    layerGroup.add(mesh);
    layerMeshes.push(mesh);
  });

  // Add circuit trace lines on each layer's top face
  LAYERS.forEach((layerDef, i) => {
    const traceGroup = new THREE.Group();
    traceGroup.position.y = layerMeshes[i].position.y + layerDef.h / 2 + 0.001;

    const traceMat = new THREE.LineBasicMaterial({
      color: layerDef.color,
      transparent: true,
      opacity: 0.25,
    });

    // Grid lines
    const hw = layerDef.w / 2;
    const hd = layerDef.d / 2;
    const steps = 8;
    const points = [];

    for (let s = 0; s <= steps; s++) {
      const t = -hw + (s / steps) * layerDef.w;
      points.push(
        new THREE.Vector3(t, 0, -hd),
        new THREE.Vector3(t, 0,  hd),
        new THREE.Vector3(-hw, 0, t * (hd / hw)),
        new THREE.Vector3( hw, 0, t * (hd / hw)),
      );
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    traceGroup.add(new THREE.LineSegments(geom, traceMat));
    layerGroup.add(traceGroup);
    layerMeshes[i].userData.traceGroup = traceGroup;
  });

  // Label sprites (canvas-based, so no font file needed)
  function makeLabel(text, color) {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 80;
    const cx = c.getContext("2d");
    cx.clearRect(0, 0, 512, 80);
    cx.fillStyle = "rgba(2,4,8,0.85)";
    cx.fillRect(0, 0, 512, 80);
    cx.strokeStyle = color;
    cx.lineWidth = 2;
    cx.strokeRect(1, 1, 510, 78);
    cx.fillStyle = color;
    cx.font = "bold 28px 'Orbitron', 'Courier New', monospace";
    cx.textAlign = "center";
    cx.textBaseline = "middle";
    cx.fillText(text, 256, 40);
    const tex  = new THREE.CanvasTexture(c);
    const mat  = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0 });
    const spr  = new THREE.Sprite(mat);
    spr.scale.set(2.4, 0.38, 1);
    return spr;
  }

  const labelSprites = LAYERS.map((l, i) => {
    const hex = "#" + l.color.toString(16).padStart(6, "0");
    const spr = makeLabel(l.name, hex);
    spr.position.set(layerDef_x_offset(i), layerMeshes[i].position.y + l.h / 2 + 0.3, 0);
    spr.userData.layerIdx = i;
    scene.add(spr);
    return spr;
  });

  function layerDef_x_offset(i) {
    // Alternate left/right per layer
    return (i % 2 === 0) ? -2.4 : 2.4;
  }

  /* ════════════════════════════════
     PARTICLES (floating data points)
  ════════════════════════════════ */
  const particleCount = 200;
  const pPositions    = new Float32Array(particleCount * 3);
  const pColors       = new Float32Array(particleCount * 3);
  const particlePalette = [
    new THREE.Color(0x00f5d4),
    new THREE.Color(0xf72585),
    new THREE.Color(0x7209b7),
    new THREE.Color(0x06d6a0),
  ];

  for (let i = 0; i < particleCount; i++) {
    pPositions[i * 3]     = (Math.random() - 0.5) * 10;
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    const c = particlePalette[Math.floor(Math.random() * particlePalette.length)];
    pColors[i * 3] = c.r; pColors[i * 3 + 1] = c.g; pColors[i * 3 + 2] = c.b;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
  pGeo.setAttribute("color",    new THREE.BufferAttribute(pColors,    3));

  const pMat = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* ════════════════════════════════
     GSAP SCROLL TRIGGER SETUP
  ════════════════════════════════ */
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("GSAP/ScrollTrigger not loaded — scroll animation skipped");
  } else {
    gsap.registerPlugin(ScrollTrigger);

    // Shared animated state object
    const state = {
      explode:   0,      // 0 = stacked, 1 = fully exploded
      rotY:      0,      // layerGroup Y rotation
      rotX:      -0.18,  // layerGroup X rotation (tilt)
      camY:      4.5,
      camZ:      6,
      highlight: -1,     // index of highlighted layer (-1 = none)
    };

    // Master timeline scrubbed by scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger:  "#explodeSection",
        start:    "top top",
        end:      "bottom bottom",
        scrub:    1.2,
        pin:      false,
      },
    });

    // Chapter 0→1: layers begin to separate, slight rotation
    tl.to(state, { explode: 0.3, rotY:  0.4, duration: 1 }, 0)
    // Chapter 1→2: full explode, rotate to show side
      .to(state, { explode: 1.0, rotY:  0.8, rotX: -0.08, camY: 3, camZ: 7, duration: 2 }, 1)
    // Chapter 2→3: rotate around, focus KLV
      .to(state, { rotY: -0.4, rotX: 0.05, camY: 2, camZ: 5.5, duration: 1.5 }, 3)
    // Chapter 3→4: tilt down to look at HBM layer
      .to(state, { explode: 0.4, rotY: 0.1, rotX: 0.6,  camY: 6, camZ: 4, duration: 1.5 }, 4.5)
    // Chapter 4→5: reassemble, zoom into CEU top face
      .to(state, { explode: 0,   rotY: 0,   rotX: -0.4, camY: 5, camZ: 4, duration: 1.5 }, 6);

    // Chapter highlight triggers (separate ScrollTriggers per chapter)
    const chapterEls = document.querySelectorAll(".explode-step");
    chapterEls.forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el.closest(".explode-section") || "#explodeSection",
        start:   `${i * 20}% top`,
        end:     `${(i + 1) * 20}% top`,
        onEnter:      () => { state.highlight = CHAPTER_HIGHLIGHT[i] ?? -1; },
        onEnterBack:  () => { state.highlight = CHAPTER_HIGHLIGHT[i] ?? -1; },
      });
    });
  }

  /* ════════════════════════════════
     ANIMATION LOOP
  ════════════════════════════════ */
  // Shared state (fallback if GSAP not loaded)
  const state = window._qvxState || {
    explode: 0, rotY: 0, rotX: -0.18,
    camY: 4.5, camZ: 6, highlight: -1,
  };
  window._qvxState = state;

  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.008;

    /* ── Apply explode positions ── */
    const totalH = LAYERS.reduce((s, l) => s + l.h + GAP_BASE, 0);
    const centerY = totalH / 2;

    layerMeshes.forEach((mesh, i) => {
      const targetY = mesh.userData.restY + i * state.explode * GAP_MAX;
      mesh.position.y += (targetY - mesh.position.y) * 0.08;

      // Update trace group Y
      if (mesh.userData.traceGroup) {
        mesh.userData.traceGroup.position.y =
          mesh.position.y + LAYERS[i].h / 2 + 0.001;
      }

      // Highlight glow
      const isHL  = (i === state.highlight);
      const tgt   = isHL ? 2.5 : 0;
      layerPoints[i].intensity += (tgt - layerPoints[i].intensity) * 0.06;
      layerPoints[i].position.y = mesh.position.y;

      // Emissive pulse on highlighted layer
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => {
          if (mat && mat.emissiveIntensity !== undefined) {
            const baseEI = isHL ? 0.6 + Math.sin(time * 3) * 0.2 : 0.05;
            mat.emissiveIntensity += (baseEI - mat.emissiveIntensity) * 0.05;
          }
        });
      }
    });

    // Centre the group vertically
    layerGroup.position.y = -centerY * 0.5 - state.explode * GAP_MAX * 1.5;

    /* ── Apply rotation ── */
    layerGroup.rotation.y += (state.rotY - layerGroup.rotation.y) * 0.05;
    layerGroup.rotation.x += (state.rotX - layerGroup.rotation.x) * 0.05;

    // Gentle idle rotation when not scrolling
    if (Math.abs(state.explode) < 0.05) {
      layerGroup.rotation.y += 0.003;
    }

    /* ── Camera ── */
    camera.position.y += (state.camY - camera.position.y) * 0.04;
    camera.position.z += (state.camZ - camera.position.z) * 0.04;
    camera.lookAt(0, 0, 0);

    /* ── Labels ── */
    labelSprites.forEach((spr, i) => {
      const mesh   = layerMeshes[i];
      const targetX = layerDef_x_offset(i);
      spr.position.x = targetX;
      spr.position.y = mesh.position.y + LAYERS[i].h / 2 + 0.35 + layerGroup.position.y;
      const targetO  = state.explode > 0.3 ? 1 : 0;
      spr.material.opacity += (targetO - spr.material.opacity) * 0.05;
    });

    /* ── Particles drift ── */
    particles.rotation.y  = time * 0.04;
    particles.rotation.x  = time * 0.02;
    pMat.opacity = 0.3 + state.explode * 0.4;

    renderer.render(scene, camera);
  }

  animate();

  /* ── Resize handler ── */
  function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", onResize);

  /* ── Mouse parallax on desktop ── */
  document.addEventListener("mousemove", (e) => {
    if (state.explode > 0.1) return; // only when stacked
    const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    gsap && gsap.to(layerGroup.rotation, {
      y: nx * 0.3,
      x: -0.18 + ny * 0.1,
      duration: 1.5,
      ease: "power2.out",
      overwrite: "auto",
    });
  });

})();
