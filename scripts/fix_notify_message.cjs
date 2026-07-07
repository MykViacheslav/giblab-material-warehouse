const fs = require('fs');

let serverJs = fs.readFileSync('server.js', 'utf8');

// Find the buildReadyMessage function
const startText = "function buildReadyMessage(order, customer) {";
const startIndex = serverJs.indexOf(startText);
if (startIndex === -1) {
    console.error("Could not find buildReadyMessage");
    process.exit(1);
}

const endIndex = serverJs.indexOf("}", startIndex) + 1;
const oldFunc = serverJs.substring(startIndex, endIndex);

const newFunc = `function buildReadyMessage(order, customer) {
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

serverJs = serverJs.replace(oldFunc, newFunc);
fs.writeFileSync('server.js', serverJs, 'utf8');
console.log("Updated buildReadyMessage in server.js");
