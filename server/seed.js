// Tạo dữ liệu mẫu (20 nhân sự) cho lần chạy đầu tiên.
const crypto = require('crypto');

function hash(password, salt = crypto.randomBytes(8).toString('hex')) {
  return { salt, hash: crypto.scryptSync(password, salt, 32).toString('hex') };
}
function ymd(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
// Bộ sinh số ngẫu nhiên cố định để dữ liệu mẫu ổn định
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

const PEOPLE = [
  ['Nguyễn Văn Phúc', 'admin', 'Nhân sự', 'Giám đốc nhân sự', 'admin@company.vn'],
  ['Trần Thị Mai', 'employee', 'Kế toán', 'Kế toán trưởng'],
  ['Lê Hoàng Nam', 'employee', 'IT', 'Lập trình viên'],
  ['Phạm Minh Anh', 'employee', 'IT', 'Lập trình viên'],
  ['Võ Thanh Tùng', 'employee', 'IT', 'Trưởng nhóm IT'],
  ['Đặng Thu Hà', 'employee', 'Kinh doanh', 'Trưởng phòng kinh doanh'],
  ['Bùi Quốc Bảo', 'employee', 'Kinh doanh', 'Nhân viên kinh doanh'],
  ['Hoàng Ngọc Lan', 'employee', 'Kinh doanh', 'Nhân viên kinh doanh'],
  ['Ngô Gia Huy', 'employee', 'Kinh doanh', 'Nhân viên kinh doanh'],
  ['Đỗ Khánh Linh', 'employee', 'Marketing', 'Trưởng nhóm Marketing'],
  ['Dương Tuấn Kiệt', 'employee', 'Marketing', 'Designer'],
  ['Lý Bích Ngọc', 'employee', 'Marketing', 'Content Creator'],
  ['Trịnh Đức Minh', 'employee', 'Kế toán', 'Kế toán viên'],
  ['Phan Thảo Vy', 'employee', 'Nhân sự', 'Chuyên viên tuyển dụng'],
  ['Vũ Hải Đăng', 'employee', 'IT', 'Tester'],
  ['Cao Mỹ Duyên', 'employee', 'Kinh doanh', 'Nhân viên kinh doanh'],
  ['Tạ Quang Vinh', 'employee', 'IT', 'DevOps'],
  ['Mai Phương Thảo', 'employee', 'Marketing', 'Chuyên viên SEO'],
  ['Lương Gia Bảo', 'employee', 'Kế toán', 'Thủ quỹ'],
  ['Châu Nhã Uyên', 'employee', 'Nhân sự', 'Lễ tân - Hành chính'],
];
const COLORS = ['#4a9d5f', '#5b8def', '#f2a65a', '#e56b8a', '#9b7bd6', '#3fb5b0', '#e0b43a', '#d9745a'];
const HAIRS = ['#2b2118', '#4a2f1b', '#1d1d1f', '#7a4a2a', '#c98a3b', '#5b3a5e'];

function seed() {
  const r = rng(42);
  const employees = PEOPLE.map((p, i) => {
    const isAdmin = p[1] === 'admin';
    const pw = hash(isAdmin ? 'admin123' : '123456');
    return {
      id: i + 1, name: p[0], role: p[1], dept: p[2], position: p[3],
      email: p[4] || `nv${String(i + 1).padStart(2, '0')}@company.vn`,
      passwordHash: pw.hash, salt: pw.salt,
      phone: '09' + String(10000000 + Math.floor(r() * 89999999)),
      startDate: `20${20 + (i % 5)}-0${1 + (i % 9)}-15`,
      color: COLORS[i % COLORS.length], hair: HAIRS[(i * 3) % HAIRS.length],
      active: true, annualLeave: 12,
    };
  });

  const attendance = [];
  const leaves = [];
  const today = new Date();
  let aid = 1, lid = 1;
  // Dữ liệu chấm công 35 ngày gần nhất (trừ cuối tuần)
  for (let back = 35; back >= 0; back--) {
    const d = new Date(today); d.setDate(d.getDate() - back);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const isToday = back === 0;
    for (const e of employees) {
      const x = r();
      if (x < 0.06) continue; // vắng
      let h = 8, m = Math.floor(r() * 30);               // 08:00 - 08:29
      if (r() < 0.12) { h = 8; m = 46 + Math.floor(r() * 14); } // đi muộn
      const checkIn = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      // Hôm nay: một số người chưa chấm công, chưa ai về
      if (isToday && r() < 0.2) continue;
      let checkOut = null;
      if (!isToday) checkOut = `${17 + Math.floor(r() * 2)}:${String(Math.floor(r() * 59)).padStart(2, '0')}`;
      attendance.push({ id: aid++, userId: e.id, date: ymd(d), checkIn, checkOut });
    }
  }
  // Vài đơn nghỉ phép mẫu
  const fut = n => { const d = new Date(today); d.setDate(d.getDate() + n); return ymd(d); };
  const mk = (userId, type, from, to, days, reason, status) =>
    leaves.push({ id: lid++, userId, type, from, to, days, reason, status, createdAt: ymd(today), decidedBy: status === 'pending' ? null : 1 });
  mk(3, 'annual', fut(3), fut(4), 2, 'Về quê có việc gia đình', 'pending');
  mk(7, 'sick', fut(0), fut(1), 2, 'Sốt, đi khám bác sĩ', 'approved');
  mk(11, 'annual', fut(7), fut(9), 3, 'Du lịch cùng gia đình', 'pending');
  mk(5, 'unpaid', fut(-10), fut(-9), 2, 'Việc cá nhân', 'approved');
  mk(14, 'other', fut(10), fut(10), 1, 'Đi đám cưới bạn', 'rejected');

  return {
    settings: { company: 'Teid Company', workStart: '08:30', lateAfter: '08:45', workEnd: '17:30', standardHours: 8 },
    nextIds: { employee: employees.length + 1, attendance: aid, leave: lid },
    employees, attendance, leaves,
  };
}

module.exports = { seed, hash, ymd };
