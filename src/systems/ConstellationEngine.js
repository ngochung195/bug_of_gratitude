export const CONSTELLATION_MODES = {
  HEART: 'HEART',
  THANK_YOU: 'THANK_YOU',
  MENTORS: 'MENTORS',
};

function buildHeartTemplate() {
  const points = [
    { x: 0.5, y: 0.28 },
    { x: 0.41, y: 0.17 },
    { x: 0.29, y: 0.15 },
    { x: 0.19, y: 0.24 },
    { x: 0.17, y: 0.38 },
    { x: 0.23, y: 0.52 },
    { x: 0.35, y: 0.66 },
    { x: 0.5, y: 0.82 },
    { x: 0.65, y: 0.66 },
    { x: 0.77, y: 0.52 },
    { x: 0.83, y: 0.38 },
    { x: 0.81, y: 0.24 },
    { x: 0.71, y: 0.15 },
    { x: 0.59, y: 0.17 },
    // Inner core stars
    { x: 0.36, y: 0.38 },
    { x: 0.64, y: 0.38 },
  ];

  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
    [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 0],
    [0, 14], [14, 6], [0, 15], [15, 8], [14, 15],
  ];

  return {
    title: 'CHÒM SAO TRÁI TIM TRI ÂN',
    centerLabel: 'HEART OF GRATITUDE',
    points,
    edges,
  };
}

function buildThankYouTemplate() {
  // Celestial constellation forming the two-tier "THANK YOU" emblem
  const points = [
    // Top arc (T - H - A - N - K)
    { x: 0.14, y: 0.26 },
    { x: 0.22, y: 0.34 },
    { x: 0.31, y: 0.24 },
    { x: 0.4, y: 0.35 },
    { x: 0.5, y: 0.21 },
    { x: 0.6, y: 0.35 },
    { x: 0.69, y: 0.24 },
    { x: 0.78, y: 0.34 },
    { x: 0.86, y: 0.26 },
    // Lower arc (Y - O - U)
    { x: 0.24, y: 0.64 },
    { x: 0.36, y: 0.74 },
    { x: 0.5, y: 0.58 },
    { x: 0.64, y: 0.74 },
    { x: 0.76, y: 0.64 },
    // Crown & Base anchors
    { x: 0.5, y: 0.42 },
    { x: 0.5, y: 0.84 },
  ];

  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
    [9, 10], [10, 11], [11, 12], [12, 13],
    [1, 9], [4, 14], [14, 11], [7, 13],
    [10, 15], [12, 15],
  ];

  return {
    title: 'CHÒM SAO THANK YOU',
    centerLabel: 'THANK YOU',
    points,
    edges,
  };
}

function buildMentorsTemplate() {
  // Open-book & guiding-star crest representing MENTORS
  const points = [
    // Guiding North Star at apex
    { x: 0.5, y: 0.15 },
    { x: 0.42, y: 0.26 },
    { x: 0.58, y: 0.26 },
    // Left Wing / Book Page
    { x: 0.18, y: 0.34 },
    { x: 0.15, y: 0.58 },
    { x: 0.32, y: 0.68 },
    { x: 0.5, y: 0.76 },
    // Right Wing / Book Page
    { x: 0.68, y: 0.68 },
    { x: 0.85, y: 0.58 },
    { x: 0.82, y: 0.34 },
    // Spine & Inner Constellation Nodes
    { x: 0.5, y: 0.44 },
    { x: 0.33, y: 0.46 },
    { x: 0.67, y: 0.46 },
    { x: 0.5, y: 0.6 },
  ];

  const edges = [
    [0, 1], [0, 2], [1, 2],
    [1, 10], [2, 10],
    [1, 3], [3, 4], [4, 5], [5, 6],
    [2, 9], [9, 8], [8, 7], [7, 6],
    [10, 6], [3, 11], [11, 10], [9, 12], [12, 10],
    [11, 5], [12, 7], [10, 13],
  ];

  return {
    title: 'CHÒM SAO MENTORS DẪN ĐƯỜNG',
    centerLabel: 'MENTORS',
    points,
    edges,
  };
}

const TEMPLATES = {
  [CONSTELLATION_MODES.HEART]: buildHeartTemplate(),
  [CONSTELLATION_MODES.THANK_YOU]: buildThankYouTemplate(),
  [CONSTELLATION_MODES.MENTORS]: buildMentorsTemplate(),
};

export class ConstellationEngine {
  constructor(canvas, { onSelectStar, onHoverStar } = {}) {
    this.canvas = canvas;
    this.ctx =
      canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
    this.onSelectStar = typeof onSelectStar === 'function' ? onSelectStar : null;
    this.onHoverStar = typeof onHoverStar === 'function' ? onHoverStar : null;

    this.mode = CONSTELLATION_MODES.HEART;
    this.width = 960;
    this.height = 440;
    this.dpr = 1;
    this.isMobile = false;
    this.reducedMotion = false;
    this.isRunning = false;
    this.rafId = null;
    this.elapsedTime = 0;
    this.lastFrameTime = 0;

    this.messages = [];
    this.starNodes = [];
    this.activeEdges = [];
    this.bgStars = [];
    this.hoveredStarId = null;
    this.selectedStarId = null;

    this.handleResize = this.handleResize.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.tick = this.tick.bind(this);

    this.initEnvironment();
    this.initBgStars();
    this.rebuildConstellation();
  }

  initEnvironment() {
    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth < 768;
      if (typeof window.matchMedia === 'function') {
        this.reducedMotion = Boolean(
          window.matchMedia('(prefers-reduced-motion: reduce)')?.matches
        );
      }
    }
  }

  initBgStars() {
    const count = this.isMobile ? 22 : 42;
    this.bgStars = Array.from({ length: count }, (_, i) => ({
      xRatio: (i * 0.61803398875) % 1,
      yRatio: ((i * 0.38196601125 + 0.11) % 0.9) + 0.05,
      radius: 0.8 + (i % 3) * 0.5,
      alpha: 0.2 + (i % 5) * 0.1,
      phase: i * 0.9,
    }));
  }

  mount() {
    this.handleResize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize);
    }
    if (this.canvas && typeof this.canvas.addEventListener === 'function') {
      this.canvas.addEventListener('pointermove', this.handlePointerMove);
      this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    }
    this.start();
  }

  handleResize() {
    if (!this.canvas) return;
    const rect =
      typeof this.canvas.getBoundingClientRect === 'function'
        ? this.canvas.getBoundingClientRect()
        : { width: 960, height: 420 };

    this.width = Math.max(300, Math.floor(rect.width || 960));
    this.height = Math.max(260, Math.floor(rect.height || 420));
    this.isMobile = this.width < 768;

    const rawDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.dpr = Math.min(this.isMobile ? 1.5 : 2, rawDpr);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    if (this.ctx && typeof this.ctx.setTransform === 'function') {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    this.rebuildConstellation();
    this.renderFrame();
  }

  setMode(mode) {
    if (TEMPLATES[mode]) {
      this.mode = mode;
      this.rebuildConstellation();
      this.renderFrame();
    }
  }

  setMessages(approvedMessages = []) {
    // Strictly keep only approved messages
    this.messages = (Array.isArray(approvedMessages) ? approvedMessages : []).filter(
      (m) => m && m.isApproved === true
    );
    this.rebuildConstellation();
    this.renderFrame();
  }

  rebuildConstellation() {
    const template = TEMPLATES[this.mode] || TEMPLATES[CONSTELLATION_MODES.HEART];
    const basePoints = template.points;
    const maxStars = this.isMobile ? 24 : 40;
    const cappedMessages = this.messages.slice(0, maxStars);

    const nodes = [];

    // 1. Place nodes along the template anchor points
    for (let i = 0; i < basePoints.length; i += 1) {
      const pt = basePoints[i];
      const msg = cappedMessages[i] || null;
      nodes.push({
        index: i,
        id: msg ? msg.id : `guide-${this.mode}-${i}`,
        xRatio: pt.x,
        yRatio: pt.y,
        x: pt.x * this.width,
        y: pt.y * this.height,
        isMessageStar: Boolean(msg),
        message: msg,
        phase: i * 0.85,
      });
    }

    const edges = template.edges.map(([a, b]) => [a, b]);

    // 2. If there are more approved messages than template points, place them on an outer celestial ring
    if (cappedMessages.length > basePoints.length) {
      const extraCount = cappedMessages.length - basePoints.length;
      for (let j = 0; j < extraCount; j += 1) {
        const msg = cappedMessages[basePoints.length + j];
        const angle = (Math.PI * 2 * j) / extraCount - Math.PI / 2;
        const rx = 0.42;
        const ry = 0.4;
        const xRatio = Math.min(0.92, Math.max(0.08, 0.5 + Math.cos(angle) * rx));
        const yRatio = Math.min(0.9, Math.max(0.1, 0.5 + Math.sin(angle) * ry));
        const newIdx = nodes.length;

        nodes.push({
          index: newIdx,
          id: msg.id,
          xRatio,
          yRatio,
          x: xRatio * this.width,
          y: yRatio * this.height,
          isMessageStar: true,
          message: msg,
          phase: newIdx * 0.7,
        });

        // Connect extra star to nearest template anchor
        edges.push([j % basePoints.length, newIdx]);
      }
    }

    this.starNodes = nodes;
    this.activeEdges = edges;
  }

  hitTest(canvasX, canvasY) {
    const hitRadius = this.isMobile ? 28 : 22;
    const maxDistSq = hitRadius * hitRadius;

    // Only hit-test real approved message stars (never guide nodes)
    for (let i = this.starNodes.length - 1; i >= 0; i -= 1) {
      const node = this.starNodes[i];
      if (!node.isMessageStar) continue;
      const dx = canvasX - node.x;
      const dy = canvasY - node.y;
      if (dx * dx + dy * dy <= maxDistSq) {
        return node;
      }
    }
    return null;
  }

  getCoords(event) {
    if (!this.canvas || typeof this.canvas.getBoundingClientRect !== 'function') {
      return { x: 0, y: 0 };
    }
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  handlePointerMove(event) {
    const { x, y } = this.getCoords(event);
    const hit = this.hitTest(x, y);
    const nextId = hit ? hit.id : null;

    if (nextId !== this.hoveredStarId) {
      this.hoveredStarId = nextId;
      if (this.canvas) {
        this.canvas.style.cursor = hit ? 'pointer' : 'default';
      }
      if (this.onHoverStar) {
        this.onHoverStar(hit ? hit.message : null, hit);
      }
      this.renderFrame();
    }
  }

  handlePointerDown(event) {
    const { x, y } = this.getCoords(event);
    const hit = this.hitTest(x, y);
    if (hit && hit.message) {
      this.selectedStarId = hit.id;
      if (this.onSelectStar) {
        this.onSelectStar(hit.message, hit);
      }
      this.renderFrame();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    if (this.reducedMotion) {
      this.renderFrame();
      return;
    }

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      this.rafId = window.requestAnimationFrame(this.tick);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.rafId && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  tick(now) {
    if (!this.isRunning) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastFrameTime) / 1000 || 0.016));
    this.lastFrameTime = now;
    this.elapsedTime += dt;

    this.renderFrame();

    if (this.isRunning && typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      this.rafId = window.requestAnimationFrame(this.tick);
    }
  }

  renderFrame() {
    const ctx = this.ctx;
    if (!ctx) return;

    const w = this.width;
    const h = this.height;
    const template = TEMPLATES[this.mode] || TEMPLATES[CONSTELLATION_MODES.HEART];

    // 1. Deep Cosmic Backdrop
    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.48, 12, w * 0.5, h * 0.5, Math.max(w, h) * 0.65);
    bgGrad.addColorStop(0, '#17133a');
    bgGrad.addColorStop(0.55, '#0b1024');
    bgGrad.addColorStop(1, '#060913');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Subtle Background Stars
    for (let i = 0; i < this.bgStars.length; i += 1) {
      const s = this.bgStars[i];
      const twinkle = this.reducedMotion
        ? s.alpha
        : s.alpha + Math.sin(this.elapsedTime * 1.4 + s.phase) * 0.15;
      ctx.globalAlpha = Math.max(0.08, Math.min(0.85, twinkle));
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(s.xRatio * w, s.yRatio * h, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // 3. Center Emblem Watermark Text
    ctx.save();
    ctx.font = this.isMobile
      ? '700 13px "Press Start 2P", monospace'
      : '700 16px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(251, 191, 36, 0.14)';
    ctx.fillText(template.centerLabel, w * 0.5, h * 0.51);
    ctx.restore();

    // 4. Constellation Connecting Lines
    for (let i = 0; i < this.activeEdges.length; i += 1) {
      const [idxA, idxB] = this.activeEdges[i];
      const nodeA = this.starNodes[idxA];
      const nodeB = this.starNodes[idxB];
      if (!nodeA || !nodeB) continue;

      const bothReal = nodeA.isMessageStar && nodeB.isMessageStar;
      const oneReal = nodeA.isMessageStar || nodeB.isMessageStar;

      ctx.beginPath();
      ctx.moveTo(nodeA.x, nodeA.y);
      ctx.lineTo(nodeB.x, nodeB.y);

      if (bothReal) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
        ctx.lineWidth = 1.8;
      } else if (oneReal) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.42)';
        ctx.lineWidth = 1.3;
      } else {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
        ctx.lineWidth = 1;
      }
      ctx.stroke();
    }

    // 5. Constellation Nodes (Real Approved Stars vs Subtle Guide Nodes)
    for (let i = 0; i < this.starNodes.length; i += 1) {
      const node = this.starNodes[i];
      const isHovered = this.hoveredStarId === node.id;
      const isSelected = this.selectedStarId === node.id;

      if (node.isMessageStar) {
        const pulse = this.reducedMotion
          ? 1
          : 1 + Math.sin(this.elapsedTime * 2.4 + node.phase) * 0.12;
        const glowRadius = (isHovered || isSelected ? 24 : 16) * pulse;

        const glow = ctx.createRadialGradient(node.x, node.y, 1, node.x, node.y, glowRadius);
        if (isHovered || isSelected) {
          glow.addColorStop(0, 'rgba(0, 229, 255, 0.85)');
          glow.addColorStop(1, 'rgba(0, 229, 255, 0)');
        } else {
          glow.addColorStop(0, 'rgba(251, 191, 36, 0.8)');
          glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        }

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Bright Star Core
        ctx.fillStyle = isHovered || isSelected ? '#00e5ff' : '#fef08a';
        ctx.beginPath();
        ctx.arc(node.x, node.y, isHovered || isSelected ? 5.5 : 4.2, 0, Math.PI * 2);
        ctx.fill();

        // Mentor label next to real star
        const mentorLabel = String(node.message?.mentorName || '');
        if (mentorLabel) {
          const shortName =
            mentorLabel.length > 14 ? `${mentorLabel.slice(0, 13)}…` : mentorLabel;
          ctx.font = this.isMobile
            ? '600 9px "Be Vietnam Pro", sans-serif'
            : '600 10px "Be Vietnam Pro", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = isHovered || isSelected ? '#67e8f9' : '#fde68a';
          ctx.fillText(shortName, node.x, node.y - 10);
        }
      } else {
        // Unoccupied Constellation Guide Vertex (subtle anchor point, never fake message)
        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  destroy() {
    this.stop();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
    }
    if (this.canvas && typeof this.canvas.removeEventListener === 'function') {
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    }
  }
}

export default ConstellationEngine;
