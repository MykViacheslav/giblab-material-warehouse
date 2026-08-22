# GibLab Klient — proponowany model danych

## clients
- id
- name
- phone
- email
- tax_id
- notes
- telegram_user_id
- active

## orders
- id
- order_number
- client_id
- title
- created_at
- due_date
- status
- source_type
- source_reference
- total_amount
- notes

## order_parts
- id
- order_id
- material_id
- length
- width
- quantity
- thickness
- texture_direction
- edge_top
- edge_bottom
- edge_left
- edge_right
- name
- notes
- ai_confidence
- ai_warning

## materials
- id
- producer
- code
- decor_name
- structure
- material_type
- thickness
- sheet_length
- sheet_width
- supplier
- minimum_stock
- active

## stock
- material_id
- full_sheets
- reserved_sheets

## offcuts
- id
- material_id
- length
- width
- quantity
- shelf_id
- status
- source_order_id
- reserved_order_id
- qr_code
- created_at
- updated_at

## shelves
- id
- code
- name
- material_type
- min_long_side
- max_long_side
- min_short_side
- max_short_side
- min_area
- max_area
- active

## payments
- id
- order_id
- amount
- payment_date
- method
- note

## purchase_needs
Może być obliczane dynamicznie zamiast osobnej tabeli:
- material
- required
- available
- to_buy

## giblab_jobs
- id
- order_id
- project_path
- export_status
- result_status
- fingerprint
- exported_at
- imported_at

## telegram_messages
- id
- client_id
- telegram_user_id
- message_id
- message_type
- source_file
- processing_status
- created_at
