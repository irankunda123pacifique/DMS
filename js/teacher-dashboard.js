// ── Auth Guard ────────────────────────────────────────────────────
const session = Auth.requireAuth('teacher');
if (!session) throw new Error('Unauthorized');

const schoolId = session.schoolId;
let teacher = null;

// ── Initialization ───────────────────────────────────────────────
async function initDashboard() {
  await DB.load(schoolId);
  teacher = DB.getTeacher(session.id);
  if (!teacher) {
    showToast('Teacher record not found.', 'error');
    return;
  }

  const school = await DB.getSchool(schoolId);
  document.getElementById('sidebarSchoolName').textContent = school ? school.school_name : 'DMS';
  document.getElementById('sidebarAvatar').innerHTML = renderAvatar(teacher, 40);
  document.getElementById('topbarAvatar').innerHTML = renderAvatar(teacher, 36);
  document.getElementById('sidebarName').textContent = teacher.name;

  // Populate settings fields
  document.getElementById('setTeacherName').value = teacher.name;
  document.getElementById('setTeacherSubject').value = teacher.subject || '';
  document.getElementById('setTeacherPhone').value = teacher.phone || '';
  document.getElementById('profilePreview').innerHTML = renderAvatar(teacher, 100);

  navigate('home');
}

initDashboard();

function logout() { Auth.clearSession(); window.location.href = 'index.html'; }

// ── Settings & Profile ──────────────────────────────────────────
function handleProfileUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;
    document.getElementById('profilePreview').innerHTML = `<img src="${base64}" style="width:100%;height:100%;object-fit:cover;">`;
    window._pendingAvatar = base64;
  };
  reader.readAsDataURL(file);
}

async function saveSettings() {
  const name = document.getElementById('setTeacherName').value.trim();
  const subj = document.getElementById('setTeacherSubject').value.trim();
  const phon = document.getElementById('setTeacherPhone').value.trim();
  const pass = document.getElementById('setNewPass').value;

  if (!name) { showToast('Name is required.', 'warning'); return; }

  const updates = { name, subject: subj, phone: phon };
  if (pass) {
    if (pass.length < 6) { showToast('Password too short.', 'warning'); return; }
    updates.password = pass;
  }
  if (window._pendingAvatar) updates.profile_image = window._pendingAvatar;

  await DB.updateTeacher(session.id, updates);
  showToast('Profile updated!', 'success');
  closeModal('settingsModal');
  setTimeout(() => location.reload(), 500);
}

// ── Submit Logic ──────────────────────────────────────────────
let reportTarget = 'individual';

function toggleReportType(type) {
  reportTarget = type;
  document.getElementById('tabIndividual').classList.toggle('active', type === 'individual');
  document.getElementById('tabClass').classList.toggle('active', type === 'class');
  document.getElementById('individualSection').style.display = type === 'individual' ? 'block' : 'none';
  document.getElementById('classSection').style.display = type === 'class' ? 'block' : 'none';
  if (type === 'class') populateClassSelect();
}

function populateClassSelect() {
  const sel = document.getElementById('reqClass');
  const classes = DB.getClasses(schoolId);
  sel.innerHTML = '<option value="">Select class...</option>' +
    classes.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

function searchInModal(q) {
  const res = document.getElementById('modalSearchResults');
  if (!q.trim()) { res.innerHTML = ''; return; }
  const students = DB.getStudents(schoolId).filter(s => s.full_name.toLowerCase().includes(q.toLowerCase()));
  if (!students.length) { res.innerHTML = '<div style="padding:8px;font-size:0.8125rem;color:#64748b;">No students found</div>'; return; }
  res.innerHTML = students.slice(0, 5).map(s => `
        <div style="padding:8px;cursor:pointer;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,0.05);" onclick="selectStudentInModal('${s._id}', '${s.full_name}')">
            ${renderAvatar(s, 24, '0.6rem')}
            <div style="font-size:0.8125rem;">${s.full_name} (${s.class})</div>
        </div>
    `).join('');
}

function selectStudentInModal(id, name) {
  document.getElementById('reqStudent').value = id;
  document.getElementById('studentModalSearch').value = name;
  document.getElementById('modalSearchResults').innerHTML = '';
}

let modalScanner = null;
function startScanInModal() {
  openModal('modalScanOverlay');
  if (typeof Html5Qrcode === 'undefined') { showToast('Scanner library not loaded', 'error'); return; }
  modalScanner = new Html5Qrcode('modalQrReader');
  modalScanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 200 }, (text) => {
    try {
      const data = JSON.parse(text);
      const s = DB.getStudent(data.id || text);
      if (s) {
        selectStudentInModal(s._id, s.full_name);
        stopScanInModal();
      }
    } catch (e) {
      const s = DB.getStudent(text);
      if (s) { selectStudentInModal(s._id, s.full_name); stopScanInModal(); }
    }
  }, () => { }).catch(err => {
    showToast('Camera error: ' + err, 'error');
    stopScanInModal();
  });
}

function stopScanInModal() {
  if (modalScanner) { modalScanner.stop().catch(() => { }); modalScanner = null; }
  closeModal('modalScanOverlay');
}

function populateStudentSelect() {
  const sel = document.getElementById('reqStudent');
  if (!sel) return;
  const students = DB.getStudents(schoolId);
  sel.innerHTML = '<option value="">Select a student…</option>' +
    students.map(s => `<option value="${s._id}">${s.full_name} — ${s.class} (${s.discipline_marks}/100)</option>`).join('');
}

document.getElementById('reqMistake').addEventListener('change', function () {
  const wrap = document.getElementById('otherMistakeWrap');
  if (wrap) wrap.style.display = this.value === 'Other' ? 'block' : 'none';
});

// ── Navigation ────────────────────────────────────────────────────
let currentPage = '';
function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  const titles = { home: 'My Dashboard', scan: 'Scan Student QR', submit: 'Submit Report', history: 'My Reports' };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  document.getElementById('pageSubtitle').textContent = `Welcome, ${teacher ? teacher.name : ''}`;
  const pc = document.getElementById('pageContent');
  pc.innerHTML = '';
  const pages = { home: renderHome, scan: renderScan, submit: renderSubmitPage, history: renderHistory };
  if (pages[page]) {
    pages[page]();
    applyTranslations();
  }
}

// ── HOME PAGE ─────────────────────────────────────────────────────
function renderHome() {
  const myRequests = DB.getRequestsByTeacher(session.id);
  const students = DB.getStudents(schoolId);
  const pending = myRequests.filter(r => r.status === 'pending');
  const approved = myRequests.filter(r => r.status === 'approved');
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthlyCount = myRequests.filter(r => r.createdAt && r.createdAt.startsWith(thisMonth)).length;

  document.getElementById('pageContent').innerHTML = `<div class="fade-in">
    <div class="stats-grid">
      <div class="stat-card purple"><div class="stat-icon purple"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></div><div><div class="stat-value">${students.length}</div><div class="stat-label">Total Students</div></div></div>
      <div class="stat-card orange"><div class="stat-icon orange"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div><div><div class="stat-value">${pending.length}</div><div class="stat-label">Pending Review</div></div></div>
      <div class="stat-card green"><div class="stat-icon green"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div><div><div class="stat-value">${approved.length}</div><div class="stat-label">Approved Reports</div></div></div>
      <div class="stat-card blue"><div class="stat-icon blue"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg></div><div><div class="stat-value">${monthlyCount}</div><div class="stat-label">This Month</div></div></div>
    </div>

    ${renderClassTeacherSection()}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div class="card" style="cursor:pointer;" onclick="navigate('scan')">
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:56px;height:56px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(99,102,241,0.35);">
            <svg viewBox="0 0 24 24" fill="white" style="width:28px;height:28px;"><path d="M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M19 5h-6v6h6V5zm-6 8h1.5v1.5H13V13zm1.5 1.5H16V16h-1.5v-1.5zM16 13h1.5v1.5H16V13zm-3 3h1.5v1.5H13V16zm1.5 1.5H16V19h-1.5v-1.5zM16 16h1.5v1.5H16V16zm1.5-1.5H19V16h-1.5v-1.5zm0 3H19V19h-1.5v-1.5z"/></svg>
          </div>
          <div>
            <h3 style="font-size:1rem;font-weight:700;">Scan Student</h3>
            <p style="font-size:0.8125rem;color:#64748b;margin-top:2px;">Use camera to scan QR code</p>
          </div>
        </div>
      </div>
      <div class="card" style="cursor:pointer;" onclick="openSubmitModal()">
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:56px;height:56px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(245,158,11,0.35);">
            <svg viewBox="0 0 24 24" fill="white" style="width:28px;height:28px;"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          </div>
          <div>
            <h3 style="font-size:1rem;font-weight:700;">Submit Report</h3>
            <p style="font-size:0.8125rem;color:#64748b;margin-top:2px;">Submit a discipline case</p>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <h3 style="font-size:1rem;font-weight:700;">Recent Submissions</h3>
        <button class="btn btn-outline btn-sm" onclick="navigate('history')">View All</button>
      </div>
      ${myRequests.length === 0 ? '<div class="empty-state" style="padding:32px;"><p>No reports submitted yet.</p></div>' :
      myRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map(r => {
        const s = DB.getStudent(r.student_id);
        return `<div class="request-card ${r.status}">
      <div class="request-card-header">
        <div>
          <div class="request-mistake">${r.mistake}</div>
          <div class="request-meta" style="display:flex;align-items:center;gap:8px;">
            ${renderAvatar(s, 24, '0.65rem')}
            <span>${s ? s.full_name : 'Unknown'}</span><span>·</span><span>📅 ${formatDate(r.createdAt)}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span class="badge badge-danger">-${r.marks_removed} marks</span>
          ${getStatusBadge(r.status)}
          ${r.status === 'pending' ? `<button class="btn btn-outline btn-sm" style="color:#ef4444;border-color:rgba(239,68,68,0.2);" onclick="cancelMyReport('${r._id}')">Cancel</button>` : ''}
        </div>
      </div>
      ${r.notes ? `<div class="request-notes">${r.notes}</div>` : ''}
    </div>`;
      }).join('')}
    </div>
  </div>`;
}

function renderClassTeacherSection() {
  const cls = DB.getClassTeacher(session.id);
  if (!cls) return `
    <div class="card" style="margin-bottom:20px;border-left:4px solid #64748b;opacity:0.7;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;background:rgba(255,255,255,0.05);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#64748b;">
          <svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        </div>
        <div>
          <h3 style="font-size:0.9rem;font-weight:700;color:#94a3b8;">No Class Assigned</h3>
          <p style="font-size:0.75rem;color:#64748b;">You are not currently assigned as a class teacher.</p>
        </div>
      </div>
    </div>
  `;

  const students = DB.getStudents(schoolId).filter(s => s.class === cls.name);
  if (!students.length) return `
    <div class="card" style="margin-bottom:20px;border-left:4px solid #6366f1;">
      <h3 style="font-size:1.125rem;font-weight:800;color:white;margin-bottom:8px;">My Class: ${cls.name}</h3>
      <p style="font-size:0.8125rem;color:#64748b;">No students enrolled in this class yet.</p>
    </div>
  `;

  const boys = students.filter(s => s.gender === 'Male').length;
  const girls = students.filter(s => s.gender === 'Female').length;
  const avg = Math.round(students.reduce((acc, s) => acc + s.discipline_marks, 0) / students.length);
  const atRisk = students.filter(s => s.discipline_marks < 60);

  return `
    <div class="card" style="margin-bottom:20px;border-left:4px solid #6366f1;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="font-size:1.125rem;font-weight:800;color:white;">My Class: ${cls.name}</h3>
        <span class="badge ${getMarksBadge(avg)}">${avg}% Class Performance</span>
      </div>
      
      <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); gap:12px; margin-bottom:20px;">
         <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:10px;text-align:center;">
            <div style="font-size:1.25rem;font-weight:700;">${students.length}</div>
            <div style="font-size:0.7rem;color:#64748b;">TOTAL</div>
         </div>
         <div style="background:rgba(99,102,241,0.05);padding:12px;border-radius:10px;text-align:center;">
            <div style="font-size:1.25rem;font-weight:700;color:#818cf8;">${boys}</div>
            <div style="font-size:0.7rem;color:#64748b;">BOYS</div>
         </div>
         <div style="background:rgba(236,72,153,0.05);padding:12px;border-radius:10px;text-align:center;">
            <div style="font-size:1.25rem;font-weight:700;color:#f472b6;">${girls}</div>
            <div style="font-size:0.7rem;color:#64748b;">GIRLS</div>
         </div>
      </div>

      <div>
        <h4 style="font-size:0.875rem;font-weight:600;margin-bottom:10px;color:#f87171;">Students at Risk (${atRisk.length})</h4>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${atRisk.length === 0 ? '<p style="font-size:0.8125rem;color:#64748b;">No students at risk. Great job!</p>' :
      atRisk.sort((a, b) => a.discipline_marks - b.discipline_marks).map(s => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(239,68,68,0.05);border-radius:8px;">
              <div style="display:flex;align-items:center;gap:10px;">
                ${renderAvatar(s, 24, '0.65rem')}
                <div style="font-size:0.8125rem;font-weight:500;">${s.full_name}</div>
              </div>
              <span class="badge badge-danger">${s.discipline_marks}/100</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}

function renderScan() {
  document.getElementById('pageContent').innerHTML = `<div class="fade-in">
    <div style="max-width:600px;margin:0 auto;">
      <div class="card" style="margin-bottom:20px;">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:12px;">Scan Student QR Code</h3>
        <div id="qrReader" style="width:100%;border-radius:12px;overflow:hidden;"></div>
        <div style="display:flex;gap:10px;margin-top:16px;">
          <button class="btn btn-primary" style="flex:1" id="startScanBtn" onclick="startScan()">Start Camera</button>
          <button class="btn btn-outline" style="flex:1" id="stopScanBtn" onclick="stopScan()" style="display:none">Stop Camera</button>
        </div>
      </div>
      <div id="scanResultCard" style="display:none;" class="card slide-in">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:16px;">✅ Student Identified</h3>
        <div id="scanResultBody"></div>
        <div style="display:flex;gap:10px;margin-top:16px;">
          <button class="btn btn-primary" style="flex:1" onclick="submitFromScan()">Submit Discipline Report</button>
          <button class="btn btn-outline" onclick="resetScan()">Scan Again</button>
        </div>
      </div>
    </div>
  </div>`;
}

async function submitReport() {
  let studentId = null;
  let className = null;

  if (reportTarget === 'individual') {
    studentId = document.getElementById('reqStudent').value;
    if (!studentId) { showToast('Please select a student.', 'warning'); return; }
  } else {
    className = document.getElementById('reqClass').value;
    if (!className) { showToast('Please select a class.', 'warning'); return; }
  }

  const mistakeRaw = document.getElementById('reqMistake').value;
  const mistake = mistakeRaw === 'Other' ? document.getElementById('otherMistake').value.trim() : mistakeRaw;
  const marks = parseInt(document.getElementById('reqMarks').value);
  const notes = document.getElementById('reqNotes').value.trim();

  if (!mistake) { showToast('Please select misconduct type.', 'warning'); return; }

  const reportData = {
    school_id: schoolId,
    teacher_id: session.id,
    mistake,
    marks_removed: marks,
    notes,
    status: 'pending',
    target_type: reportTarget
  };

  if (reportTarget === 'individual') reportData.student_id = studentId;
  else reportData.class_name = className;

  const newReq = await DB.createRequest(reportData);

  DB.pushUndo(`Report for "${reportTarget === 'individual' ? (DB.getStudent(studentId)?.full_name || '?') : className}"`, async () => {
    await DB.deleteRequest(newReq._id);
    if (currentPage === 'home') renderHome();
    else if (currentPage === 'history') renderHistory();
  });

  await DB.addLog(schoolId, `Teacher "${teacher.name}" submitted report for ${reportTarget}`, session.username, 'discipline');
  closeModal('submitModal');
  showToast('Report submitted!', 'success');
  if (currentPage === 'home') renderHome();
  else if (currentPage === 'history') renderHistory();
}

async function cancelMyReport(id) {
  const pwd = prompt("Enter your password to confirm cancellation:");
  if (pwd !== teacher.password) { showToast("Incorrect password.", "error"); return; }

  const req = DB.getRequest(id);
  await DB.deleteRequest(id);

  DB.pushUndo(`Submission cancelled`, async () => {
    await DB.createRequest(req);
    if (currentPage === 'home') renderHome();
    else if (currentPage === 'history') renderHistory();
  });

  showToast('Submission cancelled.', 'info');
  if (currentPage === 'home') renderHome();
  else if (currentPage === 'history') renderHistory();
}

function renderSubmitPage() { navigate('submit'); } // Placeholder for navigation consistency
