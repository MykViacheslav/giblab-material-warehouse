const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// The original block:
const originalBlock = `<div class="notify-panel">
            <button id="markPaidBtn" type="button">Oznacz opłacone</button>
            <button id="markUnpaidBtn" type="button">Oznacz nie zapłacone</button>
            <button id="notifySmsBtn" type="button">SMS</button>
            <button id="notifyWhatsappBtn" type="button">WhatsApp</button>
            <button id="notifyTelegramBtn" type="button">Telegram</button>
            <button id="notifyEmailBtn" type="button">Email</button>
            <button id="newOrderBtn" type="button">Nowe zamówienie</button>
            <button id="addOrderPositionBtn" type="button">Dodaj pozycję</button>
            <button id="goToOrderCuttingBtn" type="button">Przejdź do zamówienia</button>
            <textarea id="notifyText" readonly placeholder="Kliknij zamówienie, aby przygotować wiadomość do klienta."></textarea>
          </div>`;

const newBlock = `<div class="notify-panel" style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px;">
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <button id="notifySmsBtn" type="button">SMS</button>
              <button id="notifyWhatsappBtn" type="button">WhatsApp</button>
              <button id="notifyTelegramBtn" type="button">Telegram</button>
              <button id="notifyEmailBtn" type="button">Email</button>
              <button id="newOrderBtn" type="button">Nowe zamówienie</button>
              <button id="addOrderPositionBtn" type="button">Dodaj pozycję</button>
              <button id="goToOrderCuttingBtn" type="button">Przejdź do zamówienia</button>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <button id="markPaidBtn" type="button">Oznacz opłacone</button>
              <button id="markUnpaidBtn" type="button">Oznacz nie zapłacone</button>
            </div>
            <textarea id="notifyText" readonly placeholder="Kliknij zamówienie, aby przygotować wiadomość do klienta." style="width: 100%; min-height: 80px;"></textarea>
          </div>`;

html = html.replace(originalBlock, newBlock);

// Cache bust
html = html.replace(/styles\.css\?v=[0-9.]+/g, 'styles.css');
html = html.replace('styles.css', 'styles.css?v=' + Date.now());

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Fixed index.html structure and encoding!");
