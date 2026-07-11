import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer } from '../types';
import { Plus, Search, Filter, Edit, Trash2, ShieldAlert, Check, DollarSign, X } from 'lucide-react';

export const CustomersScreen: React.FC = () => {
  const { 
    customers, addCustomer, updateCustomer, deleteCustomer, payDebt, settings 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All'); // All, Retail, Wholesale
  
  // Modals
  const [showCustModal, setShowCustModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);

  // Form State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custType, setCustType] = useState<'Retail' | 'Wholesale'>('Retail');
  const [custAddress, setCustAddress] = useState('');
  const [custBalance, setCustBalance] = useState(0);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Filter
  const filteredCustomers = customers.filter(c => {
    if (c.id === 'cust-1') return false; // Hide Walk-in customer from standard editing table

    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.phone.includes(searchTerm) ||
                          c.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'All' || c.type === selectedType;

    return matchesSearch && matchesType;
  });

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setCustType('Retail');
    setCustAddress('');
    setCustBalance(0);
    setShowCustModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setCustName(c.name);
    setCustPhone(c.phone);
    setCustEmail(c.email);
    setCustType(c.type);
    setCustAddress(c.address);
    setCustBalance(c.outstandingBalance);
    setShowCustModal(true);
  };

  const handleOpenPayment = (c: Customer) => {
    setPaymentCustomer(c);
    setPaymentAmount(0);
    setShowPaymentModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomer({
        ...editingCustomer,
        name: custName,
        phone: custPhone,
        email: custEmail,
        type: custType,
        address: custAddress,
        outstandingBalance: Number(custBalance)
      });
    } else {
      addCustomer({
        name: custName,
        phone: custPhone,
        email: custEmail,
        type: custType,
        address: custAddress,
        outstandingBalance: Number(custBalance)
      });
    }
    setShowCustModal(false);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer || paymentAmount <= 0) return;
    payDebt(paymentCustomer.id, Number(paymentAmount));
    setShowPaymentModal(false);
  };

  return (
    <div id="customers-screen" className="space-y-6 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase text-slate-800">Usimamizi wa Wateja na Madeni</h2>
          <p className="text-xs text-slate-500 mt-1">Dhibiti wateja wa Jumla na Rejareja pamoja na kufuatilia malipo na kurekodi madeni.</p>
        </div>
        <button
          id="add-customer-btn"
          onClick={handleOpenAdd}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Sajili Mteja Mpya</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            id="cust-search-input"
            placeholder="Tafuta mteja kwa Jina, Simu au Mahali..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-medium"
          />
        </div>

        {/* Filter Type */}
        <div className="relative w-full sm:w-60">
          <Filter className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <select
            id="cust-type-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-medium text-slate-600"
          >
            <option value="All">Aina Zote za Wateja</option>
            <option value="Retail">Rejareja (Retail)</option>
            <option value="Wholesale">Jumla (Wholesale)</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Jina la Mteja</th>
                <th className="py-3 px-4">Mawasiliano (Simu/Email)</th>
                <th className="py-3 px-4">Aina</th>
                <th className="py-3 px-4">Mtaa / Mahali</th>
                <th className="py-3 px-4 text-right">Deni Lililopo</th>
                <th className="py-3 px-4 text-center">Kitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Hakuna mteja aliyepatikana.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  const hasDebt = c.outstandingBalance > 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-semibold text-slate-800">{c.name}</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col font-mono text-[11px] text-slate-500">
                          <span>Simu: {c.phone}</span>
                          <span>Email: {c.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.type === 'Wholesale' 
                            ? 'bg-cyan-50 border-cyan-100 text-cyan-600' 
                            : 'bg-pink-50 border-pink-100 text-pink-600'
                        }`}>
                          {c.type === 'Wholesale' ? 'Jumla' : 'Rejareja'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{c.address}</td>
                      <td className="py-4 px-4 text-right">
                        <span className={`font-mono font-bold text-xs ${hasDebt ? 'text-rose-600 bg-rose-50 px-2 py-1 rounded-lg' : 'text-slate-400'}`}>
                          {c.outstandingBalance.toLocaleString()} {settings.currency}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {hasDebt && (
                            <button
                              id={`pay-debt-btn-${c.id}`}
                              onClick={() => handleOpenPayment(c)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-0.5 transition-colors"
                              title="Lipa deni"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>Pokea Malipo</span>
                            </button>
                          )}
                          <button
                            id={`edit-cust-btn-${c.id}`}
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 bg-slate-50 hover:bg-teal-50 hover:text-teal-600 text-slate-500 rounded-lg border border-slate-200 transition-colors"
                            title="Hariri mteja"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            id={`delete-cust-btn-${c.id}`}
                            onClick={() => {
                              if (confirm(`Je, unataka kufuta mteja "${c.name}"?`)) {
                                deleteCustomer(c.id);
                              }
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-lg border border-slate-200 transition-colors"
                            title="Futa mteja"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD / EDIT CUSTOMER */}
      {showCustModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-800">
                {editingCustomer ? 'Hariri Taarifa za Mteja' : 'Sajili Mteja Mpya'}
              </h3>
              <button onClick={() => setShowCustModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Jina la Mteja / Kampuni</label>
                <input
                  type="text"
                  required
                  id="modal-cust-name"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Halima Bakari"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Nambari ya Simu</label>
                  <input
                    type="text"
                    required
                    id="modal-cust-phone"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. 0712345678"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Kundi la Mteja</label>
                  <select
                    id="modal-cust-type"
                    value={custType}
                    onChange={(e) => setCustType(e.target.value as 'Retail' | 'Wholesale')}
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
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. mteja@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Anwani (Mtaa/Mkoa)</label>
                <input
                  type="text"
                  required
                  id="modal-cust-address"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Kariakoo, Dar es Salaam"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Deni la Kuanzia (TZS)</label>
                <input
                  type="number"
                  required
                  id="modal-cust-balance"
                  value={custBalance}
                  onChange={(e) => setCustBalance(Number(e.target.value))}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCustModal(false)}
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

      {/* MODAL 2: RECEIVE DEBT PAYMENT */}
      {showPaymentModal && paymentCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-800">Ripoti Malipo ya Deni</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                <div>Mteja: <span className="font-bold text-slate-800">{paymentCustomer.name}</span></div>
                <div>Aina: <span className="font-semibold text-teal-600">{paymentCustomer.type}</span></div>
                <div className="border-t border-slate-200 pt-2 text-sm">
                  Deni Kamili: <span className="font-mono font-bold text-rose-600">{paymentCustomer.outstandingBalance.toLocaleString()} TZS</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Kiasi Kilicholipwa (Amount Received)</label>
                <input
                  type="number"
                  required
                  id="payment-amount-input"
                  min={1}
                  max={paymentCustomer.outstandingBalance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="Kiasi cha malipo..."
                />
                <p className="text-[10px] text-slate-400 mt-1">Kiasi hakitakiwi kuzidi deni kuu la mteja.</p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  id="modal-save-payment-btn"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-semibold text-white shadow-md flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  <span>Kamilisha Malipo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
