import { openDB, IDBPDatabase } from 'idb';
import type { DiaryEntry } from '@/types';

const DB_NAME = 'emotion-diary-db';
const DB_VERSION = 1;
const AUDIO_STORE = 'audio-blobs';
const DIARY_STORAGE_KEY = 'emotion-diary-entries';

interface AudioBlobStore {
  key: string;
  blob: Blob;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: 'key' });
      }
    },
  });

  return dbPromise;
}

export async function saveAudioBlob(key: string, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put(AUDIO_STORE, { key, blob });
}

export async function getAudioBlob(key: string): Promise<Blob | undefined> {
  const db = await getDB();
  const result = await db.get(AUDIO_STORE, key) as AudioBlobStore | undefined;
  return result?.blob;
}

export async function deleteAudioBlob(key: string): Promise<void> {
  const db = await getDB();
  await db.delete(AUDIO_STORE, key);
}

export function getDiaryEntries(): DiaryEntry[] {
  try {
    const data = localStorage.getItem(DIARY_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveDiaryEntries(entries: DiaryEntry[]): void {
  localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(entries));
}

export function addDiaryEntry(entry: DiaryEntry): void {
  const entries = getDiaryEntries();
  entries.unshift(entry);
  saveDiaryEntries(entries);
}

export function updateDiaryEntry(id: string, updates: Partial<DiaryEntry>): void {
  const entries = getDiaryEntries();
  const index = entries.findIndex((e) => e.id === id);
  if (index !== -1) {
    entries[index] = { ...entries[index], ...updates };
    saveDiaryEntries(entries);
  }
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  const entries = getDiaryEntries();
  const entry = entries.find((e) => e.id === id);
  if (entry) {
    await deleteAudioBlob(entry.audioBlobId);
  }
  const filtered = entries.filter((e) => e.id !== id);
  saveDiaryEntries(filtered);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
