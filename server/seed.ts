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

  // Safe migrations for existing databases
  const alters = [
    'ALTER TABLE products ADD COLUMN pack_size INT NOT NULL DEFAULT 1',
    'ALTER TABLE products ADD COLUMN bin_location VARCHAR(80) NULL',
    'ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0',
    'ALTER TABLE orders ADD COLUMN tax_rate DECIMAL(6,2) NOT NULL DEFAULT 0',
    'ALTER TABLE business_settings ADD COLUMN tax_enabled TINYINT(1) NOT NULL DEFAULT 1',
    'ALTER TABLE business_settings ADD COLUMN tax_rate DECIMAL(6,2) NOT NULL DEFAULT 18',
    'ALTER TABLE business_settings ADD COLUMN thermal_printer_width_mm INT NOT NULL DEFAULT 80',
  ];
  for (const sql of alters) {
    try {
      await pool.query(sql);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code !== 'ER_DUP_FIELDNAME') throw err;
    }
  }

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
    ['cat-1', 'Mfumo wa Injini', 'Pistoni, gasket, mikanda ya timing na bearing za injini'],
    ['cat-2', 'Mfumo wa Breki', 'Brake pads, dumu za breki, caliper na mafuta ya breki'],
    ['cat-3', 'Mfumo wa Umeme', 'Alternator, mota ya kuanzia (starter), spark plugs na betri'],
    ['cat-4', 'Susa na Gia', 'Shock absorbers, bush, rack ends, na gia za gari'],
    ['cat-5', 'Vichujio na Kilainishi', 'Oil filter, fuel filter, air filter na mafuta ya injini'],
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
