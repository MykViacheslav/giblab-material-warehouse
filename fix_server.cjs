const fs = require('fs');
let text = fs.readFileSync('server.js', 'utf8');

const targetStr = `function buildReadyMessage(order, customer) {
  const greeting = customer?.name ? \`Dzień dobry, \${customer.name}.\` : "Dzień dobry.";
  const balance = Number(order.balance || 0);
  const paymentLine = balance > 0
    ? \`Do zapłaty pozostało: \${balance.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł.\`
    : "Płatność jest rozliczona.";
  return \`\${greeting} Zamówienie \${order.order_number} (\${order.title}) jest gotowe do odbioru. \${paymentLine}\`;
}`;

const replacementStr = `function buildReadyMessage(order, customer) {
  const greeting = customer?.name ? \`Dzień dobry, \${customer.name}.\` : "Dzień dobry.";
  const balance = Number(order.balance || 0);
  let paymentLine = "";
  if (balance > 0) {
    paymentLine = \`Do zapłaty pozostało: \${balance.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł.\`;
  } else if (order.payment_status === "Nie zapłacone") {
    paymentLine = "Zamówienie czeka na wycenę i opłacenie.";
  } else {
    paymentLine = "Płatność jest rozliczona.";
  }
  return \`\${greeting} Zamówienie \${order.order_number} (\${order.title}) jest gotowe do odbioru. \${paymentLine}\`;
}`;

// Make sure to match ignoring line endings
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const targetRegex = new RegExp(escapeRegex(targetStr).replace(/\\n/g, '\\r?\\n'), 'g');

text = text.replace(targetRegex, replacementStr);
fs.writeFileSync('server.js', text, 'utf8');
console.log('Fixed server.js');
