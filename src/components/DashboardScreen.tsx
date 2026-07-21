import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  ShoppingCart, Package, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export const DashboardScreen: React.FC = () => {
  const { 
    products, orders, expenses, currentUser, settings
  } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  const totalCOGS = orders.reduce((sum, order) => {
    const orderCOGS = order.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0);
    return sum + orderCOGS;
  }, 0);

  const grossProfit = totalSales - totalCOGS;
  const totalExpenses = expenses.filter(exp => !exp.isExternalSourcing).reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const totalStockItems = products.reduce((sum, prod) => sum + prod.stock, 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStockLevel).length;

  const getLast7DaysData = () => {
    const days: { dateStr: string; label: string }[] = [];
    const dateMap: { [key: string]: { mauzo: number; faida: number } } = {};
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('sw-TZ', { weekday: 'short' });
      dateMap[dateStr] = { mauzo: 0, faida: 0 };
      days.push({ dateStr, label: dayName });
    }

    orders.forEach(order => {
      const orderDate = order.date.split(' ')[0];
      if (dateMap[orderDate] !== undefined) {
        dateMap[orderDate].mauzo += order.totalAmount;
        const orderCOGS = order.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
        dateMap[orderDate].faida += order.totalAmount - orderCOGS;
      }
    });

    return days.map(day => ({
      name: day.label,
      'Mauzo (Sales)': dateMap[day.dateStr].mauzo,
      'Faida (Profit)': dateMap[day.dateStr].faida,
    }));
  };

  const chartData = getLast7DaysData();
  const lowStockProducts = products.filter(p => p.stock <= p.minStockLevel).slice(0, 4);
  const recentOrders = orders.slice(0, 5);

  return (
    <div id="dashboard-screen" className="space-y-3 font-sans">
      {/* Welcome / actions */}
      <div className="panel flex flex-col md:flex-row md:items-center justify-between gap-3 px-3 py-2.5">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-[var(--color-text)]">
            Hujambo, {currentUser.name}!
          </h2>
          <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
            Umeingia kama <span className="text-[var(--color-brand)] font-semibold">{currentUser.role}</span>. Muhtasari wa biashara na stock kwa leo.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {['Admin', 'Cashier'].includes(currentUser.role) && (
            <button 
              id="dash-quick-pos"
              type="button"
              onClick={() => navigate('/pos')}
              className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-[#faf8f4] font-semibold text-xs px-3 py-1.5 rounded-[5px] flex items-center gap-1.5"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Fanya Mauzo POS</span>
            </button>
          )}
          {['Store Keeper', 'Admin'].includes(currentUser.role) && (
            <button 
              id="dash-quick-inventory"
              type="button"
              onClick={() => navigate('/inventory')}
              className="bg-[var(--color-surface)] hover:bg-[#f0ebe3] text-[var(--color-text)] border border-[var(--color-border)] font-semibold text-xs px-3 py-1.5 rounded-[5px] flex items-center gap-1.5"
            >
              <Package className="h-3.5 w-3.5 text-[var(--color-brand)]" />
              <span>Bidhaa</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="kpi-card kpi-card--neutral">
          <span className="text-[10px] font-semibold text-[var(--color-muted)]">Jumla ya Mauzo</span>
          <p id="stat-total-sales" className="text-sm font-semibold font-mono text-[var(--color-text)] mt-1 tabular-nums">
            {totalSales.toLocaleString()}{' '}
            <span className="text-[10px] font-normal text-[var(--color-muted)]">{settings.currency}</span>
          </p>
          <p className="text-[10px] text-[var(--color-muted)] mt-1">Mauzo ya duka lote</p>
        </div>

        {currentUser.role === 'Admin' ? (
          <div className={`kpi-card ${netProfit >= 0 ? 'kpi-card--ok' : 'kpi-card--alert'}`}>
            <span className="text-[10px] font-semibold text-[var(--color-muted)]">Faida Halisi (Net)</span>
            <p id="stat-net-profit" className={`text-sm font-semibold font-mono mt-1 tabular-nums ${netProfit >= 0 ? 'text-[var(--color-ok)]' : 'text-[var(--color-alert)]'}`}>
              {netProfit.toLocaleString()}{' '}
              <span className="text-[10px] font-normal text-[var(--color-muted)]">{settings.currency}</span>
            </p>
            <p className={`text-[10px] mt-1 flex items-center gap-0.5 ${netProfit >= 0 ? 'text-[var(--color-ok)]' : 'text-[var(--color-alert)]'}`}>
              {netProfit >= 0 ? (
                <><ArrowUpRight className="h-3 w-3" /><span>Inaleta faida nzuri</span></>
              ) : (
                <><ArrowDownRight className="h-3 w-3" /><span>Duka lina hasara (Net)</span></>
              )}
            </p>
          </div>
        ) : (
          <div className="kpi-card kpi-card--neutral">
            <span className="text-[10px] font-semibold text-[var(--color-muted)]">Miamala ya Mauzo</span>
            <p className="text-sm font-semibold font-mono text-[var(--color-text)] mt-1 tabular-nums">
              {orders.length}{' '}
              <span className="text-[10px] font-normal text-[var(--color-muted)]">Invoices</span>
            </p>
            <p className="text-[10px] text-[var(--color-muted)] mt-1">Invoices zilizolipwa</p>
          </div>
        )}

        {currentUser.role === 'Admin' ? (
          <div className="kpi-card kpi-card--warn">
            <span className="text-[10px] font-semibold text-[var(--color-muted)]">Gharama (Expenses)</span>
            <p id="stat-total-expenses" className="text-sm font-semibold font-mono text-[var(--color-text)] mt-1 tabular-nums">
              {totalExpenses.toLocaleString()}{' '}
              <span className="text-[10px] font-normal text-[var(--color-muted)]">{settings.currency}</span>
            </p>
            <p className="text-[10px] text-[var(--color-muted)] mt-1">Matumizi ya duka mwezi huu</p>
          </div>
        ) : (
          <div className="kpi-card kpi-card--neutral">
            <span className="text-[10px] font-semibold text-[var(--color-muted)]">Jumla ya Bidhaa</span>
            <p className="text-sm font-semibold font-mono text-[var(--color-text)] mt-1 tabular-nums">
              {totalStockItems.toLocaleString()}{' '}
              <span className="text-[10px] font-normal text-[var(--color-muted)]">Pcs</span>
            </p>
            <p className="text-[10px] text-[var(--color-muted)] mt-1">Stoo yote kwa ujumla</p>
          </div>
        )}

        <div
          role={['Admin', 'Store Keeper'].includes(currentUser.role) ? 'button' : undefined}
          tabIndex={['Admin', 'Store Keeper'].includes(currentUser.role) ? 0 : undefined}
          onClick={() => ['Admin', 'Store Keeper'].includes(currentUser.role) && navigate('/low_stock')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && ['Admin', 'Store Keeper'].includes(currentUser.role)) navigate('/low_stock');
          }}
          className={`kpi-card ${lowStockCount > 0 ? 'kpi-card--alert' : 'kpi-card--ok'} ${
            ['Admin', 'Store Keeper'].includes(currentUser.role) ? 'cursor-pointer hover:bg-[#f5f1ea]' : ''
          }`}
        >
          <span className="text-[10px] font-semibold text-[var(--color-muted)]">Stoki ya Chini</span>
          <p id="stat-low-stock" className={`text-sm font-semibold font-mono mt-1 tabular-nums ${lowStockCount > 0 ? 'text-[var(--color-alert)]' : 'text-[var(--color-text)]'}`}>
            {lowStockCount}{' '}
            <span className="text-[10px] font-normal text-[var(--color-muted)]">Bidhaa</span>
          </p>
          <p className={`text-[10px] mt-1 ${lowStockCount > 0 ? 'text-[var(--color-alert)]' : 'text-[var(--color-ok)]'}`}>
            {lowStockCount > 0 ? 'Ongeza bidhaa mara moja' : 'Stoko ipo ya kutosha'}
          </p>
        </div>
      </div>

      {/* Chart + stock watch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        <div className="lg:col-span-2 panel p-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text)]">Grafu ya Mauzo na Faida ya Wiki Hii</h4>
              <p className="text-[10px] text-[var(--color-muted)] mt-0.5">Muhtasari wa kipato na faida kwa siku 7 zilizopita</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-medium text-[var(--color-muted)]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#8c5a2b] rounded-[1px]" />
                Mauzo
              </span>
              {currentUser.role === 'Admin' && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#5c7a5c] rounded-[1px]" />
                  Faida
                </span>
              )}
            </div>
          </div>
          
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barGap={2} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#ddd4c6" />
                <XAxis dataKey="name" stroke="#9a9084" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#9a9084" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#2a2826',
                    border: '1px solid #4a4642',
                    borderRadius: '5px',
                    color: '#faf8f4',
                    fontSize: '11px',
                    boxShadow: 'none',
                  }}
                  cursor={{ fill: 'rgba(180, 83, 9, 0.06)' }}
                />
                <Bar dataKey="Mauzo (Sales)" fill="#8c5a2b" radius={[2, 2, 0, 0]} maxBarSize={28} />
                {currentUser.role === 'Admin' && (
                  <Bar dataKey="Faida (Profit)" fill="#5c7a5c" radius={[2, 2, 0, 0]} maxBarSize={28} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-[var(--color-text)]">Hali ya Bidhaa (Stock Watch)</h4>
            {lowStockCount > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] border border-[var(--color-alert)] text-[var(--color-alert)] bg-[#faf0ee]">
                Hatari
              </span>
            )}
          </div>
          <div className="space-y-1.5 flex-1">
            {lowStockProducts.length === 0 ? (
              <div className="empty-banner">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ok)] shrink-0" />
                <span>Stock zote ziko salama kabisa!</span>
              </div>
            ) : (
              lowStockProducts.map(p => {
                const severity = p.stock <= (p.minStockLevel / 2) ? 'alert' : 'warn';
                return (
                  <div
                    key={p.id}
                    className="px-2 py-1.5 border border-[var(--color-border)] rounded-[5px] flex items-center justify-between gap-2"
                    style={{ borderLeftWidth: 3, borderLeftColor: severity === 'alert' ? 'var(--color-alert)' : 'var(--color-warn)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-[var(--color-text)] leading-snug break-words">{p.name}</p>
                      <span className="text-[10px] text-[var(--color-muted)]">Aina: {p.category}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold font-mono ${severity === 'alert' ? 'text-[var(--color-alert)]' : 'text-[var(--color-warn)]'}`}>
                        Salia: {p.stock}
                      </span>
                      <p className="text-[9px] text-[var(--color-muted)] font-mono">Min: {p.minStockLevel}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {['Admin', 'Store Keeper'].includes(currentUser.role) && lowStockCount > 0 && (
            <button 
              id="dash-add-stock-btn"
              type="button"
              onClick={() => navigate('/low_stock')}
              className="mt-2 w-full bg-[#2a2826] hover:bg-[#1c1b19] text-[#e8c48a] border border-[#4a4642] font-semibold text-xs py-1.5 rounded-[5px] flex items-center justify-center gap-1"
            >
              <span>Ongeza Mzigo Stooni</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="panel p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-xs font-semibold text-[var(--color-text)]">Miamala ya Hivi Karibuni</h4>
            <p className="text-[10px] text-[var(--color-muted)] mt-0.5">Orodha ya risiti na ankara 5 zilizopita</p>
          </div>
          <button 
            id="dash-view-all-reports"
            type="button"
            onClick={() => navigate('/reports')}
            className="text-xs text-[var(--color-brand)] hover:underline font-semibold"
          >
            Angalia Ripoti Zote
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-[10px] font-semibold text-[var(--color-muted)] border-b border-[var(--color-border)]">
                <th className="py-2 px-2">Ankara #</th>
                <th className="py-2 px-2">Mteja</th>
                <th className="py-2 px-2">Aina</th>
                <th className="py-2 px-2">Njia ya Malipo</th>
                <th className="py-2 px-2 text-right">Jumla Kuu</th>
                <th className="py-2 px-2 text-center">Hali</th>
                <th className="py-2 px-2 text-right">Tarehe</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[var(--color-border)]">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-3 px-2">
                    <div className="empty-banner">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted)] shrink-0" />
                      <span>Hakuna mauzo yaliyofanyika bado.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-[#f5f1ea]">
                    <td className="py-1.5 px-2 font-mono font-semibold text-[var(--color-brand)]">
                      <span className="inline-flex items-center gap-1">
                        {order.orderNumber}
                        {order.source_type === 'external_sourced' && (
                          <span className="px-1 py-0.5 rounded-[3px] text-[8px] font-bold bg-[var(--color-alert)] text-[#faf8f4]">
                            NJE
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 font-medium text-[var(--color-text)]">{order.customerName}</td>
                    <td className="py-1.5 px-2">
                      <span className={`px-1.5 py-0.5 rounded-[3px] text-[9px] font-semibold border ${
                        order.salesType === 'Wholesale' 
                          ? 'border-[#c4b8a8] text-[#6b5740] bg-[#f5f1ea]' 
                          : 'border-[#d4a574] text-[#8c3d08] bg-[#faf6f1]'
                      }`}>
                        {order.salesType === 'Wholesale' ? 'Jumla' : 'Rejareja'}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-[var(--color-muted)]">{order.paymentMethod}</td>
                    <td className="py-1.5 px-2 text-right font-semibold font-mono text-[var(--color-text)]">
                      {order.totalAmount.toLocaleString()} {settings.currency}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded-[3px] text-[9px] font-semibold border ${
                        order.paymentStatus === 'Paid' 
                          ? 'border-[#a8bda8] text-[var(--color-ok)] bg-[#eef2ee]' 
                          : order.paymentStatus === 'Partial' 
                          ? 'border-[#e0c9a8] text-[var(--color-warn)] bg-[#faf6f1]' 
                          : 'border-[#e0b4ac] text-[var(--color-alert)] bg-[#faf0ee]'
                      }`}>
                        {order.paymentStatus === 'Paid' ? 'Imelipwa' : order.paymentStatus === 'Partial' ? 'Nusu' : 'Mkopo'}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-right text-[var(--color-muted)] font-mono text-[11px]">{order.date}</td>
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
