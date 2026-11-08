# Thiệp cưới Quang Thắng & Ngọc Ánh

Thiệp mời online, Thứ Bảy 28.11.2026, Tầng 2 Khách sạn Sailing, Hà Tĩnh.

- Thiệp: <https://thanganh.pages.dev/>
- Tạo link mời từng người: <https://thanganh.pages.dev/tao-link>

Thiệp chạy trên Cloudflare Pages. Link riêng `?k=` thì khung xem trước trong Messenger/Facebook hiện
"Thiệp mời gửi <tên khách>" (sửa thẻ og bằng [functions/_middleware.js](functions/_middleware.js)).
Link GitHub Pages cũ tự chuyển sang đường dẫn này.

Đẩy bản mới lên Cloudflare: `python tools/trien_khai.py` (đăng nhập một lần bằng `npx wrangler@4 login`).
Đẩy lên GitHub vẫn như thường để giữ mã nguồn.

## Gửi thiệp

Facebook không cho trang web đọc tên tài khoản của người bấm link, nên tên khách đi theo link:

- **Link riêng (gửi Messenger):** mở trang *Tạo link*, dán danh sách tên (mỗi dòng một người, ghi đúng như
  muốn hiện, ví dụ `Cô chú Hùng`), tích "+ NT", chọn Nhà gái/Nhà trai rồi bấm *Tạo link*. Mỗi người có nút
  *Chép link* và *Gửi…* (trên điện thoại mở thẳng Messenger/Zalo). Người nhận mở ra thấy
  "Trân trọng kính mời: Cô chú Hùng + NT".
- **Link chung (đăng Facebook):** khách mở ra sẽ tự gõ tên mình lên dòng chấm của thiệp.

Danh sách tên gõ ở trang *Tạo link* chỉ nằm trên máy đang dùng, không gửi đi đâu.

Chạm dấu niêm để mở thiệp: trang chuyển sang toàn màn hình (ẩn thanh địa chỉ) trên Android và máy tính.
iPhone không cho trang web tự ẩn thanh địa chỉ nên vẫn xem trong khung trình duyệt.
Gửi xác nhận xong: đóng dấu "Đã nhận", bắn pháo hoa, đếm ngược 5 giây rồi đóng trang. Trình duyệt nào không cho
trang tự đóng thì thiệp gập hai cánh lại kèm lời chào. Khách bấm *Ở lại xem thiệp* để huỷ đếm ngược.

## Google Sheet nhận xác nhận

Đã tạo sẵn bảng tính *Khách dự cưới Thắng & Ánh* trên Google Drive của chủ thiệp, script đẩy bằng `clasp`
từ thư mục `apps-script/` (`.clasp.json` chỉ nằm trên máy, không đưa lên repo).
Sửa `Code.gs` xong: `npx @google/clasp@2.4.2 push -f` rồi
`npx @google/clasp@2.4.2 deploy -i AKfycbys-jaoNXd_4h9Xtx9L8dpjdY8gXkNHo0VvvhxVkrOw_RghT5nf33LR_4W-MWOo23XANg` để giữ nguyên URL.

### Làm tay (khi cần tạo bảng tính mới)

1. Mở <https://sheets.new>, đặt tên bảng tính, ví dụ *Khách dự cưới Thắng Ánh*.
2. Menu **Tiện ích mở rộng → Apps Script**. Xoá code mẫu, dán toàn bộ [apps-script/Code.gs](apps-script/Code.gs), bấm **Lưu**.
3. **Triển khai → Tuỳ chọn triển khai mới →** bánh răng chọn **Ứng dụng web**:
   *Thực thi dưới dạng:* **Tôi**, *Người có quyền truy cập:* **Bất kỳ ai** → **Triển khai**.
4. Cấp quyền: chọn tài khoản → *Google chưa xác minh ứng dụng này* → **Nâng cao** → **Đi tới … (không an toàn)** → **Cho phép**.
   (Script chỉ ghi vào chính bảng tính này.)
5. Chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/…/exec`), dán vào `sheetUrl` trong
   [config.js](config.js), đẩy lên GitHub.

Bảng tính có hai trang:

- **Xác nhận:** mỗi khách một dòng (tên, có đến không, số người, khách nhà trai/gái, lời nhắn). Khách sửa lại
  thì cập nhật đúng dòng cũ. Tên trùng được tô vàng. Cột **Bàn số** để trống cho mình tự điền khi xếp bàn.
- **Tổng hợp:** tổng số người sẽ đến (chia nhà trai/nhà gái), số bàn ước tính theo ô *Số người mỗi bàn*,
  số người chưa xếp bàn, và bảng cộng số người theo từng bàn đã điền.

Sửa code Apps Script sau này thì phải **Triển khai → Quản lý các bản triển khai → sửa → Phiên bản mới** để URL cũ chạy code mới.

## Ảnh cưới

Ảnh gốc là bản chỉnh sửa cuối của studio Namitaly, chỉ lấy từ hai thư mục `C:\HCM_UTE\Ánh\Ảnh cưới\Album` và
`C:\HCM_UTE\Ánh\Ảnh cưới\Ảnh để trên thiệp`. `python tools/xu_ly_anh.py` (Python có Pillow) đổi hệ màu Adobe RGB của
studio sang sRGB (để nguyên thì ảnh lên web bị nhạt), xuất mỗi ảnh vài cỡ cho `srcset` (màn nét tải ảnh lớn, máy thường
tải ảnh vừa), cắt khung 4:5 sát người cho ảnh in nhỏ, làm nét nhẹ, xoá thông tin máy chụp, ghi vào `anh/` và sinh
`album.js`. Thứ tự album, khung cắt ảnh in, 3 ảnh xếp chồng và ảnh dùng riêng (mở đầu, ô vòm, lời cảm ơn) ghi bằng tên
tệp trong `tools/thu_tu_anh.json` (bảng ảnh có tên: `python tools/xu_ly_anh.py xem`). `anh/`, `album.js` và `og.jpg`
**không đưa lên GitHub**, chỉ đẩy lên Cloudflare bằng `python tools/trien_khai.py`.

## Sửa nội dung

| Muốn đổi | Sửa ở |
|---|---|
| Chữ trên thiệp (tên bố mẹ, địa chỉ, giờ) | `index.html` |
| URL Google Sheet, ngày giờ đếm ngược, bật/tắt nhạc | `config.js` |
| Ảnh hiện khi gửi link | `tools/og.html`, rồi chạy `python tools/chup_og.py` ra `og.jpg` (cần `anh/`) |

Facebook lưu ảnh xem trước một thời gian. Đổi `og.jpg` xong thì chạy lại `python tools/trien_khai.py`, dán link vào
<https://developers.facebook.com/tools/debug/> bấm *Scrape Again* để cập nhật.

Thử phần xác nhận khi chưa nối Google Sheet: thêm `?thu=1` vào cuối link (chỉ giả lập, không ghi đi đâu).

## Cấu trúc

- `index.html`, `style.css`: thiệp (bìa cửa đôi có dấu niêm T&A, lời mời, Save the Date, lịch trình, xác nhận, lời cảm ơn)
- `app.js`: tên khách từ link, mở bìa, viết tên, đếm ngược, gửi xác nhận
- `flora.js`: bó hoa khô vẽ bằng SVG theo hạt giống, mọc dần khi xuất hiện
- `hat.js`: hạt bồ công anh, vụn nhũ vàng, sao lấp lánh, tim, pháo hoa (canvas)
- `nhac.js`: hộp nhạc Canon in D tổng hợp bằng Web Audio (không cần file nhạc)
- `monogram.js`: chữ lồng T&A trên dấu niêm
- `tools/xu_ly_anh.py`, `tools/thu_tu_anh.json`: xử lý ảnh cưới cho album
- `tao-link.html`: trang tạo link mời
- `functions/_middleware.js`: Cloudflare Pages Function ghi tên khách vào khung xem trước
- `tools/trien_khai.py`: dựng `dist/` và đẩy lên Cloudflare Pages
- `apps-script/Code.gs`: nhận xác nhận, ghi Google Sheet
