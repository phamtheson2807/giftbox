(() => {
  const canvas = document.getElementById('galaxy');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    canvas.insertAdjacentHTML('afterend', '<p class="canvas-error">Trình duyệt không hỗ trợ Canvas 2D.</p>');
    return;
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const photoReveal = document.getElementById('photoReveal');
  const lovePhoto = document.getElementById('lovePhoto');
  const photoClose = document.getElementById('photoClose');
  const TAU = Math.PI * 2;
  const lowPowerDevice = innerWidth < 760 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const particleBudget = lowPowerDevice
    ? { heart: 2100, dust: 420, well: 700, rising: 60, background: 130 }
    : { heart: 2700, dust: 680, well: 1050, rising: 85, background: 180 };
  let width, height, dpr, cx, cy, heartScale;
  let rotationY = -0.22;
  let rotationX = -0.06;
  let targetY = rotationY;
  let targetX = rotationX;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let burst = 0;

  const random = (min, max) => min + Math.random() * (max - min);
  const stars = [];
  const dust = [];
  const background = [];
  const wellStars = [];
  const risingStars = [];
  const meteors = [];
  const MESSAGE_KEY = 'giftbox-orbit-messages';
  const PHOTO_KEY = 'giftbox-love-photo';
  const defaultMessages = ['YÊU EM', 'MÃI BÊN NHAU', 'YOU ARE MY UNIVERSE'];
  let orbitMessages = readMessages();
  let wellX, wellY, wellRadius;
  let savedPhoto = readPhoto();
  let lastTap = 0;
  let pointerMoved = false;
  let nextMeteorShower = 1.4;
  let meteorShowerEnds = 0;
  let lastMeteorSpawn = -1;
  let meteorDirection = 1;

  function readMessages() {
    try {
      const saved = JSON.parse(localStorage.getItem(MESSAGE_KEY));
      return Array.isArray(saved) && saved.length ? saved.slice(0, 8) : defaultMessages;
    } catch (_) {
      return defaultMessages;
    }
  }

  function readPhoto() {
    try { return localStorage.getItem(PHOTO_KEY) || ''; }
    catch (_) { return ''; }
  }

  function isInsideHeart(x, y) {
    const dx = (x - cx) / (heartScale * 18);
    const dy = (y - cy) / (heartScale * 19);
    return dx * dx + dy * dy < 1.15;
  }

  function revealPhoto() {
    savedPhoto = readPhoto();
    if (!savedPhoto) return;
    lovePhoto.src = savedPhoto;
    photoReveal.classList.remove('is-open');
    // Restart the burst animation even after repeated reveals.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      photoReveal.classList.add('is-open');
      photoReveal.setAttribute('aria-hidden', 'false');
    }));
  }

  function hidePhoto() {
    photoReveal.classList.remove('is-open');
    photoReveal.setAttribute('aria-hidden', 'true');
  }

  function heartPoint(t, layer) {
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
    const depth = Math.sqrt(Math.max(0, 1 - (x / 17) ** 2)) * layer * 5.2;
    return { x: x * (1 + layer * .025), y: -y, z: depth };
  }

  // Dense heart surface: each particle receives a unique orbit and twinkle rhythm.
  for (let i = 0; i < particleBudget.heart; i++) {
    const t = Math.random() * TAU;
    const layer = random(-1, 1);
    const p = heartPoint(t, layer);
    const fill = Math.sqrt(Math.random());
    stars.push({
      x: p.x * fill + random(-.18, .18),
      y: p.y * fill + random(-.18, .18),
      z: p.z * fill + random(-.6, .6),
      size: random(.35, 1.45),
      phase: random(0, TAU),
      speed: random(.7, 2.1),
      hue: random(322, 353)
    });
  }

  for (let i = 0; i < particleBudget.dust; i++) {
    const arm = i % 3;
    const radius = 20 + Math.pow(Math.random(), .58) * 155;
    const angle = radius * .052 + arm * TAU / 3 + random(-.35, .35);
    dust.push({
      x: Math.cos(angle) * radius,
      y: random(-4, 4) * (radius / 100 + .15),
      z: Math.sin(angle) * radius,
      size: random(.25, 1.1),
      alpha: random(.06, .46),
      hue: Math.random() < .45 ? random(315, 345) : random(225, 270)
    });
  }

  for (let i = 0; i < particleBudget.background; i++) {
    background.push({ x: Math.random(), y: Math.random(), size: random(.2, 1.25), phase: random(0, TAU) });
  }

  // A flattened stellar well below the heart.
  for (let i = 0; i < particleBudget.well; i++) {
    const radius = Math.sqrt(Math.random());
    const angle = Math.random() * TAU;
    wellStars.push({
      radius,
      angle,
      speed: random(.035, .11) * (Math.random() < .5 ? -1 : 1),
      lift: random(-1, 1),
      size: random(.25, 1.2),
      phase: random(0, TAU),
      hue: Math.random() < .78 ? random(330, 355) : random(240, 285)
    });
  }

  for (let i = 0; i < particleBudget.rising; i++) {
    risingStars.push({
      angle: Math.random() * TAU,
      radius: Math.pow(Math.random(), .6),
      progress: Math.random(),
      speed: random(.028, .068),
      curve: random(-1, 1),
      size: random(.45, 1.65),
      phase: random(0, TAU),
      hue: random(325, 355)
    });
  }

  function resize() {
    // 1.5 retains crisp particles without quadrupling work on high-DPI screens.
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    width = innerWidth;
    height = innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = width * .5;
    cy = width > 760 ? height * .3 : height * .25;
    heartScale = Math.min(width > 760 ? width * .018 : width * .025, height * .021);
    wellX = cx;
    wellY = width > 760 ? height * .73 : height * .52;
    wellRadius = Math.min(width > 760 ? width * .2 : width * .42, height * .28);
  }

  function rotate(p, ry, rx) {
    const cosY = Math.cos(ry), sinY = Math.sin(ry);
    const x = p.x * cosY - p.z * sinY;
    const z1 = p.x * sinY + p.z * cosY;
    const cosX = Math.cos(rx), sinX = Math.sin(rx);
    return { x, y: p.y * cosX - z1 * sinX, z: p.y * sinX + z1 * cosX };
  }

  function drawGlow(x, y, radius, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color);
    g.addColorStop(.35, color.replace(/[^,]+\)$/, '0.08)'));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
  }

  function frame(ms) {
    const time = ms / 1000;
    rotationY += (targetY - rotationY) * .045;
    rotationX += (targetX - rotationX) * .045;
    if (!dragging && !reducedMotion) targetY += .00065;
    burst *= .94;

    ctx.fillStyle = '#030108';
    ctx.fillRect(0, 0, width, height);

    for (const s of background) {
      const a = .12 + (Math.sin(time * .8 + s.phase) + 1) * .13;
      ctx.fillStyle = `rgba(220,218,255,${a})`;
      ctx.fillRect(s.x * width, s.y * height, s.size, s.size);
    }

    drawMeteors(time);

    const beatTime = time % 1.48;
    const beat = Math.exp(-Math.pow((beatTime - .08) / .075, 2)) * .075 +
                 Math.exp(-Math.pow((beatTime - .25) / .095, 2)) * .045;
    const pulseScale = 1 + beat + burst * .08;
    drawGlow(cx, cy, heartScale * (23 + burst * 8), 'rgba(217,42,126,0.18)');

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    drawStarWell(time);
    drawRisingStars(time);

    for (const p of dust) {
      const spin = time * .035;
      const r = rotate(p, spin, -.18);
      const perspective = 480 / (540 + r.z);
      const x = cx + r.x * heartScale * .72 * perspective;
      const y = cy + r.y * heartScale * .72 * perspective;
      ctx.fillStyle = `hsla(${p.hue},85%,72%,${p.alpha * perspective})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size * perspective, 0, TAU);
      ctx.fill();
    }

    // Additive particles do not need depth sorting. Drawing directly avoids
    // thousands of temporary objects plus an O(n log n) sort every frame.
    for (const p of stars) {
      const rotated = rotate(p, rotationY, rotationX);
      const perspective = 320 / (340 + rotated.z * heartScale * .17);
      const x = cx + rotated.x * heartScale * pulseScale * perspective;
      const y = cy + rotated.y * heartScale * pulseScale * perspective;
      const twinkle = .38 + (Math.sin(time * p.speed * 3 + p.phase) + 1) * .31;
      const depthLight = .58 + (rotated.z + 10) / 38;
      const radius = p.size * perspective * (1 + burst * .45);
      ctx.fillStyle = `hsla(${p.hue},100%,${72 + twinkle * 20}%,${Math.min(1, twinkle * depthLight)})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fill();
      if (p.size > 1.28 && twinkle > .78) {
        ctx.globalAlpha = twinkle * .5;
        ctx.fillRect(x - radius * 3, y - .25, radius * 6, .5);
        ctx.fillRect(x - .25, y - radius * 3, .5, radius * 6);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();

    drawOrbitMessages(time);

    requestAnimationFrame(frame);
  }

  function drawStarWell(time) {
    drawGlow(wellX, wellY, wellRadius * 1.18, 'rgba(124,35,108,0.12)');
    for (const p of wellStars) {
      const angle = p.angle + time * p.speed * (1.35 - p.radius);
      const perspective = .48 + (Math.sin(angle) + 1) * .26;
      const x = wellX + Math.cos(angle) * p.radius * wellRadius;
      const y = wellY + Math.sin(angle) * p.radius * wellRadius * .32 + p.lift * 3;
      const sparkle = .26 + (Math.sin(time * 2.4 + p.phase) + 1) * .34;
      ctx.fillStyle = `hsla(${p.hue},100%,78%,${sparkle * perspective})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size * perspective, 0, TAU);
      ctx.fill();
    }

    const core = ctx.createRadialGradient(wellX, wellY, 0, wellX, wellY, wellRadius * .58);
    core.addColorStop(0, 'rgba(255,151,197,.16)');
    core.addColorStop(.35, 'rgba(117,40,126,.08)');
    core.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(wellX, wellY, wellRadius * .7, wellRadius * .2, 0, 0, TAU);
    ctx.fill();
  }

  function drawRisingStars(time) {
    for (const p of risingStars) {
      const progress = (p.progress + time * p.speed) % 1;
      // Complete the flight before the particle lifecycle resets. The final
      // portion is intentionally invisible so stars never pile up on the heart.
      const travelProgress = Math.min(1, progress / .86);
      const ease = travelProgress * travelProgress * (3 - 2 * travelProgress);
      const orbitAngle = p.angle + time * (.08 + p.radius * .025);
      const originX = wellX + Math.cos(orbitAngle) * p.radius * wellRadius * .72;
      const originY = wellY + Math.sin(orbitAngle) * p.radius * wellRadius * .2;
      const heartTipY = cy + heartScale * 15.5;
      const destinationX = cx + Math.sin(p.phase) * heartScale * .65;
      const controlX = (originX + destinationX) * .5 + p.curve * wellRadius * .28;
      const controlY = (originY + heartTipY) * .5 - wellRadius * (.12 + p.radius * .12);
      const remain = 1 - ease;
      const x = remain * remain * originX + 2 * remain * ease * controlX + ease * ease * destinationX;
      const y = remain * remain * originY + 2 * remain * ease * controlY + ease * ease * heartTipY;
      const fadeIn = Math.min(1, progress / .1);
      const fadePhase = Math.max(0, Math.min(1, (progress - .58) / .28));
      const fadeOut = 1 - fadePhase * fadePhase * (3 - 2 * fadePhase);
      const alpha = fadeIn * fadeOut * .92;
      const twinkle = .72 + Math.sin(time * 5 + p.phase) * .28;
      const arrivalShrink = 1 - Math.max(0, (progress - .58) / .28) * .72;
      const size = p.size * (1 + ease * .28) * twinkle * Math.max(.18, arrivalShrink);

      // A short curved trail follows the actual flight path instead of the
      // previous vertical "pin" shape.
      if (progress > .035 && progress < .82 && alpha > .06 && p.size > 1) {
        const previousEase = Math.max(0, ease - .035);
        const previousRemain = 1 - previousEase;
        const tailX = previousRemain * previousRemain * originX + 2 * previousRemain * previousEase * controlX + previousEase * previousEase * destinationX;
        const tailY = previousRemain * previousRemain * originY + 2 * previousRemain * previousEase * controlY + previousEase * previousEase * heartTipY;
        ctx.strokeStyle = `hsla(${p.hue},100%,86%,${alpha * .28})`;
        ctx.lineWidth = Math.max(.35, size * .48);
        ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(x, y); ctx.stroke();
      }

      ctx.fillStyle = `hsla(${p.hue},100%,78%,${alpha * .18})`;
      ctx.beginPath();
      ctx.arc(x, y, size * 4.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `hsla(${p.hue},100%,91%,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TAU);
      ctx.fill();

      if (p.size > 1.25 && twinkle > .82) {
        ctx.strokeStyle = `rgba(255,238,247,${alpha * .65})`;
        ctx.lineWidth = .55;
        ctx.beginPath();
        ctx.moveTo(x - size * 3.2, y); ctx.lineTo(x + size * 3.2, y);
        ctx.moveTo(x, y - size * 3.2); ctx.lineTo(x, y + size * 3.2);
        ctx.stroke();
      }
    }
  }

  function drawOrbitMessages(time) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const entries = orbitMessages.map((text, index) => {
      const angle = time * .24 + index * TAU / orbitMessages.length;
      return { text, angle, depth: Math.sin(angle) };
    }).sort((a, b) => a.depth - b.depth);

    for (const item of entries) {
      const x = wellX + Math.cos(item.angle) * wellRadius * .92;
      const y = wellY + Math.sin(item.angle) * wellRadius * .3 - 7;
      const scale = .72 + (item.depth + 1) * .25;
      const alpha = .25 + (item.depth + 1) * .3;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.font = '500 12px "DM Sans", sans-serif';
      ctx.letterSpacing = '2px';
      ctx.shadowColor = 'rgba(255,82,153,.9)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = `rgba(255,230,241,${alpha})`;
      ctx.fillText(item.text, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawMeteors(time) {
    if (!reducedMotion && time >= nextMeteorShower) {
      meteorShowerEnds = time + 2.8;
      nextMeteorShower = time + 10;
      meteorDirection *= -1;
      lastMeteorSpawn = -1;
    }

    const showerActive = !reducedMotion && time < meteorShowerEnds;
    const spawnDelay = lowPowerDevice ? .16 : .1;
    const maxMeteors = lowPowerDevice ? 12 : 20;
    if (showerActive && meteors.length < maxMeteors && (lastMeteorSpawn < 0 || time - lastMeteorSpawn >= spawnDelay)) {
      const speed = random(560, 820);
      const length = random(110, 230);
      const fromLeft = meteorDirection > 0;
      meteors.push({
        x: fromLeft ? -length : width + length,
        y: random(-50, height * .38),
        vx: speed * meteorDirection,
        vy: random(210, 340),
        length,
        width: random(1.2, 2.8),
        born: time,
        ttl: random(1.5, 2.25)
      });
      lastMeteorSpawn = time;
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      const age = time - m.born;
      const frameStep = Math.min(.035, Math.max(0, time - (m.lastFrame || time - 1 / 60)));
      m.lastFrame = time;
      m.x += m.vx * frameStep;
      m.y += m.vy * frameStep;
      const alpha = Math.max(0, Math.min(1, age * 7, (m.ttl - age) * 2.5));
      const velocityLength = Math.hypot(m.vx, m.vy);
      const tailX = m.x - m.vx / velocityLength * m.length;
      const tailY = m.y - m.vy / velocityLength * m.length;
      const gradient = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
      gradient.addColorStop(0, `rgba(255,252,255,${alpha})`);
      gradient.addColorStop(.16, `rgba(255,126,186,${alpha * .88})`);
      gradient.addColorStop(.52, `rgba(183,128,255,${alpha * .38})`);
      gradient.addColorStop(1, 'rgba(123,92,255,0)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = m.width;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tailX, tailY); ctx.stroke();
      ctx.fillStyle = `rgba(255,252,255,${alpha})`;
      ctx.shadowColor = '#ff8fc0';
      ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.width * 1.7, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
      if (age >= m.ttl || m.y > height + 100 || m.x < -m.length * 2 || m.x > width + m.length * 2) meteors.splice(i, 1);
    }
    ctx.restore();
  }

  canvas.addEventListener('pointerdown', e => {
    dragging = true; pointerMoved = false; lastX = e.clientX; lastY = e.clientY; burst = 1;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    if (Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY) > 3) pointerMoved = true;
    targetY += (e.clientX - lastX) * .006;
    targetX = Math.max(-.7, Math.min(.7, targetX + (e.clientY - lastY) * .004));
    lastX = e.clientX; lastY = e.clientY;
  });
  canvas.addEventListener('pointerup', e => {
    dragging = false;
    const now = performance.now();
    if (!pointerMoved && lastTap > 0 && now - lastTap < 360 && isInsideHeart(e.clientX, e.clientY)) {
      revealPhoto();
      lastTap = 0;
    } else {
      lastTap = pointerMoved ? 0 : now;
    }
  });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  photoClose.addEventListener('click', hidePhoto);
  photoReveal.addEventListener('click', e => { if (e.target === photoReveal) hidePhoto(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') hidePhoto(); });

  // Start rendering before optional cross-tab integrations are attached. This
  // keeps the visual experience alive even if a browser blocks storage APIs.
  addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);

  addEventListener('storage', event => {
    if (event.key === MESSAGE_KEY) orbitMessages = readMessages();
    if (event.key === PHOTO_KEY) savedPhoto = readPhoto();
  });
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel('giftbox-admin');
    channel.addEventListener('message', event => {
      if (event.data?.type === 'photo-updated') savedPhoto = readPhoto();
      else orbitMessages = readMessages();
    });
  }
})();
