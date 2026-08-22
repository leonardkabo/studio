import { SavedSignaturePreset, AppliedStoreSignature } from "../types";
import { renderSignaturePresetOnCanvas } from "./signatureRenderer";

/**
 * Renders multiple signatures sequentially onto a base image canvas.
 * Preserves the exact high resolution, aspect ratio, fonts, icons, dimensions, and positions of each signature.
 */
export async function renderMultipleSignaturesOnImage(
  baseImageDataUrl: string,
  presets: SavedSignaturePreset[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(baseImageDataUrl);
          return;
        }

        // Draw original base image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Render each preset sequentially on top
        for (const preset of presets) {
          await renderSignaturePresetOnCanvas(canvas, preset);
        }

        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        console.error("Error rendering composite signatures on image:", err);
        resolve(baseImageDataUrl);
      }
    };
    img.onerror = (err) => {
      console.error("Error loading base image for signature composition:", err);
      reject(err);
    };
    img.src = baseImageDataUrl;
  });
}
