// Cấu hình thiệp — sửa ở đây rồi đẩy lên GitHub
window.THIEP = {
  // URL Web app của Google Apps Script (xem README.md, mục "Nối Google Sheet").
  // Để trống thì nút "Gửi xác nhận" báo chưa nối Google Sheet.
  sheetUrl: 'https://script.google.com/macros/s/AKfycbys-jaoNXd_4h9Xtx9L8dpjdY8gXkNHo0VvvhxVkrOw_RghT5nf33LR_4W-MWOo23XANg/exec',
  ngayCuoi: '2026-11-28T11:00:00+07:00',
  nhac: true, // phát nhạc khi mở thiệp
  // Nhạc nền (nhac/ chỉ đẩy lên Cloudflare, không có trên GitHub). Để trống thì dùng hộp nhạc Canon in D.
  fileNhac: 'nhac/nhac-nen.mp3',
  // Mừng cưới: mã VietQR tự ghi nội dung chuyển khoản = tên khách (bỏ dấu) + lời chúc. Bỏ cả mục thì mục Mừng cưới ẩn đi.
  mungCuoi: {
    nganHang: 'Vietcombank',
    bin: '970436',            // mã ngân hàng NAPAS của Vietcombank
    soTk: '9392431182',
    chuTk: 'Nguyễn Thị Ngọc Ánh',
    loiChuc: 'chuc mung hanh phuc',               // ghi sau tên khách, không dấu
    loiChucKhongTen: 'Chuc mung hanh phuc Thang Anh', // khi chưa biết tên khách
    tenDoi: 'Quang Thắng & Ngọc Ánh',
    dongNgay: 'Mừng cưới ngày 28 . 11 . 2026',
    tenTep: 'mung-cuoi-Thang-Anh.png'
  }
};
