import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

let pool = null;
let isDbConnected = false;
let hasRunAutoMigration = false;

// Standardized shoe category helper ('Leather Shoes' | 'Other Shoes')
export function normalizeShoeType(rawType) {
  if (!rawType) return 'Other Shoes';
  const val = typeof rawType === 'object' ? rawType.name || rawType.id || '' : String(rawType);
  const lower = val.trim().toLowerCase();
  if (lower.includes('leather')) {
    return 'Leather Shoes';
  }
  return 'Other Shoes';
}

// Standardized service tier helper ('sanitation' | 'disinfection' | 'deodorize')
export function normalizeServiceTier(rawTier, rawName) {
  const combined = `${rawTier || ''} ${rawName || ''}`.trim().toLowerCase();
  if (combined.includes('disinfect') || combined.includes('deep')) {
    return 'disinfection';
  }
  if (combined.includes('deodor')) {
    return 'deodorize';
  }
  return 'sanitation';
}

// Standardized service name helper ('Sanitation' | 'Disinfection' | 'Deodorize')
export function normalizeServiceName(rawName, rawTier) {
  const tier = normalizeServiceTier(rawTier, rawName);
  switch (tier) {
    case 'disinfection':
      return 'Disinfection';
    case 'deodorize':
      return 'Deodorize';
    case 'sanitation':
    default:
      return 'Sanitation';
  }
}

// Standardized add-ons helper ('UV Light Bacterial Removal' & 'Dryer')
export function normalizeAddons(rawAddons) {
  let list = [];
  if (typeof rawAddons === 'string') {
    try {
      list = JSON.parse(rawAddons || '[]');
    } catch {
      list = [];
    }
  } else if (Array.isArray(rawAddons)) {
    list = rawAddons;
  }

  const normalized = [];
  for (const addon of list) {
    const rawName = String(addon.name || addon.id || '').toLowerCase();
    if (rawName.includes('uv') && rawName.includes('dryer')) {
      normalized.push({
        id: 'uv-bacterial',
        name: 'UV Light Bacterial Removal',
        price: 25,
      });
      normalized.push({
        id: 'dryer',
        name: 'Dryer',
        price: 20,
      });
    } else if (rawName.includes('dryer')) {
      normalized.push({
        id: 'dryer',
        name: 'Dryer',
        price: Number(addon.price || 20),
      });
    } else {
      normalized.push({
        id: 'uv-bacterial',
        name: 'UV Light Bacterial Removal',
        price: Number(addon.price || 25),
      });
    }
  }
  return normalized;
}

// Helper to normalize role names across legacy ('owner') and central platform ('buyer', 'superadmin')
export function normalizeUserRole(role) {
  if (!role) return 'buyer';
  const r = String(role).toLowerCase();
  if (r === 'superadmin') return 'superadmin';
  if (r === 'buyer' || r === 'owner') return 'buyer';
  if (r === 'admin') return 'admin';
  return 'buyer';
}

// Active memory store for development fallback when MySQL is offline
export const memoryStore = {
  users: [
    {
      id: 'USR-000-SUPERADMIN',
      username: 'superadmin',
      email: 'superadmin@kixcleen.com',
      password_hash: '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC', // admin1234
      full_name: 'KixCleen Central Super Admin',
      phone: '+63 917 100 0001',
      company_name: 'KixCleen Systems HQ',
      role: 'superadmin',
      is_active: 1,
      account_status: 'active',
      invite_token_hash: null,
      invite_expires_at: null,
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'USR-001-OWNER',
      username: 'owner',
      email: 'owner@kixcleen.com',
      password_hash: '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC', // admin1234
      full_name: 'Aljon Reyes (Metro Kix Buyer)',
      phone: '+63 917 555 0101',
      company_name: 'Metro Kix Ventures Inc.',
      role: 'buyer',
      is_active: 1,
      account_status: 'active',
      invite_token_hash: null,
      invite_expires_at: null,
      created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'USR-002-ADMIN',
      username: 'admin',
      email: 'admin@kixcleen.com',
      password_hash: '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC', // admin1234
      full_name: 'Floor Operations Admin',
      phone: '+63 917 555 0102',
      company_name: 'KixCleen Operations',
      role: 'admin',
      is_active: 1,
      account_status: 'active',
      invite_token_hash: null,
      invite_expires_at: null,
      created_at: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'USR-003-BUYER2',
      username: 'marcosantos',
      email: 'marco.santos@kixpartner.ph',
      password_hash: '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC', // admin1234
      full_name: 'Marco Santos',
      phone: '+63 918 888 2200',
      company_name: 'BGC Clean Kicks Corp.',
      role: 'buyer',
      is_active: 1,
      account_status: 'active',
      invite_token_hash: null,
      invite_expires_at: null,
      created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'USR-SAMPLE-BUYER',
      username: 'sample',
      email: 'sample@kixcleen.com',
      password_hash: '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC', // admin1234
      full_name: 'Sample Kiosk Owner',
      phone: '+63 917 123 4567',
      company_name: 'Sample Kix Ventures',
      role: 'buyer',
      is_active: 1,
      account_status: 'active',
      invite_token_hash: null,
      invite_expires_at: null,
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  kiosks: [
    {
      id: 'KIOSK-01-MAIN',
      name: 'KixCleen Vendo #1 — SM North EDSA',
      address: 'North Avenue cor. EDSA, Brgy. Bagong Pag-asa',
      city: 'Quezon City',
      location: 'Main Building Ground Floor Lobby, Near Entrance B',
      latitude: 14.6565,
      longitude: 121.0305,
      status: 'online',
      is_active: 1,
      is_public: 1,
      operating_hours: '10:00 AM - 10:00 PM Daily',
      services_offered: 'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer',
      door_locked: 0,
      water_level_pct: 88,
      soap_level_pct: 92,
      current_order_id: null,
      current_activity: 'Idle - Awaiting User',
      last_heartbeat: new Date().toISOString(),
      created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'KIOSK-02-BGC',
      name: 'KixCleen Vendo #2 — Bonifacio High Street',
      address: '5th Avenue cor. 28th Street, Bonifacio Global City',
      city: 'Taguig City',
      location: 'B3 Active Zone Walkway, Ground Level',
      latitude: 14.5505,
      longitude: 121.0514,
      status: 'online',
      is_active: 1,
      is_public: 1,
      operating_hours: '24/7 Open Access',
      services_offered: 'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer',
      door_locked: 0,
      water_level_pct: 94,
      soap_level_pct: 89,
      current_order_id: null,
      current_activity: 'Idle - Ready for customer',
      last_heartbeat: new Date().toISOString(),
      created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'KIOSK-03-MAKATI',
      name: 'KixCleen Vendo #3 — Glorietta 4 Hub',
      address: 'Ayala Center, Courtyard Drive',
      city: 'Makati City',
      location: 'Second Floor Fitness & Lifestyle Wing',
      latitude: 14.5509,
      longitude: 121.0244,
      status: 'busy',
      is_active: 1,
      is_public: 1,
      operating_hours: '9:00 AM - 9:00 PM Daily',
      services_offered: 'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer',
      door_locked: 1,
      water_level_pct: 76,
      soap_level_pct: 81,
      current_order_id: 'KIX-20261112-1004',
      current_activity: 'In Progress - Disinfection + UV Cycle',
      last_heartbeat: new Date().toISOString(),
      created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'KIOSK-04-MANILA',
      name: 'KixCleen Vendo #4 — España University Belt',
      address: 'España Blvd cor. P. Noval St., Sampaloc',
      city: 'Manila',
      location: 'Student Commons Arcade, Ground Floor',
      latitude: 14.6091,
      longitude: 120.9894,
      status: 'online',
      is_active: 1,
      is_public: 1,
      operating_hours: '7:00 AM - 11:00 PM Daily',
      services_offered: 'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer',
      door_locked: 0,
      water_level_pct: 91,
      soap_level_pct: 95,
      current_order_id: null,
      current_activity: 'Idle - Ready for customer',
      last_heartbeat: new Date().toISOString(),
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'KIOSK-05-PASIG',
      name: 'KixCleen Vendo #5 — Ortigas Technopoint',
      address: 'Julia Vargas Ave, Ortigas Center',
      city: 'Pasig City',
      location: 'Tower 1 Basement Parking Elevator Lobby',
      latitude: null,
      longitude: null,
      status: 'maintenance',
      is_active: 1,
      is_public: 1,
      operating_hours: '8:00 AM - 8:00 PM Mon-Sat',
      services_offered: 'Sanitation, Disinfection, Deodorize, Dryer',
      door_locked: 0,
      water_level_pct: 45,
      soap_level_pct: 60,
      current_order_id: null,
      current_activity: 'Scheduled Sensor Calibration',
      last_heartbeat: new Date().toISOString(),
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  kiosk_owners: [
    {
      id: 1,
      kiosk_id: 'KIOSK-01-MAIN',
      buyer_id: 'USR-SAMPLE-BUYER',
      assigned_by: 'USR-000-SUPERADMIN',
      notes: 'Primary flagship kiosk unit assigned to Sample Owner',
      assigned_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 2,
      kiosk_id: 'KIOSK-01-MAIN',
      buyer_id: 'USR-001-OWNER',
      assigned_by: 'USR-000-SUPERADMIN',
      notes: 'Primary flagship kiosk unit',
      assigned_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 3,
      kiosk_id: 'KIOSK-02-BGC',
      buyer_id: 'USR-001-OWNER',
      assigned_by: 'USR-000-SUPERADMIN',
      notes: 'Second expansion unit for Metro Kix Ventures',
      assigned_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 4,
      kiosk_id: 'KIOSK-03-MAKATI',
      buyer_id: 'USR-003-BUYER2',
      assigned_by: 'USR-000-SUPERADMIN',
      notes: 'Makati franchise partner unit',
      assigned_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    },
  ],
  machine_status: [
    {
      kiosk_id: 'KIOSK-01-MAIN',
      status: 'online',
      door_locked: 0,
      water_level_pct: 88,
      soap_level_pct: 92,
      current_order_id: null,
      current_activity: 'Idle - Awaiting User',
      error_code: null,
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      kiosk_id: 'KIOSK-02-BGC',
      status: 'online',
      door_locked: 0,
      water_level_pct: 94,
      soap_level_pct: 89,
      current_order_id: null,
      current_activity: 'Idle - Ready for customer',
      error_code: null,
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      kiosk_id: 'KIOSK-03-MAKATI',
      status: 'busy',
      door_locked: 1,
      water_level_pct: 76,
      soap_level_pct: 81,
      current_order_id: 'KIX-20261112-1004',
      current_activity: 'In Progress - Disinfection + UV Cycle',
      error_code: null,
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      kiosk_id: 'KIOSK-04-MANILA',
      status: 'online',
      door_locked: 0,
      water_level_pct: 91,
      soap_level_pct: 95,
      current_order_id: null,
      current_activity: 'Idle - Ready for customer',
      error_code: null,
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      kiosk_id: 'KIOSK-05-PASIG',
      status: 'maintenance',
      door_locked: 0,
      water_level_pct: 45,
      soap_level_pct: 60,
      current_order_id: null,
      current_activity: 'Scheduled Sensor Calibration',
      error_code: null,
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  transactions: [
    {
      id: 'TX-1001',
      order_id: 'KIX-20261109-1001',
      kiosk_id: 'KIOSK-01-MAIN',
      shoe_type: 'Other Shoes',
      service_tier: 'disinfection',
      service_name: 'Disinfection',
      addons: JSON.stringify([
        { id: 'uv-bacterial', name: 'UV Light Bacterial Removal', price: 25 },
        { id: 'dryer', name: 'Dryer', price: 20 },
      ]),
      base_price: 50.0,
      addons_price: 45.0,
      total_amount: 95.0,
      payment_method: 'gcash',
      payment_status: 'paid',
      payment_ref: 'xnd_inv_89324',
      cleaning_status: 'completed',
      started_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    },
    {
      id: 'TX-1002',
      order_id: 'KIX-20261109-1002',
      kiosk_id: 'KIOSK-01-MAIN',
      shoe_type: 'Other Shoes',
      service_tier: 'sanitation',
      service_name: 'Sanitation',
      addons: JSON.stringify([{ id: 'dryer', name: 'Dryer', price: 20 }]),
      base_price: 30.0,
      addons_price: 20.0,
      total_amount: 50.0,
      payment_method: 'cash',
      payment_status: 'paid',
      payment_ref: 'cash_bill_0918',
      cleaning_status: 'completed',
      started_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    },
    {
      id: 'TX-1003',
      order_id: 'KIX-20261109-1003',
      kiosk_id: 'KIOSK-02-BGC',
      shoe_type: 'Leather Shoes',
      service_tier: 'deodorize',
      service_name: 'Deodorize',
      addons: JSON.stringify([{ id: 'uv-bacterial', name: 'UV Light Bacterial Removal', price: 25 }]),
      base_price: 40.0,
      addons_price: 25.0,
      total_amount: 65.0,
      payment_method: 'maya',
      payment_status: 'paid',
      payment_ref: 'xnd_inv_99411',
      cleaning_status: 'completed',
      started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: 'TX-1004',
      order_id: 'KIX-20261112-1004',
      kiosk_id: 'KIOSK-03-MAKATI',
      shoe_type: 'Other Shoes',
      service_tier: 'disinfection',
      service_name: 'Disinfection',
      addons: JSON.stringify([{ id: 'uv-bacterial', name: 'UV Light Bacterial Removal', price: 25 }]),
      base_price: 50.0,
      addons_price: 25.0,
      total_amount: 75.0,
      payment_method: 'gcash',
      payment_status: 'paid',
      payment_ref: 'xnd_inv_77210',
      cleaning_status: 'in_progress',
      started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      completed_at: null,
      created_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    },
  ],
  tokens: [],
};

async function ensureMySqlSchemaUpgraded(dbPool) {
  if (hasRunAutoMigration) return;
  hasRunAutoMigration = true;

  const dbName = process.env.DB_NAME || 'kixcleen_db';
  try {
    const safeAddCol = async (table, col, def) => {
      const [rows] = await dbPool.query(
        'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        [dbName, table, col]
      );
      if (rows.length === 0) {
        await dbPool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${def}`);
      }
    };

    await dbPool.query(
      `ALTER TABLE users MODIFY COLUMN role ENUM('superadmin', 'buyer', 'owner', 'admin') NOT NULL DEFAULT 'buyer'`
    );
    await dbPool.query(`ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL`);
    await safeAddCol('users', 'phone', 'VARCHAR(30) NULL AFTER full_name');
    await safeAddCol('users', 'company_name', 'VARCHAR(120) NULL AFTER phone');
    await safeAddCol(
      'users',
      'account_status',
      "ENUM('invited', 'active', 'deactivated') NOT NULL DEFAULT 'active' AFTER is_active"
    );
    await safeAddCol('users', 'invite_token_hash', 'VARCHAR(255) NULL AFTER account_status');
    await safeAddCol('users', 'invite_expires_at', 'TIMESTAMP NULL AFTER invite_token_hash');

    await safeAddCol('kiosks', 'address', "VARCHAR(255) NOT NULL DEFAULT '' AFTER name");
    await safeAddCol('kiosks', 'city', "VARCHAR(100) NOT NULL DEFAULT '' AFTER address");
    await safeAddCol('kiosks', 'latitude', 'DECIMAL(10, 7) NULL AFTER location');
    await safeAddCol('kiosks', 'longitude', 'DECIMAL(10, 7) NULL AFTER latitude');
    await safeAddCol('kiosks', 'is_active', 'BOOLEAN DEFAULT TRUE AFTER status');
    await safeAddCol('kiosks', 'is_public', 'BOOLEAN DEFAULT TRUE AFTER is_active');
    await safeAddCol(
      'kiosks',
      'operating_hours',
      "VARCHAR(120) DEFAULT '8:00 AM - 10:00 PM Daily' AFTER is_public"
    );
    await safeAddCol(
      'kiosks',
      'services_offered',
      "VARCHAR(255) DEFAULT 'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer' AFTER operating_hours"
    );
    await safeAddCol(
      'kiosks',
      'updated_at',
      'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
    );

    await dbPool.query(`
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
      )
    `);

    await dbPool.query(`
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
      )
    `);
  } catch (err) {
    console.warn('[DB Migration] Auto-upgrade check warning:', err.message);
  }
}

export async function getDbConnection() {
  if (isDbConnected && pool) return pool;

  try {
    const testConn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kixcleen_db',
      connectTimeout: 1500,
    });
    await testConn.end();

    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kixcleen_db',
      waitForConnections: true,
      connectionLimit: 10,
    });
    isDbConnected = true;
    await ensureMySqlSchemaUpgraded(pool);
    console.log('✅ Connected to MySQL / MariaDB database.');
    return pool;
  } catch {
    isDbConnected = false;
    return null;
  }
}

export function isConnectedToMariaDb() {
  return isDbConnected;
}

export function saveMemoryStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[DB] Failed to persist memoryStore to disk:', err.message);
  }
}

function ensureSampleBuyerInitialized() {
  const sampleUser = memoryStore.users.find(
    (u) => u.username?.toLowerCase() === 'sample' || u.id === 'USR-SAMPLE-BUYER'
  );
  if (!sampleUser) {
    memoryStore.users.push({
      id: 'USR-SAMPLE-BUYER',
      username: 'sample',
      email: 'sample@kixcleen.com',
      password_hash: '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC', // admin1234
      full_name: 'Sample Kiosk Owner',
      phone: '+63 917 123 4567',
      company_name: 'Sample Kix Ventures',
      role: 'buyer',
      is_active: 1,
      account_status: 'active',
      invite_token_hash: null,
      invite_expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } else {
    sampleUser.account_status = 'active';
    sampleUser.is_active = 1;
    if (!sampleUser.password_hash) {
      sampleUser.password_hash = '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC';
    }
  }

  const sampleAssignment = memoryStore.kiosk_owners.find(
    (ko) => ko.kiosk_id === 'KIOSK-01-MAIN' && (ko.buyer_id === 'USR-SAMPLE-BUYER' || ko.buyer_id === sampleUser?.id)
  );
  if (!sampleAssignment) {
    memoryStore.kiosk_owners.unshift({
      id: Date.now(),
      kiosk_id: 'KIOSK-01-MAIN',
      buyer_id: sampleUser?.id || 'USR-SAMPLE-BUYER',
      assigned_by: 'USR-000-SUPERADMIN',
      notes: 'Primary flagship kiosk unit assigned to Sample Owner',
      assigned_at: new Date().toISOString(),
    });
  }
}

export function loadMemoryStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        if (Array.isArray(data.users)) memoryStore.users = data.users;
        if (Array.isArray(data.kiosks)) memoryStore.kiosks = data.kiosks;
        if (Array.isArray(data.kiosk_owners)) memoryStore.kiosk_owners = data.kiosk_owners;
        if (Array.isArray(data.machine_status)) memoryStore.machine_status = data.machine_status;
        if (Array.isArray(data.transactions)) memoryStore.transactions = data.transactions;
        if (Array.isArray(data.tokens)) memoryStore.tokens = data.tokens;
      }
    }
    ensureSampleBuyerInitialized();
    saveMemoryStore();
  } catch (err) {
    console.warn('[DB] Error loading persisted store, falling back to seed:', err.message);
  }
}

// Automatically load persisted store on module load
loadMemoryStore();

/**
 * Resolve all kiosk IDs assigned to a given buyer.
 * Returns null if the user is a superadmin or admin (meaning unrestricted access to all kiosks),
 * or an array of assigned kiosk ID strings for a buyer/owner.
 */
export async function getAuthorizedKioskIdsForUser(user) {
  if (!user) return [];
  const normRole = normalizeUserRole(user.role);
  if (normRole === 'superadmin' || normRole === 'admin') {
    return null; // Unrestricted
  }

  const isSampleUser = user.username?.toLowerCase() === 'sample' || user.id === 'USR-SAMPLE-BUYER';

  const db = await getDbConnection();
  if (db) {
    const [rows] = await db.query(
      'SELECT kiosk_id FROM kiosk_owners WHERE buyer_id = ? ORDER BY assigned_at ASC',
      [user.id]
    );
    const assigned = rows.map((r) => r.kiosk_id);
    if (assigned.length === 0 && isSampleUser) {
      return ['KIOSK-01-MAIN'];
    }
    return assigned;
  } else {
    const assigned = memoryStore.kiosk_owners
      .filter((ko) => ko.buyer_id === user.id)
      .map((ko) => ko.kiosk_id);
    if (assigned.length === 0 && isSampleUser) {
      return ['KIOSK-01-MAIN'];
    }
    return assigned;
  }
}

/**
 * Helper to check if latitude & longitude are valid real-world numbers.
 */
export function hasValidCoordinates(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined || lat === '' || lng === '') {
    return false;
  }
  const numLat = Number(lat);
  const numLng = Number(lng);
  return (
    Number.isFinite(numLat) &&
    Number.isFinite(numLng) &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLng >= -180 &&
    numLng <= 180
  );
}

/**
 * Check whether an owner user has completed the kiosk onboarding setup.
 * Returns true for superadmin/admin or if user already marked onboarding_completed,
 * or if at least one of their assigned kiosks has registered coordinates.
 */
export async function checkUserOnboardingStatus(user, assignedKioskIds) {
  if (!user) return true;
  const normRole = normalizeUserRole(user.role);
  if (normRole === 'superadmin' || normRole === 'admin') {
    return true;
  }
  if (user.onboarding_completed === 1 || user.onboarding_completed === true) {
    return true;
  }
  const kioskIds = assignedKioskIds !== undefined ? assignedKioskIds : await getAuthorizedKioskIdsForUser(user);
  if (!kioskIds || kioskIds.length === 0) {
    return false;
  }
  const db = await getDbConnection();
  if (db) {
    const [rows] = await db.query(
      'SELECT latitude, longitude FROM kiosks WHERE id IN (?) LIMIT 10',
      [kioskIds]
    );
    return rows.some((k) => hasValidCoordinates(k.latitude, k.longitude));
  } else {
    const kiosks = memoryStore.kiosks.filter((k) => kioskIds.includes(k.id));
    return kiosks.some((k) => hasValidCoordinates(k.latitude, k.longitude));
  }
}
