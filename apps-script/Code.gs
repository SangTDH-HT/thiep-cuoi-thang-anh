/**
 * Nhận xác nhận tham dự từ thiệp cưới Quang Thắng & Ngọc Ánh, ghi vào Google Sheet này.
 *
 * Cách gắn (làm một lần):
 *   1. Mở Google Sheet → Tiện ích mở rộng → Apps Script → xoá code mẫu, dán toàn bộ file này → Lưu.
 *   2. Triển khai → Tuỳ chọn triển khai mới → Loại: Ứng dụng web
 *      Thực thi dưới dạng: Tôi · Người có quyền truy cập: Bất kỳ ai → Triển khai → cấp quyền.
 *   3. Chép "URL ứng dụng web" (…/exec) dán vào sheetUrl trong config.js của thiệp.
 *
 * Mỗi máy gửi lại thì cập nhật đúng dòng cũ (theo "Mã máy"), không sinh dòng trùng.
 * Cột "Bàn số" để trống cho người xếp bàn tự điền; trang "Tổng hợp" tự cộng số người theo bàn.
 */

const TEN_BANG = 'Xác nhận';
const TEN_TONG = 'Tổng hợp';
const COT = ['Cập nhật lúc', 'Tên khách', 'Tham dự', 'Số người', 'Khách của', 'Lời nhắn', 'Link mời', 'Mã máy', 'Lần gửi', 'Bàn số'];
const COT_MA = 8, COT_LAN = 9;

function doPost(e) {
  const khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    // Gửi thử từ máy kiểm tra: chỉ xác nhận nối được, không ghi dòng nào
    if (d.thu === true) { chuanBi_(); return traVe_({ ok: true, thu: true }); }
    const ten = sach_(d.ten, 60);
    if (!ten) return traVe_({ ok: false, loi: 'Thiếu tên khách' });
    const den = d.den === 'Có' ? 'Có' : 'Không';
    const so = den === 'Có' ? Math.max(1, Math.min(20, parseInt(d.so, 10) || 1)) : 0;
    const ben = d.ben === 'Nhà trai' || d.ben === 'Nhà gái' ? d.ben : '';
    const ma = sach_(d.id, 40);

    const bang = chuanBi_();
    const hang = timHang_(bang, ma);
    const lan = hang ? (Number(bang.getRange(hang, COT_LAN).getValue()) || 1) + 1 : 1;
    const dong = [new Date(), ten, den, so, ben, sach_(d.loi, 500), sach_(d.link, 80), ma, lan];
    if (hang) bang.getRange(hang, 1, 1, dong.length).setValues([dong]);
    else bang.appendRow(dong.concat(['']));
    return traVe_({ ok: true, lan: lan });
  } catch (loi) {
    return traVe_({ ok: false, loi: String(loi) });
  } finally {
    khoa.releaseLock();
  }
}

// Chạy hàm này một lần trong trình soạn Apps Script để cấp quyền và tạo sẵn hai trang
function capQuyen() {
  chuanBi_();
}

// Mở URL /exec trên trình duyệt để kiểm tra: tạo sẵn hai trang nếu chưa có
function doGet() {
  chuanBi_();
  return traVe_({ ok: true, thongBao: 'Thiệp cưới đã nối với Google Sheet.' });
}

function traVe_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Bỏ xuống dòng, cắt độ dài, chặn chữ bắt đầu bằng = + - @ bị Sheet hiểu thành công thức
function sach_(v, dai) {
  let s = String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, dai);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function timHang_(bang, ma) {
  const cuoi = bang.getLastRow();
  if (!ma || cuoi < 2) return 0;
  const cot = bang.getRange(2, COT_MA, cuoi - 1, 1).getValues();
  for (let i = 0; i < cot.length; i++) if (String(cot[i][0]) === ma) return i + 2;
  return 0;
}

function chuanBi_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let bang = ss.getSheetByName(TEN_BANG);
  if (!bang) {
    bang = ss.getSheets().length === 1 && ss.getSheets()[0].getLastRow() === 0 ? ss.getSheets()[0].setName(TEN_BANG) : ss.insertSheet(TEN_BANG, 0);
    bang.getRange(1, 1, 1, COT.length).setValues([COT]).setFontWeight('bold').setBackground('#E2DBD0');
    bang.setFrozenRows(1);
    bang.getRange('A2:A').setNumberFormat('dd/MM/yyyy HH:mm');
    bang.getRange('D2:D').setHorizontalAlignment('center');
    bang.getRange('J2:J').setBackground('#FFF8E6').setHorizontalAlignment('center');
    [130, 190, 70, 70, 85, 280, 150, 120, 60, 60].forEach((w, i) => bang.setColumnWidth(i + 1, w));
    // Tô vàng tên trùng để dễ thấy một người gửi từ hai máy
    const quyTac = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND($B2<>"",COUNTIF($B$2:$B,$B2)>1)')
      .setBackground('#FCE8B2')
      .setRanges([bang.getRange('B2:B')])
      .build();
    bang.setConditionalFormatRules([quyTac]);
  }

  if (!ss.getSheetByName(TEN_TONG)) {
    const tong = ss.insertSheet(TEN_TONG);
    const x = "'" + TEN_BANG + "'!";
    const dong = [
      ['Tổng hợp khách dự cưới', ''],
      ['Số lượt báo sẽ đến', '=COUNTIF(' + x + 'C2:C,"Có")'],
      ['Tổng số người sẽ đến', '=SUMIF(' + x + 'C2:C,"Có",' + x + 'D2:D)'],
      ['   Khách nhà trai', '=SUMIFS(' + x + 'D2:D,' + x + 'C2:C,"Có",' + x + 'E2:E,"Nhà trai")'],
      ['   Khách nhà gái', '=SUMIFS(' + x + 'D2:D,' + x + 'C2:C,"Có",' + x + 'E2:E,"Nhà gái")'],
      ['Số lượt báo không đến', '=COUNTIF(' + x + 'C2:C,"Không")'],
      ['', ''],
      ['Số người mỗi bàn (sửa được)', 10],
      ['Số bàn cần (ước tính)', '=IF(B8>0,ROUNDUP(B3/B8,0),"")'],
      ['   Bàn nhà trai', '=IF(B8>0,ROUNDUP(B4/B8,0),"")'],
      ['   Bàn nhà gái', '=IF(B8>0,ROUNDUP(B5/B8,0),"")'],
      ['Số người chưa xếp bàn', '=SUMIFS(' + x + 'D2:D,' + x + 'C2:C,"Có",' + x + 'J2:J,"")']
    ];
    tong.getRange(1, 1, dong.length, 2).setValues(dong);
    tong.getRange('A1').setFontWeight('bold').setFontSize(13);
    tong.getRange('B2:B12').setFontWeight('bold').setHorizontalAlignment('center');
    tong.getRange('B8').setBackground('#FFF8E6');
    tong.getRange('D1:E1').setValues([['Bàn số', 'Số người']]).setFontWeight('bold').setBackground('#E2DBD0');
    tong.getRange('D2').setFormula('=IFERROR(QUERY(' + x + 'A2:J,"select J, sum(D) where C = \'Có\' and J is not null group by J label sum(D) \'\'",0),"Điền cột Bàn số ở trang Xác nhận")');
    tong.setColumnWidth(1, 230);
    tong.setColumnWidth(2, 90);
    tong.setColumnWidth(4, 90);
    tong.setColumnWidth(5, 90);
  }
  return bang;
}
