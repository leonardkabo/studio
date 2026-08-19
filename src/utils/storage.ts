import { LocalCloudStorageStats, ProjectState } from "../types";

const DB_NAME = "LuminaProStudioDB";
const DB_VERSION = 1;
const STORE_NAME = "projects";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB non supporté par votre navigateur."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
        store.createIndex("isCloudSynced", "isCloudSynced", { unique: false });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function saveProjectToLocal(project: ProjectState): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(project);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllLocalProjects(): Promise<ProjectState[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("updatedAt");
    const req = index.openCursor(null, "prev"); // newest first
    const projects: ProjectState[] = [];

    req.onsuccess = (event: any) => {
      const cursor = event.target.result;
      if (cursor) {
        projects.push(cursor.value);
        cursor.continue();
      } else {
        resolve(projects);
      }
    };

    req.onerror = () => reject(req.error);
  });
}

export async function getProjectById(id: string): Promise<ProjectState | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProjectFromLocal(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getStorageStats(): Promise<LocalCloudStorageStats> {
  try {
    const projects = await getAllLocalProjects();
    const cloudSynced = projects.filter((p) => p.isCloudSynced).length;

    // Estimate storage in MB
    let totalBytes = 0;
    projects.forEach((p) => {
      totalBytes += (p.originalImage || "").length * 0.75; // Approx base64 size
    });

    const totalMB = Math.round((totalBytes / (1024 * 1024)) * 10) / 10;

    return {
      localProjectsCount: projects.length,
      cloudSyncedCount: cloudSynced,
      totalStorageUsedMB: totalMB,
      privacyStatus: "Confidentialité totale : Vos photos ne quittent jamais votre appareil.",
    };
  } catch (err) {
    return {
      localProjectsCount: 0,
      cloudSyncedCount: 0,
      totalStorageUsedMB: 0,
      privacyStatus: "Stockage local actif.",
    };
  }
}

export function downloadProjectBackupFile(project: ProjectState): void {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lumina_project_${project.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
