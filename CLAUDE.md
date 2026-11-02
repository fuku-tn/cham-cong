# CLAUDE.md — Hướng dẫn cho Claude khi làm việc trong dự án này

## Dự án
Web app **Chấm công – Nghỉ phép – Quản lý nhân sự** cho công ty ~20 người. Chạy localhost, giao diện tiếng Việt, phong cách xanh lá (tham chiếu mẫu "teid.").
Giao diện v2 (từ 2026-11-02): phong cách chuyên nghiệp theo template "Architeq" — nền sáng ấm, menu ngang, nút đen bo tròn, điểm nhấn xanh lá, panel tối. **Không dùng chibi / hoạt hình / emoji.** Biểu tượng dùng SVG line icon (`PATHS` trong `public/js/app.js`).

## Chạy
- `node server/server.js` hoặc `start.bat` → http://localhost:3000
- Không cần `npm install` (Node thuần, không phụ thuộc thư viện).
- Demo: `admin@company.vn / admin123`; nhân viên `nv02@company.vn … nv20@company.vn / 123456`.
- `npm run backup` sao lưu DB vào `Archive/db-backup/`; `npm run reset-data` tạo lại dữ liệu mẫu.

## Cấu trúc thư mục
| Thư mục / file | Mục đích |
|---|---|
| `server/server.js` | HTTP server + toàn bộ API (`/api/*`) + phục vụ file tĩnh |
| `server/seed.js` | Sinh dữ liệu mẫu 20 nhân sự lần chạy đầu |
| `public/` | Frontend SPA (`index.html`, `css/style.css`, `js/app.js`) |
| `data/db.json` | CSDL file JSON (tự sinh, không commit) |
| `Document/` | Tài liệu: yêu cầu, thiết kế, hướng dẫn |
| `Template/` | Biểu mẫu: đơn nghỉ phép, thông báo, CSV nhập nhân viên |
| `Archive/` + `ARCHIVE.md` | Bản sao lưu DB, bản cũ, và nhật ký các thứ đã lưu trữ |
| `MEMORY.md` | Quyết định, bối cảnh, việc cần làm — cập nhật sau mỗi phiên |
| `scripts/` | Tiện ích sao lưu / reset dữ liệu |

## Quy ước
- Giao tiếp và UI bằng **tiếng Việt**; code/identifier tiếng Anh.
- Không thêm thư viện ngoài nếu chưa cần; giữ backend là một file dễ đọc.
- Vai trò: `admin` (xem/sửa nhân sự, duyệt phép, bảng công) và `employee` (chấm công, xin phép của mình).
- Mật khẩu băm bằng scrypt; **không** trả `passwordHash/salt` ra API (dùng `pub()`).
- Giờ chuẩn: vào 08:30, tính muộn sau 08:45, ra 17:30 (`settings` trong DB).
- Trước khi sửa cấu trúc DB: chạy `npm run backup` và ghi vào `ARCHIVE.md`.
- Sau mỗi phiên làm việc: cập nhật `MEMORY.md` (quyết định mới, TODO).
