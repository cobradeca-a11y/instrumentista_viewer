// src/services/storageService.ts
// IndexedDB wrapper — persists partitura images and MIDI files locally

const DB_NAME = "instrumentistas_db";
const DB_VERSION = 1;
const STORE_FILES = "files";
const STORE_JSON = "json_data";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES);
      }
      if (!db.objectStoreNames.contains(STORE_JSON)) {
        db.createObjectStore(STORE_JSON);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveFile(key: string, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const tx = db.transaction(STORE_FILES, "readwrite");
      const store = tx.objectStore(STORE_FILES);
      const payload = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result, // ArrayBuffer
        savedAt: new Date().toISOString(),
      };
      const req = store.put(payload, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export interface StoredFile {
  name: string;
  type: string;
  size: number;
  data: ArrayBuffer;
  savedAt: string;
}

export async function getFile(key: string): Promise<StoredFile | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, "readonly");
    const store = tx.objectStore(STORE_FILES);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteFile(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, "readwrite");
    const store = tx.objectStore(STORE_FILES);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveJSON(key: string, data: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_JSON, "readwrite");
    const store = tx.objectStore(STORE_JSON);
    const req = store.put(data, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_JSON, "readonly");
    const store = tx.objectStore(STORE_JSON);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export function getFileObjectURL(stored: StoredFile): string {
  const blob = new Blob([stored.data], { type: stored.type });
  return URL.createObjectURL(blob);
}

export function partituraKey(louvorId: string) {
  return `partitura_${louvorId}`;
}
export function midiKey(louvorId: string) {
  return `midi_${louvorId}`;
}
