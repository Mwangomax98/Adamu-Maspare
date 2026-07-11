import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Category } from '../types';
import { 
  Plus, Edit, Trash2, Search, Filter, AlertTriangle, Check, ListFilter, ChevronLeft, ChevronRight, X 
} from 'lucide-react';

export const InventoryScreen: React.FC = () => {
  const { 
    products, categories, currentUser, settings,
    addProduct, updateProduct, deleteProduct, addCategory 
  } = useApp();

  const isAdmin = currentUser?.role === 'Admin';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All'); // All, In Stock, Low Stock, Out of Stock
  
  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New Category Form State
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // New Product Form State
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodCost, setProdCost] = useState(0);
  const [prodRetail, setProdRetail] = useState(0);
  const [prodWholesale, setProdWholesale] = useState(0);
  const [prodStock, setProdStock] = useState(0);
  const [prodMinStock, setProdMinStock] = useState(10);
  const [prodUnit, setProdUnit] = useState('Pcs');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.barcode.includes(searchTerm);
    
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    
    let matchesStock = true;
    if (selectedStockStatus === 'In Stock') {
      matchesStock = p.stock > p.minStockLevel;
    } else if (selectedStockStatus === 'Low Stock') {
      matchesStock = p.stock <= p.minStockLevel && p.stock > 0;
    } else if (selectedStockStatus === 'Out of Stock') {
      matchesStock = p.stock === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Paginated products
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdSku(`SKU-${Date.now().toString().slice(-6)}`);
    setProdBarcode(Math.floor(1000000000000 + Math.random() * 9000000000000).toString());
    setProdCat(categories[0]?.name || '');
    setProdCost(0);
    setProdRetail(0);
    setProdWholesale(0);
    setProdStock(0);
    setProdMinStock(10);
    setProdUnit('Pcs');
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdSku(p.sku);
    setProdBarcode(p.barcode);
    setProdCat(p.category);
    setProdCost(p.costPrice);
    setProdRetail(p.retailPrice);
    setProdWholesale(p.wholesalePrice);
    setProdStock(p.stock);
    setProdMinStock(p.minStockLevel);
    setProdUnit(p.unit);
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name: prodName,
        sku: prodSku,
        barcode: prodBarcode,
        category: prodCat,
        costPrice: Number(prodCost),
        retailPrice: Number(prodRetail),
        wholesalePrice: Number(prodWholesale),
        stock: Number(prodStock),
        minStockLevel: Number(prodMinStock),
        unit: prodUnit,
      });
    } else {
      addProduct({
        name: prodName,
        sku: prodSku,
        barcode: prodBarcode,
        category: prodCat,
        costPrice: Number(prodCost),
        retailPrice: Number(prodRetail),
        wholesalePrice: Number(prodWholesale),
        stock: Number(prodStock),
        minStockLevel: Number(prodMinStock),
        unit: prodUnit,
      });
    }
    setShowProductModal(false);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    addCategory({ name: catName, description: catDesc });
    setCatName('');
    setCatDesc('');
    setShowCategoryModal(false);
  };

  return (
    <div id="inventory-screen" className="space-y-6 font-sans">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase text-slate-800">Orodha ya Bidhaa na Stoo</h2>
          <p className="text-xs text-slate-500 mt-1">Usimamizi wa bidhaa, bei, kikomo cha chini cha stock na ununuzi</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="add-cat-btn"
            onClick={() => setShowCategoryModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4 text-slate-600" />
            <span>Ongeza Kundi (Category)</span>
          </button>
          <button
            id="add-prod-btn"
            onClick={handleOpenAddProduct}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Sajili Bidhaa Mpya</span>
          </button>
        </div>
      </div>

      {/* Searching & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            id="search-input"
            placeholder="Tafuta bidhaa kwa Jina, SKU au Barcode..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-xs"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-xs text-slate-600"
          >
            <option value="All">Makundi Yote (Categories)</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter */}
        <div className="relative">
          <ListFilter className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <select
            id="stock-status-filter"
            value={selectedStockStatus}
            onChange={(e) => { setSelectedStockStatus(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-xs text-slate-600"
          >
            <option value="All">Hali Zote za Stoo</option>
            <option value="In Stock">Zipo za Kutosha (In Stock)</option>
            <option value="Low Stock">Zilizopungua sana (Low Stock)</option>
            <option value="Out of Stock">Zimeisha kabisa (Out of Stock)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Picha / Jina la Bidhaa</th>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Kundi</th>
                <th className="py-3 px-4">Kipimo (Unit)</th>
                <th className="py-3 px-4 text-right">Bei ya Kununua</th>
                <th className="py-3 px-4 text-right">Bei ya Rejareja</th>
                <th className="py-3 px-4 text-right">Bei ya Jumla</th>
                <th className="py-3 px-4 text-center">Salio la Stoo</th>
                <th className="py-3 px-4 text-center">Kitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {currentProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    Hakuna bidhaa iliyopatikana kwenye stoo.
                  </td>
                </tr>
              ) : (
                currentProducts.map(p => {
                  const isLow = p.stock <= p.minStockLevel;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <div className="flex flex-col">
                          <span>{p.name}</span>
                          {isLow && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-500 mt-0.5">
                              <AlertTriangle className="h-3 w-3" />
                              <span>{isOut ? 'IMEISHA' : 'STOKI IPO CHINI'}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        <div className="flex flex-col">
                          <span>{p.sku}</span>
                          <span className="text-[10px] text-slate-400">BC: {p.barcode}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{p.category}</td>
                      <td className="py-3.5 px-4 text-slate-500">{p.unit}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {p.costPrice.toLocaleString()} {settings.currency}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-teal-600 font-mono">
                        {p.retailPrice.toLocaleString()} {settings.currency}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-cyan-600 font-mono">
                        {p.wholesalePrice.toLocaleString()} {settings.currency}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block font-bold px-2 py-1 rounded-lg text-[11px] font-mono ${
                          isOut 
                            ? 'bg-rose-100 text-rose-700' 
                            : isLow 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {p.stock} Pcs
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`edit-prod-${p.id}`}
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 bg-slate-50 hover:bg-teal-50 hover:text-teal-600 text-slate-500 rounded-lg border border-slate-200 transition-colors"
                            title="Hariri bidhaa"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              id={`delete-prod-${p.id}`}
                              onClick={() => {
                                if (confirm(`Je, unataka kufuta bidhaa ya "${p.name}"?`)) {
                                  deleteProduct(p.id);
                                }
                              }}
                              className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-lg border border-slate-200 transition-colors"
                              title="Futa bidhaa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Ukurasa wa <strong>{currentPage}</strong> kati ya <strong>{totalPages}</strong> (Jumla ya Bidhaa: {filteredProducts.length})</span>
            <div className="flex gap-1.5">
              <button
                id="prev-page-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                id="next-page-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden font-sans">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-800">
                {editingProduct ? 'Hariri Taarifa za Bidhaa' : 'Sajili Bidhaa Mpya'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Jina la Bidhaa</label>
                  <input
                    type="text"
                    required
                    id="modal-prod-name"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. Sukari ya Bagamoyo 1kg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Kundi (Category)</label>
                  <select
                    id="modal-prod-cat"
                    value={prodCat}
                    onChange={(e) => setProdCat(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">SKU Code</label>
                  <input
                    type="text"
                    required
                    id="modal-prod-sku"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Barcode</label>
                  <input
                    type="text"
                    required
                    id="modal-prod-barcode"
                    value={prodBarcode}
                    onChange={(e) => setProdBarcode(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Kipimo (e.g. Pcs, Box)</label>
                  <input
                    type="text"
                    required
                    id="modal-prod-unit"
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="Pcs, Kg, Boksi n.k."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Bei ya Kununua (Cost)</label>
                  <input
                    type="number"
                    required
                    id="modal-prod-cost"
                    disabled={!isAdmin}
                    value={prodCost}
                    onChange={(e) => setProdCost(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:opacity-50 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Bei ya Rejareja (Retail)</label>
                  <input
                    type="number"
                    required
                    id="modal-prod-retail"
                    disabled={!isAdmin}
                    value={prodRetail}
                    onChange={(e) => setProdRetail(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:opacity-50 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Bei ya Jumla (Wholesale)</label>
                  <input
                    type="number"
                    required
                    id="modal-prod-wholesale"
                    disabled={!isAdmin}
                    value={prodWholesale}
                    onChange={(e) => setProdWholesale(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:opacity-50 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Mizani ya Kuanzia (Stock Qty)</label>
                  <input
                    type="number"
                    required
                    id="modal-prod-stock"
                    disabled={editingProduct !== null}
                    value={prodStock}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none disabled:opacity-50"
                  />
                  {editingProduct && (
                    <p className="text-[10px] text-slate-400 mt-1">Kwa kubadilisha stock baada ya usajili, tumia Stock-In au Stock Reconcile.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Kiwango cha chini cha tahadhari</label>
                  <input
                    type="number"
                    required
                    id="modal-prod-minstock"
                    value={prodMinStock}
                    onChange={(e) => setProdMinStock(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Ghairi (Cancel)
                </button>
                <button
                  type="submit"
                  id="modal-save-product-btn"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-semibold text-white shadow-md"
                >
                  Hifadhi Bidhaa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CATEGORY */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden font-sans">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-800">Ongeza Kundi Jipya la Bidhaa</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Jina la Kundi (Category Name)</label>
                <input
                  type="text"
                  required
                  id="modal-cat-name"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Vipodozi"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Maelezo (Description)</label>
                <textarea
                  id="modal-cat-desc"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  rows={3}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Sabuni za kuoga, lotion na mafuta ya ngozi..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  id="modal-save-cat-btn"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-semibold text-white shadow-md"
                >
                  Hifadhi Kundi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
