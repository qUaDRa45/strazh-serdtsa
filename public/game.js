// Игровой движок: поле, снаряды, щит, скорость, счёт. Рисует на canvas.
const Game = (() => {
  const SIZE = 480, C = SIZE / 2;        // размер поля и координаты сердца (центр)
  const SHIELD_R = 44, BALL_R = 11;      // радиус дуги щита и снаряда
  const START_D = C;                     // снаряд появляется на краю поля: 240 px от сердца
  const GAP = 220;                       // расстояние между соседними снарядами, px
  const HIT_D = SHIELD_R + 4 + BALL_R;   // на таком расстоянии снаряд встречает щит
  const HEART_D = 18;                    // на таком расстоянии снаряд попадает в сердце
  const V0 = 200, DV = 5, VMAX = 800;    // скорость: v(t) = min(200 + 5*t, 800) px/с
  const ANGLE = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];   // стороны: 0 вверх, 1 вправо, 2 вниз, 3 влево

  let ctx, cb = {}, state = 'idle';      // idle | countdown | running | paused | over
  let balls, shield, score, time, sinceSpawn, countdown, flash, last;

  const speed = () => Math.min(V0 + DV * time, VMAX);

  function reset() { balls = []; shield = 0; score = 0; time = 0; sinceSpawn = GAP; countdown = 0; flash = 0; }

  function init(canvas, callbacks) {
    ctx = canvas.getContext('2d'); cb = callbacks; reset(); last = performance.now();
    requestAnimationFrame(frame);
  }

  function start() { reset(); countdown = 3; state = 'countdown'; }
  function stop() { reset(); state = 'idle'; }
  function pause() { if (state === 'running' || state === 'countdown') state = 'paused'; }
  function resume() { if (state === 'paused') { countdown = 3; state = 'countdown'; } }   // после паузы снова отсчёт 3, 2, 1
  function setShield(side) { if (state === 'running' || state === 'countdown') shield = side; }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (state === 'countdown') { countdown -= dt; if (countdown <= 0) state = 'running'; }
    else if (state === 'running') update(dt);
    if (flash > 0) flash -= dt;
    draw();
    requestAnimationFrame(frame);
  }

  function update(dt) {
    time += dt;
    const step = speed() * dt;
    for (const b of balls) b.d -= step;               // все снаряды летят с одной скоростью
    sinceSpawn += step;
    while (sinceSpawn >= GAP) {                       // постоянное расстояние между снарядами
      sinceSpawn -= GAP;
      balls.push({ side: Math.floor(Math.random() * 4), d: START_D - sinceSpawn });
    }
    for (const b of balls) {
      if (!b.checked && b.d <= HIT_D) {               // снаряд достиг щита
        b.checked = true;
        if (b.side === shield) { b.dead = true; score++; flash = 0.12; if (cb.onBlock) cb.onBlock(); }
        else b.missed = true;                         // щит стоит не там — снаряд летит в сердце
      }
      if (b.missed && b.d <= HEART_D) { state = 'over'; if (cb.onOver) cb.onOver(score, Math.floor(time)); return; }
    }
    balls = balls.filter(b => !b.dead);
    if (cb.onHud) cb.onHud(score, time, speed(), VMAX);
  }

  function heart(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.4, y - s * 0.2, x - s * 0.7, y - s * 1.3, x, y - s * 0.5);
    ctx.bezierCurveTo(x + s * 0.7, y - s * 1.3, x + s * 1.4, y - s * 0.2, x, y + s * 0.9);
    ctx.fill();
  }

  function draw() {
    ctx.fillStyle = '#16132a'; ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.strokeStyle = 'rgba(62,224,208,.5)'; ctx.lineWidth = 2; ctx.strokeRect(3, 3, SIZE - 6, SIZE - 6);
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 1;   // направляющие
    ctx.beginPath(); ctx.moveTo(C, 4); ctx.lineTo(C, SIZE - 4); ctx.moveTo(4, C); ctx.lineTo(SIZE - 4, C); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#3ee0d0';                        // снаряды со следом
    for (const b of balls) {
      const a = ANGLE[b.side], cos = Math.cos(a), sin = Math.sin(a);
      [[0, 1, BALL_R], [22, .35, 9], [44, .2, 7]].forEach(([off, alpha, r]) => {
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(C + cos * (b.d + off), C + sin * (b.d + off), r, 0, Math.PI * 2); ctx.fill();
      });
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = flash > 0 ? '#ffffff' : '#3ee0d0'; // щит — дуга 90° вокруг сердца
    ctx.lineWidth = flash > 0 ? 12 : 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(C, C, SHIELD_R, ANGLE[shield] - Math.PI / 4, ANGLE[shield] + Math.PI / 4); ctx.stroke();

    ctx.fillStyle = state === 'over' ? '#7a2030' : '#ff3b4e'; heart(C, C, 14);

    if (state === 'countdown') {
      ctx.fillStyle = '#fff'; ctx.font = '700 96px system-ui, Arial'; ctx.textAlign = 'center';
      ctx.fillText(Math.ceil(countdown), C, 120);
    }
  }

  return { init, start, stop, pause, resume, setShield, get state() { return state; } };
})();
