# Hướng dẫn sử dụng (dành cho người phụ trách chấm công)

1. Chạy `start.bat` (hoặc `node server/server.js`), mở http://localhost:3000.
2. Đăng nhập `admin@starttrain.vn` / `admin123`, rồi bấm **Đổi mật khẩu** ngay.
3. **Chấm công hằng ngày**: menu *Chấm công* → tab *Theo ngày*. Bấm **Vào ngay** khi nhân viên đến, **Ra ngay** khi về. Chấm cho cả đội một lúc bằng nút *Chấm vào cho N người chưa chấm*. Nhập sai giờ: *Sửa giờ*.
4. **Bổ sung ngày cũ**: dùng mũi tên/ô chọn ngày; ngày cũ mặc định điền giờ chuẩn, sau đó chỉnh bằng *Sửa giờ*.
5. **Nghỉ phép**: tab *Nghỉ phép* → *Ghi nhận nghỉ phép*, chọn nhân viên, loại, ngày. Những ngày này nhân viên tự hiển thị "Nghỉ phép".
6. **Bảng công tháng**: tab *Bảng công tháng*, chọn tháng, *Xuất CSV* để mở bằng Excel.
7. **Nhân sự**: thêm/sửa nhân viên, đánh dấu *Đã nghỉ việc* (dữ liệu chấm công cũ vẫn giữ).
8. **Sao lưu**: `npm run backup` (lưu vào `Archive/db-backup/`). Nên sao lưu mỗi tuần.
