-- =============================================================================
-- MariaDB / MySQL Schema for KixCleen Central Management Platform
-- =============================================================================

-- 1. Users Table (Roles: superadmin, buyer, owner, admin)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NULL,
    company_name VARCHAR(120) NULL,
    role ENUM('superadmin', 'buyer', 'owner', 'admin') NOT NULL DEFAULT 'buyer',
    is_active BOOLEAN DEFAULT TRUE,
    account_status ENUM('invited', 'active', 'deactivated') NOT NULL DEFAULT 'active',
    invite_token_hash VARCHAR(255) NULL,
    invite_expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role_active (role, is_active),
    INDEX idx_users_account_status (account_status)
);

-- 2. Kiosk Machines Table (with Geolocation & Public Locator Metadata)
CREATE TABLE IF NOT EXISTS kiosks (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    address VARCHAR(255) NOT NULL DEFAULT '',
    city VARCHAR(100) NOT NULL DEFAULT '',
    location VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    status ENUM('online', 'offline', 'busy', 'error', 'maintenance') DEFAULT 'offline',
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    operating_hours VARCHAR(120) DEFAULT '8:00 AM - 10:00 PM Daily',
    services_offered VARCHAR(255) DEFAULT 'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer',
    door_locked BOOLEAN DEFAULT FALSE,
    water_level_pct INT DEFAULT 100,
    soap_level_pct INT DEFAULT 100,
    current_order_id VARCHAR(50) NULL,
    current_activity VARCHAR(100) DEFAULT 'Idle',
    last_heartbeat TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_kiosks_public_locator (is_public, is_active, city, status),
    INDEX idx_kiosks_coords (latitude, longitude)
);

-- 3. Kiosk Owners Table (Buyer-to-Kiosk Assignments)
CREATE TABLE IF NOT EXISTS kiosk_owners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kiosk_id VARCHAR(50) NOT NULL,
    buyer_id VARCHAR(50) NOT NULL,
    assigned_by VARCHAR(50) NULL,
    notes VARCHAR(255) NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_kiosk_single_owner (kiosk_id),
    INDEX idx_kiosk_owners_buyer (buyer_id),
    FOREIGN KEY (kiosk_id) REFERENCES kiosks(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Machine Status Table (Reported Machine Status & Timestamps)
CREATE TABLE IF NOT EXISTS machine_status (
    kiosk_id VARCHAR(50) PRIMARY KEY,
    status ENUM('online', 'offline', 'busy', 'error', 'maintenance') NOT NULL DEFAULT 'offline',
    door_locked BOOLEAN DEFAULT FALSE,
    water_level_pct INT DEFAULT 100,
    soap_level_pct INT DEFAULT 100,
    current_order_id VARCHAR(50) NULL,
    current_activity VARCHAR(100) DEFAULT 'Idle',
    error_code VARCHAR(50) NULL,
    last_heartbeat TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_machine_status_heartbeat (last_heartbeat),
    FOREIGN KEY (kiosk_id) REFERENCES kiosks(id) ON DELETE CASCADE
);

-- 5. Customer Transactions Table
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
    INDEX idx_transactions_kiosk_created (kiosk_id, created_at),
    FOREIGN KEY (kiosk_id) REFERENCES kiosks(id) ON DELETE CASCADE
);

-- 6. Machine Hardware Telemetry & Error Logs
CREATE TABLE IF NOT EXISTS machine_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    kiosk_id VARCHAR(50) NOT NULL,
    event_type ENUM('heartbeat', 'door_state', 'cleaning_start', 'cleaning_finish', 'error', 'refill_needed') NOT NULL,
    details JSON NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kiosk_id) REFERENCES kiosks(id) ON DELETE CASCADE
);

-- 7. Push Notification Device Tokens
CREATE TABLE IF NOT EXISTS notification_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    expo_push_token VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
