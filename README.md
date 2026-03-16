# QuVaultX Website

A scrollytelling microsite for the QuVaultX-PC Programmable Cryptography Chiplet.

## Structure

```
QuvaultXWeb/
├── index.html          # Main HTML (all pages/sections)
├── css/
│   └── style.css       # All styles
├── js/
│   └── main.js         # Scrollytelling, particles, animations
├── quvaultX.png        # Chip photo (already present)
└── quvaultx_progcrypto.pdf  # White paper PDF
```

## Features

- **Scrollytelling exploded-view** of the chiplet layers (UCIe PHY → KLV → Algebra Core → Pillars → HBM3)
- **Particle canvas** network animation on the hero chip
- **Custom cursor** with ring follow effect
- **Chip parallax** on mouse movement — 3D tilt effect
- **Click-to-scan** chip photo with filter cycling
- **Typewriter** animation on hero subtitle
- **Glitch** effect on navigation logo
- **Intersection Observer** staggered card reveals
- **Five Pillars** section with per-pillar color theming
- **Cryptomaton** deep-dive with flow diagram
- **Specs** table + state-of-the-art comparison grid
- **Roadmap** timeline
- **White Paper** download section
- **Contact / Collaborate** section
- Fully responsive (mobile/tablet/desktop)

## Tech Stack

- Pure HTML5 / CSS3 / Vanilla JS — no framework dependencies
- Google Fonts: Orbitron · Rajdhani · Share Tech Mono
- GSAP-style scroll scrubbing implemented with native scroll events + requestAnimationFrame

## Running Locally

Simply open `index.html` in a browser. No build step required.

For a live dev server:
```
npx serve .
# or
python -m http.server 8080
```

## Assets Required

Place in the root directory:
- `quvaultX.png` — the chip photo (already in repo)
- `quvaultx_progcrypto.pdf` — white paper PDF

## Author

Kiprop Yego — kiprop.yego@quvaultx.dev  
Independent Research | Chiplet Security Systems | QuVaultX  
Draft v0.2 · March 2026
