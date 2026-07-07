const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Move active class on tab buttons
html = html.replace('<button class="tab" data-tab="dashboard">Dashboard</button>', '<button class="tab active" data-tab="dashboard">Dashboard</button>');
html = html.replace('<button class="tab active" data-tab="materials">Materiały</button>', '<button class="tab" data-tab="materials">Materiały</button>');

// 2. Move active class on tab pages
html = html.replace('<section id="dashboardTab" class="tab-page">', '<section id="dashboardTab" class="tab-page active">');
html = html.replace('<section id="materialsTab" class="tab-page active">', '<section id="materialsTab" class="tab-page">');

// Cache bust
html = html.replace(/styles\.css\?v=[0-9.]+/g, 'styles.css');
html = html.replace('styles.css', 'styles.css?v=' + Date.now());

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Changed default tab to Dashboard");
