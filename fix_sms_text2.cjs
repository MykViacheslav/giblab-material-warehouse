const fs = require('fs');

let server = fs.readFileSync('server.js', 'utf8');

const startIdx = server.indexOf('function buildReadyMessage(order, customer) {');
const endIdx = server.indexOf('}', startIdx);

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

    server = server.substring(0, startIdx) + newFunc + server.substring(endIdx + 1);
    fs.writeFileSync('server.js', server, 'utf8');
    console.log('Fixed buildReadyMessage');
}
