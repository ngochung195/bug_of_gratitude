/**
 * Renders a rich 2.5D Top-down Pixel Art Office (Gather.town / RPG Maker aesthetic)
 * with wood planks, ceramic tiles, carpet, dark slate lobby, 3/4 walls with white caps,
 * brick wall faces, cubicles, bookshelves, floor lamps, plants, water coolers, and server cables.
 */
export class PixelOfficeRenderer {
  constructor(scene) {
    this.scene = scene;
  }

  renderFullOffice(sectors = [], doors = []) {
    const gFloor = this.scene.add.graphics();
    gFloor.setDepth(1);

    // 1. Base Corridor Floor (Warm Light Grey Ceramic Office Tile across the building)
    this.drawCeramicTileRegion(gFloor, 48, 48, 1536, 960, 0xbdb9b3, 0xa8a49e, 32);

    // 2. Render Distinct Room Floors
    sectors.forEach((sec) => {
      if (sec.id === 'sector-it-office') {
        // Top-Left / North-West: Open IT Cubicle Workspace (Light Ceramic Tile)
        this.drawCeramicTileRegion(
          gFloor,
          sec.x,
          sec.y,
          sec.width,
          sec.height,
          0xc7c3bd,
          0xb2aea8,
          32
        );
      } else if (sec.id === 'sector-database-room') {
        // Top-Right / North-East: Database & Study Archive (Warm Oak Wood Planks)
        this.drawWoodPlankRegion(
          gFloor,
          sec.x,
          sec.y,
          sec.width,
          sec.height,
          0xb58354,
          0x96673d
        );
      } else if (sec.id === 'sector-central-control') {
        // Top-Center: Central Control & Executive Room (Light Ash Wood / Laminate)
        this.drawWoodPlankRegion(
          gFloor,
          sec.x,
          sec.y,
          sec.width,
          sec.height,
          0xc8c2b8,
          0xb0a99f
        );
      } else if (sec.id === 'sector-security-room') {
        // Bottom-Left / South-West or South-East: Olive Woven Carpet Office
        this.drawCarpetRegion(
          gFloor,
          sec.x,
          sec.y,
          sec.width,
          sec.height,
          0x747865,
          0x636756
        );
      } else if (sec.id === 'sector-server-room') {
        // Server Room: Industrial Grey Floor + Dark Grated Server Mat + Red/Grey Cable Conduits
        this.drawServerRoomFloor(gFloor, sec.x, sec.y, sec.width, sec.height);
      } else if (sec.id === 'sector-reception') {
        // Bottom-Center Main Hall: Dark Slate Tile with Subtle Watermark (like reference image)
        this.drawDarkSlateLobby(gFloor, sec.x, sec.y, sec.width, sec.height);
      }
    });

    // 3. Draw 3/4 Perspective Perimeter & Interior Walls with Brick/Panel Front Faces
    this.drawOfficeWalls(sectors, doors);

    // 4. Draw Rich Interior Pixel Art Decor (Wall Charts, AC Units, Plants, Lamps, Books, Cables)
    this.drawInteriorDecor(sectors);
  }

  drawCeramicTileRegion(g, rx, ry, rw, rh, baseHex, lineHex, tileSize = 32) {
    g.fillStyle(baseHex, 1);
    g.fillRect(rx, ry, rw, rh);

    g.lineStyle(1, lineHex, 0.75);
    for (let x = rx; x <= rx + rw; x += tileSize) {
      g.moveTo(x, ry);
      g.lineTo(x, ry + rh);
    }
    for (let y = ry; y <= ry + rh; y += tileSize) {
      g.moveTo(rx, y);
      g.lineTo(rx + rw, y);
    }
    g.strokePath();
  }

  drawWoodPlankRegion(g, rx, ry, rw, rh, woodHex, seamHex) {
    g.fillStyle(woodHex, 1);
    g.fillRect(rx, ry, rw, rh);

    const plankH = 14;
    g.lineStyle(1, seamHex, 0.85);
    for (let y = ry; y <= ry + rh; y += plankH) {
      g.moveTo(rx, y);
      g.lineTo(rx + rw, y);

      // Staggered vertical plank joints
      const offset = ((y / plankH) % 2) * 36;
      for (let x = rx + offset; x < rx + rw; x += 72) {
        if (x > rx) {
          g.moveTo(x, y);
          g.lineTo(x, Math.min(ry + rh, y + plankH));
        }
      }
    }
    g.strokePath();
  }

  drawCarpetRegion(g, rx, ry, rw, rh, baseHex, weaveHex) {
    g.fillStyle(baseHex, 1);
    g.fillRect(rx, ry, rw, rh);

    g.lineStyle(1, weaveHex, 0.55);
    for (let y = ry; y <= ry + rh; y += 8) {
      g.moveTo(rx, y);
      g.lineTo(rx + rw, y);
    }
    for (let x = rx; x <= rx + rw; x += 16) {
      g.moveTo(x, ry);
      g.lineTo(x, ry + rh);
    }
    g.strokePath();
  }

  drawDarkSlateLobby(g, rx, ry, rw, rh) {
    g.fillStyle(0x1b1d24, 1);
    g.fillRect(rx, ry, rw, rh);

    const tile = 64;
    g.lineStyle(1, 0x2a2e39, 0.9);
    for (let x = rx; x <= rx + rw; x += tile) {
      g.moveTo(x, ry);
      g.lineTo(x, ry + rh);
    }
    for (let y = ry; y <= ry + rh; y += tile) {
      g.moveTo(rx, y);
      g.lineTo(rx + rw, y);
    }
    g.strokePath();

    // Subtle Floor Branding Texts (like the dark bottom room in the reference image)
    const cx = rx + rw / 2;
    const cy = ry + rh / 2 + 18;

    this.scene.add
      .text(cx - 145, cy, '❖ CodeGym HQ', {
        fontFamily: 'Be Vietnam Pro, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#475569',
      })
      .setOrigin(0.5)
      .setDepth(1.6);

    this.scene.add
      .text(cx, cy, '✦ 20/11 Security', {
        fontFamily: 'Be Vietnam Pro, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#475569',
      })
      .setOrigin(0.5)
      .setDepth(1.6);

    this.scene.add
      .text(cx + 150, cy, '★ Gratitude', {
        fontFamily: 'Be Vietnam Pro, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#475569',
      })
      .setOrigin(0.5)
      .setDepth(1.6);
  }

  drawServerRoomFloor(g, rx, ry, rw, rh) {
    // Technical grey floor
    this.drawCeramicTileRegion(g, rx, ry, rw, rh, 0x848289, 0x6e6c73, 28);

    // Dark perforated floor mat under server racks
    g.fillStyle(0x2d313b, 0.92);
    g.fillRect(rx + 28, ry + 56, rw - 56, rh - 110);
    g.lineStyle(1, 0x1e2028, 0.9);
    for (let x = rx + 28; x <= rx + rw - 28; x += 20) {
      g.moveTo(x, ry + 56);
      g.lineTo(x, ry + rh - 54);
    }
    for (let y = ry + 56; y <= ry + rh - 54; y += 20) {
      g.moveTo(rx + 28, y);
      g.lineTo(rx + rw - 28, y);
    }
    g.strokePath();

    // Red & Dark-Grey Braided Server Cable Conduits (matching bottom-right of reference image!)
    const drawCablePath = (points, colorHex, widthPx) => {
      g.lineStyle(widthPx, colorHex, 0.95);
      g.beginPath();
      points.forEach(([px, py], idx) => {
        if (idx === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      });
      g.strokePath();
    };

    // Outer dark cable conduit
    drawCablePath(
      [
        [rx + 95, ry + 115],
        [rx + 95, ry + 75],
        [rx + 260, ry + 75],
        [rx + 260, ry + 260],
        [rx + 365, ry + 260],
      ],
      0x27272a,
      5
    );
    // Inner red high-voltage data cable
    drawCablePath(
      [
        [rx + 95, ry + 115],
        [rx + 95, ry + 75],
        [rx + 260, ry + 75],
        [rx + 260, ry + 260],
        [rx + 365, ry + 260],
      ],
      0xdc2626,
      2.5
    );

    // Second cable branch connecting lower servers to terminal
    drawCablePath(
      [
        [rx + 100, ry + 320],
        [rx + 260, ry + 320],
        [rx + 260, ry + 260],
      ],
      0xb91c1c,
      3
    );
  }

  drawOfficeWalls(sectors, doors) {
    const gWalls = this.scene.add.graphics();
    gWalls.setDepth(2);

    // Draw North Wall 3/4 Brick/Panel Elevation for each room so rooms have true 2.5D depth
    sectors.forEach((sec) => {
      const wallFaceH = 34;
      const isWarmBrick =
        sec.id === 'sector-database-room' ||
        sec.id === 'sector-central-control' ||
        sec.id === 'sector-security-room';

      // Top white wall cap (3D thickness)
      gWalls.fillStyle(0xf1f5f9, 1);
      gWalls.fillRect(sec.x, sec.y - 10, sec.width, 10);
      gWalls.lineStyle(2, 0x1e1b2e, 1);
      gWalls.strokeRect(sec.x, sec.y - 10, sec.width, 10);

      // Front wall face below the white cap
      gWalls.fillStyle(isWarmBrick ? 0xb58863 : 0xd6d3cd, 1);
      gWalls.fillRect(sec.x, sec.y, sec.width, wallFaceH);

      // Brick pattern or wainscoting lines on wall face
      gWalls.lineStyle(1, isWarmBrick ? 0x8c6240 : 0xb5b1aa, 0.65);
      for (let y = sec.y + 8; y < sec.y + wallFaceH; y += 8) {
        gWalls.moveTo(sec.x, y);
        gWalls.lineTo(sec.x + sec.width, y);
      }
      gWalls.strokePath();

      // Baseboard trim
      gWalls.fillStyle(0x334155, 1);
      gWalls.fillRect(sec.x, sec.y + wallFaceH - 4, sec.width, 4);

      // Room border outline
      gWalls.lineStyle(2, 0x1e293b, 0.95);
      gWalls.strokeRect(sec.x, sec.y, sec.width, sec.height);
    });

    // Doorway Threshold Mats (Wood / Brushed Metal thresholds)
    doors.forEach((door) => {
      gWalls.fillStyle(0xe2e8f0, 0.92);
      gWalls.fillRect(
        door.x - door.width / 2,
        door.y - door.height / 2,
        door.width,
        door.height
      );
      gWalls.lineStyle(1.5, 0x475569, 0.9);
      gWalls.strokeRect(
        door.x - door.width / 2,
        door.y - door.height / 2,
        door.width,
        door.height
      );
    });
  }

  drawInteriorDecor(sectors) {
    const gDecor = this.scene.add.graphics();
    gDecor.setDepth(2.4);

    sectors.forEach((sec) => {
      // 1. Wall-mounted Air Conditioner (AC Unit) on top wall
      this.drawWallAC(gDecor, sec.x + 56, sec.y + 6);

      // 2. Wall Charts / Analytics Boards
      if (sec.id === 'sector-it-office') {
        this.drawWallMonitorChart(gDecor, sec.x + 165, sec.y + 4, 0x10b981);
        this.drawWallWhiteboard(gDecor, sec.x + 285, sec.y + 4);
        this.drawWaterCooler(gDecor, sec.x + 395, sec.y + 42);
        this.drawPottedPlant(gDecor, sec.x + 355, sec.y + 46);
      } else if (sec.id === 'sector-database-room') {
        // Warm Library / Study lamps & scattered open books (like bottom-left of reference)
        this.drawFloorLamp(gDecor, sec.x + 52, sec.y + 165);
        this.drawFloorLamp(gDecor, sec.x + 52, sec.y + 345);
        this.drawFloorLamp(gDecor, sec.x + 385, sec.y + 345);
        this.drawScatteredBooks(gDecor, sec.x + 115, sec.y + 225);
        this.drawScatteredBooks(gDecor, sec.x + 240, sec.y + 355);
        this.drawPottedPlant(gDecor, sec.x + 395, sec.y + 52);
      } else if (sec.id === 'sector-central-control') {
        this.drawWallMonitorChart(gDecor, sec.x + 150, sec.y + 4, 0x38bdf8);
        this.drawWallMonitorChart(gDecor, sec.x + 320, sec.y + 4, 0xf59e0b);
        this.drawWaterCooler(gDecor, sec.x + 460, sec.y + 42);
        this.drawPottedPlant(gDecor, sec.x + 48, sec.y + 52);
        this.drawPottedPlant(gDecor, sec.x + 465, sec.y + 260);
      } else if (sec.id === 'sector-security-room') {
        this.drawWallWhiteboard(gDecor, sec.x + 175, sec.y + 4);
        this.drawWallMonitorChart(gDecor, sec.x + 295, sec.y + 4, 0xf43f5e);
        this.drawPottedPlant(gDecor, sec.x + 52, sec.y + 52);
        this.drawPottedPlant(gDecor, sec.x + 390, sec.y + 365);
      } else if (sec.id === 'sector-reception') {
        this.drawPottedPlant(gDecor, sec.x + 48, sec.y + 56);
        this.drawPottedPlant(gDecor, sec.x + 464, sec.y + 56);
        this.drawWaterCooler(gDecor, sec.x + 464, sec.y + 135);
      }
    });
  }

  drawWallAC(g, x, y) {
    g.fillStyle(0xf8fafc, 1);
    g.fillRoundedRect(x, y, 54, 18, 3);
    g.lineStyle(1.5, 0x334155, 1);
    g.strokeRoundedRect(x, y, 54, 18, 3);
    g.fillStyle(0x475569, 1);
    g.fillRect(x + 6, y + 12, 42, 3);
    g.fillStyle(0x10b981, 1);
    g.fillCircle(x + 46, y + 7, 2);
  }

  drawWallMonitorChart(g, x, y, chartColor = 0x10b981) {
    // Dark frame
    g.fillStyle(0x1e293b, 1);
    g.fillRect(x, y, 64, 26);
    g.lineStyle(1.5, 0x0f172a, 1);
    g.strokeRect(x, y, 64, 26);
    // Screen
    g.fillStyle(0x0f172a, 1);
    g.fillRect(x + 3, y + 3, 58, 20);
    // Ascending trend line
    g.lineStyle(2, chartColor, 1);
    g.beginPath();
    g.moveTo(x + 7, y + 19);
    g.lineTo(x + 20, y + 14);
    g.lineTo(x + 32, y + 16);
    g.lineTo(x + 45, y + 9);
    g.lineTo(x + 56, y + 6);
    g.strokePath();
  }

  drawWallWhiteboard(g, x, y) {
    g.fillStyle(0xf8fafc, 1);
    g.fillRect(x, y, 68, 26);
    g.lineStyle(1.5, 0x475569, 1);
    g.strokeRect(x, y, 68, 26);
    // Pie chart & notes on whiteboard
    g.fillStyle(0xf97316, 1);
    g.fillCircle(x + 16, y + 13, 7);
    g.fillStyle(0x38bdf8, 1);
    g.fillRect(x + 30, y + 7, 28, 3);
    g.fillStyle(0x64748b, 1);
    g.fillRect(x + 30, y + 13, 24, 2);
    g.fillRect(x + 30, y + 18, 20, 2);
  }

  drawPottedPlant(g, x, y) {
    // Warm terracotta / blue ceramic pot
    g.fillStyle(0xc2410c, 1);
    g.fillRoundedRect(x - 9, y, 18, 14, 3);
    g.lineStyle(1.5, 0x1e1b2e, 1);
    g.strokeRoundedRect(x - 9, y, 18, 14, 3);
    // Lush green foliage clusters
    g.fillStyle(0x15803d, 1);
    g.fillCircle(x, y - 6, 11);
    g.fillStyle(0x22c55e, 1);
    g.fillCircle(x - 6, y - 4, 7);
    g.fillCircle(x + 6, y - 4, 7);
    g.fillCircle(x, y - 10, 7);
    g.lineStyle(1.2, 0x14532d, 1);
    g.strokeCircle(x, y - 6, 11);
  }

  drawWaterCooler(g, x, y) {
    // White dispenser body
    g.fillStyle(0xf1f5f9, 1);
    g.fillRect(x - 10, y, 20, 24);
    g.lineStyle(1.5, 0x334155, 1);
    g.strokeRect(x - 10, y, 20, 24);
    // Taps
    g.fillStyle(0xef4444, 1);
    g.fillRect(x - 5, y + 6, 3, 4);
    g.fillStyle(0x3b82f6, 1);
    g.fillRect(x + 2, y + 6, 3, 4);
    // Clear blue water bottle on top
    g.fillStyle(0x38bdf8, 0.85);
    g.fillRoundedRect(x - 8, y - 14, 16, 14, 4);
    g.lineStyle(1.2, 0x0284c7, 1);
    g.strokeRoundedRect(x - 8, y - 14, 16, 14, 4);
  }

  drawFloorLamp(g, x, y) {
    // Warm floor glow circle
    g.fillStyle(0xfbbf24, 0.16);
    g.fillCircle(x, y, 36);
    // Base & pole
    g.fillStyle(0x475569, 1);
    g.fillEllipse(x, y + 12, 16, 8);
    g.lineStyle(2, 0x334155, 1);
    g.beginPath();
    g.moveTo(x, y + 12);
    g.lineTo(x, y - 10);
    g.strokePath();
    // Warm yellow lampshade
    g.fillStyle(0xfde047, 1);
    g.fillRoundedRect(x - 10, y - 20, 20, 12, 3);
    g.lineStyle(1.5, 0xca8a04, 1);
    g.strokeRoundedRect(x - 10, y - 20, 20, 12, 3);
  }

  drawScatteredBooks(g, x, y) {
    // Stack / open book on wooden library floor
    g.fillStyle(0xf8fafc, 1);
    g.fillRect(x - 12, y - 6, 24, 14);
    g.lineStyle(1.2, 0x475569, 1);
    g.strokeRect(x - 12, y - 6, 24, 14);
    g.beginPath();
    g.moveTo(x, y - 6);
    g.lineTo(x, y + 8);
    g.strokePath();
  }
}

export default PixelOfficeRenderer;

