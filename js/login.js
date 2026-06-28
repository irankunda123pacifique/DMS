// ── Role Tab Switching ────────────────────────────────────────────
document.querySelectorAll('.role-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const role = tab.dataset.role;
        document.getElementById('dodForm').style.display = role === 'dod' ? 'flex' : 'none';
        document.getElementById('teacherForm').style.display = role === 'teacher' ? 'flex' : 'none';
        document.getElementById('staffForm').style.display = role === 'staff' ? 'flex' : 'none';
    });
});

// ── Toggle Password Visibility ────────────────────────────────────
function togglePass(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;
    } else {
        input.type = 'password';
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
    }
}

// ── Redirect if already logged in ─────────────────────────────────
const existingSession = Auth.getSession();
if (existingSession) {
    if (existingSession.role === 'dod') window.location.href = 'dod-dashboard.html';
    else if (existingSession.role === 'teacher') window.location.href = 'teacher-dashboard.html';
    else if (existingSession.role === 'staff') window.location.href = 'staff-dashboard.html';
}

// ── Generic Login Handler ──────────────────────────────────────────
async function handleLogin(role, usernameId, passwordId, errorId, btnId, redirect) {
    const username = document.getElementById(usernameId).value.trim();
    const password = document.getElementById(passwordId).value;
    const errEl = document.getElementById(errorId);
    const btn = document.getElementById(btnId);
    const originalBtnHTML = btn.innerHTML;

    errEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = `<span>Signing in...</span>`;

    try {
        const session = await Auth.login(role, username, password);
        await DB.addLog(session.schoolId, `${role.toUpperCase()} "${username}" logged in`, username, 'auth');
        window.location.href = redirect;
    } catch (err) {
        errEl.textContent = err.message || 'Invalid username or password.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.classList.remove('loading');
        btn.innerHTML = originalBtnHTML;
    }
}

// ── Form Submissions ────────────────────────────────────────────────
document.getElementById('dodForm').addEventListener('submit', function (e) {
    e.preventDefault();
    handleLogin('dod', 'dodUsername', 'dodPassword', 'dodError', 'dodLoginBtn', 'dod-dashboard.html');
});

document.getElementById('teacherForm').addEventListener('submit', function (e) {
    e.preventDefault();
    handleLogin('teacher', 'teacherUsername', 'teacherPassword', 'teacherError', 'teacherLoginBtn', 'teacher-dashboard.html');
});

document.getElementById('staffForm').addEventListener('submit', function (e) {
    e.preventDefault();
    handleLogin('staff', 'staffUsername', 'staffPassword', 'staffError', 'staffLoginBtn', 'staff-dashboard.html');
});
