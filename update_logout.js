const fs = require('fs');
const path = require('path');
const dir = 'd:\\Internship\\Atkool as Agents folder\\atkool-website\\public';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const logoutHtml = `
            <a href="#" class="sidebar-item" onclick="localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser'); window.location.href='/index.html'; return false;" style="color: #ef4444; margin-top: auto; font-weight: bold;">
                <span style="margin-right: 8px">👋</span> LOGOUT
            </a>`;

for (let file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('LOGOUT')) continue;

  content = content.replace('<a href="terms.html" class="sidebar-item">TERMS & CONDITION</a>', '<a href="terms.html" class="sidebar-item">TERMS & CONDITION</a>' + logoutHtml);
  content = content.replace('<div class="sidebar-item active">TERMS & CONDITION</div>', '<div class="sidebar-item active">TERMS & CONDITION</div>' + logoutHtml);
  
  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Successfully added logout button to all HTML files.');
