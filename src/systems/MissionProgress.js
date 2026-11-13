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
    return statusById;
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

      const validStatuses = new Set(Object.values(MISSION_STATUS));
      const restored = {};

      MISSIONS.forEach((mission, index) => {
        const savedStatus = parsed[mission.id];
        if (validStatuses.has(savedStatus)) {
          // Normalize IN_PROGRESS back to AVAILABLE on reload if not completed yet
          restored[mission.id] =
            savedStatus === MISSION_STATUS.IN_PROGRESS
              ? MISSION_STATUS.AVAILABLE
              : savedStatus;
        } else {
          restored[mission.id] =
            index === 0 ? MISSION_STATUS.AVAILABLE : MISSION_STATUS.LOCKED;
        }
      });

      // Ensure sequential unlock integrity
      for (let i = 0; i < MISSIONS.length; i += 1) {
        const currentId = MISSIONS[i].id;
        if (i === 0 && restored[currentId] === MISSION_STATUS.LOCKED) {
          restored[currentId] = MISSION_STATUS.AVAILABLE;
        }
        if (i > 0) {
          const prevId = MISSIONS[i - 1].id;
          if (
            restored[prevId] === MISSION_STATUS.COMPLETED &&
            restored[currentId] === MISSION_STATUS.LOCKED
          ) {
            restored[currentId] = MISSION_STATUS.AVAILABLE;
          }
        }
      }

      return restored;
    } catch {
      return fallback;
    }
  }

  save(statusById) {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(statusById));
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
