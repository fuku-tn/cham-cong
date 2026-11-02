// Giao diện SPA thuần JS. Điều hướng bằng hash: #/dashboard, #/attendance, #/hr
const $app = document.getElementById('app');
let ME = null;
const LEAVE_TYPES = { annual: 'Phép năm', sick: 'Nghỉ ốm', unpaid: 'Không lương', other: 'Khác' };
const ST = { pending: ['p-amber', 'Chờ duyệt'], approved: ['p-green', 'Đã duyệt'], rejected: ['p-red', 'Từ chối'] };
const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// ---------- tiện ích ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = n => n.trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase();
const avatar = e => `<span class="avatar" style="background:${e.color}">${esc(initials(e.name))}</span>`;
const fmtDate = s => s.split('-').reverse().join('/');
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

// ---------- nhân vật chibi (SVG) ----------
function chibi(p) {
  const s = p.status, here = ['working', 'late'].includes(s);
  const desk = `<rect x="4" y="54" width="72" height="8" rx="3" fill="#dcbf97"/><rect x="10" y="62" width="4" height="12" fill="#c9a577"/><rect x="66" y="62" width="4" height="12" fill="#c9a577"/>`;
  if (s === 'absent' || s === 'off' || s === 'leave') {
    const extra = s === 'leave' ? `<text x="40" y="38" font-size="22" text-anchor="middle">🏖️</text>` : s === 'off' ? '' : `<text x="40" y="38" font-size="16" text-anchor="middle" opacity=".6">💤</text>`;
    return `<svg viewBox="0 0 80 80"><rect x="28" y="40" width="24" height="16" rx="6" fill="#cfd9d3"/>${extra}${desk}<rect x="29" y="46" width="22" height="8" rx="2" fill="#aab6af"/></svg>`;
  }
  const done = s === 'done';
  return `<svg viewBox="0 0 80 80">
    <rect x="24" y="38" width="32" height="20" rx="9" fill="${p.color}"/>
    <circle cx="40" cy="25" r="15" fill="#ffe2c6"/>
    <path d="M25 25a15 15 0 0 1 30 0c-6-7-11-9-15-9s-9 2-15 9z" fill="${p.hair}"/>
    <circle cx="34.5" cy="28" r="2" fill="#2b2118"/><circle cx="45.5" cy="28" r="2" fill="#2b2118"/>
    <circle cx="30" cy="32" r="2.6" fill="#ffb3a8" opacity=".7"/><circle cx="50" cy="32" r="2.6" fill="#ffb3a8" opacity=".7"/>
    <path d="${done ? 'M36 34q4 3 8 0' : 'M37 33.5q3 2.5 6 0'}" stroke="#b5654a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    ${s === 'late' ? '<path class="sweat" d="M58 14q3 5 0 7q-3-2 0-7z" fill="#6fb8e8"/>' : ''}
    ${done ? '<text x="62" y="20" font-size="13">👋</text>' : ''}
    <g class="${here ? 'typing' : ''}"><rect x="27" y="44" width="26" height="12" rx="2.5" fill="#5f7080"/><circle cx="40" cy="50" r="2" fill="#c9d4dd"/></g>
    ${desk}</svg>`;
}
const STATUS_TXT = { working: 'Đang làm việc', late: 'Đi muộn', done: 'Đã về', leave: 'Nghỉ phép', absent: 'Chưa chấm công', off: 'Ngày nghỉ' };

// ---------- đăng nhập ----------
function loginView() {
  $app.innerHTML = `<div class="login-wrap"><form class="login-card" id="lf">
    <div class="logo">🌿 teid.</div><p class="sub">Chấm công & Quản lý nhân sự</p>
    <label>Email</label><input name="email" type="email" required autofocus value="admin@company.vn">
    <label>Mật khẩu</label><input name="password" type="password" required value="admin123">
    <button class="btn big" style="width:100%;margin-top:20px">Đăng nhập</button>
    <div class="hint"><b>Tài khoản demo</b><br>Quản trị: admin@company.vn / admin123<br>Nhân viên: nv02@company.vn … nv20@company.vn / 123456</div>
  </form></div>`;
  document.getElementById('lf').onsubmit = async e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    try { await api('POST', '/api/login', f); await boot(); location.hash = '#/dashboard'; } catch (err) { toast(err.message, true); }
  };
}

// ---------- khung chính ----------
const PAGES = {
  dashboard: { title: 'Tổng quan', icon: '📊', view: dashboardView },
  attendance: { title: 'Chấm công & Nghỉ phép', icon: '🕒', view: attendanceView },
  hr: { title: 'Quản lý nhân sự', icon: '👥', view: hrView, admin: true },
};
async function render() {
  if (!ME) return loginView();
  let key = (location.hash.replace('#/', '') || 'dashboard');
  if (!PAGES[key] || (PAGES[key].admin && ME.role !== 'admin')) key = 'dashboard';
  const nav = Object.entries(PAGES).filter(([, p]) => !p.admin || ME.role === 'admin')
    .map(([k, p]) => `<a href="#/${k}" class="${k === key ? 'active' : ''}"><span>${p.icon}</span>${p.title}</a>`).join('');
  $app.innerHTML = `<div class="shell">
    <aside class="side"><div class="brand">🌿 teid.</div><div class="label">Bảng điều khiển</div>
      <nav class="nav">${nav}</nav><div class="spacer"></div>
      <div class="me">${avatar(ME)}<div><b style="font-size:13px">${esc(ME.name)}</b><small>${ME.role === 'admin' ? 'Quản trị viên' : esc(ME.position)}</small></div>
      <button class="out" title="Đăng xuất" id="logout">⏻</button></div></aside>
    <main class="main" id="page"><div class="empty">Đang tải…</div></main></div>`;
  document.getElementById('logout').onclick = async () => { await api('POST', '/api/logout'); ME = null; render(); };
  try { await PAGES[key].view(document.getElementById('page')); } catch (e) { toast(e.message, true); }
}

// ---------- Dashboard ----------
async function dashboardView(el) {
  const d = await api('GET', '/api/dashboard');
  const stat = (ico, n, label, bg) => `<div class="card stat"><div class="ico" style="background:${bg}">${ico}</div><div><b>${n}</b><span>${label}</span></div></div>`;
  const byDept = {};
  d.people.forEach(p => (byDept[p.dept] ||= []).push(p));
  const maxTrend = Math.max(1, ...d.trend.map(t => t.present));
  el.innerHTML = `
    <div class="head"><div><h1>Xin chào, ${esc(ME.name.split(' ').pop())} 👋</h1>
      <span style="color:var(--muted)">Tình hình công ty hôm nay · ${fmtDate(d.today)}</span></div>
      ${d.isAdmin && d.pending ? `<a class="btn" href="#/hr" style="text-decoration:none">${d.pending} đơn chờ duyệt</a>` : ''}</div>
    <div class="grid g5">
      ${stat('✅', d.working, 'Có mặt', '#e4f3e8')}${stat('⏰', d.late, 'Đi muộn', '#fdf0d8')}
      ${stat('🏖️', d.leave, 'Nghỉ phép', '#e3ecfd')}${stat('❓', d.absent, 'Chưa chấm công', '#fde8e6')}
      ${stat('👥', d.total, 'Tổng nhân sự', '#eef1ef')}
    </div>
    <div class="grid g2 mt">
      <div class="card"><h2>Văn phòng hôm nay <small style="color:var(--muted);font-weight:400">Rê chuột vào nhân vật để xem chi tiết</small></h2>
        <div class="office">${Object.entries(byDept).map(([dept, ps]) => `
          <div class="zone"><h3>${esc(dept)} <span>${ps.filter(p => ['working', 'late', 'done'].includes(p.status)).length}/${ps.length}</span></h3>
          <div class="desks">${ps.map(p => `<div class="desk ${p.status}" title="${esc(p.name)} — ${STATUS_TXT[p.status]}${p.checkIn ? '\nVào: ' + p.checkIn : ''}${p.checkOut ? ' · Ra: ' + p.checkOut : ''}">
            ${chibi(p)}<span>${esc(p.name.split(' ').slice(-2).join(' '))}</span><em>${p.checkIn || STATUS_TXT[p.status]}</em></div>`).join('')}</div></div>`).join('')}
        </div></div>
      <div style="display:grid;gap:16px;align-content:start">
        <div class="card"><h2>Theo phòng ban</h2>${d.depts.map(x => `
          <div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;margin-bottom:5px"><span>${esc(x.dept)}</span><b>${x.present}/${x.total}</b></div>
          <div class="bar"><i style="width:${x.total ? x.present / x.total * 100 : 0}%"></i></div></div>`).join('')}</div>
        <div class="card"><h2>7 ngày làm việc gần nhất</h2>
          <div style="display:flex;gap:8px;align-items:flex-end;height:110px">${d.trend.map(t => `
            <div style="flex:1;text-align:center;font-size:11px;color:var(--muted)"><div title="${t.present} có mặt, ${t.late} muộn" style="height:${t.present / maxTrend * 80}px;background:var(--green);border-radius:6px 6px 0 0;min-height:3px"></div>${t.date.slice(8)}/${t.date.slice(5, 7)}</div>`).join('')}</div></div>
        <div class="card"><h2>Lịch nghỉ sắp tới</h2>${d.upcoming.length ? d.upcoming.map(l => `
          <div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${esc(l.name)}</b><br><small style="color:var(--muted)">${LEAVE_TYPES[l.type]} · ${fmtDate(l.from)}${l.to !== l.from ? ' → ' + fmtDate(l.to) : ''}</small></div>`).join('') : '<div class="empty">Không có lịch nghỉ</div>'}</div>
      </div></div>`;
}

// ---------- Chấm công & nghỉ phép ----------
let calMonth = new Date().toISOString().slice(0, 7);
async function attendanceView(el) {
  ME = await api('GET', '/api/me');
  const [att, leaves] = await Promise.all([api('GET', `/api/attendance?month=${calMonth}`), api('GET', '/api/leaves')]);
  const today = ymd(new Date());
  const rec = (await api('GET', `/api/attendance?month=${today.slice(0, 7)}`)).records.find(r => r.date === today);
  const [y, m] = calMonth.split('-').map(Number);
  const first = new Date(y, m - 1, 1), nDays = new Date(y, m, 0).getDate(), offset = (first.getDay() + 6) % 7;
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
    <div class="head"><h1>Chấm công & Nghỉ phép</h1><button class="btn" id="newLeave">+ Xin nghỉ phép</button></div>
    <div class="card checkin"><div><div style="color:var(--muted)">Hôm nay · ${fmtDate(today)}</div><div class="clock" id="clock">--:--:--</div>
      <div id="ciInfo" style="margin-top:6px">${!rec ? 'Bạn chưa chấm công vào.' : `Vào lúc <b>${rec.checkIn}</b>${rec.late ? ' <span class="pill p-amber">Đi muộn</span>' : ' <span class="pill p-green">Đúng giờ</span>'}${rec.checkOut ? ` · Ra lúc <b>${rec.checkOut}</b> (${rec.hours}h)` : ''}`}</div>
      <small style="color:var(--muted)">Giờ vào: ${ME.settings.workStart} · Muộn sau ${ME.settings.lateAfter}</small></div>
      <div>${!rec ? '<button class="btn big" id="ci">Chấm công vào</button>' : !rec.checkOut ? '<button class="btn big" id="co">Chấm công ra</button>' : '<span class="pill p-gray">Đã hoàn thành hôm nay</span>'}</div></div>
    <div class="grid g2 mt">
      <div class="card"><div class="cal-head"><button id="prev">‹</button><span>Tháng ${m}/${y}</span><button id="next">›</button></div>
        <div class="cal">${cells}</div>
        <div class="legend"><span><i class="dot" style="background:#9fd1ac"></i>Đúng giờ</span><span><i class="dot" style="background:#f0d9a5"></i>Đi muộn</span><span><i class="dot" style="background:#b9cdf5"></i>Nghỉ phép</span><span><i class="dot" style="background:#f3b4ae"></i>Vắng</span></div></div>
      <div style="display:grid;gap:16px;align-content:start">
        <div class="card"><h2>Thống kê tháng</h2>
          <div class="row"><div><b style="font-size:24px">${att.records.length}</b><br><small style="color:var(--muted)">Ngày công</small></div>
          <div><b style="font-size:24px">${att.records.filter(r => r.late).length}</b><br><small style="color:var(--muted)">Lần muộn</small></div>
          <div><b style="font-size:24px">${monthHours.toFixed(0)}h</b><br><small style="color:var(--muted)">Giờ làm</small></div></div></div>
        <div class="card"><h2>Phép năm ${new Date().getFullYear()}</h2>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>Còn lại</span><b>${left}/${ME.annualLeave} ngày</b></div>
          <div class="bar"><i style="width:${ME.annualLeave ? left / ME.annualLeave * 100 : 0}%"></i></div></div>
      </div></div>
    <div class="card mt"><h2>Đơn nghỉ phép của tôi</h2>${leaves.length ? `<table><tr><th>Loại</th><th>Thời gian</th><th>Số ngày</th><th>Lý do</th><th>Trạng thái</th><th></th></tr>
      ${leaves.map(l => `<tr><td>${LEAVE_TYPES[l.type]}</td><td>${fmtDate(l.from)}${l.to !== l.from ? ' → ' + fmtDate(l.to) : ''}</td><td>${l.days}</td><td>${esc(l.reason)}</td>
      <td><span class="pill ${ST[l.status][0]}">${ST[l.status][1]}</span></td><td>${l.status === 'pending' ? `<button class="btn danger sm" data-cancel="${l.id}">Huỷ đơn</button>` : ''}</td></tr>`).join('')}</table>` : '<div class="empty">Chưa có đơn nào</div>'}</div>`;

  const tick = () => { const c = document.getElementById('clock'); if (c) c.textContent = new Date().toLocaleTimeString('vi-VN', { hour12: false }); else clearInterval(timer); };
  const timer = setInterval(tick, 1000); tick();
  const act = (id, url, msg) => { const b = document.getElementById(id); if (b) b.onclick = async () => { try { await api('POST', url); toast(msg); render(); } catch (e) { toast(e.message, true); } }; };
  act('ci', '/api/attendance/checkin', 'Chấm công vào thành công ✔'); act('co', '/api/attendance/checkout', 'Chấm công ra thành công ✔');
  const shift = n => { const d = new Date(y, m - 1 + n, 1); calMonth = ymd(d).slice(0, 7); render(); };
  document.getElementById('prev').onclick = () => shift(-1); document.getElementById('next').onclick = () => shift(1);
  el.querySelectorAll('[data-cancel]').forEach(b => b.onclick = async () => { await api('POST', `/api/leaves/${b.dataset.cancel}/cancel`); toast('Đã huỷ đơn'); render(); });
  document.getElementById('newLeave').onclick = () => leaveModal();
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
  el.innerHTML = `<div class="head"><h1>Quản lý nhân sự</h1><button class="btn" id="addEmp">+ Thêm nhân viên</button></div>
    <div class="tabs">${[['staff', 'Nhân viên'], ['leave', 'Duyệt nghỉ phép'], ['sheet', 'Bảng công tháng']].map(([k, v]) => `<button data-t="${k}" class="${hrTab === k ? 'on' : ''}">${v}</button>`).join('')}</div><div id="tab"></div>`;
  el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { hrTab = b.dataset.t; render(); });
  document.getElementById('addEmp').onclick = () => empModal();
  const tab = document.getElementById('tab');
  if (hrTab === 'staff') {
    const list = await api('GET', '/api/employees');
    tab.innerHTML = `<div class="card"><table><tr><th>Nhân viên</th><th>Phòng ban</th><th>Chức vụ</th><th>Liên hệ</th><th>Ngày vào</th><th>Trạng thái</th><th></th></tr>
      ${list.map(e => `<tr><td><div class="who">${avatar(e)}<div><b>${esc(e.name)}</b><small>${esc(e.email)}</small></div></div></td><td>${esc(e.dept)}</td><td>${esc(e.position)}</td><td>${esc(e.phone)}</td><td>${fmtDate(e.startDate)}</td>
      <td><span class="pill ${e.active ? 'p-green' : 'p-gray'}">${e.active ? (e.role === 'admin' ? 'Quản trị' : 'Đang làm') : 'Đã nghỉ việc'}</span></td><td><button class="btn ghost sm" data-edit="${e.id}">Sửa</button></td></tr>`).join('')}</table></div>`;
    tab.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => empModal(list.find(e => e.id == b.dataset.edit)));
  } else if (hrTab === 'leave') {
    const ls = await api('GET', '/api/leaves?all=1');
    tab.innerHTML = `<div class="card">${ls.length ? `<table><tr><th>Nhân viên</th><th>Loại</th><th>Thời gian</th><th>Ngày</th><th>Lý do</th><th>Trạng thái</th><th></th></tr>
      ${ls.map(l => `<tr><td><b>${esc(l.name)}</b><br><small style="color:var(--muted)">${esc(l.dept)}</small></td><td>${LEAVE_TYPES[l.type]}</td><td>${fmtDate(l.from)}${l.to !== l.from ? ' → ' + fmtDate(l.to) : ''}</td><td>${l.days}</td><td>${esc(l.reason)}</td>
      <td><span class="pill ${ST[l.status][0]}">${ST[l.status][1]}</span></td><td style="white-space:nowrap">${l.status === 'pending' ? `<button class="btn sm" data-d="approved" data-id="${l.id}">Duyệt</button> <button class="btn danger sm" data-d="rejected" data-id="${l.id}">Từ chối</button>` : ''}</td></tr>`).join('')}</table>` : '<div class="empty">Không có đơn</div>'}</div>`;
    tab.querySelectorAll('[data-d]').forEach(b => b.onclick = async () => { await api('POST', `/api/leaves/${b.dataset.id}/decision`, { status: b.dataset.d }); toast('Đã cập nhật'); render(); });
  } else {
    const month = new Date().toISOString().slice(0, 7);
    const rows = await api('GET', `/api/timesheet?month=${month}`);
    tab.innerHTML = `<div class="card"><h2>Bảng công tháng ${month.slice(5)}/${month.slice(0, 4)}</h2><table><tr><th>Nhân viên</th><th>Phòng ban</th><th>Ngày công</th><th>Đi muộn</th><th>Ngày nghỉ phép</th><th>Tổng giờ</th></tr>
      ${rows.map(r => `<tr><td><b>${esc(r.name)}</b></td><td>${esc(r.dept)}</td><td>${r.days}</td><td>${r.late ? `<span class="pill p-amber">${r.late}</span>` : 0}</td><td>${r.leaveDays}</td><td>${r.hours}h</td></tr>`).join('')}</table></div>`;
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
