# CLAUDE.md — Hướng dẫn cho Claude khi làm việc trong dự án này

## Dự án
Web app **Chấm công – Nghỉ phép – Quản lý nhân sự** cho công ty **Starttrain** (14 nhân viên thật, danh sách từ `Employee.xlsx`). Chạy localhost, giao diện tiếng Việt.

**Mô hình sử dụng: chỉ MỘT người phụ trách đăng nhập và chấm công thay cho tất cả nhân viên.** Nhân viên không có tài khoản, không tự chấm công, không tự xin nghỉ.

Giao diện v2 (theo template "Architeq"): nền sáng ấm, menu ngang, nút đen bo tròn, điểm nhấn xanh lá, panel tối. **Không dùng chibi / hoạt hình / emoji.** Biểu tượng dùng SVG line icon (`PATHS` trong `public/js/app.js`).

## Chạy
- `node server/server.js` hoặc `start.bat` → http://localhost:3000 (không cần `npm install`).
- Đăng nhập lần đầu: `admin@starttrain.vn / admin123` — **phải đổi mật khẩu** (nút "Đổi mật khẩu").
- `npm run backup` sao lưu DB vào `Archive/db-backup/`; `npm run reset-data` sao lưu rồi xoá DB (server sẽ tạo lại từ `data/employees.json`, **mất toàn bộ dữ liệu chấm công**).
- Cập nhật danh sách nhân viên từ Excel: `python scripts/import-employees.py` (đọc `Employee.xlsx`, cột A = Tên, B = Chức vụ → `data/employees.json`), rồi `npm run reset-data` và chạy lại server. Với DB đã có dữ liệu chấm công thật, nên thêm/sửa người qua trang **Nhân sự** thay vì reset.

## Cấu trúc thư mục
| Thư mục / file | Mục đích |
|---|---|
| `server/server.js` | HTTP server + toàn bộ API (`/api/*`) + phục vụ file tĩnh |
| `server/seed.js` | Khởi tạo DB: 1 tài khoản quản trị + nhân viên từ `data/employees.json` |
| `public/` | Frontend SPA (`index.html`, `css/style.css`, `js/app.js`) |
| `data/db.json` | CSDL file JSON (tự sinh) — **không commit** |
| `data/employees.json` | Danh sách nhân viên thật (từ Excel) — **không commit** |
| `Employee.xlsx` | File nguồn danh sách nhân viên — **không commit** (dữ liệu cá nhân) |
| `Document/` | Tài liệu: yêu cầu, thiết kế, hướng dẫn |
| `Template/` | Biểu mẫu: đơn nghỉ phép, thông báo, CSV |
| `Archive/` + `ARCHIVE.md` | Bản sao lưu DB, bản cũ, và nhật ký lưu trữ |
| `MEMORY.md` | Quyết định, bối cảnh, việc cần làm — cập nhật sau mỗi phiên |
| `scripts/` | Sao lưu, reset dữ liệu, nhập nhân viên từ Excel |

## Quy ước
- Giao tiếp và UI bằng **tiếng Việt**; code/identifier tiếng Anh.
- Không thêm thư viện ngoài nếu chưa cần; giữ backend là một file dễ đọc.
- Tài khoản quản trị có `staff:false` (không tính là nhân viên, không xuất hiện trong danh sách chấm công). Nhân viên có `staff:true`, không có `passwordHash`.
- Mật khẩu băm bằng scrypt; **không** trả `passwordHash/salt` ra API (dùng `pub()`).
- Giờ chuẩn: vào 08:30, tính muộn sau 08:45, ra 17:30 (`settings` trong DB) — chưa xác nhận với công ty.
- Ngày làm việc T2–T6. Không chấm công cho ngày tương lai hoặc cuối tuần.
- **Dữ liệu thật của công ty không đưa lên git** (xem `.gitignore`). Repo: https://github.com/fuku-tn/cham-cong
- Trước khi sửa cấu trúc DB: chạy `npm run backup` và ghi vào `ARCHIVE.md`.
- Sau mỗi phiên làm việc: cập nhật `MEMORY.md`.
