import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { AlertTriangle, Download, Info, CheckCircle, PackageOpen, X } from 'lucide-react';

export const LowStockScreen: React.FC = () => {
  const { products, suppliers, addStockIn, currentUser, settings } = useApp();
  const [replenishProduct, setReplenishProduct] = useState<Product | null>(null);
  
  // Deterministically map a supplier from list based on product id
  const getPreferredSupplier = (p: Product) => {
    if (suppliers.length === 0) return 'Masupaza General Traders';
    const indexStr = p.id.split('-').pop() || '1';
    const numericIndex = parseInt(indexStr, 10);
    const supplier = suppliers[isNaN(numericIndex) ? 0 : (numericIndex - 1) % suppliers.length] || suppliers[0];
    return supplier.name;
  };

  // Form State
  const [qtyToAdd, setQtyToAdd] = useState(50);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [refCode, setRefCode] = useState('');

  const canRestock = ['Admin', 'Store Keeper'].includes(currentUser?.role || '');

  // Filter low stock
  const lowStockItems = products.filter(p => p.stock <= p.minStockLevel);

  const getSeverity = (p: Product) => {
    if (p.stock === 0) return { label: 'IMEISHA', color: 'bg-rose-100 text-rose-700 border-rose-200', text: 'text-rose-600', level: 'critical' };
    if (p.stock <= p.minStockLevel * 0.3) return { label: 'CRITICAL', color: 'bg-rose-100 text-rose-700 border-rose-200', text: 'text-rose-600', level: 'critical' };
    return { label: 'PUNGUPU', color: 'bg-amber-100 text-amber-700 border-amber-200', text: 'text-amber-600', level: 'warning' };
  };

  const handleOpenRestock = (p: Product) => {
    setReplenishProduct(p);
    setQtyToAdd(50);
    setSelectedSupplier(suppliers[0]?.id || '');
    setRefCode(`RESTOCK-${Date.now().toString().slice(-4)}`);
  };

  const handleSaveRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replenishProduct) return;
    
    addStockIn(replenishProduct.id, Number(qtyToAdd), selectedSupplier, refCode);
    setReplenishProduct(null);
  };

  return (
    <div id="low-stock-screen" className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold uppercase text-slate-800 flex items-center gap-2">
          <AlertTriangle className="text-rose-600 h-6 w-6" />
          <span>Taarifa za Bidhaa Zilizoisha au Kupungua (Low Stock Levels)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Orodha hii inaonyesha bidhaa zote zilizopo stoo ambazo idadi yake imefika au kushuka chini ya kiwango kilichowekwa cha dharura.
        </p>
      </div>

      {/* Info Widget */}
      <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl flex gap-3 text-xs border border-slate-800 items-center">
        <Info className="text-amber-400 shrink-0 h-5 w-5 animate-pulse" />
        <div>
          <span className="font-bold text-white uppercase tracking-wider">Maana ya Alama za Rangi:</span> Mfumo unaonyesha rangi <span className="text-rose-400 font-bold">Nyekundu (Critical)</span> kama bidhaa imeisha kabisa au ipo chini ya 30% ya kiwango kilichowekwa cha dharura, na rangi <span className="text-amber-400 font-bold">Manjano (Warning)</span> kama ipo chini ya kiwango lakini haijafikia hatua mbaya sana bado.
        </div>
      </div>

      {/* Table of Low Stock Items */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase">Jumla ya Bidhaa za Dharura ({lowStockItems.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Jina la Bidhaa</th>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Kundi</th>
                <th className="py-3 px-4 text-center">Reorder Level</th>
                <th className="py-3 px-4 text-center">Salio la Sasa</th>
                <th className="py-3 px-4 text-center">Kiwango cha Uzito</th>
                <th className="py-3 px-4">Supplier Mkuu</th>
                {canRestock && <th className="py-3 px-4 text-center">Kitendo</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {lowStockItems.length === 0 ? (
                <tr>
                  <td colSpan={canRestock ? 8 : 7} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle className="h-10 w-10 text-emerald-500" />
                      <p className="text-xs font-semibold">Stoo ipo katika hali nzuri sana! Hakuna bidhaa yoyote iliyopungua.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                lowStockItems.map(p => {
                  const severity = getSeverity(p);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-semibold text-slate-800">{p.name}</td>
                      <td className="py-4 px-4 font-mono text-[11px] text-slate-500">{p.sku}</td>
                      <td className="py-4 px-4 text-slate-600">{p.category}</td>
                      <td className="py-4 px-4 text-center font-bold text-slate-500 font-mono">
                        {p.minStockLevel} {p.unit.split(' ')[0]}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block font-bold px-2.5 py-1 rounded-lg text-sm font-mono ${
                          severity.level === 'critical' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {p.stock} Pcs
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${severity.color}`}>
                          {severity.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-semibold">{getPreferredSupplier(p)}</td>
                      {canRestock && (
                        <td className="py-4 px-4 text-center">
                          <button
                            id={`restock-btn-${p.id}`}
                            onClick={() => handleOpenRestock(p)}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[10px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 mx-auto"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Agiza Mzigo (Restock)</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPLENISH MODAL */}
      {replenishProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden font-sans">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-800 flex items-center gap-1.5">
                <PackageOpen className="h-5 w-5 text-teal-600" />
                <span>Ongeza Stock: {replenishProduct.name}</span>
              </h3>
              <button onClick={() => setReplenishProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRestock} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <p className="font-semibold text-slate-800">Hali ya stoo kwa sasa:</p>
                <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-slate-600">
                  <div>Stock Iliyopo: <span className="font-bold text-slate-800">{replenishProduct.stock} Pcs</span></div>
                  <div>Kiwango cha chini: <span className="font-bold text-slate-800">{replenishProduct.minStockLevel} Pcs</span></div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Idadi ya kuongeza (Quantity to Add)</label>
                <input
                  type="number"
                  required
                  id="replenish-qty"
                  min={1}
                  value={qtyToAdd}
                  onChange={(e) => setQtyToAdd(Number(e.target.value))}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Msambazaji (Supplier)</label>
                <select
                  id="replenish-supplier"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.contactPerson})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Nambari ya Marejeo (Ref / GRN Code)</label>
                <input
                  type="text"
                  required
                  id="replenish-ref"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setReplenishProduct(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  id="replenish-save-btn"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-semibold text-white shadow-md"
                >
                  Thibitisha & Pokea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
