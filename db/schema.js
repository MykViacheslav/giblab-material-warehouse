export function initializeSchema(db) {
  db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY,
    paren_id INTEGER,
    isfolder INTEGER NOT NULL DEFAULT 0,
    code TEXT DEFAULT '',
    name TEXT NOT NULL,
    unit TEXT DEFAULT '',
    price REAL,
    thickness REAL,
    length REAL,
    width REAL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS stock (
    material_id INTEGER PRIMARY KEY REFERENCES materials(id) ON DELETE CASCADE,
    quantity REAL NOT NULL DEFAULT 0,
    reserved REAL NOT NULL DEFAULT 0,
    used REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS offcuts (
    id TEXT PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    code TEXT DEFAULT '',
    length REAL NOT NULL,
    width REAL NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    is_business INTEGER NOT NULL DEFAULT 0,
    project_name TEXT DEFAULT '',
    project_path TEXT DEFAULT '',
    storage_location TEXT DEFAULT '',
    storage_note TEXT DEFAULT '',
    reserved_by TEXT DEFAULT '',
    reserved_at TEXT DEFAULT '',
    reserved_project TEXT DEFAULT '',
    source_station TEXT DEFAULT '',
    used_by TEXT DEFAULT '',
    used_at TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'available',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS offcut_storage_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    min_long_side REAL NOT NULL DEFAULT 0,
    max_long_side REAL NOT NULL DEFAULT 10000,
    min_short_side REAL NOT NULL DEFAULT 0,
    max_short_side REAL NOT NULL DEFAULT 10000,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS stock_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    note TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    address TEXT DEFAULT '',
    tax_id TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    deleted_at TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    project_path TEXT DEFAULT '',
    order_date TEXT DEFAULT '',
    due_date TEXT DEFAULT '',
    production_status TEXT NOT NULL DEFAULT 'Nowe',
    payment_status TEXT NOT NULL DEFAULT 'Nie zapłacone',
    payment_status_manual INTEGER NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    payment_date TEXT NOT NULL DEFAULT CURRENT_DATE,
    method TEXT DEFAULT '',
    payer_name TEXT DEFAULT '',
    received_by TEXT DEFAULT '',
    note TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS integration_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    event_type TEXT NOT NULL,
    headers_json TEXT DEFAULT '',
    body TEXT DEFAULT '',
    result_json TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS price_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT DEFAULT '',
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'szt.',
    unit_price REAL NOT NULL DEFAULT 0,
    category TEXT DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS supplies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL DEFAULT '',
    code TEXT DEFAULT '',
    name TEXT NOT NULL,
    unit TEXT DEFAULT '',
    price REAL NOT NULL DEFAULT 0,
    quantity REAL NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier TEXT DEFAULT '',
    document_number TEXT DEFAULT '',
    delivery_date TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    notes TEXT DEFAULT '',
    posted_at TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS delivery_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    material_code TEXT DEFAULT '',
    material_name TEXT DEFAULT '',
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS delivery_corrections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_delivery_id INTEGER NOT NULL REFERENCES deliveries(id),
    correction_number TEXT DEFAULT '',
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    note TEXT DEFAULT '',
    total_net_delta REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    posted_at TEXT DEFAULT '',
    cancelled_at TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS delivery_correction_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    correction_id INTEGER NOT NULL REFERENCES delivery_corrections(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materials(id),
    quantity_delta REAL NOT NULL,
    unit_price_net REAL DEFAULT 0,
    line_total_net_delta REAL DEFAULT 0,
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS quote_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    cut_job_id INTEGER REFERENCES cut_jobs(id) ON DELETE SET NULL,
    price_item_id INTEGER REFERENCES price_items(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'szt.',
    quantity REAL NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0,
    line_total REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cut_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    material_code TEXT DEFAULT '',
    material_name TEXT DEFAULT '',
    edge_material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    edge_material_code TEXT DEFAULT '',
    edge_material_name TEXT DEFAULT '',
    edge_meters_actual REAL,
    board_m2_actual REAL,
    board_sheets_actual REAL,
    status TEXT NOT NULL DEFAULT 'Robocze',
    source_file TEXT DEFAULT '',
    export_path TEXT DEFAULT '',
    project_path TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cut_parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cut_job_id INTEGER NOT NULL REFERENCES cut_jobs(id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    material_code TEXT DEFAULT '',
    material_name TEXT DEFAULT '',
    thickness REAL,
    length REAL NOT NULL,
    width REAL NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    texture INTEGER NOT NULL DEFAULT 1,
    name TEXT DEFAULT '',
    edge_top TEXT DEFAULT '',
    edge_bottom TEXT DEFAULT '',
    edge_left TEXT DEFAULT '',
    edge_right TEXT DEFAULT '',
    work_milling INTEGER NOT NULL DEFAULT 0,
    work_drilling INTEGER NOT NULL DEFAULT 0,
    work_lacquer INTEGER NOT NULL DEFAULT 0,
    work_other INTEGER NOT NULL DEFAULT 0,
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
}
