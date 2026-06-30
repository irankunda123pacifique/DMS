// ── Auth Guard ─────────────────────────────────────────────────────
const session = Auth.requireAuth('dod');
if (!session) throw new Error('Unauthorized');

const schoolId = session.schoolId;

// ── Initialization ───────────────────────────────────────────────
async function initDashboard() {
  await DB.load(schoolId);
  const school = await DB.getSchool(schoolId);
  const dodProfileImg = school ? school.dod_profile_image : null;
  document.getElementById('sidebarAvatar').innerHTML = dodProfileImg ? `<img src="${dodProfileImg}" style="width:100%;height:100%;object-fit:cover;">` : getInitials(session.username);
  document.getElementById('topbarAvatar').innerHTML = dodProfileImg ? `<img src="${dodProfileImg}" style="width:100%;height:100%;object-fit:cover;">` : getInitials(session.username);
  document.getElementById('sidebarName').textContent = session.username;
  document.getElementById('menuName').textContent = session.username;
  document.getElementById('menuSchool').textContent = session.schoolName;
  navigate('dashboard');
}

initDashboard();

function handleStudentPhotoUpload(input, previewId) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      const MAX = 400;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
      else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL('image/jpeg', 0.75);
      document.getElementById(previewId).innerHTML = `<img src="${compressed}" style="width:100%;height:100%;object-fit:cover;">`;
      window._pendingStudentPhoto = compressed;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function logout() {
  Auth.clearSession();
  window.location.href = 'index.html';
}
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
}
function toggleUserMenu() {
  const m = document.getElementById('userMenu');
  m.style.display = m.style.display === 'none' ? 'block' : 'none';
}
document.addEventListener('click', e => {
  const um = document.getElementById('userMenu');
  const ab = document.getElementById('topbarAvatar');
  if (!ab.contains(e.target) && !um.contains(e.target)) um.style.display = 'none';
});

// ── Navigation ─────────────────────────────────────────────────────
let currentPage = '';
function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  const titles = { dashboard: 'Dashboard', classes: 'Classes', students: 'Students', teachers: 'Staff & Teachers', requests: 'Discipline Requests', analytics: 'Analytics', activity: 'Activity Logs', settings: 'Settings' };
  const subs = { dashboard: 'Overview of your school\'s discipline system', classes: 'Manage class groups and assignments', students: 'Manage student records & QR codes', teachers: 'Manage staff & teachers', requests: 'Review discipline requests', analytics: 'Statistics & reports', activity: 'Full audit trail', settings: 'School & account settings' };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  document.getElementById('pageSubtitle').textContent = subs[page] || '';
  updateBadges();
  const content = document.getElementById('pageContent');
  content.innerHTML = '';
  const pages = { dashboard: renderDashboard, classes: renderClasses, students: renderStudents, teachers: renderTeachers, requests: renderRequests, analytics: renderAnalytics, activity: renderActivity, settings: renderSettings };
  if (pages[page]) {
    pages[page]();
    applyTranslations();
  }
}

function updateBadges() {
  const reqs = DB.getRequests(schoolId).filter(r => r.status === 'pending').length;
  const ts = DB.getTeachers(schoolId).filter(t => t.status === 'pending').length;
  const ss = DB.getStaffMembers(schoolId).filter(s => s.status === 'pending').length;

  const pb = document.getElementById('pendingBadge');
  const tb = document.getElementById('pendingTeacherBadge');

  pb.style.display = reqs > 0 ? 'inline' : 'none';
  pb.textContent = reqs;

  const pendingUsers = ts + ss;
  tb.style.display = pendingUsers > 0 ? 'inline' : 'none';
  tb.textContent = pendingUsers;
}

// ── DASHBOARD PAGE ─────────────────────────────────────────────────
function renderDashboard() {
  const stats = DB.getStats(schoolId);
  const students = DB.getStudents(schoolId);
  const requests = DB.getRequests(schoolId);
  const logs = DB.getLogs(schoolId, 6);
  const pending = requests.filter(r => r.status === 'pending').slice(0, 4);
  const atRisk = students.filter(s => s.discipline_marks < 50).slice(0, 5);

  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
    <div class="fade-in">
      <div class="stats-grid">
        ${statCard('purple', 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z', stats.totalStudents, 'Total Students', '')}
        ${statCard('green', 'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z', stats.totalTeachers, 'Active Teachers', '')}
        ${statCard('orange', 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z', stats.pendingRequests, 'Pending Requests', '')}
        ${statCard('red', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z', stats.studentsAtRisk, 'Students at Risk', '')}
        ${statCard('blue', 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z', stats.avgMarks + '%', 'Avg Discipline Marks', '')}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <h3 style="font-size:1rem;font-weight:700;">Pending Requests</h3>
            <button class="btn btn-outline btn-sm" onclick="navigate('requests')">View All</button>
          </div>
          ${pending.length === 0 ? '<div class="empty-state" style="padding:32px 16px;"><p>No pending requests 🎉</p></div>' : pending.map(r => {
    const s = DB.getStudent(r.student_id);
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
                      <div style="flex-shrink:0;">${renderAvatar(s, 36, '0.75rem')}</div>
                      <div style="flex:1;min-width:0;">
                        <div style="font-size:0.875rem;font-weight:600;">${s ? s.full_name : 'Unknown'}</div>
                        <div style="font-size:0.75rem;color:#94a3b8;">${r.mistake} · -${r.marks_removed} marks</div>
                      </div>
                      <button class="btn btn-warning btn-sm" onclick="openReview('${r.id}')">Review</button>
                    </div>`;
  }).join('')}
        </div>

        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <h3 style="font-size:1rem;font-weight:700;">Students at Risk</h3>
            <button class="btn btn-outline btn-sm" onclick="navigate('students')">View All</button>
          </div>
          ${atRisk.length === 0 ? '<div class="empty-state" style="padding:32px 16px;"><p>All students doing great! ✅</p></div>' : atRisk.map(s => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
              ${renderAvatar(s, 32, '0.7rem')}
              <div style="flex:1;">
                <div style="font-size:0.875rem;font-weight:600;">${s.full_name}</div>
                <div style="font-size:0.75rem;color:#94a3b8;">${s.class}</div>
              </div>
              <span class="${getMarksBadge(s.discipline_marks)} badge">${s.discipline_marks}</span>
            </div>`).join('')}
        </div>
      </div>

      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <h3 style="font-size:1rem;font-weight:700;">Recent Activity</h3>
          <button class="btn btn-outline btn-sm" onclick="navigate('activity')">View All</button>
        </div>
        ${logs.map(l => `
          <div class="log-item">
            <div class="log-dot ${l.type || 'general'}"></div>
            <div class="log-text">${l.action}</div>
            <div class="log-time">${timeAgo(l.date)}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

function statCard(color, path, value, label, trend) {
  return `<div class="stat-card ${color}">
    <div class="stat-icon ${color}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="${path}"/></svg></div>
    <div><div class="stat-value">${value}</div><div class="stat-label">${label}</div>${trend ? `<div class="stat-trend">${trend}</div>` : ''}</div>
  </div>`;
}

// ── STUDENTS PAGE ──────────────────────────────────────────────────
let studentView = 'grid';
let studentFilter = '';
let studentClassFilter = '';

function renderClasses() {
  const classes = DB.getClasses(schoolId);
  const students = DB.getStudents(schoolId);
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
    <div class="fade-in">
      <div class="section-header">
        <div><h2>Class Management</h2><p>${classes.length} classes active</p></div>
        <button class="btn btn-primary" onclick="openClassModal()">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Add Class
        </button>
      </div>
      <div id="classesGrid" class="stats-grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));"></div>
    </div>`;

  const container = document.getElementById('classesGrid');
  container.innerHTML = classes.length ? classes.map(c => {
    const classStudents = students.filter(s => s.class === c.name);
    const boys = classStudents.filter(s => s.gender === 'Male').length;
    const girls = classStudents.filter(s => s.gender === 'Female').length;
    const avg = classStudents.length ? Math.round(classStudents.reduce((acc, s) => acc + s.discipline_marks, 0) / classStudents.length) : 100;
    const teacher = c.teacher_id ? DB.getTeacher(c.teacher_id) : null;

    return `<div class="card" style="cursor:pointer;transition:transform 0.2s;" onclick="viewClassDetails('${c.id}')" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
        <div>
          <h3 style="font-size:1.25rem;font-weight:800;color:white;">${c.name}</h3>
          <div style="font-size:0.8125rem;color:#64748b;margin-top:4px;">${teacher ? '👩‍🏫 ' + teacher.name : 'No Class Teacher'}</div>
        </div>
        <div class="badge ${getMarksBadge(avg)}">${avg}% Avg</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">
        <div style="text-align:center;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;">
          <div style="font-size:1.125rem;font-weight:700;color:white;">${classStudents.length}</div>
          <div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Total</div>
        </div>
        <div style="text-align:center;padding:8px;background:rgba(99,102,241,0.05);border-radius:8px;">
          <div style="font-size:1.125rem;font-weight:700;color:#818cf8;">${boys}</div>
          <div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Boys</div>
        </div>
        <div style="text-align:center;padding:8px;background:rgba(236,72,153,0.05);border-radius:8px;">
          <div style="font-size:1.125rem;font-weight:700;color:#f472b6;">${girls}</div>
          <div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Girls</div>
        </div>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${avg}%"></div></div>
    </div>`;
  }).join('') : `<div class="empty-state" style="grid-column: 1 / -1;"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z"/></svg><h3>No classes created</h3><p>Start by creating your first class to organize students.</p></div>`;
}

function openClassModal() {
  document.getElementById('clsName').value = '';
  const teachers = DB.getTeachers(schoolId).filter(t => t.status === 'approved');
  const tSel = document.getElementById('newClassTeacher');
  if (tSel) {
    tSel.innerHTML = '<option value="">Select a teacher...</option>' + 
      teachers.map(t => `<option value="${t._id || t.id}">${t.name}</option>`).join('');
  }
  openModal('addClassModal');
}

function saveClass() {
  const name = document.getElementById('clsName').value.trim();
  const tSel = document.getElementById('newClassTeacher');
  const teacherId = tSel && tSel.value ? tSel.value : null;
  if (!name) return;
  const newCls = DB.createClass({ school_id: schoolId, name, teacher_id: teacherId });

  DB.pushUndo(`Class "${name}" created`, () => {
    DB.deleteClass(newCls.id);
    navigate(currentPage);
  });

  showToast(`Class ${name} created!`, 'success');
  closeModal('addClassModal');
  if (currentPage === 'classes') renderClasses();
  else if (currentPage === 'students') renderStudents();
}

function renderStudents() {
  const students = DB.getStudents(schoolId);
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
    <div class="fade-in">
      <div class="section-header">
        <div><h2>Students</h2><p>${students.length} enrolled students</p></div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-outline" onclick="openClassModal()">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;margin-right:6px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            Add Class
          </button>
          <button class="btn btn-primary" onclick="openAddStudentModal()">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            Add Student
          </button>
        </div>
      </div>
      
      <div class="filter-bar">
        <div class="filter-search">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input type="text" id="studentSearch" placeholder="Search by name…" value="${studentFilter}" oninput="studentFilter=this.value;renderStudentListOnly()">
        </div>
        <select id="classFilter" onchange="studentClassFilter=this.value;renderStudentListOnly()">
          <option value="">All Classes</option>
          ${DB.getClasses(schoolId).map(c => `<option value="${c.name}" ${studentClassFilter === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>

      <div id="studentListRealContainer"></div>
    </div>`;

  renderStudentListOnly();
}

function renderStudentListOnly() {
  let students = DB.getStudents(schoolId);
  if (studentFilter) students = students.filter(s => s.full_name.toLowerCase().includes(studentFilter.toLowerCase()));
  if (studentClassFilter) students = students.filter(s => s.class === studentClassFilter);

  const container = document.getElementById('studentListRealContainer');
  if (!container) return;
  if (!students.length) {
    container.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg><h3>No students found</h3><p>Try a different filter or add a new student.</p></div>`;
    return;
  }
  container.innerHTML = `<div class="table-wrapper"><table>
    <thead><tr><th>Student</th><th>Gender</th><th>Class</th><th>Marks</th><th>Actions</th></tr></thead>
    <tbody>${students.map(s => `<tr>
      <td><div style="display:flex;align-items:center;gap:10px;cursor:pointer;" onclick="viewStudent('${s._id}')" title="Click to view profile">
        ${renderAvatar(s, 34, '0.8rem')}
        <span style="font-weight:600;">${s.full_name}</span></div></td>
      <td>${s.gender || '—'}</td>
      <td><span class="badge badge-info">${s.class}</span></td>
      <td><span class="badge ${getMarksBadge(s.discipline_marks)}">${s.discipline_marks}/100</span></td>
      <td><div style="display:flex;gap:6px;">
        <button class="btn btn-outline btn-sm" onclick="viewStudent('${s._id}')">QR</button>
        <button class="btn btn-outline btn-sm" onclick="editStudent('${s._id}')">Edit</button>
        <button class="btn btn-warning btn-sm" onclick="openDeductModal('${s._id}','${s.full_name.replace(/'/g,"&#39;")}')">-Marks</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('student','${s._id}','${s.full_name}')">Delete</button>
      </div></td></tr>`).join('')}
    </tbody></table></div>`;
}

let _currentViewClassId = null;
async function viewClassDetails(id) {
  _currentViewClassId = id;
  const classes = DB.getClasses(schoolId);
  const c = classes.find(cl => cl._id === id);
  const students = DB.getStudents(schoolId).filter(s => s.class === c.name);
  const teachers = DB.getTeachers(schoolId).filter(t => t.status === 'approved');

  document.getElementById('vClassName').textContent = c.name;

  // Stats
  const boys = students.filter(s => s.gender === 'Male').length;
  const girls = students.filter(s => s.gender === 'Female').length;
  const avg = students.length ? Math.round(students.reduce((acc, s) => acc + s.discipline_marks, 0) / students.length) : 100;

  document.getElementById('classStatsGrid').innerHTML = `
    <div class="stat-card purple"><div class="stat-value">${students.length}</div><div class="stat-label">Students</div></div>
    <div class="stat-card blue"><div class="stat-value">${boys}</div><div class="stat-label">Boys</div></div>
    <div class="stat-card pink"><div class="stat-value">${girls}</div><div class="stat-label">Girls</div></div>
    <div class="stat-card green"><div class="stat-value">${avg}%</div><div class="stat-label">Avg Marks</div></div>
  `;

  // Teacher Select
  const tSel = document.getElementById('assignTeacherSelect');
  tSel.innerHTML = '<option value="">Select a teacher...</option>' +
    teachers.map(t => `<option value="${t._id}" ${c.teacher_id === t._id ? 'selected' : ''}>${t.name}</option>`).join('');

  // Student List
  const list = document.getElementById('classNameStudentsList');
  list.innerHTML = students.map(s => `<tr style="cursor:pointer;" onclick="closeModal('viewClassModal');viewStudent('${s._id}')" title="Click to view profile">
    <td><div style="display:flex;align-items:center;gap:10px;">${renderAvatar(s, 28, '0.7rem')}${s.full_name}</div></td>
    <td>${s.gender || '—'}</td>
    <td><span class="badge ${getMarksBadge(s.discipline_marks)}">${s.discipline_marks}/100</span></td>
    <td>${s.discipline_marks < 50 ? '<span class="badge badge-danger">At Risk</span>' : '<span class="badge badge-success">Good</span>'}</td>
  </tr>`).join('');

  openModal('viewClassModal');
}

async function assignTeacherToClass() {
  const teacherId = document.getElementById('assignTeacherSelect').value;
  if (!_currentViewClassId) return;
  // Note: We need a way to update class. For now assume DB.updateClass exists or use generic patch if possible.
  // Actually db.js doesn't have updateClass. I should add it.
  await DB.updateClass(_currentViewClassId, { teacher_id: teacherId || null });
  showToast('Class teacher assigned!', 'success');
  renderClasses();
}

async function promptRenameClass() {
  if (!_currentViewClassId) return;
  const classes = DB.getClasses(schoolId);
  const c = classes.find(cl => cl._id === _currentViewClassId);
  if (!c) return;

  const newName = prompt("Enter new class name:", c.name);
  if (!newName || !newName.trim() || newName.trim() === c.name) return;

  const trimmed = newName.trim();
  // Assume server handles unique name or validation

  await DB.updateClass(_currentViewClassId, { name: trimmed });
  showToast("Class renamed successfully.", "success");
  closeModal('viewClassModal');
  renderClasses();
}

async function confirmDeleteClass() {
  if (!_currentViewClassId) return;
  const classes = DB.getClasses(schoolId);
  const c = classes.find(cl => cl._id === _currentViewClassId);
  if (!c) return;

  const school = await DB.getSchool(schoolId);
  const pwd = prompt("Enter your password to confirm deletion:");
  if (pwd !== school.password) {
    showToast("Incorrect password. Deletion cancelled.", "error");
    return;
  }

  const students = DB.getStudents(schoolId).filter(s => s.class === c.name);
  if (!confirm(`Are you sure you want to delete class ${c.name}?`)) return;

  await DB.deleteClass(_currentViewClassId);
  showToast("Class deleted.", "info");
  closeModal('viewClassModal');
  renderClasses();
}

function applyBulkMarks() {
  const val = parseInt(document.getElementById('bulkMarkAdj').value);
  if (isNaN(val)) return;
  const c = DB.getClass(_currentViewClassId);
  const students = DB.getStudents(schoolId).filter(s => s.class === c.name);

  if (!confirm(`Apply ${val} marks to all ${students.length} students in ${c.name}?`)) return;

  students.forEach(s => {
    let newMarks = s.discipline_marks + val;
    if (newMarks > 100) newMarks = 100;
    if (newMarks < 0) newMarks = 0;
    DB.updateStudent(s.id, { discipline_marks: newMarks });
  });

  showToast('Bulk marks applied!', 'success');
  viewClassDetails(_currentViewClassId);
  renderClasses();
}

function studentGridCard(s) {
  const cls = getMarksClass(s.discipline_marks);
  const grads = ['linear-gradient(135deg,#6366f1,#8b5cf6)', 'linear-gradient(135deg,#10b981,#059669)', 'linear-gradient(135deg,#f59e0b,#d97706)', 'linear-gradient(135deg,#3b82f6,#2563eb)', 'linear-gradient(135deg,#ec4899,#db2777)'];
  const grad = grads[s.full_name.charCodeAt(0) % grads.length];
  return `<div class="student-card ${cls}">
    <div class="student-card-header">
      ${renderAvatar(s, 48, '1rem')}
      <div class="student-card-info">
        <h4>${s.full_name}</h4>
        <span>Class ${s.class}</span>
      </div>
    </div>
    <div class="student-card-marks">
      <div>
        <div class="marks-big ${cls}">${s.discipline_marks}</div>
        <div style="font-size:0.7rem;color:#64748b;">/ 100 marks</div>
      </div>
      <span class="badge ${getMarksBadge(s.discipline_marks)}">${cls.toUpperCase()}</span>
    </div>
    <div class="progress-bar"><div class="progress-fill ${s.discipline_marks < 40 ? 'high' : s.discipline_marks < 60 ? 'medium' : s.discipline_marks < 80 ? '' : 'low'}" style="width:${s.discipline_marks}%"></div></div>
    <div class="student-card-actions">
      <button class="btn btn-outline btn-sm" style="flex:1" onclick="viewStudent('${s.id}')">
        <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;"><path d="M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm18-4H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H10V8h4V4h2v4h4v2z"/></svg>
        QR Code
      </button>
      <button class="btn btn-outline btn-sm" onclick="editStudent('${s.id}')">Edit</button>
      <button class="btn btn-danger btn-sm" onclick="confirmDelete('student','${s.id}','${s.full_name}')">
        <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
      </button>
    </div>
  </div>`;
}

function avatarGrad(name) {
  const g = ['linear-gradient(135deg,#6366f1,#8b5cf6)', 'linear-gradient(135deg,#10b981,#059669)', 'linear-gradient(135deg,#f59e0b,#d97706)', 'linear-gradient(135deg,#3b82f6,#2563eb)', 'linear-gradient(135deg,#ec4899,#db2777)'];
  return g[name.charCodeAt(0) % g.length];
}

function openAddStudentModal() {
  window._pendingStudentPhoto = null;
  const classes = DB.getClasses(schoolId);
  const sel = document.getElementById('sClass');
  sel.innerHTML = '<option value="">Select Class...</option>' +
    classes.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

  ['sFullName', 'sParentName', 'sParentPhone'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('sMarks').value = 100;
  document.getElementById('sProfilePreview').innerHTML = 'ST';
  openModal('addStudentModal');
}

async function saveStudent() {
  const name = document.getElementById('sFullName').value.trim();
  const cls = document.getElementById('sClass').value;
  const gender = document.getElementById('sGender').value;
  const marks = parseInt(document.getElementById('sMarks').value);
  const pName = document.getElementById('sParentName').value.trim();
  const pPhone = document.getElementById('sParentPhone').value.trim();

  if (!name || !cls || !pName || !pPhone) { showToast('Please fill all required fields.', 'warning'); return; }

  const data = {
    school_id: schoolId,
    full_name: name,
    class: cls,
    gender,
    discipline_marks: isNaN(marks) ? 100 : marks,
    parent_name: pName,
    parent_phone: pPhone,
    profile_image: window._pendingStudentPhoto || null
  };

  try {
    const newStudent = await DB.createStudent(data);
    window._pendingStudentPhoto = null;
    DB.pushUndo(`Student "${name}" added`, async () => {
      await DB.deleteStudent(newStudent._id || newStudent.id);
      renderStudents();
    });
    DB.addLog(schoolId, `Student "${name}" added to ${cls}`, session.username, 'student').catch(() => {});
    showToast('Student added successfully!', 'success');
    closeModal('addStudentModal');
    renderStudents();
  } catch (err) {
    showToast('Failed to save student: ' + err.message, 'error');
  }
}

function editStudent(id) {
  const s = DB.getStudent(id);
  const classes = DB.getClasses(schoolId);
  const sel = document.getElementById('editSClass');
  sel.innerHTML = '<option value="">Select Class...</option>' +
    classes.map(c => `<option value="${c.name}" ${s.class === c.name ? 'selected' : ''}>${c.name}</option>`).join('');

  document.getElementById('editStudentId').value = s._id;
  document.getElementById('editSFullName').value = s.full_name;
  document.getElementById('editSGender').value = s.gender || 'Male';
  document.getElementById('editSMarks').value = s.discipline_marks;
  document.getElementById('editSParentName').value = s.parent_name;
  document.getElementById('editSParentPhone').value = s.parent_phone;
  document.getElementById('editSProfilePreview').innerHTML = s.profile_image ? `<img src="${s.profile_image}" style="width:100%;height:100%;object-fit:cover;">` : getInitials(s.full_name);
  openModal('editStudentModal');
}

async function updateStudent() {
  const id = document.getElementById('editStudentId').value;
  const name = document.getElementById('editSFullName').value.trim();
  const cls = document.getElementById('editSClass').value;
  const gender = document.getElementById('editSGender').value;
  const marks = parseInt(document.getElementById('editSMarks').value);
  const pName = document.getElementById('editSParentName').value.trim();
  const pPhone = document.getElementById('editSParentPhone').value.trim();

  if (!name || !cls) { showToast('Name and class are required.', 'warning'); return; }

  const updates = {
    full_name: name,
    class: cls,
    gender,
    discipline_marks: isNaN(marks) ? 100 : marks,
    parent_name: pName,
    parent_phone: pPhone
  };
  if (window._pendingStudentPhoto) {
    updates.profile_image = window._pendingStudentPhoto;
    window._pendingStudentPhoto = null;
  }

  try {
    await DB.updateStudent(id, updates);
    DB.addLog(schoolId, `Student "${name}" updated`, session.username, 'student').catch(() => {});
    showToast('Student updated!', 'success');
    closeModal('editStudentModal');
    renderStudents();
  } catch (err) {
    showToast('Failed to update student: ' + err.message, 'error');
  }
}

function viewStudent(id) {
  const s = DB.getStudent(id);
  if (!s) return;
  const cls = getMarksClass(s.discipline_marks);
  const marksColor = cls === 'excellent' ? '#10b981' : cls === 'good' ? '#84cc16' : cls === 'warning' ? '#f59e0b' : '#ef4444';
  const body = document.getElementById('viewStudentBody');
  const photoHtml = s.profile_image
    ? `<img src="${s.profile_image}" onclick="showImageZoom('${s.profile_image}')" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;" title="Click to zoom">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;font-weight:800;background:${avatarGrad(s.full_name)};color:white;">${getInitials(s.full_name)}</div>`;

  body.innerHTML = `
    <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start;">

      <!-- Left: Photo + marks -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px;min-width:160px;">
        <div style="width:140px;height:140px;border-radius:16px;overflow:hidden;border:3px solid ${marksColor};box-shadow:0 0 20px ${marksColor}44;flex-shrink:0;">
          ${photoHtml}
        </div>
        <div style="text-align:center;">
          <div style="font-size:2.8rem;font-weight:900;color:${marksColor};line-height:1;">${s.discipline_marks}</div>
          <div style="font-size:0.75rem;color:#64748b;margin-top:2px;">/ 100 marks</div>
          <span class="badge ${getMarksBadge(s.discipline_marks)}" style="margin-top:6px;display:inline-block;">${cls.toUpperCase()}</span>
        </div>
        <div class="progress-bar" style="width:140px;"><div class="progress-fill ${s.discipline_marks < 40 ? 'high' : s.discipline_marks < 60 ? 'medium' : ''}" style="width:${s.discipline_marks}%"></div></div>
      </div>

      <!-- Right: Info -->
      <div style="flex:1;min-width:200px;">
        <h3 style="font-size:1.4rem;font-weight:800;margin-bottom:4px;">${s.full_name}</h3>
        <span class="badge badge-info" style="margin-bottom:16px;display:inline-block;">Class ${s.class}</span>

        <div style="display:flex;flex-direction:column;gap:10px;font-size:0.875rem;">
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.04);border-radius:10px;">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;color:#818cf8;flex-shrink:0;"><path d="M12 12c2.7 0 4-1.3 4-4s-1.3-4-4-4-4 1.3-4 4 1.3 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z"/></svg>
            <div><div style="font-size:0.7rem;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Gender</div><strong>${s.gender || '—'}</strong></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.04);border-radius:10px;">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;color:#10b981;flex-shrink:0;"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            <div><div style="font-size:0.7rem;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Parent Name</div><strong>${s.parent_name || '—'}</strong></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.04);border-radius:10px;">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;color:#f59e0b;flex-shrink:0;"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            <div><div style="font-size:0.7rem;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Parent Phone</div><strong>${s.parent_phone || '—'}</strong></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.04);border-radius:10px;">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;color:#6366f1;flex-shrink:0;"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
            <div><div style="font-size:0.7rem;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Enrolled</div><strong>${formatDate(s.created_at)}</strong></div>
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">
          <button class="btn btn-warning btn-sm" onclick="closeModal('viewStudentModal');openDeductModal('${s._id}','${s.full_name.replace(/'/g, "&#39;")}')">
            − Deduct Marks
          </button>
          <button class="btn btn-outline btn-sm" onclick="closeModal('viewStudentModal');editStudent('${s._id}')">
            ✏ Edit
          </button>
        </div>
      </div>

      <!-- QR Code -->
      <div class="qr-container" id="studentQRCode" style="flex-shrink:0;">
        <div style="color:#64748b;font-size:0.875rem;">Generating QR…</div>
      </div>
    </div>`;

  openModal('viewStudentModal');
  const qrData = JSON.stringify({ id: s._id, name: s.full_name, class: s.class, school: schoolId });
  generateQRCode(document.getElementById('studentQRCode'), qrData, 160);
  const label = document.createElement('div');
  label.className = 'qr-label';
  label.textContent = s.full_name + ' · ' + s.class;
  document.getElementById('studentQRCode').appendChild(label);
}

let _printStudentId = null;
function printQR() {
  const body = document.getElementById('viewStudentBody');
  const qr = body.querySelector('#studentQRCode img');
  if (!qr) { showToast('QR not loaded yet.', 'warning'); return; }
  const w = window.open('', '_blank');
  w.document.write(`<html><body style="text-align:center;font-family:Inter,sans-serif;padding:40px;background:white;"><h2>DMS Student QR Code</h2><img src="${qr.src}" width="200" height="200"><p style="margin-top:12px;font-size:14px;">${qr.parentElement.textContent}</p></body></html>`);
  w.document.close();
  w.print();
}

// ── TEACHERS PAGE ──────────────────────────────────────────────────
let teacherTabActive = 'all';

function renderTeachers() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div class="fade-in">
    <div class="section-header">
      <div><h2>Staff & Teachers</h2><p>Manage staff and teacher accounts and approvals</p></div>
    </div>
    <div class="page-tabs">
      <button class="page-tab-btn ${teacherTabActive === 'all' ? 'active' : ''}" onclick="switchTeacherTab('all')">All</button>
      <button class="page-tab-btn ${teacherTabActive === 'pending' ? 'active' : ''}" onclick="switchTeacherTab('pending')">Pending Approval</button>
    </div>
    <div id="teacherTabContent"></div>
  </div>`;
  renderTeacherTab();
}

function switchTeacherTab(tab) {
  teacherTabActive = tab;
  document.querySelectorAll('.page-tab-btn').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase().includes(tab === 'all' ? 'all' : 'pending')));
  renderTeacherTab();
}

function renderTeacherTab() {
  let teachers = DB.getTeachers(schoolId).map(t => ({ ...t, type: 'teacher' }));
  let staff = DB.getStaffMembers(schoolId).map(s => ({ ...s, type: 'staff' }));
  let users = [...teachers, ...staff];

  if (teacherTabActive === 'pending') users = users.filter(u => u.status === 'pending');

  const container = document.getElementById('teacherTabContent');
  if (!users.length) {
    container.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg><h3>No ${teacherTabActive === 'pending' ? 'pending' : ''} users</h3><p>${teacherTabActive === 'pending' ? 'All registrations are reviewed.' : 'No staff/teachers registered yet.'}</p></div>`;
    return;
  }

  container.innerHTML = `<div class="table-wrapper"><table>
    <thead><tr><th>Name</th><th>Role/Subject</th><th>Phone</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
    <tbody>${users.map(u => `<tr>
      <td><div style="display:flex;align-items:center;gap:10px;">
        ${renderAvatar(u, 36, '0.8rem')}
        <div>
          <div style="font-weight:600;">${u.name} <span class="badge ${u.type === 'teacher' ? 'badge-info' : 'badge-warning'}" style="font-size:0.6rem;padding:2px 4px;margin-left:4px;">${u.type.toUpperCase()}</span></div>
          <div style="font-size:0.75rem;color:#64748b;">@${u.username}</div>
        </div></div></td>
      <td>${u.subject || u.position || '—'}</td>
      <td>${u.phone || '—'}</td>
      <td>${getStatusBadge(u.status)}</td>
      <td>${formatDate(u.created_at)}</td>
      <td><div style="display:flex;gap:6px;">
        ${u.status === 'pending' ? `<button class="btn btn-success btn-sm" onclick="approveUser('${u.type}', '${u._id}')">Approve</button><button class="btn btn-danger btn-sm" onclick="rejectUser('${u.type}', '${u._id}')">Reject</button>` : ''}
        ${u.status !== 'pending' ? `<button class="btn btn-danger btn-sm" onclick="confirmDelete('${u.type}','${u._id}','${u.name}')">Remove</button>` : ''}
      </div></td></tr>`).join('')}
    </tbody></table></div>`;
}

async function approveUser(type, id) {
  if (type === 'teacher') {
    const t = DB.getTeacher(id);
    await DB.updateTeacher(id, { status: 'approved' });
    await DB.addLog(schoolId, `Teacher "${t.name}" approved`, session.username, 'teacher');
    showToast(`${t.name} approved!`, 'success');
  } else {
    const s = DB.getStaff(id);
    await DB.updateStaff(id, { status: 'approved' });
    await DB.addLog(schoolId, `Staff "${s.name}" approved`, session.username, 'general');
    showToast(`${s.name} approved!`, 'success');
  }
  updateBadges();
  renderTeachers();
}

async function rejectUser(type, id) {
  if (type === 'teacher') {
    const t = DB.getTeacher(id);
    await DB.updateTeacher(id, { status: 'rejected' });
    await DB.addLog(schoolId, `Teacher "${t.name}" rejected`, session.username, 'teacher');
  } else {
    const s = DB.getStaff(id);
    await DB.updateStaff(id, { status: 'rejected' });
    await DB.addLog(schoolId, `Staff "${s.name}" rejected`, session.username, 'general');
  }
  showToast('User rejected.', 'warning');
  updateBadges();
  renderTeachers();
}

// ── REQUESTS PAGE ──────────────────────────────────────────────────
let requestFilter = 'pending';

function renderRequests() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div class="fade-in">
    <div class="section-header"><div><h2>Discipline Requests</h2></div></div>
    <div class="page-tabs">
      ${['pending', 'approved', 'rejected', 'all'].map(f => `<button class="page-tab-btn ${requestFilter === f ? 'active' : ''}" onclick="switchReqFilter('${f}')">${f.charAt(0).toUpperCase() + f.slice(1)}</button>`).join('')}
    </div>
    <div id="requestsContent"></div>
  </div>`;
  renderRequestList();
}

function switchReqFilter(f) {
  requestFilter = f;
  document.querySelectorAll('.page-tab-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.toLowerCase() === f);
  });
  renderRequestList();
}

function renderRequestList() {
  let reqs = DB.getRequests(schoolId);
  if (requestFilter !== 'all') reqs = reqs.filter(r => r.status === requestFilter);
  reqs = reqs.sort((a, b) => new Date(b.date) - new Date(a.date));
  const c = document.getElementById('requestsContent');
  if (!reqs.length) {
    c.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/></svg><h3>No ${requestFilter} requests</h3></div>`;
    return;
  }
  c.innerHTML = `<div style="display:flex;flex-direction:column;gap:12px;">${reqs.map(r => {
    const s = DB.getStudent(r.student_id);
    const t = r.teacher_id ? DB.getTeacher(r.teacher_id) : (r.staff_id ? DB.getStaff(r.staff_id) : null);
    const rLabel = r.staff_id ? '👤 Staff' : '👩‍🏫 teacher';
    return `<div class="request-card ${r.status}">
      <div class="request-card-header">
        <div>
          <div class="request-mistake">${r.mistake}</div>
          <div class="request-meta">
            <span>👤 ${r.target_type === 'class' ? `Entire Class: ${r.class_name}` : (s ? s.full_name + ' (' + s.class + ')' : 'Unknown Student')}</span>
            <span>·</span><span>${rLabel}: ${t ? t.name : 'Unknown'}</span>
            <span>·</span><span>📅 ${formatDate(r.date)}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:flex-start;">
          <span class="badge badge-danger">-${r.marks_removed} marks</span>
          ${getStatusBadge(r.status)}
        </div>
      </div>
      ${r.notes ? `<div class="request-notes">${r.notes}</div>` : ''}
      ${r.status === 'pending' ? `<div class="request-actions">
        <button class="btn btn-success btn-sm" onclick="approveRequest('${r._id || r.id}')">✓ Approve</button>
        <button class="btn btn-danger btn-sm" onclick="rejectRequest('${r._id || r.id}')">✕ Reject</button>
        <button class="btn btn-outline btn-sm" onclick="openReview('${r._id || r.id}')">Details</button>
      </div>` : `<div style="font-size:0.75rem;color:#64748b;margin-top:6px;">Reviewed on ${formatDate(r.reviewed_at || r.date)}</div>`}
    </div>`;
  }).join('')}</div>`;
}

function openReview(id) {
  const r = DB.getRequest(id);
  const s = DB.getStudent(r.student_id);
  const t = r.teacher_id ? DB.getTeacher(r.teacher_id) : (r.staff_id ? DB.getStaff(r.staff_id) : null);
  const body = document.getElementById('reviewRequestBody');
  body.innerHTML = `
    <div style="background:rgba(0,0,0,0.2);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:8px;font-size:0.875rem;">
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Target</span><strong>${r.target_type === 'class' ? `Class ${r.class_name}` : (s ? s.full_name + ' (' + s.class + ')' : 'Unknown')}</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Reporter (${r.staff_id ? 'Staff' : 'Teacher'})</span><strong>${t ? t.name : 'Unknown'}</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Misconduct</span><strong>${r.mistake}</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Marks to Deduct</span><strong style="color:#f87171;">-${r.marks_removed}</strong></div>
      ${r.target_type !== 'class' && s ? `<div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Current Marks</span><strong>${s.discipline_marks}/100</strong></div>` : ''}
      ${r.target_type !== 'class' && s ? `<div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">After Approval</span><strong style="color:#f59e0b;">${Math.max(0, s.discipline_marks - r.marks_removed)}/100</strong></div>` : ''}
      <div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Date</span><strong>${formatDate(r.date)}</strong></div>
    </div>
    ${r.notes ? `<div class="form-group"><label>Notes</label><div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:10px;font-size:0.875rem;">${r.notes}</div></div>` : ''}`;
  const footer = document.getElementById('reviewRequestFooter');
  if (r.status === 'pending') {
    footer.innerHTML = `<button class="btn btn-outline" onclick="closeModal('reviewRequestModal')">Cancel</button>
      <button class="btn btn-danger" onclick="rejectRequest('${r._id || r.id}');closeModal('reviewRequestModal')">✕ Reject</button>
      <button class="btn btn-success" onclick="approveRequest('${r._id || r.id}');closeModal('reviewRequestModal')">✓ Approve</button>`;
  } else {
    footer.innerHTML = `<button class="btn btn-outline" onclick="closeModal('reviewRequestModal')">Close</button>`;
  }
  openModal('reviewRequestModal');
}

async function approveRequest(id) {
  try {
    const r = DB.getRequest(id);
    if (!r) { showToast('Request not found (id: ' + id + ')', 'error'); return; }
    
    if (r.target_type === 'class') {
      const students = DB.getStudents(schoolId).filter(s => s.class === r.class_name);
      await DB.updateRequest(id, { status: 'approved' });
      await DB.addLog(schoolId, `CLASS Request APPROVED: "${r.mistake}" for class ${r.class_name} — -${r.marks_removed} marks each`, session.username, 'approval');
      showToast(`Approved for class ${r.class_name}. ${students.length} students updated.`, 'success');
    } else {
      const s = DB.getStudent(r.student_id);
      if (!s) { showToast('Student not found for this request (student id: ' + r.student_id + ')', 'error'); return; }
      await DB.updateRequest(id, { status: 'approved' });
      await DB.addLog(schoolId, `Request APPROVED: "${r.mistake}" for ${s.full_name} — -${r.marks_removed} marks`, session.username, 'approval');
      showToast('Request approved & parent notified!', 'success');
    }
    updateBadges();
    if (currentPage === 'requests') renderRequests();
    else if (currentPage === 'dashboard') renderDashboard();
  } catch (err) {
    console.error(err);
    showToast('Failed to approve: ' + err.message, 'error');
  }
}

async function rejectRequest(id) {
  try {
    const r = DB.getRequest(id);
    if (!r) { showToast('Request not found', 'error'); return; }
    const s = DB.getStudent(r.student_id);
    await DB.updateRequest(id, { status: 'rejected' });
    await DB.addLog(schoolId, `Request REJECTED: "${r.mistake}" for ${s ? s.full_name : 'Unknown'}`, session.username, 'approval');
    showToast('Request rejected.', 'warning');
    updateBadges();
    if (currentPage === 'requests') renderRequests();
    else if (currentPage === 'dashboard') renderDashboard();
  } catch (err) {
    console.error(err);
    showToast('Failed to reject: ' + err.message, 'error');
  }
}

// ── ANALYTICS PAGE ─────────────────────────────────────────────────
function renderAnalytics() {
  const students = DB.getStudents(schoolId);
  const requests = DB.getRequests(schoolId);
  const stats = DB.getStats(schoolId);
  const excellent = students.filter(s => s.discipline_marks >= 80).length;
  const good = students.filter(s => s.discipline_marks >= 60 && s.discipline_marks < 80).length;
  const warning = students.filter(s => s.discipline_marks >= 40 && s.discipline_marks < 60).length;
  const critical = students.filter(s => s.discipline_marks < 40).length;
  const total = students.length || 1;
  const classCounts = {};
  students.forEach(s => { if (!classCounts[s.class]) classCounts[s.class] = { total: 0, marks: 0 }; classCounts[s.class].total++; classCounts[s.class].marks += s.discipline_marks; });
  const classes = Object.entries(classCounts).map(([c, d]) => ({ class: c, avg: Math.round(d.marks / d.total) })).sort((a, b) => a.class.localeCompare(b.class));
  const mistakeCounts = {};
  requests.forEach(r => { mistakeCounts[r.mistake] = (mistakeCounts[r.mistake] || 0) + 1; });
  const topMistakes = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div class="fade-in">
    <div class="section-header"><div><h2>Analytics</h2><p>Discipline performance overview</p></div></div>
    <div class="stats-grid" style="margin-bottom:20px;">
      ${statCard('purple', 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z', stats.avgMarks + '%', 'Avg School Marks', '')}
      ${statCard('green', 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z', stats.approvedRequests, 'Approved Requests', '')}
      ${statCard('red', 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z', stats.studentsAtRisk, 'At Risk Students', '')}
      ${statCard('orange', 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z', stats.thisMonthRequests, 'This Month Requests', '')}
    </div>
    <div class="analytics-grid">
      <div class="card">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:16px;">Mark Distribution</h3>
        <div class="donut-chart-wrapper">
          <svg width="120" height="120" viewBox="0 0 120 120">${donutSegments([excellent, good, warning, critical], total, ['#10b981', '#84cc16', '#f59e0b', '#ef4444'])}</svg>
          <div class="donut-legend">
            ${[['Excellent (80-100)', excellent, '#10b981'], ['Good (60-79)', good, '#84cc16'], ['Warning (40-59)', warning, '#f59e0b'], ['Critical (<40)', critical, '#ef4444']].map(([l, v, c]) => `
            <div class="donut-legend-item"><div class="donut-legend-dot" style="background:${c}"></div><span>${l}</span><strong style="margin-left:auto;padding-left:12px;">${v}</strong></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="card">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:16px;">Average Marks by Class</h3>
        ${classes.length ? `<div class="mini-chart">${classes.map(c => `<div class="mini-bar" style="background:linear-gradient(180deg,#6366f1,#8b5cf6);height:${c.avg}%;"><div class="bar-tip">${c.avg}%</div></div>`).join('')}</div>
        <div class="chart-labels">${classes.map(c => `<span>${c.class}</span>`).join('')}</div>` : '<div class="empty-state" style="padding:20px;"><p>No class data</p></div>'}
      </div>
      <div class="card">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:16px;">Top Misconduct Types</h3>
        ${topMistakes.length ? topMistakes.map(([m, c]) => `
          <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;font-size:0.8125rem;margin-bottom:4px;"><span>${m}</span><strong>${c} cases</strong></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(c / requests.length * 100)}%;background:linear-gradient(90deg,#f59e0b,#d97706)"></div></div>
          </div>`).join('') : '<div class="empty-state" style="padding:20px;"><p>No requests yet</p></div>'}
      </div>
      <div class="card">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:16px;">Request Status Summary</h3>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${[['Approved', stats.approvedRequests, '#10b981'], ['Pending', stats.pendingRequests, '#f59e0b'], ['Rejected', stats.rejectedRequests, '#ef4444']].map(([l, v, c]) => `
          <div>
            <div style="display:flex;justify-content:space-between;font-size:0.8125rem;margin-bottom:4px;"><span>${l}</span><strong>${v}</strong></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${stats.totalRequests ? Math.round(v / stats.totalRequests * 100) : 0}%;background:${c}"></div></div>
          </div>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

function donutSegments(vals, total, colors) {
  const cx = 60, cy = 60, r = 45, stroke = 18;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return vals.map((v, i) => {
    const pct = v / total;
    const dash = pct * circ;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[i]}" stroke-width="${stroke}" stroke-dasharray="${dash} ${circ - dash}" stroke-dashoffset="${-offset * circ}" transform="rotate(-90 ${cx} ${cy})" opacity="0.85"/>`;
    offset += pct;
    return seg;
  }).join('');
}

// ── ACTIVITY PAGE ──────────────────────────────────────────────────
function renderActivity() {
  const logs = DB.getLogs(schoolId, 100);
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div class="fade-in">
    <div class="section-header"><div><h2>Activity Logs</h2><p>Full audit trail for your school</p></div></div>
    <div class="card">
      ${logs.length ? logs.map(l => `<div class="log-item">
        <div class="log-dot ${l.type || 'general'}"></div>
        <div class="log-text"><strong>${l.action}</strong><div style="font-size:0.75rem;color:#64748b;margin-top:2px;">by ${l.performed_by}</div></div>
        <div class="log-time">${formatDateTime(l.date)}</div>
      </div>`).join('') : '<div class="empty-state" style="padding:32px;"><p>No activity yet.</p></div>'}
    </div>
  </div>`;
}

// ── SETTINGS PAGE ──────────────────────────────────────────────────
function renderSettings() {
  const school = DB.getSchool(schoolId);
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div class="fade-in" style="max-width:680px;">
    <div class="section-header"><div><h2>Settings</h2></div></div>
    <div class="card settings-section">
      <h3>DoD Officer & School</h3>
      <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--border);">
        <div class="avatar-btn" id="dodProfilePreview" style="width:100px;height:100px;font-size:2rem;margin-bottom:12px;overflow:hidden;">
            ${school.dod_profile_image ? `<img src="${school.dod_profile_image}" style="width:100%;height:100%;object-fit:cover;">` : getInitials(session.username)}
        </div>
        <input type="file" id="dodProfileUpload" accept="image/*" style="display:none;" onchange="handleDodPhotoUpload(this)">
        <button class="btn btn-outline" onclick="document.getElementById('dodProfileUpload').click()">Change Profile Picture</button>
      </div>
      <div class="form-group"><label>School Name</label><input type="text" id="setSchoolName" value="Kageyo TSS" disabled style="opacity:0.5;cursor:not-allowed;"></div>
      <div class="form-group" style="margin-top:12px;"><label>DoD Username</label><input type="text" id="setDodUser" value="${school.dod_username}"></div>
      <div style="margin-top:16px;"><button class="btn btn-primary" onclick="saveSchoolSettings()">Save Changes</button></div>
    </div>
    <div class="card settings-section">
      <h3>Teacher Registration Code</h3>
      <p style="font-size:0.875rem;color:#64748b;margin-bottom:12px;">Share this code with teachers to allow them to register.</p>
      <div style="display:flex;align-items:center;gap:12px;">
        <input type="text" id="setPromoCode" value="${school.promo_code || 'TEACHER2026'}" style="font-size:1rem;font-weight:700;letter-spacing:0.1em;max-width:240px;">
        <button class="btn btn-outline" onclick="copyPromoCode()">Copy</button>
        <button class="btn btn-primary" onclick="savePromoCode()">Update</button>
      </div>
    </div>
    <div class="card settings-section">
      <h3>Change Password</h3>
      <div class="form-group"><label>New Password</label><input type="password" id="newPwd" placeholder="Enter new password"></div>
      <div class="form-group" style="margin-top:12px;"><label>Confirm Password</label><input type="password" id="confirmPwd" placeholder="Confirm new password"></div>
      <div style="margin-top:16px;"><button class="btn btn-primary" onclick="changePassword()">Update Password</button></div>
    </div>
    <div class="card settings-section" id="waSection">
      <h3>📱 WhatsApp Notifications</h3>
      <p style="font-size:0.875rem;color:#64748b;margin-bottom:16px;">Link your WhatsApp using your phone number. Enter your number, get a pairing code, then enter it in WhatsApp → Linked Devices.</p>
      <div id="waStatus" style="margin-bottom:16px;"><span style="color:#64748b;">Checking…</span></div>

      <div id="waPairSection">
        <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
          <input id="waPhoneInput" type="tel" placeholder="e.g. +250781234567" style="max-width:220px;">
          <button class="btn btn-primary" onclick="waRequestCode()">Get Pairing Code</button>
        </div>
        <div id="waPairingCode" style="display:none;margin-bottom:12px;">
          <p style="font-size:0.875rem;color:#94a3b8;margin-bottom:6px;">Enter this code in WhatsApp → Linked Devices → Link with phone number:</p>
          <div id="waCodeDisplay" style="font-size:2rem;font-weight:900;letter-spacing:0.2em;color:#6366f1;background:rgba(99,102,241,0.1);padding:16px 24px;border-radius:12px;display:inline-block;"></div>
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;">
        <button class="btn btn-danger" id="waDisconnectBtn" onclick="waDisconnect()" style="display:none;">Disconnect</button>
        <button class="btn btn-outline" onclick="waSendTest()">Send Test Message</button>
      </div>
    </div>
    <div class="card settings-section">
      <h3 style="color:#f87171;">Danger Zone</h3>
      <div class="settings-row">
        <div class="settings-row-label"><h4>Reset All Data</h4><p>Restore all demo data. This cannot be undone.</p></div>
        <button class="btn btn-danger" onclick="resetData()">Reset</button>
      </div>
    </div>
  </div>`;
}

function handleDodPhotoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    document.getElementById('dodProfilePreview').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
    window._pendingDodPhoto = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function saveSchoolSettings() {
  const name = document.getElementById('setSchoolName').value.trim();
  const user = document.getElementById('setDodUser').value.trim();
  if (!name || !user) { showToast('All fields required.', 'warning'); return; }
  const updates = { school_name: name, dod_username: user };
  if (window._pendingDodPhoto) updates.dod_profile_image = window._pendingDodPhoto;

  await DB.updateSchool(schoolId, updates);
  await DB.addLog(schoolId, 'School settings updated', session.username, 'general');
  showToast('Settings saved!', 'success');
  setTimeout(() => location.reload(), 500);
}

async function savePromoCode() {
  const code = document.getElementById('setPromoCode').value.trim();
  if (!code) { showToast('Promo code cannot be empty.', 'warning'); return; }
  await DB.updateSchool(schoolId, { promo_code: code });
  showToast('Promo code updated!', 'success');
}

function copyPromoCode() {
  const code = document.getElementById('setPromoCode').value;
  navigator.clipboard.writeText(code).then(() => showToast('Copied: ' + code, 'info'));
}

async function changePassword() {
  const p1 = document.getElementById('newPwd').value;
  const p2 = document.getElementById('confirmPwd').value;
  if (p1.length < 6) { showToast('Password must be at least 6 characters.', 'warning'); return; }
  if (p1 !== p2) { showToast('Passwords do not match.', 'warning'); return; }
  await DB.updateSchool(schoolId, { password: p1 });
  showToast('Password changed!', 'success');
  document.getElementById('newPwd').value = '';
  document.getElementById('confirmPwd').value = '';
}

function resetData() {
  if (!confirm('Reset ALL data to defaults? This cannot be undone.')) return;
  DB.reset();
  showToast('Data reset to defaults.', 'info');
  navigate('dashboard');
}

// ── GLOBAL SEARCH ──────────────────────────────────────────────────
function handleGlobalSearch(q) {
  if (!q.trim()) return;
  navigate('students');
  studentFilter = q;
  setTimeout(() => {
    const si = document.getElementById('studentSearch');
    if (si) si.value = q;
    renderStudentList();
  }, 200);
}

// ── DELETE CONFIRM ─────────────────────────────────────────────────
async function confirmDelete(type, id, name) {
  const pwdInput = document.getElementById('confirmDeletePwd');
  if (pwdInput) pwdInput.value = '';
  const btn = document.getElementById('confirmDeleteBtn');
  btn.onclick = async () => {
    const school = await DB.getSchool(schoolId);
    const pwd = pwdInput ? pwdInput.value : prompt("Enter your password to confirm deletion:");
    if (!pwd || pwd !== school.password) {
      showToast("Incorrect password. Deletion cancelled.", "error");
      return;
    }

    if (type === 'student') {
      const student = DB.getStudent(id);
      await DB.deleteStudent(id);
      DB.pushUndo(`Student "${name}" deleted`, async () => {
        await DB.createStudent(student);
        renderStudents();
      });
      await DB.addLog(schoolId, `Student "${name}" deleted`, session.username, 'student');
      renderStudents();
    }
    else if (type === 'teacher') {
      const teacher = DB.getTeacher(id);
      await DB.deleteTeacher(id);
      DB.pushUndo(`Teacher "${name}" removed`, async () => {
        await DB.createTeacher(teacher);
        renderTeachers();
      });
      await DB.addLog(schoolId, `Teacher "${name}" removed`, session.username, 'teacher');
      renderTeachers();
    }
    else if (type === 'staff') {
      const staff = DB.getStaff(id);
      await DB.deleteStaff(id);
      DB.pushUndo(`Staff "${name}" removed`, async () => {
        await DB.createStaff(staff);
        renderTeachers();
      });
      await DB.addLog(schoolId, `Staff "${name}" removed`, session.username, 'general');
      renderTeachers();
    }
    closeModal('confirmDeleteModal');
  };
  openModal('confirmDeleteModal');
}

// ── START ──────────────────────────────────────────────────────────
// initDashboard() called at top of file

// ── DOD DIRECT MARK DEDUCTION ──────────────────────────────────────
function openDeductModal(studentId, studentName) {
  document.getElementById('deductStudentId').value = studentId;
  document.getElementById('deductStudentName').textContent = studentName;
  document.getElementById('deductMarks').value = 5;
  document.getElementById('deductReason').value = '';
  openModal('deductMarksModal');
}

async function saveDeduction() {
  const studentId = document.getElementById('deductStudentId').value;
  const marks = parseInt(document.getElementById('deductMarks').value);
  const reason = document.getElementById('deductReason').value.trim();
  if (!marks || marks < 1 || marks > 100) { showToast('Enter a valid marks value (1-100).', 'warning'); return; }
  if (!reason) { showToast('Please enter a reason.', 'warning'); return; }

  try {
    const res = await fetch('/api/discipline/deduct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, marks_removed: marks, reason, reviewed_by: session.username })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    // Update local cache
    const idx = DB.students.findIndex(s => String(s.id) === String(studentId) || String(s._id) === String(studentId));
    if (idx !== -1) DB.students[idx].discipline_marks = data.newMarks;

    await DB.addLog(schoolId, `DOD deducted -${marks} marks from ${document.getElementById('deductStudentName').textContent}: ${reason}`, session.username, 'approval');
    showToast(`-${marks} marks deducted. Parent notified via WhatsApp.`, 'success');
    closeModal('deductMarksModal');
    renderStudents();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

// ── WHATSAPP ────────────────────────────────────────────────────────
let waPolling = null;

async function waLoadStatus() {
  try {
    const res = await fetch('/api/whatsapp/status');
    const data = await res.json();
    const statusEl = document.getElementById('waStatus');
    const pairSection = document.getElementById('waPairSection');
    const disconnectBtn = document.getElementById('waDisconnectBtn');
    if (!statusEl) return;

    if (data.status === 'ready') {
      statusEl.innerHTML = '<span style="color:#10b981;font-weight:700;">✅ WhatsApp Connected & Ready</span>';
      if (pairSection) pairSection.style.display = 'none';
      if (disconnectBtn) disconnectBtn.style.display = 'inline-flex';
      clearInterval(waPolling);
    } else if (data.status === 'pairing') {
      statusEl.innerHTML = '<span style="color:#f59e0b;font-weight:700;">⏳ Waiting for you to enter the code in WhatsApp…</span>';
      if (data.pairingCode) {
        document.getElementById('waPairingCode').style.display = 'block';
        document.getElementById('waCodeDisplay').textContent = data.pairingCode;
      }
    } else if (data.status === 'authenticated') {
      statusEl.innerHTML = '<span style="color:#6366f1;font-weight:700;">🔐 Authenticated, loading…</span>';
    } else {
      statusEl.innerHTML = '<span style="color:#ef4444;font-weight:700;">❌ Not Connected</span>';
      if (pairSection) pairSection.style.display = 'block';
      if (disconnectBtn) disconnectBtn.style.display = 'none';
    }
  } catch (e) {}
}

async function waRequestCode() {
  const phone = document.getElementById('waPhoneInput').value.trim();
  if (!phone) { showToast('Enter your phone number first', 'warning'); return; }
  showToast('Requesting pairing code…', 'info');
  try {
    const res = await fetch('/api/whatsapp/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('waPairingCode').style.display = 'block';
      document.getElementById('waCodeDisplay').textContent = data.code;
      showToast('Go to WhatsApp → Linked Devices → Link with phone number', 'success', 8000);
      clearInterval(waPolling);
      waPolling = setInterval(waLoadStatus, 3000);
    } else {
      showToast('Failed: ' + data.message, 'error');
    }
  } catch (e) { showToast('Server error', 'error'); }
}

async function waDisconnect() {
  await fetch('/api/whatsapp/disconnect', { method: 'POST' });
  showToast('WhatsApp disconnected', 'warning');
  clearInterval(waPolling);
  waLoadStatus();
}

async function waSendTest() {
  const phone = prompt('Enter phone number to test (e.g. +250781234567):');
  if (!phone) return;
  const res = await fetch('/api/whatsapp/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message: 'Hello from DMS! WhatsApp notifications are working ✅' })
  });
  const data = await res.json();
  showToast(data.success ? 'Test message sent!' : 'Failed: ' + data.message, data.success ? 'success' : 'error');
}

const _origRenderSettings = renderSettings;
renderSettings = function () {
  _origRenderSettings();
  setTimeout(() => {
    waLoadStatus();
    clearInterval(waPolling);
    waPolling = setInterval(waLoadStatus, 5000);
  }, 100);
};
