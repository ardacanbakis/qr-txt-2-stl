# STL Generator - Project Reference

> A web app to generate ready-to-print STL files from text, QR codes, images, Spotify codes, barcodes, lithophanes, and more.
> Future: map-based terrain/street STL generation.

---

## Architecture Decisions

| Decision | Choice | Notes |
|---|---|---|
| **Framework** | React + TypeScript + Vite | Matches team experience (daily-tracker) |
| **Styling** | Tailwind CSS | Utility-first, fast iteration |
| **3D Engine** | Three.js (via @react-three/fiber + @react-three/drei) | Live interactive preview |
| **STL Generation** | Client-side (Three.js STLExporter) | No backend needed for MVP |
| **QR Generation** | qrcode-generator (client-side) | Lightweight, no server dependency |
| **Auth** | Firebase Auth (optional) | Users CAN sign in to save/load projects, app works without login |
| **Hosting** | Firebase Hosting | Already familiar from daily-tracker |
| **Repo** | ardacanbakis/qr-txt-2-stl | Branch: claude/stl-generator-webapp-IHm9I (pushed as origin/claude) |
| **UI Layout** | Desktop-first; single or dual sidebar toggle | Single: left sidebar only. Dual: left (generator+model+colors) + right (base+mounting) |

---

## Tech Stack

### Core Dependencies
- `react`, `react-dom` - UI framework
- `typescript` - Type safety
- `vite` - Build tool
- `tailwindcss` - Styling
- `three` - 3D rendering engine
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers for R3F
- `three-stdlib` - STLExporter and other utilities

### Feature-Specific Libraries
- `qrcode-generator` - QR code matrix generation
- `three-stdlib` - TextGeometry + FontLoader (used via drei's `useFont`) + OrbitControls + STLExporter
- `firebase` v12 - Auth + Hosting + Firestore (project saves, env-variable driven)

### Dev Dependencies
- `@types/three` - Three.js types
- `postcss`, `autoprefixer` - Tailwind processing
- `eslint` - Linting

---

## Project Structure

```
qr-txt-2-stl/
├── CLAUDE.md                    # This file - project reference
├── public/
│   ├── favicon.svg              # Site favicon (3D plate + QR pattern)
│   └── fonts/                   # helvetiker_regular + _bold typeface JSON
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root: layout state, wires hooks ↔ sidebars ↔ preview, welcome screen
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # Left panel: header + generator tabs + settings
│   │   │   │                         #   Single mode: all sections. Dual mode: generator + model + colors.
│   │   │   ├── RightPanel.tsx        # Right panel (dual mode only): base plate + mounting
│   │   │   ├── TemplatesPanel.tsx    # 8-preset template modal
│   │   │   ├── FirebasePanel.tsx     # Google sign-in + project save/load/delete modal
│   │   │   └── WelcomeScreen.tsx     # First-visit onboarding (localStorage-gated)
│   │   ├── settings/
│   │   │   ├── GeneratorTabs.tsx     # 9-tab generator type selector
│   │   │   ├── GeneratorSettings.tsx # All per-generator settings panels
│   │   │   ├── BaseSettings.tsx      # Base plate shape/size/thickness/edge treatment
│   │   │   ├── ModelSettings.tsx     # Content mode (embossed/engraved) + content height
│   │   │   ├── MountingSettings.tsx  # Keychain hole, magnets, screws, wall mount, fridge magnet
│   │   │   └── ColorSettings.tsx     # Per-generator color slots
│   │   ├── preview/
│   │   │   ├── Preview3D.tsx         # R3F Canvas wrapper, camera controller, view presets
│   │   │   ├── ViewToolbar.tsx       # Horizontal top-bar toolbar (views, undo/redo, zoom, toggles, plate)
│   │   │   ├── buildPlates.ts        # BuildPlate type + BUILD_PLATES presets (H2D, A1, X1C...)
│   │   │   └── GeneratedModel.tsx    # Dispatcher: routes config.generator → sub-components
│   │   └── shared/
│   │       ├── Slider.tsx            # Slider + inline number input (editable)
│   │       ├── Select.tsx
│   │       ├── Toggle.tsx
│   │       ├── NumberInput.tsx
│   │       └── SectionHeader.tsx
│   ├── generators/
│   │   ├── qr-generator.ts          # QR code matrix → 3D geometry
│   │   ├── text-generator.ts        # Text → 3D geometry (three-stdlib TextGeometry + italic shear)
│   │   ├── spotify-generator.ts     # Fetches real scannables from scdn.co, rasterizes SVG → pixel grid
│   │   ├── barcode-generator.ts     # CODE 39 barcode → 3D bars
│   │   ├── image-generator.ts       # Image → grayscale grid → silhouette with row-run merging
│   │   ├── lithophane-generator.ts  # Heightmap lithophane (closed volume with walls)
│   │   ├── base-generator.ts        # Base plate geometry + keychain tab + mounting indicator helpers
│   │   ├── plate-presets.ts         # Per-generator default plate size/shape presets
│   │   └── stl-exporter.ts          # exportSTL (single) + exportSeparateParts (ZIP of per-part STLs)
│   ├── firebase/
│   │   ├── config.ts                # Firebase app init (env-variable driven, gracefully disabled)
│   │   ├── auth.ts                  # Google sign-in/out helpers
│   │   └── projects.ts             # Firestore CRUD for saved project configs
│   ├── hooks/
│   │   └── useModelConfig.ts        # Central state + 50-step undo/redo history + per-generator updaters
│   └── types/
│       └── model.ts                 # TypeScript interfaces for model config + DEFAULT_CONFIG
├── .env.example                     # Firebase env variable placeholders
├── index.html
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Feature Specifications

### Generator Types (9 total, selected via tabs in sidebar)
1. **QR Code** → Plain text / URL encoded as QR matrix → extruded modules on plate
2. **Text Label** → Custom embossed/engraved 3D text (regular / bold / italic / bold-italic)
3. **Spotify** → Real Spotify scannable SVG fetched from `scannables.scdn.co`, rasterized to pixel grid, extruded as silhouette geometry (separate bars + logo meshes for independent coloring)
4. **WiFi** → SSID + password + encryption → WiFi-URI QR code (optional label)
5. **vCard** → Contact fields → vCard-string QR code (optional name label)
6. **Barcode** → CODE 39 (CODE 128 / EAN-13 fall back to CODE 39) with optional text caption
7. **Image Silhouette** → Upload image → threshold → extruded pixel silhouette
8. **Lithophane** → Upload photo → grayscale heightmap closed-volume print
9. **Nameplate** → Primary + secondary text on a plate, styled font

### Base Plate Options
- **Shapes**: Rectangle, Rounded Rectangle, Circle, Keychain (built-in tab + hole)
- **Dimensions**: Width (mm), Height (mm), Thickness (mm) — all user-configurable
- **Border Frame**: Physical raised frame on top of base plate surrounding content. Toggle on/off, configurable width (also controls content padding), height, and color. Enabled by default. Tagged `part: 'border'` for separate-part STL export. Generated via ExtrudeGeometry with inner hole (outer plate shape minus inset content area).
- **Edge Treatment**: None, Fillet (rounded), or Chamfer (angled) via ExtrudeGeometry bevel
- **Keychain Tab**: For non-keychain shapes, toggle adds a physical semicircular tab with punched hole (same material as base, exports as part of base STL)

### Mounting Options
- **Keychain Hole**: Toggle + diameter (adds physical tab geometry to base)
- **Magnet Holes**: Toggle + diameter + depth (6x3, 8x3, 10x3 presets or custom) + position (corners/edges/center)
- **Screw Holes**: Toggle + diameter + count (corner positions, red indicators)
- **Wall Mount Keyhole**: Toggle + keyhole width (back-face slot indicator)
- **Fridge Magnet Recess**: Toggle + width/height/depth (back-face rectangle indicator)

### Export Options
- **Single STL**: Combined model, one file
- **Separate parts → ZIP**: All parts (base, content, text, etc.) bundled in a single ZIP; pure JS zip builder, no external dependency. Ideal for multi-color / dual-extrusion prints.
- **Units**: Millimeters (always)
- **Export button + separate parts toggle** pinned at bottom of both sidebars (always visible)

### 3D Preview
- Z-up CAD-style camera with orbit / pan / zoom
- **Horizontal toolbar at top**: view presets (top/front/left/right/back/bottom), home/fit, zoom, grid/theme/fullscreen toggles, build plate selector, undo/redo
- View preset buttons reset OrbitControls target to origin before animating
- ViewCube (bottom-left) + axis gizmo (bottom-right)
- Dark/light mode toggle, fullscreen, grid toggle
- Build plate presets (Bambu H2D, A1, A1 Mini, X1C, P1S) as a sized grid floor
- Dimension overlay at bottom-left (width × height × thickness, content height, build plate name)
- Real-time updates via React state + `useMemo`-cached geometries
- Async font loading via drei's `useFont` wrapped in `<Suspense>` inside the Canvas

### Layout Modes
- **Single sidebar** (default, 380px): Generator → Model (content settings + mounting) → Base Plate → Colors → [pinned export]
- **Dual sidebar**: Left (300px) = Generator → Model (content only) → Colors → [pinned export]. Right (280px) = Base Plate → Mounting → [portfolio credit + pinned export]
- Toggle button in sidebar header switches between modes
- Sidebar can be collapsed to a 40px icon strip
- Portfolio credit footer (ardacanbakis.com) only shown on right panel in dual mode

### Welcome Screen
- Full-screen onboarding for first-time visitors (localStorage-gated)
- Two steps: intro with logo → feature highlights with "Get Started" button
- Portfolio credit footer (ardacanbakis.com)

### Firebase Integration
- Optional Google sign-in via popup (gracefully hidden when env vars not configured)
- Save/load/delete project configurations to Firestore
- Project dashboard modal overlaid on viewport (top-right button)

---

## Phased Development Checklist

### Phase 1–7: Complete
All foundation, generators (9 types), base plate customization, text labels, advanced model features, and UX polish are implemented.

### Phase 8: Firebase Integration
- [x] Set up Firebase project + config (env-variable driven, gracefully disabled if not configured)
- [x] Implement optional Firebase Auth (Google sign-in via popup)
- [x] Save/load project configurations to Firestore
- [x] User dashboard for saved projects (modal with save/load/delete, overlaid on viewport)
- [ ] Deploy to Firebase Hosting (run `firebase deploy` after configuring .env)

### Phase 9: Map STL Generation (Future)
- [ ] Research map data sources (OpenStreetMap, Mapbox, elevation APIs)
- [ ] Region selection UI (map widget with bounding box)
- [ ] Terrain elevation → heightmap → 3D relief mesh
- [ ] Street/building layout → extruded geometry
- [ ] Server-side generation via Firebase Cloud Functions (heavy computation)
- [ ] Map STL customization (scale, exaggeration, base thickness)

---

## Commands

```bash
# Development
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build locally

# Firebase
firebase deploy      # Deploy to Firebase Hosting
firebase serve       # Local Firebase emulator

# Git
git checkout claude/stl-generator-webapp-IHm9I
git push origin claude/stl-generator-webapp-IHm9I:claude   # remote branch is named "claude"
```

---

## Design Guidelines

- **Desktop-first** layout: settings sidebar (380px single / 300px dual) on left, 3D preview fills remaining space, optional right panel (280px) in dual mode
- **Color scheme**: Dark sidebar (`bg-gray-800`), dark/light preview toggle
- **Toolbar**: Horizontal pill-group bar at the top of the 3D viewport
- **Sliders**: Always paired with an inline editable number input
- **Preview controls**: Orbit (left drag), Pan (right drag), Zoom (scroll)
- **Export**: Always-visible pinned footer at bottom of both sidebars (toggle + button)

---

## Key Technical Notes

1. **STL Generation is client-side**: The Three.js scene IS the model. STLExporter serializes the scene geometry directly. No server round-trip needed.
2. **ZIP export**: Implemented as a pure JS stored-zip builder (no compression, no external deps). CRC-32 computed inline. Meshes tagged with `userData.part` ('base', 'border', 'content', 'text', 'secondary', 'logo') are grouped per tag. Meshes tagged `'ignore'` (red indicators) are excluded.
3. **Spotify Codes**: Real scannables fetched from `scannables.scdn.co/uri/plain/svg/000000/white/640/{uri}` (CORS enabled). SVG parsed by SVGLoader, vector shapes extruded directly (no rasterization). Returns `SpotifyGeometries { bars, logo }` for independent coloring. Logo mesh is offset +0.01mm in Z to prevent z-fighting with bars.
4. **Keychain tab**: For the dedicated "keychain" base shape, the tab + hole is part of the ExtrudeGeometry shape (hole via `shape.holes`). For other shapes with `keychainHole` toggle, `createKeychainTabGeometry` generates a standalone semicircular tab (2mm wall around hole) positioned at the plate's top edge, tagged `part: 'base'` for STL export.
5. **Edge treatment**: Fillet and chamfer are implemented via ExtrudeGeometry `bevelEnabled` + `bevelSegments` (4 for fillet, 1 for chamfer). Rectangle base switches from BoxGeometry to ExtrudeGeometry when bevel is enabled.
6. **Undo/redo**: 50-step history stored as `useRef`-based array in `useModelConfig`. A `historyVer` state counter forces re-renders when `canUndo`/`canRedo` change. Buttons in ViewToolbar.
7. **Performance**: `useMemo`-cached geometries per generator. Async loads (Spotify fetch, image load) use `useEffect` + state with cancellation on cleanup.
8. **Camera system**: Z-up spherical coordinates with animated transitions (`easeOutCubic`). View presets defined as `{ phi, theta, up }`. Home = top view. All preset commands reset orbit target to origin.
9. **Z-fighting prevention**: Base plate material uses `polygonOffset` (factor=1, units=1) to push it behind content surfaces in the depth buffer. Spotify logo mesh has a +0.01mm Z offset above bars. These are preview-only fixes — STL export uses geometry positions only.
10. **Border frame geometry**: `createBorderFrameGeometry()` in base-generator.ts builds an outer plate outline Shape with an inner hole (inset by borderWidth), extruded to borderHeight. `createOutlineShape()` helper generates the outline for any base shape (rect, rounded-rect, circle, keychain). `BorderFrameMesh` in GeneratedModel.tsx positions it on the base surface.
11. **Font limitations**: Helvetiker typeface.json fonts (regular + bold) only contain ~208 basic Latin glyphs. Extended characters (Turkish ş/ı/ç/ö/ü/ğ, etc.) render as "?" — a known limitation. Switching fonts requires generating new typeface.json files.
