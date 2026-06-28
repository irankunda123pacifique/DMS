const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const files = ['dod-dashboard.html','register.html','staff-dashboard.html','staff-register.html','teacher-dashboard.html','teacher-register.html'];

files.forEach(file => {
    const fp = path.join(dir, file);
    let content = fs.readFileSync(fp, 'utf8');
    content = content.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\r?\n\s*<link href="https:\/\/fonts\.googleapis\.com[^"]*" rel="stylesheet">/g, '');
    fs.writeFileSync(fp, content, 'utf8');
    console.log('Cleaned:', file);
});
