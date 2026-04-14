import { loadImagePixels, type PixelGrid } from './image-generator';

/**
 * Real Spotify scannables fetched directly from `scannables.scdn.co`.
 * The endpoint serves CORS-enabled SVG containing 23 bars + the Spotify
 * logo. We rasterize the SVG to a pixel grid and hand it off to the
 * existing silhouette geometry builder — no SVG-path → extrude gymnastics.
 */

const SCANNABLES_ENDPOINT = 'https://scannables.scdn.co/uri/plain/svg';

/**
 * Parse any Spotify input (URL, URI, or ID) into a canonical `spotify:type:id`.
 * Accepts:
 *   - spotify:track:4uLU6hMCjMI75M1A2tKUQC
 *   - https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=...
 *   - https://open.spotify.com/intl-en/album/4uLU6hMCjMI75M1A2tKUQC
 */
export function parseSpotifyUri(input: string): string | null {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;

  if (/^spotify:[a-z]+:[a-zA-Z0-9]+$/.test(trimmed)) return trimmed;

  const m = trimmed.match(
    /spotify\.com\/(?:intl-[a-z-]+\/)?([a-z]+)\/([a-zA-Z0-9]+)/i,
  );
  if (m) return `spotify:${m[1].toLowerCase()}:${m[2]}`;

  return null;
}

/**
 * Fetch the Spotify scannable SVG. `scannables.scdn.co` serves
 * `Access-Control-Allow-Origin: *` so the direct fetch works in-browser.
 */
export async function fetchSpotifySvg(uri: string): Promise<string> {
  const url = `${SCANNABLES_ENDPOINT}/000000/white/640/${encodeURIComponent(uri)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Spotify scannable fetch failed (${response.status})`);
  }
  return response.text();
}

/**
 * Convert an SVG string into a base64 data URL safe for use as an `<img>` src.
 * Uses `encodeURIComponent` + `unescape` to handle non-latin characters.
 */
function svgToDataUrl(svgText: string): string {
  // encode to latin-1-safe base64
  const encoded = btoa(unescape(encodeURIComponent(svgText)));
  return `data:image/svg+xml;base64,${encoded}`;
}

/**
 * Fetch a Spotify scannable, rasterize it at the given resolution, and
 * return the pixel grid. When `showLogo` is false, the leftmost ~22% of
 * the grid (where the Spotify logo sits) is zeroed out so only the bars
 * end up as content.
 */
export async function loadSpotifyPixels(
  uri: string,
  resolution: number,
  showLogo: boolean,
): Promise<PixelGrid> {
  const svgText = await fetchSpotifySvg(uri);
  const dataUrl = svgToDataUrl(svgText);
  const pixels = await loadImagePixels(dataUrl, resolution);

  if (!showLogo) {
    // Zero out (=black=background) the logo band on the left. Because the
    // silhouette generator will be called with invert:true, background
    // pixels map to "no content" — the logo disappears.
    const cutoff = Math.floor(pixels.width * 0.22);
    for (let y = 0; y < pixels.height; y++) {
      const rowStart = y * pixels.width;
      for (let x = 0; x < cutoff; x++) {
        pixels.data[rowStart + x] = 0;
      }
    }
  }

  return pixels;
}
