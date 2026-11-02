// Xoá data/db.json (tự sao lưu trước). Lần chạy server kế tiếp sẽ tạo lại dữ liệu mẫu.
const fs = require('fs'), path = require('path');
require('./backup.js');
const f = path.join(__dirname, '..', 'data', 'db.json');
if (fs.existsSync(f)) { fs.unlinkSync(f); console.log('Đã xoá db.json. Chạy lại server để tạo dữ liệu mẫu.'); }
