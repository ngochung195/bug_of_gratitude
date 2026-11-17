const PALETTE = {
  skyTop: '#050814',
  skyMid: '#0d1430',
  skyBottom: '#1c123c',
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
    this.meteorPool = [];
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
        maxStars: 28,
        maxParticles: 16,
        maxBursts: 16,
        maxMeteors: 2,
        maxVisibleNodes: 16,
        hitRadius: 40,
      };
    }
    return {
      maxStars: 56,
      maxParticles: 34,
      maxBursts: 28,
      maxMeteors: 3,
      maxVisibleNodes: 24,
      hitRadius: 34,
    };
  }

  initPools() {
    const caps = this.getCaps();

    this.starPool = Array.from({ length: 56 }, (_, i) => ({
      active: i < caps.maxStars,
      xRatio: (i * 0.61803398875) % 1,
      yRatio: (((i * 0.38196601125) + 0.05) % 0.9) + 0.03,
      radius: 0.9 + (i % 4) * 0.6,
      baseAlpha: 0.35 + (i % 5) * 0.12,
      twinkleSpeed: 0.9 + (i % 4) * 0.5,
      phase: i * 1.17,
      color: STAR_COLORS[i % STAR_COLORS.length],
    }));

    this.particlePool = Array.from({ length: 34 }, (_, i) => ({
      active: i < caps.maxParticles,
      x: ((i * 97) % 1000) / 1000,
      y: ((i * 53) % 1000) / 1000,
      vy: 0.014 + (i % 4) * 0.006,
      vx: ((i % 3) - 1) * 0.004,
      size: 1.5 + (i % 3) * 0.75,
      alpha: 0.28 + (i % 4) * 0.14,
      color: i % 3 === 0 ? PALETTE.cyan : i % 3 === 1 ? PALETTE.warmGold : PALETTE.pink,
    }));

    this.burstPool = Array.from({ length: 28 }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      alpha: 0,
      size: 2.5,
      color: PALETTE.warmGold,
    }));

    this.meteorPool = Array.from({ length: 3 }, (_, i) => ({
      active: i === 0,
      x: 0.18 + i * 0.28,
      y: 0.08 + i * 0.06,
      vx: 0.34,
      vy: 0.18,
      length: 95,
      alpha: 0.85,
      cooldown: i * 2.2,
    }));

    this.nebulaOrbs = [
      { xRatio: 0.2, yRatio: 0.3, radiusRatio: 0.38, color: 'rgba(139, 92, 246, 0.16)', phase: 0 },
      { xRatio: 0.78, yRatio: 0.26, radiusRatio: 0.34, color: 'rgba(0, 229, 255, 0.13)', phase: 2.1 },
      { xRatio: 0.5, yRatio: 0.62, radiusRatio: 0.4, color: 'rgba(251, 191, 36, 0.11)', phase: 4.2 },
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

    this.width = Math.max(
      320,
      Math.floor(rect.width || (typeof window !== 'undefined' ? window.innerWidth : 1280))
    );
    this.height = Math.max(
      320,
      Math.floor(rect.height || (typeof window !== 'undefined' ? window.innerHeight : 720))
    );
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

    // Scenic celestial arc coordinates for up to 12+ wishes so 10 wishes form a grand canopy
    const presetCoordinates = [
      { x: 0.5, y: 0.34 },
      { x: 0.24, y: 0.28 },
      { x: 0.76, y: 0.28 },
      { x: 0.15, y: 0.48 },
      { x: 0.37, y: 0.46 },
      { x: 0.63, y: 0.46 },
      { x: 0.85, y: 0.48 },
      { x: 0.26, y: 0.64 },
      { x: 0.5, y: 0.62 },
      { x: 0.74, y: 0.64 },
      { x: 0.16, y: 0.24 },
      { x: 0.84, y: 0.24 },
    ];

    this.letterNodes = safeList.map((msg, index) => {
      const isHighlighted = Boolean(highlightMessageId && msg.id === highlightMessageId);

      let xRatio;
      let yRatio;

      if (isHighlighted) {
        xRatio = 0.5;
        yRatio = 0.38;
      } else if (index < presetCoordinates.length && !this.isMobile) {
        xRatio = presetCoordinates[index].x;
        yRatio = presetCoordinates[index].y;
      } else {
        const cols = this.isMobile
          ? Math.min(3, Math.max(2, total))
          : Math.min(5, Math.max(3, Math.ceil(Math.sqrt(total * 1.4))));
        const rows = Math.max(1, Math.ceil(total / cols));
        const col = index % cols;
        const row = Math.floor(index / cols);

        const jitterX = (((index * 37) % 100) / 100 - 0.5) * (0.36 / cols);
        const jitterY = (((index * 61) % 100) / 100 - 0.5) * (0.3 / rows);

        xRatio = Math.min(0.88, Math.max(0.12, (col + 0.5) / cols + jitterX));
        yRatio = Math.min(0.72, Math.max(0.22, 0.22 + ((row + 0.5) / rows) * 0.48 + jitterY));
      }

      return {
        id: msg.id,
        message: msg,
        xRatio,
        yRatio,
        x: xRatio * this.width,
        y: yRatio * this.height,
        startY: isHighlighted ? this.height * 0.88 : yRatio * this.height,
        entryProgress: isHighlighted && !this.reducedMotion ? 0 : 1,
        floatPhase: index * 1.15,
        floatSpeed: 1.05 + (index % 4) * 0.2,
        isHighlighted,
        reactionCount: Number(reactionCounts[msg.id] ?? msg.reactionCount ?? 0),
        variant: index % 2 === 0 ? 'letter' : 'star',
      };
    });

    this.recomputeNodePositions();
    if (highlightMessageId) {
      this.triggerHeartBurst(highlightMessageId);
    }
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
      node.startY = node.isHighlighted ? this.height * 0.88 : targetY;
      const easeProgress = 1 - Math.pow(1 - Math.min(1, node.entryProgress), 3);
      node.y = node.startY + (targetY - node.startY) * easeProgress;
    });
  }

  triggerHeartBurst(messageId) {
    const targetNode =
      this.letterNodes.find((n) => n.id === messageId) || {
        x: this.width * 0.5,
        y: this.height * 0.45,
      };

    const caps = this.getCaps();
    let spawned = 0;

    for (let i = 0; i < this.burstPool.length && spawned < caps.maxBursts; i += 1) {
      const p = this.burstPool[i];
      if (!p.active) {
        const angle = (Math.PI * 2 * spawned) / Math.min(14, caps.maxBursts);
        const speed = 46 + (spawned % 4) * 24;
        p.active = true;
        p.x = targetNode.x;
        p.y = targetNode.y;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 20;
        p.alpha = 1;
        p.size = 2.6 + (spawned % 3) * 1.3;
        p.color =
          spawned % 3 === 0
            ? PALETTE.warmGold
            : spawned % 3 === 1
              ? PALETTE.pink
              : PALETTE.cyan;
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
    if (
      this.rafId &&
      typeof window !== 'undefined' &&
      typeof window.cancelAnimationFrame === 'function'
    ) {
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

    if (
      this.isRunning &&
      typeof window !== 'undefined' &&
      typeof window.requestAnimationFrame === 'function'
    ) {
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

    // 2. Update shooting stars / meteors
    const caps = this.getCaps();
    for (let i = 0; i < Math.min(this.meteorPool.length, caps.maxMeteors); i += 1) {
      const m = this.meteorPool[i];
      if (m.active) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.alpha -= dt * 0.42;

        if (m.alpha <= 0 || m.x > 1.15 || m.y > 0.9) {
          m.active = false;
          m.cooldown = 1.8 + (i % 3) * 1.4;
        }
      } else {
        m.cooldown -= dt;
        if (m.cooldown <= 0) {
          m.active = true;
          m.x = 0.05 + ((this.elapsedTime * 0.17 + i * 0.31) % 0.65);
          m.y = 0.04 + ((i * 0.11) % 0.25);
          m.alpha = 0.92;
        }
      }
    }

    // 3. Update floating letters & rising new letter animation
    for (let i = 0; i < this.letterNodes.length; i += 1) {
      const node = this.letterNodes[i];
      if (node.entryProgress < 1) {
        node.entryProgress = Math.min(1, node.entryProgress + dt * 0.65);
      }

      const targetY = node.yRatio * this.height;
      const easeProgress = 1 - Math.pow(1 - node.entryProgress, 3);
      const baseY = node.startY + (targetY - node.startY) * easeProgress;

      const bobOffset =
        Math.sin(this.elapsedTime * node.floatSpeed + node.floatPhase) *
        (this.isMobile ? 6 : 9);
      const swayOffset =
        Math.cos(this.elapsedTime * (node.floatSpeed * 0.7) + node.floatPhase) *
        (this.isMobile ? 4 : 6);

      node.x = node.xRatio * this.width + swayOffset;
      node.y = baseY + bobOffset;
    }

    // 4. Update reaction burst particles
    for (let i = 0; i < this.burstPool.length; i += 1) {
      const b = this.burstPool[i];
      if (!b.active) continue;

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy -= 12 * dt;
      b.alpha -= dt * 1.15;

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
    skyGrad.addColorStop(0.52, PALETTE.skyMid);
    skyGrad.addColorStop(1, PALETTE.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Soft Mystic Nebula Orbs
    const orbLimit = this.isMobile ? 2 : this.nebulaOrbs.length;
    for (let i = 0; i < orbLimit; i += 1) {
      const orb = this.nebulaOrbs[i];
      const driftX = this.reducedMotion ? 0 : Math.sin(this.elapsedTime * 0.28 + orb.phase) * 28;
      const driftY = this.reducedMotion ? 0 : Math.cos(this.elapsedTime * 0.22 + orb.phase) * 18;
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
        : star.baseAlpha + Math.sin(this.elapsedTime * star.twinkleSpeed + star.phase) * 0.26;
      const alpha = Math.min(0.98, Math.max(0.14, twinkle));

      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.xRatio * w, star.yRatio * h, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Shooting Stars / Meteors
    if (!this.reducedMotion) {
      for (let i = 0; i < this.meteorPool.length; i += 1) {
        const m = this.meteorPool[i];
        if (!m.active || m.alpha <= 0) continue;

        const headX = m.x * w;
        const headY = m.y * h;
        const tailX = headX - m.length;
        const tailY = headY - m.length * 0.52;

        const tailGrad = ctx.createLinearGradient(headX, headY, tailX, tailY);
        tailGrad.addColorStop(0, `rgba(254, 240, 138, ${m.alpha})`);
        tailGrad.addColorStop(0.4, `rgba(56, 189, 248, ${m.alpha * 0.6})`);
        tailGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        ctx.globalAlpha = m.alpha;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(headX, headY, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Falling / Drifting Light Particles
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

    // 6. Luminous Constellation Threads Connecting Floating Letters
    const maxConnectDist = this.isMobile ? 210 : 340;
    const maxConnectDistSq = maxConnectDist * maxConnectDist;

    for (let i = 0; i < this.letterNodes.length; i += 1) {
      const a = this.letterNodes[i];
      for (let j = i + 1; j < this.letterNodes.length; j += 1) {
        const b = this.letterNodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq <= maxConnectDistSq) {
          const strength = 1 - Math.sqrt(distSq) / maxConnectDist;
          ctx.strokeStyle = `rgba(251, 191, 36, ${(strength * 0.28).toFixed(3)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // 7. Floating Gratitude Letters & Stars
    for (let i = 0; i < this.letterNodes.length; i += 1) {
      const node = this.letterNodes[i];
      this.drawLetterNode(ctx, node);
    }

    // 8. Heart Burst Particles
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
      : 1 + Math.sin(this.elapsedTime * 2.4 + node.floatPhase) * 0.1;

    // 1. Multi-layered Luminous Halo Glow
    const haloRadius = (isFeatured ? 46 : 34) * pulse;
    const haloGrad = ctx.createRadialGradient(x, y, 2, x, y, haloRadius);

    if (node.isHighlighted) {
      haloGrad.addColorStop(0, 'rgba(251, 191, 36, 0.72)');
      haloGrad.addColorStop(0.5, 'rgba(244, 63, 94, 0.28)');
      haloGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    } else if (isHovered || isSelected) {
      haloGrad.addColorStop(0, 'rgba(0, 229, 255, 0.68)');
      haloGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.25)');
      haloGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    } else if (node.variant === 'star') {
      haloGrad.addColorStop(0, 'rgba(168, 85, 247, 0.48)');
      haloGrad.addColorStop(0.55, 'rgba(56, 189, 248, 0.18)');
      haloGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    } else {
      haloGrad.addColorStop(0, 'rgba(251, 191, 36, 0.48)');
      haloGrad.addColorStop(0.55, 'rgba(245, 158, 11, 0.16)');
      haloGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    }

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(x, y, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Celestial Star Rays behind the Envelope
    const rayLen = (isFeatured ? 24 : 17) * pulse;
    ctx.strokeStyle = isFeatured
      ? 'rgba(254, 240, 138, 0.75)'
      : 'rgba(251, 191, 36, 0.38)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - rayLen, y);
    ctx.lineTo(x + rayLen, y);
    ctx.moveTo(x, y - rayLen);
    ctx.lineTo(x, y + rayLen);
    ctx.stroke();

    // 3. Glowing Envelope Icon on Sky
    const envW = isFeatured ? 32 : 26;
    const envH = isFeatured ? 21 : 17;
    const left = x - envW / 2;
    const top = y - envH / 2;

    ctx.fillStyle = node.isHighlighted ? '#fef3c7' : '#1e293b';
    ctx.strokeStyle = node.isHighlighted
      ? PALETTE.warmGold
      : isHovered || isSelected
        ? PALETTE.cyan
        : '#fbbf24';
    ctx.lineWidth = isFeatured ? 2.2 : 1.6;

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

    // 4. Mentor Short Label + Heart Count below the floating envelope
    const rawMentor = String(node.message?.mentorName || 'Mentor');
    const shortMentor = rawMentor.length > 18 ? `${rawMentor.slice(0, 17)}…` : rawMentor;

    ctx.font = this.isMobile
      ? '600 10px "Be Vietnam Pro", sans-serif'
      : '700 11.5px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isFeatured ? '#fef08a' : '#f8fafc';
    ctx.fillText(shortMentor, x, y + envH / 2 + 15);

    if (node.reactionCount > 0) {
      ctx.font = this.isMobile
        ? '600 9px "JetBrains Mono", monospace'
        : '600 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#fda4af';
      ctx.fillText(`♥ ${node.reactionCount}`, x, y - envH / 2 - 7);
    }
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
