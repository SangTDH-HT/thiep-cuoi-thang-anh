// Mừng cưới: mã VietQR (chuẩn EMVCo của NAPAS) vẽ ngay trên máy khách, không gọi dịch vụ ngoài.
// Nội dung chuyển khoản = tên khách (bỏ dấu) + lời chúc. Cấu hình tài khoản ở config.js, mục mungCuoi.
(function () {
  'use strict';

  const CFG = (window.THIEP && window.THIEP.mungCuoi) || null;
  const $ = s => document.querySelector(s);
  const cho = ms => new Promise(r => setTimeout(r, ms));
  const MAU_MA = '#2A2425';

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
  function chuoiVietQR(nd) {
    const tk = tlv('00', 'A000000727') + tlv('01', tlv('00', CFG.bin) + tlv('01', CFG.soTk)) + tlv('02', 'QRIBFTTA');
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
  function noiDung(ten) {
    let t = boDau(ten);
    if (t.length > 32) {
      const c = t.slice(0, 33);
      t = c.includes(' ') ? c.slice(0, c.lastIndexOf(' ')) : t.slice(0, 32);
    }
    return t ? `${t} ${CFG.loiChuc}` : CFG.loiChucKhongTen;
  }

  // ---------- Vẽ mã ----------
  function veMa(chuoi, px) {
    const q = qrcode(0, 'M');
    q.addData(chuoi, 'Byte');
    q.make();
    const n = q.getModuleCount(), le = 4, o = Math.max(2, Math.floor(px / (n + le * 2)));
    const c = document.createElement('canvas');
    c.width = c.height = (n + le * 2) * o;
    const g = c.getContext('2d');
    g.fillStyle = '#FFFFFF';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = MAU_MA;
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) g.fillRect((k + le) * o, (r + le) * o, o, o);
    return c;
  }

  let ndHienTai = null, chuoiHienTai = '';
  function ve(ten) {
    if (!CFG || !window.qrcode) return;
    const nd = noiDung(ten);
    if (nd === ndHienTai) return;
    ndHienTai = nd;
    chuoiHienTai = chuoiVietQR(nd);
    $('#anh-qr').src = veMa(chuoiHienTai, 640).toDataURL('image/png');
    $('#nd-ck').textContent = nd;
  }

  // ---------- Ảnh để lưu: thẻ mừng cưới có mã, tên chủ tài khoản, nội dung ----------
  function xuongDong(g, chu, rong) {
    const tu = chu.split(' '), dong = [];
    let d = '';
    for (const t of tu) {
      const thu = d ? d + ' ' + t : t;
      if (d && g.measureText(thu).width > rong) { dong.push(d); d = t; } else d = thu;
    }
    if (d) dong.push(d);
    return dong;
  }
  function veTim(g, x, y, r) {
    g.beginPath();
    g.moveTo(x, y + r * 0.9);
    g.bezierCurveTo(x - r * 1.4, y - r * 0.05, x - r * 0.75, y - r * 1.1, x, y - r * 0.4);
    g.bezierCurveTo(x + r * 0.75, y - r * 1.1, x + r * 1.4, y - r * 0.05, x, y + r * 0.9);
    g.fill();
  }
  function veThe() {
    const W = 1080, H = 1560;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#EEF0F3';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(169, 132, 78, .7)';
    g.lineWidth = 2.5; g.strokeRect(34, 34, W - 68, H - 68);
    g.lineWidth = 1.2; g.strokeRect(46, 46, W - 92, H - 92);

    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.fillStyle = '#7E5F33';
    let co = 108;
    g.font = `400 ${co}px Ephesis, cursive`;
    const doi = CFG.tenDoi;
    const rongDoi = g.measureText(doi).width;
    if (rongDoi > 900) { co = Math.floor(co * 900 / rongDoi); g.font = `400 ${co}px Ephesis, cursive`; }
    g.fillText(doi, W / 2, 196);
    g.fillStyle = '#675E60';
    g.font = 'italic 400 40px "EB Garamond", Georgia, serif';
    g.fillText(CFG.dongNgay, W / 2, 262);

    // Tờ giấy trắng chứa mã
    const ts = 800, tx = (W - ts) / 2, ty = 310;
    g.save();
    g.shadowColor = 'rgba(60, 45, 30, .22)'; g.shadowBlur = 30; g.shadowOffsetY = 12;
    g.fillStyle = '#FFFFFF';
    g.fillRect(tx, ty, ts, ts);
    g.restore();
    g.strokeStyle = 'rgba(169, 132, 78, .55)'; g.lineWidth = 1.5;
    g.strokeRect(tx + 14, ty + 14, ts - 28, ts - 28);
    const ma = veMa(chuoiHienTai, 740);
    g.imageSmoothingEnabled = false;
    g.drawImage(ma, Math.round(tx + (ts - ma.width) / 2), Math.round(ty + (ts - ma.height) / 2));

    let y = ty + ts + 92;
    g.fillStyle = '#3B3536';
    g.font = '600 52px "EB Garamond", Georgia, serif';
    g.fillText(CFG.chuTk, W / 2, y);
    y += 58;
    g.fillStyle = '#675E60';
    g.font = 'italic 400 38px "EB Garamond", Georgia, serif';
    g.fillText(`Ngân hàng ${CFG.nganHang}`, W / 2, y);
    y += 62;
    g.fillStyle = '#2C3A5E';
    g.font = '500 46px "EB Garamond", Georgia, serif';
    g.fillText(`Số tài khoản ${CFG.soTk}`, W / 2, y);
    y += 46;
    g.fillStyle = '#B8433C';
    veTim(g, W / 2, y, 13);
    y += 62;
    g.fillStyle = '#675E60';
    g.font = 'italic 400 36px "EB Garamond", Georgia, serif';
    for (const d of xuongDong(g, `Nội dung: ${ndHienTai}`, 860)) { g.fillText(d, W / 2, y); y += 46; }
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
    const nhan = nut.querySelector('.chu-nut') || nut;
    if (!nut.dataset.goc) nut.dataset.goc = nhan.textContent;
    nhan.textContent = chu;
    nut.classList.toggle('xong', ok);
    clearTimeout(nut._hen);
    nut._hen = setTimeout(() => { nhan.textContent = nut.dataset.goc; nut.classList.remove('xong'); }, 2000);
  }

  async function luuAnh(nut) {
    if (!chuoiHienTai) return;
    nut.disabled = true;
    try {
      await Promise.race([
        Promise.all(['400 108px Ephesis', '600 52px "EB Garamond"', 'italic 400 38px "EB Garamond"', '500 46px "EB Garamond"']
          .map(f => document.fonts.load(f, 'Ngọc Ánh 0123'))),
        cho(2500)
      ]);
    } catch (e) { /* dùng font dự phòng */ }
    try {
      const c = veThe();
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      if (!blob) throw new Error('không tạo được ảnh');
      const ten = CFG.tenTep || 'mung-cuoi.png';
      const tep = new File([blob], ten, { type: 'image/png' });
      // Điện thoại: mở bảng chia sẻ để "Lưu hình ảnh"; máy tính: tải thẳng về
      if (matchMedia('(pointer: coarse)').matches && navigator.canShare && navigator.canShare({ files: [tep] })) {
        try { await navigator.share({ files: [tep] }); } catch (e) { /* khách đóng bảng chia sẻ */ }
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = ten;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        baoNut(nut, 'Đã tải ảnh về máy', true);
      }
    } catch (e) {
      baoNut(nut, 'Chưa lưu được, xin nhấn giữ vào mã', false);
    }
    nut.disabled = false;
  }

  function dung() {
    const sec = $('#mung-cuoi');
    if (!sec) return;
    if (!CFG || !window.qrcode) { sec.hidden = true; return; }
    $('#chu-tk').textContent = CFG.chuTk;
    $('#ngan-hang').textContent = `Ngân hàng ${CFG.nganHang}`;
    $('#so-tk').textContent = CFG.soTk;
    $('#anh-qr').alt = `Mã QR chuyển khoản ${CFG.nganHang} tới ${CFG.chuTk}`;
    document.querySelectorAll('.nut-chep').forEach(nut => nut.addEventListener('click', async () => {
      const chu = $('#' + nut.dataset.chep).textContent.trim();
      const ok = await chepChu(chu);
      baoNut(nut, ok ? 'Đã chép' : 'Chưa chép được', ok);
    }));
    $('#nut-luu-qr').addEventListener('click', e => luuAnh(e.currentTarget));
    ve('');
  }
  dung();

  window.MungCuoi = { ve, noiDung, chuoiVietQR };
})();
