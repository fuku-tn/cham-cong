# Kiến trúc & API

Trình duyệt (SPA `public/`) ⇄ `server/server.js` (REST JSON, cookie `sid`) ⇄ `data/db.json`.

## Mô hình dữ liệu (db.json)
- `settings`: company, workStart, lateAfter, workEnd, standardHours
- `employees[]`: id, name, email, role, dept, position, phone, startDate, color, hair, active, annualLeave, passwordHash, salt
- `attendance[]`: id, userId, date, checkIn, checkOut
- `leaves[]`: id, userId, type (annual|sick|unpaid|other), from, to, days, reason, status, createdAt, decidedBy

## API
| Method | Đường dẫn | Quyền | Mô tả |
|---|---|---|---|
| POST | /api/login, /api/logout | – | Đăng nhập/đăng xuất |
| GET | /api/me | user | Thông tin + phép đã dùng + settings |
| POST | /api/password | user | Đổi mật khẩu |
| GET | /api/dashboard | user | Số liệu + trạng thái từng người hôm nay |
| GET | /api/attendance?month=YYYY-MM | user (admin thêm `userId`) | Công trong tháng |
| POST | /api/attendance/checkin, /checkout | user | Chấm công |
| GET/POST | /api/leaves (`?all=1` cho admin) | user | Danh sách / tạo đơn |
| POST | /api/leaves/:id/cancel | chủ đơn | Huỷ đơn chờ duyệt |
| POST | /api/leaves/:id/decision | admin | `{status: approved\|rejected}` |
| GET/POST/PUT | /api/employees | GET: user; còn lại admin | Nhân viên |
| GET | /api/timesheet?month= | admin | Tổng hợp công tháng |
