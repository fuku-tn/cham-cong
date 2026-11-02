# MEMORY — Bối cảnh & quyết định dự án

## Người dùng / bối cảnh
- Công ty **Starttrain**, 14 nhân viên (file `Employee.xlsx`: Tên + Chức vụ, không có email/phòng ban/SĐT).
- **Chỉ một người chịu trách nhiệm chấm công** trên web; nhân viên khác không tự chấm công (quyết định 2026-11-02).
- Ban đầu muốn chibi trên sơ đồ văn phòng; **đã bỏ** — muốn giao diện chuyên nghiệp, không chibi/hoạt hình.
- Giao diện tham chiếu: template "Architeq" (nền sáng ấm, menu ngang, nút đen pill, accent xanh lá, panel tối bo góc).
- Repo GitHub: https://github.com/fuku-tn/cham-cong (commit đầu 2026-11-02 là bản demo 20 người; bản Starttrain chưa commit).

## Quyết định
- Stack: **Node thuần + JSON file + vanilla JS SPA**, không phụ thuộc npm. Khi cần mở rộng có thể chuyển SQLite/Supabase.
- 3 trang: Tổng quan, Chấm công (tab: theo ngày / nghỉ phép / bảng công tháng + xuất CSV), Nhân sự (CRUD).
- Chỉ có 1 tài khoản đăng nhập (`admin@starttrain.vn`); nhân viên không có tài khoản. Bỏ luồng "nhân viên gửi đơn → duyệt": người phụ trách ghi nhận nghỉ phép trực tiếp.
- Bỏ khái niệm phòng ban (file Excel không có). Phép năm mặc định 12 ngày/người, chỉ tính T2–T6, chưa tính ngày lễ.
- Dữ liệu thật (`Employee.xlsx`, `data/`) bị gitignore để không lộ lên GitHub.
- Dữ liệu demo cũ (20 người giả) đã thay hoàn toàn bằng 14 nhân viên thật.

## Cần xác nhận với người dùng
- Dữ liệu Excel có vài chỗ nghi sai/lạ, **đang giữ nguyên văn**: "Chuyên **vien** quản lý cơ sở vật chất" (viên?), "Nhân viên **gắng tạo**" (gia công / lắp ráp?), "**Siri**" (Tạ Thị Thiên Thanh), "An ninh web".
- Giờ làm thật của công ty (hiện mặc định 08:30 / muộn sau 08:45 / ra 17:30), có làm thứ Bảy không.
- Ai là người phụ trách chấm công (tên hiển thị tài khoản hiện là "Quản trị Starttrain").

## TODO / ý tưởng tiếp
- [ ] Ngày lễ công ty (trừ khỏi ngày làm việc)
- [ ] Cấu hình giờ làm trong giao diện (hiện sửa trong `settings` của db.json)
- [ ] Nhập nhân viên từ Excel ngay trên web (hiện dùng script Python)
- [ ] Ghi chú theo ngày (làm nửa ngày, đi công tác…)
- [ ] Sao lưu tự động hằng ngày
- [ ] Commit/push bản Starttrain lên GitHub (chờ người dùng yêu cầu)
