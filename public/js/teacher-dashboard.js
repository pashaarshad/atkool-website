// ============ AUTH ============
const token = localStorage.getItem('teacherToken');
const teacherDataStr = localStorage.getItem('teacherData');
if (!token || !teacherDataStr) { window.location.href = '/teacher-login.html'; }
const teacherData = JSON.parse(teacherDataStr);
document.getElementById('welcomeText').innerText = `Welcome, ${teacherData.name || 'Teacher'}!`;
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
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
    { id: 'dashboard', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'students', label: 'My Classes', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'attendance', label: 'Take Attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id: 'history', label: 'Attendance History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'chat', label: 'Chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { id: 'add-student', label: 'Add Student', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
    { id: 'requests', label: 'Student Requests', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'events', label: 'School Events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'exams', label: 'Upcoming Exams', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'leaves', label: 'Leave Management', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z' },
    { id: 'homework', label: 'Homework', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'marks-entry', label: 'Marks Entry', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' }
];

const sidebar = document.getElementById('sidebarMenu');
sidebar.innerHTML = '';
menuItems.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = `menu-item${i === 0 ? ' active' : ''}`;
    div.onclick = () => loadView(m.id, div);
    div.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${m.icon}"></path></svg>${m.label}${m.id === 'chat' ? '<span class="chat-badge" id="chatBadge" style="display:none;background:#ef4444;color:#fff;font-size:10px;font-weight:800;padding:2px 7px;border-radius:10px;margin-left:auto"></span>' : ''}`;
    sidebar.appendChild(div);
});

// Load unread chat count for badge
async function updateChatBadge() {
    try {
        const data = await fetchAPI('/api/chat/teacher/unread-count');
        const badge = document.getElementById('chatBadge');
        if (data && data.count > 0) {
            badge.textContent = data.count;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    } catch (e) { }
}
updateChatBadge();
setInterval(updateChatBadge, 30000); // Refresh every 30 seconds

function loadView(view, el) {
    document.querySelectorAll('.menu-item').forEach(e => e.classList.remove('active'));
    if (el) el.classList.add('active');
    const c = document.getElementById('mainContent');
    c.innerHTML = '<div class="loader">Loading...</div>';
    const views = {
        dashboard: loadDashboard,
        students: loadStudents,
        attendance: loadAttendance,
        history: loadHistory,
        chat: loadChat,
        'add-student': loadAddStudent,
        requests: loadRequests,
        events: loadEvents,
        exams: loadExams,
        leaves: loadLeaves,
        homework: loadHomework,
        'marks-entry': loadMarksEntry
    };
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
            <div class="action-tile" onclick="loadView('students')"><div class="tile-icon" style="background:linear-gradient(135deg,#4338CA,#7C3AED)"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:#fff"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div><div class="tile-label">My Classes</div></div>
            <div class="action-tile" onclick="loadView('attendance')"><div class="tile-icon" style="background:#28A745"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:#fff"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg></div><div class="tile-label">Take Attendance</div></div>
            <div class="action-tile" onclick="loadView('chat')"><div class="tile-icon" style="background:linear-gradient(135deg,#3b82f6,#2563eb)"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:#fff"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg></div><div class="tile-label">Chat with Parents</div></div>
        </div>
        ${pendingReqs > 0 ? `<div class="card"><div class="card-header">Pending Requests <span class="badge" style="background:#FF9800">${pendingReqs} pending</span></div><p style="color:#666">You have ${pendingReqs} student(s) waiting for school admin approval.</p><button class="btn btn-outline" style="margin-top:10px" onclick="loadView('requests')">View Requests</button></div>` : ''}
        <div class="card">
            <div class="card-header">Today's Attendance Summary</div>
            ${attendance && attendance.length > 0 ? `<table><thead><tr><th>Student</th><th>Class</th><th>Status</th></tr></thead><tbody>${attendance.map(a => `<tr><td><strong>${a.studentId?.name || 'N/A'}</strong></td><td>${a.className || ''} ${a.section || ''}</td><td><span class="badge ${a.status === 'present' ? 'badge-green' : 'badge-red'}">${a.status}</span></td></tr>`).join('')}</tbody></table>` : '<div class="empty-state"><p>No attendance recorded yet today. <a href="#" onclick="loadView(\'attendance\')">Take attendance now →</a></p></div>'}
        </div>`;
}

// ============ MY CLASSES / STUDENTS VIEW ============
async function loadStudents() {
    const c = document.getElementById('mainContent');
    const classes = await fetchAPI('/api/teacher/my-classes');
    if (!classes) return;

    if (classes.length === 0) {
        c.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:24px;height:24px;stroke:#4338CA"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    My Classes
                </div>
                <div class="empty-state">
                    <p>No classes assigned to you yet. Please contact your school administrator.</p>
                </div>
            </div>`;
        return;
    }

    const classCards = classes.map(cls => {
        const gradients = [
            'linear-gradient(135deg,#4338CA,#7C3AED)',
            'linear-gradient(135deg,#3b82f6,#2563eb)',
            'linear-gradient(135deg,#10b981,#059669)',
            'linear-gradient(135deg,#f59e0b,#d97706)',
            'linear-gradient(135deg,#ef4444,#dc2626)',
            'linear-gradient(135deg,#8b5cf6,#7c3aed)',
            'linear-gradient(135deg,#06b6d4,#0891b2)'
        ];
        const colorIndex = Math.abs((cls.className || '').charCodeAt(0) + (cls.section || 'A').charCodeAt(0)) % gradients.length;

        return `
            <div class="class-card" onclick="loadClassStudents('${cls.className}','${cls.section}')" style="
                background:#fff; border:2px solid #e2e8f0; border-radius:20px; padding:28px; cursor:pointer; 
                transition:all .3s; position:relative; overflow:hidden;
            " onmouseover="this.style.transform='translateY(-6px)';this.style.boxShadow='0 12px 30px rgba(67,56,202,.15)';this.style.borderColor='#c7d2fe'" onmouseout="this.style.transform='';this.style.boxShadow='';this.style.borderColor='#e2e8f0'">
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
                    <div style="width:56px;height:56px;border-radius:16px;background:${gradients[colorIndex]};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <svg fill="none" stroke="white" viewBox="0 0 24 24" style="width:28px;height:28px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </div>
                    <div>
                        <div style="font-size:20px;font-weight:800;color:#0F172A;">Class ${cls.className}</div>
                        <div style="font-size:14px;font-weight:600;color:#64748b;">Section ${cls.section}</div>
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <svg fill="none" stroke="#64748b" viewBox="0 0 24 24" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        <span style="font-size:14px;font-weight:700;color:#334155;">${cls.studentCount} Students</span>
                    </div>
                    ${cls.isClassTeacher ? '<span style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.3px">CLASS TEACHER</span>' : '<span style="background:#f1f5f9;color:#64748b;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700">SUBJECT TEACHER</span>'}
                </div>
            </div>`;
    }).join('');

    c.innerHTML = `
        <div class="card" style="border:none;background:transparent;box-shadow:none;padding:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#4338CA,#7C3AED);display:flex;align-items:center;justify-content:center">
                        <svg fill="none" stroke="white" viewBox="0 0 24 24" style="width:24px;height:24px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </div>
                    <div>
                        <div style="font-size:22px;font-weight:800;color:#0F172A">My Classes</div>
                        <div style="font-size:13px;color:#64748b;font-weight:600">${classes.length} class${classes.length > 1 ? 'es' : ''} assigned</div>
                    </div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;">
                ${classCards}
            </div>
        </div>`;
}

// ============ CLASS STUDENTS VIEW ============
let currentClassStudents = [];

async function loadClassStudents(className, section) {
    const c = document.getElementById('mainContent');
    c.innerHTML = '<div class="loader">Loading students...</div>';
    const students = await fetchAPI(`/api/teacher/students?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}`);
    if (!students) return;

    currentClassStudents = students;

    c.innerHTML = `
        <div style="margin-bottom:20px;">
            <button class="btn btn-outline" onclick="loadStudents()" style="margin-bottom:16px; border-radius:8px; padding: 8px 16px; font-weight: 600; border-color: #6366f1; color: #6366f1; background: transparent; cursor: pointer;">← Back to My Classes</button>
        </div>
        <div class="card" style="padding:0; overflow:hidden;">
            <div class="card-header" style="display:flex;align-items:center;gap:12px;border-bottom:2px solid #f1f5f9;padding:20px 24px;">
                <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#4338CA,#7C3AED);display:flex;align-items:center;justify-content:center">
                    <svg fill="none" stroke="white" viewBox="0 0 24 24" style="width:22px;height:22px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
                <div>
                    <div style="font-size:18px;font-weight:800;color:#0F172A">Class ${className} — Section ${section}</div>
                    <div style="font-size:12px;color:#64748b;font-weight:600">${students.length} student${students.length !== 1 ? 's' : ''}</div>
                </div>
                <span class="badge" style="margin-left:auto; background:#6366f1; color:#fff; border-radius:20px; font-weight:700; padding:4px 12px;">${students.length} total</span>
            </div>
            ${students.length === 0 ? '<div class="empty-state" style="padding:40px;"><p>No approved students in this class yet.</p></div>' :
            `<div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="border-bottom:1.5px solid #f1f5f9; background:#fafbfc; text-align:left;">
                            <th style="padding:16px 24px; font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">#</th>
                            <th style="padding:16px 24px; font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Roll No</th>
                            <th style="padding:16px 24px; font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Name</th>
                            <th style="padding:16px 24px; font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Parent</th>
                            <th style="padding:16px 24px; font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Contact</th>
                            <th style="padding:16px 24px; font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Status</th>
                            <th style="padding:16px 24px; font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    ${students.map((s, i) => {
                return `
                        <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:16px 24px; font-size:14px; color:#475569; font-weight:600;">${i + 1}</td>
                            <td style="padding:16px 24px; font-size:14px; color:#475569;">${s.rollNo || s.studentId || '-'}</td>
                            <td style="padding:16px 24px; font-size:14px; color:#0f172a; font-weight:700;">${s.name}</td>
                            <td style="padding:16px 24px; font-size:14px; color:#475569;">${s.parentName || 'N/A'}</td>
                            <td style="padding:16px 24px; font-size:14px; color:#475569;">${s.parentMobile || s.mobileNo || 'N/A'}</td>
                            <td style="padding:16px 24px; font-size:14px;">
                                <span style="background:#10b981; color:#fff; font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px;">${s.approvalStatus || 'Approved'}</span>
                            </td>
                            <td style="padding:16px 24px; font-size:14px;">
                                <div style="display:flex; gap:8px;">
                                    <button onclick="openChatWithStudent('${s._id}','${s.name.replace(/'/g, "\\'")}','${(s.parentName || 'Parent').replace(/'/g, "\\'")}')" style="
                                        background:#6366f1; color:#fff; border:none; border-radius:20px; padding:6px 14px; 
                                        font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; transition:transform 0.2s;
                                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform=''">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px;stroke-width:2.5;"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                        Chat
                                    </button>
                                    <button onclick="viewStudentDetails('${s._id}')" style="
                                        background:transparent; color:#6366f1; border:1px solid #6366f1; border-radius:20px; padding:6px 14px; 
                                        font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; transition:transform 0.2s;
                                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform=''">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px;stroke-width:2.5;"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                        View Info
                                    </button>
                                </div>
                            </td>
                        </tr>
                        `;
            }).join('')}
                    </tbody>
                </table>
            </div>`}
        </div>`;
}

function openChatWithStudent(studentId, studentName, parentName) {
    loadChatConversation(studentId, studentName, parentName);
}

function viewStudentDetails(studentId) {
    const s = currentClassStudents.find(student => student._id === studentId);
    if (!s) return;

    // Create a beautiful modal overlay
    const modal = document.createElement('div');
    modal.id = 'studentDetailsModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(15, 23, 42, 0.6)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';

    const photoSrc = s.photo || 'https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?q=80&w=256&auto=format&fit=crop';

    modal.innerHTML = `
        <div style="background: #fff; width: 90%; max-width: 600px; border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); overflow: hidden; display: flex; flex-direction: column; animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
            <!-- Modal Header -->
            <div style="background: linear-gradient(135deg, #4338CA, #6366f1); padding: 24px; color: #fff; display: flex; align-items: center; gap: 16px; position: relative;">
                <img src="${photoSrc}" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,0.4);">
                <div>
                    <h3 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">${escapeHTML(s.name)}</h3>
                    <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 600;">Student ID (SATA'S ID): ${escapeHTML(s.studentId || s.rollNo || 'N/A')}</p>
                </div>
                <button onclick="closeStudentDetailsModal()" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 32px; height: 32px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">&times;</button>
            </div>
            
            <!-- Modal Content (Scrollable) -->
            <div style="padding: 24px; max-height: 70vh; overflow-y: auto; display: flex; flex-direction: column; gap: 20px;">
                <!-- Basic details grid -->
                <div>
                    <h4 style="margin: 0 0 12px 0; color: #4338CA; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Academic Information</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9;">
                        <div>
                            <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block;">CLASS & SECTION</span>
                            <span style="font-size: 14px; color: #0f172a; font-weight: 700;">Class ${escapeHTML(s.className)} - ${escapeHTML(s.section || 'A')}</span>
                        </div>
                        <div>
                            <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block;">STATUS</span>
                            <span style="display: inline-block; background: #10b981; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 20px; margin-top: 2px;">${escapeHTML(s.status || 'Active')}</span>
                        </div>
                    </div>
                </div>

                <!-- Contact details -->
                <div>
                    <h4 style="margin: 0 0 12px 0; color: #4338CA; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Contact Information</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px 20px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9;">
                        <div>
                            <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block;">GMAIL ID (STUDENT EMAIL)</span>
                            <span style="font-size: 14px; color: #0f172a; font-weight: 700; word-break: break-all;">${escapeHTML(s.email || 'N/A')}</span>
                        </div>
                        <div>
                            <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block;">STUDENT MOBILE NO</span>
                            <span style="font-size: 14px; color: #0f172a; font-weight: 700;">${escapeHTML(s.mobileNo || 'N/A')}</span>
                        </div>
                        <div>
                            <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block;">PARENT NAME</span>
                            <span style="font-size: 14px; color: #0f172a; font-weight: 700;">${escapeHTML(s.parentName || 'N/A')}</span>
                        </div>
                        <div>
                            <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block;">PARENT MOBILE NO</span>
                            <span style="font-size: 14px; color: #0f172a; font-weight: 700;">${escapeHTML(s.parentMobile || 'N/A')}</span>
                        </div>
                        <div style="grid-column: span 2;">
                            <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block;">GUARDIAN CONTACT NUMBER (SECONDARY)</span>
                            <span style="font-size: 14px; color: #0f172a; font-weight: 700;">${escapeHTML(s.guardianMobile || 'N/A')}</span>
                        </div>
                    </div>
                </div>

                <!-- Logistics / transport details -->
                <div>
                    <h4 style="margin: 0 0 12px 0; color: #4338CA; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Logistics & Address</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px 20px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9;">
                        <div>
                            <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block;">ASSIGNED VAN / BUS</span>
                            <span style="font-size: 14px; color: #0f172a; font-weight: 700;">${s.vanId ? 'Assigned' : 'No Van Assigned'}</span>
                        </div>
                        <div>
                            <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block;">PICKUP POINT</span>
                            <span style="font-size: 14px; color: #0f172a; font-weight: 700;">${escapeHTML(s.pickupPoint || 'N/A')}</span>
                        </div>
                        <div style="grid-column: span 2;">
                            <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block;">ADDRESS</span>
                            <span style="font-size: 14px; color: #0f172a; font-weight: 700;">${escapeHTML(s.address || 'N/A')}</span>
                        </div>
                    </div>
                </div>

                <!-- Password and login details -->
                <div>
                    <h4 style="margin: 0 0 12px 0; color: #4338CA; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Parent Login Credentials</h4>
                    <div style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 12px;">
                        <div>
                            <span style="font-size: 11px; color: #4338CA; font-weight: 700; display: block;">LOGIN USERNAME (STUDENT GMAIL OR PARENT PHONE)</span>
                            <span style="font-size: 14px; color: #1e1b4b; font-weight: 800;">${escapeHTML(s.email || 'N/A')} / ${escapeHTML(s.parentMobile || 'N/A')}</span>
                        </div>
                        <div>
                            <span style="font-size: 11px; color: #4338CA; font-weight: 700; display: block;">LOGIN PASSWORD</span>
                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
                                <input type="password" id="modalParentPassword" value="${escapeHTML(s.parentPassword || 'test@123')}" readonly style="background: transparent; border: none; font-size: 15px; font-weight: 800; color: #1e1b4b; font-family: monospace; outline: none; width: 150px;">
                                <button type="button" onclick="toggleModalPasswordVisibility()" style="background: none; border: none; color: #4338CA; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px;">
                                    <svg id="modalPasswordEyeIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:20px;height:20px;stroke-width:2;"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal Footer -->
            <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; display: flex; justify-content: flex-end;">
                <button onclick="closeStudentDetailsModal()" style="background: #4338CA; color: #fff; border: none; border-radius: 10px; padding: 10px 20px; font-weight: 700; cursor: pointer; font-size: 14px; transition: background 0.2s;" onmouseover="this.style.background='#3730a3'" onmouseout="this.style.background='#4338CA'">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // CSS Keyframe Animation
    if (!document.getElementById('modalAnimationStyles')) {
        const style = document.createElement('style');
        style.id = 'modalAnimationStyles';
        style.innerHTML = `
            @keyframes modalFadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}

function closeStudentDetailsModal() {
    const modal = document.getElementById('studentDetailsModal');
    if (modal) {
        modal.remove();
    }
}

function toggleModalPasswordVisibility() {
    const input = document.getElementById('modalParentPassword');
    const icon = document.getElementById('modalPasswordEyeIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />`;
    } else {
        input.type = 'password';
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>`;
    }
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
    c.innerHTML = '<div class="loader">Loading classes...</div>';
    const classes = await fetchAPI('/api/teacher/my-classes');
    if (!classes) return;

    if (classes.length === 0) {
        c.innerHTML = `
            <div class="card">
                <div class="card-header">Take Attendance</div>
                <div class="empty-state">
                    <p>No classes assigned to you yet. Please contact your administrator.</p>
                </div>
            </div>`;
        return;
    }

    const classCards = classes.map(cls => {
        const gradients = [
            'linear-gradient(135deg,#10b981,#059669)',
            'linear-gradient(135deg,#f59e0b,#d97706)',
            'linear-gradient(135deg,#ef4444,#dc2626)',
            'linear-gradient(135deg,#4338CA,#7C3AED)',
            'linear-gradient(135deg,#3b82f6,#2563eb)',
            'linear-gradient(135deg,#8b5cf6,#7c3aed)',
            'linear-gradient(135deg,#06b6d4,#0891b2)'
        ];
        const colorIndex = Math.abs((cls.className || '').charCodeAt(0) + (cls.section || 'A').charCodeAt(0)) % gradients.length;

        return `
            <div class="class-card" onclick="loadAttendanceForClass('${cls.className}','${cls.section}')" style="
                background:#fff; border:2px solid #e2e8f0; border-radius:20px; padding:28px; cursor:pointer; 
                transition:all .3s; position:relative; overflow:hidden;
            " onmouseover="this.style.transform='translateY(-6px)';this.style.boxShadow='0 12px 30px rgba(67,56,202,.15)';this.style.borderColor='#c7d2fe'" onmouseout="this.style.transform='';this.style.boxShadow='';this.style.borderColor='#e2e8f0'">
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
                    <div style="width:56px;height:56px;border-radius:16px;background:${gradients[colorIndex]};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <svg fill="none" stroke="white" viewBox="0 0 24 24" style="width:28px;height:28px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </div>
                    <div>
                        <div style="font-size:20px;font-weight:800;color:#0F172A;">Class ${cls.className}</div>
                        <div style="font-size:14px;font-weight:600;color:#64748b;">Section ${cls.section}</div>
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <svg fill="none" stroke="#64748b" viewBox="0 0 24 24" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        <span style="font-size:14px;font-weight:700;color:#334155;">${cls.studentCount} Students</span>
                    </div>
                    ${cls.isClassTeacher ? '<span style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.3px">CLASS TEACHER</span>' : '<span style="background:#f1f5f9;color:#64748b;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700">SUBJECT TEACHER</span>'}
                </div>
            </div>`;
    }).join('');

    c.innerHTML = `
        <div class="card" style="border:none;background:transparent;box-shadow:none;padding:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#4338CA,#7C3AED);display:flex;align-items:center;justify-content:center">
                        <svg fill="none" stroke="white" viewBox="0 0 24 24" style="width:24px;height:24px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    </div>
                    <div>
                        <div style="font-size:22px;font-weight:800;color:#0F172A">Take Attendance</div>
                        <div style="font-size:13px;color:#64748b;font-weight:600">Select a class to mark attendance for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;">
                ${classCards}
            </div>
        </div>`;
}

async function loadAttendanceForClass(className, section) {
    const c = document.getElementById('mainContent');
    c.innerHTML = '<div class="loader">Loading students...</div>';

    const students = await fetchAPI(`/api/teacher/students?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}`);
    if (!students) return;

    const existing = await fetchAPI(`/api/teacher/attendance?date=${todayStr()}`);
    const alreadyDone = existing && existing.some(a => a.className === className && a.section === section);

    attendanceMap = {};
    students.forEach(s => {
        const existingRecord = existing?.find(a => (a.studentId?._id || a.studentId) === s._id);
        attendanceMap[s._id] = existingRecord ? existingRecord.status : 'present';
    });

    const presentCount = () => Object.values(attendanceMap).filter(v => v === 'present').length;
    const absentCount = () => Object.values(attendanceMap).filter(v => v === 'absent').length;

    c.innerHTML = `
        <div class="card" style="padding:0; overflow:hidden;">
            <div style="background:#fff; padding:16px 24px; display:flex; align-items:center; gap:14px; border-bottom:2px solid #f1f5f9">
                <button onclick="loadAttendance()" style="background:none;border:none;cursor:pointer;padding:8px;border-radius:8px;transition:.2s;display:flex;align-items:center;justify-content:center" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
                    <svg fill="none" stroke="#64748b" viewBox="0 0 24 24" style="width:20px;height:20px;stroke-width:2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <div>
                    <div style="font-size:18px;font-weight:800;color:#0F172A">Class ${escapeHTML(className)} - Section ${escapeHTML(section)}</div>
                    <div style="font-size:12px;color:#64748b;font-weight:600">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
                </div>
            </div>
            
            ${alreadyDone ? '<div style="background:#fff3cd;border:1px solid #ffc107;padding:12px 16px;border-radius:10px;margin:16px 24px 0 24px;color:#856404;font-weight:500;">⚠️ Attendance already submitted for today for this class. You can update it below.</div>' : ''}
            
            <div style="padding:24px;">
                <div class="summary-bar" style="margin-top:0; margin-bottom:20px;">
                    <div class="summary-item" style="background:#28A745;border-radius:10px"><div class="count" id="presentCount">${presentCount()}</div><div class="text">Present</div></div>
                    <div class="summary-item" style="background:#DC3545;border-radius:10px"><div class="count" id="absentCount">${absentCount()}</div><div class="text">Absent</div></div>
                    <div class="summary-item" style="background:#007BFF;border-radius:10px"><div class="count">${students.length}</div><div class="text">Total</div></div>
                </div>
                <div id="studentAttList">
                    ${students.length === 0 ? '<div class="empty-state"><p>No students in this class to mark attendance for.</p></div>' :
            students.map((s, i) => `
                        <div class="student-attendance-row">
                            <div style="width:32px;height:32px;background:rgba(107,78,255,.1);border-radius:8px;display:flex;align-items:center;justify-content:center;margin-right:12px;font-weight:700;color:#6B4EFF;font-size:13px">${i + 1}</div>
                            <div class="student-info"><div class="student-name">${s.name}</div><div class="student-meta">Roll: ${s.rollNo || '-'} | Class: ${s.className}-${s.section || 'A'}</div></div>
                            <div style="display:flex;gap:8px">
                                <button class="att-btn absent ${attendanceMap[s._id] === 'absent' ? 'active' : ''}" id="abs-${s._id}" onclick="markAtt('${s._id}','absent')">A</button>
                                <button class="att-btn present ${attendanceMap[s._id] === 'present' ? 'active' : ''}" id="pre-${s._id}" onclick="markAtt('${s._id}','present')">P</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top:20px;display:flex;gap:12px;justify-content:flex-end">
                    <button class="btn btn-secondary" onclick="loadAttendance()">Cancel</button>
                    <button class="btn btn-success" id="submitAttBtn" onclick="submitAttendanceForClass('${className}','${section}')" ${students.length === 0 ? 'disabled' : ''}>✅ Submit Attendance</button>
                </div>
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

async function submitAttendanceForClass(className, section) {
    const btn = document.getElementById('submitAttBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const studentIds = Object.keys(attendanceMap);
    const attendanceData = studentIds.map(sid => ({
        studentId: sid,
        status: attendanceMap[sid] || 'present',
        className: className,
        section: section
    }));

    const result = await fetchAPI('/api/teacher/attendance', {
        method: 'POST',
        body: JSON.stringify({ attendanceData, date: todayStr() })
    });

    if (result && result.message) {
        showToast(`Attendance for Class ${className}-${section} submitted successfully!`);
        loadAttendance();
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

// ============ CHAT ============
let chatPollInterval = null;

async function loadChat() {
    const c = document.getElementById('mainContent');
    c.innerHTML = '<div class="loader">Loading conversations...</div>';

    const conversations = await fetchAPI('/api/chat/teacher/conversations');
    if (!conversations) return;

    if (conversations.length === 0) {
        c.innerHTML = `
            <div class="card">
                <div class="card-header" style="gap:12px">
                    <svg fill="none" stroke="#4338CA" viewBox="0 0 24 24" style="width:24px;height:24px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    ATKOOL Connect — Chat
                </div>
                <div class="empty-state"><p>No students assigned yet. Students in your classes will appear here for chat.</p></div>
            </div>`;
        return;
    }

    const convListHtml = conversations.map(conv => {
        const s = conv.student;
        const lastMsg = conv.lastMessage;
        const lastMsgText = lastMsg ? (lastMsg.senderType === 'teacher' ? 'You: ' : '') + (lastMsg.message.length > 40 ? lastMsg.message.substring(0, 40) + '...' : lastMsg.message) : 'No messages yet';
        const lastTime = lastMsg ? formatChatTime(new Date(lastMsg.createdAt)) : '';
        const unreadBadge = conv.unreadCount > 0 ? `<span style="background:#ef4444;color:#fff;font-size:10px;font-weight:800;padding:3px 8px;border-radius:10px;min-width:20px;text-align:center">${conv.unreadCount}</span>` : '';

        return `
            <div class="conv-item" onclick="loadChatConversation('${s._id}','${s.name}','${s.parentName || 'Parent'}')" style="
                display:flex;align-items:center;gap:14px;padding:16px 20px;cursor:pointer;border-bottom:1px solid #f1f5f9;transition:all .2s;
                ${conv.unreadCount > 0 ? 'background:#f8fafc;' : ''}
            " onmouseover="this.style.background='#eef2ff'" onmouseout="this.style.background='${conv.unreadCount > 0 ? '#f8fafc' : '#fff'}'">
                <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#4338CA,#7C3AED);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-weight:800;font-size:18px">
                    ${s.name.charAt(0).toUpperCase()}
                </div>
                <div style="flex:1;min-width:0">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <div style="font-weight:700;color:#0F172A;font-size:14px">${s.name}</div>
                        <div style="font-size:11px;color:#94a3b8;font-weight:500">${lastTime}</div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:3px">
                        <div style="font-size:12px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;${conv.unreadCount > 0 ? 'font-weight:700;color:#334155' : ''}">${lastMsgText}</div>
                        ${unreadBadge}
                    </div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:2px">Class ${s.className}-${s.section} • Parent: ${s.parentName || 'N/A'}</div>
                </div>
            </div>`;
    }).join('');

    c.innerHTML = `
        <div class="card" style="padding:0;overflow:hidden">
            <div style="padding:20px 24px;border-bottom:2px solid #f1f5f9;display:flex;align-items:center;gap:12px">
                <svg fill="none" stroke="#4338CA" viewBox="0 0 24 24" style="width:26px;height:26px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                <div>
                    <div style="font-size:18px;font-weight:800;color:#0F172A">ATKOOL Connect</div>
                    <div style="font-size:12px;color:#64748b;font-weight:600">${conversations.length} conversation${conversations.length > 1 ? 's' : ''}</div>
                </div>
            </div>
            <div style="max-height:calc(100vh - 250px);overflow-y:auto">
                ${convListHtml}
            </div>
        </div>`;

    updateChatBadge();
}
//test
async function loadChatConversation(studentId, studentName, parentName) {
    if (chatPollInterval) { clearInterval(chatPollInterval); chatPollInterval = null; }

    const c = document.getElementById('mainContent');
    c.innerHTML = '<div class="loader">Loading chat...</div>';

    const messages = await fetchAPI(`/api/chat/teacher/messages/${studentId}`);
    if (!messages) return;

    const messagesHtml = messages.map(msg => {
        const isMe = msg.senderType === 'teacher';
        const time = new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `
            <div style="display:flex;justify-content:${isMe ? 'flex-end' : 'flex-start'};margin-bottom:8px">
                <div style="
                    max-width:70%;padding:12px 16px;border-radius:${isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};
                    background:${isMe ? 'linear-gradient(135deg,#4338CA,#6366f1)' : '#f1f5f9'};
                    color:${isMe ? '#fff' : '#1e293b'};font-size:14px;line-height:1.5;
                    box-shadow:0 2px 8px ${isMe ? 'rgba(67,56,202,.2)' : 'rgba(0,0,0,.04)'};
                ">
                    <div>${msg.message}</div>
                    <div style="font-size:10px;margin-top:4px;opacity:.7;text-align:${isMe ? 'right' : 'left'}">${time}${isMe && msg.isRead ? ' ✓✓' : ''}</div>
                </div>
            </div>`;
    }).join('');

    c.innerHTML = `
        <div style="display:flex;flex-direction:column;height:calc(100vh - 140px);">
            <!-- Chat Header -->
            <div style="background:#fff;border-radius:16px 16px 0 0;padding:16px 24px;display:flex;align-items:center;gap:14px;border:1px solid #e2e8f0;border-bottom:2px solid #f1f5f9">
                <button onclick="loadChat()" style="background:none;border:none;cursor:pointer;padding:8px;border-radius:8px;transition:.2s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
                    <svg fill="none" stroke="#64748b" viewBox="0 0 24 24" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#4338CA,#7C3AED);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;flex-shrink:0">
                    ${studentName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style="font-weight:700;color:#0F172A;font-size:15px">${studentName}</div>
                    <div style="font-size:12px;color:#64748b;font-weight:500">Parent: ${parentName}</div>
                </div>
            </div>
            
            <!-- Messages Area -->
            <div id="chatMessages" style="flex:1;overflow-y:auto;padding:20px 24px;background:#fafbfc;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
                ${messages.length === 0 ? '<div style="text-align:center;color:#94a3b8;padding:40px;font-weight:500">Start a conversation with ' + parentName + '</div>' : messagesHtml}
            </div>
            
            <!-- Input Area -->
            <div style="background:#fff;border-radius:0 0 16px 16px;padding:16px 24px;display:flex;gap:12px;align-items:center;border:1px solid #e2e8f0;border-top:2px solid #f1f5f9">
                <input type="text" id="chatInput" placeholder="Type a message..." style="flex:1;padding:12px 18px;border:2px solid #e2e8f0;border-radius:24px;font-size:14px;font-family:inherit;outline:none;transition:.2s" onfocus="this.style.borderColor='#4338CA'" onblur="this.style.borderColor='#e2e8f0'" onkeypress="if(event.key==='Enter')sendTeacherMessage('${studentId}')">
                <button onclick="sendTeacherMessage('${studentId}')" style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#4338CA,#6366f1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .2s;box-shadow:0 4px 12px rgba(67,56,202,.3)" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform=''">
                    <svg fill="none" stroke="white" viewBox="0 0 24 24" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
            </div>
        </div>`;

    // Scroll to bottom
    const chatDiv = document.getElementById('chatMessages');
    chatDiv.scrollTop = chatDiv.scrollHeight;

    // Poll for new messages every 5 seconds
    chatPollInterval = setInterval(async () => {
        const newMessages = await fetchAPI(`/api/chat/teacher/messages/${studentId}`);
        if (!newMessages) return;
        const container = document.getElementById('chatMessages');
        if (!container) { clearInterval(chatPollInterval); return; }

        const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;

        if (newMessages.length > 0) {
            container.innerHTML = newMessages.map(msg => {
                const isMe = msg.senderType === 'teacher';
                const time = new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                return `<div style="display:flex;justify-content:${isMe ? 'flex-end' : 'flex-start'};margin-bottom:8px">
                    <div style="max-width:70%;padding:12px 16px;border-radius:${isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};background:${isMe ? 'linear-gradient(135deg,#4338CA,#6366f1)' : '#f1f5f9'};color:${isMe ? '#fff' : '#1e293b'};font-size:14px;line-height:1.5;box-shadow:0 2px 8px ${isMe ? 'rgba(67,56,202,.2)' : 'rgba(0,0,0,.04)'};">
                        <div>${msg.message}</div>
                        <div style="font-size:10px;margin-top:4px;opacity:.7;text-align:${isMe ? 'right' : 'left'}">${time}${isMe && msg.isRead ? ' ✓✓' : ''}</div>
                    </div>
                </div>`;
            }).join('');
        }

        if (wasAtBottom) container.scrollTop = container.scrollHeight;
        updateChatBadge();
    }, 5000);
}

function downloadBase64File(base64Data, filename) {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename || 'attached_document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function renderTeacherChatMessage(msg) {
    const isMe = msg.senderType === 'teacher';
    const time = new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let contentHtml = '';
    if (msg.messageType === 'image') {
        contentHtml = `<img src="${msg.message}" style="max-width:100%; max-height:200px; border-radius:8px; display:block; margin-bottom:4px; cursor:pointer;" onclick="window.open('${msg.message}', '_blank')">`;
    } else if (msg.messageType === 'file') {
        const mimeMatch = msg.message.match(/data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : '';
        let extension = 'file';
        if (mimeType) {
            const parts = mimeType.split('/');
            extension = parts[1] || 'file';
        }
        contentHtml = `
            <div style="display:flex;align-items:center;gap:10px;padding:10px;background:${isMe ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)'};border-radius:8px;min-width:200px;">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:24px;height:24px;stroke-width:2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Shared Document</div>
                    <div style="font-size:10px;opacity:0.8;">Format: ${extension.toUpperCase()}</div>
                </div>
                <button onclick="downloadBase64File('${msg.message}', 'document.${extension}')" style="background:${isMe ? '#fff' : '#4338CA'};color:${isMe ? '#4338CA' : '#fff'};border:none;border-radius:6px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0;">Save</button>
            </div>`;
    } else {
        contentHtml = `<div>${escapeHTML(msg.message)}</div>`;
    }

    return `
        <div style="display:flex;justify-content:${isMe ? 'flex-end' : 'flex-start'};margin-bottom:8px">
            <div style="
                max-width:70%;padding:12px 16px;border-radius:${isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};
                background:${isMe ? 'linear-gradient(135deg,#4338CA,#6366f1)' : '#f1f5f9'};
                color:${isMe ? '#fff' : '#1e293b'};font-size:14px;line-height:1.5;
                box-shadow:0 2px 8px ${isMe ? 'rgba(67,56,202,.2)' : 'rgba(0,0,0,.04)'};
            ">
                ${contentHtml}
                <div style="font-size:10px;margin-top:4px;opacity:.7;text-align:${isMe ? 'right' : 'left'}">${time}${isMe && msg.isRead ? ' ✓✓' : ''}</div>
            </div>
        </div>`;
}

async function handleTeacherChatFileSelected(event, studentId) {
    const file = event.target.files[0];
    if (!file) return;

    const isMedia = file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/');
    const sizeInMB = file.size / (1024 * 1024);
    if (isMedia) {
        if (sizeInMB > 2) {
            showToast('Media files (images, video, audio) must be less than 2 MB.', 'error');
            event.target.value = '';
            return;
        }
    } else {
        if (sizeInMB > 3) {
            showToast('Documents and other files must be less than 3 MB.', 'error');
            event.target.value = '';
            return;
        }
    }

    showToast('Uploading attachment...', 'info');

    const reader = new FileReader();
    reader.onload = async function (e) {
        const base64Data = e.target.result;
        const messageType = file.type.startsWith('image/') ? 'image' : 'file';

        const result = await fetchAPI('/api/chat/teacher/send', {
            method: 'POST',
            body: JSON.stringify({
                studentId,
                message: base64Data,
                messageType
            })
        });

        if (result && result._id) {
            showToast('Attachment sent successfully!');
            const container = document.getElementById('chatMessages');
            if (container) {
                const emptyMsg = container.querySelector('[style*="text-align:center"]');
                if (emptyMsg) emptyMsg.remove();
                container.innerHTML += renderTeacherChatMessage(result);
                container.scrollTop = container.scrollHeight;
            }
        } else {
            showToast(result?.message || 'Failed to send attachment', 'error');
        }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

async function loadChatConversation(studentId, studentName, parentName) {
    if (chatPollInterval) { clearInterval(chatPollInterval); chatPollInterval = null; }

    const c = document.getElementById('mainContent');
    c.innerHTML = '<div class="loader">Loading chat...</div>';

    const messages = await fetchAPI(`/api/chat/teacher/messages/${studentId}`);
    if (!messages) return;

    const messagesHtml = messages.map(msg => renderTeacherChatMessage(msg)).join('');

    c.innerHTML = `
        <div style="display:flex;flex-direction:column;height:calc(100vh - 140px);">
            <!-- Chat Header -->
            <div style="background:#fff;border-radius:16px 16px 0 0;padding:16px 24px;display:flex;align-items:center;gap:14px;border:1px solid #e2e8f0;border-bottom:2px solid #f1f5f9">
                <button onclick="loadChat()" style="background:none;border:none;cursor:pointer;padding:8px;border-radius:8px;transition:.2s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
                    <svg fill="none" stroke="#64748b" viewBox="0 0 24 24" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#4338CA,#7C3AED);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;flex-shrink:0">
                    ${studentName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style="font-weight:700;color:#0F172A;font-size:15px">${studentName}</div>
                    <div style="font-size:12px;color:#64748b;font-weight:500">Parent: ${parentName}</div>
                </div>
            </div>
            
            <!-- Messages Area -->
            <div id="chatMessages" style="flex:1;overflow-y:auto;padding:20px 24px;background:#fafbfc;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
                ${messages.length === 0 ? '<div style="text-align:center;color:#94a3b8;padding:40px;font-weight:500">Start a conversation with ' + parentName + '</div>' : messagesHtml}
            </div>
            
            <!-- Input Area -->
            <div style="background:#fff;border-radius:0 0 16px 16px;padding:16px 24px;display:flex;gap:12px;align-items:center;border:1px solid #e2e8f0;border-top:2px solid #f1f5f9;position:relative;">
                <input type="file" id="teacherChatFileInput" style="display:none" onchange="handleTeacherChatFileSelected(event, '${studentId}')">
                <button onclick="document.getElementById('teacherChatFileInput').click()" style="width:40px;height:40px;border-radius:50%;background:#f1f5f9;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
                    <svg fill="none" stroke="#475569" viewBox="0 0 24 24" style="width:20px;height:20px;stroke-width:2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                </button>
                <input type="text" id="chatInput" placeholder="Type a message..." style="flex:1;padding:12px 18px;border:2px solid #e2e8f0;border-radius:24px;font-size:14px;font-family:inherit;outline:none;transition:.2s" onfocus="this.style.borderColor='#4338CA'" onblur="this.style.borderColor='#e2e8f0'" onkeypress="if(event.key==='Enter')sendTeacherMessage('${studentId}')">
                <button onclick="sendTeacherMessage('${studentId}')" style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#4338CA,#6366f1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .2s;box-shadow:0 4px 12px rgba(67,56,202,.3)" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform=''">
                    <svg fill="none" stroke="white" viewBox="0 0 24 24" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
            </div>
        </div>`;

    // Scroll to bottom
    const chatDiv = document.getElementById('chatMessages');
    chatDiv.scrollTop = chatDiv.scrollHeight;

    // Poll for new messages every 5 seconds
    chatPollInterval = setInterval(async () => {
        const newMessages = await fetchAPI(`/api/chat/teacher/messages/${studentId}`);
        if (!newMessages) return;
        const container = document.getElementById('chatMessages');
        if (!container) { clearInterval(chatPollInterval); return; }

        const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;

        if (newMessages.length > 0) {
            container.innerHTML = newMessages.map(msg => renderTeacherChatMessage(msg)).join('');
        }
        if (wasAtBottom) container.scrollTop = container.scrollHeight;
        updateChatBadge();
    }, 5000);
}

async function sendTeacherMessage(studentId) {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    const result = await fetchAPI('/api/chat/teacher/send', {
        method: 'POST',
        body: JSON.stringify({ studentId, message })
    });

    if (result && result._id) {
        // Add message to UI immediately
        const chatDiv = document.getElementById('chatMessages');
        const emptyMsg = chatDiv.querySelector('[style*="text-align:center"]');
        if (emptyMsg) emptyMsg.remove();
        chatDiv.innerHTML += renderTeacherChatMessage(result);
        chatDiv.scrollTop = chatDiv.scrollHeight;
    } else {
        showToast('Failed to send message', 'error');
    }
}

function formatChatTime(date) {
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============ ADD STUDENT ============
let teacherStudentLocalStream = null;

function startTeacherStudentWebcam() {
    var video = document.getElementById('teacherStudentWebcamVideo');
    var container = document.getElementById('teacherStudentWebcamContainer');
    container.style.display = 'flex';
    document.getElementById('btnStartTeacherStudentCamera').style.display = 'none';
    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
        .then(function (stream) {
            teacherStudentLocalStream = stream;
            video.srcObject = stream;
        })
        .catch(function (error) {
            console.error("Webcam access error:", error);
            showToast("Failed to access webcam.", "error");
            stopTeacherStudentWebcam();
        });
}

function stopTeacherStudentWebcam() {
    var container = document.getElementById('teacherStudentWebcamContainer');
    var video = document.getElementById('teacherStudentWebcamVideo');
    if (container) container.style.display = 'none';
    const btn = document.getElementById('btnStartTeacherStudentCamera');
    if (btn) btn.style.display = 'inline-block';
    if (teacherStudentLocalStream) {
        teacherStudentLocalStream.getTracks().forEach(function (track) { track.stop(); });
        teacherStudentLocalStream = null;
    }
    if (video) video.srcObject = null;
}

function captureTeacherStudentPhoto() {
    var video = document.getElementById('teacherStudentWebcamVideo');
    var canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 240;
    var ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    var base64 = canvas.toDataURL('image/jpeg');
    document.getElementById('teacherStudentPhotoBase64').value = base64;
    document.getElementById('teacherStudentPhotoPreview').src = base64;
    document.getElementById('teacherStudentPhotoPreviewContainer').style.display = 'flex';
    stopTeacherStudentWebcam();
}
function removeTeacherStudentPhoto() {
    document.getElementById('teacherStudentPhotoBase64').value = '';
    document.getElementById('teacherStudentPhotoPreview').src = '';
    document.getElementById('teacherStudentPhotoPreviewContainer').style.display = 'none';
    document.getElementById('teacherStudentPhotoFile').value = '';
}

async function loadAddStudent() {
    const c = document.getElementById('mainContent');
    c.innerHTML = '<div class="loader">Loading...</div>';

    // Fetch teacher's assigned classes
    const classes = await fetchAPI('/api/teacher/my-classes');
    if (!classes) return;

    if (classes.length === 0) {
        c.innerHTML = `
            <div class="card">
                <div class="card-header" style="color:#ef4444">Access Denied</div>
                <div class="empty-state">
                    <p>⚠️ No classes assigned to you yet. Please contact your administrator to get classes assigned.</p>
                </div>
            </div>`;
        return;
    }

    const classOptions = classes.map(cls => `
        <option value="${escapeHTML(cls.className)}|${escapeHTML(cls.section || 'A')}">
            Class ${escapeHTML(cls.className)} - Section ${escapeHTML(cls.section || 'A')}
        </option>
    `).join('');

    // Fetch vans
    let vanOptions = '<option value="">-- No Van Assigned --</option>';
    try {
        const vans = await fetchAPI('/api/school-vans');
        if (vans && vans.length > 0) {
            vanOptions += vans.map(v => `<option value="${v._id}">${v.vehicleNumber} (${v.driverName})</option>`).join('');
        }
    } catch (e) {
        console.error("Error loading school vans:", e);
    }

    c.innerHTML = `
        <div class="card" style="max-width: 800px; margin: 0 auto; padding: 30px;">
            <div class="card-header" style="font-size:22px; font-weight:800; color:#0F172A; border-bottom:2px solid #f1f5f9; padding-bottom:14px; margin-bottom:20px;">
                Add Student
            </div>
            <form id="addStudentForm" onsubmit="submitStudent(event)" style="display: flex; flex-direction: column; gap: 15px;">
                
                <div class="form-group">
                    <label style="font-weight: 600; font-size: 13px; color: #334155; margin-bottom: 6px; display: block;">Teacher</label>
                    <input type="text" value="${escapeHTML(teacherData.name)}" disabled style="width: 100%; padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 14px; background: #f8fafc; color: #64748b;">
                </div>

                <div class="form-group">
                    <label style="font-weight: 600; font-size: 13px; color: #334155; margin-bottom: 6px; display: block;">Class & Section *</label>
                    <select id="addStudentClassSelect" required style="width: 100%; padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 14px; cursor: pointer;">
                        ${classOptions}
                    </select>
                </div>

                <div class="form-group">
                    <label style="font-weight: 600; font-size: 13px; color: #334155; margin-bottom: 6px; display: block;">Student Name *</label>
                    <input type="text" id="addStudentName" required placeholder="Enter student name" style="width: 100%; padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 14px;">
                </div>

                <div class="form-group">
                    <label style="font-weight: 600; font-size: 13px; color: #334155; margin-bottom: 6px; display: block;">Gmail ID *</label>
                    <input type="email" id="addStudentEmail" required placeholder="Enter Gmail ID (e.g. parent@gmail.com)" style="width: 100%; padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 14px;">
                </div>

                <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="form-group">
                        <label style="font-weight: 600; font-size: 13px; color: #334155; margin-bottom: 6px; display: block;">Student ID (SATA'S ID) *</label>
                        <input type="text" id="addStudentId" required placeholder="Enter Student ID (SATA'S ID)" style="width: 100%; padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 14px;">
                    </div>
                    <div class="form-group">
                        <label style="font-weight: 600; font-size: 13px; color: #334155; margin-bottom: 6px; display: block;">Mobile No *</label>
                        <input type="text" id="addMobileNo" required placeholder="Enter 10-digit mobile number" maxlength="10" style="width: 100%; padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 14px;">
                    </div>
                </div>

                <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="form-group">
                        <label style="font-weight: 600; font-size: 13px; color: #334155; margin-bottom: 6px; display: block;">Parent Name</label>
                        <input type="text" id="addParentName" placeholder="Parent name" style="width: 100%; padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 14px;">
                    </div>
                    <div class="form-group">
                        <label style="font-weight: 600; font-size: 13px; color: #334155; margin-bottom: 6px; display: block;">Parent Mobile *</label>
                        <input type="text" id="addParentMobile" required placeholder="Parent mobile (10 digits)" maxlength="10" style="width: 100%; padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 14px;">
                    </div>
                </div>

                <div class="form-group">
                    <label style="font-weight: 600; font-size: 13px; color: #334155; margin-bottom: 6px; display: block;">Guardian Contact Number (Secondary)</label>
                    <input type="text" id="addGuardianMobile" placeholder="Guardian contact number" style="width: 100%; padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 14px;">
                </div>

                <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="form-group">
                        <label style="font-weight: 600; font-size: 13px; color: #334155; margin-bottom: 6px; display: block;">Assigned Van / Bus</label>
                        <select id="addVanSelect" style="width: 100%; padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 14px; cursor: pointer;">
                            ${vanOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label style="font-weight: 600; font-size: 13px; color: #334155; margin-bottom: 6px; display: block;">Pickup Point</label>
                        <input type="text" id="addPickupPoint" placeholder="e.g. Main Gate, Sector 4 Cross" style="width: 100%; padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 14px;">
                    </div>
                </div>

                <div class="form-group">
                    <label style="font-weight: 600; font-size: 13px; color: #334155; margin-bottom: 6px; display: block;">Student Photo</label>
                    <div style="display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px;">
                        <input type="file" id="teacherStudentPhotoFile" accept="image/jpeg,image/png" style="flex: 1; padding: 6px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 14px;">
                        <button type="button" class="btn" id="btnStartTeacherStudentCamera" onclick="startTeacherStudentWebcam()" style="padding: 10px 18px; margin: 0; background: linear-gradient(135deg,#0F172A,#1e293b); color: white; font-weight: 600; border-radius: 10px; border: none; cursor: pointer;">📷 Use Camera</button>
                    </div>
                    
                    <!-- Webcam Stream Container -->
                    <div id="teacherStudentWebcamContainer" style="display: none; flex-direction: column; align-items: center; gap: 10px; padding: 10px; background: #f1f5f9; border-radius: 8px; margin-bottom: 10px;">
                        <video id="teacherStudentWebcamVideo" width="320" height="240" autoplay style="border-radius: 8px; border: 2px solid #cbd5e1; transform: scaleX(-1);"></video>
                        <div style="display: flex; gap: 10px;">
                            <button type="button" class="btn btn-success" onclick="captureTeacherStudentPhoto()" style="background:linear-gradient(135deg,#10b981,#059669); color: white; font-weight: 600; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer;">Capture</button>
                            <button type="button" class="btn btn-outline" onclick="stopTeacherStudentWebcam()" style="padding: 8px 16px; border-radius: 8px; border: 2px solid #ccc; cursor: pointer;">Cancel</button>
                        </div>
                    </div>
                    
                    <!-- Captured Image Preview & Hidden Base64 Storage -->
                    <div id="teacherStudentPhotoPreviewContainer" style="display: none; align-items: center; gap: 15px; margin-top: 10px; padding: 10px; border: 1px dashed #cbd5e1; border-radius: 8px;">
                        <img id="teacherStudentPhotoPreview" src="" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid #4338CA;">
                        <div>
                            <span style="font-size: 13px; font-weight: 600; color: #334155;">Photo selected / captured</span>
                            <button type="button" class="btn btn-outline" onclick="removeTeacherStudentPhoto()" style="padding: 4px 8px; font-size: 11px; margin-top: 5px; display: block; border-color:#dc2626; color:#dc2626; cursor: pointer;">Remove Photo</button>
                        </div>
                    </div>
                    <input type="hidden" id="teacherStudentPhotoBase64">
                </div>

                <div style="display:flex; gap:12px; margin-top:20px; justify-content: flex-end;">
                    <button type="button" class="btn btn-outline" onclick="loadStudents()" style="padding: 12px 24px; border-radius: 10px; border: 2px solid #ccc; font-weight: 600; cursor: pointer;">Cancel</button>
                    <button type="submit" class="btn btn-success" id="addStudentBtn" style="padding: 12px 24px; border-radius: 10px; background: linear-gradient(135deg,#4338CA,#6366f1); color: white; font-weight: 600; border: none; cursor: pointer;">Add Student</button>
                </div>
            </form>
        </div>`;

    // Attach file input change listener
    const fileInput = document.getElementById('teacherStudentPhotoFile');
    if (fileInput) {
        fileInput.addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('teacherStudentPhotoBase64').value = e.target.result;
                document.getElementById('teacherStudentPhotoPreview').src = e.target.result;
                document.getElementById('teacherStudentPhotoPreviewContainer').style.display = 'flex';
            };
            reader.readAsDataURL(file);
        });
    }
}

async function submitStudent(e) {
    e.preventDefault();
    const btn = document.getElementById('addStudentBtn');

    const classVal = document.getElementById('addStudentClassSelect').value;
    if (!classVal) {
        showToast('Please select a class.', 'error');
        return;
    }
    const [className, section] = classVal.split('|');

    const name = document.getElementById('addStudentName').value.trim();
    const email = document.getElementById('addStudentEmail').value.trim();
    const studentId = document.getElementById('addStudentId').value.trim();
    const mobileNo = document.getElementById('addMobileNo').value.trim();
    const parentName = document.getElementById('addParentName').value.trim();
    const parentMobile = document.getElementById('addParentMobile').value.trim();
    const guardianMobile = document.getElementById('addGuardianMobile').value.trim();
    const vanId = document.getElementById('addVanSelect').value;
    const pickupPoint = document.getElementById('addPickupPoint').value.trim();
    const photo = document.getElementById('teacherStudentPhotoBase64').value;

    if (!name || !className) {
        showToast('Name and Class are required', 'error');
        return;
    }
    if (!email || !parentMobile || !mobileNo) {
        showToast('Gmail ID, Mobile number, and Parent mobile number are required', 'error');
        return;
    }
    if (!/^\d{10}$/.test(mobileNo) || !/^\d{10}$/.test(parentMobile)) {
        showToast('Mobile number and Parent mobile number must be exactly 10 digits', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Adding Student...';

    const result = await fetchAPI('/api/teacher/students', {
        method: 'POST',
        body: JSON.stringify({
            name,
            className,
            section,
            email,
            studentId,
            mobileNo,
            parentName,
            parentMobile,
            guardianMobile,
            vanId,
            pickupPoint,
            photo
        })
    });

    if (result && result._id) {
        showToast(`Student ${name} added successfully! Credentials sent to email.`);
        loadStudents();
    } else {
        showToast(result?.message || 'Failed to add student', 'error');
        btn.disabled = false;
        btn.textContent = 'Add Student';
    }
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
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ============ LEAVE MANAGEMENT ============
async function loadLeaves() {
    const c = document.getElementById('mainContent');
    const [balances, list] = await Promise.all([
        fetchAPI('/api/leaves/balances'),
        fetchAPI('/api/leaves/list')
    ]);
    if (!balances || !list) return;

    c.innerHTML = `
        <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
            <div class="stat-card bg-blue">
                <div class="value">${balances.remaining.Casual} / ${balances.allocated.Casual}</div>
                <div class="label">Casual Leave Remaining</div>
            </div>
            <div class="stat-card bg-green">
                <div class="value">${balances.remaining.Sick} / ${balances.allocated.Sick}</div>
                <div class="label">Sick Leave Remaining</div>
            </div>
            <div class="stat-card" style="background:linear-gradient(135deg, #a855f7, #7e22ce)">
                <div class="value">${balances.remaining.Earned} / ${balances.allocated.Earned}</div>
                <div class="label">Earned Leave Remaining</div>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 2fr;gap:24px;margin-top:24px">
            <div class="card" style="height:fit-content">
                <div class="card-header">Apply for Leave</div>
                <form id="leaveRequestForm" onsubmit="submitLeaveRequest(event)" style="padding:16px">
                    <div class="form-group" style="margin-bottom:12px">
                        <label>Leave Type *</label>
                        <select name="leaveType" required style="width:100%;padding:8px;border-radius:6px;border:1px solid #ccc">
                            <option value="Casual">Casual Leave</option>
                            <option value="Sick">Sick Leave</option>
                            <option value="Earned">Earned Leave</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                        <label>Start Date *</label>
                        <input type="date" name="startDate" required style="width:100%;padding:8px;border-radius:6px;border:1px solid #ccc">
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                        <label>End Date *</label>
                        <input type="date" name="endDate" required style="width:100%;padding:8px;border-radius:6px;border:1px solid #ccc">
                    </div>
                    <div class="form-group" style="margin-bottom:16px">
                        <label>Reason *</label>
                        <textarea name="reason" required style="width:100%;padding:8px;border-radius:6px;border:1px solid #ccc;min-height:80px" placeholder="Reason for leave..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-success" id="applyLeaveBtn" style="width:100%">Submit Application</button>
                </form>
            </div>

            <div class="card">
                <div class="card-header">Leave History <span class="badge">${list.length}</span></div>
                ${list.length === 0 ? '<div class="empty-state"><p>No leave requests found.</p></div>' : `
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Duration</th>
                            <th>Days</th>
                            <th>Reason</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map(l => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
        let badgeClass = 'badge-orange';
        if (l.status === 'Approved') badgeClass = 'badge-green';
        if (l.status === 'Rejected') badgeClass = 'badge-red';
        return `
                                <tr>
                                    <td><strong>${l.leaveType}</strong></td>
                                    <td>${start.toLocaleDateString()} - ${end.toLocaleDateString()}</td>
                                    <td>${diffDays}</td>
                                    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${l.reason}">${l.reason}</td>
                                    <td><span class="badge ${badgeClass}">${l.status}</span></td>
                                </tr>
                            `;
    }).join('')}
                    </tbody>
                </table>
                `}
            </div>
        </div>
    `;
}

async function submitLeaveRequest(e) {
    e.preventDefault();
    const form = document.getElementById('leaveRequestForm');
    const btn = document.getElementById('applyLeaveBtn');
    btn.disabled = true; btn.textContent = 'Submitting...';

    const fd = new FormData(form);
    const body = {};
    fd.forEach((v, k) => body[k] = v);

    const result = await fetchAPI('/api/leaves/request', { method: 'POST', body: JSON.stringify(body) });
    if (result && result._id) {
        showToast('Leave request submitted successfully!');
        loadLeaves();
    } else {
        showToast(result?.message || 'Failed to submit leave request', 'error');
    }
    btn.disabled = false; btn.textContent = 'Submit Application';
}

// ============ HOMEWORK ============
function escapeHTML(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadHomework() {
    const c = document.getElementById('mainContent');
    const [homeworks, classes] = await Promise.all([
        fetchAPI('/api/homework/teacher'),
        fetchAPI('/api/teacher/my-classes')
    ]);
    if (!homeworks || !classes) return;

    const classOptions = classes.map(cls => `<option value="${escapeHTML(cls.className)}|${escapeHTML(cls.section || 'A')}">Class ${escapeHTML(cls.className)} - ${escapeHTML(cls.section || 'A')}</option>`).join('');

    c.innerHTML = `
        <div style="display:grid;grid-template-columns:320px 1fr;gap:22px">
            <div class="card" style="height:fit-content">
                <div class="card-header">Create Homework</div>
                ${classes.length === 0 ? '<div class="empty-state"><p>No assigned classes found.</p></div>' : `
                <form id="homeworkForm" onsubmit="submitHomework(event)">
                    <div class="form-group">
                        <label>Class *</label>
                        <select id="homeworkClass" required>${classOptions}</select>
                    </div>
                    <div class="form-group">
                        <label>Subject *</label>
                        <input id="homeworkSubject" required value="${escapeHTML(teacherData.subject || '')}" placeholder="Subject">
                    </div>
                    <div class="form-group">
                        <label>Title *</label>
                        <input id="homeworkTitle" required placeholder="Chapter 4 exercises">
                    </div>
                    <div class="form-group">
                        <label>Description *</label>
                        <textarea id="homeworkDescription" required style="width:100%;min-height:110px;padding:10px 14px;border:2px solid #e0e0e0;border-radius:10px;font-family:inherit" placeholder="Assignment details"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Due Date *</label>
                        <input id="homeworkDueDate" type="date" required>
                    </div>
                    <button class="btn btn-success" id="homeworkSubmitBtn" style="width:100%">Assign Homework</button>
                </form>`}
            </div>
            <div class="card">
                <div class="card-header">Assigned Homework <span class="badge">${homeworks.length}</span></div>
                ${homeworks.length === 0 ? '<div class="empty-state"><p>No homework assigned yet.</p></div>' : `
                <table>
                    <thead><tr><th>Title</th><th>Class</th><th>Subject</th><th>Due</th><th>Submissions</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${homeworks.map(hw => `
                            <tr>
                                <td><strong>${escapeHTML(hw.title)}</strong><div style="font-size:12px;color:#64748b;margin-top:4px">${escapeHTML(hw.description).slice(0, 80)}${(hw.description || '').length > 80 ? '...' : ''}</div></td>
                                <td>${escapeHTML(hw.className)}-${escapeHTML(hw.section || 'A')}</td>
                                <td>${escapeHTML(hw.subject)}</td>
                                <td>${hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : '-'}</td>
                                <td>${hw.submissionsCount || 0} submitted / ${hw.gradedCount || 0} graded</td>
                                <td>
                                    <button class="btn btn-primary" style="padding:6px 12px;font-size:12px" onclick="loadHomeworkSubmissions('${hw._id}', '${escapeHTML(hw.title)}')">Review</button>
                                    <button class="btn btn-outline" style="padding:6px 12px;font-size:12px;margin-left:5px" onclick="deleteHomework('${hw._id}')">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`}
            </div>
        </div>`;
}

async function submitHomework(e) {
    e.preventDefault();
    const btn = document.getElementById('homeworkSubmitBtn');
    const [className, section] = document.getElementById('homeworkClass').value.split('|');
    const payload = {
        className,
        section,
        subject: document.getElementById('homeworkSubject').value.trim(),
        title: document.getElementById('homeworkTitle').value.trim(),
        description: document.getElementById('homeworkDescription').value.trim(),
        dueDate: document.getElementById('homeworkDueDate').value
    };

    btn.disabled = true;
    btn.textContent = 'Assigning...';
    const result = await fetchAPI('/api/homework/teacher', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    btn.disabled = false;
    btn.textContent = 'Assign Homework';

    if (result && result._id) {
        showToast('Homework assigned successfully!');
        loadHomework();
    } else {
        showToast(result?.message || 'Failed to assign homework', 'error');
    }
}

async function deleteHomework(homeworkId) {
    if (!confirm('Delete this homework and its submissions?')) return;
    const result = await fetchAPI(`/api/homework/teacher/${homeworkId}`, { method: 'DELETE' });
    if (result && result.message) {
        showToast('Homework deleted.');
        loadHomework();
    } else {
        showToast(result?.message || 'Failed to delete homework', 'error');
    }
}

async function loadHomeworkSubmissions(homeworkId, title) {
    const c = document.getElementById('mainContent');
    c.innerHTML = '<div class="loader">Loading submissions...</div>';
    const submissions = await fetchAPI(`/api/homework/teacher/${homeworkId}/submissions`);
    if (!submissions) return;

    c.innerHTML = `
        <button class="btn btn-outline" onclick="loadHomework()" style="margin-bottom:16px">Back to Homework</button>
        <div class="card">
            <div class="card-header">Submissions - ${escapeHTML(title)} <span class="badge">${submissions.length}</span></div>
            ${submissions.length === 0 ? '<div class="empty-state"><p>No submissions yet.</p></div>' : `
            <table>
                <thead><tr><th>Student</th><th>Submitted</th><th>Answer</th><th>Grade</th><th>Feedback</th><th>Action</th></tr></thead>
                <tbody>
                    ${submissions.map(sub => `
                        <tr>
                            <td><strong>${escapeHTML(sub.studentId?.name || 'Student')}</strong><div style="font-size:12px;color:#64748b">Roll: ${escapeHTML(sub.studentId?.rollNo || sub.studentId?.studentId || '-')}</div></td>
                            <td>${sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '-'}</td>
                            <td style="max-width:260px;white-space:normal">${escapeHTML(sub.content)}</td>
                            <td><input id="grade-${sub._id}" value="${escapeHTML(sub.grade || '')}" style="width:80px;padding:8px;border:1px solid #ddd;border-radius:8px"></td>
                            <td><input id="feedback-${sub._id}" value="${escapeHTML(sub.feedback || '')}" style="width:180px;padding:8px;border:1px solid #ddd;border-radius:8px"></td>
                            <td><button class="btn btn-success" style="padding:7px 12px;font-size:12px" onclick="gradeHomework('${sub._id}')">Save</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`}
        </div>`;
}

async function gradeHomework(submissionId) {
    const grade = document.getElementById(`grade-${submissionId}`).value.trim();
    const feedback = document.getElementById(`feedback-${submissionId}`).value.trim();
    const result = await fetchAPI(`/api/homework/teacher/grade/${submissionId}`, {
        method: 'POST',
        body: JSON.stringify({ grade, feedback })
    });
    if (result && result._id) {
        showToast('Submission graded.');
    } else {
        showToast(result?.message || 'Failed to grade submission', 'error');
    }
}

// ============ MARKS ENTRY ============
async function loadMarksEntry() {
    const c = document.getElementById('mainContent');
    const exams = await fetchAPI('/api/results/exams');
    if (!exams) return;

    c.innerHTML = `
        <div class="card">
            <div class="card-header">Marks Entry</div>
            ${exams.length === 0 ? '<div class="empty-state"><p>No exams available for your assigned classes.</p></div>' : `
            <div class="attendance-controls">
                <select id="marksExamSelect" class="date-input" style="min-width:320px">
                    <option value="">Select exam</option>
                    ${exams.map(exam => `<option value="${exam._id}">${escapeHTML(exam.name || exam.examName || 'Exam')} - Class ${escapeHTML(exam.className)} - ${escapeHTML(exam.subject)} - ${exam.examDate ? new Date(exam.examDate).toLocaleDateString() : '-'}</option>`).join('')}
                </select>
                <button class="btn btn-primary" onclick="loadMarkSheet()">Load Mark Sheet</button>
            </div>
            <div id="marksSheetArea" class="empty-state"><p>Select an exam to enter marks.</p></div>`}
        </div>`;
}

async function loadMarkSheet() {
    const examId = document.getElementById('marksExamSelect').value;
    const area = document.getElementById('marksSheetArea');
    if (!examId) {
        showToast('Please select an exam', 'error');
        return;
    }

    area.innerHTML = '<div class="loader">Loading students...</div>';
    const data = await fetchAPI(`/api/results/exam/${examId}`);
    if (!data) return;
    const exam = data.exam || {};
    const rows = data.studentResults || [];
    const maxMarks = exam.totalMarks || 100;

    area.className = '';
    area.innerHTML = rows.length === 0 ? '<div class="empty-state"><p>No approved students found for this exam class.</p></div>' : `
        <div style="margin:12px 0 16px;color:#475569;font-weight:600">
            ${escapeHTML(exam.name || 'Exam')} | Class ${escapeHTML(exam.className)} | ${escapeHTML(exam.subject)} | Max ${maxMarks}
        </div>
        <table>
            <thead><tr><th>Roll</th><th>Student</th><th>Marks</th><th>Grade</th><th>Remarks</th></tr></thead>
            <tbody id="marksRows">
                ${rows.map(item => {
        const result = item.result || {};
        return `
                        <tr data-student-id="${item.student._id}">
                            <td>${escapeHTML(item.student.rollNo || '-')}</td>
                            <td><strong>${escapeHTML(item.student.name)}</strong></td>
                            <td><input class="marks-input" type="number" min="0" max="${maxMarks}" value="${result.marksObtained ?? ''}" oninput="syncGrade(this, ${maxMarks})" style="width:90px;padding:8px;border:1px solid #ddd;border-radius:8px"> / ${maxMarks}</td>
                            <td><input class="grade-input" value="${escapeHTML(result.grade || '')}" style="width:80px;padding:8px;border:1px solid #ddd;border-radius:8px"></td>
                            <td><input class="remarks-input" value="${escapeHTML(result.remarks || '')}" style="width:220px;padding:8px;border:1px solid #ddd;border-radius:8px"></td>
                        </tr>`;
    }).join('')}
            </tbody>
        </table>
        <div style="display:flex;justify-content:flex-end;margin-top:18px">
            <button class="btn btn-success" onclick="saveMarks('${exam._id}', ${maxMarks})">Save Marks</button>
        </div>`;
}

function calculateGrade(marks, maxMarks) {
    const percentage = maxMarks > 0 ? (Number(marks) / Number(maxMarks)) * 100 : 0;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'E';
}

function syncGrade(input, maxMarks) {
    const row = input.closest('tr');
    const gradeInput = row.querySelector('.grade-input');
    if (input.value !== '') {
        gradeInput.value = calculateGrade(input.value, maxMarks);
    }
}

async function saveMarks(examId, maxMarks) {
    const rows = Array.from(document.querySelectorAll('#marksRows tr'));
    const results = rows.map(row => ({
        studentId: row.dataset.studentId,
        marksObtained: row.querySelector('.marks-input').value || 0,
        maxMarks,
        grade: row.querySelector('.grade-input').value.trim(),
        remarks: row.querySelector('.remarks-input').value.trim()
    }));

    const response = await fetchAPI('/api/results/bulk', {
        method: 'POST',
        body: JSON.stringify({ examId, results })
    });
    if (response && response.success) {
        showToast('Marks saved successfully.');
    } else {
        showToast(response?.message || 'Failed to save marks', 'error');
    }
}

// Load default view
loadView('dashboard');
