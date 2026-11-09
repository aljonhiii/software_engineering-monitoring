import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;
let isDbConnected = false;

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
      shoe_type: 'Sneakers',
      service_tier: 'deep',
      service_name: 'Deep Clean',
      addons: JSON.stringify([{ name: 'Anti-Bacterial Deodorizer', price: 30 }]),
      base_price: 120.0,
      addons_price: 30.0,
      total_amount: 150.0,
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
      shoe_type: 'Sports / Running',
      service_tier: 'quick',
      service_name: 'Quick Clean',
      addons: JSON.stringify([]),
      base_price: 80.0,
      addons_price: 0.0,
      total_amount: 80.0,
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
      shoe_type: 'Leather / Formal',
      service_tier: 'standard',
      service_name: 'Standard Clean',
      addons: JSON.stringify([{ name: 'Water-Repellent Nano Coating', price: 50 }]),
      base_price: 100.0,
      addons_price: 50.0,
      total_amount: 150.0,
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
