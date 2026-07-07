const fs = require('fs');
let lines = fs.readFileSync('public/index.html', 'utf8').split(/\r?\n/);

const newLines = `          <div class="notify-panel" style="display: flex; flex-wrap: wrap; gap: 8px;">
            <button id="notifySmsBtn" type="button">SMS</button>
            <button id="notifyWhatsappBtn" type="button">WhatsApp</button>
            <button id="notifyTelegramBtn" type="button">Telegram</button>
            <button id="notifyEmailBtn" type="button">Email</button>
            <button id="newOrderBtn" type="button">Nowe zamówienie</button>
            <button id="addOrderPositionBtn" type="button">Dodaj pozycję</button>
            <button id="goToOrderCuttingBtn" type="button">Przejdź do zamówienia</button>
            <textarea id="notifyText" readonly placeholder="Kliknij zamówienie, aby przygotować wiadomość do klienta." style="width: 100%; min-height: 80px;"></textarea>
          </div>

          <div class="selection-actions" style="display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
            <button id="markPaidBtn" type="button" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">Oznacz opłacone</button>
            <button id="markUnpaidBtn" type="button" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; margin-right: auto;">Oznacz nie zapłacone</button>
            <button id="editSelectedOrderBtn" class="outline-action" type="button">EDYTUJ</button>
            <button id="deleteSelectedOrderBtn" class="outline-action danger-outline" type="button">USUŃ</button>
          </div>`.split('\n');

// Lines are 0-indexed. 220 is index 219, 236 is index 235.
// We splice out 219 to 235 (17 lines) and insert our new lines.
lines.splice(219, 17, ...newLines);

// Cache bust while we are at it
let html = lines.join('\r\n');
html = html.replace(/styles\.css\?v=[0-9.]+/g, 'styles.css');
html = html.replace('styles.css', 'styles.css?v=' + Date.now());

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Replaced perfectly via line index.");
