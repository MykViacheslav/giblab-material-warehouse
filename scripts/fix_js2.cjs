const fs = require('fs');

let serverJs = fs.readFileSync('server.js', 'utf8');

// The broken function currently in server.js
const brokenStart = "function buildReadyMessage(order, customer) {";
const brokenEnd = "}.trim();\r\n}"; // wait, the previous Get-Content showed the function ended with "}"

const startIndex = serverJs.indexOf("function buildReadyMessage(order, customer) {");
const endIndex = serverJs.indexOf("}", serverJs.indexOf("return", startIndex)) + 1;

const brokenCode = serverJs.substring(startIndex, endIndex);

const fixedCode = `function buildReadyMessage(order, customer) {
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

serverJs = serverJs.replace(brokenCode, fixedCode);
fs.writeFileSync('server.js', serverJs, 'utf8');
console.log("Fixed JS successfully");
