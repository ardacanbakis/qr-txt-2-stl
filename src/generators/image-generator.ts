export interface PixelGrid {
  width: number;
  height: number;
  data: Float32Array;
}

export async function loadImagePixels(dataUrl: string, maxResolution: number): Promise<PixelGrid> {
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
  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);

  const data = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = imgData.data[i * 4];
    const g = imgData.data[i * 4 + 1];
    const b = imgData.data[i * 4 + 2];
    const a = imgData.data[i * 4 + 3] / 255;
    const gray = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    data[i] = gray * a + (1 - a);
  }

  return { width: w, height: h, data };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
