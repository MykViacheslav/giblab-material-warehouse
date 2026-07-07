const fs = require('fs');
const fn = `
function renderCutOrderSelect() {
  const select = elements.globalCutOrderSelect;
  if (!select) return;
  const currentValue = select.value || (state.selectedOrderId ? String(state.selectedOrderId) : "");
  select.innerHTML = '<option value="">Wybierz zamówienie</option>' + state.orders.map((order) => \`<option value="\${order.id}">\${order.order_number} - \${order.customer_name} - \${order.title}</option>\`).join('');
  select.value = currentValue;
}
`;
fs.appendFileSync('public/app.js', fn, 'utf8');
