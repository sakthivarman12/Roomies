/**
 * App-private blob storage (IndexedDB) for videos. Nothing here is written to the phone's gallery / camera roll.
 * Supabase Storage replaces this later.
 */
const DB_NAME = "roomies-media";
const STORE = "blobs";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("Local media storage isn't available in this browser."));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Couldn't open media storage."));
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = run(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    t.oncomplete = () => db.close();
  });
}

export const mediaStore = {
  put(id: string, blob: Blob): Promise<IDBValidKey> {
    return tx("readwrite", (s) => s.put(blob, id));
  },
  async get(id: string): Promise<Blob | null> {
    const res = await tx<Blob | undefined>("readonly", (s) => s.get(id));
    return res ?? null;
  },
  remove(id: string): Promise<undefined> {
    return tx("readwrite", (s) => s.delete(id));
  },
};
