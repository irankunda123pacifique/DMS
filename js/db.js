/**
 * DMS — REST API Database Client with In-Memory Caching
 * Connects the frontend UI to the Express backend.
 */

// UI Helper: Translate strings if _t exists
if (typeof _t !== 'function') window._t = (s) => s;

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
        return session;
    },

    async login(role, username, password) {
        const res = await _request(`/auth/login/${role}`, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        const session = {
            role: res.role,
            id: res.id,
            username: res.username,
            name: res.name || res.username,
            schoolId: res.schoolId,
            schoolName: res.schoolName,
            token: res.token
        };
        this.setSession(session);
        return session;
    },

    async registerSchool(data) {
        return await _request('/auth/register/school', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async registerTeacher(data) {
        return await _request('/auth/register/teacher', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async registerStaff(data) {
        return await _request('/auth/register/staff', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

async function _request(endpoint, options = {}) {
    const session = Auth.getSession();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    if (session && session.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
    }
    const res = await fetch(`/api${endpoint}`, {
        ...options,
        headers
    });
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Request failed with status ${res.status}`);
    }
    return normalizeRecord(await res.json());
}

function normalizeRecord(value) {
    if (Array.isArray(value)) {
        return value.map(normalizeRecord);
    }
    if (value && typeof value === 'object') {
        const normalized = { ...value };
        if (normalized.id && !normalized._id) {
            normalized._id = normalized.id;
        }
        return normalized;
    }
    return value;
}

const DB = {
    // In-memory collections to maintain compatibility with synchronous getters in dashboards
    schools: [],
    students: [],
    teachers: [],
    staff: [],
    classes: [],
    requests: [],
    logs: [],
    _undoStack: [],

    async load(schoolId) {
        if (!schoolId) return;
        try {
            const [students, teachers, staff, classes, requests, logs] = await Promise.all([
                _request(`/students/${schoolId}`).catch(() => []),
                _request(`/users/teachers/${schoolId}`).catch(() => []),
                _request(`/users/staff/${schoolId}`).catch(() => []),
                _request(`/classes/${schoolId}`).catch(() => []),
                _request(`/discipline/${schoolId}`).catch(() => []),
                _request(`/logs/${schoolId}`).catch(() => [])
            ]);

            this.students = students || [];
            this.teachers = teachers || [];
            this.staff = staff || [];
            this.classes = classes || [];
            this.requests = requests || [];
            this.logs = logs || [];
        } catch (err) {
            console.error('Error loading data from backend:', err);
        }
    },

    // ── Schools ──
    async getSchool(id) {
        const sess = Auth.getSession();
        if (sess && (sess.schoolId === id || sess.id === id)) {
            return {
                id: sess.schoolId,
                school_name: sess.schoolName,
                dod_username: sess.username
            };
        }
        return null;
    },
    async updateSchool(id, updates) {
        // No direct school patch route, return local mock or session mock
        const sess = Auth.getSession();
        if (sess) {
            const updatedSess = { ...sess, schoolName: updates.school_name || sess.schoolName };
            Auth.setSession(updatedSess);
            return updatedSess;
        }
        return null;
    },

    // ── Students ──
    getStudents(schoolId) {
        return this.students;
    },
    getStudent(id) {
        return this.students.find(s => s.id === id || s._id === id) || null;
    },
    async createStudent(data) {
        const newStudent = await _request('/students', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        this.students.push(newStudent);
        return newStudent;
    },
    async updateStudent(id, updates) {
        const updated = await _request(`/students/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
        const idx = this.students.findIndex(s => s.id === id || s._id === id);
        if (idx !== -1) {
            this.students[idx] = updated;
        }
        return updated;
    },
    async deleteStudent(id) {
        await _request(`/students/${id}`, { method: 'DELETE' });
        this.students = this.students.filter(s => s.id !== id && s._id !== id);
    },

    // ── Teachers ──
    getTeachers(schoolId) {
        return this.teachers;
    },
    getTeacher(id) {
        return this.teachers.find(t => t.id === id || t._id === id) || null;
    },
    async updateTeacher(id, updates) {
        const updated = await _request(`/users/teachers/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
        const idx = this.teachers.findIndex(t => t.id === id || t._id === id);
        if (idx !== -1) {
            this.teachers[idx] = updated;
        }
        return updated;
    },
    async deleteTeacher(id) {
        await _request(`/users/teachers/${id}`, { method: 'DELETE' });
        this.teachers = this.teachers.filter(t => t.id !== id && t._id !== id);
    },

    // ── Staff ──
    getStaffMembers(schoolId) {
        return this.staff;
    },
    getStaff(id) {
        return this.staff.find(s => s.id === id || s._id === id) || null;
    },
    async updateStaff(id, updates) {
        const updated = await _request(`/users/staff/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
        const idx = this.staff.findIndex(s => s.id === id || s._id === id);
        if (idx !== -1) {
            this.staff[idx] = updated;
        }
        return updated;
    },
    async deleteStaff(id) {
        await _request(`/users/staff/${id}`, { method: 'DELETE' });
        this.staff = this.staff.filter(s => s.id !== id && s._id !== id);
    },

    // ── Classes ──
    getClasses(schoolId) {
        return this.classes;
    },
    getClassByName(schoolId, name) {
        return this.classes.find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
    },
    getClass(id) {
        return this.classes.find(c => c.id === id || c._id === id) || null;
    },
    async createClass(data) {
        const newClass = await _request('/classes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        this.classes.push(newClass);
        return newClass;
    },
    async updateClass(id, updates) {
        const updated = await _request(`/classes/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
        const idx = this.classes.findIndex(c => c.id === id || c._id === id);
        if (idx !== -1) {
            this.classes[idx] = updated;
        }
        return updated;
    },
    async deleteClass(id) {
        await _request(`/classes/${id}`, { method: 'DELETE' });
        this.classes = this.classes.filter(c => c.id !== id && c._id !== id);
    },

    // ── Discipline Requests ──
    getRequests(schoolId) {
        return this.requests;
    },
    getRequest(id) {
        return this.requests.find(r => r.id === id || r._id === id) || null;
    },
    getRequestsByTeacher(teacherId) {
        return this.requests.filter(r => r.teacher_id === teacherId);
    },
    getRequestsByStaff(staffId) {
        return this.requests.filter(r => r.staff_id === staffId);
    },
    getClassTeacher(teacherId) {
        return this.classes.find(c => c.teacher_id === teacherId) || null;
    },
    async createRequest(data) {
        const newReq = await _request('/discipline', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        this.requests.push(newReq);
        return newReq;
    },
    async updateRequest(id, updates) {
        const endpoint = (updates.status && ['approved', 'rejected'].includes(updates.status))
            ? `/discipline/${id}/review`
            : `/discipline/${id}`;
        const updated = await _request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
        const idx = this.requests.findIndex(r => r.id === id || r._id === id);
        if (idx !== -1) {
            this.requests[idx] = updated;
        }
        // If approved, refresh student score cache since marks were deducted
        if (updates.status === 'approved') {
            const sess = Auth.getSession();
            if (sess && sess.schoolId) {
                const students = await _request(`/students/${sess.schoolId}`).catch(() => []);
                this.students = students || [];
            }
        }
        return updated;
    },
    async deleteRequest(id) {
        await _request(`/discipline/${id}`, { method: 'DELETE' });
        this.requests = this.requests.filter(r => r.id !== id && r._id !== id);
    },

    // ── Logs ──
    getLogs(schoolId, limit = 0) {
        const sorted = [...this.logs].sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
        return limit > 0 ? sorted.slice(0, limit) : sorted;
    },
    async addLog(school_id, message, user, category) {
        const newLog = await _request('/logs', {
            method: 'POST',
            body: JSON.stringify({ school_id, message, user, category })
        });
        this.logs.unshift(newLog);
        return newLog;
    },

    // ── Notifications (WhatsApp triggers via backend) ──
    async addNotification(data) {
        try {
            const s = this.getStudent(data.student_id);
            if (s && s.parent_phone) {
                await _request('/discipline/whatsapp/send', {
                    method: 'POST',
                    body: JSON.stringify({
                        phoneNumber: s.parent_phone,
                        message: data.message
                    })
                });
                console.log(`✓ Triggered WhatsApp Web notification to parent of student: ${s.full_name}`);
            }
        } catch (err) {
            console.error('Failed to dispatch notification:', err.message);
        }
    },

    // ── Stats ──
    getStats(schoolId) {
        const stats = {
            totalStudents: this.students.length,
            totalTeachers: this.teachers.filter(t => t.status === 'approved').length,
            totalRequests: this.requests.length,
            pendingRequests: this.requests.filter(r => r.status === 'pending').length,
            approvedRequests: this.requests.filter(r => r.status === 'approved').length,
            rejectedRequests: this.requests.filter(r => r.status === 'rejected').length,
            studentsAtRisk: this.students.filter(s => s.discipline_marks < 50).length,
            avgMarks: this.students.length ? Math.round(this.students.reduce((a, s) => a + Number(s.discipline_marks || 0), 0) / this.students.length) : 0,
            thisMonthRequests: 0
        };

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        stats.thisMonthRequests = this.requests.filter(r => new Date(r.date || r.timestamp) >= startOfMonth).length;
        return stats;
    },

    // ── Undo System ──
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

    // ── Reset ──
    reset() {
        // Clear local sessionStorage, backend contains master records
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
};

// ── Image Viewer & Utilities ───────────────────────────────────────
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

// Load the session automatically on page load to initialize DB cache
(async () => {
    const session = Auth.getSession();
    if (session && session.schoolId) {
        await DB.load(session.schoolId);
    }
})();
