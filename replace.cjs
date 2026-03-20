const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') && !file.includes('Sidebar.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src/pages').concat(walk('./src/components'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace text-white with text-brand-text-primary
  content = content.replace(/text-white/g, 'text-brand-text-primary');
  
  // Fix buttons that should be white
  content = content.replace(/bg-red-600 text-brand-text-primary/g, 'bg-red-600 text-white');
  content = content.replace(/bg-red-500 text-brand-text-primary/g, 'bg-red-500 text-white');
  content = content.replace(/bg-green-600 text-brand-text-primary/g, 'bg-green-600 text-white');
  content = content.replace(/bg-blue-600 text-brand-text-primary/g, 'bg-blue-600 text-white');
  content = content.replace(/text-brand-text-primary cursor-pointer hover:underline/g, 'text-brand-text-primary cursor-pointer hover:underline');
  
  fs.writeFileSync(file, content);
});
console.log('Done');
