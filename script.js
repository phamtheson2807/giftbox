(() => {
  const canvas = document.getElementById('galaxy');
  const ctx = canvas.getContext('2d', { alpha: false });
  const button = document.getElementById('loveButton');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
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

  function heartPoint(t, layer) {
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
    const depth = Math.sqrt(Math.max(0, 1 - (x / 17) ** 2)) * layer * 5.2;
    return { x: x * (1 + layer * .025), y: -y, z: depth };
  }

  // Dense heart surface: each particle receives a unique orbit and twinkle rhythm.
  for (let i = 0; i < 3200; i++) {
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

  for (let i = 0; i < 1150; i++) {
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

  for (let i = 0; i < 220; i++) {
    background.push({ x: Math.random(), y: Math.random(), size: random(.2, 1.25), phase: random(0, TAU) });
  }

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth;
    height = innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = width > 760 ? width * .72 : width * .5;
    cy = width > 760 ? height * .47 : height * .33;
    heartScale = Math.min(width > 760 ? width * .019 : width * .025, height * .026);
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

    const beatTime = time % 1.48;
    const beat = Math.exp(-Math.pow((beatTime - .08) / .075, 2)) * .075 +
                 Math.exp(-Math.pow((beatTime - .25) / .095, 2)) * .045;
    const pulseScale = 1 + beat + burst * .08;
    drawGlow(cx, cy, heartScale * (23 + burst * 8), 'rgba(217,42,126,0.18)');

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

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

    const projected = stars.map(p => ({ ...p, r: rotate(p, rotationY, rotationX) }))
      .sort((a, b) => a.r.z - b.r.z);

    for (const p of projected) {
      const perspective = 320 / (340 + p.r.z * heartScale * .17);
      const x = cx + p.r.x * heartScale * pulseScale * perspective;
      const y = cy + p.r.y * heartScale * pulseScale * perspective;
      const twinkle = .38 + (Math.sin(time * p.speed * 3 + p.phase) + 1) * .31;
      const depthLight = .58 + (p.r.z + 10) / 38;
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

    requestAnimationFrame(frame);
  }

  canvas.addEventListener('pointerdown', e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    targetY += (e.clientX - lastX) * .006;
    targetX = Math.max(-.7, Math.min(.7, targetX + (e.clientY - lastY) * .004));
    lastX = e.clientX; lastY = e.clientY;
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });

  button.addEventListener('click', () => {
    burst = 1;
    button.querySelector('span:last-child').textContent = 'Yêu em, đến vô cùng';
    setTimeout(() => { button.querySelector('span:last-child').textContent = 'Chạm vào trái tim'; }, 2200);
  });

  addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
