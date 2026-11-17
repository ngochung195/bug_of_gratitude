const PALETTE = {
  skyTop: '#040711',
  skyMid: '#0b132c',
  skyBottom: '#1b113a',
  cyan: '#00e5ff',
  purple: '#a855f7',
  pink: '#f43f5e',
  warmGold: '#fbbf24',
  brightGold: '#fde047',
  white: '#f8fafc',
};

const STAR_COLORS = ['#f8fafc', '#38bdf8', '#c084fc', '#fde68a', '#f472b6'];

export class RainCanvasEngine {
  constructor(canvas, { onSelectNode, onHoverNode } = {}) {
    this.canvas = canvas;
    this.ctx =
      canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
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

    // Pre-allocated object pools for high performance
    this.starPool = [];
    this.rainStreakPool = [];
    this.charmPool = []; // Falling Hearts & Golden Stars
    this.bokehPool = [];
    this.particlePool = [];
    this.ripplePool = [];
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
        maxStars: 24,
        maxParticles: 14,
        maxRainStreaks: 28,
        maxCharms: 18,
        maxBokeh: 8,
        maxRipples: 6,
        maxBursts: 16,
        maxMeteors: 2,
        maxVisibleNodes: 14,
        hitRadius: 42,
      };
    }
    return {
      maxStars: 48,
      maxParticles: 30,
      maxRainStreaks: 56,
      maxCharms: 36,
      maxBokeh: 14,
      maxRipples: 10,
      maxBursts: 28,
      maxMeteors: 3,
      maxVisibleNodes: 24,
      hitRadius: 36,
    };
  }

  initPools() {
    const caps = this.getCaps();

    this.starPool = Array.from({ length: 48 }, (_, i) => ({
      active: i < caps.maxStars,
      xRatio: (i * 0.61803398875) % 1,
      yRatio: ((i * 0.38196601125 + 0.05) % 0.88) + 0.03,
      radius: 0.9 + (i % 4) * 0.6,
      baseAlpha: 0.32 + (i % 5) * 0.12,
      twinkleSpeed: 1.0 + (i % 4) * 0.55,
      phase: i * 1.17,
      isDiamond: i % 4 === 0,
      color: STAR_COLORS[i % STAR_COLORS.length],
    }));

    // Shimmering Rain Streaks falling across the sky
    this.rainStreakPool = Array.from({ length: 56 }, (_, i) => ({
      active: i < caps.maxRainStreaks,
      x: ((i * 73) % 1000) / 1000,
      y: ((i * 137) % 1000) / 1000,
      vy: 0.24 + (i % 5) * 0.06,
      vx: -0.025,
      length: 22 + (i % 4) * 12,
      alpha: 0.15 + (i % 4) * 0.08,
      color:
        i % 3 === 0
          ? '251, 191, 36'
          : i % 3 === 1
            ? '56, 189, 248'
            : '244, 114, 182',
    }));

    // Falling Hearts & Golden Stars in the Rain
    this.charmPool = Array.from({ length: 36 }, (_, i) => ({
      active: i < caps.maxCharms,
      type: i % 2 === 0 ? 'star' : 'heart',
      x: ((i * 0.61803398875 + 0.07) % 0.94) + 0.03,
      y: (i * 0.2718281828) % 1,
      vy: 0.065 + (i % 5) * 0.022,
      swayAmp: 0.008 + (i % 3) * 0.004,
      swaySpeed: 1.2 + (i % 4) * 0.35,
      phase: i * 1.4,
      rotation: (i * 0.7) % (Math.PI * 2),
      rotationSpeed: (i % 2 === 0 ? 1 : -1) * (0.6 + (i % 3) * 0.35),
      size: 6.5 + (i % 4) * 2.2,
      alpha: 0.62 + (i % 4) * 0.1,
      color:
        i % 2 === 0
          ? i % 4 === 0
            ? PALETTE.brightGold
            : PALETTE.warmGold
          : i % 3 === 0
            ? '#fb7185'
            : PALETTE.pink,
    }));

    // Dreamy Bokeh Orbs
    this.bokehPool = Array.from({ length: 14 }, (_, i) => ({
      active: i < caps.maxBokeh,
      x: ((i * 193) % 1000) / 1000,
      y: ((i * 109) % 1000) / 1000,
      vy: 0.02 + (i % 3) * 0.01,
      vx: ((i % 2) * 2 - 1) * 0.008,
      radius: 16 + (i % 4) * 11,
      alpha: 0.05 + (i % 3) * 0.03,
      color:
        i % 3 === 0
          ? 'rgba(251, 191, 36, 0.12)'
          : i % 3 === 1
            ? 'rgba(0, 229, 255, 0.1)'
            : 'rgba(168, 85, 247, 0.12)',
    }));

    // Sparkle Motes
    this.particlePool = Array.from({ length: 30 }, (_, i) => ({
      active: i < caps.maxParticles,
      x: ((i * 97) % 1000) / 1000,
      y: ((i * 53) % 1000) / 1000,
      vy: 0.055 + (i % 4) * 0.02,
      vx: ((i % 3) - 1) * 0.008,
      size: 1.5 + (i % 3) * 0.8,
      alpha: 0.35 + (i % 4) * 0.14,
      color: i % 3 === 0 ? PALETTE.cyan : i % 3 === 1 ? PALETTE.warmGold : PALETTE.pink,
    }));

    // Ripples when letters / rain touch the lower horizon
    this.ripplePool = Array.from({ length: 10 }, () => ({
      active: false,
      x: 0,
      y: 0,
      radius: 2,
      maxRadius: 48,
      alpha: 0.65,
      color: PALETTE.warmGold,
    }));

    this.burstPool = Array.from({ length: 28 }, (_, i) => ({
      active: false,
      shape: i % 2 === 0 ? 'heart' : 'star',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      alpha: 0,
      size: 5,
      color: PALETTE.warmGold,
    }));

    this.meteorPool = Array.from({ length: 3 }, (_, i) => ({
      active: i === 0,
      x: 0.15 + i * 0.28,
      y: 0.06 + i * 0.06,
      vx: 0.36,
      vy: 0.19,
      length: 105,
      alpha: 0.9,
      cooldown: i * 2.0,
    }));

    this.nebulaOrbs = [
      { xRatio: 0.2, yRatio: 0.28, radiusRatio: 0.38, color: 'rgba(139, 92, 246, 0.17)', phase: 0 },
      { xRatio: 0.78, yRatio: 0.25, radiusRatio: 0.34, color: 'rgba(0, 229, 255, 0.14)', phase: 2.1 },
      { xRatio: 0.5, yRatio: 0.64, radiusRatio: 0.42, color: 'rgba(251, 191, 36, 0.12)', phase: 4.2 },
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
    this.rainStreakPool.forEach((r, idx) => {
      r.active = idx < caps.maxRainStreaks;
    });
    this.charmPool.forEach((c, idx) => {
      c.active = idx < caps.maxCharms;
    });
    this.bokehPool.forEach((b, idx) => {
      b.active = idx < caps.maxBokeh;
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

  /**
   * Initialize the falling gratitude letters across staggered horizontal lanes & vertical rain positions.
   */
  setMessages(messages = [], { highlightMessageId = null, reactionCounts = {} } = {}) {
    const caps = this.getCaps();
    const safeList = Array.isArray(messages) ? messages.slice(0, caps.maxVisibleNodes) : [];
    const total = Math.max(1, safeList.length);

    this.letterNodes = safeList.map((msg, index) => {
      const isHighlighted = Boolean(highlightMessageId && msg.id === highlightMessageId);

      // Spread letters evenly across horizontal lanes (0.10 .. 0.90)
      const laneRatio =
        total === 1
          ? 0.5
          : 0.09 + ((index * 0.61803398875 * 1.3 + index / total) % 0.82);

      // Stagger vertical starting positions so letters rain continuously across the whole screen
      const initialYRatio = isHighlighted
        ? 0.35
        : 0.12 + ((index * 0.29 + (index % 3) * 0.21) % 0.68);

      const fallSpeedPx = this.isMobile
        ? 28 + (index % 4) * 7
        : 36 + (index % 5) * 8;

      return {
        id: msg.id,
        message: msg,
        xRatio: isHighlighted ? 0.5 : laneRatio,
        yRatio: initialYRatio,
        x: (isHighlighted ? 0.5 : laneRatio) * this.width,
        y: initialYRatio * this.height,
        startY: isHighlighted ? this.height * 0.88 : initialYRatio * this.height,
        entryProgress: isHighlighted && !this.reducedMotion ? 0 : 1,
        fallSpeed: fallSpeedPx,
        swayPhase: index * 1.35,
        swaySpeed: 1.15 + (index % 4) * 0.22,
        swayAmp: this.isMobile ? 12 + (index % 3) * 4 : 18 + (index % 4) * 6,
        tiltAngle: 0,
        trailLength: isHighlighted ? 78 : 54 + (index % 3) * 14,
        isHighlighted,
        reactionCount: Number(reactionCounts[msg.id] ?? msg.reactionCount ?? 0),
        variant: index % 3 === 0 ? 'gold' : index % 3 === 1 ? 'cyan' : 'pink',
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
      if (node.entryProgress < 1) {
        const targetY = node.yRatio * this.height;
        const easeProgress = 1 - Math.pow(1 - Math.min(1, node.entryProgress), 3);
        node.y = node.startY + (targetY - node.startY) * easeProgress;
      } else {
        node.y = node.yRatio * this.height;
      }
    });
  }

  spawnRipple(x, y, color = PALETTE.warmGold) {
    const caps = this.getCaps();
    for (let i = 0; i < Math.min(this.ripplePool.length, caps.maxRipples); i += 1) {
      const r = this.ripplePool[i];
      if (!r.active) {
        r.active = true;
        r.x = x;
        r.y = y;
        r.radius = 4;
        r.maxRadius = this.isMobile ? 38 : 56;
        r.alpha = 0.65;
        r.color = color;
        break;
      }
    }
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
        const speed = 48 + (spawned % 4) * 26;
        p.active = true;
        p.shape = spawned % 2 === 0 ? 'heart' : 'star';
        p.x = targetNode.x;
        p.y = targetNode.y;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 22;
        p.alpha = 1;
        p.size = 5 + (spawned % 3) * 1.8;
        p.color =
          spawned % 2 === 0 ? PALETTE.pink : PALETTE.brightGold;
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

    // 1. Update Shimmering Rain Streaks
    for (let i = 0; i < this.rainStreakPool.length; i += 1) {
      const r = this.rainStreakPool[i];
      if (!r.active) continue;

      r.y += r.vy * dt;
      r.x += r.vx * dt;

      if (r.y > 1.05) {
        r.y = -0.06;
        r.x = (r.x + 0.41) % 1;
      }
      if (r.x < -0.05) {
        r.x = 1.04;
      }
    }

    // 2. Update Falling Hearts & Golden Stars in the Rain
    for (let i = 0; i < this.charmPool.length; i += 1) {
      const c = this.charmPool[i];
      if (!c.active) continue;

      c.y += c.vy * dt;
      c.x += Math.sin(this.elapsedTime * c.swaySpeed + c.phase) * c.swayAmp * dt;
      c.rotation += c.rotationSpeed * dt;

      if (c.y > 1.06) {
        c.y = -0.06;
        c.x = (c.x + 0.29) % 0.96 + 0.02;
      }
    }

    // 3. Update Dreamy Bokeh Orbs
    for (let i = 0; i < this.bokehPool.length; i += 1) {
      const b = this.bokehPool[i];
      if (!b.active) continue;

      b.y += b.vy * dt;
      b.x += b.vx * dt;
      if (b.y > 1.08) b.y = -0.08;
      if (b.x < -0.08) b.x = 1.08;
      if (b.x > 1.08) b.x = -0.08;
    }

    // 4. Update Sparkle Particles
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

    // 5. Update Shooting Stars / Meteors
    const caps = this.getCaps();
    for (let i = 0; i < Math.min(this.meteorPool.length, caps.maxMeteors); i += 1) {
      const m = this.meteorPool[i];
      if (m.active) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.alpha -= dt * 0.42;

        if (m.alpha <= 0 || m.x > 1.15 || m.y > 0.9) {
          m.active = false;
          m.cooldown = 1.6 + (i % 3) * 1.2;
        }
      } else {
        m.cooldown -= dt;
        if (m.cooldown <= 0) {
          m.active = true;
          m.x = 0.05 + ((this.elapsedTime * 0.17 + i * 0.31) % 0.65);
          m.y = 0.04 + ((i * 0.11) % 0.25);
          m.alpha = 0.95;
        }
      }
    }

    // 6. Update Falling Gratitude Letters ("Rơi như mưa thật")
    for (let i = 0; i < this.letterNodes.length; i += 1) {
      const node = this.letterNodes[i];

      if (node.entryProgress < 1) {
        node.entryProgress = Math.min(1, node.entryProgress + dt * 0.65);
        const targetY = node.yRatio * this.height;
        const easeProgress = 1 - Math.pow(1 - node.entryProgress, 3);
        node.y = node.startY + (targetY - node.startY) * easeProgress;
        node.x = node.xRatio * this.width;
        continue;
      }

      const isHoveredOrSelected =
        this.hoveredNodeId === node.id || this.selectedNodeId === node.id;
      const speedFactor = isHoveredOrSelected ? 0.08 : 1;

      node.y += node.fallSpeed * speedFactor * dt;
      node.yRatio = node.y / Math.max(1, this.height);

      const swayOffset =
        Math.sin(this.elapsedTime * node.swaySpeed + node.swayPhase) * node.swayAmp;
      node.x = node.xRatio * this.width + swayOffset;
      node.tiltAngle =
        Math.cos(this.elapsedTime * node.swaySpeed + node.swayPhase) * 0.12;

      if (node.y > this.height - 68) {
        this.spawnRipple(
          node.x,
          this.height - 72,
          node.variant === 'cyan'
            ? PALETTE.cyan
            : node.variant === 'pink'
              ? PALETTE.pink
              : PALETTE.warmGold
        );
        node.y = -48 - (i % 4) * 24;
        node.yRatio = node.y / Math.max(1, this.height);
        node.xRatio = 0.1 + ((node.xRatio + 0.23) % 0.8);
      }
    }

    // 7. Update Horizon Ripples
    for (let i = 0; i < this.ripplePool.length; i += 1) {
      const rp = this.ripplePool[i];
      if (!rp.active) continue;
      rp.radius += 38 * dt;
      rp.alpha -= 0.75 * dt;
      if (rp.alpha <= 0 || rp.radius >= rp.maxRadius) {
        rp.active = false;
      }
    }

    // 8. Update Reaction Burst Particles
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

  /**
   * Draws a 5-point Golden Star at (cx, cy).
   */
  drawGoldenStarShape(ctx, cx, cy, outerR, innerR, rotation = 0, fillColor = PALETTE.brightGold) {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    const spikes = 5;
    for (let i = 0; i < spikes * 2; i += 1) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = rotation + (i * Math.PI) / spikes - Math.PI / 2;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    if (typeof ctx.closePath === 'function') {
      ctx.closePath();
    }
    ctx.fill();
  }

  /**
   * Draws a Heart shape at (cx, cy).
   */
  drawHeartShape(ctx, cx, cy, size, fillColor = PALETTE.pink) {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    if (typeof ctx.bezierCurveTo === 'function') {
      const topCurveHeight = size * 0.32;
      const yTop = cy - size * 0.45;
      ctx.moveTo(cx, yTop + topCurveHeight);
      // Left lobe
      ctx.bezierCurveTo(
        cx,
        yTop,
        cx - size,
        yTop,
        cx - size,
        yTop + topCurveHeight
      );
      ctx.bezierCurveTo(
        cx - size,
        yTop + (size + topCurveHeight) * 0.52,
        cx,
        yTop + (size + topCurveHeight) * 0.82,
        cx,
        yTop + size * 1.15
      );
      // Right lobe
      ctx.bezierCurveTo(
        cx,
        yTop + (size + topCurveHeight) * 0.82,
        cx + size,
        yTop + (size + topCurveHeight) * 0.52,
        cx + size,
        yTop + topCurveHeight
      );
      ctx.bezierCurveTo(
        cx + size,
        yTop,
        cx,
        yTop,
        cx,
        yTop + topCurveHeight
      );
    } else {
      ctx.arc(cx, cy, size * 0.6, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  renderFrame() {
    const ctx = this.ctx;
    if (!ctx) return;

    const w = this.width;
    const h = this.height;

    // 1. Deep Night Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, PALETTE.skyTop);
    skyGrad.addColorStop(0.5, PALETTE.skyMid);
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

    // 3. Dreamy Bokeh Light Orbs
    for (let i = 0; i < this.bokehPool.length; i += 1) {
      const b = this.bokehPool[i];
      if (!b.active) continue;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x * w, b.y * h, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Twinkling Stars & 4-Point Diamond Stars
    for (let i = 0; i < this.starPool.length; i += 1) {
      const star = this.starPool[i];
      if (!star.active) continue;

      const twinkle = this.reducedMotion
        ? star.baseAlpha
        : star.baseAlpha + Math.sin(this.elapsedTime * star.twinkleSpeed + star.phase) * 0.28;
      const alpha = Math.min(0.98, Math.max(0.12, twinkle));
      const sx = star.xRatio * w;
      const sy = star.yRatio * h;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
      ctx.fill();

      if (star.isDiamond && alpha > 0.55) {
        ctx.strokeStyle = star.color;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(sx - star.radius * 3.2, sy);
        ctx.lineTo(sx + star.radius * 3.2, sy);
        ctx.moveTo(sx, sy - star.radius * 3.2);
        ctx.lineTo(sx, sy + star.radius * 3.2);
        ctx.stroke();
      }
    }

    // 5. Shimmering Light Rain Streaks
    for (let i = 0; i < this.rainStreakPool.length; i += 1) {
      const r = this.rainStreakPool[i];
      if (!r.active) continue;

      const x1 = r.x * w;
      const y1 = r.y * h;
      const x2 = x1 - r.vx * 85;
      const y2 = y1 - r.length;

      const streakGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      streakGrad.addColorStop(0, `rgba(${r.color}, ${r.alpha})`);
      streakGrad.addColorStop(1, `rgba(${r.color}, 0)`);

      ctx.strokeStyle = streakGrad;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 6. Shooting Stars / Meteors
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
        tailGrad.addColorStop(0.4, `rgba(56, 189, 248, ${m.alpha * 0.65})`);
        tailGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        ctx.globalAlpha = m.alpha;
        this.drawGoldenStarShape(ctx, headX, headY, 5.5, 2.4, this.elapsedTime * 2, PALETTE.brightGold);
      }
    }

    // 7. Falling Hearts & Golden Stars in the Rain (`charmPool`)
    for (let i = 0; i < this.charmPool.length; i += 1) {
      const c = this.charmPool[i];
      if (!c.active) continue;

      const cx = c.x * w;
      const cy = c.y * h;
      const pulseAlpha = this.reducedMotion
        ? c.alpha
        : c.alpha + Math.sin(this.elapsedTime * 2.5 + c.phase) * 0.18;

      ctx.globalAlpha = Math.min(0.96, Math.max(0.22, pulseAlpha));

      // Soft aura behind the falling heart or golden star
      const glowR = c.size * 2.1;
      const aura = ctx.createRadialGradient(cx, cy, 1, cx, cy, glowR);
      if (c.type === 'star') {
        aura.addColorStop(0, 'rgba(253, 224, 71, 0.45)');
        aura.addColorStop(1, 'rgba(251, 191, 36, 0)');
      } else {
        aura.addColorStop(0, 'rgba(244, 63, 94, 0.42)');
        aura.addColorStop(1, 'rgba(244, 63, 94, 0)');
      }
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Draw either a 5-point Golden Star or a Glowing Heart
      if (c.type === 'star') {
        this.drawGoldenStarShape(
          ctx,
          cx,
          cy,
          c.size,
          c.size * 0.44,
          c.rotation,
          c.color
        );
      } else {
        this.drawHeartShape(ctx, cx, cy, c.size * 0.82, c.color);
      }
    }

    // 8. Falling Sparkle Motes
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

    // 9. Horizon Ripples when Letters Touch Down
    for (let i = 0; i < this.ripplePool.length; i += 1) {
      const rp = this.ripplePool[i];
      if (!rp.active || rp.alpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, rp.alpha);
      ctx.strokeStyle = rp.color;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      if (typeof ctx.ellipse === 'function') {
        ctx.ellipse(rp.x, rp.y, rp.radius, rp.radius * 0.32, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(rp.x, rp.y, rp.radius * 0.5, 0, Math.PI * 2);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 10. Falling Gratitude Letters with Luminous Comet Trails, Golden Stars & Hearts
    for (let i = 0; i < this.letterNodes.length; i += 1) {
      const node = this.letterNodes[i];
      this.drawFallingLetterNode(ctx, node);
    }

    // 11. Heart & Golden Star Burst Particles
    for (let i = 0; i < this.burstPool.length; i += 1) {
      const b = this.burstPool[i];
      if (!b.active) continue;

      ctx.globalAlpha = Math.max(0, b.alpha);
      if (b.shape === 'star') {
        this.drawGoldenStarShape(ctx, b.x, b.y, b.size, b.size * 0.45, this.elapsedTime * 3, b.color);
      } else {
        this.drawHeartShape(ctx, b.x, b.y, b.size * 0.85, b.color);
      }
    }

    ctx.globalAlpha = 1;
  }

  drawFallingLetterNode(ctx, node) {
    const isHovered = this.hoveredNodeId === node.id;
    const isSelected = this.selectedNodeId === node.id;
    const isFeatured = node.isHighlighted || isHovered || isSelected;

    const x = node.x;
    const y = node.y;
    const pulse = this.reducedMotion
      ? 1
      : 1 + Math.sin(this.elapsedTime * 2.8 + node.swayPhase) * 0.1;

    // 1. Upward Shimmering Stardust Rain Trail behind the Falling Letter
    const trailLen = isFeatured ? node.trailLength * 1.25 : node.trailLength;
    const trailGrad = ctx.createLinearGradient(x, y, x - node.tiltAngle * 40, y - trailLen);

    if (node.isHighlighted || node.variant === 'gold') {
      trailGrad.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
      trailGrad.addColorStop(0.5, 'rgba(244, 63, 94, 0.22)');
      trailGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    } else if (node.variant === 'cyan') {
      trailGrad.addColorStop(0, 'rgba(0, 229, 255, 0.52)');
      trailGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.2)');
      trailGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    } else {
      trailGrad.addColorStop(0, 'rgba(244, 114, 182, 0.52)');
      trailGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.2)');
      trailGrad.addColorStop(1, 'rgba(244, 114, 182, 0)');
    }

    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = isFeatured ? 5 : 3.2;
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x - node.tiltAngle * 35, y - trailLen);
    ctx.stroke();

    // Accompanying Golden Star & Heart along the letter's trail
    this.drawGoldenStarShape(
      ctx,
      x - node.tiltAngle * 15 - 9,
      y - trailLen * 0.36,
      isFeatured ? 5.5 : 4.2,
      2.0,
      this.elapsedTime * 1.6 + node.swayPhase,
      PALETTE.brightGold
    );
    this.drawHeartShape(
      ctx,
      x - node.tiltAngle * 24 + 9,
      y - trailLen * 0.62,
      isFeatured ? 4.8 : 3.8,
      '#fb7185'
    );

    // 2. Multi-layered Luminous Halo Glow
    const haloRadius = (isFeatured ? 48 : 34) * pulse;
    const haloGrad = ctx.createRadialGradient(x, y, 2, x, y, haloRadius);

    if (node.isHighlighted) {
      haloGrad.addColorStop(0, 'rgba(251, 191, 36, 0.78)');
      haloGrad.addColorStop(0.5, 'rgba(244, 63, 94, 0.32)');
      haloGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    } else if (isHovered || isSelected) {
      haloGrad.addColorStop(0, 'rgba(0, 229, 255, 0.75)');
      haloGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.3)');
      haloGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    } else if (node.variant === 'cyan') {
      haloGrad.addColorStop(0, 'rgba(0, 229, 255, 0.46)');
      haloGrad.addColorStop(0.55, 'rgba(168, 85, 247, 0.18)');
      haloGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    } else if (node.variant === 'pink') {
      haloGrad.addColorStop(0, 'rgba(244, 114, 182, 0.46)');
      haloGrad.addColorStop(0.55, 'rgba(251, 191, 36, 0.18)');
      haloGrad.addColorStop(1, 'rgba(244, 114, 182, 0)');
    } else {
      haloGrad.addColorStop(0, 'rgba(251, 191, 36, 0.5)');
      haloGrad.addColorStop(0.55, 'rgba(245, 158, 11, 0.18)');
      haloGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    }

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(x, y, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Celestial Star Rays behind the Envelope
    const rayLen = (isFeatured ? 25 : 17) * pulse;
    ctx.strokeStyle = isFeatured
      ? 'rgba(254, 240, 138, 0.8)'
      : 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - rayLen, y);
    ctx.lineTo(x + rayLen, y);
    ctx.moveTo(x, y - rayLen);
    ctx.lineTo(x, y + rayLen);
    ctx.stroke();

    // 4. Glowing Envelope Icon
    const envW = isFeatured ? 34 : 28;
    const envH = isFeatured ? 22 : 18;
    const left = x - envW / 2;
    const top = y - envH / 2;

    ctx.fillStyle = node.isHighlighted ? '#fef3c7' : '#16203d';
    ctx.strokeStyle = node.isHighlighted
      ? PALETTE.warmGold
      : isHovered || isSelected
        ? PALETTE.cyan
        : node.variant === 'cyan'
          ? '#38bdf8'
          : node.variant === 'pink'
            ? '#f472b6'
            : '#fbbf24';
    ctx.lineWidth = isFeatured ? 2.2 : 1.7;

    ctx.beginPath();
    ctx.rect(left, top, envW, envH);
    ctx.fill();
    ctx.stroke();

    // Envelope Flap V-line
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(x, y + 3);
    ctx.lineTo(left + envW, top);
    ctx.stroke();

    // Wax Heart Seal at center of Envelope Flap
    this.drawHeartShape(ctx, x, y + 2, 3.8, isFeatured ? '#f43f5e' : '#fbbf24');

    // 5. Mentor Short Label + Heart Count below/above the falling envelope
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
