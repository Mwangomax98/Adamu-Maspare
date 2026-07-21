import { Product, Category, Customer, Supplier, User, Order, Expense, StockMovement, BusinessSettings } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Mfumo wa Injini', description: 'Pistoni, gasket, mikanda ya timing na bearing za injini' },
  { id: 'cat-2', name: 'Mfumo wa Breki', description: 'Brake pads, dumu za breki, caliper na mafuta ya breki' },
  { id: 'cat-3', name: 'Mfumo wa Umeme', description: 'Alternator, mota ya kuanzia (starter), spark plugs na betri' },
  { id: 'cat-4', name: 'Susa na Gia', description: 'Shock absorbers, bush, rack ends, na gia za gari' },
  { id: 'cat-5', name: 'Vichujio na Kilainishi', description: 'Oil filter, fuel filter, air filter na mafuta ya injini' },
];

export const INITIAL_PRODUCTS: Product[] = [];

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
  {
    id: 'cust-2',
    name: 'Mussa Juma (Transport Agent)',
    phone: '0712345678',
    email: 'mussa@transport.co.tz',
    type: 'Wholesale',
    address: 'Kariakoo, Dar es Salaam',
    outstandingBalance: 120000,
    vehicles: [
      { id: 'veh-1', plateNumber: 'T 456 DKJ', make: 'Toyota', model: 'Dyna', year: '2015' },
      { id: 'veh-2', plateNumber: 'T 890 BCD', make: 'Scania', model: 'R480', year: '2012' }
    ]
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Amos Mwakalila',
    username: 'admin',
    role: 'Admin',
    active: true,
    avatarColor: 'bg-teal-600',
  },
  {
    id: 'usr-2',
    name: 'Salome John',
    username: 'store',
    role: 'Store Keeper',
    active: true,
    avatarColor: 'bg-emerald-600',
  },
  {
    id: 'usr-3',
    name: 'Bahati Hamisi',
    username: 'cashier',
    role: 'Cashier',
    active: true,
    avatarColor: 'bg-amber-600',
  },
  {
    id: 'usr-4',
    name: 'Emmanuel Massawe',
    username: 'wholesale',
    role: 'Wholesale Sales',
    active: true,
    avatarColor: 'bg-cyan-600',
  },
  {
    id: 'usr-5',
    name: 'Grace Mlay',
    username: 'retail',
    role: 'Retail Sales',
    active: true,
    avatarColor: 'bg-pink-600',
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
};

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];

export const INITIAL_ORDERS: Order[] = [];
