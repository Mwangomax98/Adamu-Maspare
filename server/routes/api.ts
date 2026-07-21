import { Router } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool, { withTransaction } from '../db.js';
import { AuthRequest, requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function mapProduct(r: RowDataPacket) {
  return {
    id: r.id,
    name: r.name,
    sku: r.sku,
    barcode: r.barcode,
    category: r.category,
    costPrice: Number(r.cost_price),
    retailPrice: Number(r.retail_price),
    wholesalePrice: Number(r.wholesale_price),
    stock: Number(r.stock),
    minStockLevel: Number(r.min_stock_level),
    unit: r.unit,
    partNumber: r.part_number,
    crossReferences: r.cross_references || undefined,
    brand: r.brand,
    compatibility: r.compatibility,
    chassisEngineNumber: r.chassis_engine_number || undefined,
    condition: r.condition,
    lastSoldDate: r.last_sold_date ? String(r.last_sold_date).slice(0, 10) : undefined,
    warrantyDays: r.warranty_days != null ? Number(r.warranty_days) : undefined,
    image: r.image || undefined,
    mustSellAsPair: Boolean(r.must_sell_as_pair),
  };
}

function mapCustomer(r: RowDataPacket, vehicles: RowDataPacket[] = []) {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    type: r.type,
    address: r.address,
    outstandingBalance: Number(r.outstanding_balance),
    vehicles: vehicles
      .filter((v) => v.customer_id === r.id)
      .map((v) => ({
        id: v.id,
        plateNumber: v.plate_number,
        make: v.make,
        model: v.model,
        year: v.year || undefined,
      })),
  };
}

function mapOrder(r: RowDataPacket, items: RowDataPacket[] = []) {
  return {
    id: r.id,
    orderNumber: r.order_number,
    date: formatDt(r.order_date),
    customerId: r.customer_id,
    customerName: r.customer_name,
    items: items
      .filter((i) => i.order_id === r.id)
      .map((i) => ({
        productId: i.product_id,
        productName: i.product_name,
        price: Number(i.price),
        costPrice: Number(i.cost_price),
        quantity: Number(i.quantity),
        total: Number(i.total),
        source_type: i.source_type || undefined,
        sourced_from: i.sourced_from || undefined,
        partNumber: i.part_number || undefined,
        brand: i.brand || undefined,
        condition: i.condition || undefined,
        warrantyDays: i.warranty_days != null ? Number(i.warranty_days) : undefined,
      })),
    totalAmount: Number(r.total_amount),
    discount: Number(r.discount),
    paidAmount: Number(r.paid_amount),
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    salesType: r.sales_type,
    sellerId: r.seller_id,
    sellerName: r.seller_name,
    dueDate: r.due_date ? String(r.due_date).slice(0, 10) : undefined,
    notes: r.notes || undefined,
    source_type: r.source_type || undefined,
    sourced_from: r.sourced_from || undefined,
    chassisEngineNumber: r.chassis_engine_number || undefined,
    vehicleId: r.vehicle_id || undefined,
    vehiclePlate: r.vehicle_plate || undefined,
  };
}

function formatDt(d: unknown): string {
  if (!d) return '';
  const s = typeof d === 'string' ? d : new Date(d as Date).toISOString();
  return s.replace('T', ' ').substring(0, 16);
}

function nowStr() {
  return new Date().toISOString().replace('T', ' ').substring(0, 16);
}

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---------- Bootstrap / sync ----------
router.get('/bootstrap', async (_req, res) => {
  try {
    const [products] = await pool.query<RowDataPacket[]>('SELECT * FROM products ORDER BY name');
    const [categories] = await pool.query<RowDataPacket[]>('SELECT * FROM categories ORDER BY name');
    const [customers] = await pool.query<RowDataPacket[]>('SELECT * FROM customers ORDER BY name');
    const [vehicles] = await pool.query<RowDataPacket[]>('SELECT * FROM vehicles');
    const [suppliers] = await pool.query<RowDataPacket[]>('SELECT * FROM suppliers ORDER BY name');
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, username, role, active, avatar_color FROM users ORDER BY name'
    );
    const [expenses] = await pool.query<RowDataPacket[]>('SELECT * FROM expenses ORDER BY expense_date DESC');
    const [orders] = await pool.query<RowDataPacket[]>('SELECT * FROM orders ORDER BY order_date DESC');
    const [items] = await pool.query<RowDataPacket[]>('SELECT * FROM order_items');
    const [movements] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM stock_movements ORDER BY movement_date DESC'
    );
    const [returns] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM product_returns ORDER BY return_date DESC'
    );
    const [settingsRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM business_settings WHERE id = 1'
    );

    res.json({
      products: products.map(mapProduct),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
      })),
      customers: customers.map((c) => mapCustomer(c, vehicles)),
      suppliers: suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        contactPerson: s.contact_person,
        phone: s.phone,
        email: s.email,
        address: s.address,
      })),
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        role: u.role,
        active: Boolean(u.active),
        avatarColor: u.avatar_color || undefined,
      })),
      expenses: expenses.map((e) => ({
        id: e.id,
        date: formatDt(e.expense_date),
        title: e.title,
        category: e.category,
        amount: Number(e.amount),
        description: e.description || '',
        isExternalSourcing: Boolean(e.is_external_sourcing),
      })),
      orders: orders.map((o) => mapOrder(o, items)),
      stockMovements: movements.map((m) => ({
        id: m.id,
        date: formatDt(m.movement_date),
        productId: m.product_id,
        productName: m.product_name,
        type: m.type,
        quantity: Number(m.quantity),
        source: m.source,
        destination: m.destination,
        reference: m.reference,
        source_type: m.source_type || undefined,
        sourced_from: m.sourced_from || undefined,
      })),
      returns: returns.map((r) => ({
        id: r.id,
        orderId: r.order_id,
        orderNumber: r.order_number,
        productId: r.product_id,
        productName: r.product_name,
        quantity: Number(r.quantity),
        reason: r.reason,
        condition: r.condition,
        date: formatDt(r.return_date),
        customerName: r.customer_name,
        refundMode: r.refund_mode || undefined,
      })),
      settings: settingsRows[0]
        ? {
            businessName: settingsRows[0].business_name,
            address: settingsRows[0].address,
            phone: settingsRows[0].phone,
            email: settingsRows[0].email,
            currency: settingsRows[0].currency,
            receiptFooter: settingsRows[0].receipt_footer || '',
            lastBackupDate: settingsRows[0].last_backup_date || undefined,
          }
        : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

// ---------- Products ----------
router.post('/products', requireRoles('Store Keeper'), async (req, res) => {
  try {
    const p = req.body;
    const pid = id('prod');
    await withTransaction(async (conn) => {
      await conn.execute(
        `INSERT INTO products (
          id, name, sku, barcode, category, cost_price, retail_price, wholesale_price,
          stock, min_stock_level, unit, part_number, cross_references, brand, compatibility,
          chassis_engine_number, \`condition\`, warranty_days, image, must_sell_as_pair
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          pid, p.name, p.sku, p.barcode, p.category, p.costPrice, p.retailPrice, p.wholesalePrice,
          p.stock ?? 0, p.minStockLevel ?? 5, p.unit || 'Pcs', p.partNumber, p.crossReferences || null,
          p.brand, p.compatibility, p.chassisEngineNumber || null, p.condition || 'Mpya',
          p.warrantyDays ?? 0, p.image || null, p.mustSellAsPair ? 1 : 0,
        ]
      );
      if ((p.stock ?? 0) > 0) {
        await conn.execute(
          `INSERT INTO stock_movements (
            id, movement_date, product_id, product_name, type, quantity, source, destination, reference
          ) VALUES (?,?,?,?,?,?,?,?,?)`,
          [id('mov'), nowStr(), pid, p.name, 'Stock In', p.stock, 'Mizani ya Kuanzia', 'Main Warehouse', 'Initial Stock Creation']
        );
      }
    });
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM products WHERE id = ?', [pid]);
    res.status(201).json(mapProduct(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

router.put('/products/:id', requireRoles('Store Keeper'), async (req, res) => {
  try {
    const p = req.body;
    await pool.execute(
      `UPDATE products SET
        name=?, sku=?, barcode=?, category=?, cost_price=?, retail_price=?, wholesale_price=?,
        stock=?, min_stock_level=?, unit=?, part_number=?, cross_references=?, brand=?, compatibility=?,
        chassis_engine_number=?, \`condition\`=?, warranty_days=?, image=?, must_sell_as_pair=?
      WHERE id=?`,
      [
        p.name, p.sku, p.barcode, p.category, p.costPrice, p.retailPrice, p.wholesalePrice,
        p.stock, p.minStockLevel, p.unit, p.partNumber, p.crossReferences || null,
        p.brand, p.compatibility, p.chassisEngineNumber || null, p.condition,
        p.warrantyDays ?? 0, p.image || null, p.mustSellAsPair ? 1 : 0, req.params.id,
      ]
    );
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(mapProduct(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/products/:id', requireRoles('Store Keeper'), async (req, res) => {
  try {
    await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ---------- Categories ----------
router.post('/categories', requireRoles('Store Keeper'), async (req, res) => {
  const cid = id('cat');
  const { name, description } = req.body;
  await pool.execute('INSERT INTO categories (id, name, description) VALUES (?,?,?)', [
    cid, name, description || '',
  ]);
  res.status(201).json({ id: cid, name, description: description || '' });
});

router.put('/categories/:id', requireRoles('Store Keeper'), async (req, res) => {
  const { name, description } = req.body;
  await pool.execute('UPDATE categories SET name=?, description=? WHERE id=?', [
    name, description || '', req.params.id,
  ]);
  res.json({ id: req.params.id, name, description: description || '' });
});

router.delete('/categories/:id', requireRoles('Store Keeper'), async (req, res) => {
  await pool.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ---------- Customers ----------
router.post('/customers', async (req, res) => {
  try {
    const c = req.body;
    const cid = id('cust');
    await withTransaction(async (conn) => {
      await conn.execute(
        `INSERT INTO customers (id, name, phone, email, type, address, outstanding_balance)
         VALUES (?,?,?,?,?,?,?)`,
        [cid, c.name, c.phone, c.email || 'N/A', c.type || 'Retail', c.address || 'N/A', c.outstandingBalance || 0]
      );
      for (const v of c.vehicles || []) {
        await conn.execute(
          `INSERT INTO vehicles (id, customer_id, plate_number, make, model, year) VALUES (?,?,?,?,?,?)`,
          [v.id || id('veh'), cid, v.plateNumber, v.make, v.model, v.year || null]
        );
      }
    });
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM customers WHERE id = ?', [cid]);
    const [vehicles] = await pool.query<RowDataPacket[]>('SELECT * FROM vehicles WHERE customer_id = ?', [cid]);
    res.status(201).json(mapCustomer(rows[0], vehicles));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add customer' });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const c = req.body;
    await withTransaction(async (conn) => {
      await conn.execute(
        `UPDATE customers SET name=?, phone=?, email=?, type=?, address=?, outstanding_balance=? WHERE id=?`,
        [c.name, c.phone, c.email, c.type, c.address, c.outstandingBalance ?? 0, req.params.id]
      );
      await conn.execute('DELETE FROM vehicles WHERE customer_id = ?', [req.params.id]);
      for (const v of c.vehicles || []) {
        await conn.execute(
          `INSERT INTO vehicles (id, customer_id, plate_number, make, model, year) VALUES (?,?,?,?,?,?)`,
          [v.id || id('veh'), req.params.id, v.plateNumber, v.make, v.model, v.year || null]
        );
      }
    });
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    const [vehicles] = await pool.query<RowDataPacket[]>('SELECT * FROM vehicles WHERE customer_id = ?', [req.params.id]);
    res.json(mapCustomer(rows[0], vehicles));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/customers/:id', async (req, res) => {
  if (req.params.id === 'cust-1') {
    return res.status(400).json({ error: 'Cannot delete walk-in customer' });
  }
  await pool.execute('DELETE FROM customers WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

router.post('/customers/:id/pay-debt', async (req, res) => {
  const amount = Number(req.body.amount || 0);
  if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  await pool.execute(
    'UPDATE customers SET outstanding_balance = GREATEST(0, outstanding_balance - ?) WHERE id = ?',
    [amount, req.params.id]
  );
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM customers WHERE id = ?', [req.params.id]);
  const [vehicles] = await pool.query<RowDataPacket[]>('SELECT * FROM vehicles WHERE customer_id = ?', [req.params.id]);
  res.json(mapCustomer(rows[0], vehicles));
});

// ---------- Suppliers ----------
router.post('/suppliers', requireRoles('Store Keeper'), async (req, res) => {
  const s = req.body;
  const sid = id('sup');
  await pool.execute(
    `INSERT INTO suppliers (id, name, contact_person, phone, email, address) VALUES (?,?,?,?,?,?)`,
    [sid, s.name, s.contactPerson, s.phone, s.email, s.address]
  );
  res.status(201).json({ id: sid, ...s });
});

router.put('/suppliers/:id', requireRoles('Store Keeper'), async (req, res) => {
  const s = req.body;
  await pool.execute(
    `UPDATE suppliers SET name=?, contact_person=?, phone=?, email=?, address=? WHERE id=?`,
    [s.name, s.contactPerson, s.phone, s.email, s.address, req.params.id]
  );
  res.json({ id: req.params.id, ...s });
});

router.delete('/suppliers/:id', requireRoles('Store Keeper'), async (req, res) => {
  await pool.execute('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ---------- Users ----------
router.post('/users', requireRoles(), async (req, res) => {
  try {
    const bcrypt = (await import('bcryptjs')).default;
    const u = req.body;
    if (!u.password || String(u.password).length < 6) {
      return res.status(400).json({ error: 'Nenosiri lazima liwe angalau herufi 6' });
    }
    if (!u.username || !u.name || !u.role) {
      return res.status(400).json({ error: 'Jina, username na role zinahitajika' });
    }
    const uid = id('usr');
    const hash = await bcrypt.hash(u.password, 10);
    await pool.execute(
      `INSERT INTO users (id, name, username, password_hash, role, active, avatar_color) VALUES (?,?,?,?,?,?,?)`,
      [uid, u.name, u.username, hash, u.role, u.active !== false ? 1 : 0, u.avatarColor || null]
    );
    res.status(201).json({
      id: uid,
      name: u.name,
      username: u.username,
      role: u.role,
      active: u.active !== false,
      avatarColor: u.avatarColor,
    });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username tayari ipo' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/users/:id', requireRoles(), async (req, res) => {
  try {
    const bcrypt = (await import('bcryptjs')).default;
    const u = req.body;
    if (u.password && String(u.password).length < 6) {
      return res.status(400).json({ error: 'Nenosiri lazima liwe angalau herufi 6' });
    }
    if (u.password) {
      const hash = await bcrypt.hash(u.password, 10);
      await pool.execute(
        `UPDATE users SET name=?, username=?, password_hash=?, role=?, active=?, avatar_color=? WHERE id=?`,
        [u.name, u.username, hash, u.role, u.active ? 1 : 0, u.avatarColor || null, req.params.id]
      );
    } else {
      await pool.execute(
        `UPDATE users SET name=?, username=?, role=?, active=?, avatar_color=? WHERE id=?`,
        [u.name, u.username, u.role, u.active ? 1 : 0, u.avatarColor || null, req.params.id]
      );
    }
    res.json({
      id: req.params.id,
      name: u.name,
      username: u.username,
      role: u.role,
      active: u.active,
      avatarColor: u.avatarColor,
    });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username tayari ipo' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', requireRoles(), async (req: AuthRequest, res) => {
  if (req.user?.id === req.params.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ---------- Admin: reset shop data (keep admin users, walk-in, categories, settings) ----------
router.post('/admin/reset-data', requireRoles(), async (req: AuthRequest, res) => {
  try {
    await withTransaction(async (conn) => {
      await conn.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const table of [
        'order_items',
        'orders',
        'product_returns',
        'warranty_claims',
        'stock_movements',
        'expenses',
        'products',
        'vehicles',
        'suppliers',
      ]) {
        await conn.query(`TRUNCATE TABLE \`${table}\``);
      }
      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
      await conn.execute(`DELETE FROM customers WHERE id <> 'cust-1'`);
      await conn.execute(
        `UPDATE customers SET outstanding_balance = 0, name = 'Mteja wa Kawaida (Walk-in)' WHERE id = 'cust-1'`
      );
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reset failed' });
  }
});
// ---------- Expenses ----------
router.post('/expenses', requireRoles(), async (req, res) => {
  const e = req.body;
  const eid = id('exp');
  const date = e.date || nowStr();
  await pool.execute(
    `INSERT INTO expenses (id, expense_date, title, category, amount, description, is_external_sourcing)
     VALUES (?,?,?,?,?,?,?)`,
    [eid, date, e.title, e.category, e.amount, e.description || '', e.isExternalSourcing ? 1 : 0]
  );
  res.status(201).json({ id: eid, date, ...e });
});

router.put('/expenses/:id', requireRoles(), async (req, res) => {
  const e = req.body;
  await pool.execute(
    `UPDATE expenses SET expense_date=?, title=?, category=?, amount=?, description=?, is_external_sourcing=? WHERE id=?`,
    [e.date, e.title, e.category, e.amount, e.description || '', e.isExternalSourcing ? 1 : 0, req.params.id]
  );
  res.json({ id: req.params.id, ...e });
});

router.delete('/expenses/:id', requireRoles(), async (req, res) => {
  await pool.execute('DELETE FROM expenses WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ---------- Sales (transactional) ----------
router.post('/sales', async (req: AuthRequest, res) => {
  try {
    const {
      items,
      customerId,
      paymentMethod,
      salesType,
      paidAmount,
      discount = 0,
      dueDate,
      notes,
      chassisEngineNumber,
      vehicleId,
      vehiclePlate,
    } = req.body;

    if (!items?.length) {
      return res.status(400).json({ error: 'Kikapu hakina bidhaa!' });
    }

    const order = await withTransaction(async (conn) => {
      type SaleLine = {
        productId: string;
        productName: string;
        price: number;
        costPrice: number;
        quantity: number;
        total: number;
        partNumber: string;
        brand: string;
        condition: string;
        warrantyDays: number;
      };
      const orderItems: SaleLine[] = [];
      for (const cartItem of items) {
        const [prows] = await conn.query<RowDataPacket[]>(
          'SELECT * FROM products WHERE id = ? FOR UPDATE',
          [cartItem.productId]
        );
        if (!prows.length) throw Object.assign(new Error('Bidhaa haikupatikana'), { status: 400 });
        const prod = prows[0];
        if (Number(prod.stock) < Number(cartItem.quantity)) {
          throw Object.assign(
            new Error(`Stock haitoshi kwa "${prod.name}". Kuna ${prod.stock} pekee.`),
            { status: 400 }
          );
        }
        orderItems.push({
          productId: prod.id,
          productName: prod.name,
          price: Number(cartItem.price),
          costPrice: Number(prod.cost_price),
          quantity: Number(cartItem.quantity),
          total: Number(cartItem.price) * Number(cartItem.quantity),
          partNumber: prod.part_number,
          brand: prod.brand,
          condition: prod.condition,
          warrantyDays: Number(prod.warranty_days || 0),
        });
      }

      const totalAmount =
        orderItems.reduce((a, i) => a + i.total, 0) - Number(discount || 0);
      const unpaid = totalAmount - Number(paidAmount || 0);
      let paymentStatus: 'Paid' | 'Unpaid' | 'Partial' = 'Paid';
      if (Number(paidAmount || 0) === 0) paymentStatus = 'Unpaid';
      else if (unpaid > 0) paymentStatus = 'Partial';

      const [crows] = await conn.query<RowDataPacket[]>(
        'SELECT * FROM customers WHERE id = ?',
        [customerId]
      );
      const customer = crows[0];
      if (!customer) throw Object.assign(new Error('Mteja hakupatikana'), { status: 400 });

      const oid = id('ord');
      const orderNumber = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      const date = nowStr();
      const seller = req.user!;

      await conn.execute(
        `INSERT INTO orders (
          id, order_number, order_date, customer_id, customer_name, total_amount, discount, paid_amount,
          payment_method, payment_status, sales_type, seller_id, seller_name, due_date, notes,
          chassis_engine_number, vehicle_id, vehicle_plate
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          oid, orderNumber, date, customer.id, customer.name, totalAmount, discount || 0, paidAmount || 0,
          paymentMethod, paymentStatus, salesType, seller.id, seller.name, dueDate || null, notes || null,
          chassisEngineNumber || null, vehicleId || null, vehiclePlate || null,
        ]
      );

      const today = new Date().toISOString().slice(0, 10);
      for (const [index, item] of orderItems.entries()) {
        await conn.execute(
          `INSERT INTO order_items (
            order_id, product_id, product_name, price, cost_price, quantity, total,
            part_number, brand, \`condition\`, warranty_days
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [
            oid, item.productId, item.productName, item.price, item.costPrice, item.quantity, item.total,
            item.partNumber, item.brand, item.condition, item.warrantyDays,
          ]
        );
        await conn.execute(
          'UPDATE products SET stock = stock - ?, last_sold_date = ? WHERE id = ?',
          [item.quantity, today, item.productId]
        );
        await conn.execute(
          `INSERT INTO stock_movements (
            id, movement_date, product_id, product_name, type, quantity, source, destination, reference
          ) VALUES (?,?,?,?,?,?,?,?,?)`,
          [
            id(`mov-${index}`), date, item.productId, item.productName, 'Stock Out', item.quantity,
            'Main Warehouse', `Mteja: ${customer.name}`, `Mauzo #${orderNumber}`,
          ]
        );
      }

      if (unpaid > 0) {
        await conn.execute(
          'UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?',
          [unpaid, customer.id]
        );
      }

      return {
        id: oid,
        orderNumber,
        date,
        customerId: customer.id as string,
        customerName: customer.name as string,
        items: orderItems,
        totalAmount,
        discount: discount || 0,
        paidAmount: paidAmount || 0,
        paymentMethod,
        paymentStatus,
        salesType,
        sellerId: seller.id,
        sellerName: seller.name,
        dueDate,
        notes,
        chassisEngineNumber,
        vehicleId,
        vehiclePlate,
      };
    });

    res.status(201).json(order);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    console.error(err);
    res.status(e.status || 500).json({ error: e.message || 'Sale failed' });
  }
});

// ---------- Warehouse ----------
router.post('/stock/in', requireRoles('Store Keeper'), async (req, res) => {
  try {
    const { productId, quantity, supplierId, reference, costPriceUpdate } = req.body;
    await withTransaction(async (conn) => {
      const [prows] = await conn.query<RowDataPacket[]>('SELECT * FROM products WHERE id = ? FOR UPDATE', [productId]);
      if (!prows.length) throw Object.assign(new Error('Bidhaa haikupatikana'), { status: 400 });
      const prod = prows[0];
      const [srows] = await conn.query<RowDataPacket[]>('SELECT * FROM suppliers WHERE id = ?', [supplierId]);
      const supplierName = srows[0]?.name || 'Supplier';
      if (costPriceUpdate != null && costPriceUpdate > 0) {
        await conn.execute('UPDATE products SET stock = stock + ?, cost_price = ? WHERE id = ?', [
          quantity, costPriceUpdate, productId,
        ]);
      } else {
        await conn.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [quantity, productId]);
      }
      await conn.execute(
        `INSERT INTO stock_movements (
          id, movement_date, product_id, product_name, type, quantity, source, destination, reference
        ) VALUES (?,?,?,?,?,?,?,?,?)`,
        [id('mov'), nowStr(), productId, prod.name, 'Stock In', quantity, supplierName, 'Main Warehouse', reference || 'Goods Received Note']
      );
    });
    res.json({ ok: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    res.status(e.status || 500).json({ error: e.message || 'Stock in failed' });
  }
});

router.post('/stock/transfer', requireRoles('Store Keeper'), async (req, res) => {
  try {
    const { productId, quantity, source, destination, reference } = req.body;
    await withTransaction(async (conn) => {
      const [prows] = await conn.query<RowDataPacket[]>('SELECT * FROM products WHERE id = ? FOR UPDATE', [productId]);
      if (!prows.length) throw Object.assign(new Error('Bidhaa haikupatikana'), { status: 400 });
      const prod = prows[0];
      if (Number(prod.stock) < Number(quantity)) {
        throw Object.assign(new Error(`Stock haitoshi! Kuna ${prod.stock} pekee`), { status: 400 });
      }
      await conn.execute(
        `INSERT INTO stock_movements (
          id, movement_date, product_id, product_name, type, quantity, source, destination, reference
        ) VALUES (?,?,?,?,?,?,?,?,?)`,
        [id('mov'), nowStr(), productId, prod.name, 'Transfer', quantity, source, destination, reference]
      );
    });
    res.json({ ok: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    res.status(e.status || 500).json({ error: e.message || 'Transfer failed' });
  }
});

router.post('/stock/reconcile', requireRoles('Store Keeper'), async (req, res) => {
  try {
    const { productId, physicalQty, reference } = req.body;
    await withTransaction(async (conn) => {
      const [prows] = await conn.query<RowDataPacket[]>('SELECT * FROM products WHERE id = ? FOR UPDATE', [productId]);
      if (!prows.length) throw Object.assign(new Error('Bidhaa haikupatikana'), { status: 400 });
      const prod = prows[0];
      const variance = Number(physicalQty) - Number(prod.stock);
      if (variance === 0) {
        throw Object.assign(new Error('Hakuna tofauti (variance)'), { status: 400 });
      }
      await conn.execute('UPDATE products SET stock = ? WHERE id = ?', [physicalQty, productId]);
      await conn.execute(
        `INSERT INTO stock_movements (
          id, movement_date, product_id, product_name, type, quantity, source, destination, reference
        ) VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          id('mov'), nowStr(), productId, prod.name, 'Adjustment', variance,
          'Physical Count Reconciliation', 'System Inventory',
          reference || `Upatanisho (Variance: ${variance})`,
        ]
      );
    });
    res.json({ ok: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    res.status(e.status || 500).json({ error: e.message || 'Reconcile failed' });
  }
});

// ---------- Returns ----------
router.post('/returns', async (req, res) => {
  try {
    const p = req.body;
    await withTransaction(async (conn) => {
      const rid = id('ret');
      await conn.execute(
        `INSERT INTO product_returns (
          id, order_id, order_number, product_id, product_name, quantity, reason, \`condition\`,
          return_date, customer_name, refund_mode
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          rid, p.orderId, p.orderNumber, p.productId, p.productName, p.quantity, p.reason, p.condition,
          nowStr(), p.customerName, p.refundMode || null,
        ]
      );
      if (p.condition === 'resellable') {
        await conn.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [p.quantity, p.productId]);
        await conn.execute(
          `INSERT INTO stock_movements (
            id, movement_date, product_id, product_name, type, quantity, source, destination, reference
          ) VALUES (?,?,?,?,?,?,?,?,?)`,
          [
            id('mov'), nowStr(), p.productId, p.productName, 'Stock In', p.quantity,
            'Marejesho ya Bidhaa (Resellable)', 'Main Warehouse', `Marejesho ya Ankara ${p.orderNumber}`,
          ]
        );
      }
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Return failed' });
  }
});

// ---------- Settings ----------
router.put('/settings', requireRoles(), async (req, res) => {
  const s = req.body;
  await pool.execute(
    `UPDATE business_settings SET
      business_name=?, address=?, phone=?, email=?, currency=?, receipt_footer=?, last_backup_date=?
     WHERE id=1`,
    [
      s.businessName, s.address, s.phone, s.email, s.currency, s.receiptFooter,
      s.lastBackupDate || null,
    ]
  );
  res.json(s);
});

export default router;
