/**
 * Non-destructive schema migrations (ADD COLUMN only).
 * Does NOT wipe users, products, or orders.
 *
 * Usage: npm run db:migrate
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const SCHEMA_ALTERS = [
  'ALTER TABLE products ADD COLUMN pack_size INT NOT NULL DEFAULT 1',
  'ALTER TABLE products ADD COLUMN bin_location VARCHAR(80) NULL',
  'ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0',
  'ALTER TABLE orders ADD COLUMN tax_rate DECIMAL(6,2) NOT NULL DEFAULT 0',
  'ALTER TABLE business_settings ADD COLUMN tax_enabled TINYINT(1) NOT NULL DEFAULT 1',
  'ALTER TABLE business_settings ADD COLUMN tax_rate DECIMAL(6,2) NOT NULL DEFAULT 18',
  'ALTER TABLE business_settings ADD COLUMN thermal_printer_width_mm INT NOT NULL DEFAULT 80',
];

export async function runMigrations(conn: mysql.Connection | mysql.Pool): Promise<void> {
  for (const sql of SCHEMA_ALTERS) {
    try {
      await conn.query(sql);
      console.log('Migrated:', sql.slice(0, 80));
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'ER_DUP_FIELDNAME') {
        // already applied
        continue;
      }
      throw err;
    }
  }
}

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'adamu_maspare';

  console.log(`Migrating ${database} at ${host}:${port}...`);
  const conn = await mysql.createConnection({ host, port, user, password, database });
  await runMigrations(conn);
  await conn.end();
  console.log('Migrations complete (no data wiped).');
}

const isDirectRun = process.argv[1]?.includes('migrate');
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
