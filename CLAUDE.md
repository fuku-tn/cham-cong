# CLAUDE.md — Hướng dẫn cho Claude khi làm việc trong dự án này

## Dự án
Web app **Chấm công – Nghỉ phép – Quản lý nhân sự** cho công ty **Trans-ers** (14 nhân viên thật, danh sách từ `Employee.xlsx`). Chạy localhost, giao diện tiếng Việt.

**Mô hình sử dụng: chỉ MỘT người phụ trách đăng nhập và chấm công thay cho tất cả nhân viên.** Nhân viên không có tài khoản, không tự chấm công, không tự xin nghỉ.

Giao diện v2 (theo template "Architeq"): nền sáng ấm, menu ngang, nút đen bo tròn, điểm nhấn xanh lá, panel tối. **Không dùng chibi / hoạt hình / emoji.** Biểu tượng dùng SVG line icon (`PATHS` trong `public/js/app.js`).

## Chạy
- `node server/server.js` hoặc `start.bat` → http://localhost:8899 (không cần `npm install`).
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
| `data/employees.json` | Danh sách nhân viên (tên + chức vụ, từ Excel) — **có commit** (repo riêng tư) để máy khác có sẵn |
| `config.json` | Tên công ty, giờ làm việc |
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
- Giờ làm: **09:00–18:00**, tính muộn sau 09:15 (ân hạn 15 phút — chưa xác nhận). Cấu hình trong `config.json` (sửa rồi khởi động lại server; server luôn nạp lại từ file này).
- Ngày làm việc T2–T6. Không chấm công cho ngày tương lai hoặc cuối tuần.
- **Dữ liệu chấm công (`data/db.json`) và `Employee.xlsx` không đưa lên git** (xem `.gitignore`). Mỗi máy chạy server có DB riêng, nằm ở `data/db.json`. Repo (riêng tư): https://github.com/fuku-tn/cham-cong. Nếu đổi repo sang công khai phải bỏ `data/employees.json` khỏi git.
- Cập nhật phiên bản: server so sánh với upstream (`git fetch` + `rev-list HEAD..@{u}`) qua `/api/update/check`; UI hiện thanh cập nhật, bấm thì `/api/update/run` mở terminal chạy `update.bat` (sao lưu → `git pull --ff-only` → chạy lại server) rồi server tự thoát. Chỉ Windows, cần bản clone git có upstream. Nhớ tăng `version` trong `package.json` khi phát hành.
- Xuất CSV: mỗi lần `save()` server ghi lại `data/cham-cong-YYYY-MM.csv` (mỗi tháng một file, UTF-8 BOM, mở được bằng Excel; gồm chấm công + ngày nghỉ phép). Chỉ là bản xuất một chiều từ `db.json`; `data/*.csv` bị gitignore. Nếu Excel đang mở file thì ghi CSV lỗi nhưng `db.json` vẫn lưu.
- **Không thử nghiệm trên `data/db.json` thật** (đã có dữ liệu chấm công thật của công ty). Khi cần test API, chạy trên bản sao thư mục dự án hoặc DB tạm, rồi xoá.
- Server tự sao lưu DB mỗi ngày vào `Archive/db-backup/db-YYYY-MM-DD.json` (giữ 30 bản).
- Trước khi sửa cấu trúc DB: chạy `npm run backup` và ghi vào `ARCHIVE.md`.
- Sau mỗi phiên làm việc: cập nhật `MEMORY.md`.
