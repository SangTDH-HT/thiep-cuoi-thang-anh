// Điều khiển thiệp: tên khách, mở bìa, hiệu ứng theo cuộn, đếm ngược, xác nhận tham dự
(function () {
  'use strict';

  const CFG = window.THIEP || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cho = ms => new Promise(r => setTimeout(r, ms));
  const rung = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* máy không hỗ trợ */ } };
  const NGAY_CUOI = new Date(CFG.ngayCuoi || '2026-11-28T11:00:00+07:00');

  const kho = {
    doc(k) { try { return JSON.parse(localStorage.getItem('tc.' + k)); } catch (e) { return null; } },
    ghi(k, v) { try { localStorage.setItem('tc.' + k, JSON.stringify(v)); } catch (e) { /* trình duyệt chặn lưu */ } }
  };

  // ---------- Tên khách ----------
  // Link riêng: ?k=<base64url("Tên|1|g")>, 1 = kèm "+ NT", g/t = khách nhà gái / nhà trai
  function giaiMa(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  }
  function docLink() {
    const k = new URLSearchParams(location.search).get('k');
    if (!k) return null;
    try {
      const [ten, nt, ben] = giaiMa(k).split('|');
      const t = (ten || '').trim().replace(/\s+/g, ' ').slice(0, 60);
      if (!t) return null;
      return { ten: t, nt: nt !== '0', ben: ben === 't' ? 'Nhà trai' : ben === 'g' ? 'Nhà gái' : '' };
    } catch (e) { return null; }
  }
  const khachLink = docLink();
  let khach = khachLink || kho.doc('khach');
  const tenHien = () => (khach ? khach.ten + (khach.nt ? ' + NT' : '') : '');

  function hienTen() {
    const t = tenHien();
    $$('.ten-viet').forEach(el => { el.textContent = t; });
    vuaKhung();
  }
  // Tên dài thì thu nhỏ cho vừa dòng chấm
  function vuaKhung() {
    const goc = $('#ten-bia');
    if (!goc || !goc.textContent) return;
    goc.style.fontSize = '';
    const max = goc.parentElement.clientWidth * 0.98;
    let fs = parseFloat(getComputedStyle(goc).fontSize);
    if (goc.scrollWidth > max) fs = Math.max(20, fs * max / goc.scrollWidth);
    $$('.dong-cham .ten-viet').forEach(el => { el.style.fontSize = fs + 'px'; });
  }

  // ---------- Viết tay: mặt nạ chạy trái sang phải, ngòi bút toé sao ----------
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const fx = t => ((ax * t + bx) * t + cx) * t;
    const fy = t => ((ay * t + by) * t + cy) * t;
    const dx = t => (3 * ax * t + 2 * bx) * t + cx;
    return x => {
      let t = x;
      for (let i = 0; i < 6; i++) { const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= (fx(t) - x) / d; }
      return fy(Math.min(1, Math.max(0, t)));
    };
  }
  const deoViet = bezier(0.5, 0.1, 0.45, 1);
  const thoiGianViet = s => Math.min(2.6, Math.max(1.1, 0.42 + s.length * 0.075));

  function vietChu(el, giay) {
    if (!el) return Promise.resolve();
    if (giam) { el.classList.add('viet-xong'); return Promise.resolve(); }
    el.style.setProperty('--tv', giay + 's');
    el.classList.remove('viet', 'viet-xong');
    void el.offsetWidth;
    el.classList.add('viet');
    const t0 = performance.now();
    let cuoi = 0;
    return new Promise(xong => {
      (function buoc(now) {
        const u = Math.min(1, (now - t0) / (giay * 1000));
        if (now - cuoi > 50 && u > 0.03 && u < 0.97) {
          cuoi = now;
          const b = el.getBoundingClientRect();
          const e = deoViet(u);
          const x = b.left + b.width * Math.min(1, Math.max(0, 1.4 * e - 0.236));
          const y = b.top + b.height * (0.5 + 0.16 * Math.sin(u * 38));
          if (b.bottom > 0 && b.top < innerHeight) HatBay.sao(x, y, 0.28 + Math.random() * 0.4);
        }
        if (u < 1) requestAnimationFrame(buoc);
        else {
          el.classList.add('viet-xong');
          const b = el.getBoundingClientRect();
          for (let i = 0; i < 5; i++) HatBay.sao(b.left + b.width * Math.random(), b.top + b.height * (0.2 + Math.random() * 0.6), 0.4 + Math.random() * 0.5, i * 0.08);
          xong();
        }
      })(t0);
    });
  }

  // Sao lấp lánh ngẫu nhiên trên chữ đã viết
  setInterval(() => {
    if (document.hidden) return;
    for (const el of $$('.viet-xong')) {
      const trongBia = !!el.closest('#bia');
      if (trongBia === daMo || Math.random() < 0.45) continue;
      const b = el.getBoundingClientRect();
      if (b.bottom < 0 || b.top > innerHeight || b.width < 4) continue;
      HatBay.sao(b.left + b.width * (0.08 + Math.random() * 0.84), b.top + b.height * (0.25 + Math.random() * 0.5), 0.3 + Math.random() * 0.45);
    }
  }, 650);

  // ---------- Dựng hình ----------
  const HOA_BIA = { w: 420, h: 500, goc: [210, 494], vung: { cx: 210, cy: 190, rx: 180, ry: 152 }, so: 27, hat: 11, buoc: true, tre: 0.2 };
  const HOA_DAU = { w: 620, h: 470, goc: [650, 485], vung: { cx: 318, cy: 172, rx: 272, ry: 136 }, so: 28, hat: 5, nhip: 0.05, boCongAnh: [{ dx: 0.22, dy: -0.42 }, { dx: -0.72, dy: 0.12, s: 0.6 }] };
  const HOA_VOM = { w: 120, h: 190, goc: [60, 188], vung: { cx: 60, cy: 40, rx: 36, ry: 28 }, so: 5, hat: 21, boCongAnh: false, loai: { cuc: 2, cucHong: 1, nu: 3, coThi: 1 }, co: 2, laRong: 0, la: false, tre: 0.3 };
  const HOA_CAM_ON = { w: 170, h: 230, goc: [85, 226], vung: { cx: 85, cy: 64, rx: 50, ry: 44 }, so: 7, hat: 8, boCongAnh: false, loai: { cucBe: 2, coThi: 2, nu: 3, biBi: 1 }, co: 3, laRong: 1 };

  function svgNiem(id) {
    const M = window.__MONO;
    const n = 26, rIn = 54, rOut = 61;
    let vien = '';
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, am = (a0 + a1) / 2;
      const p = (a, r) => `${(60 + Math.cos(a) * r).toFixed(2)} ${(60 + Math.sin(a) * r).toFixed(2)}`;
      vien += (i ? '' : `M${p(a0, rIn)}`) + `Q${p(am, rOut)} ${p(a1, rIn)}`;
    }
    vien += 'Z';
    const chu = M ? M.parts.map(x => `<path d="${x.d}"/>`).join('') : '';
    return `<svg viewBox="0 0 120 120">` +
      `<defs><radialGradient id="${id}-g" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#F8EBC6"/><stop offset=".4" stop-color="#D8B676"/><stop offset=".75" stop-color="#A9834A"/><stop offset="1" stop-color="#7A5A2E"/></radialGradient>` +
      `<linearGradient id="${id}-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7A5A2E"/><stop offset="1" stop-color="#4E3818"/></linearGradient>` +
      `<linearGradient id="${id}-s" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
      `<clipPath id="${id}-k"><path d="${vien}"/></clipPath></defs>` +
      `<path d="${vien}" fill="url(#${id}-g)"/>` +
      `<circle cx="60" cy="60" r="45.5" fill="none" stroke="#7A5A2E" stroke-opacity=".55" stroke-width="1.3"/>` +
      `<circle cx="60" cy="60" r="43" fill="none" stroke="#FFF4D2" stroke-opacity=".65" stroke-width=".8"/>` +
      `<g transform="translate(26.4 32) scale(.1266)"><g fill="#FFF6DC" opacity=".65" transform="translate(0 9)">${chu}</g><g fill="url(#${id}-c)">${chu}</g></g>` +
      `<g clip-path="url(#${id}-k)"><rect class="niem-sang" x="-70" y="-30" width="34" height="180" fill="url(#${id}-s)"/></g>` +
      `</svg>`;
  }

  function veChuLong() {
    const M = window.__MONO, svg = $('#chu-long');
    if (!M || !svg) return;
    const [x, y, w, h] = M.viewBox;
    svg.setAttribute('viewBox', M.viewBox.join(' '));
    svg.innerHTML = `<defs><linearGradient id="nhu-long" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}">` +
      `<stop offset="0" stop-color="#7A5A2E"/><stop offset=".22" stop-color="#C9A465"/><stop offset=".4" stop-color="#F2DFAF"/><stop offset=".58" stop-color="#A9844E"/><stop offset=".8" stop-color="#E3C88E"/><stop offset="1" stop-color="#7E5F33"/>` +
      `<animateTransform attributeName="gradientTransform" type="translate" values="-260 0;260 0;-260 0" dur="9s" repeatCount="indefinite"/></linearGradient></defs>` +
      M.parts.map(p => `<path pathLength="1" d="${p.d}" fill="url(#nhu-long)"/>`).join('');
  }

  function veLich() {
    const thu = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    let html = thu.map((t, i) => `<span class="thu${i === 6 ? ' cn' : ''}">${t}</span>`).join('');
    const nam = NGAY_CUOI.getFullYear(), thang = NGAY_CUOI.getMonth(), ngay = NGAY_CUOI.getDate();
    const dau = (new Date(nam, thang, 1).getDay() + 6) % 7;
    const so = new Date(nam, thang + 1, 0).getDate();
    for (let i = 0; i < dau; i++) html += '<span></span>';
    for (let d = 1; d <= so; d++) {
      const cot = (dau + d - 1) % 7;
      const lop = ['ngay'];
      if (cot === 6) lop.push('cn');
      if (d === ngay) {
        lop.push('cuoi');
        html += `<span class="${lop.join(' ')}" style="--i:${d}"><span class="so-cuoi">${d}</span>` +
          `<svg class="tim-ve" viewBox="0 0 54 50"><path pathLength="1" d="M27 46C17 39 5 30 5 18 5 10 11 5 17.5 5 22 5 25.5 8 27 12.5 28.5 8 32 5 36.5 5 43 5 49 10 49 18 49 30 37 39 26 47.5"/></svg></span>`;
      } else {
        html += `<span class="${lop.join(' ')}" style="--i:${d}">${d}</span>`;
      }
    }
    $('#lich').innerHTML = html;
  }

  // ---------- Đếm ngược ----------
  const oDem = {};
  $$('.dem-so').forEach(el => { oDem[el.dataset.o] = el; });
  let latSo = false;
  function demNguoc() {
    const con = NGAY_CUOI - Date.now();
    if (con <= 0) {
      const homNay = new Date().toDateString() === NGAY_CUOI.toDateString();
      $('#dem').hidden = true;
      const xong = $('#dem-xong');
      xong.hidden = false;
      xong.textContent = homNay ? 'Hôm nay là ngày vui của hai chúng tôi!' : 'Cảm ơn Quý khách đã chung vui cùng hai chúng tôi!';
      return false;
    }
    const s = Math.floor(con / 1000);
    const v = { ngay: Math.floor(s / 86400), gio: Math.floor(s % 86400 / 3600), phut: Math.floor(s % 3600 / 60), giay: s % 60 };
    for (const k in v) {
      const el = oDem[k], chu = String(v[k]).padStart(2, '0');
      if (el.textContent === chu) continue;
      el.textContent = chu;
      if (latSo && !giam) { el.classList.remove('lat'); void el.offsetWidth; el.classList.add('lat'); }
    }
    return true;
  }

  // ---------- Bìa ----------
  let dangMo = false, daMo = false;

  function dungBia() {
    $$('.cua .mat-ngoai').forEach(m => m.appendChild($('#mau-bia').content.cloneNode(true)));
    const hoa = HoaKho.bo(HOA_BIA);
    $$('.cua .bia-hoa').forEach(el => { el.innerHTML = hoa; });
    $('.niem-trai .niem-mat').innerHTML = svgNiem('nt');
    $('.niem-phai .niem-mat').innerHTML = svgNiem('np');
    if (khach) hienTen();
    else { $('#o-nhap').hidden = false; $('#goi-y').hidden = false; }
    $('#nut-mo').addEventListener('click', moThiep);
    $('#nhap-ten').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); moThiep(); } });
  }

  async function moThiep() {
    if (dangMo) return;
    dangMo = true;
    if (CFG.nhac !== false) { try { HopNhac.batDau(); } catch (e) { /* trình duyệt không cho phát */ } }
    rung(18);
    const the = $('#bia-the');
    the.classList.remove('lac-the'); void the.offsetWidth; the.classList.add('lac-the');

    if (!khach) {
      const v = $('#nhap-ten').value.trim().replace(/\s+/g, ' ').slice(0, 60);
      khach = v ? { ten: v, nt: true, ben: '' } : { ten: 'Quý khách', nt: false, ben: '', chung: true };
      if (v) kho.ghi('khach', khach);
      $('#nhap-ten').blur();
      $('#o-nhap').hidden = true;
      $('#goi-y').hidden = true;
      hienTen();
      dienTenPhieu();
      await vietChu($('#ten-bia'), thoiGianViet(tenHien()));
      await cho(260);
    }

    document.body.classList.add('dang-mo');
    scrollTo(0, 0);
    await cho(360);
    document.body.classList.add('loe-sang');
    const b = the.getBoundingClientRect();
    HatBay.bung(b.left + b.width / 2, b.top + b.height * 0.5, { hat: 34, vun: 74, sao: 22, luc: 1.15 });
    rung([12, 70, 30]);
    chayMoDau();
    await cho(1800);
    document.body.classList.remove('dong');
    document.body.classList.add('mo');
    daMo = true;
    HatBay.nguon($$('.thiep .bca'));
    if (CFG.nhac !== false) $('#nut-nhac').hidden = false;
    capNhatNutNhac();
    batTheoDoi();
  }

  function chayMoDau() {
    $('#mo-dau').classList.add('moc-hoa');
    setTimeout(() => vietChu($('.ten-re .chu-nhu'), 1.6), 700);
    setTimeout(() => $('.truong').classList.add('hien'), 2100);
    setTimeout(() => vietChu($('.ten-dau .chu-nhu'), 1.45), 2300);
    setTimeout(() => $('.ngay-lon').classList.add('hien'), 3600);
    setTimeout(() => $('.vuot').classList.add('hien'), 4700);
  }

  // ---------- Hiện theo cuộn ----------
  const KHI_HIEN = {
    'loi-moi'() { setTimeout(() => vietChu($('#ten-loi-moi'), thoiGianViet(tenHien())), 750); },
    'giu-ngay'(el) {
      el.classList.add('moc-hoa');
      latSo = true;
      setTimeout(() => {
        const o = $('.lich .cuoi');
        if (!o) return;
        o.classList.add('dap');
        const b = o.getBoundingClientRect();
        HatBay.tim(b.left + b.width / 2, b.top + b.height / 2, 12);
        for (let i = 0; i < 6; i++) HatBay.sao(b.left + b.width / 2 + (Math.random() - 0.5) * 90, b.top + (Math.random() - 0.5) * 70, 0.5 + Math.random() * 0.4, i * 0.07);
        rung(15);
      }, giam ? 0 : 2950);
    },
    'cam-on'(el) {
      el.classList.add('moc-hoa');
      setTimeout(() => vietChu($('.thank'), 1.7), 500);
    }
  };

  let daBan = false, chanPhaoDen = 0;
  function phaoHoa() {
    if (daBan || giam) return;
    // Vừa đóng dấu xác nhận thì để con dấu diễn xong rồi mới bắn pháo hoa
    if (Date.now() < chanPhaoDen) { setTimeout(phaoHoa, chanPhaoDen - Date.now() + 100); return; }
    daBan = true;
    document.body.classList.add('phao-hoa');
    HatBay.datManDem(1);
    setTimeout(() => HatBay.phao({ lan: 7, nhip: 560 }), 500);
    setTimeout(() => {
      document.body.classList.remove('phao-hoa');
      setTimeout(() => { HatBay.datManDem(0); daBan = false; }, 1200);
    }, 7000);
  }

  function batTheoDoi() {
    $$('#loi-moi .ho, #loi-moi .moi > p').forEach((el, i) => { el.classList.add('hien-dan'); el.style.setProperty('--i', i); });
    const io = new IntersectionObserver(ds => ds.forEach(d => {
      if (!d.isIntersecting) return;
      io.unobserve(d.target);
      d.target.classList.add('hien');
      const fn = KHI_HIEN[d.target.id];
      if (fn) fn(d.target);
    }), { threshold: 0.16 });
    $$('[data-hien]').forEach(el => io.observe(el));
    // Pháo hoa khi chữ ký cuối thiệp lọt hẳn vào màn hình
    const ioPhao = new IntersectionObserver(ds => {
      if (ds.some(d => d.isIntersecting)) { ioPhao.disconnect(); setTimeout(phaoHoa, 600); }
    }, { threshold: 1 });
    ioPhao.observe($('.ky'));
    $('.ky').addEventListener('click', phaoHoa);
    capNhatCuon();
  }

  const hoaDau = $('#hoa-dau'), lt = $('#lich-trinh'), than = $('#than-cay'), mocs = $$('.moc > li');
  function capNhatCuon() {
    const y = scrollY, vh = innerHeight;
    if (y < vh * 1.3 && !giam) hoaDau.style.transform = `translate3d(0, ${(y * 0.3).toFixed(1)}px, 0)`;
    const b = lt.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (vh * 0.8 - (b.top + 150)) / Math.max(1, b.height - 210)));
    than.style.setProperty('--p', giam ? 1 : p.toFixed(3));
    mocs.forEach(li => { if (!li.classList.contains('toi') && li.getBoundingClientRect().top < vh * 0.82) li.classList.add('toi'); });
    if (y > 60) $('.vuot').classList.remove('hien');
  }
  let henCuon = false;
  addEventListener('scroll', () => {
    if (!daMo || henCuon) return;
    henCuon = true;
    requestAnimationFrame(() => { henCuon = false; capNhatCuon(); });
  }, { passive: true });

  // ---------- Xác nhận tham dự ----------
  const phieu = $('#phieu'), daGui = $('#da-gui'), nutGui = $('#nut-gui'), bao = $('#bao');
  let soNguoi = 1;
  function datSo(n) { soNguoi = Math.max(1, Math.min(20, n)); $('#xn-so').textContent = soNguoi; }
  function capNhatDen() { $('#neu-den').classList.toggle('an', phieu.den.value === 'Không'); }
  function maMay() {
    let id = kho.doc('id');
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 18);
      kho.ghi('id', id);
    }
    return id;
  }
  function dienTenPhieu() {
    const cu = kho.doc('xn');
    if (!cu && khach && !khach.chung) $('#xn-ten').value = khach.ten;
    if (!cu) datSo(khach && khach.nt ? 2 : 1);
  }
  function dienPhieu() {
    const cu = kho.doc('xn');
    if (cu) {
      $('#xn-ten').value = cu.ten;
      datSo(cu.so || 1);
      $$('input[name=den]').forEach(r => { r.checked = r.value === cu.den; });
      $$('input[name=ben]').forEach(r => { r.checked = r.value === cu.ben; });
      $('#xn-loi').value = cu.loi || '';
    } else {
      dienTenPhieu();
      const ben = khach && khach.ben;
      if (ben) $$('input[name=ben]').forEach(r => { r.checked = r.value === ben; });
    }
    capNhatDen();
    if (cu) hienDaGui(cu, false);
  }

  function baoLoi(chu, o) {
    bao.className = 'bao';
    bao.textContent = chu;
    if (o) o.focus();
  }

  async function guiSheet(goi) {
    const url = CFG.sheetUrl;
    if (!url) {
      if (/[?&]thu=1\b/.test(location.search)) { await cho(900); return; }
      throw new Error('Phần xác nhận chưa được nối với Google Sheet.');
    }
    const body = JSON.stringify(goi);
    let r;
    try {
      r = await fetch(url, { method: 'POST', body });
    } catch (e) {
      // Trình duyệt trong ứng dụng chặn đọc phản hồi: gửi kiểu không đọc lại
      try { await fetch(url, { method: 'POST', body, mode: 'no-cors' }); return; } catch (e2) {
        throw new Error('Chưa gửi được vì mất mạng. Kiểm tra mạng rồi bấm Gửi xác nhận lần nữa.');
      }
    }
    let j = null;
    try { j = await r.json(); } catch (e) { /* phản hồi không phải JSON */ }
    if (!j || !j.ok) throw new Error('Google Sheet chưa nhận được. Đợi một lát rồi bấm Gửi xác nhận lần nữa.');
  }

  phieu.addEventListener('change', e => { if (e.target.name === 'den') capNhatDen(); });
  $$('.nut-buoc').forEach(n => n.addEventListener('click', () => datSo(soNguoi + Number(n.dataset.buoc))));
  phieu.addEventListener('submit', async e => {
    e.preventDefault();
    const ten = $('#xn-ten').value.trim().replace(/\s+/g, ' ');
    const den = phieu.den.value, ben = phieu.ben.value;
    if (!ten) return baoLoi('Xin Quý khách ghi tên.', $('#xn-ten'));
    if (!den) return baoLoi('Xin chọn "Tôi sẽ đến" hoặc "Tiếc quá, tôi bận".', $('input[name=den]'));
    if (den === 'Có' && !ben) return baoLoi('Xin chọn Quý khách là khách nhà trai hay nhà gái.', $('input[name=ben]'));
    if (phieu.web.value) return;
    const goi = {
      id: maMay(), ten, den,
      so: den === 'Có' ? soNguoi : 0,
      ben: den === 'Có' ? ben : '',
      loi: $('#xn-loi').value.trim().slice(0, 500),
      link: khachLink ? khachLink.ten + (khachLink.nt ? ' + NT' : '') : ''
    };
    nutGui.disabled = true;
    bao.className = 'bao dang-gui';
    bao.textContent = 'Đang gửi…';
    try {
      await guiSheet(goi);
    } catch (err) {
      nutGui.disabled = false;
      return baoLoi(err.message);
    }
    kho.ghi('xn', goi);
    nutGui.disabled = false;
    bao.textContent = '';
    hienDaGui(goi, true);
  });

  function hienDaGui(goi, hieuUng) {
    phieu.hidden = true;
    daGui.hidden = false;
    $('#da-gui-chu').textContent = goi.den === 'Có'
      ? `Cảm ơn ${goi.ten}! Hai chúng tôi đã ghi nhận ${goi.so} người. Hẹn gặp Quý khách ngày 28.11.`
      : `Cảm ơn ${goi.ten} đã báo. Hai chúng tôi rất tiếc và mong sớm gặp lại Quý khách.`;
    if (!hieuUng || giam) { daGui.classList.add('da-dap'); return; }
    daGui.classList.remove('dap', 'da-dap');
    chanPhaoDen = Date.now() + 4200;
    daGui.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(() => {
      void daGui.offsetWidth;
      daGui.classList.add('dap');
      setTimeout(() => {
        $('#thiep').classList.add('rung');
        const b = $('.con-dau').getBoundingClientRect();
        const x = b.left + b.width / 2, y = b.top + b.height / 2;
        HatBay.bung(x, y, { hat: 22, vun: 56, sao: 16, luc: 0.95 });
        HatBay.tim(x, y, 16, true);
        rung([35, 45, 80]);
      }, 380);
      setTimeout(() => $('#thiep').classList.remove('rung'), 900);
    }, 500);
  }
  $('#nut-sua').addEventListener('click', () => {
    daGui.hidden = true;
    phieu.hidden = false;
    $('#xn-ten').focus();
  });

  // ---------- Nhạc, chạm thổi hạt ----------
  const nutNhac = $('#nut-nhac');
  function capNhatNutNhac() {
    const bat = HopNhac.dangChay;
    nutNhac.setAttribute('aria-pressed', String(bat));
    nutNhac.setAttribute('aria-label', bat ? 'Tắt nhạc' : 'Bật nhạc');
  }
  nutNhac.addEventListener('click', () => {
    if (HopNhac.dangChay) HopNhac.dung(); else HopNhac.batDau();
    capNhatNutNhac();
  });
  document.addEventListener('visibilitychange', () => setTimeout(capNhatNutNhac, 50));

  document.addEventListener('pointerdown', e => {
    if (e.target.closest('a, button, input, textarea, label, select, output, .phieu')) return;
    HatBay.thoi(e.clientX, e.clientY);
  }, { passive: true });

  // ---------- Khởi động ----------
  async function khoiDong() {
    $('#hoa-dau').innerHTML = HoaKho.bo(HOA_DAU);
    $('#vom-hoa').innerHTML = HoaKho.bo(HOA_VOM);
    $('#hoa-cam-on').innerHTML = HoaKho.bo(HOA_CAM_ON);
    veChuLong();
    veLich();
    dungBia();
    dienPhieu();
    if (demNguoc()) setInterval(demNguoc, 1000);

    try { await Promise.race([document.fonts.load('40px Ephesis', 'Thắng Ánh'), cho(3000)]); } catch (e) { /* dùng font dự phòng */ }
    vuaKhung();
    $('#bia').classList.add('moc-hoa');
    HatBay.nguon($$('.cua-trai .bca'));
    HatBay.chay(true);
    if (khach) {
      await cho(giam ? 0 : 1500);
      if (!dangMo) await vietChu($('#ten-bia'), thoiGianViet(tenHien()));
    }
  }
  addEventListener('resize', () => vuaKhung());
  khoiDong();
})();
