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
- `opentype.js` - Text-to-3D path conversion (for embossed/engraved text)
- `firebase` - Auth + Hosting + Firestore (project saves)

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
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root component + routing
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx     # Main layout (sidebar + preview)
│   │   │   ├── Sidebar.tsx      # Left settings panel
│   │   │   └── Header.tsx       # Top bar with logo, auth, export
│   │   ├── settings/
│   │   │   ├── InputSettings.tsx    # Input type selector + fields
│   │   │   ├── QRSettings.tsx       # QR-specific options
│   │   │   ├── TextSettings.tsx     # Text/label specific options
│   │   │   ├── SpotifySettings.tsx  # Spotify code options
│   │   │   ├── BaseSettings.tsx     # Base plate shape/size/thickness
│   │   │   ├── ModelSettings.tsx    # Height, magnet holes, mounting
│   │   │   └── ExportSettings.tsx   # STL export options, multi-material toggle
│   │   ├── preview/
│   │   │   ├── Preview3D.tsx        # R3F Canvas wrapper
│   │   │   ├── ModelViewer.tsx      # Camera, lights, controls
│   │   │   └── GeneratedModel.tsx   # The actual 3D model mesh
│   │   └── shared/
│   │       ├── Slider.tsx
│   │       ├── Select.tsx
│   │       ├── Toggle.tsx
│   │       └── NumberInput.tsx
│   ├── generators/
│   │   ├── qr-generator.ts         # QR code matrix → 3D geometry
│   │   ├── text-generator.ts       # Text → 3D geometry (opentype.js)
│   │   ├── spotify-generator.ts    # Spotify code → 3D geometry
│   │   ├── base-generator.ts       # Base plate geometry (rect, round, keychain)
│   │   ├── magnet-holes.ts         # Magnet hole geometry (CSG subtract)
│   │   └── stl-exporter.ts         # Three.js → STL file export (single + multi-material)
│   ├── hooks/
│   │   ├── useModelConfig.ts       # Central state for all model parameters
│   │   ├── useSTLExport.ts         # Export logic hook
│   │   └── useFirebaseAuth.ts      # Optional auth hook
│   ├── types/
│   │   └── model.ts                # TypeScript interfaces for model config
│   ├── utils/
│   │   ├── geometry.ts             # Shared geometry helpers
│   │   └── spotify-api.ts          # Spotify code parsing
│   └── firebase/
│       ├── config.ts               # Firebase initialization
│       └── projects.ts             # Save/load projects to Firestore
├── index.html
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── package.json
└── firebase.json
```

---

## Feature Specifications

### Input Types
1. **Plain Text / URL** → Encoded as QR code on a 3D plate
2. **WiFi Credentials** → SSID, password, encryption type → QR code
3. **Spotify Link** → Parsed into Spotify scan code visual
4. **vCard** → Contact info fields → QR code
5. **Custom Text Label** → Embossed or engraved 3D text plate

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
- **Multi-material STL**: Separate files for base and content (dual-extrusion)
- **Units**: Millimeters (always)
- **Quality**: Low/Medium/High polygon count

### 3D Preview
- Interactive orbit controls (rotate, pan, zoom)
- Grid floor + axis helpers
- Real-time updates as settings change
- Material colors for visualization (not affecting print)
- Dimension annotations (optional)

---

## Phased Development Checklist

### Phase 1: Foundation & Core Setup
- [ ] Initialize Vite + React + TypeScript project
- [ ] Install and configure Tailwind CSS
- [ ] Install Three.js + React Three Fiber + Drei
- [ ] Create basic AppShell layout (sidebar + preview area)
- [ ] Set up basic 3D canvas with orbit controls, grid, and lighting
- [ ] Create shared UI components (Slider, Select, Toggle, NumberInput)
- [ ] Define TypeScript types/interfaces for model configuration

### Phase 2: QR Code Generation (Core MVP)
- [ ] Integrate qrcode-generator library
- [ ] Build QR matrix → Three.js BoxGeometry converter
- [ ] Create rectangular base plate geometry
- [ ] Render QR code on base plate in 3D preview
- [ ] Implement text/URL input field with live QR preview
- [ ] Add error correction level selector (L, M, Q, H)
- [ ] Implement STL export (single file) using STLExporter
- [ ] Add download button with file naming

### Phase 3: Base Plate & Customization
- [ ] Add base plate shape options (rectangle, rounded rect, circle)
- [ ] Implement keychain hole option with diameter control
- [ ] Add dimension controls (width, height, thickness in mm)
- [ ] Add QR/content height (protrusion) control
- [ ] Add border width control
- [ ] Implement embossed vs engraved toggle
- [ ] Add edge treatment (fillet/chamfer) on base plate

### Phase 4: Additional Input Types
- [ ] WiFi credential input (SSID, password, encryption type)
- [ ] vCard input (name, phone, email, address fields)
- [ ] Spotify link parsing → Spotify scan code geometry
- [ ] Input type selector tabs/dropdown in sidebar

### Phase 5: Text Labels & Plates
- [ ] Integrate opentype.js for font loading
- [ ] Text → 3D extruded geometry pipeline
- [ ] Font selector (bundle 3-5 popular fonts)
- [ ] Text size, spacing, and alignment controls
- [ ] Combined QR + text on same plate option

### Phase 6: Advanced Model Features
- [ ] Magnet hole geometry (CSG boolean subtract)
- [ ] Magnet hole presets (6x3mm, 8x3mm, 10x3mm)
- [ ] Magnet hole position options (corners, edges, center, custom)
- [ ] Screw hole option
- [ ] Wall mount bracket geometry
- [ ] Fridge magnet recess option
- [ ] Multi-material STL export (separate base + content files)

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
