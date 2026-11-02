# Yêu cầu chức năng

## Vai trò
- **Nhân viên**: đăng nhập, xem Dashboard, chấm công vào/ra, xem lịch công tháng, xin/huỷ nghỉ phép.
- **Quản trị (HR)**: tất cả quyền trên + quản lý nhân viên, duyệt/từ chối nghỉ phép, xem bảng công tháng.

## Trang
1. **Tổng quan** – số liệu hôm nay (có mặt/muộn/nghỉ/chưa chấm công), bảng tình trạng nhân sự (lọc theo phòng ban), thống kê phòng ban, xu hướng 7 ngày, lịch nghỉ sắp tới.
2. **Chấm công & Nghỉ phép** – đồng hồ + nút chấm công, lịch tháng màu theo trạng thái, phép năm còn lại, danh sách đơn.
3. **Quản lý nhân sự** (admin) – danh sách/thêm/sửa/nghỉ việc, duyệt phép, bảng công tháng.

## Quy tắc nghiệp vụ
- Ngày làm việc: T2–T6. Muộn nếu chấm vào sau 08:45.
- Phép năm: 12 ngày/năm/người; đơn "Phép năm" không được vượt số còn lại.
- Đơn nghỉ: trạng thái `pending → approved | rejected`; chỉ huỷ được khi `pending`.
- Người đang nghỉ phép đã duyệt không chấm công được trong các ngày đó.
