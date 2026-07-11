const fs = require('fs');
const html = fs.readFileSync('public/index.html','utf8');
const match = html.match(/<main class="layout">([\s\S]*?)<\/main>/);
if (match) {
    let content = match[1];
    // Strip out all <section id="...">...</section> content to see what's left
    content = content.replace(/<section id="[^"]+".*?>[\s\S]*?<\/section>/g, '<SECTION_TAB_REMOVED>');
    console.log(content.trim());
} else {
    console.log('No match');
}
