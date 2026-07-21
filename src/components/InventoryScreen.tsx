import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { 
  Plus, Edit, Trash2, Search, Filter, AlertTriangle, Check, ListFilter, ChevronLeft, ChevronRight, X 
} from 'lucide-react';

export const InventoryScreen: React.FC = () => {
  const { 
    products, categories, currentUser, settings,
    addProduct, updateProduct, deleteProduct, addCategory, showToast 
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
  const [prodPackSize, setProdPackSize] = useState(1);
  const [prodBinLocation, setProdBinLocation] = useState('');
  const [prodPartNumber, setProdPartNumber] = useState('');
  const [prodCrossReferences, setProdCrossReferences] = useState('');
  const [prodBrand, setProdBrand] = useState('Genuine');
  const [prodCompatibility, setProdCompatibility] = useState('');
  const [prodChassisEngine, setProdChassisEngine] = useState('');
  const [prodCondition, setProdCondition] = useState<'Mpya' | 'Kutumika' | 'Fanisi'>('Mpya');
  const [prodWarrantyDays, setProdWarrantyDays] = useState(0);
  const [prodImage, setProdImage] = useState('');
  const [prodMustSellAsPair, setProdMustSellAsPair] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter products
  const filteredProducts = products.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.includes(searchTerm) ||
      p.partNumber?.toLowerCase().includes(q) ||
      (p.crossReferences?.toLowerCase().includes(q) ?? false) ||
      p.compatibility?.toLowerCase().includes(q);
    
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
    setProdPackSize(1);
    setProdBinLocation('');
    setProdPartNumber('');
    setProdCrossReferences('');
    setProdBrand('Genuine');
    setProdCompatibility('');
    setProdChassisEngine('');
    setProdCondition('Mpya');
    setProdWarrantyDays(0);
    setProdImage('');
    setProdMustSellAsPair(false);
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
    setProdPackSize(p.packSize || 1);
    setProdBinLocation(p.binLocation || '');
    setProdPartNumber(p.partNumber || '');
    setProdCrossReferences(p.crossReferences || '');
    setProdBrand(p.brand || 'Genuine');
    setProdCompatibility(p.compatibility || '');
    setProdChassisEngine(p.chassisEngineNumber || '');
    setProdCondition(p.condition || 'Mpya');
    setProdWarrantyDays(p.warrantyDays || 0);
    setProdImage(p.image || '');
    setProdMustSellAsPair(!!p.mustSellAsPair);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodCat.trim()) return;

    try {
      if (editingProduct) {
        await updateProduct({
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
          packSize: Number(prodPackSize) || 1,
          binLocation: prodBinLocation || undefined,
          partNumber: prodPartNumber,
          crossReferences: prodCrossReferences,
          brand: prodBrand,
          compatibility: prodCompatibility,
          chassisEngineNumber: prodChassisEngine,
          condition: prodCondition,
          warrantyDays: Number(prodWarrantyDays),
          image: prodImage,
          mustSellAsPair: prodMustSellAsPair,
          preserveStock: true,
        });
      } else {
        await addProduct({
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
          packSize: Number(prodPackSize) || 1,
          binLocation: prodBinLocation || undefined,
          partNumber: prodPartNumber,
          crossReferences: prodCrossReferences,
          brand: prodBrand,
          compatibility: prodCompatibility,
          chassisEngineNumber: prodChassisEngine,
          condition: prodCondition,
          warrantyDays: Number(prodWarrantyDays),
          image: prodImage,
          mustSellAsPair: prodMustSellAsPair,
        });
      }
      setShowProductModal(false);
    } catch {
      // Toast already shown in context; keep modal open
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    try {
      await addCategory({ name: catName, description: catDesc });
      setCatName('');
      setCatDesc('');
      setShowCategoryModal(false);
    } catch {
      // keep modal open
    }
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
                <th className="py-3 px-4">Jina la Kipuri & Gari Inayofaa</th>
                <th className="py-3 px-4">Namba ya Vipuri (OEM / Mbadala)</th>
                <th className="py-3 px-4">Chapa & Hali</th>
                <th className="py-3 px-4">Kundi</th>
                <th className="py-3 px-4 text-center">Kipimo & Udhamini</th>
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
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    Hakuna vipuri vilivyopatikana kwenye stoo.
                  </td>
                </tr>
              ) : (
                currentProducts.map(p => {
                  const isLow = p.stock <= p.minStockLevel;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5">
                          {p.image ? (
                            <img src={p.image} className="h-10 w-10 rounded-lg object-cover border border-slate-200 mt-0.5 shadow-sm shrink-0" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-slate-50 border border-dashed border-slate-200 mt-0.5 flex items-center justify-center text-slate-300 font-bold shrink-0 text-[10px]">
                              N/A
                            </div>
                          )}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900">{p.name}</span>
                              {p.mustSellAsPair && (
                                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold px-1.5 py-0.25 rounded">
                                  Jozi/Seti
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block w-fit">
                              🚗 Inafaa: {p.compatibility}
                            </span>
                            {p.chassisEngineNumber && (
                              <span className="text-[9px] text-slate-400 mt-0.5">
                                Chassis/Engine: {p.chassisEngineNumber}
                              </span>
                            )}
                            {isLow && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-500 mt-1">
                                <AlertTriangle className="h-3 w-3" />
                                <span>{isOut ? 'IMEISHA' : 'STOKI IPO CHINI'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-[11px] font-bold text-slate-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100/50 w-fit">
                            {p.partNumber}
                          </span>
                          {p.crossReferences && (
                            <span className="text-[10px] text-slate-400 mt-1 font-mono">
                              Mbadala: {p.crossReferences}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 w-fit">
                          <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded text-center ${
                            p.brand === 'Genuine' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : p.brand === 'OEM' 
                              ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' 
                              : p.brand === 'Used' 
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-purple-100 text-purple-700 border border-purple-200'
                          }`}>
                            {p.brand}
                          </span>
                          <span className={`text-[9px] font-bold px-1 rounded text-center ${
                            p.condition === 'Mpya' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : p.condition === 'Kutumika' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {p.condition || 'Mpya'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{p.category}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-slate-500 font-semibold">{p.unit}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            🛡️ {p.warrantyDays ? `${p.warrantyDays} Siku` : 'Hakuna'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {p.costPrice.toLocaleString()} {settings.currency}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-teal-600 font-mono">
                        {p.retailPrice.toLocaleString()} {settings.currency}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-cyan-600 font-mono">
                        {p.wholesalePrice.toLocaleString()} {settings.currency}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block font-bold px-2 py-1 rounded-lg text-[11px] font-mono ${
                          isOut 
                            ? 'bg-rose-100 text-rose-700' 
                            : isLow 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {p.stock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
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
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto font-sans">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
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
                  <label className="block text-xs font-bold text-slate-500 uppercase">Jina la Kipuri (Part Name)</label>
                  <input
                    type="text"
                    required
                    id="modal-prod-name"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. Brake Pads za Mbele"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Kundi (Category)</label>
                  <select
                    id="modal-prod-cat"
                    required
                    value={prodCat}
                    onChange={(e) => setProdCat(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">-- Chagua Kundi --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Namba ya Vipuri (Part Number)</label>
                  <input
                    type="text"
                    required
                    id="modal-prod-partnumber"
                    value={prodPartNumber}
                    onChange={(e) => setProdPartNumber(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. 04465-0K290"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Namba Mbadala (Cross-Ref)</label>
                  <input
                    type="text"
                    id="modal-prod-crossreferences"
                    value={prodCrossReferences}
                    onChange={(e) => setProdCrossReferences(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. D1115, PN1523"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Gari Inayofaa (Compatibility)</label>
                  <input
                    type="text"
                    required
                    id="modal-prod-compatibility"
                    value={prodCompatibility}
                    onChange={(e) => setProdCompatibility(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. Toyota Hilux 2015-2021"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Chapa (Brand)</label>
                  <select
                    id="modal-prod-brand"
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Genuine">Genuine (Halisi)</option>
                    <option value="OEM">OEM (Kiwandani original)</option>
                    <option value="Aftermarket">Aftermarket (Mbadala bora)</option>
                    <option value="Used">Used (Iliyotumika / Mtumba)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Hali (Condition)</label>
                  <select
                    id="modal-prod-condition"
                    value={prodCondition}
                    onChange={(e) => setProdCondition(e.target.value as 'Mpya' | 'Kutumika' | 'Fanisi')}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Mpya">Mpya (New)</option>
                    <option value="Kutumika">Kutumika (Second Hand)</option>
                    <option value="Fanisi">Fanisi (Reconditioned / Refurbished)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Dhamana (Days Warranty)</label>
                  <input
                    type="number"
                    id="modal-prod-warranty"
                    value={prodWarrantyDays}
                    onChange={(e) => setProdWarrantyDays(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. 90 (0 kama hakuna)"
                  />
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
                  <label className="block text-xs font-bold text-slate-500 uppercase">Kipimo (e.g. Pcs, Seti, Kit)</label>
                  <select
                    id="modal-prod-unit"
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Pcs">Pcs (Kipande)</option>
                    <option value="Seti">Seti (Set)</option>
                    <option value="Kit">Kit (Paket ya matengenezo)</option>
                    <option value="Jozi">Jozi (Pair)</option>
                    <option value="Carton">Carton / Box</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Vipande kwa Carton (Pack Size)</label>
                  <input
                    type="number"
                    min={1}
                    id="modal-prod-packsize"
                    value={prodPackSize}
                    onChange={(e) => setProdPackSize(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. 12 (pcs per carton)"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Jumla/Wholesale: carton 1 = N pcs (stoki inahesabiwa kwa pcs).</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Mahali (Bin / Shelf)</label>
                  <input
                    type="text"
                    id="modal-prod-bin"
                    value={prodBinLocation}
                    onChange={(e) => setProdBinLocation(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. A-12 / Shelf 3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Bei ya Kununua (Cost)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    id="modal-prod-cost"
                    value={prodCost}
                    onChange={(e) => setProdCost(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Bei ya Rejareja (Retail)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    id="modal-prod-retail"
                    value={prodRetail}
                    onChange={(e) => setProdRetail(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Bei ya Jumla (Wholesale)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    id="modal-prod-wholesale"
                    value={prodWholesale}
                    onChange={(e) => setProdWholesale(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Namba ya Chassis (Optional)</label>
                  <input
                    type="text"
                    id="modal-prod-chassis"
                    value={prodChassisEngine}
                    onChange={(e) => setProdChassisEngine(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="Chassis/Engine info"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Mizani ya Kuanzia (Stock Qty)</label>
                  <input
                    type="number"
                    required
                    min={0}
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
                    min={0}
                    id="modal-prod-minstock"
                    value={prodMinStock}
                    onChange={(e) => setProdMinStock(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Spare Parts Product Photo & Pair/Set Sales Rule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-teal-50/40 border border-teal-100/50 p-4 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <span>Picha ya Bidhaa (Product Photo)</span>
                  </label>
                  <div className="mt-1 flex items-center gap-3">
                    {prodImage ? (
                      <div className="relative h-12 w-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                        <img src={prodImage} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setProdImage('')}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-bold opacity-0 hover:opacity-100 transition-opacity"
                        >
                          Futa
                        </button>
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50 text-xs">
                        Hakuna
                      </div>
                    )}
                    <label className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer shadow-sm transition-all">
                      Pakia Picha
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 500 * 1024) {
                            showToast('Picha ni kubwa mno. Tumia faili chini ya 500KB.', 'error');
                            e.target.value = '';
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProdImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={prodMustSellAsPair}
                      onChange={(e) => setProdMustSellAsPair(e.target.checked)}
                      className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                    />
                    <div className="space-y-0.5">
                      <span className="block text-xs font-bold text-slate-700">Lazima Iuzwe kwa Jozi/Seti</span>
                      <span className="block text-[10px] text-slate-500">Mteja akitaka bidhaa hii, mpe kiasi cha jozi pekee stoo.</span>
                    </div>
                  </label>
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
