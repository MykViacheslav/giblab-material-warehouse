const fs = require('fs');

let server = fs.readFileSync('server.js', 'utf8');

// Patch PUT /api/orders/:id
const putStart = server.indexOf('app.put("/api/orders/:id"');
const putEnd = server.indexOf('});', putStart);
if (putStart !== -1 && putEnd !== -1) {
    let putBlock = server.substring(putStart, putEnd + 3);
    if (!putBlock.includes('const oldOrder = selectOrder.get(id);')) {
        const replaceStr = `const payload = normalizeOrder(request.body);
  const oldOrder = selectOrder.get(id);
  if (payload.payment_status !== oldOrder.payment_status) {
    payload.payment_status_manual = 1;
  }`;
        putBlock = putBlock.replace('const payload = normalizeOrder(request.body);', replaceStr);
        server = server.substring(0, putStart) + putBlock + server.substring(putEnd + 3);
        console.log('Patched PUT /api/orders/:id');
    }
}

// Patch POST /api/orders
const postStart = server.indexOf('app.post("/api/orders",');
const postEnd = server.indexOf('});', postStart);
if (postStart !== -1 && postEnd !== -1) {
    let postBlock = server.substring(postStart, postEnd + 3);
    if (!postBlock.includes('if (payload.payment_status !== "Nie zapłacone") {')) {
        const replaceStr = `const payload = normalizeOrder(request.body);
  if (payload.payment_status !== "Nie zapłacone") {
    payload.payment_status_manual = 1;
  }`;
        postBlock = postBlock.replace('const payload = normalizeOrder(request.body);', replaceStr);
        server = server.substring(0, postStart) + postBlock + server.substring(postEnd + 3);
        console.log('Patched POST /api/orders');
    }
}

fs.writeFileSync('server.js', server, 'utf8');
