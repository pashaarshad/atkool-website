// ============ AUTH ============
const token = localStorage.getItem('teacherToken');
const teacherDataStr = localStorage.getItem('teacherData');
if (!token || !teacherDataStr) { window.location.href = '/teacher-login.html'; }
const teacherData = JSON.parse(teacherDataStr);
document.getElementById('welcomeText').innerText = `Welcome, ${teacherData.name || 'Teacher'}!`;
const options = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-US', options);

function logout() {
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherData');
    window.location.href = '/teacher-login.html';
}

async function fetchAPI(url, opts = {}) {
    const res = await fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
    if (res.status === 401) { logout(); return null; }
    return res.json();
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast toast-${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ============ SIDEBAR ============
const menuItems = [
    { id:'dashboard', label:'Overview', icon:'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id:'students', label:'My Students', icon:'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id:'attendance', label:'Take Attendance', icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id:'history', label:'Attendance History', icon:'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id:'add-student', label:'Add Student', icon:'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
    { id:'requests', label:'Student Requests', icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id:'events', label:'School Events', icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id:'exams', label:'Upcoming Exams', icon:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

const sidebar = document.getElementById('sidebarMenu');
menuItems.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = `menu-item${i === 0 ? ' active' : ''}`;
    div.onclick = () => loadView(m.id, div);
    div.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${m.icon}"></path></svg>${m.label}`;
    sidebar.appendChild(div);
});

function loadView(view, el) {
    document.querySelectorAll('.menu-item').forEach(e => e.classList.remove('active'));
    if (el) el.classList.add('active');
    const c = document.getElementById('mainContent');
    c.innerHTML = '<div class="loader">Loading...</div>';
    const views = { dashboard: loadDashboard, students: loadStudents, attendance: loadAttendance, history: loadHistory, 'add-student': loadAddStudent, requests: loadRequests, events: loadEvents, exams: loadExams };
    (views[view] || loadDashboard)();
}

// ============ DASHBOARD OVERVIEW ============
async function loadDashboard() {
    const c = document.getElementById('mainContent');
    const [students, attendance, requests] = await Promise.all([
        fetchAPI('/api/teacher/students'),
        fetchAPI(`/api/teacher/attendance?date=${todayStr()}`),
        fetchAPI('/api/teacher/my-requests')
    ]);

    const totalStudents = students?.length || 0;
    const totalPresent = attendance?.filter(a => a.status === 'present').length || 0;
    const totalAbsent = attendance?.filter(a => a.status === 'absent').length || 0;
    const attendPct = attendance?.length > 0 ? Math.round((totalPresent / attendance.length) * 100) : 0;
    const pendingReqs = requests?.pendingCount || 0;

    c.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card bg-blue"><div class="icon">👨‍🎓</div><div class="value">${totalStudents}</div><div class="label">Total Students</div></div>
            <div class="stat-card bg-green"><div class="icon">✅</div><div class="value">${totalPresent}</div><div class="label">Present Today</div></div>
            <div class="stat-card bg-red"><div class="icon">❌</div><div class="value">${totalAbsent}</div><div class="label">Absent Today</div></div>
            <div class="stat-card bg-purple"><div class="icon">📊</div><div class="value">${attendPct}%</div><div class="label">Attendance Rate</div></div>
        </div>
        <div class="quick-actions">
            <div class="action-tile" onclick="loadView('attendance')"><div class="tile-icon" style="background:#28A745"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:#fff"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg></div><div class="tile-label">Take Attendance</div></div>
            <div class="action-tile" onclick="loadView('students')"><div class="tile-icon" style="background:#007BFF"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:#fff"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></div><div class="tile-label">My Students</div></div>
            <div class="action-tile" onclick="loadView('add-student')"><div class="tile-icon" style="background:#FF9800"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:#fff"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg></div><div class="tile-label">Add Student</div></div>
        </div>
        ${pendingReqs > 0 ? `<div class="card"><div class="card-header">Pending Requests <span class="badge" style="background:#FF9800">${pendingReqs} pending</span></div><p style="color:#666">You have ${pendingReqs} student(s) waiting for school admin approval.</p><button class="btn btn-outline" style="margin-top:10px" onclick="loadView('requests')">View Requests</button></div>` : ''}
        <div class="card">
            <div class="card-header">Today's Attendance Summary</div>
            ${attendance && attendance.length > 0 ? `<table><thead><tr><th>Student</th><th>Class</th><th>Status</th></tr></thead><tbody>${attendance.map(a => `<tr><td><strong>${a.studentId?.name || 'N/A'}</strong></td><td>${a.className || ''} ${a.section || ''}</td><td><span class="badge ${a.status === 'present' ? 'badge-green' : 'badge-red'}">${a.status}</span></td></tr>`).join('')}</tbody></table>` : '<div class="empty-state"><p>No attendance recorded yet today. <a href="#" onclick="loadView(\'attendance\')">Take attendance now →</a></p></div>'}
        </div>`;
}

// ============ STUDENTS LIST ============
async function loadStudents() {
    const c = document.getElementById('mainContent');
    const students = await fetchAPI('/api/teacher/students');
    if (!students) return;
    c.innerHTML = `
        <div class="card">
            <div class="card-header">My Students <span class="badge">${students.length} total</span></div>
            ${students.length === 0 ? '<div class="empty-state"><p>No students assigned yet.</p><button class="btn btn-primary" onclick="loadView(\'add-student\')">+ Add Student</button></div>' :
            `<table><thead><tr><th>Roll</th><th>Name</th><th>Class</th><th>Parent</th><th>Contact</th><th>Status</th><th>Parent Login</th></tr></thead><tbody>
            ${students.map(s => `<tr><td>${s.rollNo || '-'}</td><td><strong>${s.name}</strong></td><td>${s.className} ${s.section || ''}</td><td>${s.parentName || 'N/A'}</td><td>${s.parentMobile || 'N/A'}</td><td><span class="badge ${s.approvalStatus === 'Approved' ? 'badge-green' : 'badge-orange'}">${s.approvalStatus || 'Pending'}</span></td><td><button class="btn btn-primary" style="padding:6px 14px;font-size:12px" onclick="generateParentLogin('${s._id}','${s.name}')">🔑 Generate</button></td></tr>`).join('')}
            </tbody></table>`}
        </div>`;
}

async function generateParentLogin(studentId, studentName) {
    const result = await fetchAPI('/api/teacher/generate-parent-login', {
        method: 'POST',
        body: JSON.stringify({ studentId })
    });
    if (!result) return;
    const isExisting = result.existing ? ' (already existed)' : ' (newly created)';
    const c = document.getElementById('mainContent');
    c.innerHTML += `
        <div class="card" style="border:2px solid #6B4EFF;margin-top:20px" id="parentLoginCard">
            <div class="card-header">🔑 Parent Login Credentials for ${studentName}${isExisting}</div>
            <div style="background:#f0f0ff;padding:20px;border-radius:12px;margin-bottom:15px">
                <div style="margin-bottom:12px"><strong style="color:#666;font-size:13px">Username:</strong><div style="font-size:20px;font-weight:700;color:#6B4EFF;letter-spacing:1px">${result.parentUsername}</div></div>
                <div><strong style="color:#666;font-size:13px">Password:</strong><div style="font-size:20px;font-weight:700;color:#DC3545;letter-spacing:1px">${result.parentPassword}</div></div>
            </div>
            <p style="color:#666;font-size:13px">📋 Share these credentials with the parent. They can log in at the <strong>Parent Portal</strong>.</p>
            <button class="btn btn-outline" style="margin-top:10px" onclick="document.getElementById('parentLoginCard').remove()">✕ Close</button>
        </div>`;
    showToast(`Parent login ${result.existing ? 'retrieved' : 'generated'} for ${studentName}!`);
}

// ============ TAKE ATTENDANCE ============
let attendanceMap = {};

async function loadAttendance() {
    const c = document.getElementById('mainContent');
    const students = await fetchAPI('/api/teacher/students');
    if (!students) return;

    const existing = await fetchAPI(`/api/teacher/attendance?date=${todayStr()}`);
    const alreadyDone = existing && existing.length > 0;

    attendanceMap = {};
    students.forEach(s => {
        const existingRecord = existing?.find(a => (a.studentId?._id || a.studentId) === s._id);
        attendanceMap[s._id] = existingRecord ? existingRecord.status : 'present';
    });

    const presentCount = () => Object.values(attendanceMap).filter(v => v === 'present').length;
    const absentCount = () => Object.values(attendanceMap).filter(v => v === 'absent').length;

    c.innerHTML = `
        <div class="card">
            <div class="card-header">Take Attendance — ${new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}</div>
            ${alreadyDone ? '<div style="background:#fff3cd;border:1px solid #ffc107;padding:12px 16px;border-radius:10px;margin-bottom:16px;color:#856404;font-weight:500">⚠️ Attendance already submitted for today. You can update it below.</div>' : ''}
            <div class="summary-bar">
                <div class="summary-item" style="background:#28A745;border-radius:10px"><div class="count" id="presentCount">${presentCount()}</div><div class="text">Present</div></div>
                <div class="summary-item" style="background:#DC3545;border-radius:10px"><div class="count" id="absentCount">${absentCount()}</div><div class="text">Absent</div></div>
                <div class="summary-item" style="background:#007BFF;border-radius:10px"><div class="count">${students.length}</div><div class="text">Total</div></div>
            </div>
            <div id="studentAttList">
                ${students.length === 0 ? '<div class="empty-state"><p>No students to mark attendance for.</p></div>' :
                students.map((s, i) => `
                    <div class="student-attendance-row">
                        <div style="width:32px;height:32px;background:rgba(107,78,255,.1);border-radius:8px;display:flex;align-items:center;justify-content:center;margin-right:12px;font-weight:700;color:#6B4EFF;font-size:13px">${i + 1}</div>
                        <div class="student-info"><div class="student-name">${s.name}</div><div class="student-meta">Roll: ${s.rollNo || '-'} | ${s.className}-${s.section || 'A'}</div></div>
                        <div style="display:flex;gap:8px">
                            <button class="att-btn absent ${attendanceMap[s._id] === 'absent' ? 'active' : ''}" id="abs-${s._id}" onclick="markAtt('${s._id}','absent')">A</button>
                            <button class="att-btn present ${attendanceMap[s._id] === 'present' ? 'active' : ''}" id="pre-${s._id}" onclick="markAtt('${s._id}','present')">P</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:20px;display:flex;gap:12px;justify-content:flex-end">
                <button class="btn btn-success" id="submitAttBtn" onclick="submitAttendance()" ${students.length === 0 ? 'disabled' : ''}>✅ Submit Attendance</button>
            </div>
        </div>`;
}

function markAtt(studentId, status) {
    attendanceMap[studentId] = status;
    document.getElementById(`abs-${studentId}`).className = `att-btn absent ${status === 'absent' ? 'active' : ''}`;
    document.getElementById(`pre-${studentId}`).className = `att-btn present ${status === 'present' ? 'active' : ''}`;
    document.getElementById('presentCount').textContent = Object.values(attendanceMap).filter(v => v === 'present').length;
    document.getElementById('absentCount').textContent = Object.values(attendanceMap).filter(v => v === 'absent').length;
}

async function submitAttendance() {
    const btn = document.getElementById('submitAttBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const students = await fetchAPI('/api/teacher/students');
    const attendanceData = students.map(s => ({
        studentId: s._id,
        status: attendanceMap[s._id] || 'present',
        className: s.className,
        section: s.section
    }));

    const result = await fetchAPI('/api/teacher/attendance', {
        method: 'POST',
        body: JSON.stringify({ attendanceData, date: todayStr() })
    });

    if (result && result.message) {
        showToast('Attendance submitted successfully!');
        loadView('dashboard');
    } else {
        showToast('Failed to submit', 'error');
        btn.disabled = false;
        btn.textContent = '✅ Submit Attendance';
    }
}

// ============ ATTENDANCE HISTORY ============
async function loadHistory() {
    const c = document.getElementById('mainContent');
    c.innerHTML = `
        <div class="card">
            <div class="card-header">Attendance History</div>
            <div class="attendance-controls">
                <input type="date" class="date-input" id="historyDate" value="${todayStr()}" onchange="fetchHistory()">
                <button class="btn btn-primary" onclick="fetchHistory()">🔍 Search</button>
            </div>
            <div id="historyResults"><div class="loader">Select a date to view history</div></div>
        </div>`;
    fetchHistory();
}

async function fetchHistory() {
    const date = document.getElementById('historyDate').value;
    const container = document.getElementById('historyResults');
    container.innerHTML = '<div class="loader">Loading...</div>';
    const data = await fetchAPI(`/api/teacher/attendance?date=${date}`);
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No attendance records for this date.</p></div>';
        return;
    }
    const present = data.filter(a => a.status === 'present').length;
    const absent = data.filter(a => a.status === 'absent').length;
    container.innerHTML = `
        <div class="summary-bar">
            <div class="summary-item" style="background:#28A745;border-radius:10px"><div class="count">${present}</div><div class="text">Present</div></div>
            <div class="summary-item" style="background:#DC3545;border-radius:10px"><div class="count">${absent}</div><div class="text">Absent</div></div>
            <div class="summary-item" style="background:#007BFF;border-radius:10px"><div class="count">${data.length}</div><div class="text">Total</div></div>
        </div>
        <table><thead><tr><th>#</th><th>Student</th><th>Class</th><th>Status</th></tr></thead><tbody>
        ${data.map((a, i) => `<tr><td>${i + 1}</td><td><strong>${a.studentId?.name || 'N/A'}</strong></td><td>${a.className || ''} ${a.section || ''}</td><td><span class="badge ${a.status === 'present' ? 'badge-green' : 'badge-red'}">${a.status}</span></td></tr>`).join('')}
        </tbody></table>`;
}

// ============ ADD STUDENT ============
function loadAddStudent() {
    const c = document.getElementById('mainContent');
    c.innerHTML = `
        <div class="card">
            <div class="card-header">Add New Student</div>
            <form id="addStudentForm" onsubmit="submitStudent(event)">
                <div class="form-grid">
                    <div class="form-group"><label>Full Name *</label><input name="name" required placeholder="Student name"></div>
                    <div class="form-group"><label>Class *</label><input name="className" required placeholder="e.g. 10"></div>
                    <div class="form-group"><label>Section</label><input name="section" placeholder="e.g. A" value="A"></div>
                    <div class="form-group"><label>Roll No</label><input name="rollNo" placeholder="e.g. 01"></div>
                    <div class="form-group"><label>Email</label><input name="email" type="email" placeholder="student@email.com"></div>
                    <div class="form-group"><label>Mobile</label><input name="mobileNo" placeholder="Student mobile"></div>
                    <div class="form-group"><label>Parent Name</label><input name="parentName" placeholder="Parent name"></div>
                    <div class="form-group"><label>Parent Mobile</label><input name="parentMobile" placeholder="Parent mobile"></div>
                </div>
                <div class="form-group"><label>Address</label><input name="address" placeholder="Full address"></div>
                <div style="display:flex;gap:12px;margin-top:10px">
                    <button type="submit" class="btn btn-success" id="addStudentBtn">+ Add Student</button>
                    <button type="button" class="btn btn-outline" onclick="loadView('students')">Cancel</button>
                </div>
            </form>
        </div>`;
}

async function submitStudent(e) {
    e.preventDefault();
    const form = document.getElementById('addStudentForm');
    const btn = document.getElementById('addStudentBtn');
    btn.disabled = true; btn.textContent = 'Adding...';
    const fd = new FormData(form);
    const body = {};
    fd.forEach((v, k) => { if (v) body[k] = v; });
    const result = await fetchAPI('/api/teacher/students', { method: 'POST', body: JSON.stringify(body) });
    if (result && result._id) {
        showToast('Student added! Pending admin approval.');
        form.reset();
    } else {
        showToast(result?.message || 'Failed to add student', 'error');
    }
    btn.disabled = false; btn.textContent = '+ Add Student';
}

// ============ STUDENT REQUESTS ============
async function loadRequests() {
    const c = document.getElementById('mainContent');
    const data = await fetchAPI('/api/teacher/my-requests');
    if (!data) return;
    c.innerHTML = `
        <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
            <div class="stat-card bg-blue"><div class="value">${data.total || 0}</div><div class="label">Total Requests</div></div>
            <div class="stat-card bg-green"><div class="value">${data.approvedCount || 0}</div><div class="label">Approved</div></div>
            <div class="stat-card" style="background:linear-gradient(135deg,#FF9800,#F57C00)"><div class="value">${data.pendingCount || 0}</div><div class="label">Pending</div></div>
        </div>
        ${renderRequestTable('Pending', data.pending, 'badge-orange')}
        ${renderRequestTable('Approved', data.approved, 'badge-green')}
        ${data.rejected?.length ? renderRequestTable('Rejected', data.rejected, 'badge-red') : ''}`;
}

function renderRequestTable(title, items, badgeClass) {
    if (!items || items.length === 0) return `<div class="card"><div class="card-header">${title} <span class="badge ${badgeClass}">${0}</span></div><div class="empty-state"><p>No ${title.toLowerCase()} requests.</p></div></div>`;
    return `<div class="card"><div class="card-header">${title} <span class="badge ${badgeClass}">${items.length}</span></div>
        <table><thead><tr><th>Name</th><th>Class</th><th>Roll</th><th>Parent</th><th>Date</th></tr></thead><tbody>
        ${items.map(s => `<tr><td><strong>${s.name}</strong></td><td>${s.className} ${s.section || ''}</td><td>${s.rollNo || '-'}</td><td>${s.parentName || 'N/A'}</td><td>${new Date(s.createdAt).toLocaleDateString()}</td></tr>`).join('')}
        </tbody></table></div>`;
}

// ============ EVENTS ============
async function loadEvents() {
    const c = document.getElementById('mainContent');
    const events = await fetchAPI('/api/teacher/events');
    if (!events) return;
    c.innerHTML = `<div class="card"><div class="card-header">School Events <span class="badge">${events.length}</span></div>
        ${events.length === 0 ? '<div class="empty-state"><p>No upcoming events.</p></div>' :
        events.map(e => `<div style="padding:16px;border:1px solid #eee;border-radius:12px;margin-bottom:12px">
            <div style="font-weight:700;font-size:16px;color:#1a1a1a">${e.eventName || e.name || 'Event'}</div>
            <div style="color:#666;font-size:13px;margin-top:4px">${e.description || ''}</div>
            <div style="display:flex;gap:12px;margin-top:8px;font-size:12px;color:#888">
                <span>📅 ${e.eventDate ? new Date(e.eventDate).toLocaleDateString() : 'TBD'}</span>
                <span>👥 ${e.eventFor || 'All'}</span>
            </div>
        </div>`).join('')}</div>`;
}

// ============ EXAMS ============
async function loadExams() {
    const c = document.getElementById('mainContent');
    const exams = await fetchAPI('/api/teacher/exams');
    if (!exams) return;
    c.innerHTML = `<div class="card"><div class="card-header">Upcoming Exams <span class="badge">${exams.length}</span></div>
        ${exams.length === 0 ? '<div class="empty-state"><p>No upcoming exams.</p></div>' :
        `<table><thead><tr><th>Exam</th><th>Subject</th><th>Class</th><th>Date</th><th>Time</th><th>Status</th></tr></thead><tbody>
        ${exams.map(e => `<tr><td><strong>${e.examName || 'Exam'}</strong></td><td>${e.subject || '-'}</td><td>${e.className || '-'}</td><td>${e.examDate ? new Date(e.examDate).toLocaleDateString() : '-'}</td><td>${e.startTime || '-'} - ${e.endTime || '-'}</td><td><span class="badge badge-blue">${e.status || 'Scheduled'}</span></td></tr>`).join('')}
        </tbody></table>`}</div>`;
}

// ============ UTILS ============
function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Load default view
loadView('dashboard');
