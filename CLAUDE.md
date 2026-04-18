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
| **STL Generation** | Client-side (Three.js STLExporter) | No backend needed for MVP. Server-side (Firebase Cloud Functions) added later for maps |
| **QR Generation** | qrcode-generator (client-side) | Lightweight, no server dependency |
| **Auth** | Firebase Auth (optional) | Users CAN sign in to save/load projects, app works without login |
| **Hosting** | Firebase Hosting | Already familiar from daily-tracker |
| **Repo** | ardacanbakis/qr-txt-2-stl | Branch: claude/stl-generator-webapp-IHm9I (pushed as origin/claude) |
| **UI Layout** | Desktop-first; single or dual sidebar toggle | Single: left sidebar only. Dual: left (generator) + right (base/model/export) |

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
- `firebase` - Auth + Hosting + Firestore (project saves) — planned

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
│   └── fonts/                   # helvetiker_regular + _bold typeface JSON
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root component, layout state (single/dual), wires hooks ↔ sidebars ↔ preview
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # Left panel: header + layout toggle + generator tabs + generator settings
│   │   │   │                         #   (+ base/model/colors/export in single-sidebar mode)
│   │   │   └── RightPanel.tsx        # Right panel (dual mode only): base/model/colors/export
│   │   ├── settings/
│   │   │   ├── GeneratorTabs.tsx     # 9-tab generator type selector
│   │   │   ├── GeneratorSettings.tsx # All per-generator settings panels
│   │   │   ├── BaseSettings.tsx      # Base plate shape/size/thickness
│   │   │   ├── ModelSettings.tsx     # Content height, magnet holes, mounting
│   │   │   ├── ExportSettings.tsx    # STL export options, separateParts toggle, ZIP download
│   │   │   └── ColorSettings.tsx     # Per-generator color slots
│   │   ├── preview/
│   │   │   ├── Preview3D.tsx         # R3F Canvas wrapper, camera controller, view presets
│   │   │   ├── ViewToolbar.tsx       # Horizontal top-bar toolbar (views, nav, zoom, toggles, plate)
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
│   │   ├── base-generator.ts        # Base plate geometry (rect, round, keychain) + keychain hole helper
│   │   ├── plate-presets.ts         # Per-generator default plate size/shape presets
│   │   └── stl-exporter.ts          # exportSTL (single) + exportSeparateParts (ZIP of per-part STLs)
│   ├── hooks/
│   │   └── useModelConfig.ts        # Central state for all model parameters + per-generator updaters
│   └── types/
│       └── model.ts                 # TypeScript interfaces for model config + DEFAULT_CONFIG
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
3. **Spotify** → Real Spotify scannable SVG fetched from `scannables.scdn.co`, rasterized to pixel grid, extruded as silhouette geometry
4. **WiFi** → SSID + password + encryption → WiFi-URI QR code (optional label)
5. **vCard** → Contact fields → vCard-string QR code (optional name label)
6. **Barcode** → CODE 39 (CODE 128 / EAN-13 fall back to CODE 39) with optional text caption
7. **Image Silhouette** → Upload image → threshold → extruded pixel silhouette
8. **Lithophane** → Upload photo → grayscale heightmap closed-volume print
9. **Nameplate** → Primary + secondary text on a plate, styled font

### Base Plate Options
- **Shapes**: Rectangle, Rounded Rectangle, Circle, Custom (keychain w/ tab + hole built in)
- **Dimensions**: Width (mm), Height (mm), Thickness (mm) — all user-configurable
- **Border**: Configurable border width around content
- **Keychain Hole**: Toggle + diameter for non-keychain shapes (shown as red indicator in preview)

### 3D Model Customization
- **Content Height**: How much the QR/text protrudes above (or into) the base
- **Mode**: Embossed (raised) or Engraved (recessed)
- **Magnet Holes**: Toggle + diameter + depth (standard 6x3mm, 8x3mm, 10x3mm presets)
- **Magnet Hole Positions**: Corners, edges, center, or custom count

### Export Options
- **Single STL**: Combined model, one file
- **Separate parts → ZIP**: All parts (base, content, text, etc.) bundled in a single ZIP; pure JS zip builder, no external dependency. Ideal for multi-color / dual-extrusion prints.
- **Units**: Millimeters (always)
- **Quality**: Low/Medium/High polygon count (default: High)

### 3D Preview
- Z-up CAD-style camera with orbit / pan / zoom
- **Horizontal toolbar at top**: view presets, home/fit, zoom, grid/theme/fullscreen toggles, build plate selector
- Home / view preset buttons reset OrbitControls target to origin before animating (fixes "home doesn't work after pan")
- ViewCube (bottom-left) + axis gizmo (bottom-right), dark/light toggle, fullscreen, grid toggle
- Build plate presets (Bambu H2D, A1, A1 Mini, X1C, P1S) as a sized grid floor
- Real-time updates via React state + `useMemo`-cached geometries
- Async font loading via drei's `useFont` wrapped in `<Suspense>` inside the Canvas

### Layout Modes
- **Single sidebar** (default): full left sidebar with all settings panels
- **Dual sidebar**: left panel (generator input settings, 300px) + 3D preview (center) + right panel (base/model/colors/export, 280px)
- Toggle button in sidebar header switches between modes

### Shared UI Slider
- Every `<Slider>` renders both a range input (drag) and an inline number text input (type exact value + Enter/blur to commit). Clamped to min/max on commit.

---

## Phased Development Checklist

### Phase 1: Foundation & Core Setup
- [x] Initialize Vite + React + TypeScript project
- [x] Install and configure Tailwind CSS
- [x] Install Three.js + React Three Fiber + Drei
- [x] Create basic AppShell layout (sidebar + preview area)
- [x] Set up basic 3D canvas with orbit controls, grid, and lighting
- [x] Create shared UI components (Slider, Select, Toggle, NumberInput)
- [x] Define TypeScript types/interfaces for model configuration

### Phase 2: QR Code Generation (Core MVP)
- [x] Integrate qrcode-generator library
- [x] Build QR matrix → Three.js BoxGeometry converter
- [x] Create rectangular base plate geometry
- [x] Render QR code on base plate in 3D preview
- [x] Implement text/URL input field with live QR preview
- [x] Add error correction level selector (L, M, Q, H)
- [x] Implement STL export (single file) using STLExporter
- [x] Add download button with file naming

### Phase 3: Base Plate & Customization
- [x] Add base plate shape options (rectangle, rounded rect, circle)
- [x] Implement keychain hole option with diameter control
- [x] Add dimension controls (width, height, thickness in mm)
- [x] Add QR/content height (protrusion) control
- [x] Add border width control
- [x] Implement embossed vs engraved toggle
- [x] Add edge treatment (fillet/chamfer) on base plate

### Phase 4: Additional Input Types
- [x] WiFi credential input (SSID, password, encryption type)
- [x] vCard input (name, phone, email, address fields)
- [x] Spotify link → real scannables.scdn.co SVG → vector ExtrudeGeometry (separate logo + bars meshes, independent colors)
- [x] Input type selector tabs/dropdown in sidebar (9-tab GeneratorTabs)
- [x] Barcode (CODE 39) generator
- [x] Image silhouette generator
- [x] Lithophane generator
- [x] Nameplate generator

### Phase 5: Text Labels & Plates
- [x] Font loading via drei's useFont (three-stdlib TextGeometry)
- [x] Text → 3D extruded geometry pipeline
- [x] Font style selector (regular / bold / italic / bold-italic via shear matrix)
- [x] Text size, letter spacing, and centering
- [x] Combined QR + text on same plate option

### Phase 6: Advanced Model Features
- [x] Magnet hole geometry (visual indicator)
- [x] Magnet hole presets (6x3mm, 8x3mm, 10x3mm)
- [x] Magnet hole position options (corners / edges / center)
- [x] Keychain hole visual indicator in 3D preview
- [x] Separate-parts STL export → ZIP bundle (pure JS zip builder)
- [x] Screw hole visual indicators (corner cylinders)
- [x] Wall mount bracket geometry (keyhole slot indicator)
- [x] Fridge magnet recess option (back-face rectangle indicator)

### Phase 7: UX Polish
- [x] Rename app to "STL Generator"
- [x] Export quality default set to High
- [x] Horizontal viewport toolbar (top of preview, not left side panel)
- [x] Home/view preset buttons fix (reset OrbitControls target → no more wrong-angle home)
- [x] Dual sidebar layout toggle (generator left / model params right)
- [x] Slider inline number input (type exact value, Enter or blur to commit)
- [x] Responsive sidebar collapse (collapse/expand button in header)
- [x] Loading states for STL export (spinner, disabled button)
- [x] Dimension annotation overlay on 3D preview (pill bar at bottom of viewport)
- [x] Preset templates (8 templates: business card, WiFi sign, Spotify keychain, name tag, barcode label, contact coin, fridge magnet, lithophane)
- [x] Undo/redo for settings changes (50-step history, ⌘Z / ⌘⇧Z buttons in sidebar header)

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
- **Color scheme**: Dark sidebar, dark/light preview toggle
- **Toolbar**: Horizontal pill-group bar at the top of the 3D viewport
- **Sliders**: Always paired with an inline editable number input
- **Preview controls**: Orbit (left drag), Pan (right drag), Zoom (scroll)
- **Responsive strategy**: Sidebar becomes bottom sheet or full-screen overlay on mobile (Phase 8)

---

## Key Technical Notes

1. **STL Generation is client-side**: The Three.js scene IS the model. STLExporter serializes the scene geometry directly. No server round-trip needed.
2. **ZIP export**: Implemented as a pure JS stored-zip builder (no compression, no external deps). CRC-32 computed inline. STL files are already binary so compression wouldn't help much.
3. **Spotify Codes**: Real scannables fetched from `scannables.scdn.co/uri/plain/svg/000000/white/640/{uri}` (CORS enabled). SVG is rasterized via a `<canvas>` element and handed to the image silhouette geometry builder with `invert: true`.
4. **Keychain hole**: Shown as a red transparent cylinder indicator in the preview (cannot subtract geometry without CSG). The `createKeychainHoleGeometry` helper in `base-generator.ts` generates the correct dimensions for the slicer.
5. **Performance**: `useMemo`-cached geometries per generator. Async loads (Spotify fetch, image load) use `useEffect` + state with cancellation on cleanup.
6. **Home button fix**: All view-preset commands now call `controlsRef.current.target.set(0,0,0)` before animating, ensuring the camera always looks at the model center after panning.
