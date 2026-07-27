/**
 * Production bootstrap: schema + one Admin + walk-in customer + categories + settings.
 * Removes demo staff/customers and clears transactional shop data.
 *
 * Usage: npm run db:bootstrap
 * Env: ADMIN_PASSWORD (preferred) or SEED_PASSWORD
 */
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { runMigrations } from './migrate.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'adamu_maspare';
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.SEED_PASSWORD || 'ChangeMeNow!';

  console.log(`Connecting to MySQL at ${host}:${port}...`);
  const rootConn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await rootConn.query(schema);
  await rootConn.end();

  const pool = await mysql.createConnection({ host, port, user, password, database });

  await runMigrations(pool);

  // Clear transactional / demo shop data (keep structure)
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of [
    'order_items',
    'orders',
    'product_returns',
    'warranty_claims',
    'stock_movements',
    'expenses',
    'products',
    'vehicles',
  ]) {
    await pool.query(`TRUNCATE TABLE \`${table}\``);
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');

  // Remove demo customers (keep walk-in)
  await pool.execute(`DELETE FROM customers WHERE id <> 'cust-1'`);

  // Remove all users except we will recreate admin
  await pool.execute(`DELETE FROM users`);

  const hash = await bcrypt.hash(adminPassword, 10);
  await pool.execute(
    `INSERT INTO users (id, name, username, password_hash, role, active, avatar_color)
     VALUES ('usr-admin', 'Administrator', 'admin', ?, 'Admin', 1, 'bg-teal-600')`,
    [hash]
  );

  const categories = [
    ['cat-1', 'Bearing na Seals', 'Bearing, valve seals na rubber seals za pikipiki'],
    ['cat-2', 'Injini (pikipiki)', 'Carburetor, block, crank, piston rings, clutch plates'],
    ['cat-3', 'Umeme na Taa', 'Headlamp, plug, magneto coil, switch, indicator'],
    ['cat-4', 'Breki', 'Caliper, brake arm, brake pedal'],
    ['cat-5', 'Transmission / Chain', 'Chain kit, gear lever, flanja, chain adjuster'],
    ['cat-6', 'Mwili na Accessories', 'Footrest, mirror, panel, boot rubber, helmet glass'],
    ['cat-7', 'Filters / Chujio', 'Chujio za mafuta na hewa za pikipiki'],
  ];
  for (const [id, name, description] of categories) {
    await pool.execute(
      `INSERT INTO categories (id, name, description) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description)`,
      [id, name, description]
    );
  }

  await pool.execute(
    `INSERT INTO customers (id, name, phone, email, type, address, outstanding_balance)
     VALUES ('cust-1', 'Mteja wa Kawaida (Walk-in)', 'N/A', 'N/A', 'Retail', 'N/A', 0)
     ON DUPLICATE KEY UPDATE name=VALUES(name), outstanding_balance=0`
  );

  await pool.execute(
    `INSERT INTO business_settings (id, business_name, address, phone, email, currency, receipt_footer, last_backup_date, tax_enabled, tax_rate, thermal_printer_width_mm)
     VALUES (1, 'ADAMU AUTO SPARES', 'Mtaa wa Gerezani / Sikukuu, Kariakoo, Dar es Salaam',
       '+255 712 345 678', 'sales@adamuspares.co.tz', 'TZS',
       'Asante kwa kununua vipuri halisi! Hakuna kurejesha bidhaa bila risiti.', NULL, 1, 18, 80)
     ON DUPLICATE KEY UPDATE business_name=VALUES(business_name), tax_enabled=VALUES(tax_enabled), tax_rate=VALUES(tax_rate), thermal_printer_width_mm=VALUES(thermal_printer_width_mm)`
  );

  await pool.end();
  console.log('Production bootstrap complete.');
  console.log('Login: username=admin');
  console.log('Set ADMIN_PASSWORD in .env (used for this bootstrap). Change it in User Management after first login.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
