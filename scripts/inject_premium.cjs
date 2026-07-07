const fs = require('fs');

let css = fs.readFileSync('public/styles.css', 'utf8');

// Remove the old Premium polish pass if it exists
const polishIndex = css.indexOf('/* Premium polish pass */');
if (polishIndex !== -1) {
  css = css.substring(0, polishIndex);
}

const premiumCSS = `
/* =========================================================================
   ULTRA PREMIUM GLASSMORPHISM THEME OVERRIDES
   ========================================================================= */

@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

:root {
  --bg-color: #0b0f19;
  --glass-bg: rgba(16, 23, 37, 0.65);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-highlight: rgba(255, 255, 255, 0.12);
  --glass-blur: blur(24px);

  --accent-primary: #0ea5e9;
  --accent-primary-hover: #38bdf8;
  --accent-secondary: #8b5cf6;

  --shadow-soft: 0 8px 32px rgba(0, 0, 0, 0.3);
  --shadow-glow: 0 0 20px rgba(14, 165, 233, 0.2);
}

/* Background & Typography */
body {
  font-family: 'Outfit', sans-serif !important;
  background-color: var(--bg-color) !important;
  background-image: 
    radial-gradient(circle at 15% 50%, rgba(14, 165, 233, 0.12), transparent 25%),
    radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.12), transparent 25%) !important;
  background-attachment: fixed !important;
  color: #f8fafc !important;
}

/* Glass Panels */
.panel, .main-sidebar, .topbar, .modal-content, .dashboard-cards .dash-card, .tree-panel {
  background: var(--glass-bg) !important;
  backdrop-filter: var(--glass-blur) !important;
  -webkit-backdrop-filter: var(--glass-blur) !important;
  border: 1px solid var(--glass-border) !important;
  box-shadow: var(--shadow-soft) !important;
  border-radius: 16px !important;
}

.topbar {
  border-radius: 0 !important;
  border-top: none !important;
  border-left: none !important;
  border-right: none !important;
}

.main-sidebar {
  border-radius: 0 !important;
  border-top: none !important;
  border-bottom: none !important;
  border-left: none !important;
  border-right: 1px solid var(--glass-border) !important;
}

.sidebar-brand {
  border-bottom: 1px solid var(--glass-border) !important;
}

.sidebar-brand h1 {
  background: linear-gradient(135deg, #38bdf8, #8b5cf6) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  font-family: 'Outfit', sans-serif !important;
  font-weight: 700 !important;
  font-size: 1.5rem !important;
}

/* Buttons */
button {
  font-family: 'Outfit', sans-serif !important;
  border-radius: 8px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

button.primary, #postDeliveryBtn, #postDeliveryCorrectionBtn {
  background: linear-gradient(135deg, var(--accent-primary), #2563eb) !important;
  color: white !important;
  border: none !important;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3) !important;
}

button.primary:hover, #postDeliveryBtn:hover, #postDeliveryCorrectionBtn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.5) !important;
}

button.secondary, .file-button {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid var(--glass-border) !important;
  color: #f8fafc !important;
}

button.secondary:hover, .file-button:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

/* Sidebar Tabs */
.nav-menu .tab {
  border-radius: 12px !important;
  margin: 4px 12px !important;
  width: calc(100% - 24px) !important;
}

.nav-menu .tab.active {
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.15), transparent) !important;
  color: var(--accent-primary-hover) !important;
  box-shadow: inset 3px 0 0 var(--accent-primary) !important;
  border-left: none !important;
}

.nav-menu .tab:hover:not(.active) {
  background: rgba(255, 255, 255, 0.05) !important;
  transform: translateX(4px) !important;
}

/* Inputs */
input, select, textarea {
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
  font-family: 'Outfit', sans-serif !important;
  color: #f8fafc !important;
  transition: all 0.3s ease !important;
}

input:focus, select:focus, textarea:focus {
  border-color: var(--accent-primary) !important;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2) !important;
}

/* Tables */
th {
  background: rgba(15, 23, 42, 0.7) !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid var(--glass-border) !important;
  font-family: 'Outfit', sans-serif !important;
  letter-spacing: 0.05em !important;
}

td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.03) !important;
}

tr:hover td {
  background: rgba(255, 255, 255, 0.04) !important;
}

/* Animations */
.tab-page.active {
  animation: fadeIn 0.4s ease-out !important;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Titles */
.panel-title, .tree-title {
  background: rgba(255, 255, 255, 0.02) !important;
  border-bottom: 1px solid var(--glass-border) !important;
  font-family: 'Outfit', sans-serif !important;
}

/* Forms */
.grid-form, .stock-form {
  background: rgba(0, 0, 0, 0.15) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: 12px !important;
}
`;

fs.writeFileSync('public/styles.css', css + '\n\n' + premiumCSS, 'utf8');
console.log("Premium overrides appended!");
