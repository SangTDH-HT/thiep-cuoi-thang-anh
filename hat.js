// Hạt bay phủ toàn trang: hạt bồ công anh, vụn nhũ vàng, sao lấp lánh, tim nhỏ, pháo hoa kim tuyến.
// Vẽ bằng canvas 2D, mọi hình vẽ sẵn thành ảnh nhỏ (sprite) để điện thoại yếu vẫn mượt.
(function () {
  'use strict';

  const cv = document.getElementById('hat');
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!cv || giam) {
    window.HatBay = { bung() {}, thoi() {}, phao() {}, tim() {}, sao() {}, nguon() {}, chay() {} };
    return;
  }
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1;
  const dienThoai = matchMedia('(max-width: 640px)').matches;

  function doiCo() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  }
  doiCo();
  let henDoi = 0;
  addEventListener('resize', () => { clearTimeout(henDoi); henDoi = setTimeout(doiCo, 120); });

  // ---------- Sprite ----------
  const SPR = 2; // vẽ sprite gấp đôi cho nét
  function taoCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w * SPR; c.height = h * SPR;
    const g = c.getContext('2d'); g.scale(SPR, SPR);
    return [c, g];
  }
  function ngauNhien(seed) {
    return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }

  // Hạt bồ công anh: chùm lông tơ, cuống mảnh, hạt nâu
  function veHat(seed) {
    const R = ngauNhien(seed);
    const [c, g] = taoCanvas(64, 72);
    const cx = 32, cy = 24;
    g.lineCap = 'round';
    for (let i = 0; i < 24; i++) {
      const a = Math.PI * (1.02 + 0.96 * (i / 23)) + (R() - 0.5) * 0.08;
      const L = 16 + R() * 5;
      const ex = cx + Math.cos(a) * L, ey = cy + Math.sin(a) * L * 0.92;
      g.strokeStyle = `rgba(160,130,84,${0.5 + R() * 0.35})`;
      g.lineWidth = 0.55;
      g.beginPath(); g.moveTo(cx, cy);
      g.quadraticCurveTo(cx + Math.cos(a) * L * 0.55 + Math.cos(a + 1.57) * 1.3, cy + Math.sin(a) * L * 0.5, ex, ey);
      g.stroke();
      g.strokeStyle = 'rgba(185,158,110,.5)'; g.lineWidth = 0.35;
      for (let j = -1; j <= 1; j++) {
        const b = a + j * 0.28;
        g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex + Math.cos(b) * 4, ey + Math.sin(b) * 4); g.stroke();
      }
    }
    g.strokeStyle = 'rgba(125,96,62,.9)'; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 0.6, cy + 24); g.stroke();
    const gr = g.createLinearGradient(cx - 2, 0, cx + 2, 0);
    gr.addColorStop(0, '#6A4A2C'); gr.addColorStop(0.5, '#A57E52'); gr.addColorStop(1, '#6A4A2C');
    g.fillStyle = gr;
    g.beginPath(); g.ellipse(cx + 0.6, cy + 30, 1.6, 6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(140,110,70,.95)';
    g.beginPath(); g.arc(cx, cy, 1.1, 0, 7); g.fill();
    return c;
  }

  // Vụn nhũ vàng: mảnh đa giác dát vàng
  function veVun(seed) {
    const R = ngauNhien(seed);
    const [c, g] = taoCanvas(24, 24);
    const n = 3 + Math.floor(R() * 3);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + R() * 0.8;
      const r = 5 + R() * 5;
      pts.push([12 + Math.cos(a) * r, 12 + Math.sin(a) * r]);
    }
    const gr = g.createLinearGradient(3, 3, 21, 21);
    gr.addColorStop(0, '#7E5F33'); gr.addColorStop(0.35, '#D6B57A');
    gr.addColorStop(0.5, '#F7E9C4'); gr.addColorStop(0.65, '#B8925A'); gr.addColorStop(1, '#7A5A30');
    g.fillStyle = gr;
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,246,222,.85)'; g.lineWidth = 0.6;
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); g.lineTo(pts[1][0], pts[1][1]); g.stroke();
    return c;
  }

  // Sao lấp lánh bốn cánh
  function veSao(mau) {
    const [c, g] = taoCanvas(48, 48);
    g.translate(24, 24);
    const rg = g.createRadialGradient(0, 0, 0, 0, 0, 11);
    rg.addColorStop(0, 'rgba(255,250,232,1)'); rg.addColorStop(0.35, mau + '99'); rg.addColorStop(1, mau + '00');
    g.fillStyle = rg; g.beginPath(); g.arc(0, 0, 11, 0, 7); g.fill();
    const canh = (dai, rong, style) => {
      g.fillStyle = style;
      for (let i = 0; i < 4; i++) {
        g.save(); g.rotate(i * Math.PI / 2);
        g.beginPath(); g.moveTo(0, -dai); g.quadraticCurveTo(rong, 0, 0, dai); g.quadraticCurveTo(-rong, 0, 0, -dai); g.fill();
        g.restore();
      }
    };
    canh(22, 2.2, mau);
    canh(11, 1.2, '#FFFBEF');
    return c;
  }

  // Tim nhỏ
  function veTim(a, b) {
    const [c, g] = taoCanvas(28, 26);
    g.translate(14, 13);
    const gr = g.createRadialGradient(-3, -4, 1, 0, 0, 14);
    gr.addColorStop(0, a); gr.addColorStop(1, b);
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(0, 9);
    g.bezierCurveTo(-12, 1, -11, -10, -5, -10);
    g.bezierCurveTo(-2, -10, 0, -7, 0, -5);
    g.bezierCurveTo(0, -7, 2, -10, 5, -10);
    g.bezierCurveTo(11, -10, 12, 1, 0, 9);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)';
    g.beginPath(); g.ellipse(-5, -5, 2.4, 1.4, -0.6, 0, 7); g.fill();
    return c;
  }

  const SP = {
    hat: [veHat(11), veHat(29), veHat(47)],
    vun: [veVun(3), veVun(8), veVun(15), veVun(21), veVun(34)],
    sao: [veSao('#D2A95C'), veSao('#E7B8A8')],
    tim: [veTim('#E07A70', '#A8352F'), veTim('#F0D9A6', '#B08A52')]
  };

  // ---------- Hạt ----------
  const P = [];
  const MAX = dienThoai ? 260 : 380;
  const NEN = { hat: dienThoai ? 6 : 10, vun: dienThoai ? 14 : 22 };
  let t = 0, cuon = 0, scrollCu = scrollY;
  let chayNen = false;
  let manDem = 0; // 0..1, khi bắn pháo hoa nền tối dần

  let dangCapNhat = false;
  const cho = [];
  function them(p) {
    if (dangCapNhat) { cho.push(p); return; }
    if (P.length >= MAX) {
      const i = P.findIndex(q => !q.nen);
      if (i < 0) return;
      P.splice(i, 1);
    }
    P.push(p);
  }
  const r = (a, b) => a + Math.random() * (b - a);

  function hatNen(dauTien) {
    const z = r(0.7, 1.25);
    const tuTrai = !dauTien && Math.random() < 0.5;
    return {
      loai: 'hat', nen: true, z, s: 0.36 * z, sp: SP.hat[(Math.random() * 3) | 0],
      x: dauTien ? r(0, W) : tuTrai ? -50 : r(-60, W * 0.7), y: dauTien ? r(0, H) : tuTrai ? r(0, H * 0.8) : -50,
      vx: 12, vy: 6, ph: r(0, 6.28), k: 0.9, a: r(0.65, 0.95)
    };
  }
  function vunNen(dauTien) {
    const z = r(0.6, 1.3);
    return {
      loai: 'vun', nen: true, z, s: 0.5 * z, sp: SP.vun[(Math.random() * 5) | 0],
      x: r(0, W), y: dauTien ? r(0, H) : r(-40, -10),
      vx: 0, vy: 14, ph: r(0, 6.28), xoay: r(0, 6.28), quay: r(1.5, 4), k: 1, a: r(0.7, 1)
    };
  }

  function gio(y, ph) {
    return 16 + 12 * Math.sin(t * 0.23 + y * 0.004 + ph) + 6 * Math.sin(t * 0.61 + ph * 2);
  }

  function capNhat(dt) {
    dangCapNhat = true;
    const dy = scrollY - scrollCu; scrollCu = scrollY;
    cuon = dy;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      if (p.loai === 'hat' || p.loai === 'vun') {
        const z = p.z;
        let tvx, tvy;
        if (p.loai === 'hat') { tvx = gio(p.y, p.ph) * z; tvy = (6 + 9 * Math.sin(t * 0.55 + p.ph)) * z; }
        else { tvx = gio(p.y, p.ph) * 0.45 * z; tvy = (18 + 8 * Math.sin(t * 0.8 + p.ph)) * z; }
        const k = Math.min(1, dt * p.k);
        p.vx += (tvx - p.vx) * k; p.vy += (tvy - p.vy) * k;
        if (p.k > 0.9) p.k = Math.max(0.9, p.k - dt * 0.9);
        p.x += p.vx * dt; p.y += p.vy * dt - cuon * 0.35 * z;
        if (p.loai === 'vun') p.xoay += dt * p.quay * 0.3;
        if (p.song) { p.song -= dt; if (p.song <= 0) p.a -= dt * 1.5; if (p.a <= 0) { P.splice(i, 1); continue; } }
        if (p.x > W + 70 || p.y > H + 90 || p.y < -160 || p.x < -160) {
          if (p.nen) P[i] = p.loai === 'hat' ? hatNen(false) : vunNen(false);
          else P.splice(i, 1);
        }
      } else if (p.loai === 'sao' || p.loai === 'tim') {
        p.song += dt;
        if (p.song >= p.max) { P.splice(i, 1); continue; }
        p.vx *= Math.pow(0.35, dt); p.vy = p.vy * Math.pow(0.5, dt) + (p.loai === 'tim' ? -26 : 0) * dt;
        p.x += p.vx * dt + (p.loai === 'tim' ? Math.sin(p.song * 3 + p.ph) * 0.4 : 0);
        p.y += p.vy * dt - cuon * 0.3;
      } else if (p.loai === 'phao') {
        p.song += dt;
        if (p.song >= p.max) { P.splice(i, 1); continue; }
        p.px = p.x; p.py = p.y;
        const keo = Math.pow(p.can, dt);
        p.vx *= keo; p.vy = p.vy * keo + 70 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
      } else if (p.loai === 'ten') {
        p.song += dt;
        p.px = p.x; p.py = p.y;
        p.vy += 260 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (Math.random() < 0.6) them({ loai: 'phao', x: p.x, y: p.y, px: p.x, py: p.y, vx: r(-20, 20), vy: r(10, 50), song: 0, max: r(0.3, 0.6), can: 0.3, mau: '#F3D9A0', w: 1 });
        if (p.vy >= -30 || p.song > 2) { P.splice(i, 1); no(p.x, p.y, p.kieu); }
      }
    }
    dangCapNhat = false;
    while (cho.length) them(cho.shift());
    // Giữ đủ hạt nền
    if (chayNen) {
      let soHat = 0, soVun = 0;
      for (const p of P) if (p.nen) p.loai === 'hat' ? soHat++ : soVun++;
      if (soHat < NEN.hat && Math.random() < dt * 2) them(hatNen(false));
      if (soVun < NEN.vun && Math.random() < dt * 4) them(vunNen(false));
    }
  }

  function ve() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const p of P) {
      if (p.loai === 'hat') {
        const goc = 0.32 * Math.sin(t * 0.8 + p.ph) + p.vx * 0.004;
        const s = p.s * DPR, c = Math.cos(goc) * s, si = Math.sin(goc) * s;
        ctx.globalAlpha = Math.max(0, p.a);
        ctx.setTransform(c, si, -si, c, p.x * DPR, p.y * DPR);
        ctx.drawImage(p.sp, -32, -24, 64, 72);
      } else if (p.loai === 'vun') {
        const lat = Math.cos(t * p.quay + p.ph);
        const s = p.s * DPR, c = Math.cos(p.xoay), si = Math.sin(p.xoay);
        ctx.globalAlpha = Math.max(0, p.a) * (0.55 + 0.45 * Math.abs(lat));
        ctx.setTransform(c * s * lat, si * s * lat, -si * s, c * s, p.x * DPR, p.y * DPR);
        ctx.drawImage(p.sp, -12, -12, 24, 24);
        const loe = Math.abs(lat);
        if (loe > 0.94) {
          const k = (loe - 0.94) / 0.06 * p.z * 0.55 * DPR;
          ctx.globalAlpha = Math.max(0, p.a) * 0.9;
          ctx.setTransform(k, 0, 0, k, p.x * DPR, p.y * DPR);
          ctx.drawImage(SP.sao[0], -24, -24, 48, 48);
        }
      } else if (p.loai === 'sao') {
        if (p.song < 0) continue;
        const u = p.song / p.max;
        const k = Math.sin(Math.PI * u) * p.s * DPR;
        const goc = p.ph + u * 1.2;
        ctx.globalAlpha = 1;
        ctx.setTransform(Math.cos(goc) * k, Math.sin(goc) * k, -Math.sin(goc) * k, Math.cos(goc) * k, p.x * DPR, p.y * DPR);
        ctx.drawImage(p.sp, -24, -24, 48, 48);
      } else if (p.loai === 'tim') {
        if (p.song < 0) continue;
        const u = p.song / p.max;
        const k = p.s * DPR * Math.min(1, u * 6);
        ctx.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1;
        ctx.setTransform(k, 0, 0, k, p.x * DPR, p.y * DPR);
        ctx.drawImage(p.sp, -14, -13, 28, 26);
      }
    }
    // Pháo hoa: vệt sáng, cộng màu khi nền tối
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalCompositeOperation = manDem > 0.2 ? 'lighter' : 'source-over';
    ctx.lineCap = 'round';
    const toi = manDem > 0.2;
    for (const p of P) {
      if (p.loai !== 'phao' && p.loai !== 'ten') continue;
      const u = p.song / p.max;
      const a = p.loai === 'ten' ? 1 : Math.max(0, 1 - u * u) * (0.7 + 0.3 * Math.sin(p.song * 38 + p.x));
      const k = p.loai === 'ten' ? 0.05 : 0.07;
      const x0 = p.x - p.vx * k, y0 = p.y - p.vy * k;
      ctx.strokeStyle = p.mau;
      if (toi) {
        ctx.globalAlpha = a * 0.22;
        ctx.lineWidth = (p.w || 1.6) * 3.6;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      ctx.globalAlpha = a;
      ctx.lineWidth = p.w || 1.6;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  let truoc = 0, dangChay = false, raf = 0;
  function vong(ms) {
    const dt = Math.min(0.05, (ms - truoc) / 1000 || 0.016);
    truoc = ms; t += dt;
    capNhat(dt);
    ve();
    if (P.length || chayNen) raf = requestAnimationFrame(vong);
    else { dangChay = false; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); }
  }
  function batDau() {
    if (dangChay || document.hidden) return;
    dangChay = true; truoc = performance.now();
    raf = requestAnimationFrame(vong);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); dangChay = false; } else batDau();
  });

  // ---------- Hiệu ứng gọi từ ngoài ----------

  // Bung hạt + nhũ + sao từ một điểm (mở thiệp, gửi xác nhận)
  function bung(x, y, o) {
    o = Object.assign({ hat: 26, vun: 46, sao: 14, luc: 1 }, o);
    for (let i = 0; i < o.hat; i++) {
      const a = r(0, Math.PI * 2), v = r(120, 420) * o.luc, z = r(0.8, 2.1);
      them({ loai: 'hat', z, s: 0.42 * z, sp: SP.hat[i % 3], x: x + r(-20, 20), y: y + r(-20, 20), vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, ph: r(0, 6.28), k: 2.6, a: 1, song: r(3.5, 7) });
    }
    for (let i = 0; i < o.vun; i++) {
      const a = r(0, Math.PI * 2), v = r(160, 560) * o.luc, z = r(0.7, 1.8);
      them({ loai: 'vun', z, s: 0.55 * z, sp: SP.vun[i % 5], x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, ph: r(0, 6.28), xoay: r(0, 6.28), quay: r(2, 6), k: 2.2, a: 1, song: r(3, 7) });
    }
    for (let i = 0; i < o.sao; i++) sao(x + r(-160, 160), y + r(-140, 140), r(0.4, 1.1), r(0, 0.7));
    batDau();
  }

  function sao(x, y, s, tre) {
    them({ loai: 'sao', x, y, vx: 0, vy: 0, s: s || r(0.4, 0.9), song: -(tre || 0), max: r(0.7, 1.2), ph: r(0, 6), sp: SP.sao[Math.random() < 0.8 ? 0 : 1] });
    batDau();
  }

  // Chạm vào màn hình: thổi bay hạt quanh ngón tay
  function thoi(x, y) {
    for (const p of P) {
      if (p.loai !== 'hat' && p.loai !== 'vun') continue;
      const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy);
      if (d < 150 && d > 0.1) { const k = (1 - d / 150) * 260; p.vx += dx / d * k; p.vy += dy / d * k; p.k = 2; }
    }
    for (let i = 0; i < 3; i++) {
      const a = r(0, Math.PI * 2), v = r(60, 200);
      them({ loai: 'vun', z: 1, s: 0.5, sp: SP.vun[i], x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, ph: r(0, 6.28), xoay: r(0, 6.28), quay: r(2, 6), k: 2, a: 1, song: r(1.5, 3) });
    }
    them({ loai: 'hat', z: 1, s: 0.45, sp: SP.hat[0], x, y, vx: r(-60, 60), vy: r(-120, -60), ph: r(0, 6.28), k: 2, a: 1, song: r(3, 6) });
    sao(x, y, 0.8);
    batDau();
  }

  // Tim bay lên từ một điểm
  function tim(x, y, n, vang) {
    for (let i = 0; i < (n || 6); i++) {
      them({ loai: 'tim', x: x + r(-14, 14), y: y + r(-6, 6), vx: r(-70, 70), vy: r(-150, -60), s: r(0.6, 1.1), song: -i * 0.06, max: r(1.6, 2.6), ph: r(0, 6), sp: SP.tim[vang && Math.random() < 0.5 ? 1 : 0] });
    }
    batDau();
  }

  // Pháo hoa kim tuyến (kieu 'tim' nổ thành hình trái tim)
  const MAU_PHAO = [['#F6DFA4', '#E8C278', '#FFF6DE'], ['#F2B3A6', '#E8C278', '#FFF0E8'], ['#FFF6DE', '#F6DFA4', '#E8C278']];
  function no(x, y, kieu) {
    const bo = MAU_PHAO[(Math.random() * 3) | 0];
    const n = dienThoai ? 96 : 140;
    for (let i = 0; i < n; i++) {
      let vx, vy;
      if (kieu === 'tim') {
        const a = (i / n) * Math.PI * 2;
        vx = 16 * Math.pow(Math.sin(a), 3); vy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
        vx *= 15; vy *= 15;
      } else {
        const a = r(0, Math.PI * 2), v = r(110, 360) * (Math.random() < 0.3 ? 0.55 : 1);
        vx = Math.cos(a) * v; vy = Math.sin(a) * v;
      }
      them({ loai: 'phao', x, y, px: x, py: y, vx, vy, song: 0, max: r(1.5, 2.5), can: kieu === 'tim' ? 0.42 : 0.32, mau: bo[i % 3], w: r(1.4, 2.6) });
    }
    for (let i = 0; i < 12; i++) sao(x + r(-140, 140), y + r(-140, 140), r(0.5, 1.1), r(0.25, 1.2));
  }
  function phao(o) {
    o = o || {};
    const lan = o.lan || 5;
    for (let i = 0; i < lan; i++) {
      setTimeout(() => {
        const x = W * r(0.2, 0.8), dich = H * r(0.18, 0.42);
        const vy = -Math.sqrt(2 * 260 * (H + 20 - dich));
        them({ loai: 'ten', x, y: H + 20, px: x, py: H + 20, vx: r(-30, 30), vy, song: 0, mau: '#FFF1CC', w: 2.4, kieu: i === 2 || i === lan - 1 ? 'tim' : '' });
        batDau();
      }, i * (o.nhip || 650));
    }
  }

  // Bồ công anh trên trang tự rụng hạt theo gió
  let dsBca = [];
  function nguon(ds) { dsBca = ds; }
  setInterval(() => {
    if (!chayNen || document.hidden) return;
    for (const el of dsBca) {
      const b = el.getBoundingClientRect();
      if (b.bottom < 0 || b.top > H || b.width < 4) continue;
      if (Math.random() < 0.55) {
        const a = r(-Math.PI * 0.9, Math.PI * 0.1), rr = b.width / 2;
        const z = r(0.8, 1.2);
        them({ loai: 'hat', z, s: 0.38 * z, sp: SP.hat[(Math.random() * 3) | 0], x: b.left + rr + Math.cos(a) * rr * 0.9, y: b.top + b.height / 2 + Math.sin(a) * rr * 0.9, vx: r(10, 40), vy: r(-30, -5), ph: r(0, 6.28), k: 1, a: 0.95, song: r(8, 12) });
      }
    }
    batDau();
  }, 1600);

  // Bật hạt nền (gọi sau khi mở thiệp)
  function chay(dauTien) {
    chayNen = true;
    if (dauTien) {
      for (let i = 0; i < NEN.hat; i++) them(hatNen(true));
      for (let i = 0; i < NEN.vun; i++) them(vunNen(true));
    }
    batDau();
  }

  function datManDem(v) { manDem = v; }

  window.HatBay = { bung, thoi, phao, tim, sao, nguon, chay, datManDem };
})();
