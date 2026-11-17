export const SPEAKER_TYPES = {
  PLAYER: 'PLAYER',
  UNKNOWN: 'UNKNOWN',
  SYSTEM: 'SYSTEM',
};

export const SPEAKER_PROFILES = {
  [SPEAKER_TYPES.PLAYER]: {
    id: SPEAKER_TYPES.PLAYER,
    name: 'PLAYER // IT SPECIALIST',
    role: 'Chuyên viên IT Trực Hệ Thống CodeGym',
    accentColor: '#00e5ff',
  },
  [SPEAKER_TYPES.UNKNOWN]: {
    id: SPEAKER_TYPES.UNKNOWN,
    name: 'UNKNOWN // MYSTERIOUS HACKER',
    role: 'Kẻ Xâm Nhập Mạng Nội Bộ',
    accentColor: '#f43f5e',
  },
  [SPEAKER_TYPES.SYSTEM]: {
    id: SPEAKER_TYPES.SYSTEM,
    name: 'SYSTEM // CODEGYM SECURITY OS',
    role: 'Hệ Thống Giám Sát Trung Tâm',
    accentColor: '#fbbf24',
  },
};

export const CINEMATIC_SCENES = [
  {
    id: 'scene-1-normal-day',
    sceneNumber: 1,
    code: 'SCENE 01 // A NORMAL DAY',
    title: 'A NORMAL DAY',
    timeLabel: '21:15 // CODEGYM HEADQUARTERS',
    visualMood: 'normal-office',
    speaker: SPEAKER_TYPES.PLAYER,
    text: 'Bạn là một nhân viên IT tại CodeGym. Công việc của bạn là đảm bảo hệ thống công nghệ thông tin luôn hoạt động ổn định và an toàn.',
  },
  {
    id: 'scene-2-night-shift',
    sceneNumber: 2,
    code: 'SCENE 02 // 23:47',
    title: '23:47',
    timeLabel: '23:47 // NIGHT SHIFT MONITORING',
    visualMood: 'late-night',
    speaker: SPEAKER_TYPES.PLAYER,
    text: 'Đêm nay, bạn vẫn đang trực hệ thống như thường lệ.',
  },
  {
    id: 'scene-3-system-breach',
    sceneNumber: 3,
    code: 'SCENE 03 // SYSTEM BREACH',
    title: 'SYSTEM BREACH',
    timeLabel: '23:48:04 // CRITICAL INTRUSION DETECTED',
    visualMood: 'breach-glitch',
    speaker: SPEAKER_TYPES.SYSTEM,
    alertBanner: 'SYSTEM SECURITY COMPROMISED.',
    text: 'SYSTEM SECURITY COMPROMISED.\nCẢNH BÁO ĐỎ: Máy chủ mất kết nối. Cơ sở dữ liệu xuất hiện lỗi. Hệ thống bảo mật bị vô hiệu hóa!',
  },
  {
    id: 'scene-4-unknown-hacker',
    sceneNumber: 4,
    code: 'SCENE 04 // UNKNOWN HACKER',
    title: 'UNKNOWN HACKER',
    timeLabel: '23:48:30 // INCOMING ENCRYPTED TRANSMISSION',
    visualMood: 'hacker-transmission',
    speaker: SPEAKER_TYPES.UNKNOWN,
    text: 'Xin chào, nhân viên IT.\n\nTa đã để lại một vài vấn đề trong hệ thống của các người.\n\nHãy tìm chúng. Sửa chúng.\n\nNếu không, CodeGym sẽ không thể hoạt động như trước nữa.',
  },
  {
    id: 'scene-5-your-mission',
    sceneNumber: 5,
    code: 'SCENE 05 // YOUR MISSION',
    title: 'YOUR MISSION',
    timeLabel: '23:49:00 // EMERGENCY PROTOCOL ACTIVATED',
    visualMood: 'mission-ready',
    speaker: SPEAKER_TYPES.SYSTEM,
    text: 'Bạn chỉ có một lựa chọn: khám phá công ty, tìm ra các điểm bị phá hoại và khôi phục hệ thống.',
    isFinalScene: true,
    ctaLabel: 'START INVESTIGATION',
  },
];

export default CINEMATIC_SCENES;

