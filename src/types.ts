export type UserRole = 'Admin' | 'Store Keeper' | 'Cashier' | 'Wholesale Sales' | 'Retail Sales';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  active: boolean;
  avatarColor?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  stock: number;
  minStockLevel: number;
  unit: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: 'Retail' | 'Wholesale';
  address: string;
  outstandingBalance: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Benki';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial';
export type SalesType = 'Retail' | 'Wholesale';

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  costPrice: number; // for profit calculation
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  discount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  salesType: SalesType;
  sellerId: string;
  sellerName: string;
  dueDate?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  title: string;
  category: string;
  amount: number;
  description: string;
}

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: 'Stock In' | 'Stock Out' | 'Transfer' | 'Adjustment';
  quantity: number; // can be positive or negative
  source: string;
  destination: string;
  reference: string;
}

export interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  receiptFooter: string;
  lastBackupDate?: string;
}

export interface StockCountItem {
  productId: string;
  productName: string;
  systemStock: number;
  physicalStock: number;
  variance: number;
}
