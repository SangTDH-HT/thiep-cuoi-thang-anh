// Nhạc nền. Có file nhạc (THIEP.fileNhac) thì phát file đó, lặp lại; chưa có thì dùng hộp nhạc
// Canon in D (Pachelbel, nhạc cổ điển không còn bản quyền) tổng hợp bằng Web Audio.
(function () {
  'use strict';

  const FILE = (window.THIEP || {}).fileNhac;
  if (FILE) {
    // Thẻ <audio> thường: iPhone vẫn phát khi gạt im lặng; máy cho chỉnh âm lượng thì tăng dần cho êm
    const am = new Audio();
    am.src = FILE;
    am.loop = true;
    am.preload = 'metadata';
    am.setAttribute('playsinline', '');
    addEventListener('load', () => { am.preload = 'auto'; am.load(); });
    let dangChay = false, henAm = 0;
    const doAm = (den, ms, xong) => {
      clearInterval(henAm);
      const tu = am.volume, t0 = performance.now();
      henAm = setInterval(() => {
        const u = Math.min(1, (performance.now() - t0) / ms);
        try { am.volume = tu + (den - tu) * u; } catch (e) { /* iPhone không cho đổi âm lượng */ }
        if (u >= 1) { clearInterval(henAm); if (xong) xong(); }
      }, 40);
    };
    function batDau() {
      if (dangChay) return;
      dangChay = true;
      try { am.volume = 0; } catch (e) { /* bỏ qua */ }
      const p = am.play();
      if (p && p.catch) p.catch(() => { dangChay = false; });
      doAm(1, 2500);
    }
    function dung() {
      if (!dangChay) return;
      dangChay = false;
      doAm(0, 600, () => { if (!dangChay) am.pause(); });
    }
    let dungViAn = false;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && dangChay) { dung(); dungViAn = true; }
      else if (!document.hidden && dungViAn) { dungViAn = false; batDau(); }
    });
    window.HopNhac = { batDau, dung, get dangChay() { return dangChay; } };
    return;
  }

  const BPM = 70, PHACH = 60 / BPM;
  // 8 hợp âm, mỗi hợp âm 2 phách: [nốt trầm, các nốt rải]
  const HOP_AM = [
    [62, [62, 66, 69]], [57, [61, 64, 69]], [59, [62, 66, 71]], [54, [61, 66, 69]],
    [55, [62, 67, 71]], [50, [62, 66, 69]], [55, [62, 67, 71]], [57, [61, 64, 69]]
  ];
  // Giai điệu theo vòng (mỗi vòng 8 hợp âm); số = nốt MIDI, nhịp = số phách mỗi nốt
  const GIAI_DIEU = [
    null,
    { not: [78, 76, 74, 73, 71, 69, 71, 73], nhip: 2 },
    { not: [74, 73, 71, 69, 67, 66, 67, 64], nhip: 2 },
    { not: [74, 78, 81, 79, 78, 74, 78, 76, 74, 71, 74, 81, 79, 83, 81, 79], nhip: 1 },
    { not: [90, 88, 86, 85, 83, 81, 83, 85], nhip: 2 }
  ];

  let ac = null, tong = null, vang = null, kho = null;
  let henGio = 0, moc = 0, vong = 0, dangChay = false;

  const tanSo = m => 440 * Math.pow(2, (m - 69) / 12);

  function vangPhong(ac) {
    const dai = 2.8, sr = ac.sampleRate;
    const buf = ac.createBuffer(2, Math.floor(dai * sr), sr);
    for (let k = 0; k < 2; k++) {
      const d = buf.getChannelData(k);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.6);
    }
    const c = ac.createConvolver(); c.buffer = buf; return c;
  }

  function khoiTao() {
    if (ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    // iPhone gạt im lặng vẫn phát nhạc trang web
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* bỏ qua */ }
    ac = new AC();
    tong = ac.createGain(); tong.gain.value = 0;
    const loc = ac.createBiquadFilter(); loc.type = 'lowpass'; loc.frequency.value = 6500;
    kho = ac.createGain(); kho.gain.value = 0.8;
    vang = ac.createGain(); vang.gain.value = 0.42;
    const cv = vangPhong(ac);
    kho.connect(loc); vang.connect(cv); cv.connect(loc);
    loc.connect(tong); tong.connect(ac.destination);
  }

  // Một nốt hộp nhạc: tiếng gốc + bồi âm lệch nhẹ + tiếng "keng" của răng lược
  function not(t, m, luc) {
    const f = tanSo(m);
    const tat = Math.max(0.9, Math.min(2.6, 2.6 - (m - 60) * 0.05));
    const lop = [[1, 1, tat], [2.003, 0.22, tat * 0.55], [5.4, 0.06, 0.12]];
    for (const [ti, bien, dai] of lop) {
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f * ti;
      const g = ac.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(luc * bien, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dai);
      o.connect(g); g.connect(kho); g.connect(vang);
      o.start(t); o.stop(t + dai + 0.05);
    }
  }

  function xepVong(t0, so) {
    const gd = GIAI_DIEU[so === 0 ? 0 : 1 + ((so - 1) % 4)];
    HOP_AM.forEach(([tram, rai], i) => {
      const t = t0 + i * 2 * PHACH;
      not(t, tram, 0.13);
      const thu = [rai[0], rai[1], rai[2], rai[1]];
      thu.forEach((m, j) => not(t + j * PHACH / 2 + (Math.random() - 0.5) * 0.012, m, 0.07));
    });
    if (gd) gd.not.forEach((m, i) => not(t0 + i * gd.nhip * PHACH + 0.004, m, 0.2));
  }

  function lich() {
    const dai = HOP_AM.length * 2 * PHACH;
    while (moc < ac.currentTime + 1.2) { xepVong(moc, vong++); moc += dai; }
  }

  function batDau() {
    khoiTao();
    if (!ac || dangChay) return;
    dangChay = true;
    ac.resume();
    if (!moc || moc < ac.currentTime) { moc = ac.currentTime + 0.15; }
    tong.gain.cancelScheduledValues(ac.currentTime);
    tong.gain.setValueAtTime(tong.gain.value, ac.currentTime);
    tong.gain.linearRampToValueAtTime(0.5, ac.currentTime + 2.5);
    lich();
    henGio = setInterval(lich, 300);
  }

  function dung() {
    if (!ac || !dangChay) return;
    dangChay = false;
    clearInterval(henGio);
    tong.gain.cancelScheduledValues(ac.currentTime);
    tong.gain.setValueAtTime(tong.gain.value, ac.currentTime);
    tong.gain.linearRampToValueAtTime(0, ac.currentTime + 0.6);
    const a = ac;
    setTimeout(() => { if (!dangChay) { a.suspend(); moc = 0; } }, 700);
  }

  // Ẩn tab / chuyển sang Messenger thì tạm dừng, quay lại thì phát tiếp
  let dungViAn = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dangChay) { dung(); dungViAn = true; }
    else if (!document.hidden && dungViAn) { dungViAn = false; batDau(); }
  });

  window.HopNhac = { batDau, dung, get dangChay() { return dangChay; } };
})();
