import { KaboStoreItem, KaboStoreCategory, KaboStoreItemType, SavedSignaturePreset } from "../types";
import { DEFAULT_KABO_STORE_ITEMS } from "../data/kaboStoreDefaults";
import { renderSignaturePresetOnCanvas } from "./signatureRenderer";

export interface FetchStoreParams {
  category?: string;
  search?: string;
  type?: string;
  sort?: "newest" | "popular" | "likes" | "name";
}

/**
 * Fetch all items from KABO Store backend API with offline/fallback safety
 */
export async function fetchKaboStoreItems(params?: FetchStoreParams): Promise<KaboStoreItem[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== "Tous") searchParams.set("category", params.category);
    if (params?.search && params.search.trim()) searchParams.set("search", params.search.trim());
    if (params?.type && params.type !== "all") searchParams.set("type", params.type);
    if (params?.sort) searchParams.set("sort", params.sort);

    const res = await fetch(`/api/kabo-store/items?${searchParams.toString()}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    return DEFAULT_KABO_STORE_ITEMS;
  } catch (err) {
    console.warn("Could not reach KABO Store backend API, using local storage fallback:", err);
    // Fallback: check localStorage, otherwise defaults
    try {
      const local = localStorage.getItem("kabo_store_local_cache");
      if (local) {
        return JSON.parse(local);
      }
    } catch {}
    return DEFAULT_KABO_STORE_ITEMS;
  }
}

/**
 * Publish a new signature or logo preset to KABO Store
 */
export async function publishToKaboStore(itemData: {
  title: string;
  author: string;
  authorId?: string;
  category: KaboStoreCategory;
  description?: string;
  itemType: KaboStoreItemType;
  preset: SavedSignaturePreset;
  previewDataUrl?: string;
  tags?: string[];
}): Promise<KaboStoreItem> {
  const res = await fetch("/api/kabo-store/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(itemData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Erreur lors de la publication sur KABO Store");
  }

  const result = await res.json();
  return result.item;
}

/**
 * Delete a signature or logo definitively from KABO Store server
 */
export async function deleteFromKaboStore(id: string): Promise<boolean> {
  const res = await fetch(`/api/kabo-store/items/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Impossible de supprimer la signature du serveur");
  }

  const result = await res.json();
  return result.success;
}

/**
 * Like a KABO Store item
 */
export async function likeKaboStoreItem(id: string): Promise<{ success: boolean; likesCount: number }> {
  try {
    const res = await fetch(`/api/kabo-store/items/${encodeURIComponent(id)}/like`, {
      method: "POST",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Like error:", err);
  }
  return { success: false, likesCount: 0 };
}

/**
 * Record a download/application from KABO Store
 */
export async function recordKaboStoreDownload(id: string): Promise<void> {
  try {
    await fetch(`/api/kabo-store/items/${encodeURIComponent(id)}/download`, {
      method: "POST",
    });
  } catch (err) {
    console.warn("Download count error:", err);
  }
}

/**
 * Render a crisp, beautiful thumbnail dataURL from a SavedSignaturePreset
 */
export async function generatePresetThumbnail(
  preset: SavedSignaturePreset,
  background: "dark" | "checker" | "transparent" = "dark",
  width: number = 640,
  height: number = 360
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  if (background === "dark") {
    // Elegant radial studio vignette
    const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.7);
    grad.addColorStop(0, "#1e293b");
    grad.addColorStop(1, "#090d16");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (background === "checker") {
    // Checkerboard
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, width, height);
    const size = 16;
    ctx.fillStyle = "#334155";
    for (let x = 0; x < width; x += size * 2) {
      for (let y = 0; y < height; y += size * 2) {
        ctx.fillRect(x, y, size, size);
        ctx.fillRect(x + size, y + size, size, size);
      }
    }
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  // Render the preset onto canvas
  await renderSignaturePresetOnCanvas(canvas, preset);

  return canvas.toDataURL("image/png");
}

/**
 * Generate a full-size, high-definition live preview for the modal
 * Preserves the exact aspect ratio of the user's photo so signatures
 * appear in their true proportional positions across all screen types.
 */
export async function generatePresetLivePreview(
  preset: SavedSignaturePreset,
  mode: "photo" | "dark" | "light" | "checker",
  photoSrc?: string | null,
  targetMaxDim: number = 1920
): Promise<string> {
  const canvas = document.createElement("canvas");

  if (mode === "photo" && photoSrc) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        let w = img.naturalWidth || img.width || 1600;
        let h = img.naturalHeight || img.height || 1000;

        // Proportional constraint to prevent excessive memory usage while maintaining crisp HD
        if (w > targetMaxDim || h > targetMaxDim) {
          const ratio = targetMaxDim / Math.max(w, h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        canvas.width = Math.max(200, w);
        canvas.height = Math.max(200, h);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          await renderSignaturePresetOnCanvas(canvas, preset);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(photoSrc);
        }
      };
      img.onerror = async () => {
        canvas.width = 1600;
        canvas.height = 900;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(0, 0, 1600, 900);
          await renderSignaturePresetOnCanvas(canvas, preset);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve("");
        }
      };
      img.src = photoSrc;
    });
  }

  // If rendering on dark / light / checker, check if photoSrc exists to adopt its natural aspect ratio
  let targetWidth = 1600;
  let targetHeight = 900;

  if (photoSrc) {
    try {
      const photoDimensions = await new Promise<{ w: number; h: number }>((resolve) => {
        const testImg = new Image();
        testImg.crossOrigin = "anonymous";
        testImg.onload = () => {
          let pw = testImg.naturalWidth || testImg.width || 1600;
          let ph = testImg.naturalHeight || testImg.height || 900;
          if (pw > targetMaxDim || ph > targetMaxDim) {
            const ratio = targetMaxDim / Math.max(pw, ph);
            pw = Math.round(pw * ratio);
            ph = Math.round(ph * ratio);
          }
          resolve({ w: Math.max(200, pw), h: Math.max(200, ph) });
        };
        testImg.onerror = () => resolve({ w: 1600, h: 900 });
        testImg.src = photoSrc;
      });
      targetWidth = photoDimensions.w;
      targetHeight = photoDimensions.h;
    } catch {
      targetWidth = 1600;
      targetHeight = 900;
    }
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  if (mode === "dark") {
    const grad = ctx.createRadialGradient(
      targetWidth / 2,
      targetHeight / 2,
      20,
      targetWidth / 2,
      targetHeight / 2,
      Math.max(targetWidth, targetHeight) * 0.7
    );
    grad.addColorStop(0, "#1e293b");
    grad.addColorStop(1, "#090d16");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (mode === "light") {
    const grad = ctx.createRadialGradient(
      targetWidth / 2,
      targetHeight / 2,
      20,
      targetWidth / 2,
      targetHeight / 2,
      Math.max(targetWidth, targetHeight) * 0.7
    );
    grad.addColorStop(0, "#f8fafc");
    grad.addColorStop(1, "#cbd5e1");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (mode === "checker") {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    const size = Math.max(16, Math.round(Math.min(targetWidth, targetHeight) / 40));
    ctx.fillStyle = "#334155";
    for (let x = 0; x < targetWidth; x += size * 2) {
      for (let y = 0; y < targetHeight; y += size * 2) {
        ctx.fillRect(x, y, size, size);
        ctx.fillRect(x + size, y + size, size, size);
      }
    }
  }

  await renderSignaturePresetOnCanvas(canvas, preset);
  return canvas.toDataURL("image/png");
}
