import { APP_CONFIG, MISSION_STATUS } from '../config/constants.js';
import { MISSIONS } from '../data/MissionData.js';

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
    };
  }

  load() {
    const fallback = this.createDefaultState();
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) {
        return fallback;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return fallback;
      }

      // Support both legacy flat status map and new { statusById, wrongAttempts } structure
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

      return {
        statusById: restoredStatus,
        wrongAttempts,
      };
    } catch {
      return fallback;
    }
  }

  save({ statusById, wrongAttempts = 0 }) {
    try {
      window.localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          statusById,
          wrongAttempts,
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
