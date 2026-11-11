# Yêu cầu chức năng — Trans-ers

## Vai trò
- **Người phụ trách chấm công** (tài khoản duy nhất, role `admin`): chấm công vào/ra cho từng nhân viên, ghi nhận nghỉ phép, quản lý danh sách nhân sự, xem tổng quan và bảng công.
- **Nhân viên** (14 người): chỉ là dữ liệu, **không đăng nhập**, không tự chấm công.

## Trang
1. **Tổng quan** – số liệu hôm nay (có mặt/muộn/nghỉ/chưa chấm công), tỷ lệ chuyên cần, bảng tình trạng nhân viên (lọc theo trạng thái), 7 ngày gần nhất, top đi muộn trong tháng, lịch nghỉ sắp tới.
2. **Chấm công** – 3 tab:
   - *Theo ngày*: chọn ngày, bấm Vào/Ra cho từng người (hôm nay lấy giờ hiện tại; ngày cũ lấy giờ chuẩn và có thể "Sửa giờ"), chấm vào hàng loạt.
   - *Nghỉ phép*: ghi nhận/xoá nghỉ phép cho nhân viên.
   - *Bảng công tháng*: tổng hợp theo tháng, xuất CSV.
3. **Nhân sự** – danh sách, thêm/sửa/đánh dấu nghỉ việc.

## Quy tắc nghiệp vụ
- Ngày làm việc: T2–T6. Giờ làm 09:00–18:00; muộn nếu giờ vào sau 09:15 (cấu hình trong `config.json`).
- Không chấm công cho ngày tương lai, cuối tuần, hoặc ngày nhân viên đang nghỉ phép.
- Phép năm: 12 ngày/năm/người; bản ghi "Phép năm" không được vượt số còn lại. Nghỉ phép do người phụ trách ghi nhận nên có hiệu lực ngay.
