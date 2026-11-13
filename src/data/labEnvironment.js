export const LAB_BOUNDS = {
  x: 110,
  y: 96,
  width: 1060,
  height: 500,
};

export const PLAYER_START = {
  x: 640,
  y: 360,
  speed: 220,
};

export const LAB_OBSTACLES = [
  { id: 'server-rack-north-west', x: 250, y: 150, width: 120, height: 44, label: 'SERVER_RACK_A' },
  { id: 'server-rack-north-east', x: 1030, y: 150, width: 120, height: 44, label: 'SERVER_RACK_B' },
  { id: 'central-core-pillar', x: 640, y: 250, width: 130, height: 52, label: 'MAINFRAME_NODE' },
  { id: 'work-desk-south-west', x: 340, y: 520, width: 140, height: 42, label: 'DESK_UNIT_01' },
  { id: 'work-desk-south-east', x: 940, y: 520, width: 140, height: 42, label: 'DESK_UNIT_02' },
];

export const INTERACTABLE_OBJECTS = [
  {
    id: 'mission-station-1',
    type: 'terminal',
    code: 'BUG #001',
    name: 'Trạm Terminal Alpha',
    x: 270,
    y: 255,
    radius: 78,
    color: 0x00e5ff,
    hintMessage: 'Trạm Terminal Alpha (BUG #001) — Nhấn [E] để kiểm tra hệ thống.',
    triggerMessage: 'Đã kết nối Trạm Terminal Alpha (BUG #001). Nhiệm vụ sẽ mở ở Phase 3.',
  },
  {
    id: 'mission-station-2',
    type: 'terminal',
    code: 'BUG #002',
    name: 'Trạm Terminal Beta',
    x: 1010,
    y: 255,
    radius: 78,
    color: 0x8b5cf6,
    hintMessage: 'Trạm Terminal Beta (BUG #002) — Nhấn [E] để kiểm tra hệ thống.',
    triggerMessage: 'Đã kết nối Trạm Terminal Beta (BUG #002). Nhiệm vụ sẽ mở ở Phase 3.',
  },
  {
    id: 'mission-station-3',
    type: 'terminal',
    code: 'BUG #003',
    name: 'Trạm Terminal Gamma',
    x: 270,
    y: 445,
    radius: 78,
    color: 0xf43f5e,
    hintMessage: 'Trạm Terminal Gamma (BUG #003) — Nhấn [E] để kiểm tra hệ thống.',
    triggerMessage: 'Đã kết nối Trạm Terminal Gamma (BUG #003). Nhiệm vụ sẽ mở ở Phase 3.',
  },
  {
    id: 'mission-station-4',
    type: 'terminal',
    code: 'BUG #004',
    name: 'Trạm Terminal Delta',
    x: 1010,
    y: 445,
    radius: 78,
    color: 0x10b981,
    hintMessage: 'Trạm Terminal Delta (BUG #004) — Nhấn [E] để kiểm tra hệ thống.',
    triggerMessage: 'Đã kết nối Trạm Terminal Delta (BUG #004). Nhiệm vụ sẽ mở ở Phase 3.',
  },
  {
    id: 'npc-mentor-bot',
    type: 'npc',
    code: 'MENTOR_AI',
    name: 'Mentor Bot C-2011',
    x: 640,
    y: 165,
    radius: 82,
    color: 0xf59e0b,
    hintMessage: 'Mentor Bot C-2011 — Nhấn [E] để trò chuyện hướng dẫn.',
    triggerMessage:
      'Mentor Bot C-2011: "Hãy di chuyển tới 4 trạm Terminal xung quanh phòng Lab để rà soát các Bug nhé!"',
  },
];
