import { APP_CONFIG, EVENTS, MISSION_STATUS } from '../config/constants.js';
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

    const loaded = this.progressStore.load();
    this.statusById = loaded.statusById;
    this.wrongAttempts = loaded.wrongAttempts;
    this.introCompleted = Boolean(loaded.introCompleted);
    this.shownHackerMessages = new Set(loaded.shownHackerMessages || []);
    this.exploredSectors = new Set(loaded.exploredSectors || ['sector-reception']);
    this.maxWrongAttempts = APP_CONFIG.MAX_WRONG_ATTEMPTS;
    this.allCompletedEmitted = this.isAllCompleted();
  }

  hasSavedProgress() {
    const completedCount = this.getCompletedCount();
    return Boolean(this.introCompleted || completedCount > 0 || this.wrongAttempts > 0);
  }

  markIntroCompleted() {
    this.introCompleted = true;
    this.saveState();
  }

  markSectorExplored(sectorId) {
    if (!sectorId) return false;
    if (this.exploredSectors.has(sectorId)) return false;
    this.exploredSectors.add(sectorId);
    this.saveState();
    return true;
  }

  isSectorExplored(sectorId) {
    return this.exploredSectors.has(sectorId);
  }

  hasShownHackerMessage(missionId) {
    return this.shownHackerMessages.has(missionId);
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

  getWrongAttempts() {
    return this.wrongAttempts;
  }

  getRemainingAttempts() {
    return Math.max(0, this.maxWrongAttempts - this.wrongAttempts);
  }

  isOutOfAttempts() {
    return this.wrongAttempts >= this.maxWrongAttempts;
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
    if (this.isOutOfAttempts()) {
      return 'Mentor Bot C-2011: "Bạn đã dùng hết 3/3 lượt thử sai. Hãy nhấn RESET TRÒ CHƠI để bình tĩnh làm lại từ đầu nhé!"';
    }
    if (this.isAllCompleted()) {
      return 'Mentor Bot C-2011: "Xuất sắc! Bạn đã sửa xong cả 4 sự cố kỹ thuật. Nhưng Lõi Trung Tâm vừa phát hiện một lỗ hổng cuối cùng: BUG #005..."';
    }
    const current = this.getCurrentActiveMission();
    if (current && current.mentorHint) {
      return `${current.mentorHint} (Số cơ hội còn lại: ${this.getRemainingAttempts()}/${this.maxWrongAttempts})`;
    }
    return 'Mentor Bot C-2011: "Hãy bắt đầu điều tra từ phòng IT OFFICE (BUG #001) ở góc Tây Bắc nhé!"';
  }

  startMission(missionId) {
    const status = this.getMissionStatus(missionId);
    if (status === MISSION_STATUS.LOCKED) {
      const current = this.getCurrentActiveMission();
      return {
        canOpen: false,
        reason: current
          ? `Khu vực / Trạm này đang khóa [LOCKED]. Hãy hoàn thành ${current.code} tại ${current.location || current.title} trước nhé!`
          : 'Nhiệm vụ này hiện đang khóa.',
      };
    }

    const missionObj = this.getMissionById(missionId);
    if (missionObj?.sectorId) {
      this.markSectorExplored(missionObj.sectorId);
    }

    if (status === MISSION_STATUS.AVAILABLE && !this.isOutOfAttempts()) {
      this.statusById[missionId] = MISSION_STATUS.IN_PROGRESS;
      this.saveState();
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
      this.saveState();
      this.emitUpdate();
    }
  }

  submitMissionAnswer(missionId, payload) {
    const mission = this.getMissionById(missionId);
    if (!mission) {
      return {
        isValid: false,
        alreadyCompleted: false,
        outOfAttempts: this.isOutOfAttempts(),
        remainingAttempts: this.getRemainingAttempts(),
        wrongOptionIds: [],
        feedback: 'Không tìm thấy nhiệm vụ.',
      };
    }

    if (mission.status === MISSION_STATUS.COMPLETED) {
      return {
        isValid: true,
        alreadyCompleted: true,
        outOfAttempts: false,
        remainingAttempts: this.getRemainingAttempts(),
        wrongOptionIds: [],
        hackerMessage: null,
        feedback: 'Nhiệm vụ này đã được bạn hoàn thành trước đó.',
      };
    }

    if (this.isOutOfAttempts()) {
      return {
        isValid: false,
        alreadyCompleted: false,
        outOfAttempts: true,
        remainingAttempts: 0,
        wrongOptionIds: [],
        feedback:
          'Bạn đã hết cả 3/3 cơ hội trả lời sai trong 4 nhiệm vụ. Vui lòng nhấn "RESET TRÒ CHƠI" để bắt đầu lại!',
      };
    }

    if (mission.status === MISSION_STATUS.LOCKED) {
      return {
        isValid: false,
        alreadyCompleted: false,
        outOfAttempts: false,
        remainingAttempts: this.getRemainingAttempts(),
        wrongOptionIds: [],
        feedback: 'Nhiệm vụ này chưa được mở khóa.',
      };
    }

    const validation = MissionValidator.validate(mission, payload);

    if (!validation.isValid) {
      if (!validation.isEmptyInput) {
        this.wrongAttempts = Math.min(this.maxWrongAttempts, this.wrongAttempts + 1);
        this.saveState();
        this.emitUpdate();

        this.eventBus.emit(EVENTS.MISSION_FAILED_ATTEMPT, {
          missionId,
          wrongAttempts: this.wrongAttempts,
          remainingAttempts: this.getRemainingAttempts(),
          outOfAttempts: this.isOutOfAttempts(),
        });

        if (this.isOutOfAttempts()) {
          this.eventBus.emit(EVENTS.MISSION_OUT_OF_ATTEMPTS, {
            wrongAttempts: this.wrongAttempts,
            maxWrongAttempts: this.maxWrongAttempts,
          });
        }
      }

      const outOfAttempts = this.isOutOfAttempts();
      const remainingAttempts = this.getRemainingAttempts();

      const attemptSuffix = validation.isEmptyInput
        ? ''
        : outOfAttempts
          ? ' [ĐÃ SAI 3/3 LẦN — HẾT LƯỢT THỬ! BẠN PHẢI RESET TRÒ CHƠI]'
          : ` [Đáp án sai! Bạn còn ${remainingAttempts}/${this.maxWrongAttempts} cơ hội thử lại cho cả 4 câu]`;

      return {
        isValid: false,
        isEmptyInput: Boolean(validation.isEmptyInput),
        alreadyCompleted: false,
        outOfAttempts,
        wrongAttempts: this.wrongAttempts,
        remainingAttempts,
        wrongOptionIds: validation.wrongOptionIds || [],
        feedback: `${validation.feedback}${attemptSuffix}`,
      };
    }

    // Mark sector explored & current mission COMPLETED
    if (mission.sectorId) {
      this.exploredSectors.add(mission.sectorId);
    }
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

    // Trigger Hacker Message strictly once per mission in sequential order
    let triggeredHackerMessage = null;
    if (mission.hackerMessageAfter && !this.shownHackerMessages.has(missionId)) {
      this.shownHackerMessages.add(missionId);
      triggeredHackerMessage = mission.hackerMessageAfter;
    }

    this.saveState();
    this.emitUpdate();

    const completedCount = this.getCompletedCount();
    const totalCount = this.getTotalCount();
    const updatedMission = this.getMissionById(missionId);

    this.eventBus.emit(EVENTS.MISSION_COMPLETED, {
      mission: updatedMission,
      unlockedNextMission,
      completedCount,
      totalCount,
      hackerMessage: triggeredHackerMessage,
    });

    if (triggeredHackerMessage) {
      this.eventBus.emit(EVENTS.HACKER_MESSAGE_RECEIVED, {
        missionId,
        order: updatedMission.order,
        missionTitle: updatedMission.investigationTitle || updatedMission.title,
        location: updatedMission.location || '',
        restorationMessage: updatedMission.restorationMessage || '',
        hackerMessage: triggeredHackerMessage,
        isFinalClue: completedCount === totalCount,
      });
    }

    if (completedCount === totalCount && !this.allCompletedEmitted) {
      this.allCompletedEmitted = true;
      this.eventBus.emit(EVENTS.CENTRAL_CONTROL_UNLOCKED, {
        completedCount,
        totalCount,
      });
      this.eventBus.emit(EVENTS.ALL_MISSIONS_COMPLETED, {
        completedCount,
        totalCount,
      });
    }

    return {
      isValid: true,
      alreadyCompleted: false,
      outOfAttempts: false,
      remainingAttempts: this.getRemainingAttempts(),
      wrongOptionIds: [],
      feedback: validation.feedback,
      restorationMessage: updatedMission.restorationMessage || '',
      hackerMessage: triggeredHackerMessage,
      unlockedNextMission,
      allCompleted: completedCount === totalCount,
    };
  }

  saveState() {
    this.progressStore.save({
      statusById: this.statusById,
      wrongAttempts: this.wrongAttempts,
      introCompleted: this.introCompleted,
      shownHackerMessages: Array.from(this.shownHackerMessages),
      exploredSectors: Array.from(this.exploredSectors),
    });
  }

  resetProgress() {
    const fresh = this.progressStore.reset();
    this.statusById = fresh.statusById;
    this.wrongAttempts = fresh.wrongAttempts;
    this.introCompleted = Boolean(fresh.introCompleted);
    this.shownHackerMessages = new Set(fresh.shownHackerMessages || []);
    this.exploredSectors = new Set(fresh.exploredSectors || ['sector-reception']);
    this.allCompletedEmitted = false;
    this.emitUpdate();
    this.eventBus.emit(EVENTS.MISSION_PROGRESS_RESET, {
      completedCount: 0,
      totalCount: this.getTotalCount(),
      remainingAttempts: this.getRemainingAttempts(),
    });
  }

  emitUpdate() {
    this.eventBus.emit(EVENTS.MISSION_UPDATED, {
      missions: this.getAllMissions(),
      completedCount: this.getCompletedCount(),
      totalCount: this.getTotalCount(),
      wrongAttempts: this.wrongAttempts,
      remainingAttempts: this.getRemainingAttempts(),
      maxWrongAttempts: this.maxWrongAttempts,
      outOfAttempts: this.isOutOfAttempts(),
    });
  }
}

export const missionManager = new MissionManager();
export default MissionManager;
