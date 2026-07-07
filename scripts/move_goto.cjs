const fs = require('fs');

let lines = fs.readFileSync('public/index.html', 'utf8').split(/\r?\n/);

const newLines = `          <div class="notify-panel" style="display: flex; flex-wrap: wrap; gap: 8px;">
            <button id="notifySmsBtn" type="button">SMS</button>
            <button id="notifyWhatsappBtn" type="button">WhatsApp</button>
            <button id="notifyTelegramBtn" type="button">Telegram</button>
            <button id="notifyEmailBtn" type="button">Email</button>
            <textarea id="notifyText" readonly placeholder="Kliknij zamówienie, aby przygotować wiadomość do klienta." style="width: 100%; min-height: 80px;"></textarea>
          </div>

          <div class="selection-actions" style="display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
            <button id="markPaidBtn" type="button" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">Oznacz opłacone</button>
            <button id="markUnpaidBtn" type="button" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white;">Oznacz nie zapłacone</button>
            <button id="goToOrderCuttingBtn" type="button" style="background: linear-gradient(135deg, #0ea5e9, #2563eb); color: white; margin-right: auto;">Przejdź do zamówienia</button>
            <button id="editSelectedOrderBtn" class="outline-action" type="button">EDYTUJ</button>
            <button id="deleteSelectedOrderBtn" class="outline-action danger-outline" type="button">USUŃ</button>
          </div>`.split('\n');

// Replace lines 225 (index 224) to 239 (index 238) -> total 15 lines
lines.splice(224, 15, ...newLines);

let html = lines.join('\r\n');

// Cache bust
html = html.replace(/styles\.css\?v=[0-9.]+/g, 'styles.css');
html = html.replace('styles.css', 'styles.css?v=' + Date.now());

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Moved PRZEJDŹ DO ZAMÓWIENIA button successfully.");
