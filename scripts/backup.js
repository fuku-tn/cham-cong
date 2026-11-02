// Sao lưu data/db.json -> Archive/db-backup/db-YYYYMMDD-HHMM.json
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = path.join(root, 'data', 'db.json');
if (!fs.existsSync(src)) { console.log('Chưa có data/db.json'); process.exit(0); }
const d = new Date(), p = n => String(n).padStart(2, '0');
const name = `db-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
const dest = path.join(root, 'Archive', 'db-backup', name);
fs.copyFileSync(src, dest); console.log('Đã sao lưu:', dest);
