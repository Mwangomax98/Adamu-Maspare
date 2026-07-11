import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, TrendingDown, Package, AlertCircle, ShoppingCart, 
  Coins, Receipt, ArrowUpRight, ArrowDownRight, PackageCheck, AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

interface DashboardScreenProps {
  setScreen: (screen: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ setScreen }) => {
  const { 
    products, orders, expenses, currentUser, settings, stockMovements
  } = useApp();

  if (!currentUser) return null;

  // 1. Calculations from real state
  const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  // Calculate Cost of Goods Sold (COGS) to find Gross Profit
  const totalCOGS = orders.reduce((sum, order) => {
    const orderCOGS = order.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0);
    return sum + orderCOGS;
  }, 0);

  const grossProfit = totalSales - totalCOGS;
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const totalStockItems = products.reduce((sum, prod) => sum + prod.stock, 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStockLevel).length;

  // 2. Prepare charts data from order history (group by date)
  // Let's group last 7 days of sales for chart
  const getLast7DaysData = () => {
    const days = [];
    const dateMap: { [key: string]: { mauzo: number; faida: number } } = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('sw-TZ', { weekday: 'short' });
      dateMap[dateStr] = { mauzo: 0, faida: 0 };
      days.push({ dateStr, label: dayName });
    }

    // Populate actual sales
    orders.forEach(order => {
      const orderDate = order.date.split(' ')[0]; // YYYY-MM-DD
      if (dateMap[orderDate] !== undefined) {
        dateMap[orderDate].mauzo += order.totalAmount;
        // calculate profit
        const orderCOGS = order.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
        const orderProfit = order.totalAmount - orderCOGS;
        dateMap[orderDate].faida += orderProfit;
      }
    });

    return days.map(day => ({
      name: day.label,
      'Mauzo (Sales)': dateMap[day.dateStr].mauzo,
      'Faida (Profit)': dateMap[day.dateStr].faida,
    }));
  };

  const chartData = getLast7DaysData();

  // Low stock products alert list
  const lowStockProducts = products.filter(p => p.stock <= p.minStockLevel).slice(0, 4);

  // Recent 5 sales
  const recentOrders = orders.slice(0, 5);

  return (
    <div id="dashboard-screen" className="space-y-6 font-sans">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="relative z-10">
          <h2 className="text-xl font-bold uppercase tracking-tight">Hujambo, {currentUser.name}!</h2>
          <p className="text-xs text-slate-300 mt-1">
            Umeingia kama <span className="text-teal-400 font-bold uppercase">{currentUser.role}</span>. Hapa ni muhtasari wa hali ya biashara na stock kwa leo.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 z-10">
          {['Admin', 'Cashier'].includes(currentUser.role) && (
            <button 
              id="dash-quick-pos"
              onClick={() => setScreen('pos')}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Fanya Mauzo POS</span>
            </button>
          )}
          {['Store Keeper', 'Admin'].includes(currentUser.role) && (
            <button 
              id="dash-quick-goods"
              onClick={() => setScreen('goods_received')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <PackageCheck className="h-4 w-4" />
              <span>Pokea Mzigo</span>
            </button>
          )}
          {['Wholesale Sales', 'Admin'].includes(currentUser.role) && (
            <button 
              id="dash-quick-wholesale"
              onClick={() => setScreen('wholesale_pos')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Mauzo ya Jumla</span>
            </button>
          )}
        </div>
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl"></div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Sales */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jumla ya Mauzo</span>
            <h3 id="stat-total-sales" className="text-xl font-bold text-slate-800 mt-1">
              {totalSales.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
            </h3>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-2">
              <ArrowUpRight className="h-3 w-3" />
              <span>+12.4% kuliko jana</span>
            </span>
          </div>
          <div className="bg-teal-50 p-3 rounded-2xl text-teal-600">
            <Coins className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Net Profit (Admin only) */}
        {currentUser.role === 'Admin' ? (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Faida Halisi (Net)</span>
              <h3 id="stat-net-profit" className={`text-xl font-bold mt-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {netProfit.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
              </h3>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-2">
                <ArrowUpRight className="h-3 w-3" />
                <span>+8.2% mwezi huu</span>
              </span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Miamala ya Mauzo</span>
              <h3 className="text-xl font-bold text-slate-800 mt-1">
                {orders.length} <span className="text-xs font-normal text-slate-500">Invoices</span>
              </h3>
              <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-0.5 mt-2">
                <span>Mauzo yote yamesajiliwa</span>
              </span>
            </div>
            <div className="bg-teal-50 p-3 rounded-2xl text-teal-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
        )}

        {/* Card 3: Total Expenses (Admin only, else Total Stock count) */}
        {currentUser.role === 'Admin' ? (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gharama (Expenses)</span>
              <h3 id="stat-total-expenses" className="text-xl font-bold text-slate-800 mt-1">
                {totalExpenses.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
              </h3>
              <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-2">
                <ArrowDownRight className="h-3 w-3" />
                <span>Matumizi ya duka</span>
              </span>
            </div>
            <div className="bg-rose-50 p-3 rounded-2xl text-rose-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jumla ya Bidhaa</span>
              <h3 className="text-xl font-bold text-slate-800 mt-1">
                {totalStockItems.toLocaleString()} <span className="text-xs font-normal text-slate-500">Pcs</span>
              </h3>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-2">
                <span>Kwenye Stoo Kuu</span>
              </span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
        )}

        {/* Card 4: Low Stock Alert Badge (Red/Orange alert status) */}
        <div 
          onClick={() => ['Admin', 'Store Keeper'].includes(currentUser.role) && setScreen('low_stock')}
          className={`p-5 rounded-2xl shadow-sm border flex items-center justify-between cursor-pointer transition-all duration-150 ${
            lowStockCount > 0 
              ? 'bg-rose-50/50 hover:bg-rose-50 border-rose-200 text-rose-800' 
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Stoki ya Chini</span>
            <h3 id="stat-low-stock" className={`text-xl font-bold mt-1 ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {lowStockCount} <span className="text-xs font-normal text-slate-500">Bidhaa</span>
            </h3>
            <span className={`text-[10px] font-semibold mt-2 flex items-center gap-1 ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {lowStockCount > 0 ? (
                <>
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Inahitaji kuongezwa mara moja</span>
                </>
              ) : (
                <>
                  <PackageCheck className="h-3.5 w-3.5" />
                  <span>Stoko yote ipo vizuri</span>
                </>
              )}
            </span>
          </div>
          <div className={`p-3 rounded-2xl ${lowStockCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Charts & Mini Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Graphical Display */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Grafu ya Mauzo na Faida ya Wiki Hii</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Muhtasari wa kipato na faida kwa siku 7 zilizopita</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-3 h-3 bg-teal-500 rounded-full"></span>
                <span>Mauzo (Sales)</span>
              </span>
              {currentUser.role === 'Admin' && (
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                  <span>Faida (Profit)</span>
                </span>
              )}
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="Mauzo (Sales)" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                {currentUser.role === 'Admin' && (
                  <Area type="monotone" dataKey="Faida (Profit)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Watch Widget */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-4 flex items-center justify-between">
              <span>Hali ya Bidhaa (Low Stock Alert)</span>
              {lowStockCount > 0 && (
                <span className="bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Hatari</span>
              )}
            </h4>
            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <PackageCheck className="h-10 w-10 text-emerald-500" />
                  <p className="text-xs font-semibold">Stock zote ziko salama kabisa!</p>
                </div>
              ) : (
                lowStockProducts.map(p => {
                  const severity = p.stock <= (p.minStockLevel / 2) ? 'red' : 'orange';
                  return (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                        <span className="text-[10px] text-slate-500 font-medium">Kitengo: {p.category}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          severity === 'red' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          Salia: {p.stock} {p.unit.split(' ')[0]}
                        </span>
                        <p className="text-[9px] text-slate-400 mt-1 font-mono">Min: {p.minStockLevel}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {['Admin', 'Store Keeper'].includes(currentUser.role) && lowStockCount > 0 && (
            <button 
              id="dash-add-stock-btn"
              onClick={() => setScreen('low_stock')}
              className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <span>Ongeza Mzigo Stooni</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Miamala ya Hivi Karibuni</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Orodha ya risiti na ankara 5 zilizopita</p>
          </div>
          <button 
            id="dash-view-all-reports"
            onClick={() => setScreen('reports')}
            className="text-xs text-teal-600 hover:underline font-bold"
          >
            Angalia Ripoti Zote
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Ankara #</th>
                <th className="py-3 px-4">Mteja</th>
                <th className="py-3 px-4">Aina ya Mauzo</th>
                <th className="py-3 px-4">Njia ya Malipo</th>
                <th className="py-3 px-4 text-right">Jumla Kuu</th>
                <th className="py-3 px-4 text-center">Hali</th>
                <th className="py-3 px-4 text-right">Tarehe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Hakuna mauzo yaliyofanyika bado.
                  </td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-600">{order.orderNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{order.customerName}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        order.salesType === 'Wholesale' 
                          ? 'bg-cyan-50 border-cyan-100 text-cyan-600' 
                          : 'bg-pink-50 border-pink-100 text-pink-600'
                      }`}>
                        {order.salesType === 'Wholesale' ? 'Jumla' : 'Rejareja'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{order.paymentMethod}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                      {order.totalAmount.toLocaleString()} {settings.currency}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.paymentStatus === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : order.paymentStatus === 'Partial' 
                          ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {order.paymentStatus === 'Paid' ? 'Imelipwa' : order.paymentStatus === 'Partial' ? 'Nusu Mkopo' : 'Deni (Mkopo)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-mono">{order.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
