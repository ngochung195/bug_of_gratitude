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
    missionId: 'mission-01',
    type: 'terminal',
    code: 'BUG #001',
    name: 'Trạm Terminal Alpha',
    x: 270,
    y: 255,
    radius: 78,
    color: 0x00e5ff,
    hintMessage: 'MISSION 01: THE FIRST LOOP (BUG #001) — Nhấn [E] để mở Terminal xử lý lỗi.',
  },
  {
    id: 'mission-station-2',
    missionId: 'mission-02',
    type: 'terminal',
    code: 'BUG #002',
    name: 'Trạm Terminal Beta',
    x: 1010,
    y: 255,
    radius: 78,
    color: 0x8b5cf6,
    hintMessage: 'MISSION 02: NULL NIGHTMARE (BUG #002) — Nhấn [E] để mở Terminal xử lý lỗi.',
  },
  {
    id: 'mission-station-3',
    missionId: 'mission-03',
    type: 'terminal',
    code: 'BUG #003',
    name: 'Trạm Terminal Gamma',
    x: 270,
    y: 445,
    radius: 78,
    color: 0xf43f5e,
    hintMessage: 'MISSION 03: INFINITE DEADLINE (BUG #003) — Nhấn [E] để mở Terminal xử lý lỗi.',
  },
  {
    id: 'mission-station-4',
    missionId: 'mission-04',
    type: 'terminal',
    code: 'BUG #004',
    name: 'Trạm Terminal Delta',
    x: 1010,
    y: 445,
    radius: 78,
    color: 0x10b981,
    hintMessage: "MISSION 04: THE MENTOR'S VOICE (BUG #004) — Nhấn [E] để mở bài kiểm tra.",
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
    hintMessage: 'Mentor Bot C-2011 — Nhấn [E] để nhận gợi ý nhiệm vụ hiện tại.',
  },
];
