/**
 * QuVaultX-PC — chip3d.js  v5 (CLEAN)
 * ────────────────────────────────────
 * • Single canvas #threeCanvas inside .hero — fills it completely
 * • 6 chip layers centred in frame, chip photo mapped to top face
 * • GSAP ScrollTrigger scrubs the explode animation
 * • Pillar hotspot dots projected to screen, hover shows X-ray card
 */
(function () {
  "use strict";
  if (typeof THREE === "undefined") { console.warn("[chip3d] Three.js missing"); return; }

  /* ──────────────────────────────────
     LAYER DATA  (bottom=0 → top=5)
  ────────────────────────────────── */
  const L = [
    { name:"HBM3 Memory",         tag:"3.28 TB/s · 32 GiB",           hex:"#06d6a0", c:0x06d6a0, e:0x012418, W:4.0,D:4.0,H:0.13 },
    { name:"UCIe 3.0 PHY",        tag:"64 GT/s · 512 Gb/s bidir",      hex:"#00c9b0", c:0x00c9b0, e:0x002820, W:3.7,D:3.7,H:0.10 },
    { name:"Shared Algebra Core", tag:"NTT×16 · MSM×8 · Hash/XOF",    hex:"#7209b7", c:0x7209b7, e:0x180030, W:3.3,D:3.3,H:0.16 },
    { name:"Five Crypto Pillars", tag:"ZKPE · FHES · MPCF · FEOE · CEU",hex:"#fb8500",c:0xfb8500,e:0x2a1500, W:3.3,D:3.3,H:0.22 },
    { name:"Key Lifecycle Vault", tag:"CC EAL6+ · TRNG · PUF",         hex:"#f72585", c:0xf72585, e:0x300010, W:2.9,D:2.9,H:0.12 },
    { name:"Cryptomaton CEU",     tag:"FHE Registers · ZK Proof Output",hex:"#e0f0ff",c:0xe0f0ff,e:0x0a1828, W:2.7,D:2.7,H:0.10 },
  ];

  const GAP   = 0.02;   // resting gap between layers
  const EXPL  = 0.80;   // extra Y separation per layer when fully exploded

  /* ──────────────────────────────────
     REST POSITIONS  (stacked)
  ────────────────────────────────── */
  let stackY = 0;
  const restY = L.map(l => { const y = stackY + l.H/2; stackY += l.H + GAP; return y; });
  const stackMid = stackY / 2;

  /* ──────────────────────────────────
     RENDERER
  ────────────────────────────────── */
  const canvas = document.getElementById("threeCanvas");
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  camera.position.set(0, 3.5, 8.5);
  camera.lookAt(0, 0, 0);

  function onResize() {
    // Canvas fills its parent (.hero) which is 100vw × 100vh
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", onResize);

  /* ──────────────────────────────────
     LIGHTS
  ────────────────────────────────── */
  scene.add(new THREE.AmbientLight(0x0d1f2d, 1.0));

  const key = new THREE.DirectionalLight(0x00f5d4, 2.4);
  key.position.set(5, 10, 6); key.castShadow = true;
  key.shadow.mapSize.setScalar(1024);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xf72585, 0.7);
  fill.position.set(-6, 3, -4); scene.add(fill);

  const back = new THREE.DirectionalLight(0x7209b7, 0.35);
  back.position.set(0,-5,-8); scene.add(back);

  /* ──────────────────────────────────
     CHIP PHOTO TEXTURE  (async load)
  ────────────────────────────────── */
  new THREE.TextureLoader().load("quvaultX.png", tex => {
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    // Apply to +Y face (index 2) of layers 3 and 5
    [3, 5].forEach(i => {
      if (!meshes[i]) return;
      const mats = meshes[i].material;
      mats[2] = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.15, metalness: 0.88,
        emissive: new THREE.Color(0x001420),
        emissiveIntensity: 0.10,
      });
    });
  });

  /* ──────────────────────────────────
     BUILD LAYER MESHES
  ────────────────────────────────── */
  const group  = new THREE.Group();
  scene.add(group);
  const meshes  = [];
  const ptLights = [];

  // Procedural circuit-trace canvas texture for each layer top face
  function makeCircuitTex(hexCol) {
    const sz = 256, cv = document.createElement("canvas");
    cv.width = cv.height = sz;
    const cx = cv.getContext("2d");
    cx.fillStyle = "#000"; cx.fillRect(0,0,sz,sz);
    cx.strokeStyle = hexCol; cx.lineWidth = 0.8;
    // grid
    cx.globalAlpha = 0.14;
    for (let i=0;i<=sz;i+=16){
      cx.beginPath();cx.moveTo(i,0);cx.lineTo(i,sz);cx.stroke();
      cx.beginPath();cx.moveTo(0,i);cx.lineTo(sz,i);cx.stroke();
    }
    // traces
    cx.globalAlpha = 0.32; cx.lineWidth = 1.4;
    for (let t=0;t<14;t++){
      const x1=Math.random()*sz,y1=Math.random()*sz;
      cx.beginPath();cx.moveTo(x1,y1);
      cx.lineTo(x1+(Math.random()-.5)*sz*.55, y1+(Math.random()-.5)*sz*.55);
      cx.stroke();
    }
    // pads
    cx.globalAlpha=0.55; cx.fillStyle=hexCol;
    for(let p=0;p<22;p++){
      const px=(Math.floor(Math.random()*15)*16)+8;
      const py=(Math.floor(Math.random()*15)*16)+8;
      cx.fillRect(px-3,py-3,6,6);
    }
    return new THREE.CanvasTexture(cv);
  }

  function sideMat(l) {
    return new THREE.MeshStandardMaterial({ color:l.c, emissive:l.e, emissiveIntensity:0.08, roughness:0.28, metalness:0.90 });
  }
  function topMat(l) {
    return new THREE.MeshStandardMaterial({ map:makeCircuitTex(l.hex), roughness:0.14, metalness:0.92, emissive:new THREE.Color(l.e), emissiveIntensity:0.08 });
  }
  function botMat() {
    return new THREE.MeshStandardMaterial({ color:0x020a10, roughness:0.8, metalness:0.2 });
  }

  L.forEach((l, i) => {
    const geo  = new THREE.BoxGeometry(l.W, l.H, l.D);
    // BoxGeometry face order: +X,-X,+Y,-Y,+Z,-Z
    const mats = [ sideMat(l), sideMat(l), topMat(l), botMat(), sideMat(l), sideMat(l) ];
    const mesh = new THREE.Mesh(geo, mats);
    mesh.position.y = restY[i] - stackMid;
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData = { restY: restY[i]-stackMid, idx:i, def:l };
    group.add(mesh);
    meshes.push(mesh);

    // Edge outline
    const ec = new THREE.Color(l.c);
    const edgeMat = new THREE.LineBasicMaterial({ color:ec, transparent:true, opacity:0.2 });
    const hw=l.W/2, hh=l.H/2, hd=l.D/2;
    const verts = [
      -hw,-hh,-hd,  hw,-hh,-hd,  hw,-hh,hd, -hw,-hh,hd, -hw,-hh,-hd,
      -hw, hh,-hd,  hw, hh,-hd,  hw, hh,hd, -hw, hh,hd, -hw, hh,-hd,
    ];
    const segs = [-hw,-hh,-hd,-hw,hh,-hd, hw,-hh,-hd,hw,hh,-hd, hw,-hh,hd,hw,hh,hd, -hw,-hh,hd,-hw,hh,hd];
    const g1=new THREE.BufferGeometry(); g1.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));
    const g2=new THREE.BufferGeometry(); g2.setAttribute("position",new THREE.Float32BufferAttribute(segs,3));
    mesh.add(new THREE.Line(g1,edgeMat));
    mesh.add(new THREE.LineSegments(g2,edgeMat));
    mesh.userData.edgeMat = edgeMat;

    // Point light for glow
    const pt = new THREE.PointLight(l.c, 0, 5);
    pt.position.y = restY[i] - stackMid;
    group.add(pt); ptLights.push(pt);
  });

  /* ──────────────────────────────────
     PARTICLES
  ────────────────────────────────── */
  const NP=260, pPos=new Float32Array(NP*3), pCol=new Float32Array(NP*3), pVel=new Float32Array(NP*3);
  const pal=[0x00f5d4,0xf72585,0x7209b7,0x06d6a0,0xfb8500].map(c=>new THREE.Color(c));
  for(let i=0;i<NP;i++){
    pPos[i*3]=(Math.random()-.5)*14; pPos[i*3+1]=(Math.random()-.5)*10; pPos[i*3+2]=(Math.random()-.5)*14;
    pVel[i*3]=(Math.random()-.5)*.006; pVel[i*3+1]=(Math.random()-.5)*.004; pVel[i*3+2]=(Math.random()-.5)*.006;
    const c=pal[i%pal.length]; pCol[i*3]=c.r;pCol[i*3+1]=c.g;pCol[i*3+2]=c.b;
  }
  const pGeo=new THREE.BufferGeometry();
  pGeo.setAttribute("position",new THREE.BufferAttribute(pPos,3));
  pGeo.setAttribute("color",new THREE.BufferAttribute(pCol,3));
  const pMat=new THREE.PointsMaterial({size:.05,vertexColors:true,transparent:true,opacity:.45,sizeAttenuation:true});
  scene.add(new THREE.Points(pGeo,pMat));

  /* ──────────────────────────────────
     SHARED STATE  (GSAP tweens these)
  ────────────────────────────────── */
  const S = { explode:0, rotY:0, rotX:-0.18, camY:3.5, camZ:8.5, hlLayer:-1 };

  /* ──────────────────────────────────
     GSAP SCROLL TRIGGER
  ────────────────────────────────── */
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline({
      scrollTrigger:{
        trigger:"#explodeSection",
        start:"top top",
        end:"bottom bottom",
        scrub:1.4,
      }
    });
    tl
      .to(S,{explode:.3,  rotY:.45,  duration:1},    0)
      .to(S,{explode:1.0, rotY:.9,   rotX:-.05, camY:2.8, camZ:9.5, duration:2}, 1)
      .to(S,{rotY:-.5,    rotX:.06,  camY:2.2,  camZ:8,   duration:1.5}, 3)
      .to(S,{explode:.5,  rotY:.1,   rotX:.52,  camY:6.8, camZ:5.2, duration:1.5}, 4.5)
      .to(S,{explode:0,   rotY:.05,  rotX:-.40, camY:5.2, camZ:4.8, duration:1.5}, 6);

    // Per-chapter layer highlights
    const hlMap = [-1, 2, 3, 4, 0, 5];
    document.querySelectorAll(".chapter").forEach((el,i) => {
      ScrollTrigger.create({
        trigger:el,
        start:"top center",
        end:"bottom center",
        onEnter:()    =>{ S.hlLayer=hlMap[i]??-1; },
        onEnterBack:()=>{ S.hlLayer=hlMap[i]??-1; },
        onLeave:()    =>{ S.hlLayer=-1; },
        onLeaveBack:()=>{ S.hlLayer=-1; },
      });
    });
  }

  /* ──────────────────────────────────
     PILLAR HOTSPOT OVERLAYS
  ────────────────────────────────── */
  const PILLARS = [
    {name:"ZKPE",full:"ZK Proof Engine",        col:"#00f5d4",desc:"PLONK · Groth16 · Nova  |  &lt;200ms",li:3, ox:-.95,oz:-.95},
    {name:"FHES",full:"FHE Substrate",           col:"#f72585",desc:"CKKS Bootstrap  |  ~1s",              li:3, ox: .95,oz:-.95},
    {name:"MPCF",full:"MPC Fabric",              col:"#7209b7",desc:"Garbled Circuits · tFHE",             li:3, ox:-.95,oz: .95},
    {name:"FEOE",full:"FE & Obfuscation",        col:"#fb8500",desc:"k-Linear Maps · iO Sandbox",          li:3, ox: .95,oz: .95},
    {name:"CEU", full:"Cryptomaton Exec Unit",   col:"#06d6a0",desc:"Opaque Exec · ZK Proof Out",          li:5, ox:  0, oz:  0},
    {name:"KLV", full:"Key Lifecycle Vault",     col:"#ff4dc4",desc:"EAL6+ · TRNG · PUF · Anti-DPA",       li:4, ox:  0, oz:  0},
  ];

  const hotLayer  = document.getElementById("hotspotLayer");
  const pillarCard = document.getElementById("pillarCard");

  const hspots = PILLARS.map(p => {
    const div = document.createElement("div");
    div.className = "hspot";
    div.style.background = p.col;
    div.style.boxShadow  = `0 0 12px ${p.col}`;

    const ring = document.createElement("div");
    ring.className = "hspot-ring";
    ring.style.borderColor = p.col;
    div.appendChild(ring);

    div.addEventListener("mouseenter", () => {
      div.style.width = div.style.height = "20px";
      div.style.boxShadow = `0 0 24px ${p.col},0 0 48px ${p.col}44`;
      S.hlLayer = p.li;
      if (pillarCard) {
        pillarCard.innerHTML = `
          <div style="font-family:'Orbitron',monospace;font-size:.58rem;color:${p.col};letter-spacing:.2em;text-transform:uppercase;margin-bottom:8px">Layer ${p.li+1} · X-Ray</div>
          <div style="font-family:'Orbitron',monospace;font-size:1.15rem;font-weight:900;color:${p.col};letter-spacing:.08em;margin-bottom:4px">${p.name}</div>
          <div style="font-size:.8rem;color:#7ab3c8;margin-bottom:14px">${p.full}</div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:.72rem;color:#00f5d4;padding:8px 10px;background:rgba(0,245,212,.06);border:1px solid rgba(0,245,212,.15);border-radius:3px">${p.desc}</div>`;
        pillarCard.style.opacity = "1";
        pillarCard.style.borderColor = p.col+"66";
        pillarCard.style.transform = "translateY(-50%) translateX(0)";
      }
    });
    div.addEventListener("mouseleave", () => {
      div.style.width = div.style.height = "14px";
      div.style.boxShadow = `0 0 12px ${p.col}`;
      S.hlLayer = -1;
      if (pillarCard) {
        pillarCard.style.opacity = "0";
        pillarCard.style.transform = "translateY(-50%) translateX(30px)";
      }
    });

    if (hotLayer) hotLayer.appendChild(div);
    return div;
  });

  /* ──────────────────────────────────
     MOUSE PARALLAX
  ────────────────────────────────── */
  let mx=0, my=0;
  document.addEventListener("mousemove", e => {
    mx=(e.clientX/window.innerWidth-.5)*2;
    my=(e.clientY/window.innerHeight-.5)*2;
  });

  /* ──────────────────────────────────
     SCREEN PROJECTION HELPER
  ────────────────────────────────── */
  const _v = new THREE.Vector3();
  function toScreen(wx,wy,wz) {
    _v.set(wx,wy,wz).project(camera);
    return { x:(_v.x*.5+.5)*window.innerWidth, y:(-.5*_v.y+.5)*window.innerHeight, behind:_v.z>1 };
  }

  /* ──────────────────────────────────
     RENDER LOOP
  ────────────────────────────────── */
  let t=0;
  function tick() {
    requestAnimationFrame(tick);
    t += 0.012;

    // 1. Layer Y positions
    meshes.forEach((m,i) => {
      const tY = m.userData.restY + i*S.explode*EXPL;
      m.position.y += (tY-m.position.y)*.07;
      ptLights[i].position.y = m.position.y;

      const hl = (i===S.hlLayer);
      ptLights[i].intensity += ((hl?2.8:0)-ptLights[i].intensity)*.07;

      if (m.userData.edgeMat) {
        const tO = hl ? .7+Math.sin(t*4)*.15 : .2;
        m.userData.edgeMat.opacity += (tO-m.userData.edgeMat.opacity)*.08;
      }
      m.material.forEach(mat => {
        if (mat && mat.emissiveIntensity!=null) {
          const tE = hl ? .55+Math.sin(t*3)*.12 : .08;
          mat.emissiveIntensity += (tE-mat.emissiveIntensity)*.06;
        }
      });
    });

    // 2. Group rotation
    const heroVisible = window.scrollY < window.innerHeight*.6;
    if (heroVisible) {
      // Mouse parallax on hero
      group.rotation.y += (mx*.28-group.rotation.y)*.03;
      group.rotation.x += (-0.18+my*.10-group.rotation.x)*.03;
    } else {
      group.rotation.y += (S.rotY-group.rotation.y)*.04;
      group.rotation.x += (S.rotX-group.rotation.x)*.04;
    }
    // Idle spin when stacked
    if (S.explode < .05 && heroVisible) group.rotation.y += .0025;

    // Centre group vertically
    const spreadOffset = -(L.length/2)*S.explode*EXPL*.5;
    group.position.y += (spreadOffset-group.position.y)*.06;

    // 3. Camera
    camera.position.y += (S.camY-camera.position.y)*.04;
    camera.position.z += (S.camZ-camera.position.z)*.04;
    camera.lookAt(0,0,0);

    // 4. Particles drift
    for(let i=0;i<NP;i++){
      pPos[i*3]+=pVel[i*3]; pPos[i*3+1]+=pVel[i*3+1]; pPos[i*3+2]+=pVel[i*3+2];
      if(Math.abs(pPos[i*3])>7)   pVel[i*3]*=-1;
      if(Math.abs(pPos[i*3+1])>5) pVel[i*3+1]*=-1;
      if(Math.abs(pPos[i*3+2])>7) pVel[i*3+2]*=-1;
    }
    pGeo.attributes.position.needsUpdate=true;
    pMat.opacity = .25+S.explode*.4;

    // 5. Hotspot screen positions
    const showHS = S.explode > .2;
    PILLARS.forEach((p,i) => {
      const mesh = meshes[p.li];
      if (!mesh) return;
      // Local→world: group rotation around Y
      const cosY = Math.cos(group.rotation.y), sinY = Math.sin(group.rotation.y);
      const lx = mesh.position.x + p.ox;
      const lz = mesh.position.z + p.oz;
      const wx = group.position.x + lx*cosY - lz*sinY;
      const wy = group.position.y + mesh.position.y + L[p.li].H/2 + .06;
      const wz = group.position.z + lx*sinY + lz*cosY;
      const sc = toScreen(wx,wy,wz);
      const dot = hspots[i];
      if (showHS && !sc.behind) {
        dot.style.display="block"; dot.style.left=sc.x+"px"; dot.style.top=sc.y+"px";
      } else { dot.style.display="none"; }
    });

    renderer.render(scene,camera);
  }

  onResize();
  tick();

})();
