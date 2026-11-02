// Giao diện SPA thuần JS (v2 – phong cách chuyên nghiệp). Điều hướng bằng hash: #/dashboard, #/attendance, #/hr
const $app = document.getElementById('app');
let ME = null;
const LEAVE_TYPES = { annual: 'Phép năm', sick: 'Nghỉ ốm', unpaid: 'Không lương', other: 'Khác' };
const ST = { pending: ['p-amber', 'Chờ duyệt'], approved: ['p-green', 'Đã duyệt'], rejected: ['p-red', 'Từ chối'] };
const WORK_ST = {
  working: ['p-green', 'Đang làm việc'], late: ['p-amber', 'Đi muộn'], done: ['p-gray', 'Đã ra về'],
  leave: ['p-blue', 'Nghỉ phép'], absent: ['p-red', 'Chưa chấm công'], off: ['p-gray', 'Ngày nghỉ'],
};
const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// ---------- biểu tượng (SVG line icons) ----------
const PATHS = {
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-6"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};
const icon = n => `<svg class="ic" viewBox="0 0 24 24">${PATHS[n]}</svg>`;
const LOGO = `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="20" height="20" rx="2"/><rect x="9" y="9" width="20" height="20" rx="2" fill="#f5f4f0"/><path d="M14 20l3 3 6-7" stroke="#5fa043" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ---------- tiện ích ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = n => n.trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase();
const avatar = e => `<span class="avatar" style="background:${e.color}1f;color:${e.color}">${esc(initials(e.name))}</span>`;
const fmtDate = s => s.split('-').reverse().join('/');
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const pill = ([cls, txt]) => `<span class="pill ${cls}">${txt}</span>`;
function toast(msg, err) {
  const el = document.createElement('div'); el.textContent = msg; if (err) el.className = 'err';
  document.getElementById('toast').appendChild(el); setTimeout(() => el.remove(), 3200);
}
async function api(method, url, body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { if (r.status === 401 && ME) { ME = null; render(); } throw new Error(data.error || 'Lỗi'); }
  return data;
}
function modal(html, onMount) {
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal">${html}</div>`;
  bg.addEventListener('mousedown', e => { if (e.target === bg) bg.remove(); });
  document.body.appendChild(bg); onMount?.(bg); return bg;
}

// ---------- đăng nhập ----------
function loginView() {
  $app.innerHTML = `<div class="login-wrap"><div>
      <div class="logo" style="margin-bottom:40px">${LOGO}TEID HR</div>
      <div class="eyebrow"><i></i>Hệ thống quản lý nhân sự nội bộ</div>
      <h1 style="font-size:52px">Chấm công<br>minh bạch, <span class="accent">chính xác</span></h1>
      <p class="lead">Theo dõi chuyên cần, xử lý đơn nghỉ phép và quản lý hồ sơ nhân sự trên một nền tảng duy nhất.</p></div>
    <form class="login-card" id="lf"><h2>Đăng nhập</h2><p class="sub">Sử dụng tài khoản do bộ phận nhân sự cấp.</p>
      <label>Email</label><input name="email" type="email" required autofocus value="admin@company.vn">
      <label>Mật khẩu</label><input name="password" type="password" required value="admin123">
      <button class="btn big" style="width:100%;margin-top:24px;justify-content:center">Đăng nhập ${icon('arrow')}</button>
      <div class="hint"><b>Tài khoản demo</b><br>Quản trị: admin@company.vn / admin123<br>Nhân viên: nv02@company.vn … nv20@company.vn / 123456</div></form></div>`;
  document.getElementById('lf').onsubmit = async e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    try { await api('POST', '/api/login', f); await boot(); location.hash = '#/dashboard'; } catch (err) { toast(err.message, true); }
  };
}

// ---------- khung chính ----------
const PAGES = {
  dashboard: { title: 'Tổng quan', view: dashboardView },
  attendance: { title: 'Chấm công & Nghỉ phép', view: attendanceView },
  hr: { title: 'Quản lý nhân sự', view: hrView, admin: true },
};
async function render() {
  if (!ME) return loginView();
  let key = (location.hash.replace('#/', '') || 'dashboard');
  if (!PAGES[key] || (PAGES[key].admin && ME.role !== 'admin')) key = 'dashboard';
  const nav = Object.entries(PAGES).filter(([, p]) => !p.admin || ME.role === 'admin')
    .map(([k, p]) => `<a href="#/${k}" class="${k === key ? 'active' : ''}">${p.title}</a>`).join('');
  $app.innerHTML = `<header class="topbar"><div class="logo">${LOGO}TEID HR</div><nav class="nav">${nav}</nav>
    <div class="userbox"><div class="who-mini"><b>${esc(ME.name)}</b><small>${ME.role === 'admin' ? 'Quản trị viên' : esc(ME.position)}</small></div>${avatar(ME)}
    <button class="btn ghost sm" id="logout">Đăng xuất</button></div></header>
    <main class="page" id="page"><div class="empty">Đang tải…</div></main>`;
  document.getElementById('logout').onclick = async () => { await api('POST', '/api/logout'); ME = null; render(); };
  try { await PAGES[key].view(document.getElementById('page')); } catch (e) { toast(e.message, true); }
}

// ---------- Tổng quan ----------
let deptFilter = '';
async function dashboardView(el) {
  const d = await api('GET', '/api/dashboard');
  const present = d.working + d.late, expected = d.total - d.leave - d.off;
  const rate = expected > 0 ? Math.round(present / expected * 100) : null;
  const C = 2 * Math.PI * 52;
  const maxTrend = Math.max(1, ...d.trend.map(t => t.present));
  const depts = [...new Set(d.people.map(p => p.dept))];
  const people = d.people.filter(p => !deptFilter || p.dept === deptFilter);
  const order = { late: 0, working: 1, done: 2, leave: 3, absent: 4, off: 5 };
  people.sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name, 'vi'));

  el.innerHTML = `
    <section class="hero">
      <div><div class="eyebrow"><i></i>Tình hình ngày ${fmtDate(d.today)}</div>
        <h1>Quản lý nhân sự<br><span class="accent">chính xác</span> từng giờ</h1>
        <p class="lead">Xin chào ${esc(ME.name.split(' ').pop())}. Theo dõi chuyên cần, nghỉ phép và hồ sơ nhân sự của toàn công ty trong một màn hình.</p>
        <div class="actions"><a class="btn" href="#/attendance">Chấm công ngay ${icon('arrow')}</a>
          ${d.isAdmin ? `<a class="btn ghost" href="#/hr">${d.pending ? d.pending + ' đơn chờ duyệt' : 'Quản lý nhân sự'}</a>` : ''}</div></div>
      <div class="snap"><div class="ring"><svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="52" fill="none" stroke="#3a4247" stroke-width="10"/>
        <circle cx="66" cy="66" r="52" fill="none" stroke="#7fc45f" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - (rate || 0) / 100)}"/></svg><b>${rate === null ? '—' : rate + '%'}</b></div>
        <div><h3>Tỷ lệ chuyên cần hôm nay</h3><p>${rate === null ? 'Hôm nay là ngày nghỉ' : 'Trên số nhân sự phải đi làm'}</p>
          <div class="li"><span>Có mặt</span><b>${present}</b></div><div class="li"><span>Nghỉ phép</span><b>${d.leave}</b></div><div class="li"><span>Chưa chấm công</span><b>${d.absent}</b></div></div></div>
    </section>
    <div class="card glass"><div class="metrics">
      <div>${icon('users')}<div><b>${d.total}</b><span>Tổng nhân sự</span></div></div>
      <div>${icon('clock')}<div><b>${d.late}</b><span>Đi muộn hôm nay</span></div></div>
      <div>${icon('inbox')}<div><b>${d.pending}</b><span>Đơn nghỉ chờ duyệt</span></div></div></div></div>
    <section class="panel">
      <div><span class="box">${icon('check')}</span><div><b>${d.working}</b><span>Có mặt tại văn phòng</span></div></div>
      <div><span class="box">${icon('clock')}</span><div><b>${d.late}</b><span>Đi muộn sau ${ME.settings?.lateAfter || '08:45'}</span></div></div>
      <div><span class="box">${icon('calendar')}</span><div><b>${d.leave}</b><span>Đang nghỉ phép</span></div></div>
      <div><span class="box">${icon('alert')}</span><div><b>${d.absent}</b><span>Chưa chấm công</span></div></div></section>
    <div class="grid g2">
      <div class="card"><div class="card-title"><h2>Tình trạng nhân sự hôm nay</h2>
        <div class="filters"><select id="df"><option value="">Tất cả phòng ban</option>${depts.map(x => `<option ${x === deptFilter ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div></div>
        <table><thead><tr><th>Nhân viên</th><th>Phòng ban</th><th>Giờ vào</th><th>Giờ ra</th><th>Trạng thái</th></tr></thead><tbody>
        ${people.map(p => `<tr><td><div class="who">${avatar(p)}<div><b>${esc(p.name)}</b><small>${esc(p.position)}</small></div></div></td><td>${esc(p.dept)}</td>
          <td>${p.checkIn || '—'}</td><td>${p.checkOut || '—'}</td><td>${pill(WORK_ST[p.status])}</td></tr>`).join('')}</tbody></table></div>
      <div style="display:grid;gap:18px;align-content:start">
        <div class="card"><div class="card-title"><h2>Chuyên cần theo phòng ban</h2></div>${d.depts.map(x => `
          <div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>${esc(x.dept)}</span><b>${x.present}/${x.total}</b></div>
          <div class="bar"><i style="width:${x.total ? x.present / x.total * 100 : 0}%"></i></div></div>`).join('')}</div>
        <div class="card"><div class="card-title"><h2>7 ngày làm việc gần nhất</h2><small>Số người có mặt</small></div>
          <div style="display:flex;gap:10px;align-items:flex-end;height:120px">${d.trend.map(t => `
            <div style="flex:1;text-align:center;font-size:11px;color:var(--muted)"><div title="${t.present} có mặt, ${t.late} đi muộn" style="height:${t.present / maxTrend * 84}px;background:var(--ink);border-radius:6px 6px 2px 2px;min-height:3px;margin-bottom:6px"></div>${t.date.slice(8)}/${t.date.slice(5, 7)}</div>`).join('')}</div></div>
        <div class="card"><div class="card-title"><h2>Lịch nghỉ sắp tới</h2></div>${d.upcoming.length ? d.upcoming.map(l => `
          <div class="list-item"><b>${esc(l.name)}</b><br><small>${LEAVE_TYPES[l.type]} · ${fmtDate(l.from)}${l.to !== l.from ? ' → ' + fmtDate(l.to) : ''}</small></div>`).join('') : '<div class="empty">Không có lịch nghỉ</div>'}</div>
      </div></div>`;
  document.getElementById('df').onchange = e => { deptFilter = e.target.value; render(); };
}

// ---------- Chấm công & nghỉ phép ----------
let calMonth = ymd(new Date()).slice(0, 7);
async function attendanceView(el) {
  ME = await api('GET', '/api/me');
  const today = ymd(new Date());
  const [att, leaves, cur] = await Promise.all([api('GET', `/api/attendance?month=${calMonth}`), api('GET', '/api/leaves'), api('GET', `/api/attendance?month=${today.slice(0, 7)}`)]);
  const rec = cur.records.find(r => r.date === today);
  const [y, m] = calMonth.split('-').map(Number);
  const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7, nDays = new Date(y, m, 0).getDate();
  const byDate = Object.fromEntries(att.records.map(r => [r.date, r]));
  const onLeave = date => att.leaves.some(l => l.from <= date && date <= l.to);
  let cells = DOW.map(d => `<div class="dow">${d}</div>`).join('') + '<div class="day blank"></div>'.repeat(offset);
  for (let i = 1; i <= nDays; i++) {
    const date = `${calMonth}-${String(i).padStart(2, '0')}`, wd = new Date(y, m - 1, i).getDay(), we = wd === 0 || wd === 6, r = byDate[date];
    let cls = '', sub = '';
    if (we) cls = 'we';
    else if (onLeave(date)) { cls = 'leave'; sub = 'Nghỉ phép'; }
    else if (r) { cls = r.late ? 'late' : 'ok'; sub = `${r.checkIn}${r.checkOut ? '–' + r.checkOut : ''}`; }
    else if (date < today) { cls = 'abs'; sub = 'Vắng'; }
    cells += `<div class="day ${cls} ${date === today ? 'today' : ''}">${i}<small>${sub}</small></div>`;
  }
  const monthHours = att.records.reduce((s, r) => s + r.hours, 0);
  const left = ME.annualLeave - ME.leaveUsed;
  el.innerHTML = `
    <div class="page-head"><div><div class="eyebrow"><i></i>Hôm nay ${fmtDate(today)}</div><h1>Chấm công <span class="accent">&</span> Nghỉ phép</h1></div>
      <button class="btn" id="newLeave">${icon('plus')} Xin nghỉ phép</button></div>
    <div class="checkin"><div><div class="muted">Thời gian hiện tại</div><div class="clock" id="clock">--:--:--</div>
      <div style="margin-top:8px">${!rec ? 'Bạn chưa chấm công vào.' : `Vào lúc <b>${rec.checkIn}</b> ${rec.late ? pill(['p-amber', 'Đi muộn']) : pill(['p-green', 'Đúng giờ'])}${rec.checkOut ? ` · Ra lúc <b>${rec.checkOut}</b> (${rec.hours}h)` : ''}`}</div>
      <small class="muted">Giờ vào ${ME.settings.workStart} · Tính muộn sau ${ME.settings.lateAfter} · Giờ ra ${ME.settings.workEnd}</small></div>
      <div>${!rec ? '<button class="btn big" id="ci">Chấm công vào</button>' : !rec.checkOut ? '<button class="btn big" id="co">Chấm công ra</button>' : '<span class="pill p-gray">Đã hoàn thành hôm nay</span>'}</div></div>
    <div class="grid g2 mt">
      <div class="card"><div class="cal-head"><button id="prev">‹</button><span>Tháng ${m}/${y}</span><button id="next">›</button></div>
        <div class="cal">${cells}</div>
        <div class="legend"><span><i class="dot" style="background:#9fcb8c"></i>Đúng giờ</span><span><i class="dot" style="background:#efd8a2"></i>Đi muộn</span><span><i class="dot" style="background:#b9cdf5"></i>Nghỉ phép</span><span><i class="dot" style="background:#f3b4ae"></i>Vắng</span></div></div>
      <div style="display:grid;gap:18px;align-content:start">
        <div class="card"><div class="card-title"><h2>Thống kê tháng ${m}</h2></div>
          <div class="stat3"><div><b>${att.records.length}</b><small>Ngày công</small></div><div><b>${att.records.filter(r => r.late).length}</b><small>Lần muộn</small></div><div><b>${monthHours.toFixed(0)}h</b><small>Giờ làm</small></div></div></div>
        <div class="card"><div class="card-title"><h2>Phép năm ${new Date().getFullYear()}</h2></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--muted)">Còn lại</span><b>${left}/${ME.annualLeave} ngày</b></div>
          <div class="bar"><i style="width:${ME.annualLeave ? left / ME.annualLeave * 100 : 0}%"></i></div></div>
      </div></div>
    <div class="card mt"><div class="card-title"><h2>Đơn nghỉ phép của tôi</h2></div>${leaves.length ? `<table><thead><tr><th>Loại</th><th>Thời gian</th><th>Số ngày</th><th>Lý do</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      ${leaves.map(l => `<tr><td>${LEAVE_TYPES[l.type]}</td><td>${fmtDate(l.from)}${l.to !== l.from ? ' → ' + fmtDate(l.to) : ''}</td><td>${l.days}</td><td>${esc(l.reason)}</td>
      <td>${pill(ST[l.status])}</td><td>${l.status === 'pending' ? `<button class="btn danger sm" data-cancel="${l.id}">Huỷ đơn</button>` : ''}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">Chưa có đơn nào</div>'}</div>`;

  const tick = () => { const c = document.getElementById('clock'); if (c) c.textContent = new Date().toLocaleTimeString('vi-VN', { hour12: false }); else clearInterval(timer); };
  const timer = setInterval(tick, 1000); tick();
  const act = (id, url, msg) => { const b = document.getElementById(id); if (b) b.onclick = async () => { try { await api('POST', url); toast(msg); render(); } catch (e) { toast(e.message, true); } }; };
  act('ci', '/api/attendance/checkin', 'Chấm công vào thành công'); act('co', '/api/attendance/checkout', 'Chấm công ra thành công');
  const shift = n => { calMonth = ymd(new Date(y, m - 1 + n, 1)).slice(0, 7); render(); };
  document.getElementById('prev').onclick = () => shift(-1); document.getElementById('next').onclick = () => shift(1);
  el.querySelectorAll('[data-cancel]').forEach(b => b.onclick = async () => { await api('POST', `/api/leaves/${b.dataset.cancel}/cancel`); toast('Đã huỷ đơn'); render(); });
  document.getElementById('newLeave').onclick = leaveModal;
}
function leaveModal() {
  const t = ymd(new Date());
  modal(`<h2>Xin nghỉ phép</h2><form id="lf">
    <label>Loại nghỉ</label><select name="type">${Object.entries(LEAVE_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
    <div class="row"><div><label>Từ ngày</label><input type="date" name="from" value="${t}" required></div><div><label>Đến ngày</label><input type="date" name="to" value="${t}" required></div></div>
    <label>Lý do</label><textarea name="reason" rows="3" placeholder="Nhập lý do…"></textarea>
    <div class="actions"><button type="button" class="btn ghost" data-close>Đóng</button><button class="btn">Gửi đơn</button></div></form>`, bg => {
    bg.querySelector('[data-close]').onclick = () => bg.remove();
    bg.querySelector('#lf').onsubmit = async e => {
      e.preventDefault();
      try { await api('POST', '/api/leaves', Object.fromEntries(new FormData(e.target))); bg.remove(); toast('Đã gửi đơn, chờ duyệt'); render(); } catch (err) { toast(err.message, true); }
    };
  });
}

// ---------- Quản lý nhân sự (admin) ----------
let hrTab = 'staff';
async function hrView(el) {
  el.innerHTML = `<div class="page-head"><div><div class="eyebrow"><i></i>Dành cho quản trị viên</div><h1>Quản lý <span class="accent">nhân sự</span></h1></div>
    <button class="btn" id="addEmp">${icon('plus')} Thêm nhân viên</button></div>
    <div class="tabs">${[['staff', 'Nhân viên'], ['leave', 'Duyệt nghỉ phép'], ['sheet', 'Bảng công tháng']].map(([k, v]) => `<button data-t="${k}" class="${hrTab === k ? 'on' : ''}">${v}</button>`).join('')}</div><div id="tab"></div>`;
  el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { hrTab = b.dataset.t; render(); });
  document.getElementById('addEmp').onclick = () => empModal();
  const tab = document.getElementById('tab');
  if (hrTab === 'staff') {
    const list = await api('GET', '/api/employees');
    tab.innerHTML = `<div class="card"><table><thead><tr><th>Nhân viên</th><th>Phòng ban</th><th>Chức vụ</th><th>Điện thoại</th><th>Ngày vào</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      ${list.map(e => `<tr><td><div class="who">${avatar(e)}<div><b>${esc(e.name)}</b><small>${esc(e.email)}</small></div></div></td><td>${esc(e.dept)}</td><td>${esc(e.position)}</td><td>${esc(e.phone)}</td><td>${fmtDate(e.startDate)}</td>
      <td>${pill(e.active ? [e.role === 'admin' ? 'p-blue' : 'p-green', e.role === 'admin' ? 'Quản trị' : 'Đang làm'] : ['p-gray', 'Đã nghỉ việc'])}</td><td><button class="btn ghost sm" data-edit="${e.id}">Sửa</button></td></tr>`).join('')}</tbody></table></div>`;
    tab.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => empModal(list.find(e => e.id == b.dataset.edit)));
  } else if (hrTab === 'leave') {
    const ls = await api('GET', '/api/leaves?all=1');
    tab.innerHTML = `<div class="card">${ls.length ? `<table><thead><tr><th>Nhân viên</th><th>Loại</th><th>Thời gian</th><th>Ngày</th><th>Lý do</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      ${ls.map(l => `<tr><td><b>${esc(l.name)}</b><br><small style="color:var(--muted)">${esc(l.dept)}</small></td><td>${LEAVE_TYPES[l.type]}</td><td>${fmtDate(l.from)}${l.to !== l.from ? ' → ' + fmtDate(l.to) : ''}</td><td>${l.days}</td><td>${esc(l.reason)}</td>
      <td>${pill(ST[l.status])}</td><td style="white-space:nowrap">${l.status === 'pending' ? `<button class="btn sm" data-d="approved" data-id="${l.id}">Duyệt</button> <button class="btn danger sm" data-d="rejected" data-id="${l.id}">Từ chối</button>` : ''}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">Không có đơn</div>'}</div>`;
    tab.querySelectorAll('[data-d]').forEach(b => b.onclick = async () => { await api('POST', `/api/leaves/${b.dataset.id}/decision`, { status: b.dataset.d }); toast('Đã cập nhật'); render(); });
  } else {
    const month = ymd(new Date()).slice(0, 7);
    const rows = await api('GET', `/api/timesheet?month=${month}`);
    tab.innerHTML = `<div class="card"><div class="card-title"><h2>Bảng công tháng ${month.slice(5)}/${month.slice(0, 4)}</h2></div><table><thead><tr><th>Nhân viên</th><th>Phòng ban</th><th>Ngày công</th><th>Đi muộn</th><th>Ngày nghỉ phép</th><th>Tổng giờ</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td><b>${esc(r.name)}</b></td><td>${esc(r.dept)}</td><td>${r.days}</td><td>${r.late ? pill(['p-amber', r.late]) : 0}</td><td>${r.leaveDays}</td><td>${r.hours}h</td></tr>`).join('')}</tbody></table></div>`;
  }
}
function empModal(e) {
  const x = e || { name: '', email: '', dept: '', position: '', phone: '', startDate: ymd(new Date()), role: 'employee', annualLeave: 12, active: true };
  modal(`<h2>${e ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h2><form id="ef">
    <label>Họ tên</label><input name="name" required value="${esc(x.name)}">
    <label>Email (đăng nhập)</label><input name="email" type="email" required value="${esc(x.email)}">
    <div class="row"><div><label>Phòng ban</label><input name="dept" value="${esc(x.dept)}" list="depts"></div><div><label>Chức vụ</label><input name="position" value="${esc(x.position)}"></div></div>
    <datalist id="depts"><option>Nhân sự<option>Kế toán<option>IT<option>Kinh doanh<option>Marketing</datalist>
    <div class="row"><div><label>Điện thoại</label><input name="phone" value="${esc(x.phone)}"></div><div><label>Ngày vào làm</label><input type="date" name="startDate" value="${x.startDate}"></div></div>
    <div class="row"><div><label>Phép năm (ngày)</label><input type="number" name="annualLeave" value="${x.annualLeave}" min="0"></div>
    <div><label>Vai trò</label><select name="role"><option value="employee" ${x.role === 'employee' ? 'selected' : ''}>Nhân viên</option><option value="admin" ${x.role === 'admin' ? 'selected' : ''}>Quản trị</option></select></div></div>
    <label>${e ? 'Đặt lại mật khẩu (để trống nếu không đổi)' : 'Mật khẩu (mặc định 123456)'}</label><input name="password" type="text">
    ${e ? `<label>Trạng thái</label><select name="active"><option value="1" ${x.active ? 'selected' : ''}>Đang làm việc</option><option value="0" ${!x.active ? 'selected' : ''}>Đã nghỉ việc</option></select>` : ''}
    <div class="actions"><button type="button" class="btn ghost" data-close>Đóng</button><button class="btn">Lưu</button></div></form>`, bg => {
    bg.querySelector('[data-close]').onclick = () => bg.remove();
    bg.querySelector('#ef').onsubmit = async ev => {
      ev.preventDefault(); const f = Object.fromEntries(new FormData(ev.target));
      if (f.active !== undefined) f.active = f.active === '1'; if (!f.password) delete f.password;
      try { await api(e ? 'PUT' : 'POST', e ? `/api/employees/${e.id}` : '/api/employees', f); bg.remove(); toast('Đã lưu'); render(); } catch (err) { toast(err.message, true); }
    };
  });
}

// ---------- khởi động ----------
async function boot() { try { ME = await api('GET', '/api/me'); } catch { ME = null; } render(); }
window.addEventListener('hashchange', render);
boot();
