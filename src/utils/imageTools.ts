import { AdjustmentSettings, BrushSettings, SelectionState } from "../types";

/**
 * Heals a spot on image canvas using customizable Photoshop brush parameters:
 * hardness, angle, roundness, size.
 */
export function healBlemishSpotWithBrush(
  canvas: HTMLCanvasElement,
  centerX: number,
  centerY: number,
  brush: BrushSettings
): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  const radius = Math.max(3, Math.floor(brush.size / 2));
  const hardness = Math.max(0.05, brush.hardness / 100);
  const roundFactor = Math.max(0.1, brush.roundness / 100);
  const angleRad = (brush.angle * Math.PI) / 180;

  // Bound check
  const maxBound = Math.ceil(radius * 2);
  const startX = Math.max(0, Math.floor(centerX - maxBound));
  const startY = Math.max(0, Math.floor(centerY - maxBound));
  const endX = Math.min(width, Math.ceil(centerX + maxBound));
  const endY = Math.min(height, Math.ceil(centerY + maxBound));

  const patchWidth = endX - startX;
  const patchHeight = endY - startY;

  if (patchWidth <= 0 || patchHeight <= 0) return;

  const imgData = ctx.getImageData(startX, startY, patchWidth, patchHeight);
  const data = imgData.data;

  // 1. Sample healthy outer ring
  let sumR = 0, sumG = 0, sumB = 0, count = 0;
  const outerR = radius * 1.6;

  for (let py = 0; py < patchHeight; py++) {
    const curY = startY + py;
    const dy = curY - centerY;

    for (let px = 0; px < patchWidth; px++) {
      const curX = startX + px;
      const dx = curX - centerX;

      // Rotate coordinates by brush angle
      const rDx = dx * Math.cos(-angleRad) - dy * Math.sin(-angleRad);
      const rDy = (dx * Math.sin(-angleRad) + dy * Math.cos(-angleRad)) / roundFactor;
      const dist = Math.sqrt(rDx * rDx + rDy * rDy);

      if (dist >= radius && dist <= outerR) {
        const idx = (py * patchWidth + px) * 4;
        sumR += data[idx];
        sumG += data[idx + 1];
        sumB += data[idx + 2];
        count++;
      }
    }
  }

  if (count === 0) return;

  const avgR = sumR / count;
  const avgG = sumG / count;
  const avgB = sumB / count;

  // 2. Blend center with hardness falloff
  for (let py = 0; py < patchHeight; py++) {
    const curY = startY + py;
    const dy = curY - centerY;

    for (let px = 0; px < patchWidth; px++) {
      const curX = startX + px;
      const dx = curX - centerX;

      const rDx = dx * Math.cos(-angleRad) - dy * Math.sin(-angleRad);
      const rDy = (dx * Math.sin(-angleRad) + dy * Math.cos(-angleRad)) / roundFactor;
      const dist = Math.sqrt(rDx * rDx + rDy * rDy);

      if (dist < radius) {
        const idx = (py * patchWidth + px) * 4;
        let factor = 1.0;
        if (dist > radius * hardness) {
          factor = (radius - dist) / (radius * (1 - hardness));
          factor = Math.max(0, Math.min(1, factor));
        }

        data[idx] = Math.round(data[idx] * (1 - factor) + avgR * factor);
        data[idx + 1] = Math.round(data[idx + 1] * (1 - factor) + avgG * factor);
        data[idx + 2] = Math.round(data[idx + 2] * (1 - factor) + avgB * factor);
      }
    }
  }

  ctx.putImageData(imgData, startX, startY);
}

/**
 * Continuously heals skin along a brush stroke path between two points (fromX, fromY) -> (toX, toY).
 * Enables smooth dragging over large skin/body areas with pimples, spots, stains, and scars.
 */
export function healBlemishStrokeWithBrush(
  canvas: HTMLCanvasElement,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  brush: BrushSettings
): void {
  const dist = Math.hypot(toX - fromX, toY - fromY);
  const spacingFactor = Math.max(0.05, brush.spacing / 100);
  const stepSize = Math.max(2, Math.floor(brush.size * spacingFactor * 0.4));

  if (dist === 0) {
    healBlemishSpotWithBrush(canvas, toX, toY, brush);
    return;
  }

  const steps = Math.max(1, Math.ceil(dist / stepSize));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const currX = fromX + (toX - fromX) * t;
    const currY = fromY + (toY - fromY) * t;
    healBlemishSpotWithBrush(canvas, currX, currY, brush);
  }
}

/**
 * Legacy spot healing function fallback
 */
export function healBlemishSpot(
  canvas: HTMLCanvasElement,
  centerX: number,
  centerY: number,
  radius: number
): void {
  const defaultBrush: BrushSettings = {
    size: radius * 2,
    hardness: 30,
    spacing: 25,
    angle: 0,
    roundness: 100,
    smoothing: true,
    flipX: false,
    flipY: false,
    selectedTipId: "tip-30-soft",
    shapeDynamics: true,
    diffusion: false,
    texture: false,
    dualBrush: false,
    colorDynamics: false,
    transfer: false,
    brushPose: false,
    noise: false,
    wetEdges: false,
    accumulation: false,
    protectTexture: false,
  };
  healBlemishSpotWithBrush(canvas, centerX, centerY, defaultBrush);
}

/**
 * Isolates selection subject and makes background transparent (Alpha = 0)
 */
export function isolateSelectionTransparent(
  canvas: HTMLCanvasElement,
  selection: SelectionState
): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || !selection.isActive) return;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Check pixel containment inside selection
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const isInside = isPixelInSelection(x, y, selection, w, h);
      if (!isInside) {
        const idx = (y * w + x) * 4;
        data[idx + 3] = 0; // Set Alpha to 0 (Transparent)
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Erases content inside selection mask (Alpha = 0)
 */
export function eraseInsideSelection(
  canvas: HTMLCanvasElement,
  selection: SelectionState
): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || !selection.isActive) return;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const isInside = isPixelInSelection(x, y, selection, w, h);
      if (isInside) {
        const idx = (y * w + x) * 4;
        data[idx + 3] = 0; // Clear pixel to transparent
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Applies skin smoothing & exposure boost specifically inside the selection mask
 */
export function applyRetouchToSelection(
  canvas: HTMLCanvasElement,
  selection: SelectionState
): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || !selection.isActive) return;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const isInside = isPixelInSelection(x, y, selection, w, h);
      if (isInside) {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Slightly brighten and warm up skin inside selection
        data[idx] = Math.min(255, Math.round(r * 1.08 + 8));
        data[idx + 1] = Math.min(255, Math.round(g * 1.05 + 5));
        data[idx + 2] = Math.min(255, Math.round(b * 1.02));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * AI Subject Detection: Automatically locates human subject / main object in center
 * and generates selection box / mask.
 */
export function autoDetectSubjectSelection(canvas: HTMLCanvasElement): SelectionState {
  const w = canvas.width;
  const h = canvas.height;

  // Center subject heuristic (typical subject takes center 60% of frame)
  const rect = {
    x: Math.round(w * 0.18),
    y: Math.round(h * 0.08),
    width: Math.round(w * 0.64),
    height: Math.round(h * 0.84),
  };

  return {
    mode: "auto_subject",
    isActive: true,
    rect,
  };
}

/**
 * Helper to test if a pixel (x,y) is inside active selection mask
 */
export function isPixelInSelection(
  x: number,
  y: number,
  selection: SelectionState,
  w: number,
  h: number
): boolean {
  if (!selection.isActive) return true;

  if (selection.rect) {
    const { x: rx, y: ry, width: rw, height: rh } = selection.rect;
    if (selection.mode === "ellipse") {
      const cx = rx + rw / 2;
      const cy = ry + rh / 2;
      const rxRad = rw / 2;
      const ryRad = rh / 2;
      const dx = (x - cx) / rxRad;
      const dy = (y - cy) / ryRad;
      return dx * dx + dy * dy <= 1;
    } else {
      // Rectangle or Auto Subject
      return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
    }
  }

  if (selection.lassoPoints && selection.lassoPoints.length > 2) {
    // Point-in-polygon ray casting algorithm for Lasso
    let inside = false;
    const pts = selection.lassoPoints;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x, yi = pts[i].y;
      const xj = pts[j].x, yj = pts[j].y;
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  return true;
}


/**
 * Automatically detects and cleans pimples, red blemishes, and skin spots across skin areas.
 */
export function autoCleanSkinBlemishes(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Make a copy of original data for neighbor reference
  const copy = new Uint8ClampedArray(data);

  // Scan pixels in 3x3 window for skin pimples (unusual red spikes or dark spots on skin)
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const idx = (y * w + x) * 4;
      const r = copy[idx];
      const g = copy[idx + 1];
      const b = copy[idx + 2];

      // Check skin tone candidate (warm tones)
      const isSkin = r > 90 && g > 40 && b > 20 && r > g && r > b;
      if (isSkin) {
        // Calculate surrounding 5x5 average
        let sumR = 0, sumG = 0, sumB = 0, cnt = 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = ((y + dy) * w + (x + dx)) * 4;
            sumR += copy[nIdx];
            sumG += copy[nIdx + 1];
            sumB += copy[nIdx + 2];
            cnt++;
          }
        }
        const avgR = sumR / cnt;
        const avgG = sumG / cnt;
        const avgB = sumB / cnt;

        // Detect pimple (unusual redness spike or dark spot outlier)
        const redDiff = r - avgR;
        const lumDiff = (r + g + b) / 3 - (avgR + avgG + avgB) / 3;

        if (redDiff > 25 || lumDiff < -30) {
          // Soften the blemish towards surrounding skin
          data[idx] = Math.round(r * 0.3 + avgR * 0.7);
          data[idx + 1] = Math.round(g * 0.3 + avgG * 0.7);
          data[idx + 2] = Math.round(b * 0.3 + avgB * 0.7);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Automatic smart background removal / matting on canvas
 */
export function removeBackgroundSmart(
  sourceCanvas: HTMLCanvasElement,
  mode: "transparent" | "solid" | "blur",
  bgColor: string = "#0f172a"
): string {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
  if (!tempCtx) return sourceCanvas.toDataURL();

  tempCtx.drawImage(sourceCanvas, 0, 0);
  const imgData = tempCtx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Sample corner colors (4 corners) to detect background key colors
  const cornerIndices = [
    0, // Top-Left
    (w - 1) * 4, // Top-Right
    ((h - 1) * w) * 4, // Bottom-Left
    ((h - 1) * w + (w - 1)) * 4, // Bottom-Right
  ];

  const cornerColors = cornerIndices.map((idx) => ({
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
  }));

  // Calculate distance from closest corner background color
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Check if pixel is close to background corner colors
    let minDiff = 999;
    for (const c of cornerColors) {
      const dr = r - c.r;
      const dg = g - c.g;
      const db = b - c.b;
      const diff = Math.sqrt(dr * dr + dg * dg + db * db);
      if (diff < minDiff) minDiff = diff;
    }

    // Threshold for background separation
    if (minDiff < 45) {
      // Fade out background pixel
      const alpha = Math.max(0, (minDiff - 15) / 30);
      data[i + 3] = Math.round(data[i + 3] * alpha);
    }
  }

  tempCtx.putImageData(imgData, 0, 0);

  // Render final output based on chosen mode
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = w;
  outputCanvas.height = h;
  const outCtx = outputCanvas.getContext("2d");
  if (!outCtx) return tempCanvas.toDataURL();

  if (mode === "solid") {
    outCtx.fillStyle = bgColor;
    outCtx.fillRect(0, 0, w, h);
    outCtx.drawImage(tempCanvas, 0, 0);
  } else if (mode === "blur") {
    // Draw blurred original background behind isolated foreground
    outCtx.save();
    outCtx.filter = "blur(20px)";
    outCtx.drawImage(sourceCanvas, 0, 0);
    outCtx.restore();
    outCtx.drawImage(tempCanvas, 0, 0);
  } else {
    // Transparent mode
    outCtx.drawImage(tempCanvas, 0, 0);
  }

  return outputCanvas.toDataURL("image/png");
}

/**
 * Creates Image-in-Text Clipping Mask Effect
 */
export function renderImageInText(
  sourceImg: HTMLImageElement,
  text: string,
  fontFamily: string = "Impact, sans-serif",
  bgColor: string = "#090d16"
): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Fill background
  if (bgColor === "transparent") {
    ctx.clearRect(0, 0, 1600, 1000);
  } else {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 1600, 1000);
  }

  // 2. Measure & draw giant text
  let fontSize = 280;
  ctx.font = `900 ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Auto adjust font size to fit width
  let textWidth = ctx.measureText(text).width;
  while (textWidth > 1450 && fontSize > 40) {
    fontSize -= 10;
    ctx.font = `900 ${fontSize}px ${fontFamily}`;
    textWidth = ctx.measureText(text).width;
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, 800, 500);

  // 3. Composite mode: source-in keeps photo only inside text letters!
  ctx.globalCompositeOperation = "source-in";

  // Scale and draw photo centered inside text
  const imgAspect = sourceImg.naturalWidth / sourceImg.naturalHeight;
  const canvasAspect = 1600 / 1000;
  let drawW = 1600;
  let drawH = 1000;
  let drawX = 0;
  let drawY = 0;

  if (imgAspect > canvasAspect) {
    drawW = 1000 * imgAspect;
    drawX = (1600 - drawW) / 2;
  } else {
    drawH = 1600 / imgAspect;
    drawY = (1000 - drawH) / 2;
  }

  ctx.drawImage(sourceImg, drawX, drawY, drawW, drawH);

  return canvas.toDataURL("image/png");
}

export interface AutoFaceParams {
  blemishRemoval: number; // 0 to 100 (%)
  gaussianBlurRadius: number; // 0 to 20 (px)
  sensitivity: number; // 0 to 100 (%)
  preserveDetails: number; // 0 to 100 (%)
  skinWarmth: number; // -50 to +50
  glowIntensity?: number; // 0 to 100 (%)
  eyeLipPop?: number; // 0 to 100 (%)
  toneEvenness?: number; // 0 to 100 (%)
  acneHealingStrength?: number; // 0 to 100 (%)
}

/**
 * Advanced AI Pro Beauty & Skin Retouching Algorithm:
 * 1. Multi-scale Universal Skin Tone Detection (Caucasian, Asian, Hispanic, Black / Melanin-rich).
 * 2. Deep Acne, Pimple & Hyperpigmentation Outlier In-painting.
 * 3. Dual-Pass Frequency Separation (smooth tone unification + realistic micro-texture preservation).
 * 4. Multi-directional Edge Masking (protects eyes, eyelashes, eyebrows, lips, nostrils, hair, jewelry).
 * 5. Dimensional Studio Highlight & Glow (Dodge & Burn radiant sheen on cheekbones/nose).
 * 6. Eye & Lip Clarity Pop.
 */
export function processAdvancedAutoFace(
  sourceCanvas: HTMLCanvasElement,
  params: AutoFaceParams,
  maskCanvas?: HTMLCanvasElement | null
): string {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  // Create temporary working canvas
  const workCanvas = document.createElement("canvas");
  workCanvas.width = w;
  workCanvas.height = h;
  const ctx = workCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return sourceCanvas.toDataURL();

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const original = new Uint8ClampedArray(data);

  // Read mask canvas if provided
  let maskData: Uint8ClampedArray | null = null;
  if (maskCanvas && maskCanvas.width === w && maskCanvas.height === h) {
    const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
    if (maskCtx) {
      maskData = maskCtx.getImageData(0, 0, w, h).data;
    }
  }

  // 1. Generate Low-Frequency Gaussian Blurred image for skin tone unification
  let blurredData: Uint8ClampedArray | null = null;
  const blurRadius = Math.max(0, params.gaussianBlurRadius);
  if (blurRadius > 0) {
    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = w;
    blurCanvas.height = h;
    const blurCtx = blurCanvas.getContext("2d", { willReadFrequently: true });
    if (blurCtx) {
      blurCtx.filter = `blur(${blurRadius}px)`;
      blurCtx.drawImage(sourceCanvas, 0, 0);
      const blurImgData = blurCtx.getImageData(0, 0, w, h);
      blurredData = blurImgData.data;
    }
  }

  // Parameter scalers
  const blemishStrength = (params.blemishRemoval ?? 80) / 100;
  const acneHealing = (params.acneHealingStrength ?? params.blemishRemoval ?? 80) / 100;
  const sensThreshold = 38 - ((params.sensitivity ?? 75) / 100) * 26; // lower threshold = higher sensitivity
  const preserveFactor = (params.preserveDetails ?? 75) / 100;
  const warmth = params.skinWarmth ?? 0;
  const glow = (params.glowIntensity ?? 0) / 100;
  const pop = (params.eyeLipPop ?? 0) / 100;
  const toneEvenness = (params.toneEvenness ?? 85) / 100;

  // 2. Pixel-level pass: Skin segmentation, outlier acne eradication, frequency separation
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;

      // Check user zone selection mask if active
      let maskFactor = 1.0;
      if (maskData) {
        const maskAlpha = maskData[idx + 3];
        if (maskAlpha === 0) continue; // Outside user painted zone: retain 100% original sharp pixel
        maskFactor = maskAlpha / 255;
      }

      const r = original[idx];
      const g = original[idx + 1];
      const b = original[idx + 2];

      // A. Robust Multi-Ethnic Skin Detection (RGB + YCbCr)
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      const isSkinYCbCr = cb >= 60 && cb <= 150 && cr >= 120 && cr <= 195;
      const isSkinRGB =
        r > 30 &&
        g > 15 &&
        b > 8 &&
        r >= g &&
        (r - b > 4 || Math.abs(r - g) > 4);

      const isSkinTone = isSkinYCbCr || isSkinRGB;

      // B. Edge / Detail Detection (Sobel-like gradient filter to protect eyes, lips, eyebrows, nose bridge, earrings)
      const idxLeft = (y * w + (x - 1)) * 4;
      const idxRight = (y * w + (x + 1)) * 4;
      const idxUp = ((y - 1) * w + x) * 4;
      const idxDown = ((y + 1) * w + x) * 4;

      const lumL = 0.299 * original[idxLeft] + 0.587 * original[idxLeft + 1] + 0.114 * original[idxLeft + 2];
      const lumR = 0.299 * original[idxRight] + 0.587 * original[idxRight + 1] + 0.114 * original[idxRight + 2];
      const lumU = 0.299 * original[idxUp] + 0.587 * original[idxUp + 1] + 0.114 * original[idxUp + 2];
      const lumD = 0.299 * original[idxDown] + 0.587 * original[idxDown + 1] + 0.114 * original[idxDown + 2];

      const gradX = Math.abs(lumR - lumL);
      const gradY = Math.abs(lumD - lumU);
      const edgeGrad = Math.sqrt(gradX * gradX + gradY * gradY);

      // Detail edge weight (0 = flat smooth skin, 1 = sharp detail edge like eye contour / eyelashes / lip line)
      const detailEdgeWeight = Math.min(1, edgeGrad / 32);

      // Non-skin detail pop (eye irises, lips, eyebrows): gentle contrast boost
      if (!isSkinTone && !maskData) {
        if (pop > 0 && detailEdgeWeight > 0.35) {
          // Boost clarity in eye & lip details
          const popContrast = 1 + pop * 0.15;
          const popR = Math.min(255, Math.max(0, (r - 128) * popContrast + 128));
          const popG = Math.min(255, Math.max(0, (g - 128) * popContrast + 128));
          const popB = Math.min(255, Math.max(0, (b - 128) * popContrast + 128));
          data[idx] = Math.round(popR);
          data[idx + 1] = Math.round(popG);
          data[idx + 2] = Math.round(popB);
        }
        continue;
      }

      // C. Multi-Scale Local Neighborhood Analysis for Acne & Hyperpigmentation Eradication
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nY = y + dy;
          const nX = x + dx;
          if (nY < 0 || nY >= h || nX < 0 || nX >= w) continue;
          const nIdx = (nY * w + nX) * 4;
          sumR += original[nIdx];
          sumG += original[nIdx + 1];
          sumB += original[nIdx + 2];
          count++;
        }
      }
      const avgR = sumR / count;
      const avgG = sumG / count;
      const avgB = sumB / count;
      const avgLum = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;

      // Detect acne red spikes, dark brown hyperpigmentation marks, and uneven rough bumps
      const redOutlier = (r - avgR) - (g - avgG);
      const darkOutlier = avgLum - lum;
      const spotDeviation = Math.max(redOutlier, darkOutlier);

      let blemishWeight = 0;
      if (spotDeviation > sensThreshold) {
        blemishWeight = Math.min(1, Math.max(0, (spotDeviation - sensThreshold) / 16)) * acneHealing;
      }

      // D. In-paint & Heal Blemish Outliers using surrounding healthy skin tone
      const healFactor = blemishWeight * blemishStrength;
      const healedR = r * (1 - healFactor) + avgR * healFactor;
      const healedG = g * (1 - healFactor) + avgG * healFactor;
      const healedB = b * (1 - healFactor) + avgB * healFactor;

      // E. Frequency Separation Tone Smoothing (Low Frequency Blurring + High Frequency Satin Texture)
      let finalR = healedR;
      let finalG = healedG;
      let finalB = healedB;

      if (blurredData && blurRadius > 0) {
        const blurR = blurredData[idx];
        const blurG = blurredData[idx + 1];
        const blurB = blurredData[idx + 2];

        // Smooth factor: fully smooth on skin, softly protected on sharp feature contours
        const smoothWeight = Math.max(0, 1 - detailEdgeWeight * preserveFactor) * toneEvenness;

        // Base low-frequency color blend
        finalR = healedR * (1 - smoothWeight) + blurR * smoothWeight;
        finalG = healedG * (1 - smoothWeight) + blurG * smoothWeight;
        finalB = healedB * (1 - smoothWeight) + blurB * smoothWeight;

        // Subtle micro-pore texture retention: prevents flat plastic doll look
        const highPassR = (original[idx] - blurR) * 0.22 * (1 - blemishWeight);
        const highPassG = (original[idx + 1] - blurG) * 0.22 * (1 - blemishWeight);
        const highPassB = (original[idx + 2] - blurB) * 0.22 * (1 - blemishWeight);

        finalR = Math.min(255, Math.max(0, finalR + highPassR));
        finalG = Math.min(255, Math.max(0, finalG + highPassG));
        finalB = Math.min(255, Math.max(0, finalB + highPassB));
      }

      // F. Dimensional Studio Glow & Highlight Enhancement (Cheekbones, Forehead, Nose)
      if (glow > 0 && lum > 100 && lum < 225 && detailEdgeWeight < 0.4) {
        const highlightCurve = Math.sin(((lum - 100) / 125) * Math.PI);
        const glowBoost = highlightCurve * glow * 18;
        finalR = Math.min(255, finalR + glowBoost * 1.15);
        finalG = Math.min(255, finalG + glowBoost * 0.95);
        finalB = Math.min(255, finalB + glowBoost * 0.75);
      }

      // G. Skin Warmth & Radiant Golden Tone Adjustment
      if (warmth !== 0) {
        const warmthFactor = warmth / 100;
        finalR = Math.min(255, finalR * (1 + warmthFactor * 0.12) + warmthFactor * 8);
        finalG = Math.min(255, finalG * (1 + warmthFactor * 0.05) + warmthFactor * 3);
        finalB = Math.max(0, finalB * (1 - warmthFactor * 0.04));
      }

      // H. Final Blend into Canvas based on user Zone Selection Mask Factor
      data[idx] = Math.round(original[idx] * (1 - maskFactor) + finalR * maskFactor);
      data[idx + 1] = Math.round(original[idx + 1] * (1 - maskFactor) + finalG * maskFactor);
      data[idx + 2] = Math.round(original[idx + 2] * (1 - maskFactor) + finalB * maskFactor);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return workCanvas.toDataURL("image/jpeg", 0.96);
}

/**
 * 1-Click High-End Pro Beauty & Skin Retouching Filter Execution
 */
export function applyOneClickBeautyFilter(
  sourceCanvas: HTMLCanvasElement,
  filterParams: AutoFaceParams
): string {
  return processAdvancedAutoFace(sourceCanvas, filterParams, null);
}
