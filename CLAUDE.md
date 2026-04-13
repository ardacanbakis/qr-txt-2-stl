# QR-TXT-2-STL - Project Reference

> A web app to generate ready-to-print STL files from text, QR codes, links (Spotify, URLs), and more.
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
| **Repo** | ardacanbakis/qr-txt-2-stl | Branch: claude/stl-generator-webapp-IHm9I |
| **UI Layout** | Desktop-first, side-by-side (settings left, 3D preview right) | Responsive-friendly design for future mobile/tablet support |

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
│   ├── App.tsx                  # Root component, wires hooks ↔ sidebar ↔ preview, handles export
│   ├── components/
│   │   ├── layout/
│   │   │   └── Sidebar.tsx           # Left settings panel (dispatcher by generator type)
│   │   ├── settings/
│   │   │   ├── GeneratorTabs.tsx     # 9-tab generator type selector
│   │   │   ├── GeneratorSettings.tsx # All per-generator settings panels
│   │   │   ├── BaseSettings.tsx      # Base plate shape/size/thickness
│   │   │   ├── ModelSettings.tsx     # Content height, magnet holes, mounting
│   │   │   └── ExportSettings.tsx    # STL export options, separateParts toggle
│   │   ├── preview/
│   │   │   ├── Preview3D.tsx         # R3F Canvas wrapper, camera controller, view presets
│   │   │   ├── ViewToolbar.tsx       # Floating 3D toolbar (views, zoom, grid, theme, fullscreen, plate)
│   │   │   ├── buildPlates.ts        # BuildPlate type + BUILD_PLATES presets (H2D, A1, X1C...)
│   │   │   └── GeneratedModel.tsx    # Dispatcher: routes config.generator → sub-components
│   │   └── shared/
│   │       ├── Slider.tsx
│   │       ├── Select.tsx
│   │       ├── Toggle.tsx
│   │       ├── NumberInput.tsx
│   │       └── SectionHeader.tsx
│   ├── generators/
│   │   ├── qr-generator.ts          # QR code matrix → 3D geometry
│   │   ├── text-generator.ts        # Text → 3D geometry (three-stdlib TextGeometry + italic shear)
│   │   ├── spotify-generator.ts     # Spotify-style bar pattern from URL hash
│   │   ├── barcode-generator.ts     # CODE 39 barcode → 3D bars
│   │   ├── image-generator.ts       # Image → grayscale grid → silhouette with row-run merging
│   │   ├── lithophane-generator.ts  # Heightmap lithophane (closed volume with walls)
│   │   ├── base-generator.ts        # Base plate geometry (rect, round, keychain)
│   │   └── stl-exporter.ts          # exportSTL + exportSeparateParts (by userData.part tags)
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

Generators not yet migrated to their own file (still inline in `GeneratedModel.tsx`
sub-components): WiFi, vCard, Nameplate — these reuse the QR and Text generators.

---

## Feature Specifications

### Generator Types (9 total, selected via tabs in sidebar)
1. **QR Code** → Plain text / URL encoded as QR matrix → extruded modules on plate
2. **Text Label** → Custom embossed/engraved 3D text (regular / bold / italic / bold-italic)
3. **Spotify** → Spotify URL → deterministic scan-style bar pattern + circular logo
4. **WiFi** → SSID + password + encryption → WiFi-URI QR code (optional label)
5. **vCard** → Contact fields → vCard-string QR code (optional name label)
6. **Barcode** → CODE 39 (CODE 128 / EAN-13 fall back to CODE 39) with optional text caption
7. **Image Silhouette** → Upload image → threshold → extruded pixel silhouette
8. **Lithophane** → Upload photo → grayscale heightmap closed-volume print
9. **Nameplate** → Primary + secondary text on a plate, styled font
*(Calendar generator deferred — not yet implemented.)*

### Base Plate Options
- **Shapes**: Rectangle, Rounded Rectangle, Circle, Custom (keychain w/ hole)
- **Dimensions**: Width (mm), Height (mm), Thickness (mm) — all user-configurable
- **Border**: Configurable border width around content
- **Keychain Hole**: Toggle + diameter setting

### 3D Model Customization
- **Content Height**: How much the QR/text protrudes above (or into) the base
- **Mode**: Embossed (raised) or Engraved (recessed)
- **Magnet Holes**: Toggle + diameter + depth (standard 6x3mm, 8x3mm, 10x3mm presets)
- **Magnet Hole Positions**: Corners, edges, center, or custom count
- **Mounting Options**: Screw holes, wall mount bracket, fridge magnet recess
- **Fillet/Chamfer**: Edge treatment on base plate

### Export Options
- **Single STL**: Combined model, one file
- **Separate parts**: Downloads one STL per tagged part (`base`, `border`, `content`, `text`, `secondary`, `logo`) — ideal for multi-color / dual-extrusion prints. Meshes are tagged via `userData.part` and grouped by the exporter.
- **Units**: Millimeters (always)
- **Quality**: Low/Medium/High polygon count

### 3D Preview
- Z-up CAD-style camera with orbit / pan / zoom
- Animated view presets (Top / Bottom / Front / Back / Left / Right / Home / Fit)
- ViewCube + axis gizmo, dark/light toggle, fullscreen, grid toggle
- Build plate presets (Bambu H2D, A1, A1 Mini, X1C, P1S) as a sized grid floor
- Real-time updates via React state + `useMemo`-cached geometries
- Async font loading via drei's `useFont` wrapped in `<Suspense>` inside the Canvas

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
- [ ] Add edge treatment (fillet/chamfer) on base plate

### Phase 4: Additional Input Types
- [x] WiFi credential input (SSID, password, encryption type)
- [x] vCard input (name, phone, email, address fields)
- [x] Spotify link parsing → Spotify scan code geometry
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
- [ ] Combined QR + text on same plate option

### Phase 6: Advanced Model Features
- [x] Magnet hole geometry (CSG boolean subtract)
- [x] Magnet hole presets (6x3mm, 8x3mm, 10x3mm)
- [x] Magnet hole position options (corners / edges / center)
- [ ] Screw hole option
- [ ] Wall mount bracket geometry
- [ ] Fridge magnet recess option
- [x] Separate-parts STL export (by `userData.part` tags)

### Phase 7: Firebase Integration
- [ ] Set up Firebase project + config
- [ ] Implement optional Firebase Auth (Google sign-in)
- [ ] Save/load project configurations to Firestore
- [ ] User dashboard for saved projects
- [ ] Deploy to Firebase Hosting

### Phase 8: Polish & UX
- [ ] Responsive sidebar collapse for smaller screens
- [ ] Loading states and progress indicators for STL export
- [ ] Dimension annotation overlays on 3D preview
- [ ] Preset templates (business card QR, WiFi sign, Spotify keychain, etc.)
- [ ] Undo/redo for settings changes
- [ ] Keyboard shortcuts for common actions
- [ ] Dark/light mode toggle

### Phase 9: Map STL Generation (Future)
- [ ] Research map data sources (OpenStreetMap, Mapbox, elevation APIs)
- [ ] Region selection UI (map widget with bounding box)
- [ ] Terrain elevation → heightmap → 3D relief mesh
- [ ] Street/building layout → extruded geometry
- [ ] Server-side generation via Firebase Cloud Functions (heavy computation)
- [ ] Progress indicator for server-side generation
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
git push -u origin claude/stl-generator-webapp-IHm9I
```

---

## Design Guidelines

- **Desktop-first** layout: settings sidebar (350-400px) on left, 3D preview fills remaining space
- **Color scheme**: Dark sidebar, light preview area (or dark mode toggle later)
- **Typography**: System font stack for UI, clean and minimal
- **Settings organization**: Collapsible sections in sidebar (Input, Base, Model, Export)
- **Preview controls**: Orbit (left drag), Pan (right drag), Zoom (scroll)
- **Responsive strategy**: Sidebar becomes bottom sheet or full-screen overlay on mobile (Phase 8)

---

## Key Technical Notes

1. **STL Generation is client-side**: The Three.js scene IS the model. STLExporter serializes the scene geometry directly. No server round-trip needed.
2. **CSG Operations** (for magnet holes, keyholes): Use `three-bvh-csg` or `three-csg-ts` for boolean subtract operations on meshes.
3. **Spotify Codes**: These are NOT QR codes. They use a barcode-like visual format. We need to reverse-engineer or use Spotify's embed API to get the code pattern.
4. **Performance**: For complex models, use `useMemo` to cache geometry and only recompute when relevant settings change.
5. **Multi-material export**: Generate two separate STL files — one for the base plate, one for the raised/recessed content. Users load both into their slicer and assign different materials.
