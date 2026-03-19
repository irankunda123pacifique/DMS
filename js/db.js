/**
 * DMS — Local Storage Database
 * All data persists in the browser's localStorage
 */

// UI Helper: Translate strings if _t exists
if (typeof _t !== 'function') window._t = (s) => s;

const LS_KEYS = {
    SCHOOLS: 'dms_schools',
    TEACHERS: 'dms_teachers',
    STAFF: 'dms_staff',
    STUDENTS: 'dms_students',
    CLASSES: 'dms_classes',
    REQUESTS: 'dms_requests',
    LOGS: 'dms_logs'
};

const DB = {
    // ── Internal Helpers ──
    _getAll(key) {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    },
    _saveAll(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },
    _generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    },

    /**
     * Optional: In localStorage mode, load() just ensures data exists.
     * We'll also use this to clear cache if needed, though we query LS directly now.
     */
    async load(schoolId) {
        // Ensure some initial data if empty
        if (this._getAll(LS_KEYS.SCHOOLS).length === 0) {
            this._seed();
        }
    },

    // ── Schools ──
    async getSchool(id) {
        const schools = this._getAll(LS_KEYS.SCHOOLS);
        return schools.find(s => s._id === id || s.id === id) || null;
    },
    async updateSchool(id, updates) {
        const schools = this._getAll(LS_KEYS.SCHOOLS);
        const idx = schools.findIndex(s => s._id === id || s.id === id);
        if (idx !== -1) {
            schools[idx] = { ...schools[idx], ...updates };
            this._saveAll(LS_KEYS.SCHOOLS, schools);
            return schools[idx];
        }
        throw new Error('School not found');
    },

    // ── Students ──
    getStudents(schoolId) {
        return this._getAll(LS_KEYS.STUDENTS).filter(s => s.school_id === schoolId);
    },
    getStudent(id) {
        return this._getAll(LS_KEYS.STUDENTS).find(s => s._id === id || s.id === id);
    },
    async createStudent(data) {
        const students = this._getAll(LS_KEYS.STUDENTS);
        const newStudent = {
            ...data,
            _id: this._generateId('student'),
            created_at: new Date().toISOString()
        };
        students.push(newStudent);
        this._saveAll(LS_KEYS.STUDENTS, students);
        return newStudent;
    },
    async updateStudent(id, updates) {
        const students = this._getAll(LS_KEYS.STUDENTS);
        const idx = students.findIndex(s => s._id === id || s.id === id);
        if (idx !== -1) {
            students[idx] = { ...students[idx], ...updates };
            this._saveAll(LS_KEYS.STUDENTS, students);
            return students[idx];
        }
        return null;
    },
    async deleteStudent(id) {
        let students = this._getAll(LS_KEYS.STUDENTS);
        students = students.filter(s => s._id !== id && s.id !== id);
        this._saveAll(LS_KEYS.STUDENTS, students);
    },

    // ── Teachers ──
    getTeachers(schoolId) {
        return this._getAll(LS_KEYS.TEACHERS).filter(t => t.school_id === schoolId);
    },
    getTeacher(id) {
        return this._getAll(LS_KEYS.TEACHERS).find(t => t._id === id || t.id === id);
    },
    async updateTeacher(id, updates) {
        const items = this._getAll(LS_KEYS.TEACHERS);
        const idx = items.findIndex(t => t._id === id || t.id === id);
        if (idx !== -1) {
            items[idx] = { ...items[idx], ...updates };
            this._saveAll(LS_KEYS.TEACHERS, items);
            return items[idx];
        }
        return null;
    },
    async deleteTeacher(id) {
        let items = this._getAll(LS_KEYS.TEACHERS);
        items = items.filter(t => t._id !== id && t.id !== id);
        this._saveAll(LS_KEYS.TEACHERS, items);
    },

    // ── Staff ──
    getStaffMembers(schoolId) {
        return this._getAll(LS_KEYS.STAFF).filter(s => s.school_id === schoolId);
    },
    getStaff(id) {
        return this._getAll(LS_KEYS.STAFF).find(s => s._id === id || s.id === id);
    },
    async updateStaff(id, updates) {
        const items = this._getAll(LS_KEYS.STAFF);
        const idx = items.findIndex(s => s._id === id || s.id === id);
        if (idx !== -1) {
            items[idx] = { ...items[idx], ...updates };
            this._saveAll(LS_KEYS.STAFF, items);
            return items[idx];
        }
        return null;
    },
    async deleteStaff(id) {
        let items = this._getAll(LS_KEYS.STAFF);
        items = items.filter(s => s._id !== id && s.id !== id);
        this._saveAll(LS_KEYS.STAFF, items);
    },

    // ── Classes ──
    getClasses(schoolId) {
        return this._getAll(LS_KEYS.CLASSES).filter(c => c.school_id === schoolId);
    },
    getClassByName(schoolId, name) {
        return this.getClasses(schoolId).find(c => c.name.toLowerCase() === name.toLowerCase());
    },
    getClass(id) {
        return this._getAll(LS_KEYS.CLASSES).find(c => c._id === id || c.id === id);
    },
    async createClass(data) {
        const items = this._getAll(LS_KEYS.CLASSES);
        const newItem = {
            ...data,
            _id: this._generateId('class'),
            created_at: new Date().toISOString()
        };
        items.push(newItem);
        this._saveAll(LS_KEYS.CLASSES, items);
        return newItem;
    },
    async updateClass(id, updates) {
        const items = this._getAll(LS_KEYS.CLASSES);
        const idx = items.findIndex(c => c._id === id || c.id === id);
        if (idx !== -1) {
            items[idx] = { ...items[idx], ...updates };
            this._saveAll(LS_KEYS.CLASSES, items);
            return items[idx];
        }
        return null;
    },
    async deleteClass(id) {
        let items = this._getAll(LS_KEYS.CLASSES);
        items = items.filter(c => c._id !== id && c.id !== id);
        this._saveAll(LS_KEYS.CLASSES, items);
    },

    // ── Discipline Requests ──
    getRequests(schoolId) {
        return this._getAll(LS_KEYS.REQUESTS).filter(r => r.school_id === schoolId);
    },
    getRequest(id) {
        return this._getAll(LS_KEYS.REQUESTS).find(r => r._id === id || r.id === id);
    },
    getRequestsByTeacher(teacherId) {
        return this._getAll(LS_KEYS.REQUESTS).filter(r => r.teacher_id === teacherId);
    },
    getRequestsByStaff(staffId) {
        return this._getAll(LS_KEYS.REQUESTS).filter(r => r.staff_id === staffId);
    },
    getClassTeacher(teacherId) {
        return this._getAll(LS_KEYS.CLASSES).find(c => c.teacher_id === teacherId);
    },
    async createRequest(data) {
        const items = this._getAll(LS_KEYS.REQUESTS);
        const newItem = {
            ...data,
            _id: this._generateId('req'),
            date: new Date().toISOString(),
            status: data.status || 'pending'
        };
        items.push(newItem);
        this._saveAll(LS_KEYS.REQUESTS, items);
        return newItem;
    },
    async updateRequest(id, updates) {
        const items = this._getAll(LS_KEYS.REQUESTS);
        const idx = items.findIndex(r => r._id === id || r.id === id);
        if (idx !== -1) {
            items[idx] = { ...items[idx], ...updates };
            this._saveAll(LS_KEYS.REQUESTS, items);
            return items[idx];
        }
        return null;
    },
    async deleteRequest(id) {
        let items = this._getAll(LS_KEYS.REQUESTS);
        items = items.filter(r => r._id !== id && r.id !== id);
        this._saveAll(LS_KEYS.REQUESTS, items);
    },

    // ── Logs ──
    getLogs(schoolId, limit = 0) {
        const logs = this._getAll(LS_KEYS.LOGS).filter(l => l.school_id === schoolId);
        const sorted = logs.sort((a, b) => new Date(b.date) - new Date(a.date));
        return limit > 0 ? sorted.slice(0, limit) : sorted;
    },
    async addLog(school_id, message, user, category) {
        const logs = this._getAll(LS_KEYS.LOGS);
        const newLog = {
            _id: this._generateId('log'),
            school_id,
            action: message,
            performed_by: user,
            type: category || 'general',
            date: new Date().toISOString()
        };
        logs.unshift(newLog);
        this._saveAll(LS_KEYS.LOGS, logs);
        return newLog;
    },

    // ── Notifications ──
    async addNotification(data) {
        // Mocking notification for local execution
        console.log('🔔 Notifications (SMS Mock):', data);
    },

    // ── Stats ──
    getStats(schoolId) {
        const students = this.getStudents(schoolId);
        const requests = this.getRequests(schoolId);
        const teachers = this.getTeachers(schoolId).filter(t => t.status === 'approved');

        const atRisk = students.filter(s => s.discipline_marks < 50).length;
        const avg = students.length ? Math.round(students.reduce((a, s) => a + s.discipline_marks, 0) / students.length) : 0;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthReqs = requests.filter(r => new Date(r.date) >= startOfMonth).length;

        return {
            totalStudents: students.length,
            totalTeachers: teachers.length,
            totalRequests: requests.length,
            pendingRequests: requests.filter(r => r.status === 'pending').length,
            approvedRequests: requests.filter(r => r.status === 'approved').length,
            rejectedRequests: requests.filter(r => r.status === 'rejected').length,
            studentsAtRisk: atRisk,
            avgMarks: avg,
            thisMonthRequests: thisMonthReqs
        };
    },

    // ── Undo System ──
    _undoStack: [],
    pushUndo(actionName, revertFn) {
        const id = Math.random().toString(36).substr(2, 9);
        this._undoStack.push({ id, actionName, revertFn, time: Date.now() });
        showToast(`${actionName} performed.`, 'info', 10000, id);
        setTimeout(() => {
            this._undoStack = this._undoStack.filter(item => item.id !== id);
        }, 10500);
        return id;
    },
    async undo(id) {
        const idx = this._undoStack.findIndex(item => item.id === id);
        if (idx !== -1) {
            const item = this._undoStack[idx];
            await item.revertFn();
            this._undoStack.splice(idx, 1);
            showToast(`Action "${item.actionName}" undone.`, 'success');
            return true;
        }
        return false;
    },

    // ── Seeding & Reset ──
    reset() {
        localStorage.clear();
        this._seed();
    },

    _seed() {
        console.log('Seeding initial data to LocalStorage...');
        const schoolId = 'school_1';

        const schools = [{
            _id: schoolId,
            school_name: 'Greenfield Academy',
            dod_username: 'admin',
            password: '123',
            promo_code: 'TEACHER2026',
            created_at: new Date().toISOString()
        }];

        const t1Id = 'teacher_1';
        const t2Id = 'teacher_2';
        const teachers = [
            { _id: t1Id, school_id: schoolId, name: 'Mr. John Bosco', username: 'teacher1', password: '123', subject: 'Mathematics', status: 'approved', created_at: new Date().toISOString() },
            { _id: t2Id, school_id: schoolId, name: 'Ms. Diane Uwase', username: 'teacher2', password: '123', subject: 'English', status: 'approved', created_at: new Date().toISOString() }
        ];

        const staffId = 'staff_1';
        const staff = [
            { _id: staffId, school_id: schoolId, name: 'Officer Mike', username: 'staff1', password: '123', position: 'Security Chief', status: 'approved', created_at: new Date().toISOString() }
        ];

        const classes = [
            { _id: 'class_1', school_id: schoolId, name: 'S4A', teacher_id: t1Id },
            { _id: 'class_2', school_id: schoolId, name: 'S4B', teacher_id: t2Id }
        ];

        const students = [
            { _id: 'student_1', school_id: schoolId, full_name: 'Alice Mutesi', class: 'S4A', gender: 'Female', parent_name: 'Mrs. Mutesi Grace', parent_phone: '+250781111001', discipline_marks: 95, created_at: new Date().toISOString() },
            { _id: 'student_2', school_id: schoolId, full_name: 'Bob Nzeyimana', class: 'S4B', gender: 'Male', parent_name: 'Mr. Nzeyimana Jean', parent_phone: '+250781111002', discipline_marks: 40, created_at: new Date().toISOString() }
        ];

        this._saveAll(LS_KEYS.SCHOOLS, schools);
        this._saveAll(LS_KEYS.TEACHERS, teachers);
        this._saveAll(LS_KEYS.STAFF, staff);
        this._saveAll(LS_KEYS.CLASSES, classes);
        this._saveAll(LS_KEYS.STUDENTS, students);
        this._saveAll(LS_KEYS.REQUESTS, []);
        this._saveAll(LS_KEYS.LOGS, [
            { _id: 'log_1', school_id: schoolId, action: 'Initial system seeding', performed_by: 'System', type: 'general', date: new Date().toISOString() }
        ]);
    }
};

const Auth = {
    SESSION_KEY: 'dms_session',

    getSession() {
        const raw = sessionStorage.getItem(this.SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    },
    setSession(data) {
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(data));
    },
    clearSession() {
        sessionStorage.removeItem(this.SESSION_KEY);
    },
    requireAuth(role) {
        const session = this.getSession();
        if (!session) {
            window.location.href = 'index.html';
            return null;
        }
        // role check if needed
        return session;
    },

    async login(role, username, password) {
        // Simple mock login against localStorage
        if (role === 'dod') {
            const schools = DB._getAll(LS_KEYS.SCHOOLS);
            const s = schools.find(item => item.dod_username === username && item.password === password);
            if (!s) throw new Error('Invalid DoD credentials');
            const sess = {
                role: 'dod',
                id: s._id,
                username: s.dod_username,
                schoolId: s._id,
                schoolName: s.school_name
            };
            this.setSession(sess);
            return sess;
        } else if (role === 'teacher') {
            const items = DB._getAll(LS_KEYS.TEACHERS);
            const u = items.find(item => item.username === username && item.password === password);
            if (!u) throw new Error('Invalid teacher credentials');
            if (u.status !== 'approved') throw new Error('Account pending approval');
            const school = await DB.getSchool(u.school_id);
            const sess = {
                role: 'teacher',
                id: u._id,
                username: u.username,
                schoolId: u.school_id,
                schoolName: school ? school.school_name : 'DMS'
            };
            this.setSession(sess);
            return sess;
        } else if (role === 'staff') {
            const items = DB._getAll(LS_KEYS.STAFF);
            const u = items.find(item => item.username === username && item.password === password);
            if (!u) throw new Error('Invalid staff credentials');
            if (u.status !== 'approved') throw new Error('Account pending approval');
            const school = await DB.getSchool(u.school_id);
            const sess = {
                role: 'staff',
                id: u._id,
                username: u.username,
                schoolId: u.school_id,
                schoolName: school ? school.school_name : 'DMS'
            };
            this.setSession(sess);
            return sess;
        }
        throw new Error('Unsupported role');
    },

    async registerSchool(data) {
        const schools = DB._getAll(LS_KEYS.SCHOOLS);
        if (schools.some(s => s.dod_username === data.dod_username)) throw new Error('Username already exists');
        const newSchool = {
            ...data,
            _id: DB._generateId('school'),
            created_at: new Date().toISOString()
        };
        schools.push(newSchool);
        DB._saveAll(LS_KEYS.SCHOOLS, schools);
        return newSchool;
    },

    async registerTeacher(data) {
        const schools = DB._getAll(LS_KEYS.SCHOOLS);
        const school = schools.find(s => s.promo_code === data.promo_code);
        if (!school) throw new Error('Invalid registration code');

        const items = DB._getAll(LS_KEYS.TEACHERS);
        if (items.some(u => u.username === data.username)) throw new Error('Username already exists');

        const newUser = {
            ...data,
            _id: DB._generateId('teacher'),
            school_id: school._id,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        items.push(newUser);
        DB._saveAll(LS_KEYS.TEACHERS, items);
        return newUser;
    },

    async registerStaff(data) {
        const schools = DB._getAll(LS_KEYS.SCHOOLS);
        const school = schools.find(s => s.promo_code === data.promo_code);
        if (!school) throw new Error('Invalid registration code');

        const items = DB._getAll(LS_KEYS.STAFF);
        if (items.some(u => u.username === data.username)) throw new Error('Username already exists');

        const newUser = {
            ...data,
            _id: DB._generateId('staff'),
            school_id: school._id,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        items.push(newUser);
        DB._saveAll(LS_KEYS.STAFF, items);
        return newUser;
    }
};

// ── Image Viewer & Utilities (Unchanged Logic, just clean export) ──
let currentZoom = 1;
function showImageZoom(src) {
    if (!src) return;
    let overlay = document.getElementById('zoomOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'zoomOverlay';
        overlay.className = 'zoom-overlay';
        overlay.innerHTML = `
            <div class="zoom-controls">
                <button class="zoom-btn" onclick="modifyZoom(0.2)" title="Zoom In"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg></button>
                <button class="zoom-btn" onclick="modifyZoom(-0.2)" title="Zoom Out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/></svg></button>
                <button class="zoom-btn" onclick="resetZoom()" title="Reset"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8m0-5v5h5"/></svg></button>
                <button class="zoom-btn" onclick="closeZoom()" title="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <div class="zoom-container" id="zoomContainer" onclick="if(event.target===this)closeZoom()">
                <img id="zoomImg" class="zoom-img" src="${src}" draggable="false">
            </div>
            <div class="zoom-info">Scroll or use buttons to zoom · Click outside to close</div>
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('wheel', (e) => {
            e.preventDefault();
            modifyZoom(e.deltaY < 0 ? 0.1 : -0.1);
        }, { passive: false });
    } else {
        document.getElementById('zoomImg').src = src;
    }
    overlay.classList.add('active');
    resetZoom();
}

function modifyZoom(delta) {
    currentZoom = Math.max(0.3, Math.min(8, currentZoom + delta));
    syncZoom();
}

function resetZoom() {
    currentZoom = 1;
    syncZoom();
}

function closeZoom() {
    const ov = document.getElementById('zoomOverlay');
    if (ov) ov.classList.remove('active');
}

function syncZoom() {
    const img = document.getElementById('zoomImg');
    if (img) img.style.transform = `scale(${currentZoom})`;
}

function renderAvatar(user, size = 40, fontSize = '0.8rem') {
    if (!user) return `<div class="avatar-placeholder" style="width:${size}px;height:${size}px;">?</div>`;
    const initials = getInitials(user.full_name || user.name || user.username || '??');
    const grad = avatarGrad(user.full_name || user.name || user.username || '');
    const img = user.profile_image || user.dod_profile_image;
    if (img) {
        return `<div class="avatar-img" onclick="showImageZoom('${img}')" style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;flex-shrink:0;cursor:pointer;" title="Click to zoom"><img src="${img}" style="width:100%;height:100%;object-fit:cover;"></div>`;
    }
    return `<div class="avatar-initials" style="width:${size}px;height:${size}px;border-radius:50%;background:${grad};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:${fontSize};flex-shrink:0;">${initials}</div>`;
}

function avatarGrad(name) {
    const g = ['linear-gradient(135deg,#6366f1,#8b5cf6)', 'linear-gradient(135deg,#10b981,#059669)', 'linear-gradient(135deg,#f59e0b,#d97706)', 'linear-gradient(135deg,#3b82f6,#2563eb)', 'linear-gradient(135deg,#ec4899,#db2777)'];
    return g[name.charCodeAt(0) % g.length];
}

function showToast(message, type = 'info', duration = 4000, undoId = null) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }
    const icons = {
        success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
        error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
        warning: '<svg class="toast-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
        info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
    };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const displayMsg = _t(message);
    const undoBtnText = _t('Undo');
    toast.innerHTML = `${icons[type] || icons.info}<span>${displayMsg}</span>${undoId ? `<button onclick="DB.undo('${undoId}'); this.parentElement.remove()" style="margin-left:12px;background:white;color:#1a1f36;border:none;padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:700;cursor:pointer;">${undoBtnText}</button>` : ''}`;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 250);
        }
    }, duration);
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr) {
    if (!dateStr) return '—';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
    for (let [name, val] of Object.entries(intervals)) {
        const count = Math.floor(seconds / val);
        if (count >= 1) return count === 1 ? `1 ${name} ago` : `${count} ${name}s ago`;
    }
    return 'Just now';
}

function getMarksClass(marks) {
    if (marks >= 80) return 'excellent';
    if (marks >= 60) return 'good';
    if (marks >= 40) return 'warning';
    return 'critical';
}

function getMarksBadge(marks) {
    if (marks >= 80) return 'badge-success';
    if (marks >= 60) return 'badge-info';
    if (marks >= 40) return 'badge-warning';
    return 'badge-danger';
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getStatusBadge(status) {
    const map = {
        approved: '<span class="badge badge-success">✓ Approved</span>',
        pending: '<span class="badge badge-warning">⏳ Pending</span>',
        rejected: '<span class="badge badge-danger">✕ Rejected</span>'
    };
    return map[status] || '<span class="badge badge-gray">Unknown</span>';
}

function generateQRCode(container, data, size = 150) {
    container.innerHTML = '';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=ffffff&color=1a1f36&margin=6&format=png`;
    const img = document.createElement('img');
    img.src = qrUrl;
    img.width = size;
    img.height = size;
    img.alt = 'QR Code';
    img.style.borderRadius = '8px';
    img.style.border = '4px solid white';
    container.appendChild(img);
    return qrUrl;
}

function openModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Run load to ensure seeding on first visit
DB.load();
