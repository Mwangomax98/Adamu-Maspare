import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense } from '../types';
import { Plus, Search, Filter, Edit, Trash2, Receipt, Calendar, CreditCard, X } from 'lucide-react';

export const ExpensesScreen: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, settings } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('Umeme & Maji');
  const [expAmount, setExpAmount] = useState(0);
  const [expDesc, setExpDesc] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = ['Umeme & Maji', 'Pango', 'Usafiri', 'Chakula & Vinywaji', 'Mishahara', 'Kodi & Leseni', 'Mengineyo'];

  // Calculations
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalExpenseSum = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setExpTitle('');
    setExpCategory('Umeme & Maji');
    setExpAmount(0);
    setExpDesc('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const handleOpenEdit = (e: Expense) => {
    setEditingExpense(e);
    setExpTitle(e.title);
    setExpCategory(e.category);
    setExpAmount(e.amount);
    setExpDesc(e.description);
    // Normalize to YYYY-MM-DD for <input type="date">
    setExpDate((e.date || '').slice(0, 10));
    setShowModal(true);
  };

  const handleSaveExpense = async (evt: React.FormEvent) => {
    evt.preventDefault();
    try {
      if (editingExpense) {
        await updateExpense({
          ...editingExpense,
          title: expTitle,
          category: expCategory,
          amount: Number(expAmount),
          description: expDesc,
          date: expDate
        });
      } else {
        await addExpense({
          title: expTitle,
          category: expCategory,
          amount: Number(expAmount),
          description: expDesc,
          date: expDate
        });
      }
      setShowModal(false);
    } catch {
      // keep modal open
    }
  };

  return (
    <div id="expenses-screen" className="space-y-6 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase text-slate-800">Usimamizi wa Matumizi (Expense Management)</h2>
          <p className="text-xs text-slate-500 mt-1">Sajili na ufuatilie gharama za uendeshaji wa ofisi au duka kwa ajili ya hesabu za faida na hasara.</p>
        </div>
        <button
          id="add-expense-btn"
          onClick={handleOpenAdd}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Sajili Matumizi Mapya</span>
        </button>
      </div>

      {/* KPI Sum Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between max-w-sm">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Gharama Zote (Filtered)</span>
          <h3 id="expense-total-display" className="text-2xl font-black text-rose-600 mt-1">
            {totalExpenseSum.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Kulingana na vigezo vilivyochaguliwa</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl text-rose-600">
          <Receipt className="h-6 w-6" />
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            id="expense-search-input"
            placeholder="Tafuta gharama kwa kichwa cha matumizi au maelezo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-semibold"
          />
        </div>

        {/* Filter Category */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <select
            id="expense-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-semibold text-slate-600"
          >
            <option value="All">Makundi Yote ya Gharama</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Gharama / Sababu</th>
                <th className="py-3 px-4">Kitengo (Category)</th>
                <th className="py-3 px-4">Maelezo</th>
                <th className="py-3 px-4 text-right">Kiasi Kilicholipwa</th>
                <th className="py-3 px-4 text-center">Tarehe</th>
                <th className="py-3 px-4 text-center">Kitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Hakuna matumizi yaliyorekodiwa kwa sasa.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-slate-800">{e.title}</td>
                    <td className="py-4 px-4 text-slate-600 font-bold uppercase text-[10px]">{e.category}</td>
                    <td className="py-4 px-4 text-slate-500 max-w-xs truncate">{e.description}</td>
                    <td className="py-4 px-4 text-right font-bold text-slate-800 font-mono">
                      {e.amount.toLocaleString()} {settings.currency}
                    </td>
                    <td className="py-4 px-4 text-center text-slate-500 font-mono">{e.date}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`edit-exp-${e.id}`}
                          onClick={() => handleOpenEdit(e)}
                          className="p-1.5 bg-slate-50 hover:bg-teal-50 hover:text-teal-600 text-slate-500 rounded-lg border border-slate-200 transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`delete-exp-${e.id}`}
                          onClick={() => {
                            if (confirm(`Je, una thibitisha kufuta gharama ya "${e.title}"?`)) {
                              deleteExpense(e.id);
                            }
                          }}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-lg border border-slate-200 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT EXPENSE */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-800">
                {editingExpense ? 'Hariri Matumizi' : 'Rekodi Matumizi Mapya'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Kichwa cha Matumizi (Title)</label>
                <input
                  type="text"
                  required
                  id="modal-exp-title"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Lipia Bill ya Luku"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Kitengo cha Gharama</label>
                  <select
                    id="modal-exp-cat"
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Kiasi Kilicholipwa (Amount)</label>
                  <input
                    type="number"
                    required
                    id="modal-exp-amount"
                    min={1}
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Tarehe ya Malipo</label>
                <input
                  type="date"
                  required
                  id="modal-exp-date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Maelezo Kamili</label>
                <textarea
                  id="modal-exp-desc"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  rows={3}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Kulipia mita ya umeme ya ofisi kwa mwezi huu..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  id="modal-save-expense-btn"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-semibold text-white shadow-md"
                >
                  Hifadhi Gharama
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
