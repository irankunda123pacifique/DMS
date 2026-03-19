// ── Theme Manager ────────────────────────────────────────────────────────
const THEME_KEY = 'dms_theme';

function initializeTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    setTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    const event = new CustomEvent('themeChanged', { detail: theme });
    document.dispatchEvent(event);
    updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
    const button = document.getElementById('themeToggleBtn');
    if (!button) return;

    if (theme === 'dark') {
        button.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px;"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>';
    } else {
        button.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px;"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8 8h-2v3h2v-3zm-7.45-3.91l1.41 1.41 1.79-1.79-1.41-1.41-1.79 1.79zM12 5.5c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5 6.5-2.91 6.5-6.5-2.91-6.5-6.5-6.5zm0 11c-2.48 0-4.5-2.02-4.5-4.5S9.52 7.5 12 7.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z"/></svg>';
    }
}

// ── Language Selector UI ──────────────────────────────────────────────────
function renderSettingsUI() {
    let container = document.getElementById('globalControls');
    if (!container) {
        container = document.createElement('div');
        container.id = 'globalControls';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '10px';
        container.style.zIndex = '9999';

        container.innerHTML = `
            <select id="langSelect" style="padding:8px 12px;border-radius:20px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary);font-family:Inter;cursor:pointer;outline:none;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="rw">Kinyarwanda</option>
            </select>
            <button id="themeToggleBtn" style="width:40px;height:40px;border-radius:50%;border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);transition:transform 0.2s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">
            </button>
        `;

        document.body.appendChild(container);

        const langSelect = document.getElementById('langSelect');
        const currentLang = localStorage.getItem('appLang') || 'en';
        langSelect.value = currentLang;

        langSelect.addEventListener('change', (e) => {
            if (typeof setLanguage === 'function') {
                setLanguage(e.target.value);
            }
        });

        const themeBtn = document.getElementById('themeToggleBtn');
        themeBtn.addEventListener('click', toggleTheme);
    }
    updateThemeIcon(document.documentElement.getAttribute('data-theme') || 'light');
}

// Ensure execution
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    renderSettingsUI();
});
