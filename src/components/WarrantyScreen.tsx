import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderItem } from '../types';
import { 
  ShieldCheck, Search, Calendar, ChevronRight, AlertCircle, 
  Clock, CheckCircle, XCircle, RotateCcw, PenTool, ShieldAlert,
  Archive, RefreshCw, FileText, User, HelpCircle
} from 'lucide-react';

interface WarrantyClaim {
  id: string;
  orderId: string;
  orderNumber: string;
  date: string;
  productId: string;
  productName: string;
  partNumber: string;
  quantity: number;
  reason: string;
  resolution: 'Replace' | 'Refund' | 'Credit' | 'Reject';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Resolved';
  notes?: string;
}

export const WarrantyScreen: React.FC = () => {
  const { orders, products, updateProduct, showToast, returns, processProductReturn } = useApp();
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'lookup' | 'claims_log' | 'returns_log'>('lookup');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedOrders, setSearchedOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Claims List persisted in localStorage
  const [claims, setClaims] = useState<WarrantyClaim[]>(() => {
    const saved = localStorage.getItem('pos_warranty_claims');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pos_warranty_claims', JSON.stringify(claims));
  }, [claims]);

  // Form claim state
  const [selectedItemForClaim, setSelectedItemForClaim] = useState<{ item: OrderItem; order: Order } | null>(null);
  const [claimQty, setClaimQty] = useState(1);
  const [claimReason, setClaimReason] = useState('');
  const [claimResolution, setClaimResolution] = useState<'Replace' | 'Refund' | 'Credit' | 'Reject'>('Replace');
  const [claimNotes, setClaimNotes] = useState('');

  // Form return state
  const [selectedItemForReturn, setSelectedItemForReturn] = useState<{ item: OrderItem; order: Order } | null>(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnReason, setReturnReason] = useState<'haifai' | 'imeharibika' | 'mteja alibadili mawazo'>('haifai');
  const [returnCondition, setReturnCondition] = useState<'resellable' | 'defective'>('resellable');
  const [returnRefundMode, setReturnRefundMode] = useState<'refunded' | 'credited' | 'discarded'>('refunded');

  // Handle Search Lookup
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchedOrders([]);
      return;
    }

    const q = searchQuery.toLowerCase();
    const results = orders.filter(o => {
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.chassisEngineNumber && o.chassisEngineNumber.toLowerCase().includes(q)) ||
        o.items.some(item => 
          item.productName.toLowerCase().includes(q) || 
          (item.partNumber && item.partNumber.toLowerCase().includes(q))
        )
      );
    });

    setSearchedOrders(results);
    setSelectedOrder(results.length > 0 ? results[0] : null);
    if (results.length === 0) {
      showToast('Hakuna risiti au kipuri kilichopatikana!', 'error');
    } else {
      showToast(`Pata risiti ${results.length} zinazolingana!`, 'success');
    }
  };

  // Helper: Calculate warranty expiration and days remaining
  const getWarrantyStatus = (orderDateStr: string, warrantyDays?: number) => {
    if (!warrantyDays || warrantyDays <= 0) {
      return { status: 'none', daysLeft: 0, text: 'Hakuna Dhamana', dateText: '-' };
    }

    const parts = orderDateStr.split(' ')[0].split('-'); // YYYY-MM-DD
    const oDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    
    // Add warranty days
    const expDate = new Date(oDate.getTime());
    expDate.setDate(expDate.getDate() + warrantyDays);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    expDate.setHours(0,0,0,0);

    const diffTime = expDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formattedExpDate = `${expDate.getDate()}/${expDate.getMonth() + 1}/${expDate.getFullYear()}`;

    if (daysLeft < 0) {
      return { 
        status: 'expired', 
        daysLeft, 
        text: 'Imeisha (Expired)', 
        dateText: formattedExpDate 
      };
    } else {
      return { 
        status: 'active', 
        daysLeft, 
        text: `Inatumika (${daysLeft} Siku zimebaki)`, 
        dateText: formattedExpDate 
      };
    }
  };

  // Submit claim
  const handleSubClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForClaim) return;

    const { item, order } = selectedItemForClaim;

    if (claimQty <= 0 || claimQty > item.quantity) {
      showToast(`Kiasi hakiwezi kuwa chini ya 1 au zaidi ya kiasi kilichonunuliwa (${item.quantity})!`, 'error');
      return;
    }

    const newClaim: WarrantyClaim = {
      id: 'CLM-' + Math.floor(100000 + Math.random() * 900000),
      orderId: order.id,
      orderNumber: order.orderNumber,
      date: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0].slice(0, 5),
      productId: item.productId,
      productName: item.productName,
      partNumber: item.partNumber || 'N/A',
      quantity: claimQty,
      reason: claimReason,
      resolution: claimResolution,
      status: 'Pending',
      notes: claimNotes
    };

    setClaims([newClaim, ...claims]);
    setSelectedItemForClaim(null);
    setClaimReason('');
    setClaimNotes('');
    showToast(`Dai jipya ${newClaim.id} limesajiliwa kwa ufanisi!`, 'success');
  };

  // Submit product return
  const handleSubReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForReturn) return;

    const { item, order } = selectedItemForReturn;

    if (returnQty <= 0 || returnQty > item.quantity) {
      showToast(`Kiasi hakiwezi kuwa chini ya 1 au zaidi ya kiasi kilichonunuliwa (${item.quantity})!`, 'error');
      return;
    }

    processProductReturn({
      orderId: order.id,
      orderNumber: order.orderNumber,
      productId: item.productId,
      productName: item.productName,
      quantity: returnQty,
      reason: returnReason,
      condition: returnCondition,
      customerName: order.customerName,
      refundMode: returnRefundMode
    });

    setSelectedItemForReturn(null);
    setReturnReason('haifai');
    setReturnCondition('resellable');
    setReturnRefundMode('refunded');
  };

  // Action status update
  const updateClaimStatus = (claimId: string, newStatus: 'Approved' | 'Rejected' | 'Resolved') => {
    setClaims(claims.map(c => {
      if (c.id === claimId) {
        // If approved and resolution was 'Replace' or 'Refund', we could adjust stocks or notify
        if (newStatus === 'Resolved' && c.status !== 'Resolved') {
          // Put part back into stock or scrap
          const prod = products.find(p => p.id === c.productId);
          if (prod && c.resolution === 'Replace') {
            // Deduct another part for replacement or manage stock
            showToast(`Mteja amepewa kipuri kingine mbadala mkataba wa ${c.id} umekamilika!`, 'success');
          } else if (prod && c.resolution === 'Refund') {
            // If returning bad item to stock
            updateProduct({
              ...prod,
              stock: prod.stock + c.quantity // returned back for scrap/repair
            });
            showToast(`Bidhaa ${c.quantity} imerejeshwa stoo na mteja amerudishiwa pesa!`, 'success');
          }
        }
        return { ...c, status: newStatus };
      }
      return c;
    }));
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black uppercase text-slate-800 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-teal-600" />
            <span>Marejesho & Ufuatiliaji wa Dhamana (Warranty & Returns)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ukurasa huu unaruhusu kuangalia muda wa dhamana ya vipuri vilivyouzwa na kufungua madai ya marejesho au ubadilishaji (warranty claims).
          </p>
        </div>

        {/* Tab switchers */}
        <div className="bg-slate-200/60 p-1 rounded-xl flex gap-1 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveTab('lookup')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
              activeTab === 'lookup'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Hakiki Risiti / Marejesho
          </button>
          <button
            onClick={() => setActiveTab('claims_log')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
              activeTab === 'claims_log'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Kumbukumbu ya Dhamana ({claims.length})
          </button>
          <button
            onClick={() => setActiveTab('returns_log')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
              activeTab === 'returns_log'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Kumbukumbu ya Marejesho ({returns.length})
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE VIEW */}
      {activeTab === 'lookup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Search & results (col span 5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black uppercase text-slate-700 mb-3">Tafuta Risiti</h3>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Weka namba ya risiti, chassis au jina..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                >
                  Tafuta
                </button>
              </form>
            </div>

            {/* Results list */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400">Matokeo ya Utafutaji ({searchedOrders.length})</h3>
              
              {searchedOrders.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                  Tafuta namba ya risiti kuona vipuri na hali yao ya dhamana.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {searchedOrders.map(o => (
                    <div
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selectedOrder?.id === o.id
                          ? 'bg-teal-50 border-teal-300 ring-1 ring-teal-300'
                          : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-black font-mono text-slate-700">{o.orderNumber}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{o.date.split(' ')[0]}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1.5 flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        <span>{o.customerName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                        <span>Bidhaa: {o.items.length} vipuri</span>
                        <span className="font-mono font-bold text-teal-600">{(o.totalAmount - o.discount).toLocaleString()} TZS</span>
                      </div>
                      {o.chassisEngineNumber && (
                        <div className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono mt-1.5 inline-block">
                          Chassis: {o.chassisEngineNumber}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Receipt details & Warranty status (col span 7) */}
          <div className="lg:col-span-7">
            {selectedOrder ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                
                {/* Details header */}
                <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
                      Taarifa za Risiti
                    </span>
                    <h3 className="text-lg font-black font-mono text-slate-800 mt-2">{selectedOrder.orderNumber}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Tarehe ya Mauzo: {selectedOrder.date}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block">Mteja</span>
                    <span className="text-sm font-black text-slate-800 block">{selectedOrder.customerName}</span>
                    {selectedOrder.chassisEngineNumber && (
                      <span className="text-[10px] text-slate-500 font-mono">Chassis: {selectedOrder.chassisEngineNumber}</span>
                    )}
                  </div>
                </div>

                {/* Items and their warranties */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400">Vipuri na Muda wa Dhamana</h4>
                  
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => {
                      const warranty = getWarrantyStatus(selectedOrder.date, item.warrantyDays);
                      
                      return (
                        <div key={`${item.productId}-${idx}`} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h5 className="text-xs font-black text-slate-800">{item.productName}</h5>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Part Number: {item.partNumber || 'N/A'}</p>
                              <div className="flex gap-1 mt-1.5">
                                <span className="text-[9px] bg-slate-200/70 text-slate-600 px-1.5 py-0.2 rounded font-bold uppercase">
                                  {item.brand || 'Aftermarket'}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">Qty: {item.quantity} | Bei: {item.price.toLocaleString()} TZS</span>
                              </div>
                            </div>

                            {/* Warranty Badge */}
                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase block text-center ${
                                warranty.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : warranty.status === 'expired'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-200 text-slate-600'
                              }`}>
                                {warranty.text}
                              </span>
                              {item.warrantyDays ? (
                                <span className="text-[9px] text-slate-400 font-mono mt-1 block">Mwisho: {warranty.dateText}</span>
                              ) : null}
                            </div>
                          </div>

                          {/* Warranty and Return actions */}
                          <div className="pt-2 border-t border-slate-200/50 flex flex-wrap gap-2 justify-between items-center">
                            <p className="text-[10px] text-slate-500 italic">
                              {item.warrantyDays && item.warrantyDays > 0 ? (
                                warranty.status === 'active' 
                                  ? 'Dhamana bado inakubali kurejeshwa/kubadilishwa.' 
                                  : 'Muda wa dhamana umekwisha.'
                              ) : 'Kipuri hiki hakina dhamana iliyosajiliwa (0 Days).'}
                            </p>
                            
                            <div className="flex gap-2">
                              {/* Return Button (Always Available for purchased items) */}
                              <button
                                onClick={() => setSelectedItemForReturn({ item, order: selectedOrder })}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-neutral-950 shadow-xs"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Sajili Marejesho</span>
                              </button>

                              {/* Warranty Claim Button */}
                              {item.warrantyDays && item.warrantyDays > 0 && (
                                <button
                                  onClick={() => setSelectedItemForClaim({ item, order: selectedOrder })}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                                    warranty.status === 'active'
                                      ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                                      : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                  }`}
                                  disabled={warranty.status !== 'active'}
                                >
                                  <PenTool className="h-3 w-3" />
                                  <span>Dai la Dhamana</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-16 border border-dashed border-slate-200 rounded-3xl bg-white text-center text-slate-400 flex flex-col items-center justify-center gap-4">
                <ShieldCheck className="h-12 w-12 text-slate-300 stroke-[1.2]" />
                <div>
                  <h4 className="text-sm font-bold text-slate-700">Chagua Risiti kuona Dhamana</h4>
                  <p className="text-xs text-slate-400 mt-1">Tafuta au chagua risiti ya mteja ili ufuatilie hali ya dhamana ya vipuri vyake.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: CLAIMS LOG */}
      {activeTab === 'claims_log' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase text-slate-800">Kumbukumbu ya Madai ya Dhamana ({claims.length})</h3>
            <span className="text-[10px] text-slate-400 font-mono">Mfumo wa Dhamana Adamu Maspare</span>
          </div>

          {claims.length === 0 ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Archive className="h-10 w-10 text-slate-300" />
              <p className="text-xs">Hakuna madai ya dhamana yaliyowasilishwa bado.</p>
            </div>
          ) : (
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="min-w-full text-left text-xs text-slate-700 font-sans">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                    <th className="py-3 px-4">ID / Tarehe</th>
                    <th className="py-3 px-4">Risiti / Ankara</th>
                    <th className="py-3 px-4">Kipuri / Part</th>
                    <th className="py-3 px-4 text-center">Kiasi</th>
                    <th className="py-3 px-4">Sababu ya Dai</th>
                    <th className="py-3 px-4">Uamuzi (Resolution)</th>
                    <th className="py-3 px-4 text-center">Hali (Status)</th>
                    <th className="py-3 px-4 text-center">Vitendo (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {claims.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{c.id}</span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">{c.date}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                        {c.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{c.productName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">P/N: {c.partNumber}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold font-mono">
                        {c.quantity} Pcs
                      </td>
                      <td className="py-3.5 px-4 max-w-[150px] truncate text-slate-500" title={c.reason}>
                        {c.reason}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          c.resolution === 'Replace'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : c.resolution === 'Refund'
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : c.resolution === 'Credit'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.resolution === 'Replace' ? 'Dhibiti (Replace)' : c.resolution === 'Refund' ? 'Rudisha Pesa' : c.resolution === 'Credit' ? 'Kredit ya Duka' : 'Kataliwa'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          c.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : c.status === 'Approved'
                            ? 'bg-blue-100 text-blue-700'
                            : c.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {c.status === 'Resolved' ? 'Imetatuliwa' : c.status === 'Approved' ? 'Kubaliwa' : c.status === 'Rejected' ? 'Kataliwa' : 'Inasubiri'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          {c.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => updateClaimStatus(c.id, 'Approved')}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-bold transition-colors"
                              >
                                Kubali (Approve)
                              </button>
                              <button
                                onClick={() => updateClaimStatus(c.id, 'Rejected')}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold transition-colors"
                              >
                                Kataa
                              </button>
                            </>
                          )}
                          {c.status === 'Approved' && (
                            <button
                              onClick={() => updateClaimStatus(c.id, 'Resolved')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold transition-colors"
                            >
                              Kamilisha (Resolve)
                            </button>
                          )}
                          {c.status === 'Resolved' && (
                            <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 font-bold">
                              <CheckCircle className="h-3 w-3" /> Imeisha
                            </span>
                          )}
                          {c.status === 'Rejected' && (
                            <span className="text-[10px] text-rose-600 flex items-center gap-0.5 font-bold">
                              <XCircle className="h-3 w-3" /> Imekataliwa
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RETURNS LOG */}
      {activeTab === 'returns_log' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase text-slate-800">Kumbukumbu ya Marejesho ya Bidhaa ({returns.length})</h3>
            <span className="text-[10px] text-slate-400 font-mono">Mfumo wa Marejesho Adamu Maspare</span>
          </div>

          {returns.length === 0 ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RotateCcw className="h-10 w-10 text-slate-300" />
              <p className="text-xs">Hakuna bidhaa zilizorejeshwa kwenye kumbukumbu bado.</p>
            </div>
          ) : (
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="min-w-full text-left text-xs text-slate-700 font-sans">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                    <th className="py-3 px-4">Namba ya Marejesho / Tarehe</th>
                    <th className="py-3 px-4">Risiti ya Mauzo</th>
                    <th className="py-3 px-4">Mteja (Customer)</th>
                    <th className="py-3 px-4">Kipuri kilichorejeshwa</th>
                    <th className="py-3 px-4 text-center">Kiasi</th>
                    <th className="py-3 px-4">Sababu (Reason)</th>
                    <th className="py-3 px-4 text-center">Hali ya Kipuri (Condition)</th>
                    <th className="py-3 px-4 text-center">Malipo / Ushughulikiaji</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {returns.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{r.id}</span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">{r.date}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                        {r.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {r.customerName}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {r.productName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold font-mono">
                        {r.quantity} Pcs
                      </td>
                      <td className="py-3.5 px-4 capitalize">
                        {r.reason === 'haifai' ? 'Kipuri Hakifai' : r.reason === 'imeharibika' ? 'Kimeharibika/Bovu' : 'Mteja Alibadili Mawazo'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          r.condition === 'resellable'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {r.condition === 'resellable' ? 'Rudi Stoo (Nzuri)' : 'Bovu / Defective'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          r.refundMode === 'refunded'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.refundMode === 'credited'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {r.refundMode === 'refunded' ? 'Amepewa Pesa (Refunded)' : r.refundMode === 'credited' ? 'Kredit (Store Credit)' : 'Imetupwa (Discarded)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: SUBMIT CLAIM FORM */}
      {selectedItemForClaim && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 font-sans">
            <div className="p-4 bg-teal-50 border-b border-teal-100 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase text-teal-800 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-teal-600" />
                <span>Wasilisha Dai la Dhamana (Claim)</span>
              </h3>
              <button 
                onClick={() => setSelectedItemForClaim(null)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubClaim} className="p-5 space-y-4 text-left">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                <p className="font-bold text-slate-700">Kipuri: {selectedItemForClaim.item.productName}</p>
                <p className="text-slate-500">P/N: {selectedItemForClaim.item.partNumber || 'N/A'}</p>
                <p className="text-slate-500 font-mono">Namba ya Risiti: {selectedItemForClaim.order.orderNumber}</p>
                <p className="text-slate-500">Kiasi Kilichonunuliwa: <strong className="text-slate-700">{selectedItemForClaim.item.quantity} Pcs</strong></p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Kiasi cha Kurejesha</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedItemForClaim.item.quantity}
                  value={claimQty}
                  onChange={(e) => setClaimQty(Math.min(selectedItemForClaim.item.quantity, Math.max(1, Number(e.target.value))))}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Sababu ya Marejesho / Hitilafu</label>
                <textarea
                  required
                  rows={2}
                  value={claimReason}
                  onChange={(e) => setClaimReason(e.target.value)}
                  placeholder="e.g. Kipuri kinaleta kelele wakati wa breki au hakikuingiliana vizuri na gari."
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Uamuzi unaopendekezwa (Resolution)</label>
                <select
                  value={claimResolution}
                  onChange={(e) => setClaimResolution(e.target.value as any)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Replace">Badilisha na Kipuri Kipya (Replace)</option>
                  <option value="Refund">Rudisha Pesa kwa Mteja (Refund)</option>
                  <option value="Credit">Weka Kredit kwenye Akaunti ya Mteja (Store Credit)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Maelezo ya Ziada (Optional)</label>
                <textarea
                  rows={1}
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder="Maelezo ya ziada..."
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemForClaim(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Sajili Dai sasa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT Product Return FORM */}
      {selectedItemForReturn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 font-sans">
            <div className="p-4 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase text-amber-800 flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4 text-amber-600" />
                <span>Sajili Marejesho ya Bidhaa (Return)</span>
              </h3>
              <button 
                onClick={() => setSelectedItemForReturn(null)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubReturn} className="p-5 space-y-4 text-left">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                <p className="font-bold text-slate-700">Kipuri: {selectedItemForReturn.item.productName}</p>
                <p className="text-slate-500">P/N: {selectedItemForReturn.item.partNumber || 'N/A'}</p>
                <p className="text-slate-500 font-mono">Namba ya Risiti: {selectedItemForReturn.order.orderNumber}</p>
                <p className="text-slate-500">Kiasi Kilichonunuliwa: <strong className="text-slate-700">{selectedItemForReturn.item.quantity} Pcs</strong></p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Kiasi cha Kurejesha (Return Qty)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedItemForReturn.item.quantity}
                  value={returnQty}
                  onChange={(e) => setReturnQty(Math.min(selectedItemForReturn.item.quantity, Math.max(1, Number(e.target.value))))}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Sababu ya Marejesho (Return Reason)</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value as any)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="haifai">Kipuri Hakifai / Hakikuingiliana vizuri (Incorrect Part)</option>
                  <option value="imeharibika">Kimeharibika / Bovu (Faulty/Damaged)</option>
                  <option value="mteja alibadili mawazo">Mteja alibadili mawazo (Customer Changed Mind)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Hali ya Kipuri (Condition)</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setReturnCondition('resellable');
                      if (returnRefundMode === 'discarded') setReturnRefundMode('refunded');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      returnCondition === 'resellable'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-300'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Rudi Stoo (Resellable)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnCondition('defective');
                      setReturnRefundMode('discarded');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      returnCondition === 'defective'
                        ? 'bg-rose-50 border-rose-300 text-rose-800 ring-1 ring-rose-300'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Bovu / Defective
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Mbinu ya Ushughulikiaji (Refund Mode)</label>
                <select
                  value={returnRefundMode}
                  onChange={(e) => setReturnRefundMode(e.target.value as any)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {returnCondition === 'resellable' ? (
                    <>
                      <option value="refunded">Rudisha Pesa kwa Mteja (Refunded)</option>
                      <option value="credited">Weka Kredit kwenye Akaunti (Store Credit)</option>
                    </>
                  ) : (
                    <>
                      <option value="discarded">Imetupwa / Defective Write-off (Discarded)</option>
                      <option value="refunded">Rudisha Pesa (Refunded despite damage)</option>
                      <option value="credited">Weka Kredit (Store Credit despite damage)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemForReturn(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Kamilisha Marejesho</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
