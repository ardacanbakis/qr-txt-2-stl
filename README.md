# STL Smith

> Generate ready-to-print STL files directly in your browser — no software, no sign-up, nothing to install.

**[→ Open STL Smith](https://ardacanbakis.github.io/stlSmith/)**

STL Smith is a browser-based 3D model generator for hobbyist makers and 3D printing enthusiasts. Type some text, paste a URL, or upload a photo — and get a print-ready STL file in seconds. Everything runs client-side; your designs never leave your machine.

---

## What You Can Make

### QR Code Plate
Turn any text, URL, or data string into a 3D QR code embedded on a base plate. Control error correction level (L/M/Q/H), add a text label below the code, and scale the plate to your preferred size. Works with any QR scanner app.

### Text Label
Emboss or engrave custom text onto a plate using Helvetica in regular, bold, italic, or bold-italic. Adjust font size, letter spacing, and alignment (left / center / right). Text automatically scales to fit the plate area, so you never need to worry about overflow.

### Nameplate
A two-line plate with a larger primary name and a smaller secondary line — perfect for desk nameplates, shelf labels, or cable tags. Font weight and size are independently configurable per line.

### Spotify Code
Paste any Spotify URL (track, album, artist, or playlist) and STL Smith fetches the real scannable Spotify code directly from Spotify's servers. The bar pattern is extruded as 3D geometry with the optional Spotify logo alongside it. Point your Spotify camera at it and it works exactly like the in-app code.

### WiFi Card
Enter your network name, password, and encryption type to generate a QR code that phones can scan to join your WiFi instantly — no typing required. Ideal for guest rooms, offices, or workshops.

### vCard / Contact Card
Turn your contact details (name, phone, email, organisation, website) into a scannable vCard QR code. Scan it once and all details import straight into the phone's contacts app.

### Barcode
Generate standard retail and industrial barcodes in CODE 39, CODE 128, EAN-13, EAN-8, or UPC-A format with an optional text caption below the bars.

### Lithophane
Upload any photo and STL Smith converts it into a lithophane — a thin translucent panel that reveals the image when held up to light. The image processing pipeline applies brightness, contrast, gamma correction, and sharpening to optimise the heightmap before generating the closed-volume 3D geometry. Print in white PETG or PLA, backlight it, and the photo appears.

### Image Silhouette
Upload a PNG or JPG and the app thresholds it to a black-and-white silhouette, then extrudes the solid shape onto a plate. Great for logos, icons, or custom shapes you've sketched.

---

## Customising Your Design

Every model shares a common set of options layered on top of the generator-specific settings.

**Base Plate**
Choose from rectangle, rounded rectangle, circle, or keychain shape. Set width, height, and thickness in millimetres. Edge treatment adds a fillet (smooth curve) or chamfer (angled cut) to the perimeter.

**Border Frame**
An optional raised frame around the content area. Configurable width, height, and colour — useful for multi-colour prints where the frame is one filament and the content is another.

**Content Mode**
Switch between embossed (content raised above the plate) and engraved (content cut into the plate). The content height slider controls how far it protrudes or recesses.

**Colours**
Each part of the model — base, border, content, text, secondary element, logo — has an independent colour picker. Colours are preview-only; for multi-colour prints, export as separate parts.

**Mounting**
Add practical attachment options to any model:
- Keychain tab with a punched hole
- Magnet recesses (6×3, 8×3, or 10×3 mm, or custom) at corners, edges, or centre
- Screw holes at configurable diameter and count
- Wall-mount keyhole slot on the back face
- Fridge magnet recess on the back face

---

## The 3D Preview

The interactive viewport updates live as you type or drag sliders. No "generate" button — every change is reflected immediately.

- **Orbit** — left-click drag to rotate
- **Pan** — right-click drag to move
- **Zoom** — scroll wheel

**View toolbar** (top of the preview) gives one-click presets for top, front, back, left, right, and bottom views, plus home, fit, zoom in/out, grid toggle, dark/light mode toggle, and fullscreen.

**Build plate overlay** — select your printer model (Bambu H2D, A1, A1 Mini, X1C, P1S, or custom size) to see a to-scale grid floor beneath your model.

**Dimension overlay** (bottom-left corner) shows the model footprint in mm, content height, and a rough material weight estimate in grams (PLA density).

**Keyboard shortcuts:**

| Key | Action |
|---|---|
| `G` | Toggle grid |
| `D` | Toggle dark / light mode |
| `T` | Jump to top view |
| `F` | Fit / home view |
| `[` / `]` | Zoom out / in |
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | Redo |
| `Ctrl+E` / `Cmd+E` | Export STL |

---

## Exporting

Hit **Download STL** in the sidebar footer to export a single merged file — ready to slice and print.

Enable **Separate Parts** to download a ZIP archive with one STL per colour part (base, border, content, text, logo, etc.). Load each file as a separate object in your slicer, assign the filament colour, and print in one job using a multi-material printer or by doing filament swaps.

Toggle **ASCII STL** if you need a human-readable text format instead of the default binary — useful for debugging or importing into certain older tools.

STL Smith validates the geometry before downloading and will warn you if it detects NaN vertices or degenerate triangles that might cause slicer issues.

Your design is automatically saved in your browser's local storage. Come back later and it'll be exactly where you left it — no account required.

---

## How It Was Built

STL Smith started as a straightforward question: can you skip Blender entirely and generate print-ready geometry in the browser? The answer turned out to be yes, and the implementation is leaner than you might expect.

**React + TypeScript + Vite** handles the UI and state. All configuration lives in a single typed `ModelConfig` object managed by a custom `useModelConfig` hook with a 50-step undo/redo history.

**Three.js** is the geometry engine. Each generator produces a `THREE.BufferGeometry` directly — no intermediate mesh format. `@react-three/fiber` mounts the geometries into a React-managed WebGL canvas, and `@react-three/drei` provides orbit controls, the gizmos, and the font loader.

**STL export** is handled by Three.js's built-in `STLExporter`, which serialises the scene geometry directly to binary STL — no round-tripping through a server. The multi-part ZIP is built with a hand-written stored-ZIP encoder (no compression, no external library) so there are zero extra dependencies for export.

**Generator architecture** — each of the 9 generators is a pure TypeScript function that takes a config object and returns geometry:

- *QR codes* are generated as a boolean matrix by `qrcode-generator`, then each dark module becomes a box merged into a single `BufferGeometry` via index arithmetic
- *Text* uses Three.js's `TextGeometry` with Helvetiker typeface JSON, with a custom italic-shear transform applied post-build and a `fitTextToWidth` pass to keep text within the plate content area
- *Spotify* fetches the real SVG from Spotify's CDN (`scannables.scdn.co`), parses it with `SVGLoader`, and extrudes the vector paths directly — keeping the bars perfectly crisp at any size
- *Lithophane* runs an image-processing pipeline (brightness → contrast → gamma → unsharp mask via separable Gaussian blur) before mapping pixel brightness to wall thickness, then builds a closed manifold volume (front heightmap + flat back + four walls) with baked vertex colours for the backlit preview mode
- *Barcode* encodes bar patterns directly from the spec (CODE 39 character table, EAN check digit) into an array of width flags, then merges bar quads into a single geometry

**Tailwind CSS v4** handles all styling. The layout is desktop-first with a dual-sidebar option and a responsive mobile fallback (stacked column with a 55 vh settings sheet).

**Firebase** is optional — if you configure a project's credentials, Google sign-in unlocks cloud save/load for your designs via Firestore.

---

## Credits

Built by [Arda Canbakis](https://ardacanbakis.com)

[![GitHub](https://img.shields.io/badge/GitHub-ardacanbakis-181717?logo=github&style=flat-square)](https://github.com/ardacanbakis)
[![Instagram](https://img.shields.io/badge/Instagram-arda.canbakiss-E4405F?logo=instagram&logoColor=white&style=flat-square)](https://www.instagram.com/arda.canbakiss/)
[![YouTube](https://img.shields.io/badge/YouTube-arda.canbakis-FF0000?logo=youtube&style=flat-square)](https://www.youtube.com/@arda.canbakis)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-ardacanbakis-0A66C2?logo=linkedin&style=flat-square)](https://linkedin.com/in/ardacanbakis)
