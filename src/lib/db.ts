import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PassportDB extends DBSchema {
  photos: {
    key: string;
    value: {
      id: string;
      blob: Blob;
      timestamp: number;
    };
  };
}

let db: IDBPDatabase<PassportDB>;

export async function getDB() {
  if (db) return db;
  db = await openDB<PassportDB>('yugal-passport-db', 1, {
    upgrade(db) {
      db.createObjectStore('photos', { keyPath: 'id' });
    },
  });
  return db;
}

export async function savePhotoBlob(id: string, blob: Blob) {
  const database = await getDB();
  await database.put('photos', { id, blob, timestamp: Date.now() });
}

export async function getPhotoBlob(id: string): Promise<Blob | undefined> {
  const database = await getDB();
  const entry = await database.get('photos', id);
  return entry?.blob;
}

export async function deletePhotoBlob(id: string) {
  const database = await getDB();
  await database.delete('photos', id);
}
