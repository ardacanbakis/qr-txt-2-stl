# STL Smith

**Generate ready-to-print STL files directly in your browser — no software, no sign-up required.**

STL Smith turns text, QR codes, images, Spotify codes, barcodes, and more into customizable 3D-printable models with a real-time interactive preview.

**[Live Demo →](https://ardacanbakis.github.io/stlSmith/)**

---

## What You Can Make

| Generator | Description |
|---|---|
| **QR Code** | Any text or URL encoded as a 3D QR matrix on a base plate |
| **Text Label** | Custom embossed or engraved 3D text, regular / bold / italic |
| **Nameplate** | Primary + secondary text, styled on a decorative plate |
| **Spotify Code** | Real scannable Spotify code fetched live, extruded as geometry |
| **WiFi Card** | SSID + password encoded as a WiFi-URI QR code |
| **vCard / Contact** | Contact fields encoded as a vCard QR code |
| **Barcode** | CODE 39 barcode with optional caption |
| **Image Silhouette** | Upload an image → thresholded silhouette extruded onto a plate |
| **Lithophane** | Upload a photo → grayscale heightmap closed-volume print |

---

## How It Works

### 1. Pick a Generator
Select one of the 9 generator types from the left sidebar tabs. Each type has its own settings panel — enter your text, upload an image, or paste a Spotify URL.

### 2. Customize Your Design
- **Base plate** — rectangle, rounded rectangle, circle, or keychain shape; set width, height, and thickness in millimeters
- **Edge treatment** — none, fillet (smooth), or chamfer (angled)
- **Border frame** — optional raised frame around your content
- **Content mode** — embossed (raised) or engraved (recessed)
- **Colors** — set independent colors per part (base, content, border, text)
- **Mounting** — add magnet holes, screw holes, a keychain tab, wall-mount keyhole, or fridge magnet recess

### 3. Preview in Real Time
The interactive 3D viewport updates live as you change settings. Orbit with left-drag, pan with right-drag, and zoom with scroll. Use the toolbar to switch between top/front/side view presets, toggle the grid, switch dark/light mode, or overlay a printer build plate for scale reference.

### 4. Export and Print
Hit **Export STL** for a single merged file, or enable **Separate Parts** to download a ZIP with one STL per color (base, content, border, text, etc.) — ready for multi-color or dual-extrusion printing. Everything runs in the browser; nothing is uploaded to a server.

---

## Features

- **9 generator types** covering the most common 3D-print personalisation use cases
- **Client-side only** — geometry built with Three.js, exported with STLExporter; no backend
- **Real-time 3D preview** with orbit/pan/zoom, view presets, ViewCube, and axis gizmo
- **Multi-part ZIP export** — per-color STLs bundled with a pure-JS zip builder (no external dep)
- **Spotify integration** — fetches real scannables from Spotify's CDN, parses SVG, extrudes geometry
- **Fully parametric** — every dimension (mm), color, and mounting option is live-editable
- **Undo / redo** — 50-step history
- **Build plate overlay** — Bambu H2D, A1, A1 Mini, X1C, P1S presets for scale reference
- **Dark / light mode**, fullscreen, and collapsible sidebar
- **Optional Firebase save/load** — sign in with Google to save and reload projects (requires env config)

---

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| 3D engine | Three.js + @react-three/fiber + @react-three/drei |
| STL export | three-stdlib STLExporter |
| QR generation | qrcode-generator |
| Auth / save | Firebase Auth + Firestore (optional) |
| Hosting | GitHub Pages |

---

## Local Development

```bash
# Clone and install
git clone https://github.com/ardacanbakis/stlSmith.git
cd stlSmith
npm install

# Start the dev server
npm run dev         # http://localhost:5173

# Production build
npm run build

# Preview production build locally
npm run preview
```

### Firebase (optional)

Copy `.env.example` to `.env` and fill in your Firebase project credentials to enable Google sign-in and project save/load. The app works fully without this step.

---

## Project Structure

```
src/
├── App.tsx                    # Root layout, wires sidebar ↔ preview ↔ state
├── components/
│   ├── layout/                # Sidebar, RightPanel, WelcomeScreen, modals
│   ├── settings/              # Per-section settings panels (generator, base, model, colors, mounting)
│   ├── preview/               # 3D canvas, toolbar, build plates, model dispatcher
│   └── shared/                # Slider, Select, Toggle, NumberInput, SectionHeader
├── generators/                # Per-type geometry builders + STL/ZIP exporter
├── hooks/
│   └── useModelConfig.ts      # Central state + 50-step undo/redo
└── types/
    └── model.ts               # Config interfaces + DEFAULT_CONFIG
```

---

## Credits

Built by [Arda Canbakis](https://ardacanbakis.com)

[![GitHub](https://img.shields.io/badge/GitHub-ardacanbakis-181717?logo=github)](https://github.com/ardacanbakis)
[![Instagram](https://img.shields.io/badge/Instagram-arda.canbakiss-E4405F?logo=instagram&logoColor=white)](https://www.instagram.com/arda.canbakiss/)
[![YouTube](https://img.shields.io/badge/YouTube-arda.canbakis-FF0000?logo=youtube)](https://www.youtube.com/@arda.canbakis)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-ardacanbakis-0A66C2?logo=linkedin)](https://linkedin.com/in/ardacanbakis)
