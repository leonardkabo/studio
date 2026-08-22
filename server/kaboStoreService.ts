import fs from "fs";
import path from "path";
import { KaboStoreItem } from "../src/types";
import { DEFAULT_KABO_STORE_ITEMS } from "../src/data/kaboStoreDefaults";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "kabo_store.json");

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadStoreItems(): KaboStoreItem[] {
  try {
    ensureDataDirectory();
    if (!fs.existsSync(STORE_FILE)) {
      // Seed with curated defaults
      fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_KABO_STORE_ITEMS, null, 2), "utf-8");
      return DEFAULT_KABO_STORE_ITEMS;
    }
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    const items = JSON.parse(raw);
    if (!Array.isArray(items) || items.length === 0) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_KABO_STORE_ITEMS, null, 2), "utf-8");
      return DEFAULT_KABO_STORE_ITEMS;
    }
    return items;
  } catch (err) {
    console.error("Error reading KABO Store JSON:", err);
    return DEFAULT_KABO_STORE_ITEMS;
  }
}

export function saveStoreItems(items: KaboStoreItem[]): void {
  try {
    ensureDataDirectory();
    fs.writeFileSync(STORE_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving KABO Store JSON:", err);
  }
}

export function getStoreItemById(id: string): KaboStoreItem | null {
  const items = loadStoreItems();
  return items.find((item) => item.id === id) || null;
}

export function addStoreItem(newItem: Omit<KaboStoreItem, "id" | "createdAt" | "downloadsCount" | "likesCount">): KaboStoreItem {
  const items = loadStoreItems();
  const createdItem: KaboStoreItem = {
    ...newItem,
    id: `kabo_store_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
    downloadsCount: 0,
    likesCount: 0,
  };
  items.unshift(createdItem);
  saveStoreItems(items);
  return createdItem;
}

export function deleteStoreItem(id: string): boolean {
  const items = loadStoreItems();
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length !== items.length) {
    saveStoreItems(filtered);
    return true;
  }
  return false;
}

export function incrementStoreItemLike(id: string): { success: boolean; likesCount: number } {
  const items = loadStoreItems();
  const item = items.find((i) => i.id === id);
  if (item) {
    item.likesCount = (item.likesCount || 0) + 1;
    saveStoreItems(items);
    return { success: true, likesCount: item.likesCount };
  }
  return { success: false, likesCount: 0 };
}

export function incrementStoreItemDownload(id: string): { success: boolean; downloadsCount: number } {
  const items = loadStoreItems();
  const item = items.find((i) => i.id === id);
  if (item) {
    item.downloadsCount = (item.downloadsCount || 0) + 1;
    saveStoreItems(items);
    return { success: true, downloadsCount: item.downloadsCount };
  }
  return { success: false, downloadsCount: 0 };
}
