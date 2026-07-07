const fs = require('fs');

let js = fs.readFileSync('public/app.js', 'utf8');

// The exact strings are:
//         <td>${escapeHtml(row.order_number || "")}</td>
//         <td>${escapeHtml(row.customer_name || "")}</td>

js = js.replace(/<td>\$\{escapeHtml\(row\.order_number \|\| ""\)\}<\/td>\s*/g, '');
js = js.replace(/<td>\$\{escapeHtml\(row\.customer_name \|\| ""\)\}<\/td>\s*/g, '');

fs.writeFileSync('public/app.js', js, 'utf8');
console.log("Fixed the table rendering for real!");
