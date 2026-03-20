const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
content = content.replace(/text-brand-text-primary/g, 'text-white');
fs.writeFileSync('src/components/Sidebar.tsx', content);

let users = fs.readFileSync('src/pages/Users.tsx', 'utf8');
users = users.replace(/bg-\[#0B0B0B\]/g, 'bg-brand-black');
users = users.replace(/bg-\[#161616\]/g, 'bg-brand-dark');
users = users.replace(/bg-\[#1E1E1E\]/g, 'bg-brand-gray');
users = users.replace(/border-\[#1E1E1E\]/g, 'border-brand-gray');
users = users.replace(/border-\[#333333\]/g, 'border-brand-gray');
fs.writeFileSync('src/pages/Users.tsx', users);

let prod = fs.readFileSync('src/pages/ProductivityDashboard.tsx', 'utf8');
prod = prod.replace(/bg-\[#0a0a0a\]/g, 'bg-brand-black');
prod = prod.replace(/bg-\[#161616\]/g, 'bg-brand-dark');
prod = prod.replace(/bg-\[#121212\]/g, 'bg-brand-dark');
prod = prod.replace(/from-\[#111111\]/g, 'from-brand-gray');
prod = prod.replace(/to-\[#0a0a0a\]/g, 'to-brand-black');
fs.writeFileSync('src/pages/ProductivityDashboard.tsx', prod);

let workload = fs.readFileSync('src/components/WorkloadCard.tsx', 'utf8');
workload = workload.replace(/bg-\[#161616\]/g, 'bg-brand-dark');
fs.writeFileSync('src/components/WorkloadCard.tsx', workload);

console.log('Fixed hardcoded colors');
