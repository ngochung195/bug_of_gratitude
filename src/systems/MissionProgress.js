import { APP_CONFIG, MISSION_STATUS } from '../config/constants.js';
import { MISSIONS } from '../data/MissionData.js';

function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Ignore storage access restrictions
  }
  return null;
}

export class MissionProgress {
  constructor(storageKey = APP_CONFIG.STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  createDefaultState() {
    const statusById = {};
    MISSIONS.forEach((mission, index) => {
      statusById[mission.id] =
        index === 0 ? MISSION_STATUS.AVAILABLE : MISSION_STATUS.LOCKED;
    });
    return {
      statusById,
      wrongAttempts: 0,
      introCompleted: false,
      shownHackerMessages: [],
      exploredSectors: ['sector-reception'],
    };
  }

  load() {
    const fallback = this.createDefaultState();
    try {
      const storage = getStorage();
      if (!storage) return fallback;

      const raw = storage.getItem(this.storageKey);
      if (!raw) {
        return fallback;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return fallback;
      }

      const rawStatusMap =
        parsed.statusById && typeof parsed.statusById === 'object'
          ? parsed.statusById
          : parsed;

      const validStatuses = new Set(Object.values(MISSION_STATUS));
      const restoredStatus = {};

      MISSIONS.forEach((mission, index) => {
        const savedStatus = rawStatusMap[mission.id];
        if (validStatuses.has(savedStatus)) {
          restoredStatus[mission.id] =
            savedStatus === MISSION_STATUS.IN_PROGRESS
              ? MISSION_STATUS.AVAILABLE
              : savedStatus;
        } else {
          restoredStatus[mission.id] =
            index === 0 ? MISSION_STATUS.AVAILABLE : MISSION_STATUS.LOCKED;
        }
      });

      // Ensure sequential unlock integrity
      for (let i = 0; i < MISSIONS.length; i += 1) {
        const currentId = MISSIONS[i].id;
        if (i === 0 && restoredStatus[currentId] === MISSION_STATUS.LOCKED) {
          restoredStatus[currentId] = MISSION_STATUS.AVAILABLE;
        }
        if (i > 0) {
          const prevId = MISSIONS[i - 1].id;
          if (
            restoredStatus[prevId] === MISSION_STATUS.COMPLETED &&
            restoredStatus[currentId] === MISSION_STATUS.LOCKED
          ) {
            restoredStatus[currentId] = MISSION_STATUS.AVAILABLE;
          }
        }
      }

      const wrongAttempts = Number.isInteger(parsed.wrongAttempts)
        ? Math.max(0, Math.min(APP_CONFIG.MAX_WRONG_ATTEMPTS, parsed.wrongAttempts))
        : 0;

      const introCompleted = Boolean(parsed.introCompleted);

      const shownHackerMessages = Array.isArray(parsed.shownHackerMessages)
        ? parsed.shownHackerMessages.filter((id) => typeof id === 'string')
        : [];

      const exploredSectors = Array.isArray(parsed.exploredSectors)
        ? Array.from(new Set(['sector-reception', ...parsed.exploredSectors]))
        : ['sector-reception'];

      return {
        statusById: restoredStatus,
        wrongAttempts,
        introCompleted,
        shownHackerMessages,
        exploredSectors,
      };
    } catch {
      return fallback;
    }
  }

  hasSavedSession() {
    try {
      const storage = getStorage();
      if (!storage) return false;
      const raw = storage.getItem(this.storageKey);
      if (!raw) return false;

      const loaded = this.load();
      const hasCompletedAny = Object.values(loaded.statusById).some(
        (st) => st === MISSION_STATUS.COMPLETED
      );
      return Boolean(loaded.introCompleted || hasCompletedAny || loaded.wrongAttempts > 0);
    } catch {
      return false;
    }
  }

  save({
    statusById,
    wrongAttempts = 0,
    introCompleted = false,
    shownHackerMessages = [],
    exploredSectors = ['sector-reception'],
  }) {
    try {
      const storage = getStorage();
      if (!storage) return;
      storage.setItem(
        this.storageKey,
        JSON.stringify({
          statusById,
          wrongAttempts,
          introCompleted: Boolean(introCompleted),
          shownHackerMessages: Array.from(new Set(shownHackerMessages)),
          exploredSectors: Array.from(new Set(exploredSectors)),
        })
      );
    } catch {
      // Ignore storage quota or private mode restrictions
    }
  }

  reset() {
    const fresh = this.createDefaultState();
    this.save(fresh);
    return fresh;
  }
}

export const missionProgress = new MissionProgress();
export default MissionProgress;
