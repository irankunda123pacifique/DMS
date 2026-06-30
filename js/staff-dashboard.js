// ── Auth Guard ────────────────────────────────────────────────────
const session = Auth.requireAuth('staff');
if (!session) throw new Error('Unauthorized');

const schoolId = session.schoolId;
let staff = null;

// ── Initialization ───────────────────────────────────────────────
async function initDashboard() {
  await DB.load(schoolId);

  // Robust lookup: try by id, _id, or username
  staff = DB.getStaff(session.id)
    || DB.staff.find(s => String(s.id) === String(session.id)
                       || String(s._id) === String(session.id)
                       || s.username === session.username)
    || null;

  const school = await DB.getSchool(schoolId);
  document.getElementById('sidebarSchoolName').textContent = school ? school.school_name : 'DMS';

  if (staff) {
    document.getElementById('sidebarAvatar').innerHTML = renderAvatar(staff, 40);
    document.getElementById('topbarAvatar').innerHTML = renderAvatar(staff, 36);
    document.getElementById('sidebarName').textContent = staff.name;
    document.getElementById('setStaffName').value = staff.name;
    document.getElementById('setStaffPosition').value = staff.position || '';
    document.getElementById('setStaffPhone').value = staff.phone || '';
    document.getElementById('profilePreview').innerHTML = renderAvatar(staff, 100);
  } else {
    document.getElementById('sidebarName').textContent = session.username || 'Staff';
    showToast('Profile data not found. Contact admin.', 'warning');
  }

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
  const name = document.getElementById('setStaffName').value.trim();
  const pos = document.getElementById('setStaffPosition').value.trim();
  const phon = document.getElementById('setStaffPhone').value.trim();
  const pass = document.getElementById('setNewPass').value;

  if (!name) { showToast('Name is required.', 'warning'); return; }

  const updates = { name, position: pos, phone: phon };
  if (pass) {
    if (pass.length < 6) { showToast('Password too short.', 'warning'); return; }
    updates.password = pass;
  }
  if (window._pendingAvatar) updates.profile_image = window._pendingAvatar;

  await DB.updateStaff(session.id, updates);
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
  if (typeof Html5Qrcode === 'undefined') return;
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
  const titles = { home: 'My Dashboard', scan: 'Scan Student QR', submit: 'Submit Report', history: 'My Reports', students: 'Students & Classes' };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  document.getElementById('pageSubtitle').textContent = `Welcome, ${staff ? staff.name : ''}`;
  const pc = document.getElementById('pageContent');
  pc.innerHTML = '';
  const pages = { home: renderHome, scan: renderScan, submit: renderSubmitPage, history: renderHistory, students: renderStudents };
  if (pages[page]) {
    pages[page]();
    applyTranslations();
  }
}

// ── HOME PAGE ─────────────────────────────────────────────────────
function renderHome() {
  const myRequests = DB.getRequestsByStaff(session.id);
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
 
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div class="card" style="cursor:pointer;" onclick="navigate('scan')">
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:56px;height:56px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(99,102,241,0.35);">
            <svg viewBox="0 0 24 24" fill="white" style="width:28px;height:28px;"><path d="M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M19 5h-6v6h6V5z"/></svg>
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

function renderStudents() {
  const students = DB.getStudents(schoolId);
  const classes = DB.getClasses(schoolId);
  const atRisk = students.filter(s => s.discipline_marks < 50);

  const classStats = classes.map(c => {
    const classStudents = students.filter(s => s.class === c.name);
    const avgMarks = classStudents.length ? Math.round(classStudents.reduce((acc, s) => acc + s.discipline_marks, 0) / classStudents.length) : 100;
    return { name: c.name, count: classStudents.length, avgMarks };
  });

  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
    <div class="fade-in">
       <div class="stats-grid">
        <div class="stat-card purple"><div class="stat-value">${students.length}</div><div class="stat-label">Total Students</div></div>
        <div class="stat-card red"><div class="stat-value">${atRisk.length}</div><div class="stat-label">Students at Risk</div></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;margin-top:20px;">
        <div class="card">
          <h3 style="font-size:1rem;font-weight:700;margin-bottom:16px;">Class Performance</h3>
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${classStats.map(c => `
              <div>
                <div style="display:flex;justify-content:space-between;font-size:0.875rem;margin-bottom:4px;">
                  <span><strong>${c.name}</strong></span>
                  <span class="badge ${getMarksBadge(c.avgMarks)}">${c.avgMarks}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${c.avgMarks}%"></div></div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="card">
          <h3 style="font-size:1rem;font-weight:700;margin-bottom:16px;">Students at Risk</h3>
          <div style="max-height:300px;overflow-y:auto;">
            ${atRisk.map(s => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
               ${renderAvatar(s, 30, '0.7rem')}
               <div style="flex:1;">
                 <div style="font-weight:600;font-size:0.85rem;">${s.full_name}</div>
                 <div style="font-size:0.7rem;color:#64748b;">${s.class}</div>
               </div>
               <span class="badge badge-danger">${s.discipline_marks}</span>
            </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:16px;">All Students</h3>
        <input type="text" placeholder="Search students..." oninput="filterStaffStudents(this.value)" style="margin-bottom:16px;">
        <div id="staffStudentsList"></div>
      </div>
    </div>`;
  filterStaffStudents('');
}

async function submitReport() {
  let studentId = document.getElementById('reqStudent').value;
  let className = document.getElementById('reqClass').value;

  const mistakeRaw = document.getElementById('reqMistake').value;
  const mistake = mistakeRaw === 'Other' ? document.getElementById('otherMistake').value.trim() : mistakeRaw;
  const marks = parseInt(document.getElementById('reqMarks').value);
  const notes = document.getElementById('reqNotes').value.trim();

  const reportData = {
    school_id: schoolId,
    staff_id: session.id,
    mistake,
    marks_removed: marks,
    notes,
    status: 'pending',
    target_type: reportTarget
  };

  if (reportTarget === 'individual') reportData.student_id = studentId;
  else reportData.class_name = className;

  const newReq = await DB.createRequest(reportData);
  DB.pushUndo(`Report for ${reportTarget}`, async () => {
    await DB.deleteRequest(newReq._id);
    renderHome();
  });

  await DB.addLog(schoolId, `Staff submitted report`, session.username, 'discipline');
  closeModal('submitModal');
  showToast('Report submitted!', 'success');
  renderHome();
}

function renderScan() {
  document.getElementById('pageContent').innerHTML = `<div class="fade-in">
    <div style="max-width:600px;margin:0 auto;">
      <div class="card" style="margin-bottom:20px;">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:12px;">Scan Student QR Code</h3>
        <div id="qrReader" style="width:100%;border-radius:12px;overflow:hidden;"></div>
        <div style="display:flex;gap:10px;margin-top:16px;">
          <button class="btn btn-primary" style="flex:1" id="startScanBtn" onclick="startScan()">Start Camera</button>
          <button class="btn btn-outline" style="flex:1" id="stopScanBtn" onclick="stopScan()">Stop Camera</button>
        </div>
      </div>
      <div id="scanResultCard" style="display:none;" class="card">
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

function renderSubmitPage() {
  populateStudentSelect();
  openModal('submitModal');
}

function openSubmitModal() {
  populateStudentSelect();
  openModal('submitModal');
}

function renderHistory() {
  const myRequests = DB.getRequestsByStaff(session.id);
  myRequests.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  document.getElementById('pageContent').innerHTML = `<div class="fade-in">
    <div class="section-header"><div><h2>My Reports</h2><p>${myRequests.length} submissions total</p></div></div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${myRequests.length === 0
        ? '<div class="empty-state"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/></svg><h3>No reports yet</h3><p>Submit a discipline report to see it here.</p></div>'
        : myRequests.map(r => {
            const s = DB.getStudent(r.student_id);
            return `<div class="request-card ${r.status}">
              <div class="request-card-header">
                <div>
                  <div class="request-mistake">${r.mistake}</div>
                  <div class="request-meta">
                    <span>👤 ${r.target_type === 'class' ? 'Class: ' + r.class_name : (s ? s.full_name : 'Unknown')}</span>
                    <span>·</span><span>📅 ${formatDate(r.date || r.createdAt)}</span>
                  </div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                  <span class="badge badge-danger">-${r.marks_removed} marks</span>
                  ${getStatusBadge(r.status)}
                </div>
              </div>
              ${r.notes ? `<div class="request-notes">${r.notes}</div>` : ''}
            </div>`;
          }).join('')
      }
    </div>
  </div>`;
}

function filterStaffStudents(q) {
  let students = DB.getStudents(schoolId);
  if (q) students = students.filter(s => s.full_name.toLowerCase().includes(q.toLowerCase()));
  const container = document.getElementById('staffStudentsList');
  if (!container) return;
  if (!students.length) {
    container.innerHTML = '<div class="empty-state" style="padding:20px;"><p>No students found.</p></div>';
    return;
  }
  container.innerHTML = `<div class="table-wrapper"><table>
    <thead><tr><th>Student</th><th>Class</th><th>Gender</th><th>Marks</th></tr></thead>
    <tbody>${students.map(s => `<tr>
      <td><div style="display:flex;align-items:center;gap:10px;">${renderAvatar(s, 28, '0.7rem')}<span style="font-weight:600;">${s.full_name}</span></div></td>
      <td><span class="badge badge-info">${s.class}</span></td>
      <td>${s.gender || '—'}</td>
      <td><span class="badge ${getMarksBadge(s.discipline_marks)}">${s.discipline_marks}/100</span></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}
