const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

const startIdx = html.indexOf('<form id="orderForm"');
const endIdx = html.indexOf('<div class="notify-panel">', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const oldPart = html.substring(startIdx, endIdx);
    
    // We want to wrap orderForm in a div and paymentForm in a div and make them side-by-side.
    const newPart = `<div class="split-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
            <div class="order-form-panel" style="border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; background: var(--panel-bg);">
              <h3 style="margin-top: 0; color: var(--accent-color);">Dane zamówienia</h3>
              <form id="orderForm" class="grid-form order-grid">
              <input name="order_number" placeholder="Numer automatyczny" readonly title="Numer zamówienia dodaje się automatycznie">
              <select name="customer_id" required></select>
              <input name="title" placeholder="Nazwa zamówienia" required>
              <input name="project_path" placeholder="Plik .project">
              <input name="order_date" type="date">
              <input name="due_date" type="date">
              <select name="production_status">
                <option>Nowe</option>
                <option>Pomiar</option>
                <option>Projekt</option>
                <option>Do produkcji</option>
                <option>W produkcji</option>
                <option>Gotowe</option>
                <option>Zamontowane</option>
                <option>Zamknięte</option>
              </select>
              <select name="payment_status">
                <option>Nie zapłacone</option>
                <option>Zaliczka</option>
                <option>Opłacone</option>
                <option>Po terminie</option>
              </select>
              <label class="check"><input name="payment_status_manual" type="checkbox"> Status ręczny</label>
              <input name="total_amount" placeholder="Wartość">
              <input name="notes" placeholder="Uwagi">
              <button type="submit">Zapisz zamówienie</button>
              <button id="clearOrderBtn" type="button">Wyczyść</button>
            </form>
            </div>
            
            <div class="payment-form-panel" style="border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; background: var(--panel-bg);">
              <h3 style="margin-top: 0; color: var(--accent-color);">Wpłaty i rozliczenia</h3>
              <form id="paymentForm" class="stock-form">
              <input name="order_id" placeholder="ID zamówienia" required>
              <input name="amount" placeholder="Kwota wpłaty" required>
              <input name="payment_date" type="date">
              <select name="method">
                <option value="">Metoda</option>
                <option>Gotówka</option>
                <option>Przelew</option>
                <option>Karta</option>
                <option>BLIK</option>
              </select>
              <select id="payerCustomerSelect" name="payer_customer_id">
                <option value="">Wybierz płacącego</option>
              </select>
              <input name="payer_name" placeholder="Kto zapłacił">
              <input name="received_by" placeholder="Kto przyjął">
              <input name="note" placeholder="Opis wpłaty">
              <button type="submit">Dodaj wpłatę</button>
            </form>
            </div>
          </div>
          
          `;
          
    html = html.substring(0, startIdx) + newPart + html.substring(endIdx);
    fs.writeFileSync('public/index.html', html, 'utf8');
    console.log('ordersTab layout updated');
} else {
    console.log('could not find ordersTab bounds');
}
