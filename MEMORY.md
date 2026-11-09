# MEMORY — Bối cảnh & quyết định dự án

## Người dùng / bối cảnh
- Công ty **Starttrain**, 14 nhân viên (file `Employee.xlsx`: Tên + Chức vụ, không có email/phòng ban/SĐT).
- **Chỉ một người chịu trách nhiệm chấm công** trên web; nhân viên khác không tự chấm công (quyết định 2026-11-02).
- Ban đầu muốn chibi trên sơ đồ văn phòng; **đã bỏ** — muốn giao diện chuyên nghiệp, không chibi/hoạt hình.
- Giao diện tham chiếu: template "Architeq" (nền sáng ấm, menu ngang, nút đen pill, accent xanh lá, panel tối bo góc).
- Repo GitHub: https://github.com/fuku-tn/cham-cong (repo riêng tư; bản Starttrain đã push ở commit 07d5a9c, thay đổi giờ làm 9h–18h + config.json + sao lưu tự động chờ commit).

## Quyết định
- Stack: **Node thuần + JSON file + vanilla JS SPA**, không phụ thuộc npm. Khi cần mở rộng có thể chuyển SQLite/Supabase.
- 3 trang: Tổng quan, Chấm công (tab: theo ngày / nghỉ phép / bảng công tháng + xuất CSV), Nhân sự (CRUD).
- Chỉ có 1 tài khoản đăng nhập (`admin@starttrain.vn`); nhân viên không có tài khoản. Bỏ luồng "nhân viên gửi đơn → duyệt": người phụ trách ghi nhận nghỉ phép trực tiếp.
- Bỏ khái niệm phòng ban (file Excel không có). Phép năm mặc định 12 ngày/người, chỉ tính T2–T6, chưa tính ngày lễ.
- Giờ làm **09:00–18:00** (người dùng xác nhận 2026-11-02), lưu ở `config.json`.
- Triển khai: người dùng đẩy lên GitHub (repo riêng tư), người phụ trách tải về và chạy localhost trên máy họ. Dữ liệu chấm công lưu `data/db.json` trên máy đó (không lên git), tự sao lưu hằng ngày. `data/employees.json` (tên+chức vụ) được commit để máy mới có sẵn danh sách; `Employee.xlsx` và `db.json` thì không.
- Dữ liệu demo cũ (20 người giả) đã thay hoàn toàn bằng 14 nhân viên thật.

- Cơ chế cập nhật (2026-11-02): người dùng nhận repo từ bên khác để kéo về; web tự báo bản mới, bấm là mở terminal chạy `update.bat`. Đã thử bằng repo giả cục bộ (phát hiện bản mới + git pull OK); **chưa thử** nút bấm mở terminal trên giao diện thật.

- Xuất CSV theo tháng vào `data/` (2026-11-02), tự cập nhật sau mỗi lần lưu; một chiều (db.json là nguồn gốc).
- Sự cố 2026-11-02: khi thử tính năng CSV mình lỡ chạy API thử trên DB thật và xoá bản ghi chấm công của một nhân viên (09:00, chưa giờ ra). Đã khôi phục từ `Archive/db-backup/db-2026-11-02.json` và đối chiếu khớp. Quy ước mới: không test trên DB thật.

## Cần xác nhận với người dùng
- Dữ liệu Excel có vài chỗ nghi sai/lạ, **đang giữ nguyên văn**: "Chuyên **vien** quản lý cơ sở vật chất" (viên?), "Nhân viên **gắng tạo**" (gia công / lắp ráp?), "**Siri**", "An ninh web". (Từ 2026-11-09 tên nhân viên trong `data/employees.json` và DB đã được thay bằng tên giả lập theo yêu cầu người dùng.)
- Ân hạn đi muộn (hiện 15 phút: muộn sau 09:15) và có làm thứ Bảy không.
- Ai là người phụ trách chấm công (tên hiển thị tài khoản hiện là "Quản trị Starttrain").

## TODO / ý tưởng tiếp
- [ ] Ngày lễ công ty (trừ khỏi ngày làm việc)
- [ ] Cấu hình giờ làm trong giao diện (hiện sửa `config.json`)
- [ ] Nhập nhân viên từ Excel ngay trên web (hiện dùng script Python)
- [ ] Ghi chú theo ngày (làm nửa ngày, đi công tác…)
- [ ] Chuyển dữ liệu giữa các máy (xuất/nhập) nếu đổi người phụ trách
