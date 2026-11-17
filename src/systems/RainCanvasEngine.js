const PALETTE = {
  skyTop: '#060913',
  skyMid: '#0b1228',
  skyBottom: '#171132',
  cyan: '#00e5ff',
  purple: '#a855f7',
  pink: '#f43f5e',
  warmGold: '#fbbf24',
  white: '#f8fafc',
};

const STAR_COLORS = ['#f8fafc', '#38bdf8', '#c084fc', '#fde68a', '#f472b6'];

export class RainCanvasEngine {
  constructor(canvas, { onSelectNode, onHoverNode } = {}) {
    this.canvas = canvas;
    this.ctx = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
    this.onSelectNode = typeof onSelectNode === 'function' ? onSelectNode : null;
    this.onHoverNode = typeof onHoverNode === 'function' ? onHoverNode : null;

    this.width = 1280;
    this.height = 720;
    this.dpr = 1;
    this.isMobile = false;
    this.reducedMotion = false;
    this.isRunning = false;
    this.isPausedByVisibility = false;
    this.rafId = null;
    this.lastFrameTime = 0;
    this.elapsedTime = 0;

    // Pre-allocated object pools
    this.starPool = [];
    this.particlePool = [];
    this.burstPool = [];
    this.nebulaOrbs = [];
    this.letterNodes = [];

    this.hoveredNodeId = null;
    this.selectedNodeId = null;

    this.handleResize = this.handleResize.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.tick = this.tick.bind(this);

    this.initEnvironmentFlags();
    this.initPools();
  }

  initEnvironmentFlags() {
    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth < 768;
      if (typeof window.matchMedia === 'function') {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.reducedMotion = Boolean(mq?.matches);
      }
    }
  }

  getCaps() {
    if (this.isMobile) {
      return {
        maxStars: 24,
        maxParticles: 14,
        maxBursts: 12,
        maxVisibleNodes: 14,
        hitRadius: 38,
      };
    }
    return {
      maxStars: 48,
      maxParticles: 30,
      maxBursts: 24,
      maxVisibleNodes: 24,
      hitRadius: 30,
    };
  }

  initPools() {
    const caps = this.getCaps();

    this.starPool = Array.from({ length: 48 }, (_, i) => ({
      active: i < caps.maxStars,
      xRatio: ((i * 0.61803398875) % 1),
      yRatio: (((i * 0.38196601125) + 0.07) % 0.88) + 0.04,
      radius: 0.9 + (i % 3) * 0.65,
      baseAlpha: 0.35 + (i % 5) * 0.12,
      twinkleSpeed: 0.8 + (i % 4) * 0.45,
      phase: i * 1.17,
      color: STAR_COLORS[i % STAR_COLORS.length],
    }));

    this.particlePool = Array.from({ length: 30 }, (_, i) => ({
      active: i < caps.maxParticles,
      x: ((i * 97) % 1000) / 1000,
      y: ((i * 53) % 1000) / 1000,
      vy: 0.015 + (i % 4) * 0.006,
      vx: ((i % 3) - 1) * 0.004,
      size: 1.4 + (i % 3) * 0.7,
      alpha: 0.25 + (i % 4) * 0.12,
      color: i % 3 === 0 ? PALETTE.cyan : i % 3 === 1 ? PALETTE.warmGold : PALETTE.pink,
    }));

    this.burstPool = Array.from({ length: 24 }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      alpha: 0,
      size: 2,
      color: PALETTE.warmGold,
    }));

    this.nebulaOrbs = [
      { xRatio: 0.22, yRatio: 0.32, radiusRatio: 0.34, color: 'rgba(139, 92, 246, 0.13)', phase: 0 },
      { xRatio: 0.76, yRatio: 0.28, radiusRatio: 0.3, color: 'rgba(0, 229, 255, 0.1)', phase: 2.1 },
      { xRatio: 0.52, yRatio: 0.65, radiusRatio: 0.36, color: 'rgba(244, 63, 94, 0.09)', phase: 4.2 },
    ];
  }

  mount() {
    this.handleResize();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
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
        : { width: 1280, height: 720 };

    this.width = Math.max(320, Math.floor(rect.width || (typeof window !== 'undefined' ? window.innerWidth : 1280)));
    this.height = Math.max(320, Math.floor(rect.height || (typeof window !== 'undefined' ? window.innerHeight : 720)));
    this.isMobile = this.width < 768;

    const rawDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.dpr = Math.min(this.isMobile ? 1.5 : 2, rawDpr);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    if (this.ctx && typeof this.ctx.setTransform === 'function') {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    const caps = this.getCaps();
    this.starPool.forEach((star, idx) => {
      star.active = idx < caps.maxStars;
    });
    this.particlePool.forEach((p, idx) => {
      p.active = idx < caps.maxParticles;
    });

    this.recomputeNodePositions();
    this.renderFrame(0.016);
  }

  handleVisibilityChange() {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      this.isPausedByVisibility = true;
      this.stopLoopOnly();
    } else if (this.isPausedByVisibility) {
      this.isPausedByVisibility = false;
      this.start();
    }
  }

  setMessages(messages = [], { highlightMessageId = null, reactionCounts = {} } = {}) {
    const caps = this.getCaps();
    const safeList = Array.isArray(messages) ? messages.slice(0, caps.maxVisibleNodes) : [];
    const total = safeList.length;

    this.letterNodes = safeList.map((msg, index) => {
      const isHighlighted = Boolean(highlightMessageId && msg.id === highlightMessageId);
      const isOwnPending = Boolean(msg.isOwnPending);

      // Stratified layout across the sky so letters are evenly spread out
      const cols = this.isMobile ? Math.min(3, Math.max(2, total)) : Math.min(5, Math.max(3, Math.ceil(Math.sqrt(total * 1.5))));
      const rows = Math.max(1, Math.ceil(total / cols));
      const col = index % cols;
      const row = Math.floor(index / cols);

      const jitterX = (((index * 37) % 100) / 100 - 0.5) * (0.42 / cols);
      const jitterY = (((index * 61) % 100) / 100 - 0.5) * (0.34 / rows);

      const xRatio = isHighlighted
        ? 0.5
        : Math.min(0.88, Math.max(0.12, (col + 0.5) / cols + jitterX));
      const yRatio = isHighlighted
        ? 0.44
        : Math.min(0.74, Math.max(0.22, 0.22 + ((row + 0.5) / rows) * 0.5 + jitterY));

      return {
        id: msg.id,
        message: msg,
        xRatio,
        yRatio,
        x: xRatio * this.width,
        y: yRatio * this.height,
        startY: isHighlighted ? this.height * 0.86 : yRatio * this.height,
        entryProgress: isHighlighted && !this.reducedMotion ? 0 : 1,
        floatPhase: index * 1.35,
        floatSpeed: 1.1 + (index % 4) * 0.22,
        isHighlighted,
        isOwnPending,
        reactionCount: Number(reactionCounts[msg.id] ?? msg.reactionCount ?? 0),
        variant: index % 2 === 0 ? 'letter' : 'star',
      };
    });

    this.recomputeNodePositions();
    this.renderFrame(0.016);
  }

  updateReactionCount(messageId, nextCount) {
    const node = this.letterNodes.find((n) => n.id === messageId);
    if (node) {
      node.reactionCount = Math.max(0, Number(nextCount) || 0);
      this.renderFrame(0.016);
    }
  }

  setSelectedNodeId(nodeId) {
    this.selectedNodeId = nodeId || null;
    this.renderFrame(0.016);
  }

  recomputeNodePositions() {
    this.letterNodes.forEach((node) => {
      node.x = node.xRatio * this.width;
      const targetY = node.yRatio * this.height;
      node.startY = node.isHighlighted ? this.height * 0.86 : targetY;
      const easeProgress = 1 - Math.pow(1 - Math.min(1, node.entryProgress), 3);
      node.y = node.startY + (targetY - node.startY) * easeProgress;
    });
  }

  triggerHeartBurst(messageId) {
    const targetNode =
      this.letterNodes.find((n) => n.id === messageId) ||
      { x: this.width * 0.5, y: this.height * 0.5 };

    const caps = this.getCaps();
    let spawned = 0;

    for (let i = 0; i < this.burstPool.length && spawned < caps.maxBursts; i += 1) {
      const p = this.burstPool[i];
      if (!p.active) {
        const angle = (Math.PI * 2 * spawned) / Math.min(10, caps.maxBursts);
        const speed = 40 + (spawned % 3) * 24;
        p.active = true;
        p.x = targetNode.x;
        p.y = targetNode.y;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 18;
        p.alpha = 1;
        p.size = 2.5 + (spawned % 2) * 1.5;
        p.color = spawned % 2 === 0 ? PALETTE.pink : PALETTE.warmGold;
        spawned += 1;
      }
    }

    this.renderFrame(0.016);
  }

  hitTest(canvasX, canvasY) {
    const { hitRadius } = this.getCaps();
    const maxDistSq = hitRadius * hitRadius;

    for (let i = this.letterNodes.length - 1; i >= 0; i -= 1) {
      const node = this.letterNodes[i];
      const dx = canvasX - node.x;
      const dy = canvasY - node.y;
      if (dx * dx + dy * dy <= maxDistSq) {
        return node;
      }
    }
    return null;
  }

  getCanvasCoordsFromEvent(event) {
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
    const { x, y } = this.getCanvasCoordsFromEvent(event);
    const hitNode = this.hitTest(x, y);
    const nextHoverId = hitNode ? hitNode.id : null;

    if (nextHoverId !== this.hoveredNodeId) {
      this.hoveredNodeId = nextHoverId;
      if (this.canvas) {
        this.canvas.style.cursor = hitNode ? 'pointer' : 'default';
      }
      if (this.onHoverNode) {
        this.onHoverNode(hitNode ? hitNode.message : null, hitNode);
      }
    }
  }

  handlePointerDown(event) {
    const { x, y } = this.getCanvasCoordsFromEvent(event);
    const hitNode = this.hitTest(x, y);
    if (hitNode) {
      this.selectedNodeId = hitNode.id;
      if (this.onSelectNode) {
        this.onSelectNode(hitNode.message, hitNode);
      }
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    if (this.reducedMotion) {
      this.renderFrame(0.016);
      return;
    }

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      this.rafId = window.requestAnimationFrame(this.tick);
    }
  }

  stopLoopOnly() {
    this.isRunning = false;
    if (this.rafId && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  tick(now) {
    if (!this.isRunning) return;

    const rawDt = (now - this.lastFrameTime) / 1000;
    const dt = Math.min(0.05, Math.max(0.001, rawDt || 0.016));
    this.lastFrameTime = now;

    this.updateState(dt);
    this.renderFrame(dt);

    if (this.isRunning && typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      this.rafId = window.requestAnimationFrame(this.tick);
    }
  }

  updateState(dt) {
    if (this.reducedMotion) return;

    this.elapsedTime += dt;

    // 1. Update falling/drifting sky particles
    for (let i = 0; i < this.particlePool.length; i += 1) {
      const p = this.particlePool[i];
      if (!p.active) continue;

      p.y += p.vy * dt;
      p.x += p.vx * dt;

      if (p.y > 1.04) {
        p.y = -0.04;
        p.x = (p.x + 0.37) % 1;
      }
      if (p.x < -0.02) p.x = 1.02;
      if (p.x > 1.02) p.x = -0.02;
    }

    // 2. Update floating letters & rising new letter animation
    for (let i = 0; i < this.letterNodes.length; i += 1) {
      const node = this.letterNodes[i];
      if (node.entryProgress < 1) {
        node.entryProgress = Math.min(1, node.entryProgress + dt * 0.65);
      }

      const targetY = node.yRatio * this.height;
      const easeProgress = 1 - Math.pow(1 - node.entryProgress, 3);
      const baseY = node.startY + (targetY - node.startY) * easeProgress;

      const bobOffset = Math.sin(this.elapsedTime * node.floatSpeed + node.floatPhase) * (this.isMobile ? 5 : 8);
      const swayOffset = Math.cos(this.elapsedTime * (node.floatSpeed * 0.7) + node.floatPhase) * (this.isMobile ? 3 : 5);

      node.x = node.xRatio * this.width + swayOffset;
      node.y = baseY + bobOffset;
    }

    // 3. Update reaction burst particles
    for (let i = 0; i < this.burstPool.length; i += 1) {
      const b = this.burstPool[i];
      if (!b.active) continue;

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy -= 12 * dt; // Slight upward float
      b.alpha -= dt * 1.25;

      if (b.alpha <= 0) {
        b.active = false;
      }
    }
  }

  renderFrame() {
    const ctx = this.ctx;
    if (!ctx) return;

    const w = this.width;
    const h = this.height;

    // 1. Deep Night Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, PALETTE.skyTop);
    skyGrad.addColorStop(0.55, PALETTE.skyMid);
    skyGrad.addColorStop(1, PALETTE.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Soft Mystic Nebula Orbs
    const orbLimit = this.isMobile ? 2 : this.nebulaOrbs.length;
    for (let i = 0; i < orbLimit; i += 1) {
      const orb = this.nebulaOrbs[i];
      const driftX = this.reducedMotion ? 0 : Math.sin(this.elapsedTime * 0.25 + orb.phase) * 24;
      const driftY = this.reducedMotion ? 0 : Math.cos(this.elapsedTime * 0.2 + orb.phase) * 16;
      const cx = orb.xRatio * w + driftX;
      const cy = orb.yRatio * h + driftY;
      const r = Math.max(w, h) * orb.radiusRatio;

      const radGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, r);
      radGrad.addColorStop(0, orb.color);
      radGrad.addColorStop(1, 'rgba(7, 11, 20, 0)');

      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 3. Twinkling Stars
    for (let i = 0; i < this.starPool.length; i += 1) {
      const star = this.starPool[i];
      if (!star.active) continue;

      const twinkle = this.reducedMotion
        ? star.baseAlpha
        : star.baseAlpha + Math.sin(this.elapsedTime * star.twinkleSpeed + star.phase) * 0.24;
      const alpha = Math.min(0.95, Math.max(0.12, twinkle));

      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.xRatio * w, star.yRatio * h, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Falling / Drifting Light Particles
    for (let i = 0; i < this.particlePool.length; i += 1) {
      const p = this.particlePool[i];
      if (!p.active) continue;

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // 5. Floating Gratitude Letters & Stars
    for (let i = 0; i < this.letterNodes.length; i += 1) {
      const node = this.letterNodes[i];
      this.drawLetterNode(ctx, node);
    }

    // 6. Heart Burst Particles
    for (let i = 0; i < this.burstPool.length; i += 1) {
      const b = this.burstPool[i];
      if (!b.active) continue;

      ctx.globalAlpha = Math.max(0, b.alpha);
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  drawLetterNode(ctx, node) {
    const isHovered = this.hoveredNodeId === node.id;
    const isSelected = this.selectedNodeId === node.id;
    const isFeatured = node.isHighlighted || isHovered || isSelected;

    const x = node.x;
    const y = node.y;
    const pulse = this.reducedMotion
      ? 1
      : 1 + Math.sin(this.elapsedTime * 2.2 + node.floatPhase) * 0.08;

    // Outer Halo Glow
    const haloRadius = (isFeatured ? 34 : 24) * pulse;
    const haloGrad = ctx.createRadialGradient(x, y, 2, x, y, haloRadius);

    if (node.isHighlighted) {
      haloGrad.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
      haloGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    } else if (isHovered || isSelected) {
      haloGrad.addColorStop(0, 'rgba(0, 229, 255, 0.5)');
      haloGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    } else if (node.variant === 'star') {
      haloGrad.addColorStop(0, 'rgba(168, 85, 247, 0.36)');
      haloGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    } else {
      haloGrad.addColorStop(0, 'rgba(251, 191, 36, 0.34)');
      haloGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    }

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(x, y, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw Envelope Icon on Sky
    const envW = isFeatured ? 28 : 24;
    const envH = isFeatured ? 19 : 16;
    const left = x - envW / 2;
    const top = y - envH / 2;

    ctx.fillStyle = node.isHighlighted ? '#fef3c7' : '#1e293b';
    ctx.strokeStyle = node.isHighlighted
      ? PALETTE.warmGold
      : isHovered || isSelected
        ? PALETTE.cyan
        : '#fbbf24';
    ctx.lineWidth = isFeatured ? 2 : 1.5;

    ctx.beginPath();
    ctx.rect(left, top, envW, envH);
    ctx.fill();
    ctx.stroke();

    // Envelope Flap V-line
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(x, y + 2);
    ctx.lineTo(left + envW, top);
    ctx.stroke();

    // Mentor Short Label below the floating envelope
    const rawMentor = String(node.message?.mentorName || 'Mentor');
    const shortMentor = rawMentor.length > 16 ? `${rawMentor.slice(0, 15)}…` : rawMentor;

    ctx.font = this.isMobile
      ? '600 10px "Be Vietnam Pro", sans-serif'
      : '600 11px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isFeatured ? '#fef08a' : '#e2e8f0';
    ctx.fillText(shortMentor, x, y + envH / 2 + 14);
  }

  destroy() {
    this.stopLoopOnly();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (this.canvas && typeof this.canvas.removeEventListener === 'function') {
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    }
  }
}

export default RainCanvasEngine;

