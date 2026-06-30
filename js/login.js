// Redirect if already logged in
const existingSession = Auth.getSession();
if (existingSession) {
    if (existingSession.role === 'dod') window.location.href = 'dod-dashboard.html';
    else if (existingSession.role === 'teacher') window.location.href = 'teacher-dashboard.html';
    else if (existingSession.role === 'staff') window.location.href = 'staff-dashboard.html';
}

// Role Tab Switching
document.querySelectorAll('.role-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const role = tab.dataset.role;
        document.getElementById('dodForm').style.display     = role === 'dod'     ? 'flex' : 'none';
        document.getElementById('teacherForm').style.display = role === 'teacher' ? 'flex' : 'none';
        document.getElementById('staffForm').style.display   = role === 'staff'   ? 'flex' : 'none';
    });
});

// Toggle Password Visibility
function togglePass(inputId, btn) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

async function handleLogin(role, usernameId, passwordId, errorId, btnId, redirect) {
    const username = document.getElementById(usernameId).value.trim();
    const password = document.getElementById(passwordId).value;
    const errEl = document.getElementById(errorId);
    const btn = document.getElementById(btnId);
    const originalHTML = btn.innerHTML;

    errEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = '<span>Signing in...</span>';

    try {
        await Auth.login(role, username, password);
        window.location.href = redirect;
    } catch (err) {
        errEl.textContent = err.message || 'Invalid username or password.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

document.getElementById('dodForm').addEventListener('submit', e => {
    e.preventDefault();
    handleLogin('dod', 'dodUsername', 'dodPassword', 'dodError', 'dodLoginBtn', 'dod-dashboard.html');
});
document.getElementById('teacherForm').addEventListener('submit', e => {
    e.preventDefault();
    handleLogin('teacher', 'teacherUsername', 'teacherPassword', 'teacherError', 'teacherLoginBtn', 'teacher-dashboard.html');
});
document.getElementById('staffForm').addEventListener('submit', e => {
    e.preventDefault();
    handleLogin('staff', 'staffUsername', 'staffPassword', 'staffError', 'staffLoginBtn', 'staff-dashboard.html');
});
