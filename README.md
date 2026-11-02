# Starttrain — Chấm công

Web app chấm công – nghỉ phép – quản lý nhân sự. Một người phụ trách chấm công thay cho toàn bộ nhân viên. Chạy hoàn toàn trên máy cá nhân (localhost), không cần internet hay cơ sở dữ liệu.

## Cài đặt trên máy mới
1. Cài [Node.js](https://nodejs.org) (bản LTS, từ 18 trở lên).
2. Tải repo về (nút **Code → Download ZIP** trên GitHub, giải nén; hoặc `git clone`).
3. Double-click `start.bat` (hoặc chạy `node server/server.js`) rồi mở http://localhost:3000.
4. Đăng nhập lần đầu `admin@starttrain.vn / admin123`, bấm **Đổi mật khẩu** ngay.

Không cần `npm install`.

## Dữ liệu lưu ở đâu
- Toàn bộ dữ liệu chấm công nằm trong file `data/db.json` **trên máy đang chạy** (tự tạo ở lần chạy đầu, không nằm trên GitHub).
- Server tự sao lưu mỗi ngày vào `Archive/db-backup/` (giữ 30 bản).
- Khi cập nhật phiên bản mới (tải đè code), **giữ nguyên thư mục `data/`** thì dữ liệu cũ vẫn còn.

## Cập nhật phiên bản
Cần tải repo bằng `git clone` (không phải ZIP). Khi repo có bản mới, web hiện thanh **"Có phiên bản mới"** ở đầu trang. Bấm **Cập nhật ngay** → một cửa sổ terminal mở ra, tự sao lưu dữ liệu, chạy `git pull`, rồi khởi động lại ứng dụng. Có thể chạy tay bằng `update.bat`. Dữ liệu chấm công không bị ảnh hưởng. (Hiện hỗ trợ Windows; máy cần cài Git và có quyền truy cập repo.)

## Cấu hình
- Giờ làm, tên công ty: `config.json` (sửa rồi chạy lại server).
- Danh sách nhân viên: trang **Nhân sự** trên web.

Xem `CLAUDE.md` (cấu trúc, quy ước), `MEMORY.md` (quyết định, TODO), `Document/` (tài liệu).
