-- MariaDB Schema for KixCleen Monitor

-- 1. Users Table (Role-Based: Owner & Administrator)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('owner', 'admin') NOT NULL DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Kiosk Machines Table
CREATE TABLE IF NOT EXISTS kiosks (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    status ENUM('online', 'offline', 'busy', 'error', 'maintenance') DEFAULT 'offline',
    door_locked BOOLEAN DEFAULT FALSE,
    water_level_pct INT DEFAULT 100,
    soap_level_pct INT DEFAULT 100,
    current_order_id VARCHAR(50) NULL,
    current_activity VARCHAR(100) DEFAULT 'Idle',
    last_heartbeat TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customer Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    kiosk_id VARCHAR(50) NOT NULL,
    shoe_type VARCHAR(50) NOT NULL,
    service_tier VARCHAR(50) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    addons JSON NULL,
    base_price DECIMAL(10,2) NOT NULL,
    addons_price DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL, -- 'cash', 'gcash', 'maya'
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_ref VARCHAR(100) NULL,
    cleaning_status ENUM('pending', 'in_progress', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kiosk_id) REFERENCES kiosks(id) ON DELETE CASCADE
);

-- 4. Machine Hardware Telemetry & Error Logs
CREATE TABLE IF NOT EXISTS machine_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    kiosk_id VARCHAR(50) NOT NULL,
    event_type ENUM('heartbeat', 'door_state', 'cleaning_start', 'cleaning_finish', 'error', 'refill_needed') NOT NULL,
    details JSON NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kiosk_id) REFERENCES kiosks(id) ON DELETE CASCADE
);

-- 5. Push Notification Device Tokens
CREATE TABLE IF NOT EXISTS notification_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    expo_push_token VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
