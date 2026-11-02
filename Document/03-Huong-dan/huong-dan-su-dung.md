# Hướng dẫn sử dụng (dành cho người phụ trách chấm công)

1. Chạy `start.bat` (hoặc `node server/server.js`), mở http://localhost:8899.
2. Đăng nhập `admin@starttrain.vn` / `admin123`, rồi bấm **Đổi mật khẩu** ngay.
3. **Chấm công hằng ngày**: menu *Chấm công* → tab *Theo ngày*. Bấm **Vào ngay** khi nhân viên đến, **Ra ngay** khi về. Chấm cho cả đội một lúc bằng nút *Chấm vào cho N người chưa chấm*. Nhập sai giờ: *Sửa giờ*.
4. **Bổ sung ngày cũ**: dùng mũi tên/ô chọn ngày; ngày cũ mặc định điền giờ chuẩn, sau đó chỉnh bằng *Sửa giờ*.
5. **Nghỉ phép**: tab *Nghỉ phép* → *Ghi nhận nghỉ phép*, chọn nhân viên, loại, ngày. Những ngày này nhân viên tự hiển thị "Nghỉ phép".
6. **Bảng công tháng**: tab *Bảng công tháng*, chọn tháng, *Xuất CSV* để mở bằng Excel.
7. **Nhân sự**: thêm/sửa nhân viên, đánh dấu *Đã nghỉ việc* (dữ liệu chấm công cũ vẫn giữ).
8. **Dữ liệu nằm ở đâu**: file `data/db.json` trên chính máy đang chạy. Ngoài ra mỗi tháng có một file Excel/CSV `data/cham-cong-YYYY-MM.csv` tự cập nhật sau mỗi lần chấm công (chỉ để xem, đóng file Excel trước khi chấm công tiếp). Server tự sao lưu mỗi ngày vào `Archive/db-backup/` (30 bản gần nhất). Nên chép thư mục `data/` và `Archive/db-backup/` ra USB/Drive định kỳ.
10. **Cập nhật phiên bản**: khi thấy thanh "Có phiên bản mới" ở đầu trang, bấm *Cập nhật ngay* và chờ cửa sổ terminal chạy xong (dữ liệu được sao lưu và giữ nguyên).
9. **Giờ làm việc**: sửa `config.json` rồi chạy lại server.
