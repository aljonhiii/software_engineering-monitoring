-- Default Seed Data for KixCleen Monitor

-- Default Users (Password: admin1234)
INSERT INTO users (id, username, email, password_hash, full_name, role)
VALUES 
('USR-001-OWNER', 'owner', 'owner@kixcleen.com', '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC', 'Chief Executive Owner', 'owner'),
('USR-002-ADMIN', 'admin', 'admin@kixcleen.com', '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC', 'Floor Operations Admin', 'admin')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- Default Kiosk Machine
INSERT INTO kiosks (id, name, location, status, door_locked, water_level_pct, soap_level_pct, current_activity, last_heartbeat)
VALUES
('KIOSK-01-MAIN', 'KixCleen Vendo #1', 'Building Main Lobby, Ground Floor', 'online', FALSE, 88, 92, 'Idle - Awaiting User', NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Sample Transactions
INSERT INTO transactions (
  id, order_id, kiosk_id, shoe_type, service_tier, service_name, addons,
  base_price, addons_price, total_amount, payment_method, payment_status,
  payment_ref, cleaning_status, started_at, completed_at, created_at
) VALUES
('TX-1001', 'KIX-20261109-1001', 'KIOSK-01-MAIN', 'Sneakers', 'deep', 'Deep Clean', '[{"name":"Anti-Bacterial Deodorizer","price":30}]', 120.00, 30.00, 150.00, 'gcash', 'paid', 'xnd_inv_89324', 'completed', DATE_SUB(NOW(), INTERVAL 45 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 48 MINUTE)),
('TX-1002', 'KIX-20261109-1002', 'KIOSK-01-MAIN', 'Sports / Running', 'quick', 'Quick Clean', '[]', 80.00, 0.00, 80.00, 'cash', 'paid', 'cash_bill_0918', 'completed', DATE_SUB(NOW(), INTERVAL 25 MINUTE), DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_SUB(NOW(), INTERVAL 28 MINUTE)),
('TX-1003', 'KIX-20261109-1003', 'KIOSK-01-MAIN', 'Leather / Formal', 'standard', 'Standard Clean', '[{"name":"Water-Repellent Nano Coating","price":50}]', 100.00, 50.00, 150.00, 'maya', 'paid', 'xnd_inv_99411', 'completed', DATE_SUB(NOW(), INTERVAL 10 MINUTE), DATE_SUB(NOW(), INTERVAL 2 MINUTE), DATE_SUB(NOW(), INTERVAL 12 MINUTE))
ON DUPLICATE KEY UPDATE total_amount=VALUES(total_amount);
