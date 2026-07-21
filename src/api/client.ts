import type {
  Product,
  Category,
  Customer,
  Supplier,
  User,
  Order,
  Expense,
  StockMovement,
  BusinessSettings,
  ProductReturn,
  UserRole,
  PaymentMethod,
  SalesType,
} from '../types';

const TOKEN_KEY = 'pos_api_token';

export function getApiBase(): string {
  return (import.meta.env.VITE_API_URL as string | undefined) || '/api';
}

export function isApiMode(): boolean {
  // API mode when VITE_USE_API is not explicitly "false"
  return import.meta.env.VITE_USE_API !== 'false';
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${getApiBase()}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || res.statusText || 'Request failed', res.status);
  }
  return data as T;
}

export interface BootstrapData {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  suppliers: Supplier[];
  users: User[];
  expenses: Expense[];
  orders: Order[];
  stockMovements: StockMovement[];
  returns: ProductReturn[];
  settings: BusinessSettings | null;
}

export const api = {
  health: () => request<{ ok: boolean }>('/health'),
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ user: User }>('/auth/me'),
  bootstrap: () => request<BootstrapData>('/bootstrap'),

  addProduct: (p: Omit<Product, 'id'>) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(p) }),
  updateProduct: (p: Product & { preserveStock?: boolean }) =>
    request<Product>(`/products/${p.id}`, { method: 'PUT', body: JSON.stringify(p) }),
  deleteProduct: (id: string) =>
    request<{ ok: boolean }>(`/products/${id}`, { method: 'DELETE' }),

  addCategory: (c: Omit<Category, 'id'>) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(c) }),
  updateCategory: (c: Category) =>
    request<Category>(`/categories/${c.id}`, { method: 'PUT', body: JSON.stringify(c) }),
  deleteCategory: (id: string) =>
    request<{ ok: boolean }>(`/categories/${id}`, { method: 'DELETE' }),

  addCustomer: (c: Omit<Customer, 'id'>) =>
    request<Customer>('/customers', { method: 'POST', body: JSON.stringify(c) }),
  updateCustomer: (c: Customer) =>
    request<Customer>(`/customers/${c.id}`, { method: 'PUT', body: JSON.stringify(c) }),
  deleteCustomer: (id: string) =>
    request<{ ok: boolean }>(`/customers/${id}`, { method: 'DELETE' }),
  payDebt: (customerId: string, amount: number) =>
    request<Customer>(`/customers/${customerId}/pay-debt`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  addSupplier: (s: Omit<Supplier, 'id'>) =>
    request<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(s) }),
  updateSupplier: (s: Supplier) =>
    request<Supplier>(`/suppliers/${s.id}`, { method: 'PUT', body: JSON.stringify(s) }),
  deleteSupplier: (id: string) =>
    request<{ ok: boolean }>(`/suppliers/${id}`, { method: 'DELETE' }),

  addUser: (u: Omit<User, 'id'> & { password?: string }) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(u) }),
  updateUser: (u: User & { password?: string }) =>
    request<User>(`/users/${u.id}`, { method: 'PUT', body: JSON.stringify(u) }),
  deleteUser: (id: string) =>
    request<{ ok: boolean }>(`/users/${id}`, { method: 'DELETE' }),

  addExpense: (e: Omit<Expense, 'id'>) =>
    request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(e) }),
  updateExpense: (e: Expense) =>
    request<Expense>(`/expenses/${e.id}`, { method: 'PUT', body: JSON.stringify(e) }),
  deleteExpense: (id: string) =>
    request<{ ok: boolean }>(`/expenses/${id}`, { method: 'DELETE' }),

  completeSale: (body: {
    items: { productId: string; quantity: number; price: number }[];
    customerId: string;
    paymentMethod: PaymentMethod;
    salesType: SalesType;
    paidAmount: number;
    discount: number;
    dueDate?: string;
    notes?: string;
    chassisEngineNumber?: string;
    vehicleId?: string;
    vehiclePlate?: string;
  }) => request<Order>('/sales', { method: 'POST', body: JSON.stringify(body) }),

  completeExternalSale: (body: Record<string, unknown>) =>
    request<Order>('/sales/external', { method: 'POST', body: JSON.stringify(body) }),

  createProforma: (body: {
    items: { productId: string; quantity: number; price: number }[];
    customerId: string;
    salesType: SalesType;
    discount?: number;
    dueDate?: string;
    notes?: string;
  }) => request<Order>('/proformas', { method: 'POST', body: JSON.stringify(body) }),

  convertProforma: (
    id: string,
    body: { paidAmount?: number; paymentMethod?: PaymentMethod; dueDate?: string; notes?: string }
  ) => request<Order>(`/proformas/${id}/convert`, { method: 'POST', body: JSON.stringify(body) }),

  stockIn: (body: {
    productId: string;
    quantity: number;
    supplierId: string;
    reference: string;
    costPriceUpdate?: number;
  }) => request<{ ok: boolean }>('/stock/in', { method: 'POST', body: JSON.stringify(body) }),

  stockTransfer: (body: {
    productId: string;
    quantity: number;
    source: string;
    destination: string;
    reference: string;
  }) => request<{ ok: boolean }>('/stock/transfer', { method: 'POST', body: JSON.stringify(body) }),

  stockReconcile: (body: { productId: string; physicalQty: number; reference: string }) =>
    request<{ ok: boolean }>('/stock/reconcile', { method: 'POST', body: JSON.stringify(body) }),

  processReturn: (params: Omit<ProductReturn, 'id' | 'date'>) =>
    request<{ ok: boolean }>('/returns', { method: 'POST', body: JSON.stringify(params) }),

  updateSettings: (s: BusinessSettings) =>
    request<BusinessSettings>('/settings', { method: 'PUT', body: JSON.stringify(s) }),

  resetData: () =>
    request<{ ok: boolean }>('/admin/reset-data', { method: 'POST', body: '{}' }),
};

export type { UserRole };
