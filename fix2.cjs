const fs = require('fs');
let users = fs.readFileSync('src/pages/Users.tsx', 'utf8');
users = users.replace(/text-\[#BDBDBD\]/g, 'text-brand-text-muted');
fs.writeFileSync('src/pages/Users.tsx', users);
console.log('Fixed text colors in Users.tsx');
