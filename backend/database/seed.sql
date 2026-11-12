-- =============================================================================
-- Default Seed Data for KixCleen Central Management Platform
-- Default Password for active accounts: admin1234
-- =============================================================================

-- 1. Seed Users (Super Admin, Buyers, and Legacy Owner/Admin)
INSERT INTO users (id, username, email, password_hash, full_name, phone, company_name, role, is_active, account_status)
VALUES 
('USR-000-SUPERADMIN', 'superadmin', 'superadmin@kixcleen.com', '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC', 'KixCleen Central Super Admin', '+63 917 100 0001', 'KixCleen Systems HQ', 'superadmin', TRUE, 'active'),
('USR-001-OWNER', 'owner', 'owner@kixcleen.com', '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC', 'Aljon Reyes (Metro Kix Buyer)', '+63 917 555 0101', 'Metro Kix Ventures Inc.', 'buyer', TRUE, 'active'),
('USR-002-ADMIN', 'admin', 'admin@kixcleen.com', '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC', 'Floor Operations Admin', '+63 917 555 0102', 'KixCleen Operations', 'admin', TRUE, 'active'),
('USR-003-BUYER2', 'marcosantos', 'marco.santos@kixpartner.ph', '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC', 'Marco Santos', '+63 918 888 2200', 'BGC Clean Kicks Corp.', 'buyer', TRUE, 'active')
ON DUPLICATE KEY UPDATE
  full_name=VALUES(full_name),
  phone=VALUES(phone),
  company_name=VALUES(company_name),
  role=VALUES(role),
  is_active=VALUES(is_active),
  account_status=VALUES(account_status);

-- 2. Seed Registered Kiosks
INSERT INTO kiosks (
  id, name, address, city, location, latitude, longitude,
  status, is_active, is_public, operating_hours, services_offered,
  door_locked, water_level_pct, soap_level_pct, current_activity, last_heartbeat
) VALUES
('KIOSK-01-MAIN', 'KixCleen Vendo #1 — SM North EDSA', 'North Avenue cor. EDSA, Brgy. Bagong Pag-asa', 'Quezon City', 'Main Building Ground Floor Lobby, Near Entrance B', 14.6565000, 121.0305000, 'online', TRUE, TRUE, '10:00 AM - 10:00 PM Daily', 'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer', FALSE, 88, 92, 'Idle - Awaiting User', NOW()),
('KIOSK-02-BGC', 'KixCleen Vendo #2 — Bonifacio High Street', '5th Avenue cor. 28th Street, Bonifacio Global City', 'Taguig City', 'B3 Active Zone Walkway, Ground Level', 14.5505000, 121.0514000, 'online', TRUE, TRUE, '24/7 Open Access', 'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer', FALSE, 94, 89, 'Idle - Ready for customer', NOW()),
('KIOSK-03-MAKATI', 'KixCleen Vendo #3 — Glorietta 4 Hub', 'Ayala Center, Courtyard Drive', 'Makati City', 'Second Floor Fitness & Lifestyle Wing', 14.5509000, 121.0244000, 'busy', TRUE, TRUE, '9:00 AM - 9:00 PM Daily', 'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer', TRUE, 76, 81, 'In Progress - Disinfection + UV Cycle', NOW()),
('KIOSK-04-MANILA', 'KixCleen Vendo #4 — España University Belt', 'España Blvd cor. P. Noval St., Sampaloc', 'Manila', 'Student Commons Arcade, Ground Floor', 14.6091000, 120.9894000, 'online', TRUE, TRUE, '7:00 AM - 11:00 PM Daily', 'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer', FALSE, 91, 95, 'Idle - Ready for customer', NOW()),
('KIOSK-05-PASIG', 'KixCleen Vendo #5 — Ortigas Technopoint', 'Julia Vargas Ave, Ortigas Center', 'Pasig City', 'Tower 1 Basement Parking Elevator Lobby', NULL, NULL, 'maintenance', TRUE, TRUE, '8:00 AM - 8:00 PM Mon-Sat', 'Sanitation, Disinfection, Deodorize, Dryer', FALSE, 45, 60, 'Scheduled Sensor Calibration', NOW())
ON DUPLICATE KEY UPDATE
  name=VALUES(name),
  address=VALUES(address),
  city=VALUES(city),
  location=VALUES(location),
  latitude=VALUES(latitude),
  longitude=VALUES(longitude),
  is_active=VALUES(is_active),
  is_public=VALUES(is_public),
  operating_hours=VALUES(operating_hours);

-- 3. Seed Machine Status Records
INSERT INTO machine_status (
  kiosk_id, status, door_locked, water_level_pct, soap_level_pct, current_order_id, current_activity, last_heartbeat
) VALUES
('KIOSK-01-MAIN', 'online', FALSE, 88, 92, NULL, 'Idle - Awaiting User', NOW()),
('KIOSK-02-BGC', 'online', FALSE, 94, 89, NULL, 'Idle - Ready for customer', NOW()),
('KIOSK-03-MAKATI', 'busy', TRUE, 76, 81, 'KIX-20261112-1004', 'In Progress - Disinfection + UV Cycle', NOW()),
('KIOSK-04-MANILA', 'online', FALSE, 91, 95, NULL, 'Idle - Ready for customer', NOW()),
('KIOSK-05-PASIG', 'maintenance', FALSE, 45, 60, NULL, 'Scheduled Sensor Calibration', NOW())
ON DUPLICATE KEY UPDATE
  status=VALUES(status),
  water_level_pct=VALUES(water_level_pct),
  soap_level_pct=VALUES(soap_level_pct),
  current_activity=VALUES(current_activity),
  last_heartbeat=VALUES(last_heartbeat);

-- 4. Seed Kiosk Ownership Assignments (kiosk_owners)
-- USR-001-OWNER owns KIOSK-01-MAIN and KIOSK-02-BGC
-- USR-003-BUYER2 owns KIOSK-03-MAKATI
-- KIOSK-04-MANILA and KIOSK-05-PASIG remain unassigned initially
INSERT INTO kiosk_owners (kiosk_id, buyer_id, assigned_by, notes)
VALUES
('KIOSK-01-MAIN', 'USR-001-OWNER', 'USR-000-SUPERADMIN', 'Primary flagship kiosk unit'),
('KIOSK-02-BGC', 'USR-001-OWNER', 'USR-000-SUPERADMIN', 'Second expansion unit for Metro Kix Ventures'),
('KIOSK-03-MAKATI', 'USR-003-BUYER2', 'USR-000-SUPERADMIN', 'Makati franchise partner unit')
ON DUPLICATE KEY UPDATE
  buyer_id=VALUES(buyer_id),
  assigned_by=VALUES(assigned_by),
  notes=VALUES(notes);

-- 5. Seed Sample Transactions across Kiosks
INSERT INTO transactions (
  id, order_id, kiosk_id, shoe_type, service_tier, service_name, addons,
  base_price, addons_price, total_amount, payment_method, payment_status,
  payment_ref, cleaning_status, started_at, completed_at, created_at
) VALUES
('TX-1001', 'KIX-20261109-1001', 'KIOSK-01-MAIN', 'Other Shoes', 'disinfection', 'Disinfection', '[{"id":"uv-bacterial","name":"UV Light Bacterial Removal","price":25},{"id":"dryer","name":"Dryer","price":20}]', 50.00, 45.00, 95.00, 'gcash', 'paid', 'xnd_inv_89324', 'completed', DATE_SUB(NOW(), INTERVAL 45 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 48 MINUTE)),
('TX-1002', 'KIX-20261109-1002', 'KIOSK-01-MAIN', 'Other Shoes', 'sanitation', 'Sanitation', '[{"id":"dryer","name":"Dryer","price":20}]', 30.00, 20.00, 50.00, 'cash', 'paid', 'cash_bill_0918', 'completed', DATE_SUB(NOW(), INTERVAL 25 MINUTE), DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_SUB(NOW(), INTERVAL 28 MINUTE)),
('TX-1003', 'KIX-20261109-1003', 'KIOSK-02-BGC', 'Leather Shoes', 'deodorize', 'Deodorize', '[{"id":"uv-bacterial","name":"UV Light Bacterial Removal","price":25}]', 40.00, 25.00, 65.00, 'maya', 'paid', 'xnd_inv_99411', 'completed', DATE_SUB(NOW(), INTERVAL 10 MINUTE), DATE_SUB(NOW(), INTERVAL 2 MINUTE), DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
('TX-1004', 'KIX-20261112-1004', 'KIOSK-03-MAKATI', 'Other Shoes', 'disinfection', 'Disinfection', '[{"id":"uv-bacterial","name":"UV Light Bacterial Removal","price":25}]', 50.00, 25.00, 75.00, 'gcash', 'paid', 'xnd_inv_77210', 'in_progress', DATE_SUB(NOW(), INTERVAL 5 MINUTE), NULL, DATE_SUB(NOW(), INTERVAL 6 MINUTE))
ON DUPLICATE KEY UPDATE
  kiosk_id=VALUES(kiosk_id),
  shoe_type=VALUES(shoe_type),
  service_tier=VALUES(service_tier),
  service_name=VALUES(service_name),
  addons=VALUES(addons),
  base_price=VALUES(base_price),
  addons_price=VALUES(addons_price),
  total_amount=VALUES(total_amount);
