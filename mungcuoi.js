// Mừng cưới: phong bì đỏ ghi tay lời chúc + tên khách; chạm dấu niêm thì nắp mở, thiệp mã VietQR trồi lên.
// Mã VietQR (chuẩn EMVCo của NAPAS) vẽ ngay trên máy khách, không gọi dịch vụ ngoài.
// Nội dung chuyển khoản = tên khách (bỏ dấu) + "chuc <đôi> <lời chúc>". Cấu hình ở config.js, mục mungCuoi.
(function () {
  'use strict';

  const CFG = (window.THIEP && window.THIEP.mungCuoi) || null;
  const $ = s => document.querySelector(s);
  const cho = ms => new Promise(r => setTimeout(r, ms));
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NEN_MA = '#FFFDF8', MAU_MA = '#2A2425';

  // ---------- Chuỗi VietQR ----------
  const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v;
  function crc16(s) {
    let c = 0xFFFF;
    for (let i = 0; i < s.length; i++) {
      c ^= s.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) c = (c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1) & 0xFFFF;
    }
    return c.toString(16).toUpperCase().padStart(4, '0');
  }
  function chuoiVietQR(nd, a) {
    a = a || TK[chon];
    const tk = tlv('00', 'A000000727') + tlv('01', tlv('00', a.bin) + tlv('01', a.soTk)) + tlv('02', 'QRIBFTTA');
    let s = tlv('00', '01') + tlv('01', nd ? '12' : '11') + tlv('38', tk) + tlv('53', '704') + tlv('58', 'VN');
    if (nd) s += tlv('62', tlv('08', nd));
    s += '6304';
    return s + crc16(s);
  }

  // Ngân hàng chỉ nhận chữ không dấu, không ký tự đặc biệt
  function boDau(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/[^A-Za-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function catTen(t) {
    t = boDau(t);
    if (t.length <= 30) return t;
    const c = t.slice(0, 31);
    return c.includes(' ') ? c.slice(0, c.lastIndexOf(' ')) : t.slice(0, 30);
  }

  // Tài khoản nhận: chon = vị trí trong CFG.taiKhoan; khách tự bấm chọn thì không đổi theo bên nữa
  const TK = (CFG && CFG.taiKhoan) || [];
  let chon = 0, tuChon = false;
  let ten = '', loi = 0, nd = '', chuoi = '', khoa = '';
  function tinhNoiDung() {
    const t = catTen(ten), doi = boDau(CFG.goiDoi), chuc = boDau(CFG.loiChuc[loi]).toLowerCase();
    return t ? `${t} chuc ${doi} ${chuc}` : `Chuc ${doi} ${chuc}`;
  }

  // ---------- Vẽ mã ----------
  function veMa(s, px) {
    const q = qrcode(0, 'M');
    q.addData(s, 'Byte');
    q.make();
    const n = q.getModuleCount(), le = 4, o = Math.max(2, Math.floor(px / (n + le * 2)));
    const c = document.createElement('canvas');
    c.width = c.height = (n + le * 2) * o;
    const g = c.getContext('2d');
    g.fillStyle = NEN_MA;
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = MAU_MA;
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) g.fillRect((k + le) * o, (r + le) * o, o, o);
    return c;
  }

  const nhayLai = el => { if (giam) return; el.classList.remove('doi'); void el.offsetWidth; el.classList.add('doi'); };
  function capNhat(doiChu, doiTk) {
    const loiEl = $('#bi-loi'), tuEl = $('#bi-tu'), a = TK[chon];
    loiEl.textContent = CFG.loiChuc[loi];
    tuEl.textContent = ten;
    tuEl.hidden = !ten;
    if (doiChu) nhayLai(loiEl);
    $('#chu-tk').textContent = a.chuTk;
    $('#ngan-hang').textContent = a.nganHang;
    $('#so-tk').textContent = a.soTk;
    $('#anh-qr').alt = `Mã QR chuyển khoản ${a.nganHang} tới ${a.chuTk}, số tài khoản ${a.soTk}`;
    document.querySelectorAll('#hang-tk input').forEach(r => { r.checked = Number(r.value) === chon; });
    const moi = tinhNoiDung();
    if (moi + '|' + chon === khoa) return;
    khoa = moi + '|' + chon;
    nd = moi;
    chuoi = chuoiVietQR(nd);
    $('#anh-qr').src = veMa(chuoi, 600).toDataURL('image/png');
    $('#nd-ck').textContent = nd;
    if (doiTk) {
      nhayLai($('#anh-qr'));
      nhayLai($('#bi-the figcaption'));
      if (san.classList.contains('mo')) doDat();
    }
  }
  // ben: 'Nhà trai' / 'Nhà gái' lấy từ link mời hoặc phiếu xác nhận
  function ve(t, ben) {
    ten = String(t || '').trim().replace(/\s+/g, ' ');
    if (!CFG || !window.qrcode || !TK.length) return;
    let doiTk = false;
    if (!tuChon && ben) {
      const i = TK.findIndex(a => a.ben === ben);
      if (i >= 0 && i !== chon) { chon = i; doiTk = true; }
    }
    capNhat(false, doiTk);
  }

  // ---------- Mở phong bì ----------
  const san = $('#bi-san');
  // Thiệp trồi lên tới khi mã QR, tên chủ tài khoản, số tài khoản đều vừa qua miệng phong bì
  // (miệng hình chữ V, đáy chữ V sâu 110/368 chiều cao phong bì)
  function doDat() {
    const rb = $('#bi').getBoundingClientRect();
    const w = rb.width, eh = rb.height, sau = eh * 110 / 368;
    const mieng = x => Math.min(x, w - x) / (w / 2) * sau;
    const daTroi = san.classList.contains('mo') ? parseFloat(san.style.getPropertyValue('--rise')) || 0 : 0;
    let troi = 0;
    for (const el of [$('#anh-qr'), $('#chu-tk'), $('#tk-dong')]) {
      const r = el.getBoundingClientRect();
      const day = r.bottom - rb.top + daTroi;
      troi = Math.max(troi, day - (Math.min(mieng(r.left - rb.left), mieng(r.right - rb.left)) - 5));
    }
    const dinh = $('#bi-the').getBoundingClientRect().top - rb.top + daTroi - troi;
    san.style.setProperty('--rise', troi.toFixed(1) + 'px');
    san.style.setProperty('--san-mo', (eh + Math.max(0, -dinh) + 14).toFixed(1) + 'px');
  }
  function moBi() {
    if (san.classList.contains('mo')) return;
    doDat();
    const n = $('#bi-niem').getBoundingClientRect();
    san.classList.add('mo');
    const nut = $('#bi-mo');
    nut.setAttribute('aria-expanded', 'true');
    nut.hidden = true;
    $('#bi-goi-y').classList.add('an');
    try { navigator.vibrate && navigator.vibrate([12, 60, 26]); } catch (e) { /* máy không hỗ trợ */ }
    if (window.HatBay && !giam) {
      HatBay.bung(n.left + n.width / 2, n.top + n.height / 2, { hat: 10, vun: 46, sao: 14, luc: 0.75 });
      setTimeout(() => {
        const b = $('#bi-the').getBoundingClientRect();
        HatBay.tim(b.left + b.width / 2, b.top + b.height * 0.3, 8, true);
      }, 1700);
    }
    setTimeout(() => {
      const ct = $('#bi-chi-tiet');
      $('#bi-goi-y').hidden = true;
      ct.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => ct.classList.add('hien')));
    }, giam ? 0 : 1450);
  }

  // ---------- Ảnh để lưu: phong bì đỏ, thiệp mã QR, lời chúc ----------
  function xuongDong(g, chu, rong) {
    const dong = [];
    let d = '';
    for (const t of chu.split(' ')) {
      const thu = d ? d + ' ' + t : t;
      if (d && g.measureText(thu).width > rong) { dong.push(d); d = t; } else d = thu;
    }
    if (d) dong.push(d);
    return dong;
  }
  function nhuVang(g, x0, x1) {
    const n = g.createLinearGradient(x0, 0, x1, 0);
    [['0', '#C9A15E'], ['.22', '#F6E3B0'], ['.5', '#C29550'], ['.76', '#F1DA9F'], ['1', '#C79D5A']].forEach(([o, m]) => n.addColorStop(+o, m));
    return n;
  }
  function veNiem(g, x, y, r) {
    g.save();
    g.shadowColor = 'rgba(40, 12, 8, .45)'; g.shadowBlur = 16; g.shadowOffsetY = 6;
    const n = 26;
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, am = (a0 + a1) / 2;
      if (!i) g.moveTo(x + Math.cos(a0) * r * 0.885, y + Math.sin(a0) * r * 0.885);
      g.quadraticCurveTo(x + Math.cos(am) * r, y + Math.sin(am) * r, x + Math.cos(a1) * r * 0.885, y + Math.sin(a1) * r * 0.885);
    }
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.05, x, y, r * 1.05);
    gr.addColorStop(0, '#F8EBC6'); gr.addColorStop(0.4, '#D8B676'); gr.addColorStop(0.75, '#A9834A'); gr.addColorStop(1, '#7A5A2E');
    g.fillStyle = gr;
    g.fill();
    g.restore();
    g.strokeStyle = 'rgba(122, 90, 46, .6)'; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, r * 0.74, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#5E4420';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    chuVua(g, 'T&A', Math.round(r * 0.7), co => `400 ${co}px Ephesis, cursive`, r * 1.1);
    g.fillText('T&A', x, y + r * 0.04);
    g.textBaseline = 'alphabetic';
  }
  function chuVua(g, chu, coGoc, kieu, rong) {
    let co = coGoc;
    g.font = kieu(co);
    const w = g.measureText(chu).width;
    if (w > rong) { co = Math.floor(co * rong / w); g.font = kieu(co); }
  }
  function veThe() {
    const ma = veMa(chuoi, 640);
    const W = 1080, tx = 150, tw = W - 300, ty = 350, th = 70 + ma.height + 170;
    const H = ty + th + 400;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');

    // Phong bì đỏ, nếp gấp đáy
    const nen = g.createLinearGradient(0, 0, W * 0.45, H);
    nen.addColorStop(0, '#AE483F'); nen.addColorStop(0.55, '#9A3A33'); nen.addColorStop(1, '#84302A');
    g.fillStyle = nen;
    g.fillRect(0, 0, W, H);
    g.save();
    g.shadowColor = 'rgba(50, 10, 8, .4)'; g.shadowBlur = 22; g.shadowOffsetY = -5;
    g.fillStyle = '#A0403A';
    g.beginPath(); g.moveTo(0, H); g.lineTo(W / 2, H * 0.5); g.lineTo(W, H); g.closePath(); g.fill();
    g.restore();
    const nhu = nhuVang(g, 0, W);
    g.strokeStyle = nhu;
    g.lineWidth = 3; g.strokeRect(34, 34, W - 68, H - 68);
    g.lineWidth = 1.2; g.strokeRect(48, 48, W - 96, H - 96);

    g.textAlign = 'center';
    g.fillStyle = nhu;
    chuVua(g, CFG.tenDoi, 104, co => `400 ${co}px Ephesis, cursive`, 900);
    g.fillText(CFG.tenDoi, W / 2, 196);
    g.fillStyle = '#F2DDB0';
    g.font = 'italic 400 40px "EB Garamond", Georgia, serif';
    g.fillText(CFG.dongNgay, W / 2, 262);

    // Thiệp ngà chứa mã
    g.save();
    g.shadowColor = 'rgba(40, 10, 6, .45)'; g.shadowBlur = 40; g.shadowOffsetY = 18;
    g.fillStyle = NEN_MA;
    g.fillRect(tx, ty, tw, th);
    g.restore();
    g.strokeStyle = 'rgba(169, 132, 78, .6)'; g.lineWidth = 1.5;
    g.strokeRect(tx + 14, ty + 14, tw - 28, th - 28);
    g.imageSmoothingEnabled = false;
    g.drawImage(ma, Math.round((W - ma.width) / 2), ty + 70);
    g.imageSmoothingEnabled = true;
    veNiem(g, W / 2, ty, 60);

    const nhan = TK[chon];
    let y = ty + 70 + ma.height + 62;
    g.fillStyle = '#3B3536';
    g.font = '600 50px "EB Garamond", Georgia, serif';
    g.fillText(nhan.chuTk, W / 2, y);
    y += 62;
    const a = nhan.nganHang + '  ', b = nhan.soTk;
    g.font = 'italic 400 40px "EB Garamond", Georgia, serif';
    const wa = g.measureText(a).width;
    g.font = '500 42px "EB Garamond", Georgia, serif';
    const wb = g.measureText(b).width;
    g.textAlign = 'left';
    g.fillStyle = '#675E60';
    g.font = 'italic 400 40px "EB Garamond", Georgia, serif';
    g.fillText(a, (W - wa - wb) / 2, y);
    g.fillStyle = '#2C3A5E';
    g.font = '500 42px "EB Garamond", Georgia, serif';
    g.fillText(b, (W - wa - wb) / 2 + wa, y);
    g.textAlign = 'center';

    // Lời chúc ghi tay trên phong bì
    y = ty + th + 130;
    g.fillStyle = nhu;
    chuVua(g, CFG.loiChuc[loi], 92, co => `400 ${co}px Ephesis, cursive`, 900);
    g.fillText(CFG.loiChuc[loi], W / 2, y);
    if (ten) {
      y += 70;
      g.fillStyle = '#F2DDB0';
      chuVua(g, ten, 44, co => `italic 400 ${co}px "EB Garamond", Georgia, serif`, 860);
      g.fillText(ten, W / 2, y);
    }
    y += 66;
    g.fillStyle = 'rgba(242, 221, 176, .78)';
    g.font = 'italic 400 30px "EB Garamond", Georgia, serif';
    for (const d of xuongDong(g, 'Nội dung chuyển khoản: ' + nd, 880)) { g.fillText(d, W / 2, y); y += 40; }
    return c;
  }

  // ---------- Nút chép, nút lưu ảnh ----------
  async function chepChu(chu) {
    try { await navigator.clipboard.writeText(chu); return true; } catch (e) { /* trình duyệt trong ứng dụng chặn clipboard */ }
    const t = document.createElement('textarea');
    t.value = chu;
    t.setAttribute('readonly', '');
    t.style.cssText = 'position:fixed;left:0;top:0;opacity:0;';
    document.body.appendChild(t);
    t.select();
    t.setSelectionRange(0, chu.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { /* không chép được */ }
    t.remove();
    return ok;
  }
  function baoNut(nut, chu, ok) {
    if (!nut.dataset.goc) nut.dataset.goc = nut.textContent;
    nut.textContent = chu;
    nut.classList.toggle('xong', ok);
    clearTimeout(nut._hen);
    nut._hen = setTimeout(() => { nut.textContent = nut.dataset.goc; nut.classList.remove('xong'); }, 2000);
  }
  const bao = chu => { $('#bi-bao').textContent = chu; };

  async function luuAnh(nut) {
    if (!chuoi) return;
    nut.disabled = true;
    try {
      await Promise.race([
        Promise.all(['400 104px Ephesis', '600 50px "EB Garamond"', 'italic 400 40px "EB Garamond"', '500 42px "EB Garamond"']
          .map(f => document.fonts.load(f, 'Ngọc Ánh 0123'))),
        cho(2500)
      ]);
    } catch (e) { /* dùng font dự phòng */ }
    try {
      const blob = await new Promise(r => veThe().toBlob(r, 'image/png'));
      if (!blob) throw new Error('không tạo được ảnh');
      const tenTep = CFG.tenTep || 'mung-cuoi.png';
      const tep = new File([blob], tenTep, { type: 'image/png' });
      // Điện thoại: mở bảng chia sẻ để "Lưu hình ảnh"; máy tính: tải thẳng về
      if (matchMedia('(pointer: coarse)').matches && navigator.canShare && navigator.canShare({ files: [tep] })) {
        try {
          await navigator.share({ files: [tep] });
          bao('Mở ứng dụng ngân hàng, chọn quét mã QR và lấy ảnh vừa lưu.');
        } catch (e) { /* khách đóng bảng chia sẻ */ }
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = tenTep;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        baoNut(nut, 'Đã lưu ảnh', true);
        bao('Mở ứng dụng ngân hàng, chọn quét mã QR và lấy ảnh vừa lưu.');
      }
    } catch (e) {
      bao('Chưa lưu được ảnh. Xin nhấn giữ vào mã QR để lưu.');
    }
    nut.disabled = false;
  }

  function dung() {
    const sec = $('#mung-cuoi');
    if (!sec) return;
    if (!CFG || !window.qrcode || !TK.length) { sec.hidden = true; return; }
    $('#the-doi').textContent = CFG.goiDoi;

    const nutChon = (hang, ten, nhan) => nhan.forEach((c, i) => {
      const l = document.createElement('label');
      l.className = 'loi-o';
      l.innerHTML = `<input type="radio" name="${ten}" value="${i}"${i ? '' : ' checked'}><span></span>`;
      l.querySelector('span').textContent = c;
      hang.appendChild(l);
    });
    const hangTk = $('#hang-tk');
    nutChon(hangTk, 'gui-toi', TK.map(a => `${a.ai} ${a.ten}`));
    $('#chon-tk').hidden = TK.length < 2;
    hangTk.addEventListener('change', e => { chon = Number(e.target.value) || 0; tuChon = true; capNhat(false, true); });
    const hang = $('#hang-loi');
    nutChon(hang, 'loi-chuc', CFG.loiChuc);
    hang.addEventListener('change', e => { loi = Number(e.target.value) || 0; capNhat(true); });

    $('#bi-mo').addEventListener('click', moBi);
    addEventListener('resize', () => { if (san.classList.contains('mo')) doDat(); });
    document.querySelectorAll('.nut-chep').forEach(nut => nut.addEventListener('click', async () => {
      const ok = await chepChu(nut.dataset.chep === 'stk' ? TK[chon].soTk : nd);
      baoNut(nut, ok ? 'Đã chép' : 'Chưa chép được', ok);
    }));
    $('#nut-luu-qr').addEventListener('click', e => luuAnh(e.currentTarget));
    ve('');
  }
  dung();

  window.MungCuoi = { ve, chuoiVietQR, mo: moBi };
})();
