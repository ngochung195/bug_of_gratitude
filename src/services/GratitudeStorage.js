import { APP_CONFIG } from '../config/constants.js';

function getLocalStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Ignore storage access errors
  }
  return null;
}

export class GratitudeStorage {
  constructor(
    storageKey = APP_CONFIG.GRATITUDE_STORAGE_KEY,
    draftKey = APP_CONFIG.GRATITUDE_DRAFT_KEY
  ) {
    this.storageKey = storageKey;
    this.draftKey = draftKey;
  }

  getAllLetters() {
    try {
      const storage = getLocalStorage();
      if (!storage) return [];
      const raw = storage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  getLatestLetter() {
    const letters = this.getAllLetters();
    return letters.length > 0 ? letters[0] : null;
  }

  getUnsyncedLetters() {
    return this.getAllLetters().filter(
      (item) => item && typeof item === 'object' && item.isSynced !== true
    );
  }

  saveLetter(letterObject) {
    if (!letterObject || typeof letterObject !== 'object') {
      return null;
    }

    const normalizedLetter = {
      ...letterObject,
      isSynced: Boolean(letterObject.isSynced),
      syncedAt: letterObject.syncedAt || null,
    };

    const existing = this.getAllLetters().filter((item) => item?.id !== normalizedLetter.id);
    const updated = [normalizedLetter, ...existing];

    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(this.storageKey, JSON.stringify(updated));
      }
      this.clearDraft();
    } catch {
      // Ignore storage quota restrictions
    }

    return normalizedLetter;
  }

  markLetterSynced(letterId, extraFields = {}) {
    if (!letterId) return false;

    const existing = this.getAllLetters();
    let found = false;

    const updated = existing.map((item) => {
      if (item && item.id === letterId) {
        found = true;
        return {
          ...item,
          ...extraFields,
          isSynced: true,
          syncedAt: extraFields.syncedAt || new Date().toISOString(),
        };
      }
      return item;
    });

    if (!found) return false;

    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(this.storageKey, JSON.stringify(updated));
      }
      return true;
    } catch {
      return false;
    }
  }

  saveDraft(draft = {}) {
    try {
      const storage = getLocalStorage();
      if (!storage) return;
      storage.setItem(
        this.draftKey,
        JSON.stringify({
          mentorName: String(draft.mentorName ?? ''),
          senderName: String(draft.senderName ?? ''),
          message: String(draft.message ?? ''),
          isAnonymous: Boolean(draft.isAnonymous),
        })
      );
    } catch {
      // Ignore storage quota restrictions
    }
  }

  loadDraft() {
    try {
      const storage = getLocalStorage();
      if (!storage) {
        return {
          mentorName: '',
          senderName: '',
          message: '',
          isAnonymous: false,
        };
      }
      const raw = storage.getItem(this.draftKey);
      if (!raw) {
        return {
          mentorName: '',
          senderName: '',
          message: '',
          isAnonymous: false,
        };
      }
      const parsed = JSON.parse(raw);
      return {
        mentorName: String(parsed?.mentorName ?? ''),
        senderName: String(parsed?.senderName ?? ''),
        message: String(parsed?.message ?? ''),
        isAnonymous: Boolean(parsed?.isAnonymous),
      };
    } catch {
      return {
        mentorName: '',
        senderName: '',
        message: '',
        isAnonymous: false,
      };
    }
  }

  clearDraft() {
    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.removeItem(this.draftKey);
      }
    } catch {
      // Ignore
    }
  }
}

export const gratitudeStorage = new GratitudeStorage();
export default GratitudeStorage;
