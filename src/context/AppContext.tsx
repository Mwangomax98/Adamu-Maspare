import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Product, Category, Customer, Supplier, User, Order, OrderItem, Expense, 
  StockMovement, BusinessSettings, UserRole, PaymentMethod, SalesType, ProductReturn
} from '../types';
import { 
  INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_CUSTOMERS, 
  INITIAL_SUPPLIERS, INITIAL_USERS, INITIAL_SETTINGS, 
  INITIAL_EXPENSES, INITIAL_STOCK_MOVEMENTS, INITIAL_ORDERS 
} from '../data/mockData';
import { api, ApiError, getToken, setToken, isApiMode } from '../api/client';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  currentUser: User | null;
  products: Product[];
  categories: Category[];
  customers: Customer[];
  suppliers: Supplier[];
  users: User[];
  expenses: Expense[];
  orders: Order[];
  stockMovements: StockMovement[];
  returns: ProductReturn[];
  settings: BusinessSettings;
  toasts: Toast[];
  currentScreen: string;
  apiConnected: boolean;
  setScreen: (screen: string) => void;
  login: (username: string, password: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Product Methods
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product & { preserveStock?: boolean }) => Promise<void>;
  deleteProduct: (id: string) => void;
  
  // Category Methods
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Customer Methods
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer | null>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => void;
  payDebt: (customerId: string, amount: number) => void;

  // Supplier Methods
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => void;

  // User Methods
  addUser: (user: Omit<User, 'id'> & { password?: string }) => Promise<void>;
  updateUser: (user: User & { password?: string }) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Expense Methods
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => void;

  // Order & POS Methods
  completeSale: (
    items: { productId: string; quantity: number; price: number }[],
    customerId: string,
    paymentMethod: PaymentMethod,
    salesType: SalesType,
    paidAmount: number,
    discount: number,
    dueDate?: string,
    notes?: string,
    chassisEngineNumber?: string,
    vehicleId?: string,
    vehiclePlate?: string
  ) => Promise<Order | null>;

  completeExternalSourcedSale: (params: {
    productName: string;
    sku: string;
    barcode: string;
    category: string;
    unit: string;
    existingProductId?: string;
    quantity: number;
    purchaseCost: number;
    externalSeller: string;
    sellingPrice: number;
    customerId: string;
    paymentMethod: PaymentMethod;
    salesType: SalesType;
    paidAmount: number;
    discount: number;
    dueDate?: string;
    notes?: string;
    partNumber?: string;
    brand?: string;
    compatibility?: string;
    condition?: 'Mpya' | 'Kutumika' | 'Fanisi';
    warrantyDays?: number;
  }) => Promise<Order | null>;

  // Stock Movement & Warehouse Management
  addStockIn: (productId: string, quantity: number, supplierId: string, reference: string, costPriceUpdate?: number) => void;
  addStockTransfer: (productId: string, quantity: number, source: string, destination: string, reference: string) => void;
  reconcileStockCount: (productId: string, physicalQty: number, reference: string) => void;

  // Product Returns Method
  processProductReturn: (params: Omit<ProductReturn, 'id' | 'date'>) => void;

  // Backup & Restore
  updateSettings: (settings: BusinessSettings) => void;
  triggerBackup: () => void;
  triggerRestore: (data?: unknown) => void;
  clearAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    console.warn('Corrupt localStorage data ignored');
    return fallback;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or use defaults
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    safeParse<User | null>(localStorage.getItem('pos_current_user'), null)
  );

  const [products, setProducts] = useState<Product[]>(() =>
    safeParse(localStorage.getItem('pos_products'), INITIAL_PRODUCTS)
  );

  const [categories, setCategories] = useState<Category[]>(() =>
    safeParse(localStorage.getItem('pos_categories'), INITIAL_CATEGORIES)
  );

  const [customers, setCustomers] = useState<Customer[]>(() =>
    safeParse(localStorage.getItem('pos_customers'), INITIAL_CUSTOMERS)
  );

  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    safeParse(localStorage.getItem('pos_suppliers'), INITIAL_SUPPLIERS)
  );

  const [users, setUsers] = useState<User[]>(() =>
    safeParse(localStorage.getItem('pos_users'), INITIAL_USERS)
  );

  const [expenses, setExpenses] = useState<Expense[]>(() =>
    safeParse(localStorage.getItem('pos_expenses'), INITIAL_EXPENSES)
  );

  const [orders, setOrders] = useState<Order[]>(() =>
    safeParse(localStorage.getItem('pos_orders'), INITIAL_ORDERS)
  );

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    safeParse(localStorage.getItem('pos_stock_movements'), INITIAL_STOCK_MOVEMENTS)
  );

  const [returns, setReturns] = useState<ProductReturn[]>(() =>
    safeParse(localStorage.getItem('pos_returns'), [])
  );

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = safeParse(localStorage.getItem('pos_settings'), INITIAL_SETTINGS);
    return {
      ...INITIAL_SETTINGS,
      ...saved,
      taxEnabled: saved.taxEnabled ?? true,
      taxRate: saved.taxRate ?? 18,
      thermalPrinterWidthMm: saved.thermalPrinterWidthMm ?? 80,
    };
  });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [apiConnected, setApiConnected] = useState(false);

  const [currentScreen, setScreen] = useState<string>(() => {
    const saved = localStorage.getItem('pos_current_screen');
    return saved || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('pos_current_screen', currentScreen);
  }, [currentScreen]);

  // Persist session user only (business data lives in MySQL when API is connected)
  useEffect(() => {
    localStorage.setItem('pos_current_user', currentUser ? JSON.stringify(currentUser) : '');
  }, [currentUser]);

  useEffect(() => {
    if (apiConnected) return;
    localStorage.setItem('pos_products', JSON.stringify(products));
  }, [products, apiConnected]);

  useEffect(() => {
    if (apiConnected) return;
    localStorage.setItem('pos_categories', JSON.stringify(categories));
  }, [categories, apiConnected]);

  useEffect(() => {
    if (apiConnected) return;
    localStorage.setItem('pos_customers', JSON.stringify(customers));
  }, [customers, apiConnected]);

  useEffect(() => {
    if (apiConnected) return;
    localStorage.setItem('pos_suppliers', JSON.stringify(suppliers));
  }, [suppliers, apiConnected]);

  useEffect(() => {
    if (apiConnected) return;
    localStorage.setItem('pos_users', JSON.stringify(users));
  }, [users, apiConnected]);

  useEffect(() => {
    if (apiConnected) return;
    localStorage.setItem('pos_expenses', JSON.stringify(expenses));
  }, [expenses, apiConnected]);

  useEffect(() => {
    if (apiConnected) return;
    localStorage.setItem('pos_orders', JSON.stringify(orders));
  }, [orders, apiConnected]);

  useEffect(() => {
    if (apiConnected) return;
    localStorage.setItem('pos_returns', JSON.stringify(returns));
  }, [returns, apiConnected]);

  useEffect(() => {
    if (apiConnected) return;
    localStorage.setItem('pos_stock_movements', JSON.stringify(stockMovements));
  }, [stockMovements, apiConnected]);

  useEffect(() => {
    if (apiConnected) return;
    localStorage.setItem('pos_settings', JSON.stringify(settings));
  }, [settings, apiConnected]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const tid = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id: tid, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== tid));
    }, 4000);
  }, []);

  const removeToast = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  const applyBootstrap = useCallback(async () => {
    const data = await api.bootstrap();
    setProducts(data.products);
    setCategories(data.categories);
    setCustomers(data.customers);
    setSuppliers(data.suppliers);
    setUsers(data.users);
    setExpenses(data.expenses);
    setOrders(data.orders);
    setStockMovements(data.stockMovements);
    setReturns(data.returns);
    if (data.settings) {
      setSettings({
        ...INITIAL_SETTINGS,
        ...data.settings,
        taxEnabled: data.settings.taxEnabled ?? true,
        taxRate: data.settings.taxRate ?? 18,
        thermalPrinterWidthMm: data.settings.thermalPrinterWidthMm ?? 80,
      });
    }
  }, []);

  // Detect API / restore session
  useEffect(() => {
    if (!isApiMode()) return;
    let cancelled = false;
    (async () => {
      try {
        await api.health();
        if (cancelled) return;
        setApiConnected(true);
        const token = getToken();
        if (token) {
          try {
            const { user } = await api.me();
            if (cancelled) return;
            setCurrentUser(user);
            await applyBootstrap();
          } catch {
            setToken(null);
            setCurrentUser(null);
          }
        }
      } catch {
        if (!cancelled) setApiConnected(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyBootstrap]);

  // Auth
  const login = async (username: string, password: string, role?: UserRole): Promise<boolean> => {
    if (apiConnected || isApiMode()) {
      try {
        await api.health();
        setApiConnected(true);
        const { token, user } = await api.login(username, password);
        setToken(token);
        setCurrentUser(user);
        await applyBootstrap();
        showToast(`Karibu ${user.name}! Umelogin kama ${user.role}`, 'success');
        return true;
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Imeshindikana kuingia';
        // Fall through to local demo mode if API unreachable
        if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
          showToast(msg, 'error');
          return false;
        }
      }
    }

    const user = users.find(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase() &&
        (!role || u.role === role)
    );
    if (user) {
      if (!user.active) {
        showToast('Mtumiaji huyu amesitishwa (Inactive)', 'error');
        return false;
      }
      setCurrentUser(user);
      showToast(`Karibu ${user.name}! Umelogin kama ${user.role}`, 'success');
      return true;
    }
    showToast('Mtumiaji au nenosiri havikupatikana', 'error');
    return false;
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    showToast('Umetoka kwenye mfumo kwa mafanikio', 'info');
  };

  // Products
  const addProduct = async (p: Omit<Product, 'id'>) => {
    if (apiConnected) {
      try {
        await api.addProduct(p);
        await applyBootstrap();
        showToast(`Bidhaa "${p.name}" imeongezwa`, 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
        throw err;
      }
      return;
    }
    const pid = `prod-${Date.now()}`;
    const newProduct: Product = { ...p, id: pid };
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Bidhaa "${p.name}" imeongezwa`, 'success');

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      productId: pid,
      productName: p.name,
      type: 'Stock In',
      quantity: p.stock,
      source: 'Mizani ya Kuanzia',
      destination: 'Main Warehouse',
      reference: 'Initial Stock Creation',
    };
    setStockMovements((prev) => [movement, ...prev]);
  };

  const updateProduct = async (p: Product & { preserveStock?: boolean }) => {
    if (apiConnected) {
      try {
        await api.updateProduct(p);
        await applyBootstrap();
        showToast(`Bidhaa "${p.name}" imebadilishwa`, 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
        throw err;
      }
      return;
    }
    setProducts((prev) => prev.map((item) => (item.id === p.id ? p : item)));
    showToast(`Bidhaa "${p.name}" imebadilishwa`, 'success');
  };

  const deleteProduct = async (pid: string) => {
    const p = products.find((x) => x.id === pid);
    if (apiConnected) {
      try {
        await api.deleteProduct(pid);
        await applyBootstrap();
        if (p) showToast(`Bidhaa "${p.name}" imefutwa`, 'info');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    setProducts((prev) => prev.filter((item) => item.id !== pid));
    if (p) showToast(`Bidhaa "${p.name}" imefutwa`, 'info');
  };

  // Categories
  const addCategory = async (c: Omit<Category, 'id'>) => {
    if (apiConnected) {
      try {
        await api.addCategory(c);
        await applyBootstrap();
        showToast(`Kundi "${c.name}" limeongezwa`, 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
        throw err;
      }
      return;
    }
    const id = `cat-${Date.now()}`;
    setCategories((prev) => [...prev, { ...c, id }]);
    showToast(`Kundi "${c.name}" limeongezwa`, 'success');
  };

  const updateCategory = async (c: Category) => {
    if (apiConnected) {
      try {
        await api.updateCategory(c);
        await applyBootstrap();
        showToast(`Kundi "${c.name}" limebadilishwa`, 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
        throw err;
      }
      return;
    }
    setCategories((prev) => prev.map((item) => (item.id === c.id ? c : item)));
    showToast(`Kundi "${c.name}" limebadilishwa`, 'success');
  };

  const deleteCategory = async (id: string) => {
    const c = categories.find(x => x.id === id);
    if (apiConnected) {
      try {
        await api.deleteCategory(id);
        await applyBootstrap();
        if (c) showToast(`Kundi "${c.name}" limefutwa`, 'info');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    setCategories((prev) => prev.filter((item) => item.id !== id));
    if (c) showToast(`Kundi "${c.name}" limefutwa`, 'info');
  };

  // Customers
  const addCustomer = async (c: Omit<Customer, 'id'>): Promise<Customer | null> => {
    if (apiConnected) {
      try {
        const created = await api.addCustomer(c);
        await applyBootstrap();
        showToast(`Mteja "${c.name}" ameongezwa`, 'success');
        return created;
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
        return null;
      }
    }
    const cid = `cust-${Date.now()}`;
    const created: Customer = { ...c, id: cid };
    setCustomers((prev) => [...prev, created]);
    showToast(`Mteja "${c.name}" ameongezwa`, 'success');
    return created;
  };

  const updateCustomer = async (c: Customer) => {
    if (apiConnected) {
      try {
        await api.updateCustomer(c);
        await applyBootstrap();
        showToast(`Mteja "${c.name}" amebadilishwa`, 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    setCustomers((prev) => prev.map((item) => (item.id === c.id ? c : item)));
    showToast(`Mteja "${c.name}" amebadilishwa`, 'success');
  };

  const deleteCustomer = async (cid: string) => {
    const c = customers.find((x) => x.id === cid);
    if (cid === 'cust-1') {
      showToast('Huwezi kufuta mteja wa kawaida', 'error');
      return;
    }
    if (apiConnected) {
      try {
        await api.deleteCustomer(cid);
        await applyBootstrap();
        if (c) showToast(`Mteja "${c.name}" amefutwa`, 'info');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    setCustomers((prev) => prev.filter((item) => item.id !== cid));
    if (c) showToast(`Mteja "${c.name}" amefutwa`, 'info');
  };

  const payDebt = async (customerId: string, amount: number) => {
    if (apiConnected) {
      try {
        await api.payDebt(customerId, amount);
        await applyBootstrap();
        showToast(`Deni limepunguzwa kwa TZS ${amount.toLocaleString()}`, 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    setCustomers((prev) => prev.map((item) => {
      if (item.id === customerId) {
        const newBal = Math.max(0, item.outstandingBalance - amount);
        showToast(`Deni la ${item.name} limepunguzwa kwa TZS ${amount.toLocaleString()}`, 'success');
        return { ...item, outstandingBalance: newBal };
      }
      return item;
    }));
  };

  // Suppliers
  const addSupplier = async (s: Omit<Supplier, 'id'>) => {
    if (apiConnected) {
      try {
        await api.addSupplier(s);
        await applyBootstrap();
        showToast(`Supplier "${s.name}" ameongezwa`, 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
        throw err;
      }
      return;
    }
    const id = `sup-${Date.now()}`;
    setSuppliers((prev) => [...prev, { ...s, id }]);
    showToast(`Supplier "${s.name}" ameongezwa`, 'success');
  };

  const updateSupplier = async (s: Supplier) => {
    if (apiConnected) {
      try {
        await api.updateSupplier(s);
        await applyBootstrap();
        showToast(`Supplier "${s.name}" amebadilishwa`, 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
        throw err;
      }
      return;
    }
    setSuppliers((prev) => prev.map((item) => (item.id === s.id ? s : item)));
    showToast(`Supplier "${s.name}" amebadilishwa`, 'success');
  };

  const deleteSupplier = async (id: string) => {
    const s = suppliers.find(x => x.id === id);
    if (apiConnected) {
      try {
        await api.deleteSupplier(id);
        await applyBootstrap();
        if (s) showToast(`Supplier "${s.name}" amefutwa`, 'info');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    setSuppliers((prev) => prev.filter((item) => item.id !== id));
    if (s) showToast(`Supplier "${s.name}" amefutwa`, 'info');
  };

  // Users
  const addUser = async (u: Omit<User, 'id'> & { password?: string }) => {
    if (apiConnected) {
      try {
        await api.addUser(u);
        await applyBootstrap();
        showToast(`Mtumiaji "${u.name}" ameongezwa`, 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    const uid = `usr-${Date.now()}`;
    setUsers((prev) => [...prev, { ...u, id: uid }]);
    showToast(`Mtumiaji "${u.name}" ameongezwa`, 'success');
  };

  const updateUser = async (u: User & { password?: string }) => {
    if (apiConnected) {
      try {
        await api.updateUser(u);
        await applyBootstrap();
        if (currentUser && currentUser.id === u.id) {
          setCurrentUser({
            id: u.id,
            name: u.name,
            username: u.username,
            role: u.role,
            active: u.active,
            avatarColor: u.avatarColor,
          });
        }
        showToast(`Mtumiaji "${u.name}" amebadilishwa`, 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    setUsers((prev) => prev.map((item) => (item.id === u.id ? u : item)));
    if (currentUser && currentUser.id === u.id) {
      setCurrentUser(u);
    }
    showToast(`Mtumiaji "${u.name}" amebadilishwa`, 'success');
  };

  const deleteUser = async (uid: string) => {
    const u = users.find((x) => x.id === uid);
    if (currentUser && currentUser.id === uid) {
      showToast('Huwezi kujifuta mwenyewe ukiwa logged in!', 'error');
      return;
    }
    if (apiConnected) {
      try {
        await api.deleteUser(uid);
        await applyBootstrap();
        if (u) showToast(`Mtumiaji "${u.name}" amefutwa`, 'info');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    setUsers((prev) => prev.filter((item) => item.id !== uid));
    if (u) showToast(`Mtumiaji "${u.name}" amefutwa`, 'info');
  };

  // Expenses
  const addExpense = async (e: Omit<Expense, 'id'>) => {
    if (apiConnected) {
      try {
        await api.addExpense(e);
        await applyBootstrap();
        showToast(`Matumizi "${e.title}" ya TZS ${e.amount.toLocaleString()} yameongezwa`, 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
        throw err;
      }
      return;
    }
    const id = `exp-${Date.now()}`;
    setExpenses((prev) => [{ ...e, id }, ...prev]);
    showToast(`Matumizi "${e.title}" ya TZS ${e.amount.toLocaleString()} yameongezwa`, 'success');
  };

  const updateExpense = async (e: Expense) => {
    if (apiConnected) {
      try {
        await api.updateExpense(e);
        await applyBootstrap();
        showToast(`Matumizi "${e.title}" yamebadilishwa`, 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
        throw err;
      }
      return;
    }
    setExpenses((prev) => prev.map((item) => (item.id === e.id ? e : item)));
    showToast(`Matumizi "${e.title}" yamebadilishwa`, 'success');
  };

  const deleteExpense = async (id: string) => {
    const e = expenses.find(x => x.id === id);
    if (apiConnected) {
      try {
        await api.deleteExpense(id);
        await applyBootstrap();
        if (e) showToast(`Matumizi "${e.title}" yamefutwa`, 'info');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    if (e) showToast(`Matumizi "${e.title}" yamefutwa`, 'info');
  };

  // Sales / completeSale
  const completeSale = async (
    items: { productId: string; quantity: number; price: number }[],
    customerId: string,
    paymentMethod: PaymentMethod,
    salesType: SalesType,
    paidAmount: number,
    discount: number,
    dueDate?: string,
    notes?: string,
    chassisEngineNumber?: string,
    vehicleId?: string,
    vehiclePlate?: string
  ): Promise<Order | null> => {
    if (items.length === 0) {
      showToast('Kikapu hakina bidhaa!', 'error');
      return null;
    }

    if (apiConnected) {
      try {
        const order = await api.completeSale({
          items,
          customerId,
          paymentMethod,
          salesType,
          paidAmount,
          discount,
          dueDate,
          notes,
          chassisEngineNumber,
          vehicleId,
          vehiclePlate,
        });
        await applyBootstrap();
        showToast(`Mauzo #${order.orderNumber} yamekamilika kwa TZS ${order.totalAmount.toLocaleString()}`, 'success');
        return order;
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Mauzo yameshindikana', 'error');
        return null;
      }
    }

    for (const cartItem of items) {
      const prod = products.find((p) => p.id === cartItem.productId);
      if (!prod) {
        showToast(`Bidhaa haikupatikana kwenye stoo`, 'error');
        return null;
      }
      if (cartItem.quantity > prod.stock) {
        showToast(`Stock haitoshi kwa "${prod.name}". Kuna ${prod.stock} pekee.`, 'error');
        return null;
      }
    }

    const orderItems = items.map((cartItem) => {
      const prod = products.find((p) => p.id === cartItem.productId)!;
      return {
        productId: cartItem.productId,
        productName: prod.name,
        price: cartItem.price,
        costPrice: prod.costPrice,
        quantity: cartItem.quantity,
        total: cartItem.price * cartItem.quantity,
        partNumber: prod.partNumber,
        brand: prod.brand,
        condition: prod.condition,
        warrantyDays: prod.warrantyDays,
      };
    });

    const subtotal = orderItems.reduce((acc, curr) => acc + curr.total, 0) - discount;
    const taxRate = settings.taxEnabled ? settings.taxRate : 0;
    const taxAmount = settings.taxEnabled ? Math.round(subtotal * (settings.taxRate / 100)) : 0;
    const totalAmount = subtotal + taxAmount;
    const unpaidAmount = totalAmount - paidAmount;
    
    let paymentStatus: 'Paid' | 'Unpaid' | 'Partial' = 'Paid';
    if (paidAmount === 0) {
      paymentStatus = 'Unpaid';
    } else if (unpaidAmount > 0) {
      paymentStatus = 'Partial';
    }

    const customer = customers.find((c) => c.id === customerId) || customers[0];

    // Create unique order number
    const orderNumber = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      customerId: customer.id,
      customerName: customer.name,
      items: orderItems,
      totalAmount,
      discount,
      taxAmount,
      taxRate,
      paidAmount,
      paymentMethod,
      paymentStatus,
      salesType,
      sellerId: currentUser?.id || 'usr-3',
      sellerName: currentUser?.name || 'Muuza POS',
      dueDate,
      notes,
      chassisEngineNumber,
      vehicleId,
      vehiclePlate,
    };

    // 1. Update stock levels and create stock movements
    const todayStr = new Date().toISOString().split('T')[0];
    setProducts((prevProds) => {
      return prevProds.map((prod) => {
        const itemInSale = items.find((itm) => itm.productId === prod.id);
        if (itemInSale) {
          const newStock = prod.stock - itemInSale.quantity;
          return { ...prod, stock: newStock, lastSoldDate: todayStr };
        }
        return prod;
      });
    });

    // 2. Add stock movements
    const movements: StockMovement[] = orderItems.map((item, index) => ({
      id: `mov-${Date.now()}-${index}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      productId: item.productId,
      productName: item.productName,
      type: 'Stock Out',
      quantity: item.quantity,
      source: 'Main Warehouse',
      destination: 'Mteja: ' + customer.name,
      reference: `Mauzo #${orderNumber}`,
    }));
    setStockMovements((prevMovements) => [...movements, ...prevMovements]);

    // 3. Update customer outstanding balance if it was a credit/partial sale
    if (unpaidAmount > 0) {
      setCustomers((prevCusts) => {
        return prevCusts.map((c) => {
          if (c.id === customer.id) {
            return {
              ...c,
              outstandingBalance: c.outstandingBalance + unpaidAmount,
            };
          }
          return c;
        });
      });
    }

    // 4. Save order
    setOrders((prevOrders) => [newOrder, ...prevOrders]);
    showToast(`Mauzo #${orderNumber} yamekamilika kwa TZS ${totalAmount.toLocaleString()}`, 'success');

    // Notify low stock levels after sale
    items.forEach((cartItem) => {
      const prod = products.find((p) => p.id === cartItem.productId);
      if (prod && (prod.stock - cartItem.quantity) <= prod.minStockLevel) {
        setTimeout(() => {
          showToast(`Tahadhari! Stock ya ${prod.name} ipo chini ya kiwango`, 'info');
        }, 1500);
      }
    });

    return newOrder;
  };

  const completeExternalSourcedSale = async (params: {
    productName: string;
    sku: string;
    barcode: string;
    category: string;
    unit: string;
    existingProductId?: string;
    quantity: number;
    purchaseCost: number;
    externalSeller: string;
    sellingPrice: number;
    customerId: string;
    paymentMethod: PaymentMethod;
    salesType: SalesType;
    paidAmount: number;
    discount: number;
    dueDate?: string;
    notes?: string;
    partNumber?: string;
    brand?: string;
    compatibility?: string;
    condition?: 'Mpya' | 'Kutumika' | 'Fanisi';
    warrantyDays?: number;
  }): Promise<Order | null> => {
    const {
      productName,
      sku,
      barcode,
      category,
      unit,
      existingProductId,
      quantity,
      purchaseCost,
      externalSeller,
      sellingPrice,
      customerId,
      paymentMethod,
      salesType,
      paidAmount,
      discount,
      dueDate,
      notes,
      partNumber,
      brand,
      compatibility,
      condition,
      warrantyDays,
    } = params;

    if (quantity <= 0) {
      showToast('Kiasi lazima kiwe zaidi ya sufuri!', 'error');
      return null;
    }

    if (apiConnected) {
      try {
        const order = await api.completeExternalSale(params as unknown as Record<string, unknown>);
        await applyBootstrap();
        showToast(`Mauzo Maalum #${order.orderNumber} yamekamilika`, 'success');
        return order;
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Mauzo yameshindikana', 'error');
        return null;
      }
    }

    let prodId = existingProductId;
    let finalProductName = productName;

    // If product is newly created
    if (!prodId) {
      prodId = `prod-${Date.now()}`;
      const newProduct: Product = {
        id: prodId,
        name: productName,
        sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
        barcode: barcode || Math.floor(1000000000000 + Math.random() * 9000000000000).toString(),
        category: category || 'General',
        costPrice: purchaseCost,
        retailPrice: sellingPrice,
        wholesalePrice: sellingPrice,
        stock: 0, // Keep stock as 0 (net zero)
        minStockLevel: 5,
        unit: unit || 'Pcs',
        partNumber: partNumber || 'NJE-PART',
        brand: brand || 'Aftermarket',
        compatibility: compatibility || 'Aina Zote / Universal',
        condition: condition || 'Mpya',
        warrantyDays: warrantyDays || 0,
      };
      setProducts((prev) => [...prev, newProduct]);
      showToast(`Bidhaa mpya "${productName}" imesajiliwa kwenye mfumo`, 'success');
    } else {
      const existingProduct = products.find(p => p.id === prodId);
      if (existingProduct) {
        finalProductName = existingProduct.name;
      }
    }

    // 1. Log as purchase/expense entry using the real cost paid
    const expenseId = `exp-${Date.now()}`;
    const purchaseExpense: Expense = {
      id: expenseId,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      title: `Ununuzi wa Nje: ${finalProductName} (${quantity} ${unit || 'Pcs'})`,
      category: 'Special Sourcing',
      amount: purchaseCost * quantity,
      description: `Agizo Maalum la mteja. Sourced kutoka kwa muuzaji wa nje: ${externalSeller}. Bei ya ununuzi: TZS ${purchaseCost.toLocaleString()} kila moja.`,
      isExternalSourcing: true,
    };
    setExpenses((prev) => [purchaseExpense, ...prev]);

    // 2. Add Stock movements (Stock In followed by Stock Out)
    const orderNumber = `ORD-EXT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    
    const movementIn: StockMovement = {
      id: `mov-${Date.now()}-in`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      productId: prodId,
      productName: finalProductName,
      type: 'Stock In',
      quantity: quantity,
      source: `Muuzaji wa Nje: ${externalSeller}`,
      destination: 'Main Warehouse',
      reference: `Ununuzi Maalum (Sourced)`,
      source_type: 'external_sourced',
      sourced_from: externalSeller,
    };

    const customer = customers.find((c) => c.id === customerId) || customers[0];

    const movementOut: StockMovement = {
      id: `mov-${Date.now()}-out`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      productId: prodId,
      productName: finalProductName,
      type: 'Stock Out',
      quantity: quantity,
      source: 'Main Warehouse',
      destination: `Mteja: ${customer.name}`,
      reference: `Mauzo Maalum #${orderNumber}`,
      source_type: 'external_sourced',
      sourced_from: externalSeller,
    };

    setStockMovements((prev) => [movementIn, movementOut, ...prev]);

    // 3. Create the order
    const orderItem: OrderItem = {
      productId: prodId,
      productName: finalProductName,
      price: sellingPrice,
      costPrice: purchaseCost, // for correct profit calculation using actual external purchase cost
      quantity: quantity,
      total: sellingPrice * quantity,
      source_type: 'external_sourced',
      sourced_from: externalSeller,
    };

    const subtotal = (sellingPrice * quantity) - discount;
    const taxRate = settings.taxEnabled ? settings.taxRate : 0;
    const taxAmount = settings.taxEnabled ? Math.round(subtotal * (settings.taxRate / 100)) : 0;
    const totalAmount = subtotal + taxAmount;
    const unpaidAmount = totalAmount - paidAmount;

    let paymentStatus: 'Paid' | 'Unpaid' | 'Partial' = 'Paid';
    if (paidAmount === 0) {
      paymentStatus = 'Unpaid';
    } else if (unpaidAmount > 0) {
      paymentStatus = 'Partial';
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      customerId: customer.id,
      customerName: customer.name,
      items: [orderItem],
      totalAmount,
      discount,
      taxAmount,
      taxRate,
      paidAmount,
      paymentMethod,
      paymentStatus,
      salesType,
      sellerId: currentUser?.id || 'usr-3',
      sellerName: currentUser?.name || 'Muuza POS',
      dueDate,
      notes: notes || `Agizo Maalum - Sourced kutoka ${externalSeller}`,
      source_type: 'external_sourced',
      sourced_from: externalSeller,
    };

    // 4. Update customer outstanding balance if partial/credit
    if (unpaidAmount > 0) {
      setCustomers((prevCusts) => {
        return prevCusts.map((c) => {
          if (c.id === customer.id) {
            return {
              ...c,
              outstandingBalance: c.outstandingBalance + unpaidAmount,
            };
          }
          return c;
        });
      });
    }

    // Save order
    setOrders((prevOrders) => [newOrder, ...prevOrders]);
    showToast(`Mauzo Maalum #${orderNumber} yamekamilika kwa TZS ${totalAmount.toLocaleString()}`, 'success');

    return newOrder;
  };

  // Goods Received (Stock In)
  const addStockIn = async (productId: string, quantity: number, supplierId: string, reference: string, costPriceUpdate?: number) => {
    if (apiConnected) {
      try {
        await api.stockIn({ productId, quantity, supplierId, reference, costPriceUpdate });
        await applyBootstrap();
        showToast('Stock imeongezwa', 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    const supplier = suppliers.find((s) => s.id === supplierId);
    const supplierName = supplier ? supplier.name : 'Supplier';
    const prod = products.find((p) => p.id === productId);

    if (!prod) {
      showToast('Bidhaa haikupatikana', 'error');
      return;
    }

    setProducts((prev) => 
      prev.map((p) => {
        if (p.id === productId) {
          const updated = { ...p, stock: p.stock + quantity };
          if (costPriceUpdate !== undefined && costPriceUpdate > 0) {
            updated.costPrice = costPriceUpdate;
          }
          return updated;
        }
        return p;
      })
    );

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      productId,
      productName: prod.name,
      type: 'Stock In',
      quantity,
      source: supplierName,
      destination: 'Main Warehouse',
      reference: reference || 'Goods Received Note',
    };

    setStockMovements((prev) => [movement, ...prev]);
    showToast(`Stock ya "${prod.name}" imeongezeka kwa ${quantity}${costPriceUpdate !== undefined ? ` (True Landed Cost ya TZS ${costPriceUpdate.toLocaleString()} imesasishwa)` : ''}`, 'success');
  };

  // Product Returns Method
  const processProductReturn = async (params: Omit<ProductReturn, 'id' | 'date'>) => {
    if (apiConnected) {
      try {
        await api.processReturn(params);
        await applyBootstrap();
        showToast(`Marejesho ya "${params.productName}" yamesajiliwa kwa ufanisi!`, 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    const { orderId, orderNumber, productId, productName, quantity, reason, condition, customerName, refundMode } = params;
    
    // Create return record
    const newReturn: ProductReturn = {
      id: `ret-${Date.now()}`,
      orderId,
      orderNumber,
      productId,
      productName,
      quantity,
      reason,
      condition,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      customerName,
      refundMode
    };

    // If resellable, put back in stock
    if (condition === 'resellable') {
      setProducts(prev => prev.map(p => {
        if (p.id === productId) {
          return { ...p, stock: p.stock + quantity };
        }
        return p;
      }));

      // Record a stock movement
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        productId,
        productName,
        type: 'Stock In',
        quantity,
        source: 'Marejesho ya Bidhaa (Resellable)',
        destination: 'Main Warehouse',
        reference: `Marejesho ya Ankara ${orderNumber}`,
      };
      setStockMovements(prev => [movement, ...prev]);
    }

    setReturns(prev => [newReturn, ...prev]);
    showToast(`Marejesho ya "${productName}" yamesajiliwa kwa ufanisi!`, 'success');
  };

  // Stock Transfer
  const addStockTransfer = async (productId: string, quantity: number, source: string, destination: string, reference: string) => {
    if (apiConnected) {
      try {
        await api.stockTransfer({ productId, quantity, source, destination, reference });
        await applyBootstrap();
        showToast('Uhamisho umerekodiwa', 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    const prod = products.find((p) => p.id === productId);
    if (!prod) {
      showToast('Bidhaa haikupatikana', 'error');
      return;
    }

    if (prod.stock < quantity) {
      showToast(`Stock haitoshi! Kuna ${prod.stock} pekee kwenye stoo`, 'error');
      return;
    }

    setProducts((prev) => 
      prev.map((p) => (p.id === productId ? { ...p, stock: p.stock - quantity + quantity } : p))
    );

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      productId,
      productName: prod.name,
      type: 'Transfer',
      quantity,
      source,
      destination,
      reference,
    };

    setStockMovements((prev) => [movement, ...prev]);
    showToast(`Uhamisho wa ${quantity} (${prod.name}) umerekodiwa: kutoka ${source} kwenda ${destination}`, 'success');
  };

  // Stock Count (Physical Count Reconciliation)
  const reconcileStockCount = async (productId: string, physicalQty: number, reference: string) => {
    if (apiConnected) {
      try {
        await api.stockReconcile({ productId, physicalQty, reference });
        await applyBootstrap();
        showToast('Stock imerekebishwa', 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    const prod = products.find((p) => p.id === productId);
    if (!prod) {
      showToast('Bidhaa haikupatikana', 'error');
      return;
    }

    const variance = physicalQty - prod.stock;
    if (variance === 0) {
      showToast('Hakuna tofauti (variance) iliyopatikana kwenye stock count', 'info');
      return;
    }

    setProducts((prev) => 
      prev.map((p) => (p.id === productId ? { ...p, stock: physicalQty } : p))
    );

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      productId,
      productName: prod.name,
      type: 'Adjustment',
      quantity: variance,
      source: 'Physical Count Reconciliation',
      destination: 'System Inventory',
      reference: reference || `Upatanisho (Variance: ${variance})`,
    };

    setStockMovements((prev) => [movement, ...prev]);
    showToast(`Stock imerekebishwa kuwa ${physicalQty}. Tofauti: ${variance > 0 ? '+' : ''}${variance}`, 'success');
  };

  const updateSettings = async (newSettings: BusinessSettings) => {
    if (apiConnected) {
      try {
        await api.updateSettings(newSettings);
        setSettings(newSettings);
        showToast('Mipangilio ya biashara imehifadhiwa', 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    setSettings(newSettings);
    showToast('Mipangilio ya biashara imehifadhiwa', 'success');
  };

  // Real JSON backup / restore
  const triggerBackup = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      products,
      categories,
      customers,
      suppliers,
      users: users.map(({ id, name, username, role, active, avatarColor }) => ({
        id, name, username, role, active, avatarColor,
      })),
      expenses,
      orders,
      stockMovements,
      returns,
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adamu-maspare-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const date = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setSettings((prev) => ({ ...prev, lastBackupDate: date }));
    showToast('Backup ya JSON imepakuliwa!', 'success');
  };

  const triggerRestore = (data?: unknown) => {
    if (!data || typeof data !== 'object') {
      showToast('Hakuna data ya kurejesha', 'error');
      return;
    }
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.products)) setProducts(d.products as Product[]);
    if (Array.isArray(d.categories)) setCategories(d.categories as Category[]);
    if (Array.isArray(d.customers)) setCustomers(d.customers as Customer[]);
    if (Array.isArray(d.suppliers)) setSuppliers(d.suppliers as Supplier[]);
    if (Array.isArray(d.users)) setUsers(d.users as User[]);
    if (Array.isArray(d.expenses)) setExpenses(d.expenses as Expense[]);
    if (Array.isArray(d.orders)) setOrders(d.orders as Order[]);
    if (Array.isArray(d.stockMovements)) setStockMovements(d.stockMovements as StockMovement[]);
    if (Array.isArray(d.returns)) setReturns(d.returns as ProductReturn[]);
    if (d.settings && typeof d.settings === 'object') setSettings(d.settings as BusinessSettings);
    showToast('Data imerejeshwa kutoka backup!', 'success');
  };

  const clearAllData = async () => {
    if (apiConnected) {
      try {
        await api.resetData();
        await applyBootstrap();
        showToast('Data ya biashara imefutwa. Watumiaji na mipangilio yamehifadhiwa.', 'success');
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Imeshindikana', 'error');
      }
      return;
    }
    setProducts([]);
    setCustomers(INITIAL_CUSTOMERS.filter((c) => c.id === 'cust-1'));
    setSuppliers([]);
    setExpenses([]);
    setOrders([]);
    setStockMovements([]);
    setReturns([]);

    localStorage.removeItem('pos_products');
    localStorage.removeItem('pos_customers');
    localStorage.removeItem('pos_suppliers');
    localStorage.removeItem('pos_expenses');
    localStorage.removeItem('pos_orders');
    localStorage.removeItem('pos_stock_movements');
    localStorage.removeItem('pos_warranty_claims');
    localStorage.removeItem('pos_returns');

    showToast('Data ya majaribio imefutwa!', 'success');
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      products,
      categories,
      customers,
      suppliers,
      users,
      expenses,
      orders,
      stockMovements,
      returns,
      settings,
      toasts,
      currentScreen,
      apiConnected,
      setScreen,
      login,
      logout,
      showToast,
      removeToast,
      
      addProduct,
      updateProduct,
      deleteProduct,
      
      addCategory,
      updateCategory,
      deleteCategory,
      
      addCustomer,
      updateCustomer,
      deleteCustomer,
      payDebt,
      
      addSupplier,
      updateSupplier,
      deleteSupplier,
      
      addUser,
      updateUser,
      deleteUser,
      
      addExpense,
      updateExpense,
      deleteExpense,
      
      completeSale,
      completeExternalSourcedSale,
      addStockIn,
      addStockTransfer,
      reconcileStockCount,
      processProductReturn,
      updateSettings,
      triggerBackup,
      triggerRestore,
      clearAllData
    }}>
      {children}
      {/* Toast Render Component */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none" id="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            id={`toast-${t.id}`}
            className={`pointer-events-auto p-4 rounded-lg shadow-lg text-white font-medium flex justify-between items-center transition-all duration-300 transform translate-y-0 scale-100 ${
              t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-slate-700'
            }`}
          >
            <span>{t.message}</span>
            <button 
              id={`close-toast-${t.id}`}
              onClick={() => removeToast(t.id)} 
              className="ml-4 text-white hover:text-slate-200 focus:outline-none"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
