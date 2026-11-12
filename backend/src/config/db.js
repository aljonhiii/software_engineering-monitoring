import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;
let isDbConnected = false;

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

// Active memory store for development fallback
export const memoryStore = {
  users: [
    {
      id: 'USR-001-OWNER',
      username: 'owner',
      email: 'owner@kixcleen.com',
      password_hash: '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC', // admin1234
      full_name: 'Chief Executive Owner',
      role: 'owner',
      is_active: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'USR-002-ADMIN',
      username: 'admin',
      email: 'admin@kixcleen.com',
      password_hash: '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC', // admin1234
      full_name: 'Floor Operations Admin',
      role: 'admin',
      is_active: 1,
      created_at: new Date().toISOString(),
    },
  ],
  kiosks: [
    {
      id: 'KIOSK-01-MAIN',
      name: 'KixCleen Vendo #1',
      location: 'Building Main Lobby, Ground Floor',
      status: 'online',
      door_locked: 0,
      water_level_pct: 88,
      soap_level_pct: 92,
      current_order_id: null,
      current_activity: 'Idle - Awaiting User',
      last_heartbeat: new Date().toISOString(),
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
      kiosk_id: 'KIOSK-01-MAIN',
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
  ],
  tokens: [],
};

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
    console.log('✅ Connected to MariaDB database.');
    return pool;
  } catch {
    isDbConnected = false;
    return null;
  }
}

export function isConnectedToMariaDb() {
  return isDbConnected;
}
