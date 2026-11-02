// Máy chủ Node thuần (không cần npm install). Chạy: node server/server.js
// Mô hình: CHỈ MỘT người phụ trách (admin) đăng nhập và chấm công thay cho toàn bộ nhân viên.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile, spawn } = require('child_process');
const { seed, hash, ymd, loadConfig } = require('./seed');

const PORT = process.env.PORT || 8899;
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PUBLIC = path.join(ROOT, 'public');

// ---------- Database (file JSON) ----------
fs.mkdirSync(DATA_DIR, { recursive: true });
let db;
if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
else { db = seed(); save(); console.log('Đã tạo dữ liệu khởi tạo:', DB_FILE); }
function save() {
  // Ghi ra file tạm rồi đổi tên để không bị hỏng dữ liệu nếu máy tắt đột ngột
  fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(db, null, 2));
  fs.renameSync(DB_FILE + '.tmp', DB_FILE);
}
db.settings = loadConfig(); // giờ làm việc luôn theo config.json

// Tự sao lưu mỗi ngày (lần khởi động đầu tiên trong ngày), giữ 30 bản gần nhất
(function dailyBackup() {
  const dir = path.join(ROOT, 'Archive', 'db-backup');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `db-${ymd(new Date())}.json`);
  if (!fs.existsSync(file)) fs.copyFileSync(DB_FILE, file);
  const old = fs.readdirSync(dir).filter(f => /^db-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().slice(0, -30);
  old.forEach(f => fs.unlinkSync(path.join(dir, f)));
})();

const sessions = new Map(); // token -> userId

// ---------- Helpers ----------
const pub = e => { const { passwordHash, salt, ...rest } = e; return rest; };
const staff = () => db.employees.filter(e => e.staff !== false);          // nhân viên (không gồm tài khoản quản trị)
const activeStaff = () => staff().filter(e => e.active);
const staffById = id => staff().find(e => e.id === Number(id));
const now = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const isWeekend = s => { const w = new Date(s + 'T00:00:00').getDay(); return w === 0 || w === 6; };
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s));
const isTime = s => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(s));
const isLate = t => t > db.settings.lateAfter;
const minutes = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const hoursWorked = a => a.checkIn && a.checkOut ? Math.max(0, (minutes(a.checkOut) - minutes(a.checkIn)) / 60) : 0;
function workdaysBetween(from, to) {
  let n = 0;
  for (let d = new Date(from + 'T00:00:00'); d <= new Date(to + 'T00:00:00'); d.setDate(d.getDate() + 1)) if (d.getDay() !== 0 && d.getDay() !== 6) n++;
  return n;
}
const leaveOn = (userId, date) => db.leaves.find(l => l.userId === userId && l.status === 'approved' && l.from <= date && date <= l.to);
const leaveUsed = (userId, year) => db.leaves.filter(l => l.userId === userId && l.status === 'approved' && l.type === 'annual' && l.from.startsWith(String(year))).reduce((s, l) => s + l.days, 0);
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

// ---------- API ----------
const routes = [];
const route = (method, pattern, handler, opts = {}) => routes.push({ method, re: new RegExp('^' + pattern + '$'), handler, ...opts });

route('POST', '/api/login', ({ body, res }) => {
  const e = db.employees.find(x => x.email && x.email.toLowerCase() === String(body.email || '').toLowerCase() && x.active && x.passwordHash);
  need(e, 'Sai email hoặc mật khẩu', 401);
  need(crypto.scryptSync(String(body.password || ''), e.salt, 32).toString('hex') === e.passwordHash, 'Sai email hoặc mật khẩu', 401);
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

const VERSION = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version; } catch { return '?'; } })();
route('GET', '/api/me', ({ user }) => ({ ...pub(user), settings: db.settings, version: VERSION }));

// ---- Cập nhật phiên bản (qua git) ----
const git = args => new Promise(resolve => execFile('git', args, { cwd: ROOT, timeout: 20000, windowsHide: true, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } },
  (err, out) => resolve({ err, out: String(out || '').trim() })));
let updateCache = { at: 0, data: null };
route('GET', '/api/update/check', async ({ query }) => {
  if (updateCache.data && Date.now() - updateCache.at < 10 * 60 * 1000 && query.get('force') !== '1') return updateCache.data;
  let data = { supported: false, version: VERSION };
  const inRepo = await git(['rev-parse', '--is-inside-work-tree']);
  const upstream = inRepo.err ? null : await git(['rev-parse', '--abbrev-ref', '@{u}']);
  if (upstream && !upstream.err) {
    const fetched = await git(['fetch', '--quiet']);
    const behind = Number((await git(['rev-list', '--count', 'HEAD..@{u}'])).out) || 0;
    const log = behind ? (await git(['log', '--format=%s', '-n', '5', 'HEAD..@{u}'])).out.split(/\r?\n/).map(x => x.trim()).filter(Boolean) : [];
    data = { supported: true, version: VERSION, behind, available: behind > 0, changes: log, offline: !!fetched.err };
  }
  updateCache = { at: Date.now(), data };
  return data;
});
route('POST', '/api/update/run', () => {
  need(process.platform === 'win32', 'Cập nhật tự động hiện chỉ hỗ trợ Windows. Hãy chạy "git pull" thủ công.');
  need(fs.existsSync(path.join(ROOT, 'update.bat')), 'Thiếu file update.bat');
  // Mở cửa sổ terminal mới chạy update.bat (nó sẽ tự chờ server này tắt rồi pull và khởi động lại)
  spawn('cmd.exe', ['/c', `start "Cap nhat Starttrain" /D "${ROOT}" cmd /k "${path.join(ROOT, 'update.bat')}"`],
    { cwd: ROOT, detached: true, stdio: 'ignore', windowsVerbatimArguments: true }).unref();
  setTimeout(() => process.exit(0), 600);
  return { ok: true };
});

route('POST', '/api/password', ({ user, body }) => {
  need(String(body.password || '').length >= 6, 'Mật khẩu tối thiểu 6 ký tự');
  const p = hash(body.password); user.passwordHash = p.hash; user.salt = p.salt; save();
  return { ok: true };
});

// Tổng quan
route('GET', '/api/dashboard', () => {
  const today = ymd(new Date()), month = today.slice(0, 7);
  const people = activeStaff().map(e => {
    const a = db.attendance.find(x => x.userId === e.id && x.date === today);
    return { id: e.id, name: e.name, position: e.position, color: e.color, status: statusOf(e, today), checkIn: a?.checkIn || null, checkOut: a?.checkOut || null };
  });
  const count = s => people.filter(p => p.status === s).length;
  const trend = [];
  for (let back = 0; trend.length < 7 && back < 20; back++) {
    const d = new Date(); d.setDate(d.getDate() - back); const s = ymd(d);
    if (isWeekend(s)) continue;
    const recs = db.attendance.filter(a => a.date === s);
    trend.unshift({ date: s, present: recs.length, late: recs.filter(a => isLate(a.checkIn)).length });
  }
  // Số lần đi muộn trong tháng theo từng người
  const lateBy = {};
  db.attendance.filter(a => a.date.startsWith(month) && isLate(a.checkIn)).forEach(a => lateBy[a.userId] = (lateBy[a.userId] || 0) + 1);
  const topLate = Object.entries(lateBy).map(([id, n]) => ({ name: staffById(id)?.name, n })).filter(x => x.name).sort((a, b) => b.n - a.n).slice(0, 5);
  let workdaysSoFar = 0;
  for (let d = new Date(month + '-01T00:00:00'); ymd(d) <= today; d.setDate(d.getDate() + 1)) if (d.getDay() !== 0 && d.getDay() !== 6) workdaysSoFar++;
  const upcoming = db.leaves.filter(l => l.status === 'approved' && l.to >= today).sort((a, b) => a.from.localeCompare(b.from)).slice(0, 6)
    .map(l => ({ ...l, name: staffById(l.userId)?.name }));
  return {
    today, total: people.length, working: count('working') + count('done'), late: count('late'),
    leave: count('leave'), absent: count('absent'), off: count('off'),
    lateMonth: Object.values(lateBy).reduce((s, n) => s + n, 0), workdaysSoFar,
    people, trend, topLate, upcoming,
  };
});

// Chấm công (do người phụ trách thực hiện thay nhân viên)
route('GET', '/api/roster', ({ query }) => {
  const date = query.get('date') || ymd(new Date());
  need(isDate(date), 'Ngày không hợp lệ');
  return {
    date, weekend: isWeekend(date),
    rows: activeStaff().map(e => {
      const a = db.attendance.find(x => x.userId === e.id && x.date === date);
      const l = leaveOn(e.id, date);
      return { id: e.id, name: e.name, position: e.position, color: e.color, status: statusOf(e, date),
        checkIn: a?.checkIn || null, checkOut: a?.checkOut || null, hours: a ? +hoursWorked(a).toFixed(2) : 0, leaveType: l?.type || null };
    }),
  };
}, { admin: true });

route('POST', '/api/attendance/mark', ({ body }) => {
  const e = staffById(body.userId);
  need(e, 'Không tìm thấy nhân viên', 404);
  need(isDate(body.date), 'Ngày không hợp lệ');
  need(body.date <= ymd(new Date()), 'Không thể chấm công cho ngày trong tương lai');
  need(!isWeekend(body.date), 'Ngày cuối tuần không chấm công');
  let rec = db.attendance.find(a => a.userId === e.id && a.date === body.date);
  if (body.clear) {
    db.attendance = db.attendance.filter(a => a !== rec); save(); return { ok: true };
  }
  need(!leaveOn(e.id, body.date), 'Nhân viên đang nghỉ phép ngày này');
  if (body.checkIn !== undefined) {
    need(isTime(body.checkIn), 'Giờ vào không hợp lệ');
    if (rec) rec.checkIn = body.checkIn;
    else { rec = { id: db.nextIds.attendance++, userId: e.id, date: body.date, checkIn: body.checkIn, checkOut: null }; db.attendance.push(rec); }
  }
  if (body.checkOut !== undefined) {
    need(rec, 'Chưa có giờ vào');
    if (body.checkOut === null || body.checkOut === '') rec.checkOut = null;
    else { need(isTime(body.checkOut), 'Giờ ra không hợp lệ'); rec.checkOut = body.checkOut; }
  }
  if (rec.checkOut) need(rec.checkOut >= rec.checkIn, 'Giờ ra phải sau giờ vào');
  save();
  return { ...rec, late: isLate(rec.checkIn) };
}, { admin: true });

// Nghỉ phép (người phụ trách ghi nhận thay nhân viên — tự động ở trạng thái "đã ghi nhận")
route('GET', '/api/leaves', () =>
  db.leaves.slice().sort((a, b) => b.from.localeCompare(a.from) || b.id - a.id)
    .map(l => ({ ...l, name: staffById(l.userId)?.name || '(đã xoá)' })), { admin: true });

route('POST', '/api/leaves', ({ user, body }) => {
  const e = staffById(body.userId);
  need(e, 'Chưa chọn nhân viên');
  need(['annual', 'sick', 'unpaid', 'other'].includes(body.type), 'Loại nghỉ không hợp lệ');
  need(isDate(body.from) && isDate(body.to), 'Ngày không hợp lệ');
  need(body.to >= body.from, 'Ngày kết thúc phải sau ngày bắt đầu');
  const days = workdaysBetween(body.from, body.to);
  need(days > 0, 'Khoảng nghỉ không có ngày làm việc nào');
  if (body.type === 'annual') need(leaveUsed(e.id, body.from.slice(0, 4)) + days <= e.annualLeave, `${e.name} không đủ phép năm (còn ${e.annualLeave - leaveUsed(e.id, body.from.slice(0, 4))} ngày)`);
  const l = { id: db.nextIds.leave++, userId: e.id, type: body.type, from: body.from, to: body.to, days,
    reason: String(body.reason || '').slice(0, 300), status: 'approved', createdAt: ymd(new Date()), decidedBy: user.id };
  db.leaves.push(l); save(); return l;
}, { admin: true });

route('POST', '/api/leaves/(\\d+)/delete', ({ params }) => {
  const l = db.leaves.find(x => x.id === Number(params[0]));
  need(l, 'Không tìm thấy bản ghi', 404);
  db.leaves = db.leaves.filter(x => x !== l); save(); return { ok: true };
}, { admin: true });

// Nhân sự
route('GET', '/api/employees', () => staff().map(e => ({ ...pub(e), leaveUsed: leaveUsed(e.id, new Date().getFullYear()) })), { admin: true });
route('POST', '/api/employees', ({ body }) => {
  need(String(body.name || '').trim(), 'Thiếu họ tên');
  const colors = ['#4a9d5f', '#4a77d4', '#d99a2b', '#c4506f', '#7d62c4', '#2f9d98'];
  const e = { id: db.nextIds.employee++, name: body.name.trim(), role: 'employee', staff: true, email: '', position: body.position || '',
    phone: body.phone || '', startDate: isDate(body.startDate) ? body.startDate : ymd(new Date()), color: colors[staff().length % colors.length],
    active: true, annualLeave: Number(body.annualLeave) >= 0 ? Number(body.annualLeave) : 12 };
  db.employees.push(e); save(); return pub(e);
}, { admin: true });
route('PUT', '/api/employees/(\\d+)', ({ params, body }) => {
  const e = staffById(params[0]);
  need(e, 'Không tìm thấy nhân viên', 404);
  for (const k of ['name', 'position', 'phone']) if (body[k] !== undefined) e[k] = String(body[k]);
  if (isDate(body.startDate)) e.startDate = body.startDate;
  if (body.annualLeave !== undefined) e.annualLeave = Number(body.annualLeave) || 0;
  if (body.active !== undefined) e.active = !!body.active;
  need(e.name.trim(), 'Thiếu họ tên');
  save(); return pub(e);
}, { admin: true });

// Bảng công tháng
route('GET', '/api/timesheet', ({ query }) => {
  const month = query.get('month') || ymd(new Date()).slice(0, 7);
  need(/^\d{4}-\d{2}$/.test(month), 'Tháng không hợp lệ');
  return activeStaff().map(e => {
    const recs = db.attendance.filter(a => a.userId === e.id && a.date.startsWith(month));
    const leaveDays = db.leaves.filter(l => l.userId === e.id && l.status === 'approved' && l.from.startsWith(month)).reduce((s, l) => s + l.days, 0);
    return { id: e.id, name: e.name, position: e.position, days: recs.length, late: recs.filter(a => isLate(a.checkIn)).length,
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
      const user = db.employees.find(e => e.id === sessions.get(cookie(req).sid) && e.active && e.passwordHash);
      if (!r.rt.public) need(user, 'Chưa đăng nhập', 401);
      if (r.rt.admin) need(user.role === 'admin', 'Bạn không có quyền', 403);
      const body = req.method === 'GET' ? {} : await readBody(req);
      return send(res, 200, await r.rt.handler({ req, res, user, body, query: url.searchParams, params: r.m.slice(1) }));
    }
    let file = path.normalize(path.join(PUBLIC, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname)));
    if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, 'index.html');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    send(res, e.code || 500, { error: e.message || 'Lỗi máy chủ' });
  }
}).listen(PORT, () => console.log(`\n  Starttrain Chấm công đang chạy tại http://localhost:${PORT}\n  Đăng nhập: admin@starttrain.vn / admin123  (hãy đổi mật khẩu)\n`));
