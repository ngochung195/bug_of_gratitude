import { EVENTS, MISSION_STATUS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';
import { SECTOR_STATUS, SECTORS } from '../data/labEnvironment.js';
import { missionManager } from './MissionManager.js';

export const SECTOR_STATUS_LABELS = {
  [SECTOR_STATUS.UNEXPLORED]: 'Chưa khám phá',
  [SECTOR_STATUS.EXPLORED]: 'Đã khám phá',
  [SECTOR_STATUS.ANOMALY_DETECTED]: 'Phát hiện sự cố',
  [SECTOR_STATUS.RESTORED]: 'Đã khôi phục',
};

export class InvestigationSystem {
  constructor({
    sectors = SECTORS,
    missionMgr = missionManager,
    bus = eventBus,
  } = {}) {
    this.sectors = sectors;
    this.missionManager = missionMgr;
    this.eventBus = bus;
    this.statusBySectorId = {};
    this.inspectedObjectIds = new Set();
    this.currentSectorId = 'sector-reception';

    this.initStates();

    this.eventBus.on(EVENTS.MISSION_UPDATED, () => {
      this.syncWithMissionStates();
    });

    this.eventBus.on(EVENTS.MISSION_PROGRESS_RESET, () => {
      this.reset();
    });
  }

  initStates() {
    this.sectors.forEach((sec) => {
      if (sec.missionId) {
        const mStatus = this.missionManager.getMissionStatus(sec.missionId);
        this.statusBySectorId[sec.id] =
          mStatus === MISSION_STATUS.COMPLETED
            ? SECTOR_STATUS.RESTORED
            : SECTOR_STATUS.UNEXPLORED;
      } else if (sec.id === 'sector-reception') {
        this.statusBySectorId[sec.id] = this.missionManager.isAllCompleted()
          ? SECTOR_STATUS.RESTORED
          : SECTOR_STATUS.EXPLORED;
      } else {
        this.statusBySectorId[sec.id] = this.missionManager.isAllCompleted()
          ? SECTOR_STATUS.RESTORED
          : SECTOR_STATUS.UNEXPLORED;
      }
    });
  }

  syncWithMissionStates() {
    let changed = false;
    const allFixed = this.missionManager.isAllCompleted();

    this.sectors.forEach((sec) => {
      const prev = this.statusBySectorId[sec.id];
      let next = prev;

      if (sec.missionId) {
        const mStatus = this.missionManager.getMissionStatus(sec.missionId);
        if (mStatus === MISSION_STATUS.COMPLETED) {
          next = SECTOR_STATUS.RESTORED;
        } else if (prev === SECTOR_STATUS.RESTORED) {
          next = SECTOR_STATUS.ANOMALY_DETECTED;
        }
      } else if (allFixed) {
        next = SECTOR_STATUS.RESTORED;
      }

      if (next !== prev) {
        this.statusBySectorId[sec.id] = next;
        changed = true;
      }
    });

    if (changed) {
      this.emitStatusUpdate();
    }
  }

  getSectorAtPosition(x, y) {
    for (let i = 0; i < this.sectors.length; i += 1) {
      const s = this.sectors[i];
      if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
        return s;
      }
    }
    return null;
  }

  updatePlayerPosition(x, y) {
    const sector = this.getSectorAtPosition(x, y);
    const nextSectorId = sector ? sector.id : 'corridor';

    if (sector) {
      const currentStatus = this.statusBySectorId[sector.id];
      if (currentStatus === SECTOR_STATUS.UNEXPLORED) {
        if (sector.missionId) {
          const mStatus = this.missionManager.getMissionStatus(sector.missionId);
          this.statusBySectorId[sector.id] =
            mStatus === MISSION_STATUS.COMPLETED
              ? SECTOR_STATUS.RESTORED
              : SECTOR_STATUS.ANOMALY_DETECTED;
        } else {
          this.statusBySectorId[sector.id] = this.missionManager.isAllCompleted()
            ? SECTOR_STATUS.RESTORED
            : SECTOR_STATUS.EXPLORED;
        }
        this.emitStatusUpdate();
      }
    }

    if (nextSectorId !== this.currentSectorId) {
      this.currentSectorId = nextSectorId;
      this.eventBus.emit(EVENTS.SECTOR_CHANGED, {
        sector: sector || {
          id: 'corridor',
          code: 'CORRIDOR',
          name: 'MAIN CORRIDOR',
          viName: 'Hành lang Kết nối',
        },
        status: sector ? this.statusBySectorId[sector.id] : SECTOR_STATUS.EXPLORED,
      });
    }

    return sector;
  }

  markObjectInspected(targetConfig) {
    if (!targetConfig) return;
    if (targetConfig.id) {
      this.inspectedObjectIds.add(targetConfig.id);
    }

    if (targetConfig.sectorId && this.statusBySectorId[targetConfig.sectorId]) {
      const sec = this.sectors.find((s) => s.id === targetConfig.sectorId);
      if (sec) {
        if (sec.missionId) {
          const mStatus = this.missionManager.getMissionStatus(sec.missionId);
          this.statusBySectorId[sec.id] =
            mStatus === MISSION_STATUS.COMPLETED
              ? SECTOR_STATUS.RESTORED
              : SECTOR_STATUS.ANOMALY_DETECTED;
        } else if (this.statusBySectorId[sec.id] === SECTOR_STATUS.UNEXPLORED) {
          this.statusBySectorId[sec.id] = SECTOR_STATUS.EXPLORED;
        }
        this.emitStatusUpdate();
      }
    }

    this.eventBus.emit(EVENTS.SCAN_PULSE_TRIGGERED, {
      x: targetConfig.x,
      y: targetConfig.y,
      color: targetConfig.color || 0x00e5ff,
      target: targetConfig,
    });
  }

  getSectorStatus(sectorId) {
    return this.statusBySectorId[sectorId] || SECTOR_STATUS.UNEXPLORED;
  }

  getAllSectorsWithStatus() {
    return this.sectors.map((sec) => {
      const status = this.getSectorStatus(sec.id);
      return {
        ...sec,
        status,
        statusLabel: SECTOR_STATUS_LABELS[status] || status,
      };
    });
  }

  getExploredCount() {
    return this.sectors.filter(
      (s) => this.statusBySectorId[s.id] !== SECTOR_STATUS.UNEXPLORED
    ).length;
  }

  getTotalSectorsCount() {
    return this.sectors.length;
  }

  getResolvedIncidentsCount() {
    return this.missionManager.getCompletedCount();
  }

  getTotalIncidentsCount() {
    return this.missionManager.getTotalCount();
  }

  getSystemStatusText() {
    const resolved = this.getResolvedIncidentsCount();
    const total = this.getTotalIncidentsCount();
    if (resolved >= total) {
      return 'RESTORED // ONLINE';
    }
    return `COMPROMISED (${resolved}/${total})`;
  }

  reset() {
    this.inspectedObjectIds.clear();
    this.currentSectorId = 'sector-reception';
    this.initStates();
    this.emitStatusUpdate();
  }

  emitStatusUpdate() {
    this.eventBus.emit(EVENTS.SECTOR_STATUS_UPDATED, {
      sectors: this.getAllSectorsWithStatus(),
      exploredCount: this.getExploredCount(),
      totalSectors: this.getTotalSectorsCount(),
      resolvedIncidents: this.getResolvedIncidentsCount(),
      totalIncidents: this.getTotalIncidentsCount(),
      systemStatus: this.getSystemStatusText(),
    });
  }
}

export const investigationSystem = new InvestigationSystem();
export default InvestigationSystem;
