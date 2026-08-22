import { SavedSignaturePreset, SignatureIconItem } from "../types";

const STORAGE_KEY = "studio_saved_signatures_v2";
const LAST_USED_KEY = "studio_last_used_signature_id";

// Built-in starter signatures
export const INITIAL_DEFAULT_SIGNATURES: SavedSignaturePreset[] = [
  {
    id: "sig_amouretvie_official",
    name: "★ Amour & Vie (Réseaux Officiels)",
    createdAt: 1724000000000,
    updatedAt: 1724000000000,
    mode: "signature",
    iconsList: [
      { id: "1", name: "Facebook", key: "facebook", type: "builtin", size: 17, enabled: true },
      { id: "2", name: "YouTube", key: "youtube", type: "builtin", size: 17, enabled: true },
      { id: "3", name: "Instagram", key: "instagram", type: "builtin", size: 17, enabled: true },
      { id: "4", name: "X / Twitter", key: "x", type: "builtin", size: 17, enabled: true },
      { id: "5", name: "Messenger", key: "messenger", type: "builtin", size: 17, enabled: true },
      { id: "6", name: "TikTok", key: "tiktok", type: "builtin", size: 17, enabled: true },
    ],
    globalIconSize: 17,
    globalIconScale: 1.0,
    syncAllIconSizes: true,
    iconStyle: "badge-dark",
    iconSpacing: 6,
    iconTextSpacing: 10,
    iconPositionOrder: "icons-first",
    text: "Amouretvie Abms",
    fontFamily: "'Montserrat', sans-serif",
    fontSizePx: 20,
    fontWeight: "bold",
    textColor: "#000000",
    opacity: 100,
    orientation: "horizontal",
    anchorPosition: "bottom-center",
    customMarginUnit: "px",
    customMarginLinked: true,
    customMarginX: 0,
    customMarginY: 0,
    fineRotation: 0,
    hasOutline: false,
    outlineColor: "#ffffff",
    outlineWidth: 2,
    hasShadow: false,
    shadowColor: "rgba(0,0,0,0.5)",
    hasBadgeBox: true,
    badgeBoxColor: "rgba(255, 255, 255, 0.95)",
    badgeBoxPadding: 6,
    isDefault: true,
  },
  {
    id: "sig_photographe_gold",
    name: "Photographe Signature Or (Calligraphie)",
    createdAt: 1724000100000,
    updatedAt: 1724000100000,
    mode: "signature",
    iconsList: [
      { id: "c1", name: "Appareil Photo", key: "camera", type: "builtin", size: 20, enabled: true },
      { id: "c2", name: "Instagram", key: "instagram", type: "builtin", size: 20, enabled: true },
    ],
    globalIconSize: 20,
    globalIconScale: 1.0,
    syncAllIconSizes: true,
    iconStyle: "monochrome",
    iconSpacing: 6,
    iconTextSpacing: 10,
    iconPositionOrder: "icons-first",
    text: "L. Kabo Photography",
    fontFamily: "'Great Vibes', cursive",
    fontSizePx: 24,
    fontWeight: "bold",
    textColor: "#eab308",
    opacity: 100,
    orientation: "horizontal",
    anchorPosition: "bottom-right",
    customMarginUnit: "px",
    customMarginLinked: true,
    customMarginX: 25,
    customMarginY: 25,
    fineRotation: 0,
    hasOutline: true,
    outlineColor: "#000000",
    outlineWidth: 1.5,
    hasShadow: true,
    shadowColor: "rgba(0,0,0,0.6)",
    hasBadgeBox: false,
    badgeBoxColor: "rgba(255, 255, 255, 0.85)",
    badgeBoxPadding: 8,
  },
  {
    id: "sig_contact_pro",
    name: "Contact Pro (Site, Tél & Instagram)",
    createdAt: 1724000200000,
    updatedAt: 1724000200000,
    mode: "signature",
    iconsList: [
      { id: "ct1", name: "Site Web", key: "globe", type: "builtin", size: 16, enabled: true },
      { id: "ct2", name: "Téléphone", key: "phone", type: "builtin", size: 16, enabled: true },
      { id: "ct3", name: "Instagram", key: "instagram", type: "builtin", size: 16, enabled: true },
    ],
    globalIconSize: 16,
    globalIconScale: 1.0,
    syncAllIconSizes: true,
    iconStyle: "badge-dark",
    iconSpacing: 6,
    iconTextSpacing: 10,
    iconPositionOrder: "icons-first",
    text: "studio.leonardkabo.cloud • @moncompte",
    fontFamily: "Inter, sans-serif",
    fontSizePx: 16,
    fontWeight: "600",
    textColor: "#ffffff",
    opacity: 95,
    orientation: "horizontal",
    anchorPosition: "bottom-left",
    customMarginUnit: "px",
    customMarginLinked: true,
    customMarginX: 20,
    customMarginY: 20,
    fineRotation: 0,
    hasOutline: true,
    outlineColor: "#000000",
    outlineWidth: 2,
    hasShadow: true,
    shadowColor: "rgba(0,0,0,0.7)",
    hasBadgeBox: false,
    badgeBoxColor: "rgba(255, 255, 255, 0.85)",
    badgeBoxPadding: 8,
  },
];

/**
 * Load all saved signatures from localStorage
 */
export function getSavedSignatures(): SavedSignaturePreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with default initial signatures
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_SIGNATURES));
      return INITIAL_DEFAULT_SIGNATURES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_DEFAULT_SIGNATURES;
  } catch (err) {
    console.warn("Failed to load signatures from localStorage", err);
    return INITIAL_DEFAULT_SIGNATURES;
  }
}

/**
 * Save or update a signature preset
 */
export function saveSignaturePreset(
  presetData: Omit<SavedSignaturePreset, "id" | "createdAt" | "updatedAt">,
  existingId?: string
): SavedSignaturePreset {
  const current = getSavedSignatures();
  const now = Date.now();

  let updatedList: SavedSignaturePreset[];
  let savedItem: SavedSignaturePreset;

  if (existingId) {
    // Update existing
    savedItem = {
      ...presetData,
      id: existingId,
      createdAt: current.find((s) => s.id === existingId)?.createdAt || now,
      updatedAt: now,
    };
    updatedList = current.map((item) => (item.id === existingId ? savedItem : item));
  } else {
    // Create new
    savedItem = {
      ...presetData,
      id: `sig_${now}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    updatedList = [savedItem, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    localStorage.setItem(LAST_USED_KEY, savedItem.id);
  } catch (err) {
    console.error("Failed to save signature preset to localStorage", err);
  }

  return savedItem;
}

/**
 * Delete a saved signature preset
 */
export function deleteSignaturePreset(id: string): SavedSignaturePreset[] {
  const current = getSavedSignatures();
  const filtered = current.filter((item) => item.id !== id);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error("Failed to delete signature preset", err);
  }

  return filtered;
}

/**
 * Set a signature as default
 */
export function setDefaultSignature(id: string): SavedSignaturePreset[] {
  const current = getSavedSignatures();
  const updated = current.map((item) => ({
    ...item,
    isDefault: item.id === id,
  }));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(LAST_USED_KEY, id);
  } catch (err) {
    console.error("Failed to set default signature", err);
  }

  return updated;
}

/**
 * Get the last used or default signature
 */
export function getDefaultOrLastUsedSignature(): SavedSignaturePreset | null {
  const signatures = getSavedSignatures();
  if (signatures.length === 0) return null;

  try {
    const lastId = localStorage.getItem(LAST_USED_KEY);
    if (lastId) {
      const match = signatures.find((s) => s.id === lastId);
      if (match) return match;
    }
  } catch {
    // fallback
  }

  const defaultSig = signatures.find((s) => s.isDefault);
  return defaultSig || signatures[0];
}

/**
 * Remember last used signature
 */
export function setLastUsedSignatureId(id: string): void {
  try {
    localStorage.setItem(LAST_USED_KEY, id);
  } catch {
    // ignore
  }
}
