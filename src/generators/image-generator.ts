export interface PixelGrid {
  width: number;
  height: number;
  data: Float32Array;
}

export interface ImageProcessingOptions {
  brightness: number;  // -100 to +100
  contrast: number;    // -100 to +100
  gamma: number;       // 0.5 to 3.0 (1.8 is a good lithophane default)
  sharpen: number;     // 0 to 5 (unsharp mask strength)
  flipH: boolean;
  flipV: boolean;
}

export async function loadImagePixels(
  dataUrl: string,
  maxResolution: number,
  opts?: Partial<ImageProcessingOptions>,
): Promise<PixelGrid> {
  const img = await loadImage(dataUrl);
  const aspect = img.width / img.height;

  let w = maxResolution;
  let h = maxResolution;
  if (aspect > 1) h = Math.round(maxResolution / aspect);
  else w = Math.round(maxResolution * aspect);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Apply flips via canvas transform before drawing
  if (opts?.flipH || opts?.flipV) {
    ctx.translate(opts.flipH ? w : 0, opts.flipV ? h : 0);
    ctx.scale(opts.flipH ? -1 : 1, opts.flipV ? -1 : 1);
  }
  ctx.drawImage(img, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);

  const brightness = (opts?.brightness ?? 0) / 100;
  const contrast = opts?.contrast ?? 0;
  const gamma = Math.max(0.01, opts?.gamma ?? 1.0);
  // Map contrast -100..+100 → factor: 0 = no change, +100 = 3×, -100 = 0×
  const contrastFactor = contrast >= 0 ? 1 + (contrast / 100) * 2 : 1 + contrast / 100;

  const data = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = imgData.data[i * 4];
    const g = imgData.data[i * 4 + 1];
    const b = imgData.data[i * 4 + 2];
    const a = imgData.data[i * 4 + 3] / 255;
    // Perceptual grayscale; transparent pixels become white (max thickness → thin in litho)
    let v = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    v = v * a + (1 - a);

    // 1. Brightness (additive)
    v += brightness;

    // 2. Contrast (midpoint pivot at 0.5)
    v = (v - 0.5) * contrastFactor + 0.5;

    // 3. Gamma (power curve — values must be positive first)
    v = Math.pow(Math.max(0, v), gamma);

    data[i] = Math.min(1, Math.max(0, v));
  }

  // 4. Sharpen via unsharp mask
  const sharpenAmount = opts?.sharpen ?? 0;
  if (sharpenAmount > 0) {
    const blurred = gaussianBlur(data, w, h);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.min(1, Math.max(0, data[i] + sharpenAmount * (data[i] - blurred[i])));
    }
  }

  return { width: w, height: h, data };
}

// Separable Gaussian blur with σ≈1 (5-tap kernel)
function gaussianBlur(data: Float32Array, w: number, h: number): Float32Array {
  const kernel = [0.0625, 0.25, 0.375, 0.25, 0.0625];
  const r = 2;
  const tmp = new Float32Array(data.length);
  const out = new Float32Array(data.length);

  // Horizontal pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) {
        const xi = Math.min(w - 1, Math.max(0, x + k));
        sum += kernel[k + r] * data[y * w + xi];
      }
      tmp[y * w + x] = sum;
    }
  }

  // Vertical pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) {
        const yi = Math.min(h - 1, Math.max(0, y + k));
        sum += kernel[k + r] * tmp[yi * w + x];
      }
      out[y * w + x] = sum;
    }
  }

  return out;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
