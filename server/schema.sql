-- ADAMU MASPARE MySQL schema
CREATE DATABASE IF NOT EXISTS adamu_maspare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE adamu_maspare;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin','Store Keeper','Cashier','Wholesale Sales','Retail Sales') NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  avatar_color VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(100) NOT NULL,
  category VARCHAR(150) NOT NULL,
  cost_price DECIMAL(14,2) NOT NULL DEFAULT 0,
  retail_price DECIMAL(14,2) NOT NULL DEFAULT 0,
  wholesale_price DECIMAL(14,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  min_stock_level INT NOT NULL DEFAULT 5,
  unit VARCHAR(40) NOT NULL DEFAULT 'Pcs',
  part_number VARCHAR(120) NOT NULL,
  cross_references VARCHAR(255) NULL,
  brand VARCHAR(120) NOT NULL,
  compatibility VARCHAR(255) NOT NULL,
  chassis_engine_number VARCHAR(120) NULL,
  `condition` ENUM('Mpya','Kutumika','Fanisi') NOT NULL DEFAULT 'Mpya',
  last_sold_date DATE NULL,
  warranty_days INT NULL DEFAULT 0,
  image LONGTEXT NULL,
  must_sell_as_pair TINYINT(1) NOT NULL DEFAULT 0,
  pack_size INT NOT NULL DEFAULT 1,
  bin_location VARCHAR(80) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_products_sku (sku),
  INDEX idx_products_part (part_number)
);

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(150) NOT NULL,
  type ENUM('Retail','Wholesale') NOT NULL DEFAULT 'Retail',
  address VARCHAR(255) NOT NULL,
  outstanding_balance DECIMAL(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL,
  plate_number VARCHAR(40) NOT NULL,
  make VARCHAR(80) NOT NULL,
  model VARCHAR(80) NOT NULL,
  year VARCHAR(10) NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(150) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(150) NOT NULL,
  address VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(64) NOT NULL UNIQUE,
  order_date DATETIME NOT NULL,
  customer_id VARCHAR(64) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  total_amount DECIMAL(14,2) NOT NULL,
  discount DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(6,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  payment_method ENUM('Cash','Mobile Money','Benki') NOT NULL,
  payment_status ENUM('Paid','Unpaid','Partial') NOT NULL,
  sales_type ENUM('Retail','Wholesale') NOT NULL,
  seller_id VARCHAR(64) NOT NULL,
  seller_name VARCHAR(150) NOT NULL,
  due_date DATE NULL,
  notes TEXT NULL,
  source_type ENUM('internal_stock','external_sourced') NULL,
  sourced_from VARCHAR(150) NULL,
  chassis_engine_number VARCHAR(120) NULL,
  vehicle_id VARCHAR(64) NULL,
  vehicle_plate VARCHAR(40) NULL,
  document_type ENUM('sale','proforma') NOT NULL DEFAULT 'sale',
  converted_to_order_id VARCHAR(64) NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_orders_date (order_date)
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(14,2) NOT NULL,
  cost_price DECIMAL(14,2) NOT NULL,
  quantity INT NOT NULL,
  total DECIMAL(14,2) NOT NULL,
  source_type ENUM('internal_stock','external_sourced') NULL,
  sourced_from VARCHAR(150) NULL,
  part_number VARCHAR(120) NULL,
  brand VARCHAR(120) NULL,
  `condition` ENUM('Mpya','Kutumika','Fanisi') NULL,
  warranty_days INT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(64) PRIMARY KEY,
  expense_date DATETIME NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(120) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  description TEXT,
  is_external_sourcing TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(64) PRIMARY KEY,
  movement_date DATETIME NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  type ENUM('Stock In','Stock Out','Transfer','Adjustment') NOT NULL,
  quantity INT NOT NULL,
  source VARCHAR(150) NOT NULL,
  destination VARCHAR(150) NOT NULL,
  reference VARCHAR(255) NOT NULL,
  source_type ENUM('internal_stock','external_sourced') NULL,
  sourced_from VARCHAR(150) NULL,
  INDEX idx_movements_date (movement_date)
);

CREATE TABLE IF NOT EXISTS product_returns (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  order_number VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  reason ENUM('haifai','imeharibika','mteja alibadili mawazo') NOT NULL,
  `condition` ENUM('resellable','defective') NOT NULL,
  return_date DATETIME NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  refund_mode ENUM('refunded','credited','discarded') NULL
);

CREATE TABLE IF NOT EXISTS warranty_claims (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NULL,
  order_number VARCHAR(64) NULL,
  product_id VARCHAR(64) NULL,
  product_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  claim_date DATETIME NOT NULL,
  notes TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS business_settings (
  id TINYINT PRIMARY KEY DEFAULT 1,
  business_name VARCHAR(150) NOT NULL,
  address VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(150) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'TZS',
  receipt_footer TEXT,
  last_backup_date VARCHAR(40) NULL,
  tax_enabled TINYINT(1) NOT NULL DEFAULT 1,
  tax_rate DECIMAL(6,2) NOT NULL DEFAULT 18,
  thermal_printer_width_mm INT NOT NULL DEFAULT 80
);
