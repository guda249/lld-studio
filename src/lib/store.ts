/**
 * Learner data lives only in this browser: a tiny key-value store on IndexedDB (no library needed),
 * falling back to localStorage, then to memory (private browsing, blocked storage, some file:// setups).
 * Keys used: "deck:<slug>" (flashcards), "quiz:<slug>" (quiz results).
 */
const DB = "lldstudio";
const STORE = "kv";
const memory = new Map<string, unknown>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") { resolve(null); return; }
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function lsGet<T>(key: string): T | undefined {
  try {
    const v = localStorage.getItem("lldstudio.kv." + key);
    return v === null ? undefined : (JSON.parse(v) as T);
  } catch { return undefined; }
}
function lsSet(key: string, value: unknown): boolean {
  try { localStorage.setItem("lldstudio.kv." + key, JSON.stringify(value)); return true; } catch { return false; }
}

export async function getItem<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  if (db) {
    try {
      const v = await new Promise<T | undefined>((resolve, reject) => {
        const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => reject(req.error);
      });
      if (v !== undefined) return v;
    } catch { /* fall through */ }
  }
  const ls = lsGet<T>(key);
  if (ls !== undefined) return ls;
  return memory.get(key) as T | undefined;
}

export async function setItem(key: string, value: unknown): Promise<void> {
  memory.set(key, value);
  const db = await openDb();
  if (db) {
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return;
    } catch { /* fall through */ }
  }
  lsSet(key, value);
}

export async function allKeys(prefix = ""): Promise<string[]> {
  const db = await openDb();
  const keys = new Set<string>([...memory.keys()].filter((k) => k.startsWith(prefix)));
  if (db) {
    try {
      const k = await new Promise<IDBValidKey[]>((resolve, reject) => {
        const req = db.transaction(STORE, "readonly").objectStore(STORE).getAllKeys();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      k.map(String).filter((x) => x.startsWith(prefix)).forEach((x) => keys.add(x));
    } catch { /* ignore */ }
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("lldstudio.kv." + prefix)) keys.add(k.slice("lldstudio.kv.".length));
    }
  } catch { /* ignore */ }
  return [...keys];
}

/** Where saved data actually goes in this browser: "memory" means it is lost when the tab closes (e.g. private mode). */
export async function storageMode(): Promise<"indexeddb" | "localstorage" | "memory"> {
  if (await openDb()) return "indexeddb";
  try { localStorage.setItem("lldstudio.probe", "1"); localStorage.removeItem("lldstudio.probe"); return "localstorage"; } catch { return "memory"; }
}
