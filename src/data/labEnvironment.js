export const GRID_SIZE = 48;

export const LAB_BOUNDS = {
  x: 48,
  y: 48,
  width: 1536,
  height: 960,
};

export const WORLD_WIDTH = 1632;
export const WORLD_HEIGHT = 1056;

// Player starts in RECEPTION (South-Center)
export const PLAYER_START = {
  x: 816,
  y: 860,
  speed: 235,
};

export const SECTOR_STATUS = {
  UNEXPLORED: 'UNEXPLORED',
  EXPLORED: 'EXPLORED',
  ANOMALY_DETECTED: 'ANOMALY_DETECTED',
  RESTORED: 'RESTORED',
};

export const SECTORS = [
  {
    id: 'sector-reception',
    code: 'SEC-01',
    name: 'RECEPTION',
    viName: 'Khu vực Lễ tân',
    x: 560,
    y: 680,
    width: 512,
    height: 300,
    floorColor: 0x0f172a,
    accentColor: 0x38bdf8,
    missionId: null,
    description: 'Sảnh đón tiếp chính của trụ sở CodeGym. Cổng an ninh nội bộ kết nối vào hành lang trung tâm.',
  },
  {
    id: 'sector-central-control',
    code: 'SEC-02',
    name: 'CENTRAL CONTROL ROOM',
    viName: 'Phòng Điều hành Trung tâm',
    x: 560,
    y: 72,
    width: 512,
    height: 310,
    floorColor: 0x131b38,
    accentColor: 0xf59e0b,
    missionId: null,
    description: 'Trung tâm chỉ huy và giám sát toàn bộ hạ tầng công nghệ thông tin của CodeGym.',
  },
  {
    id: 'sector-it-office',
    code: 'SEC-03',
    name: 'IT OFFICE',
    viName: 'Phòng Làm việc IT',
    x: 72,
    y: 72,
    width: 440,
    height: 410,
    floorColor: 0x0d1b2a,
    accentColor: 0x00e5ff,
    missionId: 'mission-01',
    description: 'Phòng trực kỹ thuật của đội ngũ IT. Hệ thống khởi tạo trạm làm việc đang báo lỗi BUG #001.',
  },
  {
    id: 'sector-database-room',
    code: 'SEC-04',
    name: 'DATABASE ROOM',
    viName: 'Phòng Cơ sở Dữ liệu',
    x: 1120,
    y: 72,
    width: 440,
    height: 410,
    floorColor: 0x161332,
    accentColor: 0x8b5cf6,
    missionId: 'mission-02',
    description: 'Nơi lưu trữ hồ sơ học viên và dữ liệu đào tạo CodeGym. Đang phát sinh sự cố BUG #002.',
  },
  {
    id: 'sector-server-room',
    code: 'SEC-05',
    name: 'SERVER ROOM',
    viName: 'Phòng Máy chủ',
    x: 72,
    y: 560,
    width: 440,
    height: 420,
    floorColor: 0x1a1128,
    accentColor: 0xf43f5e,
    missionId: 'mission-03',
    description: 'Khu vực máy chủ vật lý công suất cao. Quạt tản nhiệt đang hú lớn do tiến trình lặp vô hạn BUG #003.',
  },
  {
    id: 'sector-security-room',
    code: 'SEC-06',
    name: 'SECURITY ROOM',
    viName: 'Phòng Bảo mật',
    x: 1120,
    y: 560,
    width: 440,
    height: 420,
    floorColor: 0x0c2229,
    accentColor: 0x10b981,
    missionId: 'mission-04',
    description: 'Phòng điều phối tường lửa, camera an ninh và lưu trữ nhật ký đào tạo của Mentor (BUG #004).',
  },
];

// Doors connecting rooms to the central grid corridors (walk-through sensor thresholds)
export const ROOM_DOORS = [
  { id: 'door-reception-north', x: 816, y: 680, width: 120, height: 18, label: 'CỬA LỄ TÂN' },
  { id: 'door-central-south', x: 816, y: 382, width: 120, height: 18, label: 'CỬA ĐIỀU HÀNH' },
  { id: 'door-it-east', x: 512, y: 280, width: 18, height: 110, label: 'CỬA IT OFFICE' },
  { id: 'door-db-west', x: 1120, y: 280, width: 18, height: 110, label: 'CỬA DATABASE' },
  { id: 'door-server-east', x: 512, y: 740, width: 18, height: 110, label: 'CỬA SERVER ROOM' },
  { id: 'door-security-west', x: 1120, y: 740, width: 18, height: 110, label: 'CỬA SECURITY ROOM' },
];

// Solid partition walls & room furniture obstacles (with clear 110-120px doorways)
export const LAB_OBSTACLES = [
  // --- Partition Walls with Doorways ---
  // Reception top wall (left & right of door at x=816)
  { id: 'wall-rec-left', x: 650, y: 680, width: 180, height: 18, label: 'WALL', kind: 'wall' },
  { id: 'wall-rec-right', x: 982, y: 680, width: 180, height: 18, label: 'WALL', kind: 'wall' },

  // Central Control bottom wall (left & right of door at x=816)
  { id: 'wall-ctrl-left', x: 650, y: 382, width: 180, height: 18, label: 'WALL', kind: 'wall' },
  { id: 'wall-ctrl-right', x: 982, y: 382, width: 180, height: 18, label: 'WALL', kind: 'wall' },

  // IT Office right wall (above & below door at y=280)
  { id: 'wall-it-top', x: 512, y: 148, width: 18, height: 150, label: 'WALL', kind: 'wall' },
  { id: 'wall-it-bottom', x: 512, y: 408, width: 18, height: 140, label: 'WALL', kind: 'wall' },

  // Database Room left wall (above & below door at y=280)
  { id: 'wall-db-top', x: 1120, y: 148, width: 18, height: 150, label: 'WALL', kind: 'wall' },
  { id: 'wall-db-bottom', x: 1120, y: 408, width: 18, height: 140, label: 'WALL', kind: 'wall' },

  // Server Room right wall (above & below door at y=740)
  { id: 'wall-srv-top', x: 512, y: 620, width: 18, height: 120, label: 'WALL', kind: 'wall' },
  { id: 'wall-srv-bottom', x: 512, y: 880, width: 18, height: 160, label: 'WALL', kind: 'wall' },

  // Security Room left wall (above & below door at y=740)
  { id: 'wall-sec-top', x: 1120, y: 620, width: 18, height: 120, label: 'WALL', kind: 'wall' },
  { id: 'wall-sec-bottom', x: 1120, y: 880, width: 18, height: 160, label: 'WALL', kind: 'wall' },

  // --- Bomberman-inspired Grid Pillars in Central Corridor ---
  { id: 'grid-pillar-1', x: 660, y: 528, width: 48, height: 48, label: 'PILLAR_A', kind: 'pillar' },
  { id: 'grid-pillar-2', x: 972, y: 528, width: 48, height: 48, label: 'PILLAR_B', kind: 'pillar' },

  // --- Room Furniture & Hardware Units ---
  // 1. RECEPTION
  { id: 'reception-desk', x: 660, y: 830, width: 120, height: 42, label: 'BÀN LỄ TÂN', kind: 'desk' },
  { id: 'reception-sofa', x: 960, y: 830, width: 110, height: 42, label: 'SOFA KHÁCH', kind: 'desk' },

  // 2. CENTRAL CONTROL ROOM
  { id: 'central-core-pillar', x: 816, y: 145, width: 150, height: 48, label: 'MAINFRAME_CORE', kind: 'server' },

  // 3. IT OFFICE
  { id: 'it-desk-north', x: 190, y: 150, width: 130, height: 42, label: 'BÀN IT_01', kind: 'desk' },
  { id: 'it-desk-south', x: 190, y: 390, width: 130, height: 42, label: 'BÀN IT_02', kind: 'desk' },

  // 4. DATABASE ROOM
  { id: 'db-cabinet-north', x: 1420, y: 150, width: 120, height: 44, label: 'TỦ HỒ SƠ A', kind: 'cabinet' },
  { id: 'db-rack-south', x: 1420, y: 390, width: 120, height: 44, label: 'DB_CLUSTER', kind: 'server' },

  // 5. SERVER ROOM
  { id: 'server-rack-1', x: 190, y: 640, width: 125, height: 46, label: 'SERVER_RACK_01', kind: 'server' },
  { id: 'server-rack-2', x: 190, y: 890, width: 125, height: 46, label: 'SERVER_RACK_02', kind: 'server' },

  // 6. SECURITY ROOM
  { id: 'sec-monitor-bank', x: 1420, y: 640, width: 125, height: 44, label: 'TRẠM CAMERA', kind: 'desk' },
  { id: 'sec-cabinet-logs', x: 1420, y: 890, width: 125, height: 44, label: 'TỦ NHẬT KÝ', kind: 'cabinet' },
];

export const INTERACTABLE_OBJECTS = [
  // =========================================================================
  // 4 ANOMALY TERMINALS (MISSION #001 .. #004)
  // =========================================================================
  {
    id: 'mission-station-1',
    missionId: 'mission-01',
    sectorId: 'sector-it-office',
    type: 'terminal',
    objectCategory: 'Máy tính',
    code: 'BUG #001',
    name: 'Máy tính Trực IT (Terminal Alpha)',
    x: 340,
    y: 265,
    radius: 82,
    color: 0x00e5ff,
    hintMessage: 'PHÁT HIỆN SỰ CỐ [IT OFFICE]: Máy tính khởi tạo bị treo vòng lặp (BUG #001) — Nhấn [E] để Quét & Sửa lỗi.',
  },
  {
    id: 'mission-station-2',
    missionId: 'mission-02',
    sectorId: 'sector-database-room',
    type: 'terminal',
    objectCategory: 'Máy chủ CSDL',
    code: 'BUG #002',
    name: 'Trạm Cơ Sở Dữ Liệu (Terminal Beta)',
    x: 1290,
    y: 265,
    radius: 82,
    color: 0x8b5cf6,
    hintMessage: 'PHÁT HIỆN SỰ CỐ [DATABASE ROOM]: Truy vấn hồ sơ văng lỗi Null (BUG #002) — Nhấn [E] để Quét & Sửa lỗi.',
  },
  {
    id: 'mission-station-3',
    missionId: 'mission-03',
    sectorId: 'sector-server-room',
    type: 'terminal',
    objectCategory: 'Máy chủ',
    code: 'BUG #003',
    name: 'Máy Chủ Trung Tâm (Terminal Gamma)',
    x: 340,
    y: 760,
    radius: 82,
    color: 0xf43f5e,
    hintMessage: 'PHÁT HIỆN SỰ CỐ [SERVER ROOM]: Máy chủ quá tải CPU 100% (BUG #003) — Nhấn [E] để Quét & Sửa lỗi.',
  },
  {
    id: 'mission-station-4',
    missionId: 'mission-04',
    sectorId: 'sector-security-room',
    type: 'terminal',
    objectCategory: 'Thiết bị bảo mật',
    code: 'BUG #004',
    name: 'Trạm Lưu Trữ Ký Ức (Terminal Delta)',
    x: 1290,
    y: 760,
    radius: 82,
    color: 0x10b981,
    hintMessage: "PHÁT HIỆN SỰ CỐ [SECURITY ROOM]: Khóa bảo mật giọng nói Mentor (BUG #004) — Nhấn [E] để Giải mã.",
  },

  // =========================================================================
  // CENTRAL AI & INSPECTABLE OFFICE OBJECTS (CLUES & EQUIPMENT)
  // =========================================================================
  {
    id: 'npc-mentor-bot',
    sectorId: 'sector-central-control',
    type: 'npc',
    objectCategory: 'Hệ thống điều hành',
    code: 'CONTROL_AI',
    name: 'Trợ lý Điều hành C-2011',
    x: 816,
    y: 245,
    radius: 86,
    color: 0xf59e0b,
    hintMessage: 'Trợ lý Điều hành C-2011 — Nhấn [E] để phân tích tình trạng toàn trụ sở CodeGym.',
  },
  {
    id: 'prop-reception-computer',
    sectorId: 'sector-reception',
    type: 'prop',
    objectCategory: 'Bàn làm việc',
    code: 'RECEPTION_PC',
    name: 'Bàn làm việc & Máy tính Lễ tân',
    x: 660,
    y: 765,
    radius: 76,
    color: 0x38bdf8,
    hintMessage: 'Bàn làm việc Lễ tân — Nhấn [E] để kiểm tra sổ trực đêm.',
    inspectionTitle: 'KIỂM TRA: BÀN LÀM VIỆC & MÁY TÍNH LỄ TÂN',
    inspectionText:
      'Sổ trực đêm ghi nhận: "23:45 — Toàn bộ giảng viên và học viên đã ra về. Nhân viên IT trực ca đêm tại tầng 1. Hệ thống cửa tự động chuyển sang chế độ Giám sát."',
  },
  {
    id: 'prop-corridor-network',
    sectorId: 'sector-central-control',
    type: 'prop',
    objectCategory: 'Thiết bị mạng',
    code: 'NET_SWITCH',
    name: 'Thiết bị mạng Core Switch',
    x: 660,
    y: 465,
    radius: 74,
    color: 0x00e5ff,
    hintMessage: 'Thiết bị mạng Core Switch — Nhấn [E] để quét lưu lượng gói tin.',
    inspectionTitle: 'QUÉT THIẾT BỊ MẠNG: CORE SWITCH C-01',
    inspectionText:
      'Phát hiện dấu vết gói tin lạ phát tán lúc 23:48 từ cổng nội bộ tới 4 phân khu: IT Office, Database Room, Server Room và Security Room.',
  },
  {
    id: 'prop-corridor-camera',
    sectorId: 'sector-security-room',
    type: 'prop',
    objectCategory: 'Camera an ninh',
    code: 'CAM_04',
    name: 'Camera an ninh Hành lang Đông',
    x: 972,
    y: 465,
    radius: 74,
    color: 0xa855f7,
    hintMessage: 'Camera an ninh Hành lang — Nhấn [E] để trích xuất băng ghi hình.',
    inspectionTitle: 'TRÍCH XUẤT CAMERA AN NINH HÀNH LANG',
    inspectionText:
      'Băng ghi hình lúc 23:47 không có kẻ đột nhập vật lý từ cửa chính. Cuộc tấn công được kích hoạt bằng mã lệnh tự động kèm thông điệp: "Hãy nhớ lại những người đã dẫn dắt bạn."',
  },
  {
    id: 'prop-db-cabinet',
    sectorId: 'sector-database-room',
    type: 'prop',
    objectCategory: 'Tủ hồ sơ',
    code: 'ARCHIVE_CAB',
    name: 'Tủ hồ sơ Học viên & Lộ trình',
    x: 1420,
    y: 220,
    radius: 76,
    color: 0xc084fc,
    hintMessage: 'Tủ hồ sơ Học viên — Nhấn [E] để kiểm tra tài liệu lưu trữ.',
    inspectionTitle: 'KIỂM TRA: TỦ HỒ SƠ HỌC VIÊN CODEGYM',
    inspectionText:
      'Hàng trăm biên bản review code và nhận xét tận tình của giảng viên dành cho học viên được lưu giữ cẩn thận. Một mảnh giấy ghi chú: "Mọi tham chiếu null đều cần được khởi tạo bằng sự quan tâm."',
  },
  {
    id: 'prop-server-rack-diag',
    sectorId: 'sector-server-room',
    type: 'prop',
    objectCategory: 'Máy chủ',
    code: 'SRV_DIAG',
    name: 'Tủ Máy chủ Vật lý Rack #01',
    x: 190,
    y: 710,
    radius: 76,
    color: 0xfb7185,
    hintMessage: 'Tủ Máy chủ Vật lý — Nhấn [E] để kiểm tra cảm biến nhiệt độ.',
    inspectionTitle: 'CHẨN ĐOÁN: TỦ MÁY CHỦ RACK #01',
    inspectionText:
      'Đèn cảnh báo nhấp nháy liên tục: Một vòng lặp while kiểm tra hạn nộp bài tập bị thiếu bước tăng biến đếm (count++) khiến tiến trình không thể kết thúc.',
  },
  {
    id: 'prop-door-sensor',
    sectorId: 'sector-reception',
    type: 'prop',
    objectCategory: 'Cửa phòng',
    code: 'DOOR_GATE',
    name: 'Cửa phòng & Cổng Từ Nội Bộ',
    x: 930,
    y: 650,
    radius: 72,
    color: 0x38bdf8,
    hintMessage: 'Cổng Từ Cửa Phòng — Nhấn [E] để kiểm tra trạng thái khóa cửa.',
    inspectionTitle: 'TRẠNG THÁI CỬA PHÒNG TRỤ SỞ CODEGYM',
    inspectionText:
      'Hệ thống cửa từ khẩn cấp đã được chuyển sang chế độ Mở thông hành cho Chuyên viên IT trực đêm để bạn có thể di chuyển tự do qua cả 6 phòng chức năng.',
  },
];
