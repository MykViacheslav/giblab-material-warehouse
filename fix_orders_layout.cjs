const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

const oldOrdersTab = `<section id="ordersTab" class="tab-page">
          <form id="orderForm" class="grid-form order-grid">`;

const newOrdersTab = `<section id="ordersTab" class="tab-page">
          <div class="split-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
            <div class="order-form-panel" style="border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; background: var(--panel-bg);">
              <h3 style="margin-top: 0; color: var(--accent-color);">Dane zamówienia</h3>
              <form id="orderForm" class="grid-form order-grid">`;

html = html.replace(oldOrdersTab, newOrdersTab);

const oldPaymentForm = `</form>

          <form id="paymentForm" class="stock-form">`;

const newPaymentForm = `</form>
            </div>
            <div class="payment-form-panel" style="border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; background: var(--panel-bg);">
              <h3 style="margin-top: 0; color: var(--accent-color);">Wpłaty i rozliczenia</h3>
              <form id="paymentForm" class="stock-form">`;

html = html.replace(oldPaymentForm, newPaymentForm);

const oldNotifyPanel = `</form>

          <div class="notify-panel" style="display: flex; flex-direction: column; gap: 10px;">`;

const newNotifyPanel = `</form>
            </div>
          </div>

          <div class="notify-panel" style="display: flex; flex-direction: column; gap: 10px;">`;

html = html.replace(oldNotifyPanel, newNotifyPanel);

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Restored split layout for Zamówienia');
