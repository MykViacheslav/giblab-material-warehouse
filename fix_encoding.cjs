const fs = require('fs');
const iconv = require('iconv-lite');

function fixEncoding(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    // Decode from Windows-1250
    const text = iconv.decode(buffer, 'win1250');
    // Save as UTF-8
    fs.writeFileSync(filePath, text, 'utf8');
    console.log('Fixed encoding for', filePath);
  } catch (e) {
    console.error('Error fixing', filePath, e.message);
  }
}

fixEncoding('public/app.js');
// Let's also fix index.html just in case, wait, index.html might already be UTF-8 because replace_file_content saves in UTF-8?
// Actually if I mixed UTF-8 and ANSI in index.html, it's corrupted.
// Let's manually fix the specific strings I injected in index.html.
