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
  /** Pieces per carton/box when selling wholesale packs (default 1 = sell by piece) */
  packSize?: number;
  /** Physical bin/shelf location in the warehouse */
  binLocation?: string;
  
  // Spare Parts Specific Fields
  partNumber: string;               // Namba ya Bidhaa / Part Number
  crossReferences?: string;         // Namba Mbadala / Cross References
  brand: string;                    // Chapa (Genuine/OEM, Aftermarket/Copy, Used, etc.)
  compatibility: string;            // Inafaa kwa (vehicle/machine make, model, year range)
  chassisEngineNumber?: string;     // Namba ya Chassis/Engine (optional)
  condition: 'Mpya' | 'Kutumika' | 'Fanisi'; // Mpya (New), Kutumika (Used), Fanisi (Refurbished)
  lastSoldDate?: string;            // Tarehe ya mwisho kuuzwa (for Slow-Moving / Dead Stock)
  warrantyDays?: number;            // Default warranty period in days
  image?: string;                   // Picha ya Bidhaa / Product Photo (Base64 or url)
  mustSellAsPair?: boolean;         // Lazima Iuzwe kwa Jozi/Seti (Must Sell as Pair/Set)
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string; // Namba ya gari (e.g., T 123 ABC)
  make: string;        // Mtengenezaji (e.g., Toyota, Nissan)
  model: string;       // Model (e.g., RAV4, IST)
  year?: string;       // Mwaka wa gari
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: 'Retail' | 'Wholesale';
  address: string;
  outstandingBalance: number;
  vehicles?: Vehicle[]; // Magari yaliyounganishwa na mteja
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
  source_type?: 'internal_stock' | 'external_sourced';
  sourced_from?: string;
  
  // Spare Parts Fields
  partNumber?: string;
  brand?: string;
  condition?: 'Mpya' | 'Kutumika' | 'Fanisi';
  warrantyDays?: number;
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
  taxAmount?: number;
  taxRate?: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  salesType: SalesType;
  sellerId: string;
  sellerName: string;
  dueDate?: string;
  notes?: string;
  source_type?: 'internal_stock' | 'external_sourced';
  sourced_from?: string;
  /** sale = real invoice; proforma = quotation (no stock cut) */
  documentType?: 'sale' | 'proforma';
  /** Set when a proforma was converted into a real sale */
  convertedToOrderId?: string;
  
  // Spare Parts Fields
  chassisEngineNumber?: string;
  vehicleId?: string;
  vehiclePlate?: string;
}

export interface Expense {
  id: string;
  date: string;
  title: string;
  category: string;
  amount: number;
  description: string;
  isExternalSourcing?: boolean; // flag to avoid double counting on profit calculation
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
  source_type?: 'internal_stock' | 'external_sourced';
  sourced_from?: string;
}

export interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  receiptFooter: string;
  lastBackupDate?: string;
  /** When true, VAT is added on top of (subtotal − discount) */
  taxEnabled: boolean;
  /** VAT percent, e.g. 18 */
  taxRate: number;
  /** Thermal receipt width in mm (typically 80) */
  thermalPrinterWidthMm: number;
}

export interface StockCountItem {
  productId: string;
  productName: string;
  systemStock: number;
  physicalStock: number;
  variance: number;
}

export interface ProductReturn {
  id: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: 'haifai' | 'imeharibika' | 'mteja alibadili mawazo';
  condition: 'resellable' | 'defective';
  date: string;
  customerName: string;
  refundMode?: 'refunded' | 'credited' | 'discarded';
}

