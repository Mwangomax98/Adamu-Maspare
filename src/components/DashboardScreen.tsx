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

export const DashboardScreen: React.FC = () => {
  const { 
    products, orders, expenses, currentUser, settings, stockMovements, setScreen
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
  const totalExpenses = expenses.filter(exp => !exp.isExternalSourcing).reduce((sum, exp) => sum + exp.amount, 0);
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
    <div id="dashboard-screen" className="space-y-4 font-sans">
      {/* Welcome Banner */}
      <div className="bg-neutral-900 text-white rounded-xl p-4 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border border-neutral-800">
        <div className="relative z-10">
          <h2 className="text-lg font-black uppercase tracking-tight">Hujambo, {currentUser.name}!</h2>
          <p className="text-[11px] text-neutral-300 mt-0.5">
            Umeingia kama <span className="text-amber-400 font-bold uppercase">{currentUser.role}</span>. Hapa ni muhtasari wa hali ya biashara na stock kwa leo.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 z-10">
          {['Admin', 'Cashier'].includes(currentUser.role) && (
            <button 
              id="dash-quick-pos"
              onClick={() => setScreen('pos')}
              className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <ShoppingCart className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Fanya Mauzo POS</span>
            </button>
          )}
          {['Store Keeper', 'Admin'].includes(currentUser.role) && (
            <button 
              id="dash-quick-goods"
              onClick={() => setScreen('goods_received')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <PackageCheck className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Pokea Mzigo</span>
            </button>
          )}
          {['Wholesale Sales', 'Admin'].includes(currentUser.role) && (
            <button 
              id="dash-quick-wholesale"
              onClick={() => setScreen('wholesale_pos')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <ShoppingCart className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Mauzo ya Jumla</span>
            </button>
          )}
        </div>
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl"></div>
      </div>

      {/* KPI Stats Grid */}
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Sales */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Jumla ya Mauzo</span>
            <h3 id="stat-total-sales" className="text-xl font-black text-slate-900 mt-1">
              {totalSales.toLocaleString()} <span className="text-xs font-normal text-slate-400">{settings.currency}</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5 mt-2">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 stroke-[2.5]" />
              <span>Mauzo ya duka lote</span>
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl text-slate-500 border border-slate-100">
            <Coins className="h-5 w-5 stroke-[2]" />
          </div>
        </div>

        {/* Card 2: Net Profit (Admin only) */}
        {currentUser.role === 'Admin' ? (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Faida Halisi (Net)</span>
              <h3 id="stat-net-profit" className={`text-xl font-black mt-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {netProfit.toLocaleString()} <span className="text-xs font-normal text-slate-400">{settings.currency}</span>
              </h3>
              <span className={`text-[10px] font-bold flex items-center gap-0.5 mt-2 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {netProfit >= 0 ? (
                  <>
                    <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5] text-emerald-500" />
                    <span>Inaleta faida nzuri</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3.5 w-3.5 stroke-[2.5] text-rose-500" />
                    <span>Duka lina hasara (Net)</span>
                  </>
                )}
              </span>
            </div>
            <div className={`p-2.5 rounded-xl border ${
              netProfit >= 0 
                ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100' 
                : 'bg-rose-50/50 text-rose-600 border-rose-100'
            }`}>
              {netProfit >= 0 ? (
                <TrendingUp className="h-5 w-5 stroke-[2]" />
              ) : (
                <TrendingDown className="h-5 w-5 stroke-[2]" />
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Miamala ya Mauzo</span>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {orders.length} <span className="text-xs font-normal text-slate-400">Invoices</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5 mt-2">
                <span>Invoices zilizolipwa</span>
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl text-slate-500 border border-slate-100">
              <ShoppingCart className="h-5 w-5 stroke-[2]" />
            </div>
          </div>
        )}

        {/* Card 3: Total Expenses (Admin only, else Total Stock count) */}
        {currentUser.role === 'Admin' ? (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Gharama (Expenses)</span>
              <h3 id="stat-total-expenses" className="text-xl font-black text-slate-900 mt-1">
                {totalExpenses.toLocaleString()} <span className="text-xs font-normal text-slate-400">{settings.currency}</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5 mt-2">
                <span>Matumizi ya duka mwezi huu</span>
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl text-slate-500 border border-slate-100">
              <Receipt className="h-5 w-5 stroke-[2]" />
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Jumla ya Bidhaa</span>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {totalStockItems.toLocaleString()} <span className="text-xs font-normal text-slate-400">Pcs</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5 mt-2">
                <span>Stoo yote kwa ujumla</span>
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl text-slate-500 border border-slate-100">
              <Package className="h-5 w-5 stroke-[2]" />
            </div>
          </div>
        )}

        {/* Card 4: Low Stock Alert Badge (Urgent red highlight, pulsing when low stock exists) */}
        <div 
          onClick={() => ['Admin', 'Store Keeper'].includes(currentUser.role) && setScreen('low_stock')}
          className={`p-5 rounded-2xl shadow-sm border flex items-center justify-between cursor-pointer transition-all duration-300 relative ${
            lowStockCount > 0 
              ? 'bg-rose-50/70 border-rose-500 shadow-md shadow-rose-100 ring-4 ring-rose-500/10 animate-[pulse_3s_infinite]' 
              : 'bg-white hover:border-slate-300 border-slate-100 text-slate-800 hover:shadow-md'
          }`}
        >
          {lowStockCount > 0 && (
            <span className="absolute -top-3 left-4 bg-rose-600 text-white text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md shadow-rose-600/30 flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-white rounded-full animate-ping"></span>
              HARAKA! STOKI YA CHINI
            </span>
          )}
          <div>
            <span className={`text-[11px] font-extrabold uppercase tracking-wider block ${lowStockCount > 0 ? 'text-rose-600/80' : 'text-slate-400'}`}>
              Stoki ya Chini
            </span>
            <h3 id="stat-low-stock" className={`text-xl font-black mt-1 ${lowStockCount > 0 ? 'text-rose-800' : 'text-slate-900'}`}>
              {lowStockCount} <span className="text-xs font-normal text-slate-400">Bidhaa</span>
            </h3>
            <span className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {lowStockCount > 0 ? (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600 stroke-[2.5]" />
                  <span>Ongeza bidhaa mara moja</span>
                </>
              ) : (
                <>
                  <PackageCheck className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
                  <span>Stoko ipo ya kutosha</span>
                </>
              )}
            </span>
          </div>
          <div className={`p-2.5 rounded-xl border transition-all ${
            lowStockCount > 0 
              ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/30' 
              : 'bg-slate-50 text-slate-500 border-slate-100'
          }`}>
            <AlertTriangle className="h-5 w-5 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* Main Charts & Mini Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recharts Graphical Display */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Grafu ya Mauzo na Faida ya Wiki Hii</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Muhtasari wa kipato na faida kwa siku 7 zilizopita</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 font-semibold text-slate-600">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                <span>Mauzo</span>
              </span>
              {currentUser.role === 'Admin' && (
                <span className="flex items-center gap-1 font-semibold text-slate-600">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                  <span>Faida</span>
                </span>
              )}
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '2px' }}
                />
                <Area type="monotone" dataKey="Mauzo (Sales)" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                {currentUser.role === 'Admin' && (
                  <Area type="monotone" dataKey="Faida (Profit)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Watch Widget */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight mb-3 flex items-center justify-between">
              <span>Hali ya Bidhaa (Stock Watch)</span>
              {lowStockCount > 0 && (
                <span className="bg-rose-100 text-rose-700 text-[9px] font-black px-2 py-0.5 rounded border border-rose-200 uppercase animate-pulse">Hatari</span>
              )}
            </h4>
            <div className="space-y-2">
              {lowStockProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <PackageCheck className="h-8 w-8 text-emerald-500 stroke-[2]" />
                  <p className="text-xs font-semibold">Stock zote ziko salama kabisa!</p>
                </div>
              ) : (
                lowStockProducts.map(p => {
                  const severity = p.stock <= (p.minStockLevel / 2) ? 'red' : 'orange';
                  return (
                    <div key={p.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                        <span className="text-[10px] text-slate-500 font-semibold block">Aina: {p.category}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          severity === 'red' 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          Salia: {p.stock} {p.unit.split(' ')[0]}
                        </span>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-mono">Min: {p.minStockLevel}</p>
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
              className="mt-3 w-full bg-neutral-900 hover:bg-neutral-850 text-amber-500 border border-neutral-800 font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1"
            >
              <span>Ongeza Mzigo Stooni</span>
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Miamala ya Hivi Karibuni</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Orodha ya risiti na ankara 5 zilizopita</p>
          </div>
          <button 
            id="dash-view-all-reports"
            onClick={() => setScreen('reports')}
            className="text-xs text-amber-600 hover:underline font-bold"
          >
            Angalia Ripoti Zote
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead>
              <tr className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-2.5 px-3">Ankara #</th>
                <th className="py-2.5 px-3">Mteja</th>
                <th className="py-2.5 px-3">Aina</th>
                <th className="py-2.5 px-3">Njia ya Malipo</th>
                <th className="py-2.5 px-3 text-right">Jumla Kuu</th>
                <th className="py-2.5 px-3 text-center">Hali</th>
                <th className="py-2.5 px-3 text-right">Tarehe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Hakuna mauzo yaliyofanyika bado.
                  </td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-amber-600 flex items-center gap-1.5">
                      <span>{order.orderNumber}</span>
                      {order.source_type === 'external_sourced' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-rose-600 text-white leading-none">
                          NJE
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-700">{order.customerName}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                        order.salesType === 'Wholesale' 
                          ? 'bg-cyan-50 border-cyan-150 text-cyan-600' 
                          : 'bg-pink-50 border-pink-150 text-pink-600'
                      }`}>
                        {order.salesType === 'Wholesale' ? 'Jumla' : 'Rejareja'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{order.paymentMethod}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">
                      {order.totalAmount.toLocaleString()} {settings.currency}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold border uppercase ${
                        order.paymentStatus === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                          : order.paymentStatus === 'Partial' 
                          ? 'bg-amber-50 text-amber-700 border-amber-150' 
                          : 'bg-rose-50 text-rose-700 border-rose-150'
                      }`}>
                        {order.paymentStatus === 'Paid' ? 'Imelipwa' : order.paymentStatus === 'Partial' ? 'Nusu' : 'Mkopo'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-500 font-mono text-[11px]">{order.date}</td>
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
