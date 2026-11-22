// Cấu hình thiệp — sửa ở đây rồi đẩy lên GitHub
window.THIEP = {
  // URL Web app của Google Apps Script (xem README.md, mục "Nối Google Sheet").
  // Để trống thì nút "Gửi xác nhận" báo chưa nối Google Sheet.
  sheetUrl: 'https://script.google.com/macros/s/AKfycbys-jaoNXd_4h9Xtx9L8dpjdY8gXkNHo0VvvhxVkrOw_RghT5nf33LR_4W-MWOo23XANg/exec',
  ngayCuoi: '2026-11-28T11:00:00+07:00',
  nhac: true, // phát nhạc khi mở thiệp
  // Nhạc nền (nhac/ chỉ đẩy lên Cloudflare, không có trên GitHub). Để trống thì dùng hộp nhạc Canon in D.
  fileNhac: 'nhac/nhac-nen.mp3',
  // Mừng cưới: phong bì ghi lời chúc + tên khách, mã VietQR tự ghi nội dung chuyển khoản
  // "<Tên khách> chuc Thang Anh <lời chúc>" (bỏ dấu). Bỏ cả mục thì phần Mừng cưới ẩn đi.
  mungCuoi: {
    // Tài khoản nhận (bin = mã ngân hàng NAPAS, Vietcombank 970436). Khách nhà trai mặc định gửi chú rể,
    // khách nhà gái mặc định gửi cô dâu, chưa rõ thì lấy tài khoản đầu; khách tự đổi được.
    taiKhoan: [
      { ai: 'Chú rể', ten: 'Quang Thắng', chuTk: 'Trần Mạnh Quang Thắng', nganHang: 'Vietcombank', bin: '970436', soTk: '3336386699', ben: 'Nhà trai' },
      { ai: 'Cô dâu', ten: 'Ngọc Ánh', chuTk: 'Nguyễn Thị Ngọc Ánh', nganHang: 'Vietcombank', bin: '970436', soTk: '9392431182', ben: 'Nhà gái' }
    ],
    goiDoi: 'Thắng & Ánh',
    loiChuc: ['Trăm năm hạnh phúc', 'Bên nhau đến bạc đầu', 'Ngập tràn yêu thương'], // lời đầu là lời chọn sẵn
    tenDoi: 'Quang Thắng & Ngọc Ánh',
    dongNgay: 'Mừng cưới ngày 28 . 11 . 2026',
    tenTep: 'mung-cuoi-Thang-Anh.png'
  }
};
