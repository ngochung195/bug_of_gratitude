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

const SECTOR_PREREQUISITE_MISSION = {
  'sector-reception': null,
  'sector-it-office': null,
  'sector-database-room': 'mission-01',
  'sector-server-room': 'mission-02',
  'sector-security-room': 'mission-03',
  'sector-central-control': 'mission-04',
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

  /**
   * Checks whether a sector's door is unlocked based on mission progression:
   * - IT OFFICE & RECEPTION: unlocked initially
   * - DATABASE ROOM: requires Mission 1 completed
   * - SERVER ROOM: requires Mission 2 completed
   * - SECURITY ROOM: requires Mission 3 completed
   * - CENTRAL CONTROL ROOM: requires Mission 4 (all 4 missions) completed
   */
  isSectorUnlocked(sectorId) {
    const reqMissionId = SECTOR_PREREQUISITE_MISSION[sectorId];
    if (!reqMissionId) return true;
    return (
      this.missionManager.getMissionStatus(reqMissionId) ===
      MISSION_STATUS.COMPLETED
    );
  }

  getSectorLockReason(sectorId) {
    if (this.isSectorUnlocked(sectorId)) return '';
    if (sectorId === 'sector-central-control') {
      return 'CỬA PHÒNG ĐIỀU HÀNH TRUNG TÂM ĐANG KHÓA: Hãy hoàn thành cả 4 nhiệm vụ điều tra (đặc biệt là lấy mã truy cập tại SECURITY ROOM) để mở khóa!';
    }
    const reqMissionId = SECTOR_PREREQUISITE_MISSION[sectorId];
    const reqMission = this.missionManager.getMissionById(reqMissionId);
    if (reqMission) {
      return `Khu vực này đang bị khóa an ninh. Hãy khôi phục sự cố tại ${reqMission.location || reqMission.title} (${reqMission.code}) trước!`;
    }
    return 'Khu vực này hiện đang khóa.';
  }

  computeSectorStatus(sec) {
    const isExplored = this.missionManager.isSectorExplored(sec.id);

    // Rule (Section 6): Unexplored sectors must NEVER be marked completed/restored
    if (!isExplored) {
      return SECTOR_STATUS.UNEXPLORED;
    }

    if (sec.missionId) {
      const mStatus = this.missionManager.getMissionStatus(sec.missionId);
      return mStatus === MISSION_STATUS.COMPLETED
        ? SECTOR_STATUS.RESTORED
        : SECTOR_STATUS.ANOMALY_DETECTED;
    }

    if (sec.id === 'sector-central-control') {
      return this.missionManager.isAllCompleted()
        ? SECTOR_STATUS.RESTORED
        : SECTOR_STATUS.EXPLORED;
    }

    return SECTOR_STATUS.EXPLORED;
  }

  initStates() {
    this.sectors.forEach((sec) => {
      this.statusBySectorId[sec.id] = this.computeSectorStatus(sec);
    });
  }

  syncWithMissionStates() {
    let changed = false;

    this.sectors.forEach((sec) => {
      const prev = this.statusBySectorId[sec.id];
      const next = this.computeSectorStatus(sec);
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

    if (sector && this.isSectorUnlocked(sector.id)) {
      const newlyExplored = this.missionManager.markSectorExplored(sector.id);
      const nextStatus = this.computeSectorStatus(sector);
      if (newlyExplored || this.statusBySectorId[sector.id] !== nextStatus) {
        this.statusBySectorId[sector.id] = nextStatus;
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
        status: sector
          ? this.statusBySectorId[sector.id]
          : SECTOR_STATUS.EXPLORED,
      });
    }

    return sector;
  }

  markObjectInspected(targetConfig) {
    if (!targetConfig) return;
    if (targetConfig.id) {
      this.inspectedObjectIds.add(targetConfig.id);
    }

    if (targetConfig.sectorId && this.isSectorUnlocked(targetConfig.sectorId)) {
      this.missionManager.markSectorExplored(targetConfig.sectorId);
      const sec = this.sectors.find((s) => s.id === targetConfig.sectorId);
      if (sec) {
        this.statusBySectorId[sec.id] = this.computeSectorStatus(sec);
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
      const isUnlocked = this.isSectorUnlocked(sec.id);
      return {
        ...sec,
        status,
        isUnlocked,
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
      return 'CENTRAL CONTROL UNLOCKED (4/4)';
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
