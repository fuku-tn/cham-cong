// Tạo dữ liệu khởi tạo. Danh sách nhân viên thật đọc từ data/employees.json
// (tạo bằng: python scripts/import-employees.py). Nếu chưa có thì dùng vài người mẫu.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function hash(password, salt = crypto.randomBytes(8).toString('hex')) {
  return { salt, hash: crypto.scryptSync(password, salt, 32).toString('hex') };
}
function ymd(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const COLORS = ['#4a9d5f', '#4a77d4', '#d99a2b', '#c4506f', '#7d62c4', '#2f9d98', '#b8912a', '#c26248'];
const SAMPLE = [{ name: 'Nhân viên mẫu 1', position: 'Nhân viên' }, { name: 'Nhân viên mẫu 2', position: 'Nhân viên' }];

function seed() {
  const file = path.join(__dirname, '..', 'data', 'employees.json');
  const people = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : SAMPLE;
  const pw = hash('admin123');
  // Tài khoản duy nhất đăng nhập & chấm công (không tính là nhân viên: staff=false)
  const admin = {
    id: 1, name: 'Quản trị Starttrain', role: 'admin', staff: false, email: 'admin@starttrain.vn',
    position: 'Người phụ trách chấm công', phone: '', startDate: ymd(new Date()), color: '#1e2326',
    passwordHash: pw.hash, salt: pw.salt, active: true, annualLeave: 0,
  };
  const staff = people.map((p, i) => ({
    id: i + 2, name: p.name, role: 'employee', staff: true, email: '', position: p.position || '',
    phone: '', startDate: ymd(new Date()), color: COLORS[i % COLORS.length],
    active: true, annualLeave: 12, // không có mật khẩu: nhân viên không đăng nhập
  }));
  const employees = [admin, ...staff];
  return {
    settings: { company: 'Starttrain', workStart: '08:30', lateAfter: '08:45', workEnd: '17:30', standardHours: 8 },
    nextIds: { employee: employees.length + 1, attendance: 1, leave: 1 },
    employees, attendance: [], leaves: [],
  };
}

module.exports = { seed, hash, ymd };
