import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Order, PaymentMethod } from '../types';
import { DocumentPreview } from './DocumentPreview';
import {
  FileText, Printer, X, Search, Coins, Wallet, CreditCard, CheckCircle, ShoppingBag
} from 'lucide-react';

export const ProformaScreen: React.FC = () => {
  const { orders, settings, convertProforma } = useApp();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'open' | 'converted' | 'all'>('open');
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [convertTarget, setConvertTarget] = useState<Order | null>(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [dueDate, setDueDate] = useState('');
  const [converting, setConverting] = useState(false);

  const fmt = (num: number) => num.toLocaleString() + ' ' + settings.currency;

  const proformas = useMemo(() => {
    const list = orders.filter((o) => o.documentType === 'proforma');
    const filtered = list.filter((o) => {
      if (filter === 'open') return !o.convertedToOrderId;
      if (filter === 'converted') return !!o.convertedToOrderId;
      return true;
    });
    const q = searchTerm.trim().toLowerCase();
    const searched = !q
      ? filtered
      : filtered.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q)
        );
    return searched.sort((a, b) => {
      const aOpen = !a.convertedToOrderId ? 0 : 1;
      const bOpen = !b.convertedToOrderId ? 0 : 1;
      if (aOpen !== bOpen) return aOpen - bOpen;
      return (b.date || '').localeCompare(a.date || '');
    });
  }, [orders, filter, searchTerm]);

  const openConvert = (pf: Order) => {
    setConvertTarget(pf);
    setPaidAmount(pf.totalAmount);
    setPaymentMethod('Cash');
    setDueDate(pf.dueDate || '');
  };

  const handleConvert = async () => {
    if (!convertTarget) return;
    setConverting(true);
    try {
      const sale = await convertProforma(
        convertTarget.id,
        Number(paidAmount),
        paymentMethod,
        dueDate || convertTarget.dueDate
      );
      if (sale) {
        setConvertTarget(null);
        setPreviewOrder(sale);
      }
    } finally {
      setConverting(false);
    }
  };

  return (
    <div id="proforma-screen" className="space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            Proforma Invoice
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Orodha ya proforma — chapisha au badilisha kuwa mauzo. Unda mpya kutoka Mauzo ya Jumla.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/wholesale_pos')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm"
        >
          <ShoppingBag className="h-4 w-4" />
          Unda kwenye Wholesale POS
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tafuta nambari au mteja..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-1.5">
            {(
              [
                { id: 'open' as const, label: 'Wazi' },
                { id: 'converted' as const, label: 'Imebadilishwa' },
                { id: 'all' as const, label: 'Zote' },
              ]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-colors ${
                  filter === f.id
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {proformas.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <FileText className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">Hakuna proforma hapa</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Fungua <span className="font-bold">Mauzo ya Jumla</span>, weka bidhaa kwenye kikapu, chagua mteja, kisha bonyeza{' '}
              <span className="font-bold">Tengeneza Proforma</span>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100">
                  <th className="px-4 py-3">Nambari</th>
                  <th className="px-4 py-3">Mteja</th>
                  <th className="px-4 py-3">Tarehe</th>
                  <th className="px-4 py-3 text-right">Jumla</th>
                  <th className="px-4 py-3">Hali</th>
                  <th className="px-4 py-3 text-right">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proformas.map((pf) => {
                  const isOpen = !pf.convertedToOrderId;
                  return (
                    <tr key={pf.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{pf.orderNumber}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{pf.customerName}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{pf.date}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-teal-700">{fmt(pf.totalAmount)}</td>
                      <td className="px-4 py-3">
                        {isOpen ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-100 text-[10px] font-bold">
                            Wazi
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-bold">
                            Imebadilishwa
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewOrder(pf)}
                            className="px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold text-[10px] hover:bg-white"
                          >
                            Angalia / Chapisha
                          </button>
                          {isOpen && (
                            <button
                              type="button"
                              onClick={() => openConvert(pf)}
                              className="px-2.5 py-1.5 bg-teal-600 text-white rounded-lg font-bold text-[10px] hover:bg-teal-700"
                            >
                              Badilisha kuwa Mauzo
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print preview */}
      {previewOrder && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[90vh] print:h-auto print:max-w-none print:rounded-none print:shadow-none">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-white shrink-0 print:hidden">
              <div className="flex items-center gap-1.5">
                <Printer className="h-5 w-5 text-teal-400" />
                <span className="text-xs font-extrabold uppercase tracking-wide">
                  {previewOrder.documentType === 'proforma' ? 'Kihakiki cha Proforma' : 'Kihakiki cha Invoice'}
                </span>
              </div>
              <button type="button" onClick={() => setPreviewOrder(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center print:p-0 print:bg-white print:overflow-visible">
              <DocumentPreview order={previewOrder} settings={settings} currencyFmt={fmt} />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0 print:hidden">
              <button
                type="button"
                onClick={() => {
                  document.body.classList.add('printing-a4');
                  window.print();
                  document.body.classList.remove('printing-a4');
                }}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs"
              >
                <Printer className="h-4 w-4" />
                Chapisha A4
              </button>
              <button
                type="button"
                onClick={() => setPreviewOrder(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
              >
                Funga
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert dialog */}
      {convertTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-amber-900">Badilisha kuwa Mauzo</h3>
              <button type="button" onClick={() => setConvertTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-xs space-y-1">
                <p className="font-mono font-bold text-slate-800">{convertTarget.orderNumber}</p>
                <p className="text-slate-600">{convertTarget.customerName}</p>
                <p className="font-mono font-black text-teal-700">{fmt(convertTarget.totalAmount)}</p>
                <p className="text-[11px] text-rose-600 font-semibold">Stoo itapungua baada ya kubadilisha.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Kiasi Kilicholipwa</label>
                <input
                  type="number"
                  min={0}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono text-right"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Ukomo wa Malipo</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Njia ya Malipo</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'Cash' as const, label: 'Cash', icon: Coins },
                    { id: 'Mobile Money' as const, label: 'M-Pesa', icon: Wallet },
                    { id: 'Benki' as const, label: 'Benki', icon: CreditCard },
                  ].map((method) => {
                    const Icon = method.icon;
                    const sel = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 font-bold text-[10px] ${
                          sel
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {method.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                disabled={converting}
                onClick={handleConvert}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-xs"
              >
                <CheckCircle className="h-4 w-4" />
                {converting ? 'Inashughulikia...' : 'Thibitisha Mauzo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
