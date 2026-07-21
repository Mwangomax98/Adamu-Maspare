/**
 * Optional demo catalog seed (does NOT wipe admin users or settings).
 * Adds sample products, wholesale/retail customers, and suppliers.
 *
 * Usage: npm run db:seed-demo
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { DEMO_PRODUCTS, DEMO_CUSTOMERS, DEMO_SUPPLIERS } from '../src/data/demoCatalog.ts';
import { runMigrations } from './migrate.js';

dotenv.config();

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'adamu_maspare';

  const pool = await mysql.createConnection({ host, port, user, password, database });

  await runMigrations(pool);

  let products = 0;
  for (let i = 0; i < DEMO_PRODUCTS.length; i++) {
    const p = DEMO_PRODUCTS[i];
    const id = `prod-demo-${String(i + 1).padStart(3, '0')}`;
    await pool.execute(
      `INSERT INTO products (
        id, name, sku, barcode, category, cost_price, retail_price, wholesale_price,
        stock, min_stock_level, unit, part_number, brand, compatibility, \`condition\`,
        warranty_days, must_sell_as_pair, pack_size, bin_location
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), stock=VALUES(stock), pack_size=VALUES(pack_size), bin_location=VALUES(bin_location)`,
      [
        id, p.name, p.sku, p.barcode, p.category, p.costPrice, p.retailPrice, p.wholesalePrice,
        p.stock, p.minStockLevel, p.unit, p.partNumber, p.brand, p.compatibility, p.condition,
        p.warrantyDays ?? 0, p.mustSellAsPair ? 1 : 0, p.packSize ?? 1, p.binLocation || null,
      ]
    );
    products++;
  }

  let customers = 0;
  for (let i = 0; i < DEMO_CUSTOMERS.length; i++) {
    const c = DEMO_CUSTOMERS[i];
    const id = `cust-demo-${String(i + 1).padStart(3, '0')}`;
    await pool.execute(
      `INSERT INTO customers (id, name, phone, email, type, address, outstanding_balance)
       VALUES (?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), outstanding_balance=VALUES(outstanding_balance)`,
      [id, c.name, c.phone, c.email, c.type, c.address, c.outstandingBalance]
    );
    customers++;
  }

  let suppliers = 0;
  for (let i = 0; i < DEMO_SUPPLIERS.length; i++) {
    const s = DEMO_SUPPLIERS[i];
    const id = `sup-demo-${String(i + 1).padStart(3, '0')}`;
    await pool.execute(
      `INSERT INTO suppliers (id, name, contact_person, phone, email, address)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [id, s.name, s.contactPerson, s.phone, s.email, s.address]
    );
    suppliers++;
  }

  await pool.end();
  console.log(`Demo seed complete: ${products} products, ${customers} customers, ${suppliers} suppliers.`);
  console.log('Production admin/bootstrap users were not modified.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
