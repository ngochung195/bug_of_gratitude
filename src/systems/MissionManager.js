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
    this.maxWrongAttempts = APP_CONFIG.MAX_WRONG_ATTEMPTS;
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
      return 'Mentor Bot C-2011: "Xuất sắc! Bạn đã sửa xong cả 4 Bug kỹ thuật. Nhưng hệ thống vừa phát hiện một tín hiệu lạ ở trung tâm..."';
    }
    const current = this.getCurrentActiveMission();
    if (current && current.mentorHint) {
      return `${current.mentorHint} (Số cơ hội còn lại: ${this.getRemainingAttempts()}/${this.maxWrongAttempts})`;
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
      // Only deduct an attempt if the user actually selected/typed a wrong answer (not empty)
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

    this.saveState();
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
      outOfAttempts: false,
      remainingAttempts: this.getRemainingAttempts(),
      wrongOptionIds: [],
      feedback: validation.feedback,
      unlockedNextMission,
      allCompleted: completedCount === totalCount,
    };
  }

  saveState() {
    this.progressStore.save({
      statusById: this.statusById,
      wrongAttempts: this.wrongAttempts,
    });
  }

  resetProgress() {
    const fresh = this.progressStore.reset();
    this.statusById = fresh.statusById;
    this.wrongAttempts = fresh.wrongAttempts;
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
