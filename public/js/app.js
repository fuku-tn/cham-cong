// Starttrain – Chấm công. SPA thuần JS. Một người phụ trách đăng nhập và chấm công thay toàn bộ nhân viên.
// Điều hướng bằng hash: #/dashboard, #/attendance, #/hr
const $app = document.getElementById('app');
const COMPANY = 'Starttrain';
let ME = null;
const LEAVE_TYPES = { annual: 'Phép năm', sick: 'Nghỉ ốm', unpaid: 'Không lương', other: 'Khác' };
const WORK_ST = {
  working: ['p-green', 'Đang làm việc'], late: ['p-amber', 'Đi muộn'], done: ['p-gray', 'Đã ra về'],
  leave: ['p-blue', 'Nghỉ phép'], absent: ['p-red', 'Chưa chấm công'], off: ['p-gray', 'Ngày nghỉ'],
};

// ---------- biểu tượng ----------
const PATHS = {
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
};
const icon = n => `<svg class="ic" viewBox="0 0 24 24">${PATHS[n]}</svg>`;
const LOGO = `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="20" height="20" rx="2"/><rect x="9" y="9" width="20" height="20" rx="2" fill="#f5f4f0"/><path d="M14 20l3 3 6-7" stroke="#5fa043" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const BRAND = `<div class="logo">${LOGO}${COMPANY.toUpperCase()}</div>`;

// ---------- tiện ích ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = n => n.trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase();
const avatar = e => `<span class="avatar" style="background:${e.color}1f;color:${e.color}">${esc(initials(e.name))}</span>`;
const fmtDate = s => s.split('-').reverse().join('/');
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
const nowHM = () => new Date().toTimeString().slice(0, 5);
const pill = ([cls, txt]) => `<span class="pill ${cls}">${txt}</span>`;
const dayName = s => ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][new Date(s + 'T00:00:00').getDay()];
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
const run = async (fn, okMsg) => { try { await fn(); if (okMsg) toast(okMsg); } catch (e) { toast(e.message, true); } };
function modal(html, onMount) {
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal">${html}</div>`;
  bg.addEventListener('mousedown', e => { if (e.target === bg) bg.remove(); });
  document.body.appendChild(bg); onMount?.(bg); return bg;
}

// ---------- đăng nhập ----------
function loginView() {
  $app.innerHTML = `<div class="login-wrap"><div>
      <div style="margin-bottom:40px">${BRAND}</div>
      <div class="eyebrow"><i></i>Hệ thống chấm công nội bộ</div>
      <h1 style="font-size:52px">Chấm công<br>minh bạch, <span class="accent">chính xác</span></h1>
      <p class="lead">Một nơi duy nhất để ghi nhận giờ làm, nghỉ phép và theo dõi chuyên cần của toàn bộ nhân viên ${COMPANY}.</p></div>
    <form class="login-card" id="lf"><h2>Đăng nhập</h2><p class="sub">Dành cho người phụ trách chấm công.</p>
      <label>Email</label><input name="email" type="email" required autofocus value="admin@starttrain.vn">
      <label>Mật khẩu</label><input name="password" type="password" required>
      <button class="btn big" style="width:100%;margin-top:24px;justify-content:center">Đăng nhập ${icon('arrow')}</button>
      <div class="hint">Lần đầu đăng nhập: <b>admin@starttrain.vn</b> / <b>admin123</b>.<br>Vui lòng đổi mật khẩu ngay sau khi vào (nút “Đổi mật khẩu” ở góc phải).</div></form></div>`;
  document.getElementById('lf').onsubmit = e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    run(async () => { await api('POST', '/api/login', f); await boot(); location.hash = '#/dashboard'; });
  };
}
function passwordModal() {
  modal(`<h2>Đổi mật khẩu</h2><form id="pf"><label>Mật khẩu mới (tối thiểu 6 ký tự)</label><input name="password" type="password" minlength="6" required autofocus>
    <div class="actions"><button type="button" class="btn ghost" data-close>Đóng</button><button class="btn">Lưu</button></div></form>`, bg => {
    bg.querySelector('[data-close]').onclick = () => bg.remove();
    bg.querySelector('#pf').onsubmit = e => { e.preventDefault(); run(async () => { await api('POST', '/api/password', Object.fromEntries(new FormData(e.target))); bg.remove(); }, 'Đã đổi mật khẩu'); };
  });
}

// ---------- khung chính ----------
const PAGES = {
  dashboard: { title: 'Tổng quan', view: dashboardView },
  attendance: { title: 'Chấm công', view: attendanceView },
  hr: { title: 'Nhân sự', view: hrView },
};
async function render() {
  if (!ME) return loginView();
  let key = location.hash.replace('#/', '') || 'dashboard';
  if (!PAGES[key]) key = 'dashboard';
  const nav = Object.entries(PAGES).map(([k, p]) => `<a href="#/${k}" class="${k === key ? 'active' : ''}">${p.title}</a>`).join('');
  $app.innerHTML = `<header class="topbar">${BRAND}<nav class="nav">${nav}</nav>
    <div class="userbox"><div class="who-mini"><b>${esc(ME.name)}</b><small>${esc(ME.position)}</small></div>
    <button class="btn ghost sm" id="pw">Đổi mật khẩu</button><button class="btn ghost sm" id="logout">Đăng xuất</button></div></header>
    <main class="page" id="page"><div class="empty">Đang tải…</div></main>`;
  document.getElementById('pw').onclick = passwordModal;
  document.getElementById('logout').onclick = async () => { await api('POST', '/api/logout'); ME = null; render(); };
  try { await PAGES[key].view(document.getElementById('page')); } catch (e) { toast(e.message, true); }
}

// ---------- Tổng quan ----------
let statusFilter = '';
async function dashboardView(el) {
  const d = await api('GET', '/api/dashboard');
  const present = d.working + d.late, expected = d.total - d.leave - d.off;
  const rate = expected > 0 ? Math.round(present / expected * 100) : null;
  const C = 2 * Math.PI * 52;
  const maxTrend = Math.max(1, ...d.trend.map(t => t.present), d.total);
  const order = { late: 0, working: 1, done: 2, leave: 3, absent: 4, off: 5 };
  const people = d.people.filter(p => !statusFilter || p.status === statusFilter).sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name, 'vi'));
  el.innerHTML = `
    <section class="hero">
      <div><div class="eyebrow"><i></i>${dayName(d.today)}, ${fmtDate(d.today)}</div>
        <h1>Chấm công <span class="accent">chính xác</span><br>cho đội ngũ ${COMPANY}</h1>
        <p class="lead">Theo dõi chuyên cần, nghỉ phép và giờ làm của ${d.total} nhân viên trong một màn hình.</p>
        <div class="actions"><a class="btn" href="#/attendance">Chấm công hôm nay ${icon('arrow')}</a><a class="btn ghost" href="#/hr">Danh sách nhân sự</a></div></div>
      <div class="snap"><div class="ring"><svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="52" fill="none" stroke="#3a4247" stroke-width="10"/>
        <circle cx="66" cy="66" r="52" fill="none" stroke="#7fc45f" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - (rate || 0) / 100)}"/></svg><b>${rate === null ? '—' : rate + '%'}</b></div>
        <div><h3>Tỷ lệ chuyên cần hôm nay</h3><p>${rate === null ? 'Hôm nay là ngày nghỉ' : 'Trên số nhân viên phải đi làm'}</p>
          <div class="li"><span>Có mặt</span><b>${present}</b></div><div class="li"><span>Nghỉ phép</span><b>${d.leave}</b></div><div class="li"><span>Chưa chấm công</span><b>${d.absent}</b></div></div></div>
    </section>
    <div class="card glass"><div class="metrics">
      <div>${icon('users')}<div><b>${d.total}</b><span>Nhân viên đang làm việc</span></div></div>
      <div>${icon('calendar')}<div><b>${d.workdaysSoFar}</b><span>Ngày làm việc trong tháng</span></div></div>
      <div>${icon('clock')}<div><b>${d.lateMonth}</b><span>Lượt đi muộn trong tháng</span></div></div></div></div>
    <section class="panel">
      <div><span class="box">${icon('check')}</span><div><b>${d.working}</b><span>Có mặt</span></div></div>
      <div><span class="box">${icon('clock')}</span><div><b>${d.late}</b><span>Đi muộn (sau ${ME.settings.lateAfter})</span></div></div>
      <div><span class="box">${icon('calendar')}</span><div><b>${d.leave}</b><span>Đang nghỉ phép</span></div></div>
      <div><span class="box">${icon('alert')}</span><div><b>${d.absent}</b><span>Chưa chấm công</span></div></div></section>
    <div class="grid g2">
      <div class="card"><div class="card-title"><h2>Tình trạng nhân viên hôm nay</h2>
        <div class="filters"><select id="sf"><option value="">Tất cả trạng thái</option>${Object.entries(WORK_ST).map(([k, v]) => `<option value="${k}" ${k === statusFilter ? 'selected' : ''}>${v[1]}</option>`).join('')}</select></div></div>
        <table><thead><tr><th>Nhân viên</th><th>Giờ vào</th><th>Giờ ra</th><th>Trạng thái</th></tr></thead><tbody>
        ${people.map(p => `<tr><td><div class="who">${avatar(p)}<div><b>${esc(p.name)}</b><small>${esc(p.position)}</small></div></div></td>
          <td>${p.checkIn || '—'}</td><td>${p.checkOut || '—'}</td><td>${pill(WORK_ST[p.status])}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">Không có dữ liệu</td></tr>'}</tbody></table></div>
      <div style="display:grid;gap:18px;align-content:start">
        <div class="card"><div class="card-title"><h2>7 ngày làm việc gần nhất</h2><small>Số người có mặt</small></div>
          <div style="display:flex;gap:10px;align-items:flex-end;height:120px">${d.trend.map(t => `
            <div style="flex:1;text-align:center;font-size:11px;color:var(--muted)"><div title="${t.present} có mặt, ${t.late} đi muộn" style="height:${t.present / maxTrend * 84}px;background:var(--ink);border-radius:6px 6px 2px 2px;min-height:3px;margin-bottom:6px"></div>${t.date.slice(8)}/${t.date.slice(5, 7)}</div>`).join('')}</div></div>
        <div class="card"><div class="card-title"><h2>Đi muộn nhiều nhất tháng này</h2></div>${d.topLate.length ? d.topLate.map(t => `
          <div class="list-item" style="display:flex;justify-content:space-between"><b>${esc(t.name)}</b><span class="pill p-amber">${t.n} lần</span></div>`).join('') : '<div class="empty">Chưa có lượt đi muộn</div>'}</div>
        <div class="card"><div class="card-title"><h2>Lịch nghỉ sắp tới</h2></div>${d.upcoming.length ? d.upcoming.map(l => `
          <div class="list-item"><b>${esc(l.name)}</b><br><small>${LEAVE_TYPES[l.type]} · ${fmtDate(l.from)}${l.to !== l.from ? ' → ' + fmtDate(l.to) : ''}</small></div>`).join('') : '<div class="empty">Không có lịch nghỉ</div>'}</div>
      </div></div>`;
  document.getElementById('sf').onchange = e => { statusFilter = e.target.value; render(); };
}

// ---------- Chấm công ----------
let attTab = 'day', attDate = ymd(new Date()), sheetMonth = ymd(new Date()).slice(0, 7);
async function attendanceView(el) {
  el.innerHTML = `<div class="page-head"><div><div class="eyebrow"><i></i>Người phụ trách chấm công</div><h1>Chấm công <span class="accent">nhân viên</span></h1></div></div>
    <div class="tabs">${[['day', 'Chấm công theo ngày'], ['leave', 'Nghỉ phép'], ['sheet', 'Bảng công tháng']].map(([k, v]) => `<button data-t="${k}" class="${attTab === k ? 'on' : ''}">${v}</button>`).join('')}</div><div id="tab"></div>`;
  el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { attTab = b.dataset.t; render(); });
  const tab = document.getElementById('tab');
  if (attTab === 'day') await dayTab(tab); else if (attTab === 'leave') await leaveTab(tab); else await sheetTab(tab);
}

async function dayTab(tab) {
  const r = await api('GET', `/api/roster?date=${attDate}`);
  const today = ymd(new Date()), isToday = attDate === today, future = attDate > today;
  const cnt = s => r.rows.filter(x => x.status === s).length;
  const unmarked = r.rows.filter(x => x.status === 'absent');
  const editable = !r.weekend && !future;
  tab.innerHTML = `
    <div class="checkin" style="grid-template-columns:1fr auto">
      <div><div class="muted">Ngày chấm công</div><div style="display:flex;align-items:center;gap:12px;margin-top:6px">
        <button class="navbtn" id="dprev">‹</button><input type="date" id="dpick" value="${attDate}" max="${today}" style="width:auto;background:#fff">
        <button class="navbtn" id="dnext" ${isToday ? 'disabled' : ''}>›</button>${!isToday ? '<button class="btn sm" style="background:#fff;color:var(--ink)" id="dtoday">Hôm nay</button>' : ''}</div>
        <div style="margin-top:10px">${dayName(attDate)} · ${fmtDate(attDate)}${r.weekend ? ' · <b>Ngày nghỉ cuối tuần</b>' : ''}${future ? ' · <b>Chưa đến ngày</b>' : ''}</div>
        <small class="muted">Giờ vào ${ME.settings.workStart} · Tính muộn sau ${ME.settings.lateAfter} · Giờ ra ${ME.settings.workEnd}</small></div>
      <div style="text-align:right">${editable && unmarked.length ? `<button class="btn big" id="bulk">Chấm vào cho ${unmarked.length} người chưa chấm</button>` : ''}
        <div style="margin-top:10px;color:#c7cdca;font-size:13px">Có mặt ${cnt('working') + cnt('late') + cnt('done')} · Muộn ${cnt('late')} · Nghỉ ${cnt('leave')} · Chưa chấm ${cnt('absent')}</div></div></div>
    <div class="card mt"><table><thead><tr><th>Nhân viên</th><th>Trạng thái</th><th>Giờ vào</th><th>Giờ ra</th><th>Giờ làm</th><th style="text-align:right">Thao tác</th></tr></thead><tbody>
      ${r.rows.map(x => {
        const has = !!x.checkIn;
        const act = !editable ? '' : x.status === 'leave' ? `<small style="color:var(--muted)">${LEAVE_TYPES[x.leaveType]}</small>` :
          `${!has ? `<button class="btn sm" data-in="${x.id}">Vào ${isToday ? 'ngay' : ''}</button>` : !x.checkOut ? `<button class="btn sm" data-out="${x.id}">Ra ${isToday ? 'ngay' : ''}</button>` : ''}
           ${has ? `<button class="btn ghost sm" data-edit="${x.id}">Sửa giờ</button> <button class="btn danger sm" data-clear="${x.id}">Xoá</button>` : `<button class="btn ghost sm" data-edit="${x.id}">Nhập giờ</button>`}`;
        return `<tr><td><div class="who">${avatar(x)}<div><b>${esc(x.name)}</b><small>${esc(x.position)}</small></div></div></td><td>${pill(WORK_ST[x.status])}</td>
          <td>${x.checkIn || '—'}</td><td>${x.checkOut || '—'}</td><td>${x.checkOut ? x.hours + 'h' : '—'}</td><td style="text-align:right;white-space:nowrap">${act}</td></tr>`;
      }).join('')}</tbody></table></div>`;

  const go = d => { attDate = d; render(); };
  document.getElementById('dprev').onclick = () => go(addDays(attDate, -1));
  document.getElementById('dnext').onclick = () => go(addDays(attDate, 1));
  document.getElementById('dpick').onchange = e => e.target.value && go(e.target.value);
  document.getElementById('dtoday')?.addEventListener('click', () => go(today));
  const mark = (id, body, msg) => run(async () => { await api('POST', '/api/attendance/mark', { userId: id, date: attDate, ...body }); render(); }, msg);
  // Hôm nay: giờ hiện tại. Ngày cũ: giờ chuẩn (có thể sửa lại bằng "Sửa giờ")
  const defIn = isToday ? nowHM : () => ME.settings.workStart, defOut = isToday ? nowHM : () => ME.settings.workEnd;
  tab.querySelectorAll('[data-in]').forEach(b => b.onclick = () => mark(+b.dataset.in, { checkIn: defIn() }, 'Đã chấm vào'));
  tab.querySelectorAll('[data-out]').forEach(b => b.onclick = () => mark(+b.dataset.out, { checkOut: defOut() }, 'Đã chấm ra'));
  tab.querySelectorAll('[data-clear]').forEach(b => b.onclick = () => confirm('Xoá chấm công của nhân viên này trong ngày?') && mark(+b.dataset.clear, { clear: true }, 'Đã xoá'));
  tab.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => timeModal(r.rows.find(x => x.id == b.dataset.edit)));
  document.getElementById('bulk')?.addEventListener('click', () => bulkModal(unmarked));
}
function timeModal(x) {
  modal(`<h2>${esc(x.name)}</h2><p style="color:var(--muted)">${dayName(attDate)} · ${fmtDate(attDate)}</p><form id="tf">
    <div class="row"><div><label>Giờ vào</label><input type="time" name="checkIn" value="${x.checkIn || ''}" required></div><div><label>Giờ ra (để trống nếu chưa về)</label><input type="time" name="checkOut" value="${x.checkOut || ''}"></div></div>
    <div class="actions"><button type="button" class="btn ghost" data-close>Đóng</button><button class="btn">Lưu</button></div></form>`, bg => {
    bg.querySelector('[data-close]').onclick = () => bg.remove();
    bg.querySelector('#tf').onsubmit = e => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
      run(async () => { await api('POST', '/api/attendance/mark', { userId: x.id, date: attDate, checkIn: f.checkIn, checkOut: f.checkOut || null }); bg.remove(); render(); }, 'Đã lưu');
    };
  });
}
function bulkModal(list) {
  const isToday = attDate === ymd(new Date());
  modal(`<h2>Chấm vào hàng loạt</h2><p style="color:var(--muted)">Áp dụng cho ${list.length} nhân viên chưa chấm công ngày ${fmtDate(attDate)}. Nhân viên nghỉ phép được bỏ qua tự động.</p>
    <form id="bf"><label>Giờ vào</label><input type="time" name="t" value="${isToday ? nowHM() : ME.settings.workStart}" required>
    <div class="actions"><button type="button" class="btn ghost" data-close>Đóng</button><button class="btn">Chấm vào tất cả</button></div></form>`, bg => {
    bg.querySelector('[data-close]').onclick = () => bg.remove();
    bg.querySelector('#bf').onsubmit = e => {
      e.preventDefault(); const t = new FormData(e.target).get('t');
      run(async () => { for (const x of list) await api('POST', '/api/attendance/mark', { userId: x.id, date: attDate, checkIn: t }); bg.remove(); render(); }, 'Đã chấm công hàng loạt');
    };
  });
}

async function leaveTab(tab) {
  const ls = await api('GET', '/api/leaves');
  tab.innerHTML = `<div class="card"><div class="card-title"><h2>Nghỉ phép đã ghi nhận</h2><button class="btn sm" id="newLeave">${icon('plus')} Ghi nhận nghỉ phép</button></div>
    ${ls.length ? `<table><thead><tr><th>Nhân viên</th><th>Loại</th><th>Thời gian</th><th>Ngày</th><th>Lý do</th><th></th></tr></thead><tbody>
    ${ls.map(l => `<tr><td><b>${esc(l.name)}</b></td><td>${LEAVE_TYPES[l.type]}</td><td>${fmtDate(l.from)}${l.to !== l.from ? ' → ' + fmtDate(l.to) : ''}</td><td>${l.days}</td><td>${esc(l.reason)}</td>
    <td style="text-align:right"><button class="btn danger sm" data-del="${l.id}">Xoá</button></td></tr>`).join('')}</tbody></table>` : '<div class="empty">Chưa có nghỉ phép nào được ghi nhận</div>'}</div>`;
  document.getElementById('newLeave').onclick = leaveModal;
  tab.querySelectorAll('[data-del]').forEach(b => b.onclick = () => confirm('Xoá bản ghi nghỉ phép này?') && run(async () => { await api('POST', `/api/leaves/${b.dataset.del}/delete`); render(); }, 'Đã xoá'));
}
async function leaveModal() {
  const list = (await api('GET', '/api/employees')).filter(e => e.active), t = ymd(new Date());
  modal(`<h2>Ghi nhận nghỉ phép</h2><form id="lf">
    <label>Nhân viên</label><select name="userId" id="lu">${list.map(e => `<option value="${e.id}">${esc(e.name)} (phép năm còn ${e.annualLeave - e.leaveUsed})</option>`).join('')}</select>
    <label>Loại nghỉ</label><select name="type">${Object.entries(LEAVE_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
    <div class="row"><div><label>Từ ngày</label><input type="date" name="from" value="${t}" required></div><div><label>Đến ngày</label><input type="date" name="to" value="${t}" required></div></div>
    <label>Lý do</label><textarea name="reason" rows="2" placeholder="Không bắt buộc"></textarea>
    <div class="actions"><button type="button" class="btn ghost" data-close>Đóng</button><button class="btn">Lưu</button></div></form>`, bg => {
    bg.querySelector('[data-close]').onclick = () => bg.remove();
    bg.querySelector('#lf').onsubmit = e => {
      e.preventDefault();
      run(async () => { await api('POST', '/api/leaves', Object.fromEntries(new FormData(e.target))); bg.remove(); render(); }, 'Đã ghi nhận nghỉ phép');
    };
  });
}

async function sheetTab(tab) {
  const rows = await api('GET', `/api/timesheet?month=${sheetMonth}`);
  tab.innerHTML = `<div class="card"><div class="card-title"><h2>Bảng công tháng</h2>
    <div class="filters"><input type="month" id="sm" value="${sheetMonth}" style="width:auto"><button class="btn ghost sm" id="csv">${icon('download')} Xuất CSV</button></div></div>
    <table><thead><tr><th>Nhân viên</th><th>Chức vụ</th><th>Ngày công</th><th>Đi muộn</th><th>Ngày nghỉ phép</th><th>Tổng giờ</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td><b>${esc(r.name)}</b></td><td>${esc(r.position)}</td><td>${r.days}</td><td>${r.late ? pill(['p-amber', r.late]) : 0}</td><td>${r.leaveDays}</td><td>${r.hours}h</td></tr>`).join('')}</tbody></table></div>`;
  document.getElementById('sm').onchange = e => { if (e.target.value) { sheetMonth = e.target.value; render(); } };
  document.getElementById('csv').onclick = () => {
    const q = v => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [['Nhân viên', 'Chức vụ', 'Ngày công', 'Đi muộn', 'Ngày nghỉ phép', 'Tổng giờ'].map(q).join(',')]
      .concat(rows.map(r => [r.name, r.position, r.days, r.late, r.leaveDays, r.hours].map(q).join(',')));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = `bang-cong-${sheetMonth}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
}

// ---------- Nhân sự ----------
async function hrView(el) {
  const list = await api('GET', '/api/employees');
  el.innerHTML = `<div class="page-head"><div><div class="eyebrow"><i></i>${list.filter(e => e.active).length} nhân viên đang làm việc</div><h1>Danh sách <span class="accent">nhân sự</span></h1></div>
    <button class="btn" id="addEmp">${icon('plus')} Thêm nhân viên</button></div>
    <div class="card"><table><thead><tr><th>Nhân viên</th><th>Chức vụ</th><th>Điện thoại</th><th>Ngày vào</th><th>Phép năm đã dùng</th><th>Trạng thái</th><th></th></tr></thead><tbody>
    ${list.map(e => `<tr><td><div class="who">${avatar(e)}<b>${esc(e.name)}</b></div></td><td>${esc(e.position)}</td><td>${esc(e.phone) || '—'}</td><td>${fmtDate(e.startDate)}</td>
      <td>${e.leaveUsed}/${e.annualLeave} ngày</td><td>${pill(e.active ? ['p-green', 'Đang làm'] : ['p-gray', 'Đã nghỉ việc'])}</td><td style="text-align:right"><button class="btn ghost sm" data-edit="${e.id}">Sửa</button></td></tr>`).join('')}</tbody></table></div>`;
  document.getElementById('addEmp').onclick = () => empModal();
  el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => empModal(list.find(e => e.id == b.dataset.edit)));
}
function empModal(e) {
  const x = e || { name: '', position: '', phone: '', startDate: ymd(new Date()), annualLeave: 12, active: true };
  modal(`<h2>${e ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h2><form id="ef">
    <label>Họ tên</label><input name="name" required value="${esc(x.name)}">
    <label>Chức vụ</label><input name="position" value="${esc(x.position)}">
    <div class="row"><div><label>Điện thoại</label><input name="phone" value="${esc(x.phone)}"></div><div><label>Ngày vào làm</label><input type="date" name="startDate" value="${x.startDate}"></div></div>
    <label>Phép năm (ngày)</label><input type="number" name="annualLeave" value="${x.annualLeave}" min="0">
    ${e ? `<label>Trạng thái</label><select name="active"><option value="1" ${x.active ? 'selected' : ''}>Đang làm việc</option><option value="0" ${!x.active ? 'selected' : ''}>Đã nghỉ việc</option></select>` : ''}
    <div class="actions"><button type="button" class="btn ghost" data-close>Đóng</button><button class="btn">Lưu</button></div></form>`, bg => {
    bg.querySelector('[data-close]').onclick = () => bg.remove();
    bg.querySelector('#ef').onsubmit = ev => {
      ev.preventDefault(); const f = Object.fromEntries(new FormData(ev.target));
      if (f.active !== undefined) f.active = f.active === '1';
      run(async () => { await api(e ? 'PUT' : 'POST', e ? `/api/employees/${e.id}` : '/api/employees', f); bg.remove(); render(); }, 'Đã lưu');
    };
  });
}

// ---------- khởi động ----------
async function boot() { try { ME = await api('GET', '/api/me'); } catch { ME = null; } render(); }
window.addEventListener('hashchange', render);
boot();
