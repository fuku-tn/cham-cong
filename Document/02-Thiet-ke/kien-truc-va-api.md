# Kiến trúc & API

Trình duyệt (SPA `public/`) ⇄ `server/server.js` (REST JSON, cookie `sid`) ⇄ `data/db.json`.

## Mô hình dữ liệu (db.json)
- `settings`: company, workStart, lateAfter, workEnd, standardHours
- `employees[]`: id, name, position, phone, startDate, color, active, annualLeave, staff (true = nhân viên, false = tài khoản quản trị), role, email + passwordHash + salt (chỉ tài khoản quản trị)
- `attendance[]`: id, userId, date, checkIn, checkOut
- `leaves[]`: id, userId, type (annual|sick|unpaid|other), from, to, days, reason, status (luôn `approved`), createdAt, decidedBy

## API (tất cả cần đăng nhập, trừ login)
| Method | Đường dẫn | Mô tả |
|---|---|---|
| POST | /api/login, /api/logout | Đăng nhập/đăng xuất |
| GET | /api/me | Thông tin người đăng nhập + settings |
| POST | /api/password | Đổi mật khẩu |
| GET | /api/dashboard | Số liệu tổng quan hôm nay |
| GET | /api/roster?date=YYYY-MM-DD | Trạng thái chấm công của mọi nhân viên trong ngày |
| POST | /api/attendance/mark | `{userId, date, checkIn?, checkOut?, clear?}` — chấm công/sửa/xoá |
| GET/POST | /api/leaves | Danh sách / ghi nhận nghỉ phép `{userId,type,from,to,reason}` |
| POST | /api/leaves/:id/delete | Xoá bản ghi nghỉ phép |
| GET/POST/PUT | /api/employees | Danh sách / thêm / sửa nhân viên |
| GET | /api/timesheet?month=YYYY-MM | Tổng hợp công tháng |
