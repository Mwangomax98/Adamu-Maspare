import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Customer, PaymentMethod, Order } from '../types';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, UserPlus, CreditCard, 
  Coins, Wallet, ShieldAlert, CheckCircle, Printer, X, Tag, FileText, ChevronRight
} from 'lucide-react';

interface POSScreenProps {
  mode: 'cashier' | 'wholesale' | 'retail';
}

export const POSScreen: React.FC<POSScreenProps> = ({ mode }) => {
  const { 
    products, customers, currentUser, settings, completeSale, addCustomer, showToast 
  } = useApp();

  // Cart State
  const [cart, setCart] = useState<{ product: Product; quantity: number; price: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Checkout Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Barcode input simulator
  const [barcodeInput, setBarcodeInput] = useState('');

  // Modals & Receipts
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [activeOrderReceipt, setActiveOrderReceipt] = useState<Order | null>(null);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustType, setNewCustType] = useState<'Retail' | 'Wholesale'>('Retail');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Get pricing based on POS mode
  const getProductPrice = (p: Product) => {
    return mode === 'wholesale' ? p.wholesalePrice : p.retailPrice;
  };

  // Enforce customer type and default values based on mode
  useEffect(() => {
    if (mode === 'wholesale') {
      // Find first wholesale customer
      const wCust = customers.find(c => c.type === 'Wholesale');
      setSelectedCustomerId(wCust ? wCust.id : '');
      setNewCustType('Wholesale');
      // default credit settings
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      setDueDate(futureDate.toISOString().split('T')[0]);
    } else {
      // Walk-in customer by default for retail/cashier
      setSelectedCustomerId('cust-1');
      setNewCustType('Retail');
      setDueDate('');
    }
    // reset cart
    setCart([]);
    setDiscount(0);
    setPaidAmount(0);
    setNotes('');
  }, [mode, customers]);

  // Handle adding product to cart
  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      showToast(`Mzigo wa "${product.name}" umeisha kabisa!`, 'error');
      return;
    }

    const price = getProductPrice(product);

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const item = prev[existingIndex];
        if (item.quantity >= product.stock) {
          showToast(`Umekataza: Idadi inazidi stoki iliyopo stoo (${product.stock} Pcs)`, 'error');
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = { ...item, quantity: item.quantity + 1 };
        return updated;
      }
      return [...prev, { product, quantity: 1, price }];
    });
  };

  // Adjust Quantity
  const updateQuantity = (productId: string, newQty: number) => {
    const item = cart.find(x => x.product.id === productId);
    if (!item) return;

    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > item.product.stock) {
      showToast(`Stoo ina pcs ${item.product.stock} pekee za "${item.product.name}"`, 'error');
      return;
    }

    setCart(prev => prev.map(x => x.product.id === productId ? { ...x, quantity: newQty } : x));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(x => x.product.id !== productId));
  };

  // Barcode Submission handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;

    const prod = products.find(p => p.barcode === barcodeInput || p.sku.toLowerCase() === barcodeInput.toLowerCase());
    if (prod) {
      addToCart(prod);
      setBarcodeInput('');
    } else {
      showToast(`Barcode/SKU "${barcodeInput}" haikutambuliwa!`, 'error');
    }
  };

  // Category Filtering
  const categoriesList: string[] = ['All', ...Array.from(new Set<string>(products.map(p => p.category)))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.barcode.includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Totals calculations
  const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  // Auto-set paid amount when total changes (unless in wholesale mode where credit is common)
  useEffect(() => {
    if (mode !== 'wholesale') {
      setPaidAmount(total);
    }
  }, [total, mode]);

  // Customer selected details
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Handle Complete Sale
  const handleCheckout = () => {
    if (cart.length === 0) {
      showToast('Kikapu kipo tupu!', 'error');
      return;
    }

    if (mode === 'wholesale' && !selectedCustomerId) {
      showToast('Tafadhali chagua mteja wa jumla ili uendelee!', 'error');
      return;
    }

    const saleItems = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      price: item.price
    }));

    const order = completeSale(
      saleItems,
      selectedCustomerId || 'cust-1',
      paymentMethod,
      mode === 'wholesale' ? 'Wholesale' : 'Retail',
      Number(paidAmount),
      Number(discount),
      mode === 'wholesale' ? dueDate : undefined,
      notes
    );

    if (order) {
      setActiveOrderReceipt(order);
      setCart([]);
      setDiscount(0);
      setPaidAmount(0);
      setNotes('');
    }
  };

  // Add new customer modal action
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName) return;

    addCustomer({
      name: newCustName,
      phone: newCustPhone || 'N/A',
      email: newCustEmail || 'N/A',
      type: newCustType,
      address: newCustAddress || 'N/A',
      outstandingBalance: 0
    });

    // Auto-select newly created customer
    // We fetch the newly generated customer in AppContext but can select it by name or let user select
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setNewCustAddress('');
    setShowAddCustomerModal(false);
  };

  // Helper to format currency
  const fmt = (num: number) => num.toLocaleString() + ' ' + settings.currency;

  return (
    <div id="pos-screen" className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      
      {/* Left side: Search, Grid of products (Col span 7) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        
        {/* Search & Barcode Simulators */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                id="pos-search"
                placeholder="Tafuta bidhaa kwa jina au kategoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Barcode Simulator Form */}
            <form onSubmit={handleBarcodeSubmit} className="sm:w-64 flex gap-2">
              <input
                type="text"
                id="pos-barcode-sim"
                placeholder="Simulate Scanner (Type BC/SKU)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <button
                type="submit"
                id="pos-barcode-add-btn"
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors shrink-0"
              >
                Scan
              </button>
            </form>
          </div>

          {/* Quick Categories list */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categoriesList.map(cat => (
              <button
                key={cat}
                id={`pos-cat-${cat.toLowerCase().replace(' ', '-')}`}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full shrink-0 uppercase border transition-all ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/10'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat === 'All' ? 'Zote' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[580px] overflow-y-auto pr-1">
          {filteredProducts.map(p => {
            const price = getProductPrice(p);
            const inCartCount = cart.find(item => item.product.id === p.id)?.quantity || 0;
            const isOutOfStock = p.stock === 0;

            return (
              <div
                key={p.id}
                id={`pos-product-card-${p.id}`}
                onClick={() => !isOutOfStock && addToCart(p)}
                className={`bg-white p-4 rounded-2xl border transition-all duration-150 select-none flex flex-col justify-between cursor-pointer ${
                  isOutOfStock 
                    ? 'opacity-50 border-slate-200 cursor-not-allowed bg-slate-50' 
                    : inCartCount > 0
                    ? 'border-teal-500 ring-2 ring-teal-500/10 shadow-lg shadow-teal-500/5'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tight uppercase truncate max-w-[80px]">
                      {p.sku}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      p.stock === 0 
                        ? 'bg-rose-100 text-rose-600' 
                        : p.stock <= p.minStockLevel 
                        ? 'bg-amber-100 text-amber-600' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.stock === 0 ? 'Mwisho' : `${p.stock} Pcs`}
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-bold text-slate-800 mt-2 leading-tight line-clamp-2 h-8">
                    {p.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">{p.category}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 font-mono">
                    {price.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">{settings.currency}</span>
                  </span>
                  
                  {inCartCount > 0 ? (
                    <span className="bg-teal-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                      {inCartCount}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-teal-600 group-hover:underline">Add</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right side: Shopping Cart & Checkout (Col span 5) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        
        {/* Unified Cart Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[680px]">
          
          {/* Cart Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase text-slate-800 flex items-center gap-1.5">
              <ShoppingCart className="h-4 w-4 text-teal-600" />
              <span>Kikapu cha Mauzo ({cart.length})</span>
            </h3>
            {cart.length > 0 && (
              <button
                id="pos-clear-cart"
                onClick={() => setCart([])}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Futa Zote
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-2">
                <ShoppingCart className="h-12 w-12 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-semibold">Kikapu kiko tupu. Gonga bidhaa kushoto ili uiongeze hapa.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex justify-between items-center py-2 gap-2">
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-slate-800 truncate">{item.product.name}</h5>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {item.price.toLocaleString()} x {item.quantity} = <span className="font-bold text-slate-800">{(item.price * item.quantity).toLocaleString()} TZS</span>
                    </p>
                  </div>
                  
                  {/* Qty Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-mono font-bold text-xs w-6 text-center text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Controls Area */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-4 shrink-0">
            
            {/* Customer Dropdown & Add Customer Trigger */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Mteja (Customer)</label>
                <button
                  id="pos-add-customer-trigger"
                  onClick={() => setShowAddCustomerModal(true)}
                  className="text-[10px] font-bold text-teal-600 hover:underline flex items-center gap-0.5"
                >
                  <UserPlus className="h-3 w-3" />
                  <span>Sajili Mteja Mpya</span>
                </button>
              </div>
              <select
                id="pos-customer-select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700"
              >
                {/* Filter customer dropdown based on POS mode */}
                {customers
                  .filter(c => mode !== 'wholesale' || c.type === 'Wholesale' || c.id === 'cust-1')
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone !== 'N/A' ? `(${c.phone})` : ''} - {c.type === 'Wholesale' ? 'Jumla' : 'Rejareja'}
                    </option>
                  ))
                }
              </select>
            </div>

            {/* Credit/Debt Warning Widget */}
            {selectedCustomer && selectedCustomer.outstandingBalance > 0 && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-800 flex gap-2 items-center">
                <ShieldAlert className="text-rose-600 h-4 w-4 shrink-0" />
                <div>
                  Mteja huyu ana deni la nyuma la <span className="font-bold">{fmt(selectedCustomer.outstandingBalance)}</span>.
                </div>
              </div>
            )}

            {/* Calculations Totals Area */}
            <div className="space-y-1.5 py-2 border-y border-slate-200 font-medium text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal (Jumla Ndogo)</span>
                <span className="font-mono">{fmt(subtotal)}</span>
              </div>
              
              {/* Discount Entry */}
              <div className="flex justify-between items-center text-slate-500 py-1">
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  <span>Punguzo (Discount TZS)</span>
                </span>
                <input
                  type="number"
                  id="pos-discount-input"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-24 p-1 text-right border border-slate-200 bg-white rounded-lg font-mono text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Due Date & Credit terms (Wholesale POS only) */}
              {mode === 'wholesale' && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Ukomo wa Malipo</label>
                    <input
                      type="date"
                      id="pos-due-date-input"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full p-1 border border-slate-200 bg-white rounded-lg text-[11px] font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Kiasi Kilicholipwa</label>
                    <input
                      type="number"
                      id="pos-paid-amount-input"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value)))}
                      className="w-full p-1 border border-slate-200 bg-white rounded-lg text-[11px] font-mono text-right"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-slate-800 pt-2 border-t border-slate-200">
                <span>Jumla Kuu</span>
                <span className="font-mono text-teal-600">{fmt(total)}</span>
              </div>
            </div>

            {/* Payment Method Selector & Finish Transaction Button */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Njia ya Malipo</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'Cash', label: 'Cash', icon: Coins },
                    { id: 'Mobile Money', label: 'M-Pesa/Tigo', icon: Wallet },
                    { id: 'Benki', label: 'Benki/NMB', icon: CreditCard }
                  ].map(method => {
                    const MethodIcon = method.icon;
                    const isSel = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        id={`pay-method-${method.id.toLowerCase().replace(' ', '-')}`}
                        onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                        className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 font-bold text-[10px] transition-all ${
                          isSel 
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <MethodIcon className="h-4 w-4" />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes Area (Wholesale/Credit references) */}
              {mode === 'wholesale' && (
                <div>
                  <textarea
                    id="pos-notes-textarea"
                    placeholder="Maelezo maalum / Masharti ya mkopo..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={1}
                    className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs"
                  />
                </div>
              )}

              {/* Confirm Sale Submit Button */}
              <button
                type="button"
                id="pos-complete-sale-btn"
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-teal-600/10 hover:shadow-teal-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="h-5 w-5" />
                <span>
                  {mode === 'wholesale' 
                    ? 'Tengeneza Invoice / Ankara' 
                    : 'Kamilisha Mauzo & Risiti'}
                </span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL 1: ADD QUICK CUSTOMER IN POS */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-800">Sajili Mteja Mpya</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Jina Kamili</label>
                <input
                  type="text"
                  required
                  id="modal-cust-name"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Salim Rashid"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Nambari ya Simu</label>
                  <input
                    type="text"
                    id="modal-cust-phone"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. 0712345678"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Mteja wa Aina gani?</label>
                  <select
                    id="modal-cust-type"
                    value={newCustType}
                    onChange={(e) => setNewCustType(e.target.value as 'Retail' | 'Wholesale')}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Retail">Rejareja (Retail)</option>
                    <option value="Wholesale">Jumla (Wholesale)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Barua Pepe (Email)</label>
                <input
                  type="email"
                  id="modal-cust-email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. salim@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Mtaa / Anwani</label>
                <input
                  type="text"
                  id="modal-cust-address"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Mbagala, Dar es Salaam"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  id="modal-save-cust-btn"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-semibold text-white shadow-md"
                >
                  Hifadhi Mteja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINT PREVIEW RECEIPT OR INVOICE */}
      {activeOrderReceipt && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[90vh]">
            
            {/* Modal Actions Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-1.5">
                <Printer className="h-5 w-5 text-teal-400" />
                <span className="text-xs font-extrabold uppercase tracking-wide">
                  {activeOrderReceipt.salesType === 'Wholesale' ? 'Kihakiki cha Invoice' : 'Kihakiki cha Risiti'}
                </span>
              </div>
              <button onClick={() => setActiveOrderReceipt(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Simulated Receipt paper layout (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
              
              {/* Paper body */}
              <div id="receipt-paper" className="w-full bg-white p-6 border border-slate-300 shadow-md font-sans text-xs text-slate-800 space-y-6 flex flex-col justify-between max-w-[380px]">
                
                {/* Brand & Contact Header */}
                <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
                  <h4 className="text-base font-black uppercase text-slate-900 tracking-tight">{settings.businessName}</h4>
                  <p className="text-[10px] text-slate-500">{settings.address}</p>
                  <p className="text-[10px] text-slate-500">Tel: {settings.phone}</p>
                  <p className="text-[10px] text-slate-500">Email: {settings.email}</p>
                </div>

                {/* Metadata details */}
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Nambari ya Ankara:</span>
                    <span className="font-bold font-mono text-slate-900">#{activeOrderReceipt.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tarehe:</span>
                    <span className="font-mono">{activeOrderReceipt.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mhudumu (Teller):</span>
                    <span className="font-semibold">{activeOrderReceipt.sellerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mteja (Customer):</span>
                    <span className="font-bold text-slate-800">{activeOrderReceipt.customerName}</span>
                  </div>
                  {activeOrderReceipt.dueDate && (
                    <div className="flex justify-between text-rose-600 font-bold border-t border-dashed border-slate-100 pt-1 mt-1">
                      <span>Ukomo wa Malipo:</span>
                      <span className="font-mono">{activeOrderReceipt.dueDate}</span>
                    </div>
                  )}
                </div>

                {/* Table of items */}
                <div className="border-t border-b border-dashed border-slate-300 py-3">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                        <th className="pb-2">Bidhaa</th>
                        <th className="pb-2 text-center">Idadi</th>
                        <th className="pb-2 text-right">Bei</th>
                        <th className="pb-2 text-right">Jumla</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeOrderReceipt.items.map((item, idx) => (
                        <tr key={idx} className="text-[11px]">
                          <td className="py-2 pr-1 font-semibold text-slate-900 line-clamp-1">{item.productName}</td>
                          <td className="py-2 text-center font-mono">{item.quantity}</td>
                          <td className="py-2 text-right font-mono">{item.price.toLocaleString()}</td>
                          <td className="py-2 text-right font-mono font-bold text-slate-900">
                            {item.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculation blocks */}
                <div className="space-y-1.5 text-right font-medium text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jumla Ndogo (Subtotal):</span>
                    <span className="font-mono font-semibold">{fmt(activeOrderReceipt.totalAmount + activeOrderReceipt.discount)}</span>
                  </div>
                  {activeOrderReceipt.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Punguzo (Discount):</span>
                      <span className="font-mono font-semibold">-{fmt(activeOrderReceipt.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-teal-600 border-t border-slate-100 pt-2">
                    <span>JUMLA KUU (NET TOTAL):</span>
                    <span className="font-mono">{fmt(activeOrderReceipt.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-1 border-b border-slate-100 pb-1.5">
                    <span>Kiasi Kilicholipwa (Paid):</span>
                    <span className="font-mono font-bold text-emerald-600">{fmt(activeOrderReceipt.paidAmount)}</span>
                  </div>
                  
                  {/* Credit remaining */}
                  {activeOrderReceipt.totalAmount - activeOrderReceipt.paidAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Deni / Mkopo (Balance Due):</span>
                      <span className="font-mono">{fmt(activeOrderReceipt.totalAmount - activeOrderReceipt.paidAmount)}</span>
                    </div>
                  )}
                </div>

                {/* Footer text */}
                <div className="text-center pt-4 border-t border-dashed border-slate-300">
                  <p className="text-[10px] italic font-semibold text-slate-500">{settings.receiptFooter}</p>
                  <p className="text-[9px] text-slate-400 mt-2">Mfumo ulijengwa na AI Coding Assistant. Tanzania</p>
                </div>

              </div>

            </div>

            {/* Print and Close controls footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              <button
                onClick={() => alert('Risiti inachapishwa sasa kwenye printer yako...')}
                id="receipt-print-action-btn"
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-md"
              >
                <Printer className="h-4 w-4" />
                <span>Chapisha Risiti (Print)</span>
              </button>
              <button
                onClick={() => setActiveOrderReceipt(null)}
                id="receipt-close-btn"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Funga (Close)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
