// Máy chủ Node thuần (không cần npm install). Chạy: node server/server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { seed, hash, ymd } = require('./seed');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PUBLIC = path.join(ROOT, 'public');

// ---------- Database (file JSON) ----------
fs.mkdirSync(DATA_DIR, { recursive: true });
let db;
if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
else { db = seed(); save(); console.log('Đã tạo dữ liệu mẫu:', DB_FILE); }
function save() { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

const sessions = new Map(); // token -> userId

// ---------- Helpers ----------
const pub = e => { const { passwordHash, salt, ...rest } = e; return rest; };
const now = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const isWeekend = s => { const w = new Date(s + 'T00:00:00').getDay(); return w === 0 || w === 6; };
const isLate = t => t > db.settings.lateAfter;
function minutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function hoursWorked(a) { return a.checkIn && a.checkOut ? Math.max(0, (minutes(a.checkOut) - minutes(a.checkIn)) / 60) : 0; }
function workdaysBetween(from, to) {
  let n = 0;
  for (let d = new Date(from + 'T00:00:00'); d <= new Date(to + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0 && d.getDay() !== 6) n++;
  }
  return n;
}
function leaveOn(userId, date) {
  return db.leaves.find(l => l.userId === userId && l.status === 'approved' && l.from <= date && date <= l.to);
}
function leaveUsed(userId, year) {
  return db.leaves.filter(l => l.userId === userId && l.status === 'approved' && l.type === 'annual' && l.from.startsWith(String(year)))
    .reduce((s, l) => s + l.days, 0);
}
function statusOf(e, date) {
  if (isWeekend(date)) return 'off';
  if (leaveOn(e.id, date)) return 'leave';
  const a = db.attendance.find(x => x.userId === e.id && x.date === date);
  if (!a) return 'absent';
  if (a.checkOut) return 'done';
  return isLate(a.checkIn) ? 'late' : 'working';
}
class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const need = (cond, msg = 'Dữ liệu không hợp lệ', code = 400) => { if (!cond) throw new HttpError(code, msg); };

// ---------- API handlers ----------
const routes = [];
const route = (method, pattern, handler, opts = {}) => routes.push({ method, re: new RegExp('^' + pattern + '$'), handler, ...opts });

route('POST', '/api/login', ({ body, res }) => {
  const e = db.employees.find(x => x.email.toLowerCase() === String(body.email || '').toLowerCase() && x.active);
  need(e, 'Sai email hoặc mật khẩu', 401);
  const h = crypto.scryptSync(String(body.password || ''), e.salt, 32).toString('hex');
  need(h === e.passwordHash, 'Sai email hoặc mật khẩu', 401);
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, e.id);
  res.setHeader('Set-Cookie', `sid=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`);
  return pub(e);
}, { public: true });

route('POST', '/api/logout', ({ req, res }) => {
  sessions.delete(cookie(req).sid);
  res.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0');
  return { ok: true };
});

route('GET', '/api/me', ({ user }) => ({
  ...pub(user), leaveUsed: leaveUsed(user.id, new Date().getFullYear()), settings: db.settings,
}));

route('POST', '/api/password', ({ user, body }) => {
  need(String(body.password || '').length >= 6, 'Mật khẩu tối thiểu 6 ký tự');
  const p = hash(body.password); user.passwordHash = p.hash; user.salt = p.salt; save();
  return { ok: true };
});

route('GET', '/api/dashboard', ({ user }) => {
  const today = ymd(new Date());
  const active = db.employees.filter(e => e.active);
  const people = active.map(e => {
    const a = db.attendance.find(x => x.userId === e.id && x.date === today);
    return { id: e.id, name: e.name, dept: e.dept, position: e.position, color: e.color, hair: e.hair,
      status: statusOf(e, today), checkIn: a?.checkIn || null, checkOut: a?.checkOut || null };
  });
  const count = s => people.filter(p => p.status === s).length;
  const depts = {};
  people.forEach(p => {
    const d = depts[p.dept] ||= { dept: p.dept, total: 0, present: 0 };
    d.total++; if (['working', 'late', 'done'].includes(p.status)) d.present++;
  });
  // Xu hướng 7 ngày làm việc gần nhất
  const trend = [];
  for (let back = 0; trend.length < 7 && back < 20; back++) {
    const d = new Date(); d.setDate(d.getDate() - back); const s = ymd(d);
    if (isWeekend(s)) continue;
    const recs = db.attendance.filter(a => a.date === s);
    trend.unshift({ date: s, present: recs.length, late: recs.filter(a => isLate(a.checkIn)).length });
  }
  const upcoming = db.leaves.filter(l => l.status === 'approved' && l.to >= today)
    .sort((a, b) => a.from.localeCompare(b.from)).slice(0, 6)
    .map(l => ({ ...l, name: db.employees.find(e => e.id === l.userId)?.name }));
  return {
    today, total: active.length, working: count('working') + count('done'), late: count('late'),
    leave: count('leave'), absent: count('absent'), off: count('off'),
    pending: db.leaves.filter(l => l.status === 'pending').length,
    people, depts: Object.values(depts), trend, upcoming, isAdmin: user.role === 'admin',
  };
});

// Chấm công
route('GET', '/api/attendance', ({ user, query }) => {
  const month = query.get('month') || ymd(new Date()).slice(0, 7);
  const uid = user.role === 'admin' && query.get('userId') ? Number(query.get('userId')) : user.id;
  return {
    month, userId: uid,
    records: db.attendance.filter(a => a.userId === uid && a.date.startsWith(month)).map(a => ({ ...a, late: isLate(a.checkIn), hours: +hoursWorked(a).toFixed(2) })),
    leaves: db.leaves.filter(l => l.userId === uid && l.status === 'approved' && (l.from.startsWith(month) || l.to.startsWith(month))),
  };
});
route('POST', '/api/attendance/checkin', ({ user }) => {
  const today = ymd(new Date());
  need(!isWeekend(today), 'Hôm nay là cuối tuần');
  need(!leaveOn(user.id, today), 'Bạn đang trong thời gian nghỉ phép');
  need(!db.attendance.find(a => a.userId === user.id && a.date === today), 'Bạn đã chấm công vào hôm nay');
  const rec = { id: db.nextIds.attendance++, userId: user.id, date: today, checkIn: now(), checkOut: null };
  db.attendance.push(rec); save();
  return { ...rec, late: isLate(rec.checkIn) };
});
route('POST', '/api/attendance/checkout', ({ user }) => {
  const today = ymd(new Date());
  const rec = db.attendance.find(a => a.userId === user.id && a.date === today);
  need(rec, 'Bạn chưa chấm công vào');
  need(!rec.checkOut, 'Bạn đã chấm công ra rồi');
  rec.checkOut = now(); save();
  return rec;
});

// Nghỉ phép
route('GET', '/api/leaves', ({ user, query }) => {
  const all = user.role === 'admin' && query.get('all') === '1';
  return db.leaves.filter(l => all || l.userId === user.id)
    .sort((a, b) => b.id - a.id)
    .map(l => ({ ...l, name: db.employees.find(e => e.id === l.userId)?.name, dept: db.employees.find(e => e.id === l.userId)?.dept }));
});
route('POST', '/api/leaves', ({ user, body }) => {
  need(['annual', 'sick', 'unpaid', 'other'].includes(body.type), 'Loại nghỉ không hợp lệ');
  need(/^\d{4}-\d{2}-\d{2}$/.test(body.from) && /^\d{4}-\d{2}-\d{2}$/.test(body.to), 'Ngày không hợp lệ');
  need(body.to >= body.from, 'Ngày kết thúc phải sau ngày bắt đầu');
  const days = workdaysBetween(body.from, body.to);
  need(days > 0, 'Khoảng nghỉ không có ngày làm việc nào');
  if (body.type === 'annual') need(leaveUsed(user.id, body.from.slice(0, 4)) + days <= user.annualLeave, 'Vượt quá số ngày phép năm còn lại');
  const l = { id: db.nextIds.leave++, userId: user.id, type: body.type, from: body.from, to: body.to, days,
    reason: String(body.reason || '').slice(0, 300), status: 'pending', createdAt: ymd(new Date()), decidedBy: null };
  db.leaves.push(l); save(); return l;
});
route('POST', '/api/leaves/(\\d+)/cancel', ({ user, params }) => {
  const l = db.leaves.find(x => x.id === Number(params[0]) && x.userId === user.id);
  need(l, 'Không tìm thấy đơn', 404); need(l.status === 'pending', 'Chỉ huỷ được đơn đang chờ duyệt');
  db.leaves = db.leaves.filter(x => x !== l); save(); return { ok: true };
});
route('POST', '/api/leaves/(\\d+)/decision', ({ user, params, body }) => {
  const l = db.leaves.find(x => x.id === Number(params[0]));
  need(l, 'Không tìm thấy đơn', 404);
  need(['approved', 'rejected'].includes(body.status), 'Trạng thái không hợp lệ');
  l.status = body.status; l.decidedBy = user.id; save(); return l;
}, { admin: true });

// Nhân sự
route('GET', '/api/employees', ({ user }) => db.employees.filter(e => user.role === 'admin' || e.active).map(pub));
route('POST', '/api/employees', ({ body }) => {
  need(body.name && body.email, 'Thiếu tên hoặc email');
  need(!db.employees.find(e => e.email.toLowerCase() === body.email.toLowerCase()), 'Email đã tồn tại');
  const p = hash(body.password || '123456');
  const n = db.employees.length;
  const e = { id: db.nextIds.employee++, name: body.name, email: body.email, role: body.role === 'admin' ? 'admin' : 'employee',
    dept: body.dept || 'Khác', position: body.position || '', phone: body.phone || '', startDate: body.startDate || ymd(new Date()),
    color: body.color || ['#4a9d5f', '#5b8def', '#f2a65a', '#e56b8a', '#9b7bd6'][n % 5], hair: body.hair || '#2b2118',
    passwordHash: p.hash, salt: p.salt, active: true, annualLeave: Number(body.annualLeave) || 12 };
  db.employees.push(e); save(); return pub(e);
}, { admin: true });
route('PUT', '/api/employees/(\\d+)', ({ params, body }) => {
  const e = db.employees.find(x => x.id === Number(params[0]));
  need(e, 'Không tìm thấy nhân viên', 404);
  for (const k of ['name', 'email', 'dept', 'position', 'phone', 'startDate', 'color', 'hair']) if (body[k] !== undefined) e[k] = body[k];
  if (body.role) e.role = body.role === 'admin' ? 'admin' : 'employee';
  if (body.annualLeave !== undefined) e.annualLeave = Number(body.annualLeave) || 0;
  if (body.active !== undefined) e.active = !!body.active;
  if (body.password) { const p = hash(body.password); e.passwordHash = p.hash; e.salt = p.salt; }
  save(); return pub(e);
}, { admin: true });

// Bảng công tháng (admin)
route('GET', '/api/timesheet', ({ query }) => {
  const month = query.get('month') || ymd(new Date()).slice(0, 7);
  return db.employees.filter(e => e.active).map(e => {
    const recs = db.attendance.filter(a => a.userId === e.id && a.date.startsWith(month));
    const leaveDays = db.leaves.filter(l => l.userId === e.id && l.status === 'approved' && l.from.startsWith(month)).reduce((s, l) => s + l.days, 0);
    return { id: e.id, name: e.name, dept: e.dept, days: recs.length, late: recs.filter(a => isLate(a.checkIn)).length,
      leaveDays, hours: +recs.reduce((s, a) => s + hoursWorked(a), 0).toFixed(1) };
  });
}, { admin: true });

// ---------- HTTP plumbing ----------
function cookie(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
  return out;
}
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };

function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', c => { s += c; if (s.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch { reject(new HttpError(400, 'JSON không hợp lệ')); } });
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) {
      const r = routes.map(rt => ({ rt, m: rt.method === req.method && url.pathname.match(rt.re) })).find(x => x.m);
      need(r, 'Không tìm thấy API', 404);
      const user = db.employees.find(e => e.id === sessions.get(cookie(req).sid) && e.active);
      if (!r.rt.public) need(user, 'Chưa đăng nhập', 401);
      if (r.rt.admin) need(user.role === 'admin', 'Bạn không có quyền', 403);
      const body = req.method === 'GET' ? {} : await readBody(req);
      const out = await r.rt.handler({ req, res, user, body, query: url.searchParams, params: r.m.slice(1) });
      return send(res, 200, out);
    }
    // Static
    let file = path.normalize(path.join(PUBLIC, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname)));
    if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, 'index.html');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    send(res, e.code || 500, { error: e.message || 'Lỗi máy chủ' });
  }
}).listen(PORT, () => console.log(`\n  Chấm công đang chạy tại http://localhost:${PORT}\n  Admin: admin@company.vn / admin123   |   Nhân viên: nv02@company.vn / 123456\n`));
