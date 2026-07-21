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

  console.log(`Connecting to MySQL at ${host}:${port}...`);
  const rootConn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await rootConn.query(schema);
  await rootConn.end();

  const pool = await mysql.createConnection({ host, port, user, password, database });

  const hash = await bcrypt.hash(process.env.SEED_PASSWORD || 'password123', 10);

  const users = [
    ['usr-1', 'Amos Mwakalila', 'admin', 'Admin', 'bg-teal-600'],
    ['usr-2', 'Salome John', 'store', 'Store Keeper', 'bg-emerald-600'],
    ['usr-3', 'Bahati Hamisi', 'cashier', 'Cashier', 'bg-amber-600'],
    ['usr-4', 'Emmanuel Massawe', 'wholesale', 'Wholesale Sales', 'bg-cyan-600'],
    ['usr-5', 'Grace Mlay', 'retail', 'Retail Sales', 'bg-pink-600'],
  ];

  for (const [id, name, username, role, color] of users) {
    await pool.execute(
      `INSERT INTO users (id, name, username, password_hash, role, active, avatar_color)
       VALUES (?,?,?,?,?,1,?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash), role=VALUES(role), active=1`,
      [id, name, username, hash, role, color]
    );
  }

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
     ON DUPLICATE KEY UPDATE name=VALUES(name)`
  );

  await pool.execute(
    `INSERT INTO customers (id, name, phone, email, type, address, outstanding_balance)
     VALUES ('cust-2', 'Mussa Juma (Transport Agent)', '0712345678', 'mussa@transport.co.tz', 'Wholesale', 'Kariakoo, Dar es Salaam', 120000)
     ON DUPLICATE KEY UPDATE name=VALUES(name)`
  );

  await pool.execute(
    `INSERT INTO vehicles (id, customer_id, plate_number, make, model, year)
     VALUES ('veh-1', 'cust-2', 'T 456 DKJ', 'Toyota', 'Dyna', '2015')
     ON DUPLICATE KEY UPDATE plate_number=VALUES(plate_number)`
  );
  await pool.execute(
    `INSERT INTO vehicles (id, customer_id, plate_number, make, model, year)
     VALUES ('veh-2', 'cust-2', 'T 890 BCD', 'Scania', 'R480', '2012')
     ON DUPLICATE KEY UPDATE plate_number=VALUES(plate_number)`
  );

  await pool.execute(
    `INSERT INTO business_settings (id, business_name, address, phone, email, currency, receipt_footer, last_backup_date)
     VALUES (1, 'ADAMU AUTO SPARES', 'Mtaa wa Gerezani / Sikukuu, Kariakoo, Dar es Salaam',
       '+255 712 345 678', 'sales@adamuspares.co.tz', 'TZS',
       'Asante kwa kununua vipuri halisi! Hakuna kurejesha bidhaa bila risiti.', NULL)
     ON DUPLICATE KEY UPDATE business_name=VALUES(business_name)`
  );

  await pool.end();
  console.log('Seed complete.');
  console.log(`Default password for all users: ${process.env.SEED_PASSWORD || 'password123'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
