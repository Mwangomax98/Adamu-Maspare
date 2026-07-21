import { Product, Category, Customer, Supplier, User, Order, Expense, StockMovement, BusinessSettings } from '../types';
import { DEMO_PRODUCTS, DEMO_CUSTOMERS, DEMO_SUPPLIERS } from './demoCatalog';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Mfumo wa Injini', description: 'Pistoni, gasket, mikanda ya timing na bearing za injini' },
  { id: 'cat-2', name: 'Mfumo wa Breki', description: 'Brake pads, dumu za breki, caliper na mafuta ya breki' },
  { id: 'cat-3', name: 'Mfumo wa Umeme', description: 'Alternator, mota ya kuanzia (starter), spark plugs na betri' },
  { id: 'cat-4', name: 'Susa na Gia', description: 'Shock absorbers, bush, rack ends, na gia za gari' },
  { id: 'cat-5', name: 'Vichujio na Kilainishi', description: 'Oil filter, fuel filter, air filter na mafuta ya injini' },
];

export const INITIAL_PRODUCTS: Product[] = DEMO_PRODUCTS.map((p, i) => ({
  ...p,
  id: `prod-demo-${String(i + 1).padStart(3, '0')}`,
}));

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Mteja wa Kawaida (Walk-in)',
    phone: 'N/A',
    email: 'N/A',
    type: 'Retail',
    address: 'N/A',
    outstandingBalance: 0,
    vehicles: []
  },
  ...DEMO_CUSTOMERS.map((c, i) => ({
    ...c,
    id: `cust-demo-${String(i + 1).padStart(3, '0')}`,
  })),
];

export const INITIAL_SUPPLIERS: Supplier[] = DEMO_SUPPLIERS.map((s, i) => ({
  ...s,
  id: `sup-demo-${String(i + 1).padStart(3, '0')}`,
}));

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'Administrator',
    username: 'admin',
    role: 'Admin',
    active: true,
    avatarColor: 'bg-teal-600',
  },
];

export const INITIAL_SETTINGS: BusinessSettings = {
  businessName: 'ADAMU AUTO SPARES',
  address: 'Mtaa wa Gerezani / Sikukuu, Kariakoo, Dar es Salaam',
  phone: '+255 712 345 678',
  email: 'sales@adamuspares.co.tz',
  currency: 'TZS',
  receiptFooter: 'Asante kwa kununua vipuri halisi! Hakuna kurejesha bidhaa bila risiti.',
  lastBackupDate: '2026-07-10 16:30',
  taxEnabled: true,
  taxRate: 18,
  thermalPrinterWidthMm: 80,
};

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];

export const INITIAL_ORDERS: Order[] = [];
