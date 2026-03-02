/* ============================
   Navbar transparent -> solid
============================ */
const header = document.querySelector(".site-header");
window.addEventListener("scroll", () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 20);
});

/* ============================
   Hero-only overlay visibility
============================ */
const heroSection = document.querySelector(".section-hero");
const heroSymbols = document.getElementById("heroSymbols");

const heroObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!heroSymbols) return;
      heroSymbols.classList.toggle("is-visible", e.isIntersecting);
    });
  },
  { threshold: 0.25 }
);

if (heroSection) heroObserver.observe(heroSection);

/* ============================
   Scroll reveal (IntersectionObserver)
============================ */
const revealItems = document.querySelectorAll(".reveal-on-scroll");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach((el) => revealObserver.observe(el));

/* ============================
   Floating symbols (subtle random drift)
============================ */
const symbols = document.querySelectorAll(".float-symbol");
symbols.forEach((el) => {
  const drift = () => {
    const dx = (Math.random() * 16) - 8;
    const dy = (Math.random() * 16) - 8;
    el.animate(
      [{ transform: "translate(0,0)" }, { transform: `translate(${dx}px,${dy}px)` }],
      { duration: 3500, direction: "alternate", easing: "ease-in-out", iterations: 2 }
    );
  };
  setInterval(drift, 4000 + Math.random() * 1500);
});



/* ============================
   Particle Background (FAST: spatial grid)
============================ */
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

let particles = [];
let width = 0;
let height = 0;

const baseConfig = {
  maxDistance: 140,
  particleMinSize: 0.6,
  particleMaxSize: 2.4,
  lineOpacity: 0.08,
  baseSpeed: 0.24,
  pulseSpeed: 0.008,
  // cap hard to prevent huge-screen overload
  minParticles: 90,
  maxParticles: 150,
  densityFactor: 14000 // higher = fewer particles
};

const colors = [
  { r: 0, g: 150, b: 255 },
  { r: 0, g: 200, b: 255 },
  { r: 100, g: 180, b: 255 },
  { r: 0, g: 120, b: 200 },
  { r: 50, g: 220, b: 255 }
];

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function getResponsiveConfig() {
  const area = width * height;
  const particleCount = Math.max(
    baseConfig.minParticles,
    Math.min(baseConfig.maxParticles, Math.floor(area / baseConfig.densityFactor))
  );

  const scale = Math.min(1.15, Math.max(0.9, Math.min(width, height) / 900));
  const maxDistance = Math.floor(baseConfig.maxDistance * scale);

  return { ...baseConfig, particleCount, maxDistance };
}

class Particle {
  constructor(cfg) {
    this.cfg = cfg;
    this.reset();
  }
  reset() {
    const cfg = this.cfg;
    this.x = Math.random() * width;
    this.y = Math.random() * height;

    this.baseSize = cfg.particleMinSize + Math.random() * (cfg.particleMaxSize - cfg.particleMinSize);
    this.size = this.baseSize;

    const angle = Math.random() * Math.PI * 2;
    const speed = cfg.baseSpeed * (0.3 + Math.random() * 0.7);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.color = { ...colors[Math.floor(Math.random() * colors.length)] };

    this.pulsePhase = Math.random() * Math.PI * 2;
    this.pulseSpeed = cfg.pulseSpeed * (0.5 + Math.random());
    this.baseOpacity = 0.4 + Math.random() * 0.4;
    this.opacity = this.baseOpacity;
    this.glowIntensity = 0.3 + Math.random() * 0.5;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -50) this.x = width + 50;
    if (this.x > width + 50) this.x = -50;
    if (this.y < -50) this.y = height + 50;
    if (this.y > height + 50) this.y = -50;

    this.pulsePhase += this.pulseSpeed;
    const pulse = Math.sin(this.pulsePhase);
    this.size = this.baseSize * (0.8 + pulse * 0.3);
    this.opacity = this.baseOpacity * (0.7 + pulse * 0.3);
  }

  draw() {
    const outer = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 8);
    outer.addColorStop(0, `rgba(${this.color.r},${this.color.g},${this.color.b},${this.opacity * this.glowIntensity * 0.3})`);
    outer.addColorStop(0.3, `rgba(${this.color.r},${this.color.g},${this.color.b},${this.opacity * this.glowIntensity * 0.1})`);
    outer.addColorStop(1, "rgba(0,0,0,0)");

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 8, 0, Math.PI * 2);
    ctx.fillStyle = outer;
    ctx.fill();

    const core = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
    core.addColorStop(0, `rgba(255,255,255,${this.opacity * 0.9})`);
    core.addColorStop(0.3, `rgba(${this.color.r},${this.color.g},${this.color.b},${this.opacity * 0.8})`);
    core.addColorStop(1, `rgba(${this.color.r},${this.color.g},${this.color.b},0)`);

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.fill();
  }
}

// ---- FAST grid-binning connections ----
let grid = new Map();

function cellKey(cx, cy) {
  return `${cx},${cy}`;
}

function buildGrid(cellSize) {
  grid.clear();
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const cx = Math.floor(p.x / cellSize);
    const cy = Math.floor(p.y / cellSize);
    const key = cellKey(cx, cy);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(i);
  }
}

function drawConnections(cfg) {
  const cellSize = cfg.maxDistance;
  buildGrid(cellSize);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const cx = Math.floor(p.x / cellSize);
    const cy = Math.floor(p.y / cellSize);

    // check only neighbor cells (3x3)
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const key = cellKey(cx + ox, cy + oy);
        const bucket = grid.get(key);
        if (!bucket) continue;

        for (let b = 0; b < bucket.length; b++) {
          const j = bucket[b];
          if (j <= i) continue; // avoid duplicates

          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < cfg.maxDistance) {
            const opacity = (1 - dist / cfg.maxDistance) * cfg.lineOpacity;
            const avgR = (p.color.r + q.color.r) / 2;
            const avgG = (p.color.g + q.color.g) / 2;
            const avgB = (p.color.b + q.color.b) / 2;

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${avgR},${avgG},${avgB},${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }
  }
}

function initParticles() {
  resizeCanvas();
  const cfg = getResponsiveConfig();
  particles = Array.from({ length: cfg.particleCount }, () => new Particle(cfg));
}

function animate() {
  const cfg = getResponsiveConfig();

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  drawConnections(cfg);

  for (const p of particles) {
    p.update();
    p.draw();
  }

  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => initParticles(), { passive: true });

initParticles();
animate();


/* ============================
   Timeline connect animation (scroll fill)
============================ */
const timeline = document.getElementById("timeline");
const timelineFill = document.getElementById("timelineFill");

function updateTimelineFill(){
  if (!timeline || !timelineFill) return;

  const rect = timeline.getBoundingClientRect();
  const viewH = window.innerHeight;

  // Progress from when timeline enters to when it leaves
  const start = viewH * 0.75;
  const end = viewH * 0.15;

  const progress = (start - rect.top) / (rect.height + (start - end));
  const clamped = Math.max(0, Math.min(1, progress));

  timelineFill.style.height = `${clamped * 100}%`;
}

window.addEventListener("scroll", updateTimelineFill, { passive: true });
window.addEventListener("resize", updateTimelineFill);
updateTimelineFill();

/* ============================
   Center timeline fill (rAF throttled)
============================ */
const timelineCenter = document.getElementById("timelineCenter");
const timelineCenterFill = document.getElementById("timelineCenterFill");

let timelineTicking = false;

function updateTimelineCenterFill(){
  timelineTicking = false;
  if (!timelineCenter || !timelineCenterFill) return;

  const rect = timelineCenter.getBoundingClientRect();
  const viewH = window.innerHeight;

  const start = viewH * 0.75;
  const end = viewH * 0.20;

  const progress = (start - rect.top) / (rect.height + (start - end));
  const clamped = Math.max(0, Math.min(1, progress));

  timelineCenterFill.style.height = `${clamped * 100}%`;
}

window.addEventListener("scroll", () => {
  if (timelineTicking) return;
  timelineTicking = true;
  requestAnimationFrame(updateTimelineCenterFill);
}, { passive: true });

window.addEventListener("resize", updateTimelineCenterFill);
updateTimelineCenterFill();