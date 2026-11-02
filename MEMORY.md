# MEMORY — Bối cảnh & quyết định dự án

## Người dùng / bối cảnh
- Công ty ~20 nhân sự, muốn web app chấm công + nghỉ phép + quản lý nhân sự, chạy localhost để xem thử trước.
- Ban đầu muốn chibi trên sơ đồ văn phòng; **đã bỏ (2026-11-02)** — muốn giao diện chuyên nghiệp, không chibi/hoạt hình.
- Giao diện tham chiếu hiện tại: template "Architeq" (nền sáng ấm, menu ngang, nút đen pill, accent xanh lá, panel tối bo góc). Ảnh "teid." là mẫu v1 (đã lưu trữ).

## Quyết định (2026-11-02)
- Stack: **Node thuần + JSON file + vanilla JS SPA**, không phụ thuộc npm → chạy ngay, dễ sửa. Khi cần mở rộng có thể chuyển SQLite/Supabase.
- 3 trang: Tổng quan (hero + vòng tỷ lệ chuyên cần + panel số liệu + bảng tình trạng nhân sự), Chấm công & Nghỉ phép, Quản lý nhân sự (admin).
- UI v2 thay UI v1 (chibi). Bản cũ lưu ở `Archive/ban-cu/ui-v1-chibi/`.
- Phép năm mặc định 12 ngày/người; chỉ tính ngày làm việc T2–T6, chưa tính ngày lễ.

## Trạng thái
- [x] Đăng nhập, phân quyền admin/nhân viên
- [x] Dashboard + sơ đồ văn phòng
- [x] Chấm công vào/ra, lịch tháng, thống kê
- [x] Xin/huỷ nghỉ phép; admin duyệt/từ chối
- [x] CRUD nhân viên, bảng công tháng

## TODO / ý tưởng tiếp
- [ ] Ngày lễ công ty (trừ khỏi ngày làm việc)
- [ ] Chống chấm hộ: kiểm tra IP/Wi-Fi công ty, hoặc mã QR
- [ ] Xuất bảng công ra Excel/CSV; chọn tháng ở tab Bảng công
- [ ] Nhập nhân viên hàng loạt từ CSV (mẫu ở `Template/Du-lieu/`)
- [ ] Người dùng tự đổi mật khẩu trên UI (API `/api/password` đã có)
- [ ] Thông báo (email/Zalo) khi có đơn nghỉ phép
