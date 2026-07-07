const fs = require('fs');

let code = fs.readFileSync('server.js', 'utf8');

// The start of the function
const startText = "function buildReadyMessage(order, customer) {";
const startIndex = code.indexOf(startText);

// We know the exact next function is function normalizePhone(phone)
const nextFunction = "function normalizePhone(phone) {";
let endIndex = code.indexOf(nextFunction, startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find the bounds");
    process.exit(1);
}

// Extract everything from buildReadyMessage to normalizePhone
const badSection = code.substring(startIndex, endIndex);

const correctSection = `function buildReadyMessage(order, customer) {
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
}

`;

code = code.replace(badSection, correctSection);

fs.writeFileSync('server.js', code, 'utf8');
console.log("Replaced using boundary check successfully.");
