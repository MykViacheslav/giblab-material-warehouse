const fs = require('fs');

let server = fs.readFileSync('server.js', 'utf8');

const startStr = 'function buildReadyMessage(order, customer) {';
const nextFuncStr = '\nfunction normalizePhone(phone) {';

const startIdx = server.indexOf(startStr);
const endIdx = server.indexOf(nextFuncStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newFunc = `function buildReadyMessage(order, customer) {
  const greeting = customer?.name ? \`Dzień dobry, \${customer.name}.\` : "Dzień dobry.";
  const balance = Number(order.balance || 0);
  let paymentLine = "";
  if (balance > 0) {
    paymentLine = \`Do zapłaty pozostało: \${balance.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł.\`;
  } else if (order.payment_status === "Nie zapłacone") {
    paymentLine = "Płatność do uregulowania przy odbiorze.";
  } else {
    paymentLine = "Płatność jest rozliczona.";
  }
  return \`\${greeting} Zamówienie \${order.order_number} (\${order.title}) jest gotowe do odbioru. \${paymentLine}\`;
}`;

    server = server.substring(0, startIdx) + newFunc + server.substring(endIdx);
    fs.writeFileSync('server.js', server, 'utf8');
    console.log('Fixed buildReadyMessage correctly');
} else {
    console.log('Could not find bounds');
}
