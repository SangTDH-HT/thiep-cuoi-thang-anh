// Hoa khô ép vẽ bằng SVG — sinh theo hạt giống nên lần nào mở cũng ra đúng một bó.
// HoaKho.bo(opts) trả về chuỗi <svg>; mỗi cành/lá/bông có --dl (độ trễ) để CSS cho "mọc" lần lượt.
(function () {
  'use strict';

  const MAU = {
    canh: '#8C7B5A', canhDam: '#6F6146',
    la: '#8F8C66', laNhat: '#A9A47E', laDam: '#6C6A4A', laXam: '#6F7564',
    vienHoa: '#B09A7C',
    nhuy: '#C09552', nhuyDam: '#7E5E32',
    nau: '#94684A', ri: '#A9664A', riNhat: '#C48C70', hong: '#D3A895',
    vang: '#B39668', kem: '#F3ECE0', vienKem: '#B9A688', day: '#A08560'
  };

  function rng(seed) {
    return function () {
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const f = n => Math.round(n * 10) / 10;
  let soBo = 0;

  function bez(p, t) {
    const u = 1 - t;
    return [
      u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
      u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]
    ];
  }
  function bezGoc(p, t) {
    const u = 1 - t;
    const dx = 3 * u * u * (p[1][0] - p[0][0]) + 6 * u * t * (p[2][0] - p[1][0]) + 3 * t * t * (p[3][0] - p[2][0]);
    const dy = 3 * u * u * (p[1][1] - p[0][1]) + 6 * u * t * (p[2][1] - p[1][1]) + 3 * t * t * (p[3][1] - p[2][1]);
    return Math.atan2(dy, dx);
  }

  // Dải màu dùng chung trong một bó (id riêng từng bó để nhiều bó trên trang không đè nhau)
  function defs(id) {
    return `<defs>` +
      `<radialGradient id="${id}-trang"><stop offset="0" stop-color="#DCC7AE"/><stop offset=".45" stop-color="#EEE4D6"/><stop offset="1" stop-color="#F8F3EA"/></radialGradient>` +
      `<radialGradient id="${id}-be"><stop offset="0" stop-color="#C9A887"/><stop offset=".5" stop-color="#E2CDB5"/><stop offset="1" stop-color="#EFE1CF"/></radialGradient>` +
      `<radialGradient id="${id}-hong"><stop offset="0" stop-color="#C08B79"/><stop offset=".5" stop-color="#DDB5A5"/><stop offset="1" stop-color="#EDD3C7"/></radialGradient>` +
      `<linearGradient id="${id}-la" x1="0" x2="1"><stop offset="0" stop-color="${MAU.laDam}"/><stop offset="1" stop-color="${MAU.laNhat}"/></linearGradient>` +
      `<linearGradient id="${id}-laXam" x1="0" x2="1"><stop offset="0" stop-color="#565C4E"/><stop offset="1" stop-color="#8D9282"/></linearGradient>` +
      `<radialGradient id="${id}-nu" cx=".4" cy=".35"><stop offset="0" stop-color="#C98E70"/><stop offset="1" stop-color="#94573C"/></radialGradient>` +
      `</defs>`;
  }

  // ---------- Các loại bông, vẽ quanh gốc (0,0) ----------

  // Bồ công anh: tia mảnh toả tròn, đầu mỗi tia một chùm lông nhỏ
  function boCongAnh(R, r) {
    let tia = '', long = '', dau = '';
    const n = 58;
    for (let i = 0; i < n; i++) {
      if (R() < 0.08) continue;
      const a = (i / n) * Math.PI * 2 + (R() - 0.5) * 0.1;
      const l = r * (0.8 + R() * 0.2);
      const x1 = Math.cos(a) * r * 0.14, y1 = Math.sin(a) * r * 0.14;
      const x2 = Math.cos(a) * l, y2 = Math.sin(a) * l;
      tia += `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`;
      for (let j = -3; j <= 3; j++) {
        const b = a + j * 0.26, k = r * (0.13 + R() * 0.06);
        long += `M${f(x2)} ${f(y2)}l${f(Math.cos(b) * k)} ${f(Math.sin(b) * k)}`;
      }
      dau += `<circle cx="${f(x2)}" cy="${f(y2)}" r=".9"/>`;
    }
    return `<circle r="${f(r * 1.05)}" fill="#fff" opacity=".18"/>` +
      `<path d="${tia}" stroke="${MAU.vang}" stroke-width=".7" fill="none"/>` +
      `<path d="${long}" stroke="#C4AA7E" stroke-width=".45" fill="none" opacity=".85"/>` +
      `<g fill="${MAU.nhuyDam}" opacity=".55">${dau}</g>` +
      `<circle r="${f(r * 0.15)}" fill="${MAU.nau}"/><circle r="${f(r * 0.08)}" fill="${MAU.nhuyDam}"/>`;
  }

  // Ren nữ hoàng (Queen Anne's lace): tán dù, mỗi nan một chùm chấm li ti
  function renDu(R, r) {
    let nan = '', cham = '';
    const n = 10 + Math.floor(R() * 4);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * (0.1 + 0.8 * (i / (n - 1))) + (R() - 0.5) * 0.08;
      const l = r * (0.85 + R() * 0.2);
      const x = Math.cos(a) * l, y = Math.sin(a) * l * 0.8;
      nan += `M0 0Q${f(x * 0.4)} ${f(y * 0.8)} ${f(x)} ${f(y)}`;
      const m = 6 + Math.floor(R() * 4);
      for (let j = 0; j < m; j++) {
        const b = a + (j / (m - 1) - 0.5) * 1.7;
        const k = r * (0.15 + R() * 0.07);
        const cx = x + Math.cos(b) * k, cy = y + Math.sin(b) * k;
        nan += `M${f(x)} ${f(y)}L${f(cx)} ${f(cy)}`;
        const kho = R() < 0.2;
        cham += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * (0.055 + R() * 0.025))}" fill="${kho ? MAU.riNhat : MAU.kem}"/>`;
      }
    }
    return `<path d="${nan}" stroke="${MAU.canh}" stroke-width=".55" fill="none"/>` +
      `<g stroke="${MAU.vienKem}" stroke-width=".45">${cham}</g>`;
  }

  // Cúc khô: cánh thuôn có dải màu, nghiêng phối cảnh
  function cucKho(R, r, mau) {
    const n = 12 + Math.floor(R() * 5);
    const nghieng = 0.5 + R() * 0.5;
    const xoay = f(R() * 360);
    let canh = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 360 + (R() - 0.5) * 9;
      const dai = r * (0.62 + R() * 0.2) * (R() < 0.12 ? 0.7 : 1);
      const rong = r * (0.15 + R() * 0.05);
      canh += `<path transform="rotate(${f(a)})" d="M${f(r * 0.18)} 0Q${f(r * 0.3 + dai * 0.4)} ${f(-rong * 1.2)} ${f(r * 0.24 + dai)} ${f((R() - 0.5) * rong)}Q${f(r * 0.3 + dai * 0.4)} ${f(rong * 1.2)} ${f(r * 0.18)} 0Z"/>`;
    }
    let ham = '';
    for (let i = 0; i < 12; i++) {
      const a = R() * Math.PI * 2, d = R() * r * 0.22;
      ham += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(r * 0.04)}"/>`;
    }
    return `<g transform="rotate(${xoay}) scale(1 ${f(nghieng)})">` +
      `<g fill="${mau}" stroke="${MAU.vienHoa}" stroke-width=".5">${canh}</g>` +
      `<circle r="${f(r * 0.28)}" fill="${MAU.nhuy}"/><circle r="${f(r * 0.28)}" fill="none" stroke="${MAU.nhuyDam}" stroke-width=".6" opacity=".6"/>` +
      `<g fill="${MAU.nhuyDam}">${ham}</g></g>`;
  }

  // Nụ khô hình giọt
  function nu(R, s, id) {
    return `<path d="M0 0C${f(-s * 0.55)} ${f(-s * 0.4)} ${f(-s * 0.4)} ${f(-s * 1.25)} 0 ${f(-s * 1.6)}C${f(s * 0.4)} ${f(-s * 1.25)} ${f(s * 0.55)} ${f(-s * 0.4)} 0 0Z" fill="url(#${id}-nu)"/>` +
      `<path d="M0 0q${f(-s * 0.2)} ${f(-s * 0.3)} ${f(-s * 0.5)} ${f(-s * 0.6)}M0 0q${f(s * 0.2)} ${f(-s * 0.3)} ${f(s * 0.5)} ${f(-s * 0.6)}" stroke="${MAU.laDam}" stroke-width=".8" fill="none"/>`;
  }

  // Cỏ thi (yarrow): chùm hạt tròn màu gỉ sắt
  function coThi(R, r) {
    let cuong = '', hat = '';
    const mau = [MAU.ri, MAU.riNhat, MAU.hong, MAU.nau];
    for (let i = 0; i < 20; i++) {
      const a = -Math.PI * (0.06 + 0.88 * R());
      const d = r * (0.35 + R() * 0.65);
      const x = Math.cos(a) * d, y = Math.sin(a) * d * 0.62;
      cuong += `M0 ${f(r * 0.35)}L${f(x)} ${f(y)}`;
      hat += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * (0.11 + R() * 0.07))}" fill="${mau[i % 4]}"/>`;
    }
    return `<path d="${cuong}" stroke="${MAU.canh}" stroke-width=".5" fill="none"/>${hat}`;
  }

  // Bi bi (baby's breath): nhánh rẽ, đầu nhánh chấm trắng
  function chumBiBi(R, r) {
    let d = '', cham = '';
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * (0.12 + 0.76 * (i / (n - 1))) + (R() - 0.5) * 0.2;
      const l = r * (0.5 + R() * 0.5);
      const x = Math.cos(a) * l, y = Math.sin(a) * l;
      d += `M0 0Q${f(x * 0.3)} ${f(y * 0.8)} ${f(x)} ${f(y)}`;
      for (let j = 0; j < 3; j++) {
        const b = a + (j - 1) * 0.6 + (R() - 0.5) * 0.3, k = r * (0.15 + R() * 0.12);
        const cx = x + Math.cos(b) * k, cy = y + Math.sin(b) * k;
        d += `M${f(x)} ${f(y)}L${f(cx)} ${f(cy)}`;
        cham += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(1.4 + R() * 1.2)}"/>`;
      }
    }
    return `<path d="${d}" stroke="${MAU.canh}" stroke-width=".5" fill="none"/>` +
      `<g fill="${MAU.kem}" stroke="${MAU.vienKem}" stroke-width=".45">${cham}</g>`;
  }

  // Lá thon (vẽ dọc trục +x); rong = true cho lá bạch đàn xám rộng bản
  function la(R, dai, rong, id, xam) {
    const cong = (R() - 0.5) * rong * 0.8;
    return `<path d="M0 0Q${f(dai * 0.35)} ${f(-rong + cong)} ${f(dai)} ${f(cong * 0.5)}Q${f(dai * 0.45)} ${f(rong + cong)} 0 0Z" fill="url(#${id}-${xam ? 'laXam' : 'la'})" opacity="${xam ? '.88' : '.92'}"/>` +
      `<path d="M0 0Q${f(dai * 0.5)} ${f(cong * 0.4)} ${f(dai * 0.92)} ${f(cong * 0.45)}" stroke="${xam ? '#4B5044' : MAU.laDam}" stroke-width=".5" fill="none" opacity=".7"/>`;
  }

  const VE = {
    boCongAnh: (R, s) => boCongAnh(R, 40 * s),
    renDu: (R, s) => renDu(R, 28 * s),
    cuc: (R, s, id) => cucKho(R, 18 * s, `url(#${id}-trang)`),
    cucBe: (R, s, id) => cucKho(R, 15 * s, `url(#${id}-be)`),
    cucHong: (R, s, id) => cucKho(R, 13 * s, `url(#${id}-hong)`),
    nu: (R, s, id) => nu(R, 8 * s, id),
    coThi: (R, s) => coThi(R, 18 * s),
    biBi: (R, s) => chumBiBi(R, 26 * s)
  };
  const CO = { boCongAnh: 42, renDu: 30, cuc: 26, cucBe: 22, cucHong: 19, nu: 11, coThi: 20, biBi: 24 };

  // ---------- Bó hoa ----------
  // opts: w, h, goc [x,y] (nơi các cành chụm), vung {cx,cy,rx,ry} (vùng đặt bông),
  //       so (số bông), loai {ten: trọng số}, tiLe, hat (hạt giống), buoc (có dây buộc), tre (trễ đầu, giây)
  function bo(opts) {
    const o = Object.assign({ w: 400, h: 500, so: 14, tiLe: 1, hat: 7, buoc: false, tre: 0, nhip: 0.06, canhDai: 1.1, laRong: 3, la: true }, opts);
    const R = rng(o.hat);
    const id = 'hk' + (++soBo);
    const loai = o.loai || { renDu: 3, cuc: 4, cucBe: 3, cucHong: 2, nu: 4, coThi: 2, biBi: 3 };
    const tenLoai = Object.keys(loai);
    const tong = tenLoai.reduce((s, k) => s + loai[k], 0);
    const chonLoai = () => {
      let x = R() * tong;
      for (const k of tenLoai) { x -= loai[k]; if (x <= 0) return k; }
      return tenLoai[0];
    };

    // Đặt bông trong vùng elip, giữ khoảng cách tối thiểu
    const bong = [];
    const bca = o.boCongAnh === false ? [] : [].concat(o.boCongAnh || { dx: -0.35, dy: -0.55 });
    bca.forEach(v => bong.push({ loai: 'boCongAnh', x: o.vung.cx + o.vung.rx * v.dx, y: o.vung.cy + o.vung.ry * v.dy, s: v.s || 1 }));
    let thu = 0;
    while (bong.length < o.so && thu++ < 1500) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R());
      const x = o.vung.cx + Math.cos(a) * d * o.vung.rx;
      const y = o.vung.cy + Math.sin(a) * d * o.vung.ry;
      const k = chonLoai();
      const can = CO[k] * o.tiLe * 0.7;
      if (bong.every(b => Math.hypot(b.x - x, b.y - y) > can + CO[b.loai] * o.tiLe * 0.55)) bong.push({ loai: k, x, y });
    }

    // Cành xa nhất mọc trước, bông gần gốc mọc sau
    bong.forEach(b => { b.xa = Math.hypot(b.x - o.goc[0], b.y - o.goc[1]); });
    bong.sort((a, b) => b.xa - a.xa);

    let canhSvg = '', laSvg = '', bongSvg = '';
    const g0 = o.goc;
    const veLa = (p, t, tre, dl, xam, ben) => {
      const pt = bez(p, t);
      const huong = bezGoc(p, t) * 180 / Math.PI + ben * (26 + R() * 30);
      laSvg += `<g transform="translate(${f(pt[0])} ${f(pt[1])}) rotate(${f(huong)})"><g class="la" style="--dl:${f(tre)}s">${la(R, dl, dl * (xam ? 0.3 : 0.2), id, xam)}</g></g>`;
    };
    bong.forEach((b, i) => {
      const dx = b.x - g0[0], dy = b.y - g0[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const uon = (R() - 0.5) * len * 0.22 + (dx / len) * len * 0.08;
      const xp = (R() - 0.5) * 12 * o.tiLe;
      const p = [
        [g0[0] + xp, g0[1]],
        [g0[0] + xp + dx * 0.2 + nx * uon * 0.4, g0[1] + dy * 0.38 + ny * uon * 0.4],
        [g0[0] + dx * 0.72 + nx * uon, g0[1] + dy * 0.7 + ny * uon],
        [b.x, b.y]
      ];
      const tre = o.tre + i * o.nhip + R() * 0.1;
      const dai = o.canhDai * (0.75 + len / 900);
      const day = (b.loai === 'boCongAnh' ? 1.2 : 0.8 + R() * 0.6) * o.tiLe;
      canhSvg += `<path class="canh" pathLength="1" style="--dl:${f(tre)}s;--dt:${f(dai)}s" d="M${f(p[0][0])} ${f(p[0][1])}C${f(p[1][0])} ${f(p[1][1])} ${f(p[2][0])} ${f(p[2][1])} ${f(p[3][0])} ${f(p[3][1])}" stroke="${R() < 0.7 ? MAU.canh : MAU.canhDam}" stroke-width="${f(day)}" fill="none" stroke-linecap="round"/>`;

      const soLa = !o.la ? 0 : b.loai === 'nu' ? Math.floor(R() * 2) : 1 + Math.floor(R() * 2);
      for (let j = 0; j < soLa; j++) {
        const t = 0.3 + R() * 0.5;
        veLa(p, t, tre + t * dai, (22 + R() * 26) * o.tiLe, false, j % 2 ? 1 : -1);
      }
      // Lá xám rộng bản ở phần dưới vài cành
      if (o.laRong && i % Math.max(1, Math.round(o.so / o.laRong)) === 0) {
        const t = 0.18 + R() * 0.2;
        veLa(p, t, tre + t * dai, (34 + R() * 20) * o.tiLe, true, R() < 0.5 ? 1 : -1);
      }

      // Bông xoay theo hướng cành để đầu bông "nhìn" ra ngoài
      const huongCanh = bezGoc(p, 1) * 180 / Math.PI + 90;
      const s = o.tiLe * (b.s || (0.85 + R() * 0.4));
      const xoay = /renDu|coThi|biBi|nu/.test(b.loai) ? huongCanh * 0.7 : 0;
      bongSvg += `<g transform="translate(${f(b.x)} ${f(b.y)}) rotate(${f(xoay)})"><g class="bong${b.loai === 'boCongAnh' ? ' bca' : ''}" style="--dl:${f(tre + dai * 0.85)}s">${VE[b.loai](R, s, id)}</g></g>`;
    });

    // Cỏ khô mảnh có nụ nhỏ cho bó thêm thoáng
    const soCo = o.co ?? Math.round(o.so * 0.4);
    for (let i = 0; i < soCo; i++) {
      const a = -Math.PI * (0.05 + 0.9 * R()), d = 0.75 + R() * 0.3;
      const x = o.vung.cx + Math.cos(a) * d * o.vung.rx, y = o.vung.cy + Math.sin(a) * d * o.vung.ry;
      const dx = x - g0[0], dy = y - g0[1];
      const uon = (R() - 0.5) * 50 * o.tiLe;
      const tre = o.tre + R() * o.so * o.nhip;
      canhSvg += `<path class="canh" pathLength="1" style="--dl:${f(tre)}s;--dt:${f(o.canhDai)}s" d="M${f(g0[0])} ${f(g0[1])}Q${f(g0[0] + dx * 0.55 + uon)} ${f(g0[1] + dy * 0.45)} ${f(x)} ${f(y)}" stroke="${MAU.laNhat}" stroke-width="${f(0.6 * o.tiLe)}" fill="none" stroke-linecap="round"/>`;
      bongSvg += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(Math.atan2(dy, dx) * 180 / Math.PI + 90)})"><g class="bong" style="--dl:${f(tre + o.canhDai * 0.9)}s">${VE.nu(R, 0.55 * o.tiLe, id)}</g></g>`;
    }

    // Dây buộc ở gốc bó
    let daySvg = '';
    if (o.buoc) {
      const [bx, by] = o.goc, k = o.tiLe;
      let d = '';
      for (let i = 0; i < 5; i++) {
        const y = by - 30 * k + i * 4 * k;
        d += `M${f(bx - 12 * k)} ${f(y + 3)}Q${f(bx)} ${f(y - 2)} ${f(bx + 12 * k)} ${f(y - 1)}`;
      }
      d += `M${f(bx + 2)} ${f(by - 22 * k)}q${f(18 * k)} ${f(-16 * k)} ${f(24 * k)} ${f(6 * k)}q${f(-13 * k)} ${f(4 * k)} ${f(-24 * k)} ${f(-6 * k)}` +
        `M${f(bx + 2)} ${f(by - 22 * k)}q${f(-18 * k)} ${f(-14 * k)} ${f(-22 * k)} ${f(5 * k)}q${f(12 * k)} ${f(3 * k)} ${f(22 * k)} ${f(-5 * k)}` +
        `M${f(bx + 2)} ${f(by - 22 * k)}q${f(8 * k)} ${f(20 * k)} ${f(-3 * k)} ${f(38 * k)}M${f(bx + 2)} ${f(by - 22 * k)}q${f(-4 * k)} ${f(18 * k)} ${f(8 * k)} ${f(34 * k)}`;
      daySvg = `<path class="day" pathLength="1" style="--dl:${f(o.tre + o.so * o.nhip + 0.3)}s" d="${d}" stroke="${MAU.day}" stroke-width="${f(1.1 * k)}" fill="none" stroke-linecap="round"/>`;
    }

    return `<svg class="hoa-kho" viewBox="0 0 ${o.w} ${o.h}" aria-hidden="true" focusable="false">${defs(id)}` +
      `<g>${canhSvg}</g><g>${laSvg}</g>${daySvg}<g>${bongSvg}</g></svg>`;
  }

  window.HoaKho = { bo, MAU };
})();
