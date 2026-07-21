import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Customer, PaymentMethod, Order } from '../types';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, UserPlus, CreditCard, 
  Coins, Wallet, ShieldAlert, CheckCircle, Printer, X, Tag, FileText, ChevronRight, Sparkles, Check
} from 'lucide-react';

interface POSScreenProps {
  mode: 'cashier' | 'wholesale' | 'retail';
}

export const POSScreen: React.FC<POSScreenProps> = ({ mode }) => {
  const { 
    products, customers, currentUser, settings, completeSale, completeExternalSourcedSale, addCustomer, showToast 
  } = useApp();

  // Cart State
  const [cart, setCart] = useState<{ product: Product; quantity: number; price: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Checkout Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [chassisEngineNumber, setChassisEngineNumber] = useState<string>('');

  // Sourcing Modal State
  const [showSourcingModal, setShowSourcingModal] = useState(false);
  const [sourcingSelectedProduct, setSourcingSelectedProduct] = useState<Product | null>(null);
  const [isNewSourcingProduct, setIsNewSourcingProduct] = useState(false);
  
  const [sourcingProductName, setSourcingProductName] = useState('');
  const [sourcingProductSku, setSourcingProductSku] = useState('');
  const [sourcingProductCategory, setSourcingProductCategory] = useState('Masanduku');
  const [sourcingProductUnit, setSourcingProductUnit] = useState('Pcs');
  
  const [sourcingPartNumber, setSourcingPartNumber] = useState('');
  const [sourcingBrand, setSourcingBrand] = useState('Aftermarket');
  const [sourcingCompatibility, setSourcingCompatibility] = useState('');
  const [sourcingCondition, setSourcingCondition] = useState<'Mpya' | 'Kutumika' | 'Fanisi'>('Mpya');
  const [sourcingWarrantyDays, setSourcingWarrantyDays] = useState<number>(0);
  
  const [sourcingQty, setSourcingQty] = useState<number>(1);
  const [sourcingPurchaseCost, setSourcingPurchaseCost] = useState<number>(0);
  const [sourcingSellerName, setSourcingSellerName] = useState('');
  const [sourcingSellingPrice, setSourcingSellingPrice] = useState<number>(0);

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

  // Find current customer details
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Get pricing based on POS mode or wholesale customer type
  const getProductPrice = (p: Product) => {
    const isWholesaleCustomer = selectedCustomer && selectedCustomer.type === 'Wholesale';
    return (mode === 'wholesale' || isWholesaleCustomer) ? p.wholesalePrice : p.retailPrice;
  };

  // Recalculate cart prices when customer or mode changes
  useEffect(() => {
    if (cart.length === 0) return;
    setCart(prev => prev.map(item => {
      const isWholesaleCustomer = selectedCustomer && selectedCustomer.type === 'Wholesale';
      const updatedPrice = (mode === 'wholesale' || isWholesaleCustomer) ? item.product.wholesalePrice : item.product.retailPrice;
      return { ...item, price: updatedPrice };
    }));
  }, [selectedCustomerId, mode, customers]);

  // Set default vehicle when customer changes
  useEffect(() => {
    if (selectedCustomer && selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0) {
      setSelectedVehicleId(selectedCustomer.vehicles[0].id);
    } else {
      setSelectedVehicleId('');
    }
  }, [selectedCustomerId, customers]);

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
    const isPair = !!product.mustSellAsPair;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const item = prev[existingIndex];
        const addQty = isPair ? 2 : 1;
        const targetQty = item.quantity + addQty;
        if (targetQty > product.stock) {
          showToast(`Umekataza: Idadi inazidi stoki iliyopo stoo (${product.stock} Pcs)`, 'error');
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = { ...item, quantity: targetQty };
        if (isPair) {
          showToast(`Bidhaa hii huuzwa kwa jozi tu. Tumeongeza pcs zingine 2.`, 'info');
        }
        return updated;
      }
      
      const initialQty = isPair ? 2 : 1;
      if (initialQty > product.stock) {
        showToast(`Stoki haitoshelezi kuuza jozi (Inahitaji pcs 2, stoki ni pcs ${product.stock})`, 'error');
        return prev;
      }

      if (isPair) {
        showToast(`Bidhaa hii lazima iuuzwe kwa jozi (seti). Tumeongeza pcs 2 kwenye kikapu.`, 'info');
      }
      return [...prev, { product, quantity: initialQty, price }];
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

    let finalQty = newQty;
    if (item.product.mustSellAsPair) {
      if (newQty % 2 !== 0) {
        // Round up or down depending on manual typing or increment direction
        if (newQty > item.quantity) {
          finalQty = item.quantity + 2;
        } else {
          finalQty = Math.max(0, item.quantity - 2);
          if (finalQty === 0) {
            removeFromCart(productId);
            return;
          }
        }
        showToast(`Vipuri vya aina hii huuzwa kwa jozi pekee (pcs ${finalQty})`, 'info');
      }
    }

    if (finalQty > item.product.stock) {
      showToast(`Stoo ina pcs ${item.product.stock} pekee za "${item.product.name}"`, 'error');
      return;
    }

    setCart(prev => prev.map(x => x.product.id === productId ? { ...x, quantity: finalQty } : x));
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
                          p.barcode.includes(searchTerm) ||
                          p.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.crossReferences && p.crossReferences.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          p.compatibility.toLowerCase().includes(searchTerm.toLowerCase());
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

    const vehicle = selectedCustomer?.vehicles?.find(v => v.id === selectedVehicleId);
    const order = completeSale(
      saleItems,
      selectedCustomerId || 'cust-1',
      paymentMethod,
      mode === 'wholesale' ? 'Wholesale' : 'Retail',
      Number(paidAmount),
      Number(discount),
      mode === 'wholesale' ? dueDate : undefined,
      notes,
      chassisEngineNumber,
      selectedVehicleId || undefined,
      vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})` : undefined
    );

    if (order) {
      setActiveOrderReceipt(order);
      setCart([]);
      setDiscount(0);
      setPaidAmount(0);
      setNotes('');
      setChassisEngineNumber('');
      setSelectedVehicleId('');
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

          {/* Special Sourcing Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hali ya Dharura: Bidhaa isiyopo Stoo?</span>
            <button
              type="button"
              id="pos-external-sourcing-btn"
              onClick={() => {
                setSourcingSelectedProduct(null);
                setIsNewSourcingProduct(true);
                setSourcingProductName('');
                setSourcingProductSku('');
                setSourcingSellingPrice(0);
                setSourcingQty(1);
                setSourcingPurchaseCost(0);
                setSourcingSellerName('');
                setShowSourcingModal(true);
              }}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all shadow-sm uppercase tracking-wide"
            >
              <Sparkles className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
              <span>Agiza kwa Muuzaji Mwingine (Nje)</span>
            </button>
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
                onClick={() => {
                  if (isOutOfStock) {
                    setSourcingSelectedProduct(p);
                    setIsNewSourcingProduct(false);
                    setSourcingProductName(p.name);
                    setSourcingProductSku(p.sku);
                    setSourcingProductCategory(p.category);
                    setSourcingProductUnit(p.unit || 'Pcs');
                    setSourcingSellingPrice(p.retailPrice);
                    setSourcingQty(1);
                    setSourcingPurchaseCost(p.costPrice || 0);
                    setSourcingSellerName('');
                    setShowSourcingModal(true);
                  } else {
                    addToCart(p);
                  }
                }}
                className={`bg-white p-4 rounded-2xl border transition-all duration-150 select-none flex flex-col justify-between cursor-pointer ${
                  isOutOfStock 
                    ? 'border-rose-200 bg-rose-50/10 hover:border-rose-400 hover:shadow-md' 
                    : inCartCount > 0
                    ? 'border-teal-500 ring-2 ring-teal-500/10 shadow-lg shadow-teal-500/5'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-tight uppercase">
                      P/N: {p.partNumber}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      p.stock === 0 
                        ? 'bg-rose-100 text-rose-600' 
                        : p.stock <= p.minStockLevel 
                        ? 'bg-amber-100 text-amber-600' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.stock === 0 ? 'Agiza Nje' : `${p.stock} ${p.unit || 'Pcs'}`}
                    </span>
                  </div>
                  
                  {/* Photo & Title Row */}
                  <div className="flex gap-2.5 mt-2.5 items-start">
                    {p.image ? (
                      <img src={p.image} className="h-10 w-10 rounded-lg object-cover border border-slate-150 shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-300 font-bold shrink-0">
                        N/A
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900 leading-tight line-clamp-2 h-8 flex flex-col justify-start">
                        <span className="truncate block">{p.name}</span>
                        {p.mustSellAsPair && (
                          <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-1 py-0.25 rounded mt-0.5 w-fit">
                            Jozi tu
                          </span>
                        )}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    <span className={`text-[8px] font-black uppercase px-1 rounded ${
                      p.brand === 'Genuine' 
                        ? 'bg-blue-100 text-blue-700' 
                        : p.brand === 'OEM' 
                        ? 'bg-cyan-100 text-cyan-700' 
                        : p.brand === 'Used' 
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {p.brand}
                    </span>
                    <span className="text-[9px] text-slate-400 px-1 font-mono">
                      {p.condition || 'Mpya'}
                    </span>
                    {p.warrantyDays ? (
                      <span className="text-[8px] text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100 font-bold">
                        🛡️ {p.warrantyDays}d
                      </span>
                    ) : null}
                  </div>
                  
                  <p className="text-[9px] text-slate-500 italic mt-2 border-t border-slate-50 pt-1 line-clamp-1">
                    🚗 Inafaa: {p.compatibility}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 font-mono">
                    {price.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">{settings.currency}</span>
                  </span>
                  
                  {isOutOfStock ? (
                    <span className="text-[10px] font-extrabold text-rose-600 group-hover:underline flex items-center gap-0.5 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                      <Sparkles className="h-2.5 w-2.5" />
                      Agiza Nje
                    </span>
                  ) : inCartCount > 0 ? (
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
                  <div className="flex gap-2.5 min-w-0 flex-1 items-center">
                    {item.product.image ? (
                      <img src={item.product.image} className="h-8 w-8 rounded-lg object-cover border border-slate-100 shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-[8px] text-slate-300 font-bold shrink-0">
                        N/A
                      </div>
                    )}
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                        <span>{item.product.name}</span>
                        {item.product.mustSellAsPair && (
                          <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1 rounded">Jozi</span>
                        )}
                      </h5>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {item.price.toLocaleString()} x {item.quantity} = <span className="font-bold text-slate-800">{(item.price * item.quantity).toLocaleString()} TZS</span>
                      </p>
                    </div>
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

            {/* Vehicle Selection */}
            {selectedCustomer && selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-teal-700 uppercase block">Chagua Gari Lililounganishwa (Associated Vehicle)</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="">-- Hakuna gari lililounganishwa --</option>
                  {selectedCustomer.vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.plateNumber}) - {v.year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Chassis/Engine Tracking */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Namba ya Chassis/Engine (Optional)</label>
              <input
                type="text"
                id="pos-chassis-input"
                placeholder="Ingiza chassis ya gari la mteja..."
                value={chassisEngineNumber}
                onChange={(e) => setChassisEngineNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
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
                onClick={() => showToast('Risiti inachapishwa sasa kwenye printer yako...', 'success')}
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

      {/* MODAL 3: SPECIAL SOURCING (AGIZO MAALUM) */}
      {showSourcingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase text-rose-800 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-rose-600" />
                <span>Agiza kwa Muuzaji Mwingine (Agizo Maalum)</span>
              </h3>
              <button onClick={() => setShowSourcingModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                
                // Validate fields
                if (isNewSourcingProduct && !sourcingProductName.trim()) {
                  showToast('Tafadhali weka jina la bidhaa mpya!', 'error');
                  return;
                }
                if (!isNewSourcingProduct && !sourcingSelectedProduct) {
                  showToast('Tafadhali chagua bidhaa iliyopo!', 'error');
                  return;
                }
                if (sourcingQty <= 0) {
                  showToast('Kiasi lazima kiwe zaidi ya 0!', 'error');
                  return;
                }
                if (sourcingPurchaseCost < 0 || sourcingSellingPrice < 0) {
                  showToast('Gharama au bei ya mauzo haiwezi kuwa hasi!', 'error');
                  return;
                }
                if (!sourcingSellerName.trim()) {
                  showToast('Tafadhali weka jina la muuzaji au duka la nje!', 'error');
                  return;
                }

                // Call completeExternalSourcedSale
                const order = completeExternalSourcedSale({
                  productName: isNewSourcingProduct ? sourcingProductName : sourcingSelectedProduct!.name,
                  sku: isNewSourcingProduct ? sourcingProductSku || 'NJE-' + Date.now().toString().slice(-4) : sourcingSelectedProduct!.sku,
                  barcode: isNewSourcingProduct ? 'BC-' + Date.now().toString().slice(-6) : sourcingSelectedProduct!.barcode,
                  category: isNewSourcingProduct ? sourcingProductCategory : sourcingSelectedProduct!.category,
                  unit: isNewSourcingProduct ? sourcingProductUnit : (sourcingSelectedProduct!.unit || 'Pcs'),
                  existingProductId: isNewSourcingProduct ? undefined : sourcingSelectedProduct!.id,
                  quantity: sourcingQty,
                  purchaseCost: sourcingPurchaseCost,
                  externalSeller: sourcingSellerName,
                  sellingPrice: sourcingSellingPrice,
                  customerId: selectedCustomerId || 'cust-1', // Default or selected customer
                  paymentMethod: paymentMethod, // Selected payment method
                  salesType: mode === 'wholesale' ? 'Wholesale' : 'Retail',
                  paidAmount: sourcingSellingPrice * sourcingQty, // Fully paid or customized
                  discount: 0,
                  notes: `Agizo Maalum la Dharura (Sourced from ${sourcingSellerName})`,
                  partNumber: isNewSourcingProduct ? sourcingPartNumber : sourcingSelectedProduct!.partNumber,
                  brand: isNewSourcingProduct ? sourcingBrand : sourcingSelectedProduct!.brand,
                  compatibility: isNewSourcingProduct ? sourcingCompatibility : sourcingSelectedProduct!.compatibility,
                  condition: isNewSourcingProduct ? sourcingCondition : sourcingSelectedProduct!.condition,
                  warrantyDays: isNewSourcingProduct ? sourcingWarrantyDays : sourcingSelectedProduct!.warrantyDays,
                });

                if (order) {
                  showToast('Agizo Maalum limefanikiwa na kusajiliwa!', 'success');
                  setShowSourcingModal(false);
                  setActiveOrderReceipt(order); // Open the receipt preview!
                }
              }}
              className="p-6 space-y-4 max-h-[500px] overflow-y-auto text-left"
            >
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-[11px] text-amber-800 leading-relaxed">
                Njia hii inasajili uagizaji dharura wa bidhaa isiyokuwepo stoo (stock = 0). Mfumo utatengeneza miamala ya dharura ya kuingiza na kutoa stoo papo hapo pamoja na kuandika gharama ya ununuzi na bei ya mauzo ili ripoti za faida zisivurugike.
              </div>

              {/* Toggle Existing vs New Product */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Aina ya Bidhaa</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewSourcingProduct(false);
                      setSourcingSelectedProduct(null);
                      setSourcingProductName('');
                    }}
                    className={`py-2 px-3 border rounded-lg text-xs font-bold transition-all ${
                      !isNewSourcingProduct
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Bidhaa Iliyopo (Existing)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewSourcingProduct(true);
                      setSourcingSelectedProduct(null);
                      setSourcingProductName('');
                      setSourcingProductSku('NJE-' + Math.floor(1000 + Math.random() * 9000));
                    }}
                    className={`py-2 px-3 border rounded-lg text-xs font-bold transition-all ${
                      isNewSourcingProduct
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Bidhaa Mpya Kabisa (Add New)
                  </button>
                </div>
              </div>

              {/* Product Selection / Info fields */}
              {!isNewSourcingProduct ? (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Chagua Bidhaa</label>
                  <select
                    value={sourcingSelectedProduct?.id || ''}
                    onChange={(e) => {
                      const prod = products.find(p => p.id === e.target.value);
                      if (prod) {
                        setSourcingSelectedProduct(prod);
                        setSourcingProductName(prod.name);
                        setSourcingProductSku(prod.sku);
                        setSourcingSellingPrice(prod.retailPrice);
                        setSourcingPurchaseCost(prod.costPrice || 0);
                      }
                    }}
                    required
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">-- Chagua bidhaa iliyopo --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) - Stock: {p.stock}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Jina la Bidhaa Mpya</label>
                    <input
                      type="text"
                      required
                      value={sourcingProductName}
                      onChange={(e) => setSourcingProductName(e.target.value)}
                      placeholder="e.g. Toyota Hilux Brakepad"
                      className="mt-1 w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Part Number / OEM P/N</label>
                      <input
                        type="text"
                        required
                        value={sourcingPartNumber}
                        onChange={(e) => setSourcingPartNumber(e.target.value)}
                        placeholder="e.g. 04465-0K290"
                        className="mt-1 w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Gari/Mashine inayofaa (Compatibility)</label>
                      <input
                        type="text"
                        required
                        value={sourcingCompatibility}
                        onChange={(e) => setSourcingCompatibility(e.target.value)}
                        placeholder="e.g. Toyota Hilux 2015-2021"
                        className="mt-1 w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">SKU (Kodi)</label>
                      <input
                        type="text"
                        value={sourcingProductSku}
                        onChange={(e) => setSourcingProductSku(e.target.value)}
                        placeholder="e.g. APP-01"
                        className="mt-1 w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Kundi (Category)</label>
                      <select
                        value={sourcingProductCategory}
                        onChange={(e) => setSourcingProductCategory(e.target.value)}
                        className="mt-1 w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        <option value="Engine">Injini (Engine)</option>
                        <option value="Suspension">Suspension & Steering</option>
                        <option value="Body Parts">Bodi (Body Parts)</option>
                        <option value="Electrical">Umeme (Electrical)</option>
                        <option value="Filters">Vichujio (Filters)</option>
                        <option value="Braking">Breki (Braking)</option>
                        <option value="Transmission">Gia (Transmission)</option>
                        <option value="Mengineyo">Mengineyo</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Kipimo (Unit)</label>
                      <select
                        value={sourcingProductUnit}
                        onChange={(e) => setSourcingProductUnit(e.target.value)}
                        className="mt-1 w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="Seti">Seti (Set)</option>
                        <option value="Kit">Kit</option>
                        <option value="Jozi">Jozi (Pair)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Chapa (Brand)</label>
                      <select
                        value={sourcingBrand}
                        onChange={(e) => setSourcingBrand(e.target.value)}
                        className="mt-1 w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        <option value="Genuine">Genuine (Original)</option>
                        <option value="OEM">OEM (Manufacturer)</option>
                        <option value="Aftermarket">Aftermarket (Copy)</option>
                        <option value="Used">Used (Kutumika)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Hali (Condition)</label>
                      <select
                        value={sourcingCondition}
                        onChange={(e) => setSourcingCondition(e.target.value as any)}
                        className="mt-1 w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        <option value="Mpya">Mpya (New)</option>
                        <option value="Kutumika">Inayofanya kazi (Used)</option>
                        <option value="Fanisi">Fanisi (Refurbished)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Dhamana (Warranty Days)</label>
                      <input
                        type="number"
                        min={0}
                        value={sourcingWarrantyDays}
                        onChange={(e) => setSourcingWarrantyDays(Math.max(0, Number(e.target.value)))}
                        placeholder="e.g. 30"
                        className="mt-1 w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sourcing Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Kiasi (Quantity Needed)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={sourcingQty}
                    onChange={(e) => setSourcingQty(Math.max(1, Number(e.target.value)))}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Jina la Muuzaji/Duka la Nje</label>
                  <input
                    type="text"
                    required
                    value={sourcingSellerName}
                    onChange={(e) => setSourcingSellerName(e.target.value)}
                    placeholder="e.g. Duka la Mama Maria"
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pricing details */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase text-rose-700">Bei ya Ununuzi (Cost Price)</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      required
                      min={0}
                      value={sourcingPurchaseCost}
                      onChange={(e) => setSourcingPurchaseCost(Math.max(0, Number(e.target.value)))}
                      className="w-full p-2.5 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-bold text-rose-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-3 text-[10px] text-slate-400 font-bold">TZS</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase text-teal-700">Bei ya Mauzo (Selling Price)</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      required
                      min={0}
                      value={sourcingSellingPrice}
                      onChange={(e) => setSourcingSellingPrice(Math.max(0, Number(e.target.value)))}
                      className="w-full p-2.5 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-bold text-teal-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-3 text-[10px] text-slate-400 font-bold">TZS</span>
                  </div>
                </div>
              </div>

              {/* Expected Profit calculations helper */}
              <div className="p-3.5 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Wastani wa Faida Kamili:</span>
                <span className={`font-mono text-sm ${sourcingSellingPrice - sourcingPurchaseCost >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {((sourcingSellingPrice - sourcingPurchaseCost) * sourcingQty).toLocaleString()} TZS
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSourcingModal(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  id="modal-save-sourcing-btn"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  <span>Kamilisha Mauzo sasa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
