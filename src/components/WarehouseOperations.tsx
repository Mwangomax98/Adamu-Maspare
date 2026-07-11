import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { Download, ArrowLeftRight, ClipboardList, CheckCircle2, AlertCircle, Save, HelpCircle } from 'lucide-react';

interface WarehouseOperationsProps {
  initialTab?: 'goods_received' | 'stock_transfer' | 'stock_count';
}

export const WarehouseOperations: React.FC<WarehouseOperationsProps> = ({ initialTab = 'goods_received' }) => {
  const { 
    products, suppliers, addStockIn, addStockTransfer, reconcileStockCount, currentUser 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'goods_received' | 'stock_transfer' | 'stock_count'>(initialTab);

  // --- SUB-FORM 1: GOODS RECEIVED ---
  const [grProductId, setGrProductId] = useState(products[0]?.id || '');
  const [grQty, setGrQty] = useState(50);
  const [grSupplierId, setGrSupplierId] = useState(suppliers[0]?.id || '');
  const [grRef, setGrRef] = useState(`GRN-${Date.now().toString().slice(-4)}`);

  const handleGoodsReceivedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grProductId || grQty <= 0 || !grSupplierId) return;
    addStockIn(grProductId, Number(grQty), grSupplierId, grRef);
    // Reset
    setGrQty(50);
    setGrRef(`GRN-${Date.now().toString().slice(-4)}`);
  };

  // --- SUB-FORM 2: STOCK TRANSFER ---
  const [txProductId, setTxProductId] = useState(products[0]?.id || '');
  const [txQty, setTxQty] = useState(10);
  const [txSource, setTxSource] = useState('Stoo Kuu (Main Warehouse)');
  const [txDestination, setTxDestination] = useState('Tawi la Posta (Posta Counter)');
  const [txRef, setTxRef] = useState(`TX-${Date.now().toString().slice(-4)}`);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txProductId || txQty <= 0) return;
    addStockTransfer(txProductId, Number(txQty), txSource, txDestination, txRef);
    // Reset
    setTxQty(10);
    setTxRef(`TX-${Date.now().toString().slice(-4)}`);
  };

  // --- SUB-SCREEN 3: STOCK COUNT (RECONCILIATION SHEET) ---
  // Store physical stock entries in local component state indexed by product ID
  const [physicalEntries, setPhysicalEntries] = useState<{ [key: string]: string }>({});
  const [sheetRef, setSheetRef] = useState(`AUDIT-${Date.now().toString().slice(-4)}`);

  const handlePhysicalEntryChange = (prodId: string, value: string) => {
    setPhysicalEntries(prev => ({ ...prev, [prodId]: value }));
  };

  const handleReconcileRow = (product: Product) => {
    const entry = physicalEntries[product.id];
    if (entry === undefined || entry === '') {
      alert('Tafadhali ingiza idadi iliyokutwa kwenye stoo kabla ya kusawazisha!');
      return;
    }

    const physicalQty = Number(entry);
    if (isNaN(physicalQty) || physicalQty < 0) {
      alert('Tafadhali ingiza idadi halali na chanya!');
      return;
    }

    if (confirm(`Upatanisho: Je, una thibitisha kusawazisha stock ya "${product.name}" kutoka ${product.stock} hadi ${physicalQty} Pcs?`)) {
      reconcileStockCount(product.id, physicalQty, `${sheetRef} - Physical Audit Row`);
      // Clear entry input on success
      setPhysicalEntries(prev => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    }
  };

  return (
    <div id="warehouse-operations" className="space-y-6 font-sans">
      
      {/* Tab Selector Navigation */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-1.5 shrink-0">
        <button
          id="tab-goods-received"
          onClick={() => setActiveTab('goods_received')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase transition-all ${
            activeTab === 'goods_received'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/15'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Download className="h-4 w-4" />
          <span>Kupokea Mzigo (Stock-In)</span>
        </button>

        <button
          id="tab-stock-transfer"
          onClick={() => setActiveTab('stock_transfer')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase transition-all ${
            activeTab === 'stock_transfer'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/15'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span>Kuhamisha Mzigo (Transfer)</span>
        </button>

        <button
          id="tab-stock-count"
          onClick={() => setActiveTab('stock_count')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase transition-all ${
            activeTab === 'stock_count'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/15'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Kukagua Stoo (Stock Count)</span>
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        
        {/* TAB 1: GOODS RECEIVED */}
        {activeTab === 'goods_received' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold uppercase text-slate-800">Fomu ya Kupokea Bidhaa Kutoka kwa Supplier</h3>
              <p className="text-xs text-slate-500 mt-1">Sajili mzigo uliopokelewa ili kuongeza stock ya bidhaa dukani.</p>
            </div>

            <form onSubmit={handleGoodsReceivedSubmit} className="space-y-4 max-w-lg">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Chagua Bidhaa (Product)</label>
                <select
                  id="gr-product-select"
                  value={grProductId}
                  onChange={(e) => setGrProductId(e.target.value)}
                  className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku}) - Stock ya sasa: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Idadi Inayopokelewa (Qty)</label>
                  <input
                    type="number"
                    required
                    id="gr-qty-input"
                    min={1}
                    value={grQty}
                    onChange={(e) => setGrQty(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Marejeo ya Risiti / GRN Code</label>
                  <input
                    type="text"
                    required
                    id="gr-ref-input"
                    value={grRef}
                    onChange={(e) => setGrRef(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Msambazaji aliyetuletea (Supplier)</label>
                <select
                  id="gr-supplier-select"
                  value={grSupplierId}
                  onChange={(e) => setGrSupplierId(e.target.value)}
                  className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.contactPerson})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                id="gr-submit-btn"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-xs uppercase transition-colors flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Ongeza Mzigo Stoo Mpya</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: STOCK TRANSFER */}
        {activeTab === 'stock_transfer' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold uppercase text-slate-800">Fomu ya Kuhamisha Bidhaa Kati ya Maghala/Matawi</h3>
              <p className="text-xs text-slate-500 mt-1">Kuhamisha bidhaa kutoka stoo kuu kwenda tawi dogo au counter ya mauzo.</p>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 max-w-lg">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Chagua Bidhaa ya Kuhamishwa</label>
                <select
                  id="tx-product-select"
                  value={txProductId}
                  onChange={(e) => setTxProductId(e.target.value)}
                  className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - Stock Iliyopo: {p.stock} {p.unit.split(' ')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Idadi ya Kuhamisha (Qty)</label>
                  <input
                    type="number"
                    required
                    id="tx-qty-input"
                    min={1}
                    value={txQty}
                    onChange={(e) => setTxQty(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Namba ya Dispatch / Ref</label>
                  <input
                    type="text"
                    required
                    id="tx-ref-input"
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Kutoka Ghala (Source)</label>
                  <input
                    type="text"
                    required
                    id="tx-source-input"
                    value={txSource}
                    onChange={(e) => setTxSource(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Kwenda Ghala/Tawi (Destination)</label>
                  <input
                    type="text"
                    required
                    id="tx-dest-input"
                    value={txDestination}
                    onChange={(e) => setTxDestination(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="tx-submit-btn"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-xs uppercase transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span>Tekeleza Uhamisho (Transfer)</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: STOCK COUNT / RECONCILIATION SHEET */}
        {activeTab === 'stock_count' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-base font-bold uppercase text-slate-800">Upatanisho wa Stock na Ukaguzi wa Stoo</h3>
                <p className="text-xs text-slate-500 mt-1">Linganisha idadi halisi ya bidhaa (Physical Count) na idadi iliyopo kwenye mfumo.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-400">REF YA UKAGUZI:</span>
                <input
                  type="text"
                  required
                  id="stock-count-sheet-ref"
                  value={sheetRef}
                  onChange={(e) => setSheetRef(e.target.value)}
                  className="p-1.5 border border-slate-200 rounded-lg text-xs font-mono w-28 bg-slate-50 text-slate-700"
                />
              </div>
            </div>

            {/* Table layout of count reconciliation */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3 px-4">Bidhaa</th>
                      <th className="py-3 px-4">Kitengo</th>
                      <th className="py-3 px-4 text-center">Salio la Mfumo</th>
                      <th className="py-3 px-4 text-center">Salio Halisi (Shelf)</th>
                      <th className="py-3 px-4 text-center">Tofauti (Variance)</th>
                      <th className="py-3 px-4 text-center">Sawazisha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {products.map(p => {
                      const entryVal = physicalEntries[p.id] || '';
                      const hasEntry = entryVal !== '';
                      const physicalNum = Number(entryVal);
                      const variance = hasEntry ? (physicalNum - p.stock) : 0;

                      let varianceColor = 'text-slate-400';
                      if (hasEntry) {
                        if (variance > 0) varianceColor = 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full';
                        else if (variance < 0) varianceColor = 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full';
                        else varianceColor = 'text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full';
                      }

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                          <td className="py-3 px-4 text-slate-500">{p.category}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                            {p.stock} Pcs
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min={0}
                              id={`physical-count-input-${p.id}`}
                              placeholder="Fanya count..."
                              value={entryVal}
                              onChange={(e) => handlePhysicalEntryChange(p.id, e.target.value)}
                              className="w-24 p-1 border border-slate-200 bg-white rounded-lg text-center font-mono font-bold text-xs"
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-extrabold text-xs">
                            {hasEntry ? (
                              <span className={varianceColor}>
                                {variance > 0 ? `+${variance}` : variance}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              id={`reconcile-row-btn-${p.id}`}
                              onClick={() => handleReconcileRow(p)}
                              disabled={!hasEntry}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-0.5 mx-auto transition-colors disabled:opacity-45 disabled:cursor-not-allowed bg-slate-800 text-white hover:bg-slate-700 border-slate-800"
                            >
                              <Save className="h-3 w-3" />
                              <span>Sawazisha</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
