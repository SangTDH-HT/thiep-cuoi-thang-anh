// Cloudflare Pages Function: link riêng ?k=... thì khung xem trước Messenger/Facebook hiện đúng tên khách.
// Trang tĩnh giữ nguyên, chỉ sửa thẻ og:title / og:description / og:url / <title> của trang chủ.

function giaiMa(k) {
  try {
    let s = k.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    const [ten, nt] = new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))).split('|');
    const t = (ten || '').replace(/[\u0000-\u001f<>]/g, '').trim().replace(/\s+/g, ' ').slice(0, 60);
    return t ? t + (nt !== '0' ? ' + NT' : '') : '';
  } catch (e) {
    return '';
  }
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const res = await context.next();
  const k = url.searchParams.get('k');
  const trangChu = url.pathname === '/' || url.pathname === '/index.html';
  if (!k || !trangChu || !(res.headers.get('content-type') || '').includes('text/html')) return res;

  const ten = giaiMa(k);
  if (!ten) return res;
  const tieuDe = `Thiệp mời gửi ${ten}`;
  const moTa = `Trân trọng kính mời ${ten} tới dự lễ thành hôn của Quang Thắng & Ngọc Ánh, 11 giờ Thứ Bảy 28.11.2026, Tầng 2 Khách sạn Sailing, Hà Tĩnh.`;
  const datNoiDung = v => ({ element(e) { e.setAttribute('content', v); } });

  return new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(`${tieuDe} · Quang Thắng & Ngọc Ánh`); } })
    .on('meta[name="description"]', datNoiDung(moTa))
    .on('meta[property="og:title"]', datNoiDung(tieuDe))
    .on('meta[property="og:description"]', datNoiDung(moTa))
    .on('meta[property="og:url"]', datNoiDung(`${url.origin}/?k=${encodeURIComponent(k)}`))
    .transform(res);
}
