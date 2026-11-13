import { EVENTS, MISSION_STATUS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';
import { MISSIONS } from '../data/MissionData.js';
import { missionProgress } from './MissionProgress.js';
import { MissionValidator } from './MissionValidator.js';

export class MissionManager {
  constructor({
    progressStore = missionProgress,
    eventBusInstance = eventBus,
  } = {}) {
    this.progressStore = progressStore;
    this.eventBus = eventBusInstance;
    this.missions = MISSIONS;
    this.statusById = this.progressStore.load();
    this.allCompletedEmitted = this.isAllCompleted();
  }

  getAllMissions() {
    return this.missions.map((mission) => ({
      ...mission,
      status: this.getMissionStatus(mission.id),
    }));
  }

  getMissionById(missionId) {
    const mission = this.missions.find((m) => m.id === missionId);
    if (!mission) return null;
    return {
      ...mission,
      status: this.getMissionStatus(mission.id),
    };
  }

  getMissionByStationId(stationId) {
    const mission = this.missions.find((m) => m.stationId === stationId);
    if (!mission) return null;
    return this.getMissionById(mission.id);
  }

  getMissionStatus(missionId) {
    return this.statusById[missionId] || MISSION_STATUS.LOCKED;
  }

  getCompletedCount() {
    return this.missions.filter(
      (m) => this.statusById[m.id] === MISSION_STATUS.COMPLETED
    ).length;
  }

  getTotalCount() {
    return this.missions.length;
  }

  isAllCompleted() {
    return this.getCompletedCount() === this.getTotalCount();
  }

  getCurrentActiveMission() {
    const active = this.missions.find(
      (m) =>
        this.statusById[m.id] === MISSION_STATUS.AVAILABLE ||
        this.statusById[m.id] === MISSION_STATUS.IN_PROGRESS
    );
    return active ? this.getMissionById(active.id) : null;
  }

  getMentorGuidance() {
    if (this.isAllCompleted()) {
      return 'Mentor Bot C-2011: "Xuất sắc! Bạn đã sửa xong cả 4 Bug kỹ thuật. Nhưng hệ thống vừa phát hiện một tín hiệu lạ ở trung tâm..."';
    }
    const current = this.getCurrentActiveMission();
    if (current && current.mentorHint) {
      return current.mentorHint;
    }
    return 'Mentor Bot C-2011: "Hãy bắt đầu từ Trạm Terminal Alpha (BUG #001) ở góc Tây Bắc phòng Lab nhé!"';
  }

  startMission(missionId) {
    const status = this.getMissionStatus(missionId);
    if (status === MISSION_STATUS.LOCKED) {
      const current = this.getCurrentActiveMission();
      return {
        canOpen: false,
        reason: current
          ? `Trạm này đang khóa [LOCKED]. Hãy hoàn thành ${current.code} (${current.title}) trước nhé!`
          : 'Nhiệm vụ này hiện đang khóa.',
      };
    }

    if (status === MISSION_STATUS.AVAILABLE) {
      this.statusById[missionId] = MISSION_STATUS.IN_PROGRESS;
      this.progressStore.save(this.statusById);
      this.emitUpdate();
    }

    return {
      canOpen: true,
      mission: this.getMissionById(missionId),
    };
  }

  cancelInProgress(missionId) {
    if (this.statusById[missionId] === MISSION_STATUS.IN_PROGRESS) {
      this.statusById[missionId] = MISSION_STATUS.AVAILABLE;
      this.progressStore.save(this.statusById);
      this.emitUpdate();
    }
  }

  submitMissionAnswer(missionId, payload) {
    const mission = this.getMissionById(missionId);
    if (!mission) {
      return {
        isValid: false,
        alreadyCompleted: false,
        feedback: 'Không tìm thấy nhiệm vụ.',
      };
    }

    // Prevent duplicate completion corrupting progress
    if (mission.status === MISSION_STATUS.COMPLETED) {
      return {
        isValid: true,
        alreadyCompleted: true,
        feedback: 'Nhiệm vụ này đã được bạn hoàn thành trước đó.',
      };
    }

    if (mission.status === MISSION_STATUS.LOCKED) {
      return {
        isValid: false,
        alreadyCompleted: false,
        feedback: 'Nhiệm vụ này chưa được mở khóa.',
      };
    }

    const validation = MissionValidator.validate(mission, payload);
    if (!validation.isValid) {
      return {
        isValid: false,
        alreadyCompleted: false,
        feedback: validation.feedback,
      };
    }

    // Mark current mission COMPLETED
    this.statusById[missionId] = MISSION_STATUS.COMPLETED;

    // Unlock the next sequential mission if locked
    const currentIndex = this.missions.findIndex((m) => m.id === missionId);
    let unlockedNextMission = null;

    if (currentIndex >= 0 && currentIndex + 1 < this.missions.length) {
      const nextMission = this.missions[currentIndex + 1];
      if (this.statusById[nextMission.id] === MISSION_STATUS.LOCKED) {
        this.statusById[nextMission.id] = MISSION_STATUS.AVAILABLE;
        unlockedNextMission = this.getMissionById(nextMission.id);
      }
    }

    this.progressStore.save(this.statusById);
    this.emitUpdate();

    const completedCount = this.getCompletedCount();
    const totalCount = this.getTotalCount();

    this.eventBus.emit(EVENTS.MISSION_COMPLETED, {
      mission: this.getMissionById(missionId),
      unlockedNextMission,
      completedCount,
      totalCount,
    });

    if (completedCount === totalCount && !this.allCompletedEmitted) {
      this.allCompletedEmitted = true;
      this.eventBus.emit(EVENTS.ALL_MISSIONS_COMPLETED, {
        completedCount,
        totalCount,
      });
    }

    return {
      isValid: true,
      alreadyCompleted: false,
      feedback: validation.feedback,
      unlockedNextMission,
      allCompleted: completedCount === totalCount,
    };
  }

  resetProgress() {
    this.statusById = this.progressStore.reset();
    this.allCompletedEmitted = false;
    this.emitUpdate();
    this.eventBus.emit(EVENTS.MISSION_PROGRESS_RESET, {
      completedCount: 0,
      totalCount: this.getTotalCount(),
    });
  }

  emitUpdate() {
    this.eventBus.emit(EVENTS.MISSION_UPDATED, {
      missions: this.getAllMissions(),
      completedCount: this.getCompletedCount(),
      totalCount: this.getTotalCount(),
    });
  }
}

export const missionManager = new MissionManager();
export default MissionManager;
