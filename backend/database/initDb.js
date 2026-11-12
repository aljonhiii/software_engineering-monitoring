import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function safeAlterColumn(connection, database, table, column, definition) {
  const [cols] = await connection.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [database, table, column]
  );
  if (cols.length === 0) {
    await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`  ➕ Added column ${table}.${column}`);
  }
}

async function initDatabase() {
  console.log('🔄 Initializing KixCleen Central Management MySQL/MariaDB database...');

  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'kixcleen_db';

  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
    });

    console.log(`🔌 Connected to MariaDB/MySQL server at ${host}:${port}`);

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(`✅ Database \`${database}\` verified/created.`);

    await connection.changeUser({ database });

    // Run schema.sql (creates tables if they don't exist)
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await connection.query(schemaSql);

    // Upgrade existing tables if migrating from an earlier version
    await connection.query(
      `ALTER TABLE users MODIFY COLUMN role ENUM('superadmin', 'buyer', 'owner', 'admin') NOT NULL DEFAULT 'buyer';`
    );
    await connection.query(
      `ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;`
    );
    await safeAlterColumn(connection, database, 'users', 'phone', 'VARCHAR(30) NULL AFTER full_name');
    await safeAlterColumn(connection, database, 'users', 'company_name', 'VARCHAR(120) NULL AFTER phone');
    await safeAlterColumn(
      connection,
      database,
      'users',
      'account_status',
      "ENUM('invited', 'active', 'deactivated') NOT NULL DEFAULT 'active' AFTER is_active"
    );
    await safeAlterColumn(connection, database, 'users', 'invite_token_hash', 'VARCHAR(255) NULL AFTER account_status');
    await safeAlterColumn(connection, database, 'users', 'invite_expires_at', 'TIMESTAMP NULL AFTER invite_token_hash');

    await safeAlterColumn(connection, database, 'kiosks', 'address', "VARCHAR(255) NOT NULL DEFAULT '' AFTER name");
    await safeAlterColumn(connection, database, 'kiosks', 'city', "VARCHAR(100) NOT NULL DEFAULT '' AFTER address");
    await safeAlterColumn(connection, database, 'kiosks', 'latitude', 'DECIMAL(10, 7) NULL AFTER location');
    await safeAlterColumn(connection, database, 'kiosks', 'longitude', 'DECIMAL(10, 7) NULL AFTER latitude');
    await safeAlterColumn(connection, database, 'kiosks', 'is_active', 'BOOLEAN DEFAULT TRUE AFTER status');
    await safeAlterColumn(connection, database, 'kiosks', 'is_public', 'BOOLEAN DEFAULT TRUE AFTER is_active');
    await safeAlterColumn(
      connection,
      database,
      'kiosks',
      'operating_hours',
      "VARCHAR(120) DEFAULT '8:00 AM - 10:00 PM Daily' AFTER is_public"
    );
    await safeAlterColumn(
      connection,
      database,
      'kiosks',
      'services_offered',
      "VARCHAR(255) DEFAULT 'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer' AFTER operating_hours"
    );
    await safeAlterColumn(
      connection,
      database,
      'kiosks',
      'updated_at',
      'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
    );

    console.log('✅ Schema tables & migrations verified.');

    // Run seed.sql
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
    await connection.query(seedSql);
    console.log('✅ Seed data inserted (Super Admin, Buyers, Kiosks, Kiosk Assignments, Machine Status, Transactions).');

    await connection.end();
    console.log('🎉 MySQL/MariaDB initialization completed successfully!');
  } catch (err) {
    console.error('❌ Failed to initialize database:');
    console.error(err.message);
    console.log('\n💡 Tip: Make sure MariaDB/MySQL is running on port 3306 (or check your .env settings).');
    process.exit(1);
  }
}

initDatabase();
