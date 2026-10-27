/* Dragonworx — Coming soon: launch countdown and dragon flame */
(() => {
  'use strict';

  /* ---------- Countdown ---------- */

  // January 1, 2027, 12:00 a.m. Eastern Time (EST, UTC−5)
  const LAUNCH = Date.parse('2027-01-01T00:00:00-05:00');

  const fields = {};
  document.querySelectorAll('[data-unit]').forEach((el) => {
    fields[el.dataset.unit] = el;
  });
  const launchLabel = document.querySelector('[data-launch-label]');
  const pad = (n) => String(n).padStart(2, '0');

  function tick() {
    const left = Math.max(0, LAUNCH - Date.now());
    const total = Math.ceil(left / 1000);

    fields.days.textContent = pad(Math.floor(total / 86400));
    fields.hours.textContent = pad(Math.floor((total % 86400) / 3600));
    fields.minutes.textContent = pad(Math.floor((total % 3600) / 60));
    fields.seconds.textContent = pad(total % 60);

    if (left === 0) {
      launchLabel.textContent = 'Now launching';
      return;
    }
    // Wake just after the remaining time crosses the next whole second
    setTimeout(tick, (left % 1000 || 1000) + 10);
  }

  tick();

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Dragon flame ---------- */

  const stage = document.querySelector('.stage');
  const logo = stage.querySelector('.stage__logo');
  const canvas = stage.querySelector('.stage__flame');
  const ctx = canvas.getContext('2d');
  const replay = document.querySelector('.replay');

  // Inside the jaw, as a fraction of the stacked logo artwork (1488 × 725)
  const MOUTH = { x: 0.752, y: 0.648 };
  const ANGLE = -0.1; // radians, slightly upward so the plume clears the wordmark
  const SPREAD = 0.26;
  const BREATH = 1.7; // seconds of active emission
  const RATE = 380; // flame particles per second at full power

  let unit = 0; // rendered logo width in CSS px; every distance scales with it
  let origin = { x: 0, y: 0 };
  let flames = [];
  let embers = [];
  let carry = 0;
  let startTime = 0;
  let lastTime = 0;
  let running = false;

  function makeSprite(r, g, b) {
    const size = 64;
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = size;
    const sctx = sprite.getContext('2d');
    const grad = sctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.45)`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, size, size);
    return sprite;
  }

  const HOT = makeSprite(255, 240, 232); // white-hot core
  const RED = makeSprite(226, 6, 19); // Dragon Red

  function measure() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const c = canvas.getBoundingClientRect();
    const l = logo.getBoundingClientRect();
    canvas.width = Math.round(c.width * dpr);
    canvas.height = Math.round(c.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    unit = l.width;
    origin = {
      x: l.left - c.left + l.width * MOUTH.x,
      y: l.top - c.top + l.height * MOUTH.y,
    };
  }

  // Ramp up fast, hold, then taper off
  function power(t) {
    if (t < 0.15) return t / 0.15;
    if (t < 1.1) return 1;
    return Math.max(0, 1 - (t - 1.1) / (BREATH - 1.1));
  }

  function spawnFlame(p, t) {
    const angle = ANGLE + Math.sin(t * 7) * 0.06 + (Math.random() - 0.5) * SPREAD;
    const speed = unit * (0.95 + Math.random() * 0.45) * (0.6 + 0.4 * p);
    flames.push({
      x: origin.x + (Math.random() - 0.5) * unit * 0.01,
      y: origin.y + (Math.random() - 0.5) * unit * 0.01,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      age: 0,
      life: 0.4 + Math.random() * 0.35,
      size: unit * (0.012 + Math.random() * 0.012),
      phase: Math.random() * Math.PI * 2,
    });
  }

  function spawnEmber() {
    const angle = ANGLE - 0.25 + (Math.random() - 0.5) * 0.7;
    const speed = unit * (0.45 + Math.random() * 0.6);
    embers.push({
      x: origin.x + unit * 0.03,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      age: 0,
      life: 1.2 + Math.random() * 1.1,
      size: 1 + Math.random() * 1.6,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function update(list, dt, drag, lift, wobble, freq) {
    const k = Math.exp(-drag * dt);
    for (let i = list.length - 1; i >= 0; i--) {
      const q = list[i];
      q.age += dt;
      if (q.age >= q.life) {
        list[i] = list[list.length - 1];
        list.pop();
        continue;
      }
      const swirl = q.phase + q.age * freq;
      q.vx = q.vx * k + Math.sin(swirl) * wobble * unit * dt;
      q.vy = q.vy * k + (Math.cos(swirl * 1.3) * wobble - lift) * unit * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
  }

  function draw() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter';

    for (const f of flames) {
      const t = f.age / f.life;
      const r = f.size * (1 + t * 2.6);
      ctx.globalAlpha = Math.min(1, 0.3 + t / 0.12) * Math.pow(1 - t, 2.2) * 0.9;
      ctx.drawImage(RED, f.x - r, f.y - r, r * 2, r * 2);
      if (t < 0.4) {
        const hr = r * 0.55;
        ctx.globalAlpha = (1 - t / 0.4) * 0.85;
        ctx.drawImage(HOT, f.x - hr, f.y - hr, hr * 2, hr * 2);
      }
    }

    for (const e of embers) {
      const t = e.age / e.life;
      const r = e.size * 2.2;
      ctx.globalAlpha = (1 - t) * (0.55 + 0.45 * Math.sin(e.phase + e.age * 18));
      ctx.drawImage(t < 0.3 ? HOT : RED, e.x - r, e.y - r, r * 2, r * 2);
    }

    ctx.globalAlpha = 1;
  }

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, now - lastTime) / 1000);
    lastTime = now;
    const t = Math.max(0, now - startTime) / 1000;
    const p = t < BREATH ? power(t) : 0;

    carry += RATE * p * dt;
    while (carry >= 1) {
      spawnFlame(p, t);
      carry -= 1;
    }
    if (p > 0.2 && Math.random() < 40 * dt) spawnEmber();

    update(flames, dt, 1.6, 0.5, 0.9, 9);
    update(embers, dt, 1.1, 0.35, 0.4, 5);
    draw();

    if (t < BREATH || flames.length || embers.length) {
      requestAnimationFrame(frame);
    } else {
      running = false;
      replay.disabled = false;
    }
  }

  function breathe() {
    if (running) return;
    running = true;
    replay.disabled = true;
    measure();
    flames = [];
    embers = [];
    carry = 0;
    startTime = lastTime = performance.now();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => {
    if (running) measure();
  });
  replay.addEventListener('click', breathe);

  // Play once on arrival, after the logo has faded in; skip it for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function start() {
    if (document.hidden) {
      document.addEventListener('visibilitychange', start, { once: true });
      return;
    }
    setTimeout(breathe, 900);
  }

  if (logo.complete) start();
  else logo.addEventListener('load', start, { once: true });
})();
