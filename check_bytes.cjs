const fs = require('fs');
const t = fs.readFileSync('server.js','utf8');
const m = t.match(/order\.payment_status === "(Nie zap[^"]+)"/);
if (m) {
  console.log('Hex:', Buffer.from(m[1]).toString('hex'));
  console.log('String:', m[1]);
} else {
  console.log('Not found');
}
