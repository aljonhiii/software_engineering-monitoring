import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log('🔄 Initializing KixCleen MariaDB database...');

  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'kixcleen_db';

  try {
    // 1. Connect without selecting database to ensure it exists
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
    });

    console.log(`🔌 Connected to MariaDB/MySQL server at ${host}:${port}`);

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Database \`${database}\` verified/created.`);

    await connection.changeUser({ database });

    // 2. Read and run schema.sql
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await connection.query(schemaSql);
    console.log('✅ Schema tables successfully created.');

    // 3. Read and run seed.sql
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
    await connection.query(seedSql);
    console.log('✅ Seed data successfully inserted (Owner & Admin created).');

    await connection.end();
    console.log('🎉 MariaDB initialization completed successfully!');
  } catch (err) {
    console.error('❌ Failed to initialize database:');
    console.error(err.message);
    console.log('\n💡 Tip: Make sure MariaDB/MySQL is running on port 3306 (or check your .env settings).');
    process.exit(1);
  }
}

initDatabase();
