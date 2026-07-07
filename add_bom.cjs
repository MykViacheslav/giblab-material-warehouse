const fs = require('fs');
const path = require('path');

function addBom(filePath) {
  if (!fs.existsSync(filePath)) return;
  const buffer = fs.readFileSync(filePath);
  // Check if BOM already exists
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    console.log(`BOM already exists in ${filePath}`);
    return;
  }
  
  // Also, check if it's UTF-8 or ANSI. We assume our previous scripts made them valid UTF-8 without BOM.
  // We just prepend the BOM.
  const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
  const newBuffer = Buffer.concat([bom, buffer]);
  fs.writeFileSync(filePath, newBuffer);
  console.log(`Added BOM to ${filePath}`);
}

const dir = 'public';
const files = fs.readdirSync(dir);
for (const file of files) {
  if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
    addBom(path.join(dir, file));
  }
}

const jsDir = 'public/js';
if (fs.existsSync(jsDir)) {
  const jsFiles = fs.readdirSync(jsDir);
  for (const file of jsFiles) {
    if (file.endsWith('.js')) {
      addBom(path.join(jsDir, file));
    }
  }
}

// Also add BOM to server.js just in case? No, server is Node, it doesn't care.
