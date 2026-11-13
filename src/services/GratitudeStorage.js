import { APP_CONFIG } from '../config/constants.js';

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
      const raw = window.localStorage.getItem(this.storageKey);
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

  saveLetter(letterObject) {
    if (!letterObject || typeof letterObject !== 'object') {
      return null;
    }

    const existing = this.getAllLetters();
    const updated = [letterObject, ...existing];

    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(updated));
      this.clearDraft();
    } catch {
      // Ignore storage quota restrictions
    }

    return letterObject;
  }

  saveDraft(draft = {}) {
    try {
      window.localStorage.setItem(
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
      const raw = window.localStorage.getItem(this.draftKey);
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
      window.localStorage.removeItem(this.draftKey);
    } catch {
      // Ignore
    }
  }
}

export const gratitudeStorage = new GratitudeStorage();
export default GratitudeStorage;
