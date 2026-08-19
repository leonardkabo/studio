import { AdjustmentSettings, ExportOptions } from "../types";

/**
 * Applies professional photo adjustments to a Canvas in real-time.
 */
export function renderAdjustedCanvas(
  sourceImg: HTMLImageElement | HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  settings: AdjustmentSettings,
  renderScale: number = 1
): void {
  const sourceWidth = "naturalWidth" in sourceImg ? sourceImg.naturalWidth : sourceImg.width;
  const sourceHeight = "naturalHeight" in sourceImg ? sourceImg.naturalHeight : sourceImg.height;

  if (!sourceWidth || !sourceHeight) return;

  // Account for rotation (90 / 270 degrees swap width & height)
  const is90or270 = settings.rotation === 90 || settings.rotation === 270;
  const canvasWidth = Math.round((is90or270 ? sourceHeight : sourceWidth) * renderScale);
  const canvasHeight = Math.round((is90or270 ? sourceWidth : sourceHeight) * renderScale);

  targetCanvas.width = canvasWidth;
  targetCanvas.height = canvasHeight;

  const ctx = targetCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  ctx.save();
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Apply transformations: Center origin for rotation & flipping
  ctx.translate(canvasWidth / 2, canvasHeight / 2);
  if (settings.rotation !== 0) {
    ctx.rotate((settings.rotation * Math.PI) / 180);
  }
  ctx.scale(settings.flipH ? -1 : 1, settings.flipV ? -1 : 1);

  const drawWidth = (is90or270 ? canvasHeight : canvasWidth);
  const drawHeight = (is90or270 ? canvasWidth : canvasHeight);

  ctx.drawImage(sourceImg, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();

  // Pixel manipulation for non-linear color grading, exposure, temperature, shadows, highlights, skin smoothing, etc.
  const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imgData.data;
  const len = data.length;

  // Pre-calculate factor constants
  const expFactor = Math.pow(2, settings.exposure / 50); // -100..100 -> ~0.25..4.0
  const contrastFactor = (255 + settings.contrast * 2.55) / (255.001 - settings.contrast * 2.55);
  const satFactor = (settings.saturation + 100) / 100;
  const vibFactor = settings.vibrance / 100;

  // Temperature & Tint offsets
  const tempR = settings.temperature > 0 ? settings.temperature * 0.8 : 0;
  const tempB = settings.temperature < 0 ? -settings.temperature * 0.8 : 0;
  const tintG = settings.tint < 0 ? -settings.tint * 0.6 : 0;
  const tintM = settings.tint > 0 ? settings.tint * 0.6 : 0;

  // Highlights & Shadows
  const hlShift = settings.highlights * 0.6;
  const shShift = settings.shadows * 0.6;
  const whShift = settings.whites * 0.5;
  const blShift = settings.blacks * 0.5;

  const hasHslMod = Object.values(settings.hsl).some(
    (ch) => ch.hue !== 0 || ch.sat !== 0 || ch.lum !== 0
  );

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Exposure
    r *= expFactor;
    g *= expFactor;
    b *= expFactor;

    // 2. Temperature & Tint
    r += tempR;
    g += tintG - tintM;
    b += tempB + tintM;

    // 3. Luminance calculation
    let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // 4. Highlights, Shadows, Whites, Blacks
    if (lum > 160) { // Highlights
      const hlRatio = (lum - 160) / 95;
      const adj = hlShift * hlRatio + whShift * hlRatio;
      r += adj;
      g += adj;
      b += adj;
    } else if (lum < 95) { // Shadows
      const shRatio = (95 - lum) / 95;
      const adj = shShift * shRatio + blShift * shRatio;
      r += adj;
      g += adj;
      b += adj;
    }

    // 5. Contrast
    r = (r - 128) * contrastFactor + 128;
    g = (g - 128) * contrastFactor + 128;
    b = (b - 128) * contrastFactor + 128;

    // Re-calculate lum
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // 6. Saturation & Vibrance
    if (settings.saturation !== 0 || settings.vibrance !== 0) {
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const currentSat = maxC === 0 ? 0 : (maxC - minC) / maxC;

      // Vibrance affects less-saturated pixels more
      const effectiveSatFactor = satFactor + (1 - currentSat) * vibFactor;

      r = lum + (r - lum) * effectiveSatFactor;
      g = lum + (g - lum) * effectiveSatFactor;
      b = lum + (b - lum) * effectiveSatFactor;
    }

    // 7. HSL Channels adjustments if active
    if (hasHslMod) {
      const [h, s, l] = rgbToHsl(r, g, b);
      const channel = getHslChannel(h);
      const chSetting = settings.hsl[channel];
      if (chSetting) {
        let newH = h + chSetting.hue / 360;
        let newS = Math.max(0, Math.min(1, s + chSetting.sat / 100));
        let newL = Math.max(0, Math.min(1, l + chSetting.lum / 100));
        const [nr, ng, nb] = hslToRgb(newH, newS, newL);
        r = nr;
        g = ng;
        b = nb;
      }
    }

    // 8. Skin Smoothing (Gently softens contrast in skin-tone warm regions)
    if (settings.skinSmoothing > 0) {
      const isSkin = r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15;
      if (isSkin) {
        const smoothRatio = settings.skinSmoothing / 100;
        const avgSkin = (r + g + b) / 3;
        r = r * (1 - smoothRatio * 0.2) + avgSkin * (smoothRatio * 0.2);
        g = g * (1 - smoothRatio * 0.15) + avgSkin * (smoothRatio * 0.15);
        b = b * (1 - smoothRatio * 0.1) + avgSkin * (smoothRatio * 0.1);
      }
    }

    // Clamp values 0 - 255
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  // Put image data back
  ctx.putImageData(imgData, 0, 0);

  // 9. Vignette Effect
  if (settings.vignette !== 0) {
    const vigGrad = ctx.createRadialGradient(
      canvasWidth / 2,
      canvasHeight / 2,
      Math.min(canvasWidth, canvasHeight) * 0.3,
      canvasWidth / 2,
      canvasHeight / 2,
      Math.max(canvasWidth, canvasHeight) * 0.75
    );

    const alpha = Math.min(1, Math.abs(settings.vignette) / 100);
    if (settings.vignette < 0) {
      // Dark vignette
      vigGrad.addColorStop(0, "rgba(0,0,0,0)");
      vigGrad.addColorStop(1, `rgba(0,0,0,${alpha})`);
    } else {
      // White vignette
      vigGrad.addColorStop(0, "rgba(255,255,255,0)");
      vigGrad.addColorStop(1, `rgba(255,255,255,${alpha})`);
    }

    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // 10. Grain overlay
  if (settings.grain > 0) {
    const grainCanvas = document.createElement("canvas");
    grainCanvas.width = canvasWidth;
    grainCanvas.height = canvasHeight;
    const gCtx = grainCanvas.getContext("2d");
    if (gCtx) {
      const gImgData = gCtx.createImageData(canvasWidth, canvasHeight);
      const gData = gImgData.data;
      const grainIntensity = (settings.grain / 100) * 40;
      for (let i = 0; i < gData.length; i += 4) {
        const val = (Math.random() - 0.5) * grainIntensity;
        gData[i] = 128 + val;
        gData[i + 1] = 128 + val;
        gData[i + 2] = 128 + val;
        gData[i + 3] = 40;
      }
      gCtx.putImageData(gImgData, 0, 0);
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = (settings.grain / 100) * 0.5;
      ctx.drawImage(grainCanvas, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1.0;
    }
  }
}

/**
 * Calculates RGB and Luminance Histogram for display.
 */
export function calculateHistogram(canvas: HTMLCanvasElement): {
  r: number[];
  g: number[];
  b: number[];
  l: number[];
} {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);
  const l = new Array(256).fill(0);

  if (!ctx) return { r, g, b, l };

  const w = canvas.width;
  const h = canvas.height;
  if (w === 0 || h === 0) return { r, g, b, l };

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const step = Math.max(1, Math.floor((w * h) / 10000)); // Sample down for speed

  for (let i = 0; i < data.length; i += 4 * step) {
    const rv = data[i];
    const gv = data[i + 1];
    const bv = data[i + 2];
    const lv = Math.round(0.2126 * rv + 0.7152 * gv + 0.0722 * bv);

    r[rv]++;
    g[gv]++;
    b[bv]++;
    l[lv]++;
  }

  return { r, g, b, l };
}

/**
 * Renders Histogram graph to a target canvas
 */
export function renderHistogramGraph(
  histogramCanvas: HTMLCanvasElement,
  data: { r: number[]; g: number[]; b: number[]; l: number[] }
) {
  const ctx = histogramCanvas.getContext("2d");
  if (!ctx) return;

  const w = histogramCanvas.width;
  const h = histogramCanvas.height;

  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.fillRect(0, 0, w, h);

  const maxVal = Math.max(
    ...data.r,
    ...data.g,
    ...data.b,
    1
  );

  // Draw Channels with blending
  ctx.globalCompositeOperation = "screen";

  const drawChannel = (arr: number[], color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * w;
      const barH = (arr[i] / maxVal) * (h - 4);
      ctx.lineTo(x, h - barH);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  };

  drawChannel(data.r, "rgba(239, 68, 68, 0.4)");
  drawChannel(data.g, "rgba(34, 197, 94, 0.4)");
  drawChannel(data.b, "rgba(59, 130, 246, 0.4)");

  ctx.globalCompositeOperation = "source-over";
}

/**
 * Helper: Export high-resolution image with custom watermark and quality.
 */
export async function exportHighResImage(
  sourceImg: HTMLImageElement,
  settings: AdjustmentSettings,
  options: ExportOptions
): Promise<string> {
  const exportCanvas = document.createElement("canvas");
  renderAdjustedCanvas(sourceImg, exportCanvas, settings, options.scale);

  // Apply Watermark if requested
  if (options.watermarkText && options.watermarkText.trim()) {
    const ctx = exportCanvas.getContext("2d");
    if (ctx) {
      const fontSize = Math.max(16, Math.round(exportCanvas.width * 0.025));
      ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;

      const text = options.watermarkText.trim();
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const padding = fontSize * 0.8;

      let x = exportCanvas.width - textWidth - padding;
      let y = exportCanvas.height - padding;

      if (options.watermarkPosition === "bottom-left") {
        x = padding;
      } else if (options.watermarkPosition === "top-right") {
        y = padding + fontSize;
      } else if (options.watermarkPosition === "center") {
        x = (exportCanvas.width - textWidth) / 2;
        y = exportCanvas.height / 2;
      }

      ctx.save();
      ctx.globalAlpha = options.watermarkOpacity;
      // Text Shadow/Glow
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 6;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(text, x, y);
      ctx.restore();
    }
  }

  const mimeType = `image/${options.format}`;
  return exportCanvas.toDataURL(mimeType, options.quality);
}

// HSL Helper Functions
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function getHslChannel(
  h: number
): keyof AdjustmentSettings["hsl"] {
  const deg = h * 360;
  if (deg >= 345 || deg < 15) return "red";
  if (deg >= 15 && deg < 45) return "orange";
  if (deg >= 45 && deg < 70) return "yellow";
  if (deg >= 70 && deg < 165) return "green";
  if (deg >= 165 && deg < 200) return "aqua";
  if (deg >= 200 && deg < 260) return "blue";
  if (deg >= 260 && deg < 310) return "purple";
  return "magenta";
}

/**
 * Creates a beautiful high-res sample event photograph (Wedding Night Venue)
 * on a canvas and returns its Data URL so users can test immediately.
 */
export function createSampleEventPhotoDataUrl(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1066;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Deep night event background
  const bgGrad = ctx.createLinearGradient(0, 0, 1600, 1066);
  bgGrad.addColorStop(0, "#0a0f1d");
  bgGrad.addColorStop(0.4, "#18233c");
  bgGrad.addColorStop(0.8, "#2d1b32");
  bgGrad.addColorStop(1, "#120a1a");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1600, 1066);

  // Festoon garland hanging lights (Warm venue bokeh)
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * 1600;
    const y = Math.random() * 450;
    const radius = Math.random() * 35 + 10;
    const alpha = Math.random() * 0.6 + 0.2;

    const goldGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    goldGrad.addColorStop(0, `rgba(255, 230, 180, ${alpha + 0.3})`);
    goldGrad.addColorStop(0.4, `rgba(255, 180, 80, ${alpha * 0.7})`);
    goldGrad.addColorStop(1, "rgba(255, 120, 20, 0)");

    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Outdoor wedding tent arch / Floral installation structure
  ctx.lineWidth = 12;
  ctx.strokeStyle = "rgba(230, 210, 180, 0.25)";
  ctx.beginPath();
  ctx.arc(800, 850, 520, Math.PI, Math.PI * 2);
  ctx.stroke();

  // Warm Spotlights from below
  const spotGrad1 = ctx.createRadialGradient(400, 1000, 50, 400, 600, 500);
  spotGrad1.addColorStop(0, "rgba(255, 210, 150, 0.4)");
  spotGrad1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = spotGrad1;
  ctx.beginPath();
  ctx.arc(400, 800, 500, 0, Math.PI * 2);
  ctx.fill();

  const spotGrad2 = ctx.createRadialGradient(1200, 1000, 50, 1200, 600, 500);
  spotGrad2.addColorStop(0, "rgba(255, 190, 210, 0.35)");
  spotGrad2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = spotGrad2;
  ctx.beginPath();
  ctx.arc(1200, 800, 500, 0, Math.PI * 2);
  ctx.fill();

  // Couple silhouette with romantic wedding attire
  // Groom
  ctx.fillStyle = "#111625";
  ctx.beginPath();
  ctx.ellipse(710, 680, 75, 180, -0.05, 0, Math.PI * 2);
  ctx.fill();

  // Bride in white dress
  const dressGrad = ctx.createLinearGradient(820, 550, 880, 950);
  dressGrad.addColorStop(0, "#ffffff");
  dressGrad.addColorStop(0.6, "#f3f0e8");
  dressGrad.addColorStop(1, "#dcd5c8");
  ctx.fillStyle = dressGrad;
  ctx.beginPath();
  ctx.moveTo(810, 580);
  ctx.lineTo(730, 950);
  ctx.lineTo(970, 950);
  ctx.lineTo(840, 580);
  ctx.closePath();
  ctx.fill();

  // Heads / Faces skin tone glow
  ctx.fillStyle = "#e8b898";
  ctx.beginPath();
  ctx.arc(725, 490, 32, 0, Math.PI * 2); // Groom head
  ctx.arc(815, 510, 30, 0, Math.PI * 2); // Bride head
  ctx.fill();

  // Sparklers / Magic sparkles around the event
  for (let i = 0; i < 150; i++) {
    const sx = 500 + Math.random() * 600;
    const sy = 400 + Math.random() * 550;
    const sz = Math.random() * 4 + 1;
    ctx.fillStyle = Math.random() > 0.5 ? "#fff6d5" : "#ffd2a6";
    ctx.beginPath();
    ctx.arc(sx, sy, sz, 0, Math.PI * 2);
    ctx.fill();
  }

  // Text watermark signature "LuminaPro Demo Event Photo"
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("Événement Mariage Soirée - Photo Test Haute Résolution", 60, 1010);

  return canvas.toDataURL("image/jpeg", 0.95);
}
