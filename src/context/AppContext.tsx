import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, Category, Customer, Supplier, User, Order, Expense, 
  StockMovement, BusinessSettings, UserRole, PaymentMethod, SalesType
} from '../types';
import { 
  INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_CUSTOMERS, 
  INITIAL_SUPPLIERS, INITIAL_USERS, INITIAL_SETTINGS, 
  INITIAL_EXPENSES, INITIAL_STOCK_MOVEMENTS, INITIAL_ORDERS 
} from '../data/mockData';

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
  settings: BusinessSettings;
  toasts: Toast[];
  currentScreen: string;
  setScreen: (screen: string) => void;
  login: (username: string, role: UserRole) => boolean;
  logout: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Product Methods
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  
  // Category Methods
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;

  // Customer Methods
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  payDebt: (customerId: string, amount: number) => void;

  // Supplier Methods
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;

  // User Methods
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;

  // Expense Methods
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
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
    notes?: string
  ) => Order | null;

  // Stock Movement & Warehouse Management
  addStockIn: (productId: string, quantity: number, supplierId: string, reference: string) => void;
  addStockTransfer: (productId: string, quantity: number, source: string, destination: string, reference: string) => void;
  reconcileStockCount: (productId: string, physicalQty: number, reference: string) => void;

  // Backup & Restore
  triggerBackup: () => void;
  triggerRestore: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or use defaults
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pos_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pos_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('pos_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('pos_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('pos_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('pos_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('pos_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('pos_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('pos_stock_movements');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_MOVEMENTS;
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem('pos_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  const [currentScreen, setScreen] = useState<string>(() => {
    const saved = localStorage.getItem('pos_current_screen');
    return saved || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('pos_current_screen', currentScreen);
  }, [currentScreen]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('pos_current_user', currentUser ? JSON.stringify(currentUser) : '');
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('pos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pos_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('pos_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('pos_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('pos_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('pos_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('pos_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('pos_stock_movements', JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem('pos_settings', JSON.stringify(settings));
  }, [settings]);

  // Toast functions
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth
  const login = (username: string, role: UserRole): boolean => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.role === role);
    if (user) {
      if (!user.active) {
        showToast('Mtumiaji huyu amesitishwa (Inactive)', 'error');
        return false;
      }
      setCurrentUser(user);
      showToast(`Karibu ${user.name}! Umelogin kama ${role}`, 'success');
      return true;
    }
    showToast('Mtumiaji au Role havikupatikana', 'error');
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('Umetoka kwenye mfumo kwa mafanikio', 'info');
  };

  // Products
  const addProduct = (p: Omit<Product, 'id'>) => {
    const id = `prod-${Date.now()}`;
    const newProduct: Product = { ...p, id };
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Bidhaa "${p.name}" imeongezwa`, 'success');

    // record movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      productId: id,
      productName: p.name,
      type: 'Stock In',
      quantity: p.stock,
      source: 'Mizani ya Kuanzia',
      destination: 'Main Warehouse',
      reference: 'Initial Stock Creation',
    };
    setStockMovements((prev) => [movement, ...prev]);
  };

  const updateProduct = (p: Product) => {
    setProducts((prev) => prev.map((item) => (item.id === p.id ? p : item)));
    showToast(`Bidhaa "${p.name}" imebadilishwa`, 'success');
  };

  const deleteProduct = (id: string) => {
    const p = products.find(x => x.id === id);
    setProducts((prev) => prev.filter((item) => item.id !== id));
    if (p) showToast(`Bidhaa "${p.name}" imefutwa`, 'info');
  };

  // Categories
  const addCategory = (c: Omit<Category, 'id'>) => {
    const id = `cat-${Date.now()}`;
    setCategories((prev) => [...prev, { ...c, id }]);
    showToast(`Kundi "${c.name}" limeongezwa`, 'success');
  };

  const updateCategory = (c: Category) => {
    setCategories((prev) => prev.map((item) => (item.id === c.id ? c : item)));
    showToast(`Kundi "${c.name}" limebadilishwa`, 'success');
  };

  const deleteCategory = (id: string) => {
    const c = categories.find(x => x.id === id);
    setCategories((prev) => prev.filter((item) => item.id !== id));
    if (c) showToast(`Kundi "${c.name}" limefutwa`, 'info');
  };

  // Customers
  const addCustomer = (c: Omit<Customer, 'id'>) => {
    const id = `cust-${Date.now()}`;
    setCustomers((prev) => [...prev, { ...c, id }]);
    showToast(`Mteja "${c.name}" ameongezwa`, 'success');
  };

  const updateCustomer = (c: Customer) => {
    setCustomers((prev) => prev.map((item) => (item.id === c.id ? c : item)));
    showToast(`Mteja "${c.name}" amebadilishwa`, 'success');
  };

  const deleteCustomer = (id: string) => {
    const c = customers.find(x => x.id === id);
    if (id === 'cust-1') {
      showToast('Huwezi kufuta mteja wa kawaida', 'error');
      return;
    }
    setCustomers((prev) => prev.filter((item) => item.id !== id));
    if (c) showToast(`Mteja "${c.name}" amefutwa`, 'info');
  };

  const payDebt = (customerId: string, amount: number) => {
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
  const addSupplier = (s: Omit<Supplier, 'id'>) => {
    const id = `sup-${Date.now()}`;
    setSuppliers((prev) => [...prev, { ...s, id }]);
    showToast(`Supplier "${s.name}" ameongezwa`, 'success');
  };

  const updateSupplier = (s: Supplier) => {
    setSuppliers((prev) => prev.map((item) => (item.id === s.id ? s : item)));
    showToast(`Supplier "${s.name}" amebadilishwa`, 'success');
  };

  const deleteSupplier = (id: string) => {
    const s = suppliers.find(x => x.id === id);
    setSuppliers((prev) => prev.filter((item) => item.id !== id));
    if (s) showToast(`Supplier "${s.name}" amefutwa`, 'info');
  };

  // Users
  const addUser = (u: Omit<User, 'id'>) => {
    const id = `usr-${Date.now()}`;
    setUsers((prev) => [...prev, { ...u, id }]);
    showToast(`Mtumiaji "${u.name}" ameongezwa`, 'success');
  };

  const updateUser = (u: User) => {
    setUsers((prev) => prev.map((item) => (item.id === u.id ? u : item)));
    if (currentUser && currentUser.id === u.id) {
      setCurrentUser(u);
    }
    showToast(`Mtumiaji "${u.name}" amebadilishwa`, 'success');
  };

  const deleteUser = (id: string) => {
    const u = users.find(x => x.id === id);
    if (currentUser && currentUser.id === id) {
      showToast('Huwezi kujifuta mwenyewe ukiwa logged in!', 'error');
      return;
    }
    setUsers((prev) => prev.filter((item) => item.id !== id));
    if (u) showToast(`Mtumiaji "${u.name}" amefutwa`, 'info');
  };

  // Expenses
  const addExpense = (e: Omit<Expense, 'id'>) => {
    const id = `exp-${Date.now()}`;
    setExpenses((prev) => [{ ...e, id }, ...prev]);
    showToast(`Matumizi "${e.title}" ya TZS ${e.amount.toLocaleString()} yameongezwa`, 'success');
  };

  const updateExpense = (e: Expense) => {
    setExpenses((prev) => prev.map((item) => (item.id === e.id ? e : item)));
    showToast(`Matumizi "${e.title}" yamebadilishwa`, 'success');
  };

  const deleteExpense = (id: string) => {
    const e = expenses.find(x => x.id === id);
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    if (e) showToast(`Matumizi "${e.title}" yamefutwa`, 'info');
  };

  // Sales / completeSale
  const completeSale = (
    items: { productId: string; quantity: number; price: number }[],
    customerId: string,
    paymentMethod: PaymentMethod,
    salesType: SalesType,
    paidAmount: number,
    discount: number,
    dueDate?: string,
    notes?: string
  ): Order | null => {
    if (items.length === 0) {
      showToast('Kikapu hakina bidhaa!', 'error');
      return null;
    }

    const orderItems = items.map((cartItem) => {
      const prod = products.find((p) => p.id === cartItem.productId);
      if (!prod) {
        throw new Error(`Bidhaa ${cartItem.productId} haikupatikana`);
      }
      return {
        productId: cartItem.productId,
        productName: prod.name,
        price: cartItem.price,
        costPrice: prod.costPrice,
        quantity: cartItem.quantity,
        total: cartItem.price * cartItem.quantity,
      };
    });

    const totalAmount = orderItems.reduce((acc, curr) => acc + curr.total, 0) - discount;
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
      paidAmount,
      paymentMethod,
      paymentStatus,
      salesType,
      sellerId: currentUser?.id || 'usr-3',
      sellerName: currentUser?.name || 'Muuza POS',
      dueDate,
      notes,
    };

    // 1. Update stock levels and create stock movements
    setProducts((prevProds) => {
      return prevProds.map((prod) => {
        const itemInSale = items.find((itm) => itm.productId === prod.id);
        if (itemInSale) {
          const newStock = Math.max(0, prod.stock - itemInSale.quantity);
          return { ...prod, stock: newStock };
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

  // Goods Received (Stock In)
  const addStockIn = (productId: string, quantity: number, supplierId: string, reference: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    const supplierName = supplier ? supplier.name : 'Supplier';
    const prod = products.find((p) => p.id === productId);

    if (!prod) {
      showToast('Bidhaa haikupatikana', 'error');
      return;
    }

    setProducts((prev) => 
      prev.map((p) => (p.id === productId ? { ...p, stock: p.stock + quantity } : p))
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
    showToast(`Stock ya "${prod.name}" imeongezeka kwa ${quantity}`, 'success');
  };

  // Stock Transfer
  const addStockTransfer = (productId: string, quantity: number, source: string, destination: string, reference: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) {
      showToast('Bidhaa haikupatikana', 'error');
      return;
    }

    if (prod.stock < quantity) {
      showToast(`Stock haitoshi! Kuna ${prod.stock} pekee kwenye stoo`, 'error');
      return;
    }

    // In a frontend mock, transfer deducts from general stock or is recorded as movement. We deduct and re-add in simulation
    setProducts((prev) => 
      prev.map((p) => (p.id === productId ? { ...p, stock: p.stock - quantity + quantity } : p)) // stock remains overall same in single storage, but movement tracks it
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
  const reconcileStockCount = (productId: string, physicalQty: number, reference: string) => {
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

  const updateSettings = (newSettings: BusinessSettings) => {
    setSettings(newSettings);
    showToast('Mipangilio ya biashara imehifadhiwa', 'success');
  };

  // Simulated Backup/Restore
  const triggerBackup = () => {
    const date = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setSettings(prev => ({ ...prev, lastBackupDate: date }));
    showToast('Database backup imekamilika kikamilifu!', 'success');
  };

  const triggerRestore = () => {
    showToast('Database restore imekamilika kutoka backup ya mwisho!', 'success');
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
      settings,
      toasts,
      currentScreen,
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
      addStockIn,
      addStockTransfer,
      reconcileStockCount,
      updateSettings,
      triggerBackup,
      triggerRestore
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
