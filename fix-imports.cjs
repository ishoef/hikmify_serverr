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
    } else if (file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Replace relative imports: from "./file" -> from "./file.js"
  // Make sure not to append .js if it already has .js
  content = content.replace(/from\s+['"](\.\.?\/[^'"]+)['"]/g, (match, p1) => {
    if (p1.endsWith('.js') || p1.endsWith('.ts') || p1.endsWith('.json')) {
      return match;
    }
    return `from "${p1}.js"`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    changedCount++;
  }
});

console.log(`Added .js extension to relative imports in ${changedCount} files.`);
