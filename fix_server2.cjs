const fs = require('fs');

let t = fs.readFileSync('server.js', 'utf8');

const replacement = `let paymentLine = "";
  if (balance > 0) {
    paymentLine = \`Do zapłaty pozostało: \${balance.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł.\`;
  } else if (order.payment_status === "Nie zapłacone") {
    paymentLine = "Zamówienie czeka na wycenę i opłacenie.";
  } else {
    paymentLine = "Płatność jest rozliczona.";
  }`;

t = t.replace(/const paymentLine = balance > 0[^;]+;/g, replacement);

fs.writeFileSync('server.js', t, 'utf8');
console.log('Replaced in server.js');
