const {DatabaseSync} = require('node:sqlite');
const db = new DatabaseSync('data/warehouse.sqlite');
const order = db.prepare('SELECT payment_status FROM orders WHERE id = 8').get();
console.log('Hex:', Buffer.from(order.payment_status).toString('hex'));
console.log('String:', order.payment_status);
