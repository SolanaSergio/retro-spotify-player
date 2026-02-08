// HIGH QUALITY & RESTORED VISUALIZERS
import { VISUALIZER_THEMES } from './themes';

// --- UTILS ---
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

// Persistent state with specific keys to prevent visualizer crosstalk
const state = {
  bars: new Array(64).fill(0),
  gridOffset: 0,
  fftSmooth: new Array(64).fill(0),
  time: 0,
  // Component specific states
  neon: { offset: 0 },
  liquid: { t: 0 },
  hex: { t: 0 },
  matrix: { history: [] },
  stars: { particles: [] },
  cyber: { z: 0 },
  nebula: { t: 0 },
  circuit: { particles: [] },
  ribbon: { t: 0 },
  scanner: { t: 0 },
  sphere: { t: 0 },
  cube: { t: 0 },
  globe: { t: 0 },
  horizon: { offset: 0, stars: [], time: 0 },
  orb: { particles: [] },
  fireworks: { particles: [] },
  joy: { t: 0 },
  warp: { particles: [] },
  oscilloscope: { t: 0 }
};

// Re-calculated normalization for smoother, less aggressive movement
const getNorm = (data, isPlaying) => {
  if (!isPlaying || !data) {
      return { val: 0, bass: 0, mid: 0, high: 0, beat: 0, pitches: new Array(12).fill(0) };
  }
  
  // Use a lower default sensitivity and cap the multiplier
  const sensitivity = (data.sensitivity || 1.0) * 0.8; 
  
  const l = data.loudness !== undefined ? data.loudness : -60;
  let rawLoudness = Math.max(0, (l + 60) / 60);
  
  // Linear sensitivity is much less "jumpy" than squared
  let loudness = rawLoudness * sensitivity;
  loudness = Math.min(1.2, Math.max(0, loudness));

  const beatIntensity = data.beatIntensity !== undefined ? data.beatIntensity : (data.isBeat ? 1 : 0);
  const beat = Math.min(1, beatIntensity * sensitivity);
  
  const pitches = data.pitches || new Array(12).fill(0);
  
  // Sensitivity applied once to the bands
  const bass = Math.min(1.2, ((pitches[0] + pitches[1] + pitches[2] + pitches[3]) / 4 * loudness));
  const mid = Math.min(1.2, ((pitches[4] + pitches[5] + pitches[6] + pitches[7]) / 4 * loudness));
  const high = Math.min(1.2, ((pitches[8] + pitches[9] + pitches[10] + pitches[11]) / 4 * loudness));

  return { val: loudness, bass, mid, high, beat, pitches };
};

export const Visualizers = {

  // --- RESTORED & SMOOTHED ORIGINALS ---

  neon_city: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    const norm = getNorm(data, isPlaying);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, theme.bg);
    grad.addColorStop(0.5, theme.secondary);
    grad.addColorStop(1, theme.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const sunY = h * 0.3;
    const sunR = h * 0.2 + (norm.bass * 30);
    
    ctx.shadowBlur = 30;
    ctx.shadowColor = theme.primary;
    ctx.fillStyle = ctx.createLinearGradient(0, sunY-sunR, 0, sunY+sunR);
    ctx.fillStyle.addColorStop(0, theme.accent);
    ctx.fillStyle.addColorStop(1, theme.primary);
    ctx.beginPath();
    ctx.arc(w/2, sunY, sunR, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const horizon = h * 0.5;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, horizon, w, h - horizon); ctx.clip();
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, horizon, w, h - horizon);
    ctx.strokeStyle = theme.secondary;
    ctx.lineWidth = 1;

    state.neon.offset = (state.neon.offset + (isPlaying ? 1.5 : 0) + norm.val * 1.5) % 100;
    for (let i = -15; i <= 15; i++) {
       const x = w/2 + i * 80 * (1 + norm.high * 0.5);
       ctx.beginPath(); ctx.moveTo(w/2 + i * 10, horizon); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let i=0; i<20; i++) {
       const prog = (i * 5 + state.neon.offset) % 100 / 100;
       const y = horizon + (h-horizon) * (prog * prog);
       ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.restore();
  },

  liquid: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0,0,w,h);
    const norm = getNorm(data, isPlaying);
    state.liquid.t += 0.01 + norm.val * 0.02;
    const layers = 5;
    const { r, g, b } = hexToRgb(theme.secondary);

    for(let i=0; i<layers; i++) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.2 + i * 0.1})`;
      if (i % 2 === 0) ctx.fillStyle = theme.primary;
      ctx.globalAlpha = 0.5;
      const yBase = h/2 + (i - layers/2) * 40;
      for(let x=0; x<=w; x+=10) {
        const y = yBase + Math.sin(x * 0.01 + state.liquid.t + i) * 40 + Math.sin(x * 0.03 - state.liquid.t * 1.5) * 15 * norm.mid;
        if (x===0) ctx.moveTo(x, h);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  },

  hex_grid: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);
    const norm = getNorm(data, isPlaying);
    const size = 30;
    const dx = size * 3/2; const dy = size * Math.sqrt(3);
    const cols = Math.ceil(w / dx) + 1; const rows = Math.ceil(h / dy) + 1;
    state.hex.t += 0.01 + norm.val * 0.02;

    for (let r=0; r<rows; r++) {
      for (let c=0; c<cols; c++) {
         const x = c * dx; const y = r * dy + (c % 2) * (dy / 2);
         const dist = Math.sqrt((x-w/2)**2 + (y-h/2)**2);
         const wave = Math.sin(dist * 0.01 - state.hex.t * 2 + norm.beat * 1.5);
         const active = wave > 0.6;
         const scale = active ? 0.85 : 0.45;
         ctx.beginPath();
         for (let i=0; i<6; i++) {
            const angle = Math.PI / 3 * i;
            const px = x + Math.cos(angle) * size * scale;
            const py = y + Math.sin(angle) * size * scale;
            if (i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
         }
         ctx.closePath();
         if (active) { ctx.fillStyle = theme.primary; ctx.fill(); }
         else { ctx.strokeStyle = theme.secondary; ctx.stroke(); }
      }
    }
  },

  matrix_3d: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0,0,w,h);
    const norm = getNorm(data, isPlaying);
    const cols = Math.floor(w / 20);
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    if (state.matrix.history.length !== cols) state.matrix.history = new Array(cols).fill(0);
    
    for (let i=0; i<cols; i++) {
       state.matrix.history[i] += 1.5 + Math.random() * 3 + norm.high * 6;
       if (state.matrix.history[i] > h) state.matrix.history[i] = Math.random() * -100;
       const y = state.matrix.history[i];
       const char = String.fromCharCode(0x30A0 + Math.random() * 96);
       const depth = Math.sin(i * 0.2 + Date.now()*0.001);
       const alpha = 0.3 + (depth + 1)/2 * 0.6;
       ctx.fillStyle = theme.primary;
       ctx.globalAlpha = alpha;
       if (norm.beat > 0.8) { ctx.fillStyle = theme.accent; ctx.globalAlpha = 1.0; }
       ctx.fillText(char, i * 20 + 10, y);
       ctx.globalAlpha = 1.0;
    }
  },

  oscilloscope: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);
    const norm = getNorm(data, isPlaying);
    state.oscilloscope.t += 0.02 + norm.val * 0.05;
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15; ctx.shadowColor = theme.primary;
    ctx.beginPath();
    const a = 3 + norm.bass; const b = 2 + norm.mid;
    const scale = Math.min(w,h) * 0.35;
    for (let i=0; i<=Math.PI*2; i+=0.01) {
       const x = w/2 + scale * Math.sin(a * i + state.oscilloscope.t);
       const y = h/2 + scale * Math.sin(b * i);
       if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
  },

  star_warp: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg; ctx.fillRect(0,0,w,h);
    const norm = getNorm(data, isPlaying);
    const cx = w/2; const cy = h/2;
    const speed = (isPlaying ? 2 : 0) + norm.val * 30;
    
    if (state.warp.particles.length < 200) {
        for(let i=0; i<200; i++) state.warp.particles.push({ x: (Math.random()-0.5) * w * 2, y: (Math.random()-0.5) * h * 2, z: Math.random() * 1000 });
    }
    state.warp.particles.forEach(p => {
       p.z -= speed;
       if (p.z <= 1) { p.z = 1000; p.x = (Math.random()-0.5) * w * 2; p.y = (Math.random()-0.5) * h * 2; }
       const k = 128.0 / p.z;
       const px = cx + p.x * k; const py = cy + p.y * k;
       if (px >= 0 && px <= w && py >= 0 && py <= h) {
          const alpha = 1 - p.z / 1000; ctx.globalAlpha = alpha;
          ctx.fillStyle = theme.accent; ctx.fillRect(px, py, (1 - p.z / 1000) * 4, (1 - p.z / 1000) * 4);
          if (speed > 10) {
             ctx.strokeStyle = theme.primary; ctx.beginPath(); ctx.moveTo(px, py);
             ctx.lineTo(cx + (px-cx)*0.9, cy + (py-cy)*0.9); ctx.stroke();
          }
       }
    });
    ctx.globalAlpha = 1.0;
  },

  cyber_run: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, w, h);
    const norm = getNorm(data, isPlaying);
    const cx = w / 2; const cy = h / 2;
    ctx.strokeStyle = theme.secondary; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * w, cy + Math.sin(angle) * w);
    }
    ctx.stroke();
    state.cyber.z = (state.cyber.z + (isPlaying ? 5 : 0) + norm.val * 15) % 200;
    for (let i = 0; i < 10; i++) {
        const z = 200 - ((state.cyber.z + i * 20) % 200);
        const size = (200 / z) * 20;
        if (size > w) continue;
        ctx.strokeStyle = theme.primary; ctx.lineWidth = 2;
        ctx.strokeRect(cx - size, cy - size, size * 2, size * 2);
        if (norm.beat > 0.7 && i % 2 === 0) {
            ctx.fillStyle = theme.accent; ctx.globalAlpha = 0.15;
            ctx.fillRect(cx - size, cy - size, size * 2, size * 2); ctx.globalAlpha = 1.0;
        }
    }
  },

  nebula_cloud: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, w, h);
    const norm = getNorm(data, isPlaying);
    state.nebula.t += 0.001 + norm.val * 0.002;
    ctx.globalCompositeOperation = "screen";
    for(let i=0; i<15; i++) {
        const x = w/2 + Math.cos(state.nebula.t * 0.2 + i) * (w * 0.35);
        const y = h/2 + Math.sin(state.nebula.t * 0.3 + i * 1.5) * (h * 0.3);
        const r = 30 + norm.mid * 80 + Math.abs(Math.sin(i)) * 40;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, i % 2 === 0 ? theme.primary : theme.secondary);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  },

  circuitry: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg; ctx.globalAlpha = 0.15; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1.0;
    const norm = getNorm(data, isPlaying);
    if (state.circuit.particles.length < 40 || (Math.random() < 0.05 && isPlaying)) {
        state.circuit.particles.push({
            x: Math.random() * w, y: Math.random() * h,
            dir: Math.floor(Math.random() * 4), life: 100,
            color: Math.random() > 0.5 ? theme.primary : theme.accent
        });
    }
    ctx.lineWidth = 2;
    state.circuit.particles.forEach((p, idx) => {
        ctx.strokeStyle = p.color; ctx.beginPath(); ctx.moveTo(p.x, p.y);
        const speed = 3 + norm.high * 8;
        if (p.dir === 0) p.y -= speed; else if (p.dir === 1) p.x += speed;
        else if (p.dir === 2) p.y += speed; else p.x -= speed;
        ctx.lineTo(p.x, p.y); ctx.stroke();
        if (Math.random() < 0.1) p.dir = (p.dir + (Math.random() > 0.5 ? 1 : 3)) % 4;
        p.life--;
        if (p.life <= 0 || p.x < 0 || p.x > w || p.y < 0 || p.y > h) state.circuit.particles.splice(idx, 1);
    });
  },

  silk_ribbon: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, w, h);
    const norm = getNorm(data, isPlaying);
    state.ribbon.t += 0.005 + norm.val * 0.01;
    for(let i=0; i<15; i++) {
        ctx.beginPath();
        ctx.strokeStyle = i % 2 === 0 ? theme.primary : theme.secondary;
        ctx.globalAlpha = 0.4;
        for(let x=0; x<=w; x+=15) {
            const y = h/2 + Math.sin(x * 0.01 + state.ribbon.t + i * 0.3) * 80 + Math.sin(x * 0.02 - state.ribbon.t * 1.2) * (30 + norm.bass * 80);
            if (x===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  },

  scanner: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg; ctx.globalAlpha = 0.25; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1.0;
    const norm = getNorm(data, isPlaying);
    state.scanner.t += 0.03 + norm.val * 0.05;
    const pos = (Math.sin(state.scanner.t) + 1) / 2;
    const x = w * 0.1 + pos * (w * 0.8);
    const y = h / 2;
    const size = 20 + norm.val * 40;
    ctx.shadowBlur = 15; ctx.shadowColor = theme.primary;
    ctx.fillStyle = theme.primary; ctx.fillRect(x - size/2, y - 10, size, 20);
    ctx.shadowBlur = 0;
    const bars = 20; const barW = w / bars;
    for(let i=0; i<bars; i++) {
        const val = data.pitches ? data.pitches[i%12] : 0;
        const hVal = val * 40 * norm.val;
        ctx.fillStyle = theme.accent; ctx.fillRect(i * barW, h - hVal - 5, barW - 2, hVal);
    }
  },

  wireframe_sphere: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, w, h);
    const norm = getNorm(data, isPlaying);
    state.sphere.t += 0.01 + norm.val * 0.02;
    const cx = w/2; const cy = h/2; const r = 120 + norm.bass * 40;
    ctx.strokeStyle = theme.primary; ctx.lineWidth = 1;
    for(let lat = -Math.PI/2; lat <= Math.PI/2; lat += 0.3) {
        for(let lon = 0; lon <= Math.PI*2; lon += 0.3) {
             const x3 = r * Math.cos(lat) * Math.cos(lon + state.sphere.t);
             const y3 = r * Math.sin(lat);
             const z3 = r * Math.cos(lat) * Math.sin(lon + state.sphere.t);
             const scale = 300 / (300 + z3);
             const x2 = cx + x3 * scale; const y2 = cy + y3 * scale;
             ctx.fillStyle = theme.accent; if (z3 > 0) ctx.fillRect(x2, y2, 2, 2);
        }
    }
  },

  cube_field: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, w, h);
    const norm = getNorm(data, isPlaying);
    state.cube.t += 0.01 + norm.val * 0.02;
    const size = 40; const cols = Math.ceil(w / size); const rows = Math.ceil(h / size);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cx = x * size + size/2; const cy = y * size + size/2;
            const dist = Math.sqrt((cx - w/2)**2 + (cy - h/2)**2);
            const offset = Math.sin(dist * 0.01 - state.cube.t * 3 + norm.bass);
            const boxScale = 0.15 + (offset + 1) / 2 * 0.7 * (0.6 + norm.val * 0.4);
            ctx.fillStyle = (x + y) % 2 === 0 ? theme.primary : theme.secondary;
            ctx.globalAlpha = boxScale;
            ctx.fillRect(cx - (size*boxScale)/2, cy - (size*boxScale)/2, size*boxScale, size*boxScale);
        }
    }
    ctx.globalAlpha = 1.0;
  },

  globe_wireframe: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, w, h);
    const norm = getNorm(data, isPlaying);
    state.globe.t += 0.01 + norm.val * 0.02;
    const cx = w/2; const cy = h/2; const r = 100 + norm.bass * 25;
    ctx.strokeStyle = theme.primary; ctx.lineWidth = 1.5;
    const rotX = state.globe.t * 0.5; const rotY = state.globe.t * 0.8;
    for (let i = 0; i <= 8; i++) {
        const lat = (i / 8) * Math.PI - Math.PI/2;
        const ringR = Math.cos(lat) * r; const ringY = Math.sin(lat) * r;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.2) {
            const x = Math.cos(a) * ringR; const z = Math.sin(a) * ringR;
            const x2 = x * Math.cos(rotY) - z * Math.sin(rotY); const z2 = x * Math.sin(rotY) + z * Math.cos(rotY);
            const y3 = ringY * Math.cos(rotX) - z2 * Math.sin(rotX);
            if (a === 0) ctx.moveTo(cx + x2, cy + y3); else ctx.lineTo(cx + x2, cy + y3);
        }
        ctx.stroke();
    }
    if (norm.beat > 0.6) {
        ctx.shadowBlur = 20; ctx.fillStyle = theme.accent; ctx.globalAlpha = 0.15;
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1.0; ctx.shadowBlur = 0;
    }
  },

  // --- REWORKED HIGH-QUALITY REPLACEMENTS ---

  retro_grid: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    const norm = getNorm(data, isPlaying);
    state.horizon.time += 0.01 + norm.val * 0.02;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#020010'); grad.addColorStop(0.4, theme.bg);
    grad.addColorStop(0.5, '#400040'); grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    const horizon = h * 0.55; const sunY = horizon * 0.7; const sunR = h * 0.22;
    ctx.save();
    ctx.shadowBlur = 40 + norm.bass * 30; ctx.shadowColor = theme.primary;
    const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
    sunGrad.addColorStop(0, theme.accent); sunGrad.addColorStop(1, theme.primary);
    ctx.fillStyle = sunGrad; ctx.beginPath(); ctx.arc(w/2, sunY, sunR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    for(let i=0; i<8; i++) {
        ctx.fillStyle = `rgba(0,0,0,0.4)`; ctx.fillRect(w/2 - sunR, sunY + (i/8) * sunR, sunR*2, 3 + i * 2);
    }
    ctx.save(); ctx.beginPath(); ctx.rect(0, horizon, w, h-horizon); ctx.clip();
    ctx.strokeStyle = theme.secondary; ctx.lineWidth = 2;
    state.horizon.offset = (state.horizon.offset + (isPlaying ? 2 : 0) + norm.val * 3) % 200;
    for(let i = -20; i <= 20; i++) {
        ctx.beginPath(); ctx.moveTo(w/2 + i * 20, horizon); ctx.lineTo(w/2 + i * 150, h * 2); ctx.stroke();
    }
    for(let i=0; i<30; i++) {
        const depth = ((i * 10 + state.horizon.offset) % 300) / 300;
        if (depth < 0.05) continue;
        const y = horizon + (h - horizon) * Math.pow(depth, 3);
        ctx.globalAlpha = depth; ctx.lineWidth = 1 + depth * 2;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.restore();
  },

  black_hole: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg; ctx.fillRect(0,0,w,h);
    const norm = getNorm(data, isPlaying);
    const cx = w/2; const cy = h/2;
    if (state.orb.particles.length === 0) {
        for(let i=0; i<400; i++) {
            state.orb.particles.push({ theta: Math.random() * Math.PI * 2, phi: Math.acos(Math.random() * 2 - 1), color: Math.random() > 0.5 ? theme.primary : theme.secondary });
        }
    }
    ctx.globalCompositeOperation = 'screen';
    const baseRadius = 100 + norm.bass * 35;
    state.orb.particles.forEach(p => {
        p.theta += 0.005 + norm.val * 0.01; p.phi += 0.003;
        const r = baseRadius + Math.sin(p.theta * 4) * (norm.mid * 40) + (norm.beat * 15);
        const x3 = r * Math.sin(p.phi) * Math.cos(p.theta);
        const y3 = r * Math.sin(p.phi) * Math.sin(p.theta);
        const z3 = r * Math.cos(p.phi);
        const scale = 250 / (250 + z3);
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0.1, scale - 0.4);
        ctx.beginPath(); ctx.arc(cx + x3 * scale, cy + y3 * scale, (2 + norm.high * 4) * scale, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1.0;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius);
    grad.addColorStop(0, theme.accent); grad.addColorStop(0.6, `rgba(0,0,0,0)`);
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, baseRadius, 0, Math.PI*2); ctx.fill();
  },

  spectrum_pro: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, w, h);
    const norm = getNorm(data, isPlaying);
    const bars = 32; const margin = 4; const barWidth = (w - (bars * margin)) / bars;
    for(let i=0; i<bars; i++) {
        const target = (data.pitches ? data.pitches[Math.floor((i/bars)*12)] : 0) * norm.val;
        state.fftSmooth[i] = lerp(state.fftSmooth[i] || 0, target, 0.15);
        const x = i * (barWidth + margin) + margin/2; const barHeight = Math.max(4, state.fftSmooth[i] * h * 0.7);
        const grad = ctx.createLinearGradient(0, h, 0, h - barHeight);
        grad.addColorStop(0, theme.secondary); grad.addColorStop(1, theme.primary);
        ctx.fillStyle = grad; ctx.fillRect(x, h - barHeight, barWidth, barHeight);
        ctx.fillStyle = theme.accent; ctx.fillRect(x, h - barHeight - 4, barWidth, 2);
    }
  },

  fireworks: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
     // Ensure state exists
     if (!state.fireworks) state.fireworks = { particles: [] };
     
     // Fade background for trails
     ctx.fillStyle = theme.bg;
     ctx.globalAlpha = 0.2;
     ctx.fillRect(0, 0, w, h);
     ctx.globalAlpha = 1.0;

     const norm = getNorm(data, isPlaying);

     // Launch on beat OR high volume peaks
     if ((norm.beat > 0.5 || (norm.val > 0.8 && Math.random() < 0.1)) && isPlaying) {
         const cx = Math.random() * w;
         const cy = Math.random() * h * 0.5;
         const color = Math.random() > 0.5 ? theme.primary : theme.accent;
         
         for(let i=0; i<30; i++) {
             const angle = Math.random() * Math.PI * 2;
             const vel = 1 + Math.random() * 5 * norm.val;
             state.fireworks.particles.push({
                 x: cx, y: cy,
                 vx: Math.cos(angle) * vel,
                 vy: Math.sin(angle) * vel,
                 life: 1.0,
                 decay: 0.01 + Math.random() * 0.02,
                 color: color
             });
         }
     }

     // Physics update loop
     state.fireworks.particles = state.fireworks.particles.filter(p => {
         p.x += p.vx;
         p.y += p.vy;
         p.vy += 0.05; // Gravity
         p.vx *= 0.97; // Drag
         p.vy *= 0.97;
         p.life -= p.decay;

         if (p.life > 0) {
             ctx.globalAlpha = p.life;
             ctx.fillStyle = p.color;
             ctx.fillRect(p.x, p.y, 2, 2);
             return true;
         }
         return false;
     });
     ctx.globalAlpha = 1.0;
  },

  ascii: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);
    
    const norm = getNorm(data, isPlaying);
    const cols = 50; 
    const rows = 28;
    const cellW = w / cols;
    const cellH = h / rows;
    
    // Character ramp for smooth shading
    const chars = " .:-=+*#%@";
    
    ctx.font = `${Math.floor(cellH * 1.15)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Very slow, consistent time variable for "majestic" flow
    const t = Date.now() * 0.0005;
    
    for (let y = 0; y < rows; y++) {
        const ny = y / rows;
        for (let x = 0; x < cols; x++) {
            const nx = x / cols;
            
            // "Digital Ocean" Interference Pattern
            // Wave 1: Slow, large diagonal swell
            const w1 = Math.sin(nx * 3 + ny * 3 + t);
            
            // Wave 2: Faster, crossing ripple
            const w2 = Math.cos(nx * 7 - ny * 7 + t * 1.5);
            
            // Wave 3: Audio reactive detail (Bass swells the overall height)
            const amp = 0.5 + (norm.bass * 0.6); 
            
            // Combine waves
            let val = (w1 + w2) * 0.5 * amp;
            
            // Map -1..1 to 0..1
            val = (val + 1) / 2;
            
            // Sharpen peaks (makes it look more like liquid)
            val = Math.pow(val, 1.2);
            
            // Map to characters
            const charIdx = Math.floor(Math.max(0, Math.min(1, val)) * (chars.length - 1));
            const char = chars[charIdx];
            
            // Color Logic
            // Peaks are bright/accent, troughs are dark/secondary
            if (val > 0.8) {
                ctx.fillStyle = theme.accent;
                ctx.globalAlpha = 1.0;
            } else if (val > 0.5) {
                ctx.fillStyle = theme.primary;
                ctx.globalAlpha = 0.8;
            } else {
                ctx.fillStyle = theme.secondary;
                ctx.globalAlpha = 0.4; // Fade out the deep parts
            }
            
            ctx.fillText(char, x * cellW + cellW/2, y * cellH + cellH/2);
        }
    }
    ctx.globalAlpha = 1.0;
  },

  simple_wave: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg; ctx.fillRect(0,0,w,h);
    const norm = getNorm(data, isPlaying);
    state.joy.t += 0.015 + norm.val * 0.025;
    const lines = 35; const lineSpacing = h / (lines + 8);
    ctx.lineWidth = 2; ctx.strokeStyle = theme.primary; ctx.fillStyle = theme.bg;
    for(let i=0; i<lines; i++) {
        ctx.beginPath();
        const yBase = (h * 0.15) + i * lineSpacing;
        const amplitude = 40 * norm.val;
        for(let x=0; x<=w; x+=10) {
            const bell = Math.exp(-Math.pow(Math.abs(x - w/2) / (w*0.22), 2));
            const yOffset = bell * (Math.sin(x * 0.05 + state.joy.t + i * 0.2) * 20 + amplitude * Math.sin(x * 0.08 - state.joy.t));
            if (x===0) ctx.moveTo(x, yBase - Math.abs(yOffset)); else ctx.lineTo(x, yBase - Math.abs(yOffset));
        }
        ctx.fill(); ctx.stroke();
    }
  },

  tunnel: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg; ctx.fillRect(0,0,w,h);
    const norm = getNorm(data, isPlaying);
    const cx = w/2; const cy = h/2;
    if (state.warp.particles.length < 300) {
        for(let i=0; i<300; i++) state.warp.particles.push({ x: (Math.random()-0.5) * w * 3, y: (Math.random()-0.5) * h * 3, z: Math.random() * 2000, pz: 0 });
    }
    const warpSpeed = (isPlaying ? 15 : 0) + (norm.val * 120);
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    state.warp.particles.forEach(p => {
        p.pz = p.z; p.z -= warpSpeed;
        if (p.z <= 1) { p.z = 2000; p.pz = 2000; p.x = (Math.random()-0.5) * w * 3; p.y = (Math.random()-0.5) * h * 3; }
        const x1 = cx + (p.x / p.z) * 400; const y1 = cy + (p.y / p.z) * 400;
        const x2 = cx + (p.x / p.pz) * 400; const y2 = cy + (p.y / p.pz) * 400;
        if (x1 < 0 || x1 > w || y1 < 0 || y1 > h) return;
        ctx.strokeStyle = norm.beat > 0.6 ? theme.accent : theme.primary;
        ctx.globalAlpha = Math.min(1, Math.sqrt((x1-cx)**2 + (y1-cy)**2) / 150);
        ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x1, y1); ctx.stroke();
    });
    ctx.globalAlpha = 1.0;
  },

  oscilloscope_pro: (ctx, w, h, data, isPlaying, theme = VISUALIZER_THEMES.retro_wave) => {
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0,0,w,h);
    const norm = getNorm(data, isPlaying);
    const t = Date.now() * 0.002;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1; ctx.beginPath();
    for(let x=0; x<w; x+=50) { ctx.moveTo(x,0); ctx.lineTo(x,h); }
    for(let y=0; y<h; y+=50) { ctx.moveTo(0,y); ctx.lineTo(w,y); }
    ctx.stroke();
    ctx.shadowBlur = 15; ctx.shadowColor = theme.primary;
    ctx.lineWidth = 3; ctx.strokeStyle = theme.primary;
    ctx.beginPath();
    const amplitude = (h/3) * norm.val;
    const freq = 0.05 + norm.bass * 0.05;
    for(let x = 0; x < w; x+=2) {
        let y = h/2 + Math.sin(x * freq + t * 5) * amplitude;
        y += Math.sin(x * 0.2 - t * 10) * (amplitude * 0.3 * norm.high);
        if(x===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
  }
};