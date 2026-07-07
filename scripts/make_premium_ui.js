const fs = require('fs');

const premiumCSS = `
/* =========================================================================
   GIBLAB WAREHOUSE - ULTRA PREMIUM DARK GLASSMORPHISM THEME
   ========================================================================= */

@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

:root {
  --font-main: 'Outfit', sans-serif;
  
  /* Cosmic Dark Background */
  --bg-color: #0b0f19;
  
  /* Glass Panels */
  --glass-bg: rgba(16, 23, 37, 0.65);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-highlight: rgba(255, 255, 255, 0.12);
  --glass-blur: blur(24px);

  /* Accents */
  --accent-primary: #0ea5e9;
  --accent-primary-hover: #38bdf8;
  --accent-secondary: #8b5cf6;
  --accent-glow: rgba(14, 165, 233, 0.4);

  /* Text */
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-dark: #cbd5e1;

  /* Status Colors */
  --status-success: #10b981;
  --status-warning: #f59e0b;
  --status-error: #ef4444;

  --shadow-soft: 0 8px 32px rgba(0, 0, 0, 0.3);
  --shadow-glow: 0 0 20px rgba(14, 165, 233, 0.2);
}

/* Base Body */
body {
  margin: 0;
  padding: 0;
  font-family: var(--font-main);
  background-color: var(--bg-color);
  background-image: 
    radial-gradient(circle at 15% 50%, rgba(14, 165, 233, 0.12), transparent 25%),
    radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.12), transparent 25%);
  background-attachment: fixed;
  color: var(--text-main);
  overflow: hidden;
}

* {
  box-sizing: border-box;
}

/* Layout Wrappers */
.app-body {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* Sidebar Glass */
.main-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-right: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  z-index: 10;
  box-shadow: 4px 0 24px rgba(0,0,0,0.2);
}

.sidebar-brand {
  padding: 24px;
  border-bottom: 1px solid var(--glass-border);
}

.sidebar-brand h1 {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #38bdf8, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.5px;
}

/* Navigation Tabs */
.nav-menu {
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
  gap: 6px;
  overflow-y: auto;
}

.nav-menu .tab {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 12px 16px;
  border-radius: 12px;
  text-align: left;
  font-family: var(--font-main);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.nav-menu .tab:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
  transform: translateX(4px);
}

.nav-menu .tab.active {
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.15), transparent);
  color: var(--accent-primary-hover);
  box-shadow: inset 3px 0 0 var(--accent-primary);
}

/* Topbar Glass */
.topbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 24px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-bottom: 1px solid var(--glass-border);
  z-index: 5;
}

.topbar .actions {
  display: flex;
  gap: 12px;
}

/* Content Layout */
.layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
  padding: 24px;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.layout.tree-hidden {
  grid-template-columns: minmax(0, 1fr);
}

.layout.tree-hidden .tree-panel {
  display: none;
}

.tab-page {
  display: none;
  height: 100%;
  flex-direction: column;
  animation: fadeIn 0.4s ease-out;
}

.tab-page.active {
  display: flex;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Glass Panels */
.panel, .compact-panel, .tree-panel {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-soft);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.panel:hover {
  border-color: var(--glass-highlight);
  box-shadow: var(--shadow-glow);
}

.panel-title, .tree-title {
  padding: 16px 20px;
  font-size: 1rem;
  font-weight: 600;
  border-bottom: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-main);
  letter-spacing: 0.5px;
}

/* Forms & Inputs */
.grid-form, .stock-form, .filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid var(--glass-border);
}

.form-group, .form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

input, select, textarea {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-main);
  padding: 10px 14px;
  border-radius: 8px;
  font-family: var(--font-main);
  font-size: 0.95rem;
  transition: all 0.3s ease;
  outline: none;
}

input:focus, select:focus, textarea:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2);
  background: rgba(15, 23, 42, 0.9);
}

input[type="checkbox"] {
  accent-color: var(--accent-primary);
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Buttons */
button {
  font-family: var(--font-main);
  font-weight: 600;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

button.primary {
  background: linear-gradient(135deg, var(--accent-primary), #2563eb);
  color: #fff;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
}

button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.5);
}

button.primary:active {
  transform: translateY(0);
}

button.secondary, button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  color: var(--text-main);
}

button.secondary:hover, button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

button.danger {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

button.danger:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.5);
}

.file-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  color: var(--text-main);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.file-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.file-button input {
  display: none;
}

/* Tables */
.table-wrap {
  flex: 1;
  overflow: auto;
  border-radius: 0 0 16px 16px;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
}

th {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(10px);
  padding: 14px 16px;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: sticky;
  top: 0;
  z-index: 2;
  border-bottom: 1px solid var(--glass-border);
}

td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  color: var(--text-dark);
  font-size: 0.95rem;
  transition: background 0.2s;
}

tr:hover td {
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-main);
}

tr.selected td {
  background: rgba(14, 165, 233, 0.1);
}

/* Tree view */
.tree {
  padding: 12px;
  overflow-y: auto;
}

.tree-item {
  padding: 6px 0;
}

.tree-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-dark);
}

.tree-content:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}

.tree-content.selected {
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.2), transparent);
  color: var(--accent-primary-hover);
  border-left: 2px solid var(--accent-primary);
}

.tree-toggle {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 4px;
  font-size: 0.8rem;
}

.tree-children {
  padding-left: 20px;
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  margin-left: 12px;
}

/* Scrollbars */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Custom UI specifics for GibLab */
.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.dash-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-soft);
  transition: transform 0.3s ease;
}

.dash-card:hover {
  transform: translateY(-5px);
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-glow);
}

.dash-card .value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--accent-primary-hover);
  margin-bottom: 8px;
}

.dash-card .label {
  color: var(--text-muted);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.status-badge.success {
  background: rgba(16, 185, 129, 0.15);
  color: var(--status-success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-badge.warning {
  background: rgba(245, 158, 11, 0.15);
  color: var(--status-warning);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.15);
  color: var(--status-error);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-color);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  position: relative;
}

/* Toggle Tree Btn */
.show-tree-btn {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 10;
  display: none;
}

/* Responsive Grid Adjustments */
.split-tables, .pricing-layout, .dashboard-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 1024px) {
  .split-tables, .pricing-layout, .dashboard-columns {
    grid-template-columns: 1fr;
  }
}
`;

fs.writeFileSync('public/styles.css', premiumCSS, 'utf8');
console.log("Rewrote styles.css with premium UI!");
