// Звук и музыка на Web Audio API: готовых файлов не нужно, звуки генерируются кодом
const Sound = (() => {
  let ctx = null, sfx = 0.5, mus = 0.3, step = 0;
  const notes = [220, 261.6, 329.6, 392, 329.6, 261.6];   // простая музыка: повторяющееся арпеджио

  function tone(freq, dur, type, vol) {
    if (!ctx || vol <= 0) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  }

  return {
    // Браузер разрешает звук только после действия игрока, поэтому вызываем при первом нажатии клавиши
    init() {
      if (ctx) return;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      setInterval(() => tone(notes[step++ % notes.length], 0.5, 'triangle', mus * 0.15), 450);
    },
    setVolumes(s, m) { sfx = s / 100; mus = m / 100; },
    block() { tone(660, 0.12, 'square', sfx * 0.2); },
    hit() { tone(110, 0.6, 'sawtooth', sfx * 0.3); }
  };
})();
