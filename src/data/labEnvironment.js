export const GRID_SIZE = 48;

export const LAB_BOUNDS = {
  x: 48,
  y: 48,
  width: 1536,
  height: 960,
};

export const WORLD_WIDTH = 1632;
export const WORLD_HEIGHT = 1056;

// Player starts in RECEPTION (South-Center, just above the big CodeGym logo)
export const PLAYER_START = {
  x: 816,
  y: 720,
  speed: 240,
};

export const SECTOR_STATUS = {
  UNEXPLORED: 'UNEXPLORED',
  EXPLORED: 'EXPLORED',
  ANOMALY_DETECTED: 'ANOMALY_DETECTED',
  RESTORED: 'RESTORED',
};

/**
 * Helper to convert exact bounding box (left, top, right, bottom) into center-origin (x, y, width, height).
 */
function wallBox(id, left, top, right, bottom) {
  const width = right - left;
  const height = bottom - top;
  return {
    id,
    x: left + width / 2,
    y: top + height / 2,
    width,
    height,
    label: 'WALL',
    kind: 'wall',
  };
}

export const SECTORS = [
  {
    id: 'sector-reception',
    code: 'SEC-01',
    name: 'RECEPTION',
    viName: 'Khu vực Lễ tân',
    x: 568,
    y: 664,
    width: 496,
    height: 328,
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
    x: 568,
    y: 64,
    width: 496,
    height: 312,
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
    x: 64,
    y: 64,
    width: 440,
    height: 400,
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
    x: 1128,
    y: 64,
    width: 440,
    height: 400,
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
    x: 64,
    y: 576,
    width: 440,
    height: 416,
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
    x: 1128,
    y: 576,
    width: 440,
    height: 416,
    floorColor: 0x0c2229,
    accentColor: 0x10b981,
    missionId: 'mission-04',
    description: 'Phòng điều phối tường lửa, camera an ninh và lưu trữ nhật ký đào tạo của Mentor (BUG #004).',
  },
];

// Wide doorways (180px - 200px wide) for smooth, spacious entry into every room
export const ROOM_DOORS = [
  {
    id: 'door-reception-north',
    sectorId: 'sector-reception',
    x: 816,
    y: 673,
    width: 200,
    height: 18,
    label: 'CỬA LỄ TÂN',
  },
  {
    id: 'door-central-south',
    sectorId: 'sector-central-control',
    x: 816,
    y: 367,
    width: 200,
    height: 18,
    label: 'CỬA ĐIỀU HÀNH',
  },
  {
    id: 'door-it-east',
    sectorId: 'sector-it-office',
    x: 495,
    y: 280,
    width: 18,
    height: 180,
    label: 'CỬA IT OFFICE',
  },
  {
    id: 'door-db-west',
    sectorId: 'sector-database-room',
    x: 1137,
    y: 280,
    width: 18,
    height: 180,
    label: 'CỬA DATABASE',
  },
  {
    id: 'door-server-east',
    sectorId: 'sector-server-room',
    x: 495,
    y: 784,
    width: 18,
    height: 180,
    label: 'CỬA SERVER ROOM',
  },
  {
    id: 'door-security-west',
    sectorId: 'sector-security-room',
    x: 1137,
    y: 784,
    width: 18,
    height: 180,
    label: 'CỬA SECURITY ROOM',
  },
];

// Complete 4-sided walls enclosing all 6 rooms so players can ONLY enter through the doors
export const LAB_OBSTACLES = [
  // =========================================================================
  // 1. IT OFFICE WALLS (Bounds: left=64, top=64, right=504, bottom=464; Door on East y=190..370)
  // =========================================================================
  wallBox('wall-it-north', 64, 64, 504, 82),
  wallBox('wall-it-west', 64, 64, 82, 464),
  wallBox('wall-it-south', 64, 446, 504, 464),
  wallBox('wall-it-east-top', 486, 64, 504, 190),
  wallBox('wall-it-east-bottom', 486, 370, 504, 464),

  // =========================================================================
  // 2. DATABASE ROOM WALLS (Bounds: left=1128, top=64, right=1568, bottom=464; Door on West y=190..370)
  // =========================================================================
  wallBox('wall-db-north', 1128, 64, 1568, 82),
  wallBox('wall-db-east', 1550, 64, 1568, 464),
  wallBox('wall-db-south', 1128, 446, 1568, 464),
  wallBox('wall-db-west-top', 1128, 64, 1146, 190),
  wallBox('wall-db-west-bottom', 1128, 370, 1146, 464),

  // =========================================================================
  // 3. SERVER ROOM WALLS (Bounds: left=64, top=576, right=504, bottom=992; Door on East y=694..874)
  // =========================================================================
  wallBox('wall-srv-north', 64, 576, 504, 594),
  wallBox('wall-srv-west', 64, 576, 82, 992),
  wallBox('wall-srv-south', 64, 974, 504, 992),
  wallBox('wall-srv-east-top', 486, 576, 504, 694),
  wallBox('wall-srv-east-bottom', 486, 874, 504, 992),

  // =========================================================================
  // 4. SECURITY ROOM WALLS (Bounds: left=1128, top=576, right=1568, bottom=992; Door on West y=694..874)
  // =========================================================================
  wallBox('wall-sec-north', 1128, 576, 1568, 594),
  wallBox('wall-sec-east', 1550, 576, 1568, 992),
  wallBox('wall-sec-south', 1128, 974, 1568, 992),
  wallBox('wall-sec-west-top', 1128, 576, 1146, 694),
  wallBox('wall-sec-west-bottom', 1128, 874, 1146, 992),

  // =========================================================================
  // 5. CENTRAL CONTROL ROOM WALLS (Bounds: left=568, top=64, right=1064, bottom=376; Door on South x=716..916)
  // =========================================================================
  wallBox('wall-ctrl-north', 568, 64, 1064, 82),
  wallBox('wall-ctrl-west', 568, 64, 586, 376),
  wallBox('wall-ctrl-east', 1046, 64, 1064, 376),
  wallBox('wall-ctrl-south-left', 568, 358, 716, 376),
  wallBox('wall-ctrl-south-right', 916, 358, 1064, 376),

  // =========================================================================
  // 6. RECEPTION WALLS (Bounds: left=568, top=664, right=1064, bottom=992; Door on North x=716..916)
  // =========================================================================
  wallBox('wall-rec-south', 568, 974, 1064, 992),
  wallBox('wall-rec-west', 568, 664, 586, 992),
  wallBox('wall-rec-east', 1046, 664, 1064, 992),
  wallBox('wall-rec-north-left', 568, 664, 716, 682),
  wallBox('wall-rec-north-right', 916, 664, 1064, 682),

  // =========================================================================
  // ROOM FURNITURE & HARDWARE UNITS (Placed away from doorways)
  // =========================================================================
  // 1. RECEPTION (Placed on left & right sides so center 220x220 CodeGym logo is 100% clear)
  { id: 'reception-desk', x: 645, y: 915, width: 96, height: 38, label: 'BÀN LỄ TÂN', kind: 'desk' },
  { id: 'reception-sofa', x: 985, y: 915, width: 96, height: 38, label: 'SOFA KHÁCH', kind: 'desk' },

  // 2. CENTRAL CONTROL ROOM
  { id: 'central-core-pillar', x: 816, y: 145, width: 150, height: 46, label: 'MAINFRAME_CORE', kind: 'server' },

  // 3. IT OFFICE
  { id: 'it-desk-north', x: 185, y: 155, width: 125, height: 40, label: 'BÀN IT_01', kind: 'desk' },
  { id: 'it-desk-south', x: 185, y: 385, width: 125, height: 40, label: 'BÀN IT_02', kind: 'desk' },

  // 4. DATABASE ROOM
  { id: 'db-cabinet-north', x: 1435, y: 155, width: 120, height: 42, label: 'TỦ HỒ SƠ A', kind: 'cabinet' },
  { id: 'db-rack-south', x: 1435, y: 385, width: 120, height: 42, label: 'DB_CLUSTER', kind: 'server' },

  // 5. SERVER ROOM
  { id: 'server-rack-1', x: 185, y: 660, width: 120, height: 44, label: 'SERVER_RACK_01', kind: 'server' },
  { id: 'server-rack-2', x: 185, y: 910, width: 120, height: 44, label: 'SERVER_RACK_02', kind: 'server' },

  // 6. SECURITY ROOM
  { id: 'sec-monitor-bank', x: 1435, y: 660, width: 120, height: 42, label: 'TRẠM CAMERA', kind: 'desk' },
  { id: 'sec-cabinet-logs', x: 1435, y: 910, width: 120, height: 42, label: 'TỦ NHẬT KÝ', kind: 'cabinet' },
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
    x: 320,
    y: 275,
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
    x: 1300,
    y: 275,
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
    x: 320,
    y: 780,
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
    x: 1300,
    y: 780,
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
    y: 235,
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
    x: 645,
    y: 775,
    radius: 74,
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
    x: 615,
    y: 520,
    radius: 72,
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
    x: 1015,
    y: 520,
    radius: 72,
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
    x: 1435,
    y: 230,
    radius: 74,
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
    x: 185,
    y: 740,
    radius: 74,
    color: 0xfb7185,
    hintMessage: 'Tủ Máy chủ Vật lý — Nhấn [E] để kiểm tra cảm biến nhiệt độ.',
    inspectionTitle: 'CHẨN ĐOÁN: TỦ MÁY CHỦ RACK #01',
    inspectionText:
      'Đèn cảnh báo nhấp nháy liên tục: Một vòng lặp while kiểm tra hạn nộp bài tập bị thiếu bước tăng biến đếm (count++) khiến tiến trình không thể kết thúc.',
  },
];
