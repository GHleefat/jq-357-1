import { create } from 'zustand';
import type { DiaryEntry } from '@/types';
import {
  getDiaryEntries,
  addDiaryEntry,
  updateDiaryEntry as updateStorageEntry,
  deleteDiaryEntry as deleteStorageEntry,
  saveAudioBlob,
  getAudioBlob,
  generateId,
} from '@/utils/storage';

interface DiaryStore {
  entries: DiaryEntry[];
  isLoading: boolean;
  fetchEntries: () => void;
  createEntry: (
    data: Omit<DiaryEntry, 'id' | 'audioBlobId' | 'timestamp'>,
    audioBlob: Blob
  ) => Promise<DiaryEntry>;
  updateEntry: (id: string, updates: Partial<DiaryEntry>) => void;
  deleteEntry: (id: string) => Promise<void>;
  getAudio: (id: string) => Promise<Blob | undefined>;
}

export const useDiaryStore = create<DiaryStore>((set, get) => ({
  entries: [],
  isLoading: false,

  fetchEntries: () => {
    const entries = getDiaryEntries();
    set({ entries });
  },

  createEntry: async (data, audioBlob) => {
    const audioBlobId = generateId();
    const entry: DiaryEntry = {
      ...data,
      id: generateId(),
      audioBlobId,
      timestamp: Date.now(),
    };

    await saveAudioBlob(audioBlobId, audioBlob);
    addDiaryEntry(entry);

    const entries = getDiaryEntries();
    set({ entries });

    return entry;
  },

  updateEntry: (id, updates) => {
    updateStorageEntry(id, updates);
    const entries = getDiaryEntries();
    set({ entries });
  },

  deleteEntry: async (id) => {
    await deleteStorageEntry(id);
    const entries = getDiaryEntries();
    set({ entries });
  },

  getAudio: async (id) => {
    const entry = get().entries.find((e) => e.id === id);
    if (!entry) return undefined;
    return getAudioBlob(entry.audioBlobId);
  },
}));
