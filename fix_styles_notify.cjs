const fs = require('fs');

let css = fs.readFileSync('public/styles.css', 'utf8');

const oldNotify = `.notify-panel {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  margin-bottom: 16px;
}`;

const newNotify = `.notify-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}`;

if (css.includes(oldNotify)) {
    css = css.replace(oldNotify, newNotify);
} else if (css.includes(oldNotify.replace(/\n/g, '\r\n'))) {
    css = css.replace(oldNotify.replace(/\n/g, '\r\n'), newNotify.replace(/\n/g, '\r\n'));
}

const oldTextarea = `.notify-panel textarea {
  grid-column: 1 / -1;
  min-height: 80px;
}`;

const newTextarea = `.notify-panel textarea {
  width: 100%;
  min-height: 40px;
}`;

if (css.includes(oldTextarea)) {
    css = css.replace(oldTextarea, newTextarea);
} else if (css.includes(oldTextarea.replace(/\n/g, '\r\n'))) {
    css = css.replace(oldTextarea.replace(/\n/g, '\r\n'), newTextarea.replace(/\n/g, '\r\n'));
}

fs.writeFileSync('public/styles.css', css);
console.log('styles patched');
