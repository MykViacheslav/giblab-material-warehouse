const fs = require('fs');

let js = fs.readFileSync('public/app.js', 'utf8');

const badListenerPattern = 'elements.cutJobForm.elements.order_id.addEventListener("change", () => {';
const badIndex = js.indexOf(badListenerPattern);

if (badIndex !== -1) {
    // Find the end of this listener callback block
    const blockEnd = js.indexOf('});', badIndex);
    if (blockEnd !== -1) {
        js = js.substring(0, badIndex) + js.substring(blockEnd + 3);
        fs.writeFileSync('public/app.js', js, 'utf8');
        console.log("Fixed app.js crash!");
    } else {
        console.log("Could not find end of block");
    }
} else {
    console.log("Pattern not found");
}
