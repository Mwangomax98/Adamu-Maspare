/**
 * Optional demo catalog seed (does NOT wipe admin users or settings).
 * Replaces products with the motorcycle catalog from 31 JOB invoice,
 * upserts motorcycle categories, customers, and suppliers.
 *
 * Usage: npm run db:seed-demo
 *
 * Do NOT run db:bootstrap on production (wipes users/orders).
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { DEMO_PRODUCTS, DEMO_CUSTOMERS, DEMO_SUPPLIERS } from '../src/data/demoCatalog.ts';
import { runMigrations } from './migrate.js';

dotenv.config();

const MOTORCYCLE_CATEGORIES: [string, string, string][] = [
  ['cat-1', 'Bearing na Seals', 'Bearing, valve seals na rubber seals za pikipiki'],
  ['cat-2', 'Injini (pikipiki)', 'Carburetor, block, crank, piston rings, clutch plates'],
  ['cat-3', 'Umeme na Taa', 'Headlamp, plug, magneto coil, switch, indicator'],
  ['cat-4', 'Breki', 'Caliper, brake arm, brake pedal'],
  ['cat-5', 'Transmission / Chain', 'Chain kit, gear lever, flanja, chain adjuster'],
  ['cat-6', 'Mwili na Accessories', 'Footrest, mirror, panel, boot rubber, helmet glass'],
  ['cat-7', 'Filters / Chujio', 'Chujio za mafuta na hewa za pikipiki'],
];

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'adamu_maspare';

  const pool = await mysql.createConnection({ host, port, user, password, database });

  await runMigrations(pool);

  // Safe: order_items store product name/sku snapshots; no FK to products.
  await pool.execute('DELETE FROM products');
  console.log('Cleared existing products.');

  for (const [id, name, description] of MOTORCYCLE_CATEGORIES) {
    await pool.execute(
      `INSERT INTO categories (id, name, description) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description)`,
      [id, name, description]
    );
  }
  console.log(`Upserted ${MOTORCYCLE_CATEGORIES.length} motorcycle categories.`);

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
        name=VALUES(name),
        sku=VALUES(sku),
        barcode=VALUES(barcode),
        category=VALUES(category),
        cost_price=VALUES(cost_price),
        retail_price=VALUES(retail_price),
        wholesale_price=VALUES(wholesale_price),
        stock=VALUES(stock),
        min_stock_level=VALUES(min_stock_level),
        unit=VALUES(unit),
        part_number=VALUES(part_number),
        brand=VALUES(brand),
        compatibility=VALUES(compatibility),
        \`condition\`=VALUES(\`condition\`),
        warranty_days=VALUES(warranty_days),
        must_sell_as_pair=VALUES(must_sell_as_pair),
        pack_size=VALUES(pack_size),
        bin_location=VALUES(bin_location)`,
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
