(function(){
  "use strict";

  /* LOADER */
  const loader=document.getElementById("loader"),fill=document.getElementById("loaderFill");
  let p=0;
  const iv=setInterval(()=>{
    p+=Math.random()*16+5; if(p>=100){p=100;clearInterval(iv);setTimeout(()=>loader&&loader.classList.add("done"),500);}
    if(fill)fill.style.width=p+"%";
  },100);

  /* CURSOR */
  const dot=document.getElementById("cursorDot"),ring=document.getElementById("cursorRing");
  let mx=-200,my=-200,rx=-200,ry=-200;
  document.addEventListener("mousemove",e=>{mx=e.clientX;my=e.clientY;if(dot){dot.style.left=mx+"px";dot.style.top=my+"px";}});
  (function ar(){rx+=(mx-rx)*.12;ry+=(my-ry)*.12;if(ring){ring.style.left=rx+"px";ring.style.top=ry+"px";}requestAnimationFrame(ar);})();
  document.querySelectorAll("a,button,.pillar-card,.chapter-card").forEach(el=>{
    el.addEventListener("mouseenter",()=>ring&&ring.classList.add("hovered"));
    el.addEventListener("mouseleave",()=>ring&&ring.classList.remove("hovered"));
  });

  /* NAV */
  const nav=document.getElementById("nav");
  window.addEventListener("scroll",()=>nav&&nav.classList.toggle("scrolled",scrollY>60),{passive:true});
  const burger=document.getElementById("navBurger"),mobnav=document.getElementById("mobileNav");
  if(burger)burger.addEventListener("click",()=>mobnav&&mobnav.classList.toggle("open"));
  document.querySelectorAll(".mob-link").forEach(l=>l.addEventListener("click",()=>mobnav&&mobnav.classList.remove("open")));

  /* SCROLL HINT */
  const sh=document.getElementById("scrollHint");
  window.addEventListener("scroll",()=>{if(sh)sh.style.opacity=scrollY>80?"0":"1";},{passive:true});

  /* TYPEWRITER */
  const ts=document.getElementById("heroSubTitle");
  if(ts){const txt=ts.textContent;ts.textContent="";let i=0;setTimeout(()=>{const t=setInterval(()=>{ts.textContent+=txt[i++];if(i>=txt.length)clearInterval(t);},55);},1100);}

  /* CHAPTER SWITCHER — scroll through 600vh explode section */
  const exSec=document.getElementById("explodeSection");
  const chs=Array.from(document.querySelectorAll(".chapter"));
  function updateChapters(){
    if(!exSec||!chs.length)return;
    const rect=exSec.getBoundingClientRect();
    const total=exSec.offsetHeight-window.innerHeight;
    const scrolled=Math.max(0,-rect.top);
    const prog=Math.min(1,scrolled/total);
    const active=Math.min(chs.length-1,Math.floor(prog*chs.length));
    chs.forEach((c,i)=>c.classList.toggle("active",i===active));
  }
  window.addEventListener("scroll",updateChapters,{passive:true});
  updateChapters();

  /* CARD REVEALS */
  const revSelectors=".pillar-card,.cg-item,.rt-item,.contact-card,.wp-card,.cryp-node";
  document.querySelectorAll(revSelectors).forEach(el=>{
    el.style.opacity="0";el.style.transform="translateY(28px)";
    el.style.transition="opacity .65s ease,transform .65s ease";
    new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.style.opacity="1";e.target.style.transform="none";}});
    },{threshold:.12}).observe(el);
  });
  document.querySelectorAll(".pillars-grid,.cryp-guarantees,.contact-grid").forEach(g=>{
    Array.from(g.children).forEach((c,i)=>{c.style.transitionDelay=i*.08+"s";});
  });

  /* LOGO GLITCH */
  const logo=document.querySelector(".nav-logo-text");
  if(logo)setInterval(()=>{
    if(Math.random()>.93){logo.style.textShadow="2px 0 #f72585,-2px 0 #00f5d4";logo.style.transform="skewX(-2deg)";setTimeout(()=>{logo.style.textShadow="";logo.style.transform="";},90);}
  },2000);

  /* ACTIVE NAV */
  const navLinks=document.querySelectorAll(".nav-links a");
  const secs=document.querySelectorAll("section[id]");
  window.addEventListener("scroll",()=>{
    let cur="";secs.forEach(s=>{if(scrollY>=s.offsetTop-120)cur=s.id;});
    navLinks.forEach(l=>{l.style.color=l.getAttribute("href")===`#${cur}`?"var(--cyan)":"";});
  },{passive:true});

})();
