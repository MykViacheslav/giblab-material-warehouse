const fs = require('fs');

let serverJs = fs.readFileSync('server.js', 'utf8');

// Find the buildReadyMessage function
const startPattern = "function buildReadyMessage(order, customer) {";
const startIndex = serverJs.indexOf(startPattern);

if (startIndex === -1) {
    console.error("Could not find buildReadyMessage");
    process.exit(1);
}

// Find the end of the function. It ends with: return `...`.trim();\n}
// Let's just find the closing brace after "return"
const returnIndex = serverJs.indexOf("return", startIndex);
const endIndex = serverJs.indexOf("}", returnIndex) + 1;

const originalCode = serverJs.substring(startIndex, endIndex);

// We want to completely replace originalCode.
// But we must construct newCode carefully to maintain the exact same Polish characters.
// We can extract them from the original code or just write them if our JS file is read as utf8.
// Since this JS file is running in Node and my string literals here are utf8, it should work fine.
const newCode = `function buildReadyMessage(order, customer) {
  const greeting = customer?.name ? \`Dzień dobry, \${customer.name}.\` : "Dzień dobry.";
  const balance = Number(order.balance || 0);
  let paymentLine = "";
  if (balance > 0) {
    paymentLine = \`Do zapłaty pozostało: \${balance.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł.\`;
  } else if (order.payment_status === "Opłacone") {
    paymentLine = "Płatność jest rozliczona.";
  } else {
    paymentLine = "Płatność do uregulowania przy odbiorze.";
  }
  return \`\${greeting} Zamówienie \${order.order_number} (\${order.title}) jest gotowe do odbioru. \${paymentLine}\`.trim();
}`;

serverJs = serverJs.replace(originalCode, newCode);

fs.writeFileSync('server.js', serverJs, 'utf8');
console.log("Successfully replaced buildReadyMessage.");
