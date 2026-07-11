import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Supplier } from '../types';
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, X } from 'lucide-react';

export const SuppliersScreen: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Filter
  const filteredSuppliers = suppliers.filter(s => {
    return s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.phone.includes(searchTerm);
  });

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setSupName('');
    setSupContact('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
    setShowModal(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setSupName(s.name);
    setSupContact(s.contactPerson);
    setSupPhone(s.phone);
    setSupEmail(s.email);
    setSupAddress(s.address);
    setShowModal(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplier({
        ...editingSupplier,
        name: supName,
        contactPerson: supContact,
        phone: supPhone,
        email: supEmail,
        address: supAddress
      });
    } else {
      addSupplier({
        name: supName,
        contactPerson: supContact,
        phone: supPhone,
        email: supEmail,
        address: supAddress
      });
    }
    setShowModal(false);
  };

  return (
    <div id="suppliers-screen" className="space-y-6 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase text-slate-800">Usimamizi wa Wasambazaji (Suppliers)</h2>
          <p className="text-xs text-slate-500 mt-1">Sajili wasambazaji wa bidhaa na ufuatilie rekodi zao za mawasiliano kwa ajili ya kuagiza stock mpya.</p>
        </div>
        <button
          id="add-supplier-btn"
          onClick={handleOpenAdd}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Sajili Msambazaji Mpya</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            id="supplier-search-input"
            placeholder="Tafuta msambazaji kwa jina la kampuni, jina la wakala au nambari ya simu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-semibold"
          />
        </div>
      </div>

      {/* Supplier Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center text-slate-400 font-semibold border border-slate-200 rounded-2xl shadow-sm">
            Hakuna wasambazaji walioandikishwa bado.
          </div>
        ) : (
          filteredSuppliers.map(s => (
            <div 
              key={s.id} 
              id={`supplier-card-${s.id}`}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight uppercase">{s.name}</h3>
                    <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider mt-1">Wakala: {s.contactPerson}</p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      id={`edit-sup-btn-${s.id}`}
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 bg-slate-50 hover:bg-teal-50 hover:text-teal-600 text-slate-500 rounded-lg border border-slate-200 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      id={`delete-sup-btn-${s.id}`}
                      onClick={() => {
                        if (confirm(`Je, unataka kumfuta msambazaji "${s.name}"?`)) {
                          deleteSupplier(s.id);
                        }
                      }}
                      className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-lg border border-slate-200 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600 font-medium">
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono">{s.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{s.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{s.address}</span>
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: ADD / EDIT SUPPLIER */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-800">
                {editingSupplier ? 'Hariri Taarifa za Msambazaji' : 'Sajili Msambazaji Mpya'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Jina la Kampuni (Supplier Name)</label>
                <input
                  type="text"
                  required
                  id="modal-sup-name"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Coca Cola Kwanza Ltd"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Jina la Mwasiliani / Wakala (Contact Person)</label>
                <input
                  type="text"
                  required
                  id="modal-sup-contact"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Neema Mwakalindile"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Nambari ya Simu</label>
                  <input
                    type="text"
                    required
                    id="modal-sup-phone"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. 0222851122"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Barua Pepe (Email)</label>
                  <input
                    type="email"
                    required
                    id="modal-sup-email"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. info@cocacola.co.tz"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Anwani ya Kiwanda / Ofisi</label>
                <input
                  type="text"
                  required
                  id="modal-sup-address"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Mikocheni Light Industrial Area, DSM"
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
                  id="modal-save-sup-btn"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-semibold text-white shadow-md"
                >
                  Hifadhi Msambazaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
