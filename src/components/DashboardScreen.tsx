import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  ShoppingCart, Package, ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const DONUT_COLORS = {
  wholesale: '#D97706',
  retail: '#15803d',
};

function dayKey(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatCompact(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    const v = n / 1_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return Math.round(n).toLocaleString();
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0;
    return null; // no baseline
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function avatarHue(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * 17) % 360;
  return `hsl(${h} 28% 38%)`;
}

const MiniSparkline: React.FC<{ values: number[]; color: string }> = ({ values, color }) => {
  const w = 72;
  const h = 28;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const pts = values.map((v, i) => {
    const x = values.length <= 1 ? w / 2 : (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 opacity-90" aria-hidden>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  );
};

const TrendBadge: React.FC<{ pct: number | null }> = ({ pct }) => {
  if (pct === null) {
    return <span className="kpi-trend-flat">—</span>;
  }
  const rounded = Math.round(Math.abs(pct));
  if (pct > 0.5) {
    return <span className="kpi-trend-up">↑ {rounded}%</span>;
  }
  if (pct < -0.5) {
    return <span className="kpi-trend-down">↓ {rounded}%</span>;
  }
  return <span className="kpi-trend-flat">→ 0%</span>;
};

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
  const shopExpenses = expenses.filter(exp => !exp.isExternalSourcing);
  const totalExpenses = shopExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const totalStockItems = products.reduce((sum, prod) => sum + prod.stock, 0);
  const lowStockProductsAll = products.filter(p => p.stock <= p.minStockLevel);
  const lowStockCount = lowStockProductsAll.length;
  const lowStockProducts = lowStockProductsAll.slice(0, 12);

  const wholesaleSales = orders
    .filter((o) => o.salesType === 'Wholesale')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const retailSales = orders
    .filter((o) => o.salesType === 'Retail')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const mixTotal = wholesaleSales + retailSales;
  const dominantPct = mixTotal > 0
    ? Math.round((Math.max(wholesaleSales, retailSales) / mixTotal) * 100)
    : 0;

  const salesMixData = [
    { name: 'Jumla', value: wholesaleSales, color: DONUT_COLORS.wholesale },
    { name: 'Rejareja', value: retailSales, color: DONUT_COLORS.retail },
  ].filter((d) => d.value > 0);

  const buildWeekSeries = () => {
    const days: { dateStr: string; label: string; mauzo: number; faida: number; gharama: number; invoices: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dateStr = dayKey(d);
      days.push({
        dateStr,
        label: d.toLocaleDateString('sw-TZ', { weekday: 'short' }),
        mauzo: 0,
        faida: 0,
        gharama: 0,
        invoices: 0,
      });
    }
    const map = Object.fromEntries(days.map((d) => [d.dateStr, d]));

    orders.forEach((order) => {
      const orderDate = order.date.split(' ')[0];
      const row = map[orderDate];
      if (!row) return;
      row.mauzo += order.totalAmount;
      const cogs = order.items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
      row.faida += order.totalAmount - cogs;
      row.invoices += 1;
    });

    shopExpenses.forEach((exp) => {
      const ed = exp.date.split(' ')[0];
      const row = map[ed];
      if (row) row.gharama += exp.amount;
    });

    return days;
  };

  const weekSeries = buildWeekSeries();

  const sumRange = (startOffset: number, endOffset: number) => {
    let mauzo = 0;
    let faida = 0;
    let gharama = 0;
    let invoices = 0;
    for (let i = startOffset; i <= endOffset; i++) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      orders.forEach((order) => {
        if (order.date.split(' ')[0] !== key) return;
        mauzo += order.totalAmount;
        const cogs = order.items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
        faida += order.totalAmount - cogs;
        invoices += 1;
      });
      shopExpenses.forEach((exp) => {
        if (exp.date.split(' ')[0] === key) gharama += exp.amount;
      });
    }
    return { mauzo, faida: faida - gharama, gharama, invoices };
  };

  // This week (0–6) vs previous week (7–13)
  const thisWeek = sumRange(0, 6);
  const prevWeek = sumRange(7, 13);

  const salesTrend = pctChange(thisWeek.mauzo, prevWeek.mauzo);
  const profitTrend = pctChange(thisWeek.faida, prevWeek.faida);
  const expenseTrend = pctChange(thisWeek.gharama, prevWeek.gharama);
  const invoiceTrend = pctChange(thisWeek.invoices, prevWeek.invoices);
  // Low stock has no history — treat rising count as negative
  const stockTrend = lowStockCount === 0 ? 0 : null;

  const chartData = weekSeries.map((day) => ({
    name: day.label,
    'Mauzo (Sales)': day.mauzo,
    'Faida (Profit)': day.faida - day.gharama,
  }));

  const recentOrders = orders.slice(0, 5);

  const tooltipStyle = {
    backgroundColor: '#1c1917',
    border: '1px solid #44403c',
    borderRadius: '8px',
    color: '#fafaf9',
    fontSize: '11px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
  };

  const formatTzs = (n: number) =>
    `${Math.round(n).toLocaleString()} ${settings.currency}`;

  return (
    <div id="dashboard-screen" className="space-y-3.5 font-sans">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {['Admin', 'Cashier'].includes(currentUser.role) && (
          <button 
            id="dash-quick-pos"
            type="button"
            onClick={() => navigate('/pos')}
            className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-[#faf8f4] font-semibold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm"
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
            className="bg-[var(--color-surface)] hover:bg-[#f0ebe3] text-[var(--color-text)] border border-[var(--color-border)] font-semibold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5"
          >
            <Package className="h-3.5 w-3.5 text-[var(--color-brand)]" />
            <span>Bidhaa</span>
          </button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card kpi-card--neutral">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-[var(--color-muted)]">Jumla ya Mauzo</span>
              <p id="stat-total-sales" className="text-sm font-semibold font-mono text-[var(--color-text)] mt-1 tabular-nums flex items-center gap-1.5 flex-wrap">
                <span>
                  {totalSales.toLocaleString()}{' '}
                  <span className="text-[10px] font-normal text-[var(--color-muted)]">{settings.currency}</span>
                </span>
                <TrendBadge pct={salesTrend} />
              </p>
              <p className="text-[10px] text-[var(--color-muted)] mt-1">Mauzo ya duka lote</p>
            </div>
            <MiniSparkline values={weekSeries.map((d) => d.mauzo)} color="#D97706" />
          </div>
        </div>

        {currentUser.role === 'Admin' ? (
          <div className={`kpi-card ${netProfit >= 0 ? 'kpi-card--ok' : 'kpi-card--alert'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-[var(--color-muted)]">Faida Halisi (Net)</span>
                <p id="stat-net-profit" className={`text-sm font-semibold font-mono mt-1 tabular-nums flex items-center gap-1.5 flex-wrap ${netProfit >= 0 ? 'text-[var(--color-ok)]' : 'text-[var(--color-alert)]'}`}>
                  <span>
                    {netProfit.toLocaleString()}{' '}
                    <span className="text-[10px] font-normal text-[var(--color-muted)]">{settings.currency}</span>
                  </span>
                  <TrendBadge pct={profitTrend} />
                </p>
                <p className={`text-[10px] mt-1 ${netProfit >= 0 ? 'text-[var(--color-ok)]' : 'text-[var(--color-alert)]'}`}>
                  {netProfit >= 0 ? 'Inaleta faida nzuri' : 'Duka lina hasara (Net)'}
                </p>
              </div>
              <MiniSparkline
                values={weekSeries.map((d) => d.faida - d.gharama)}
                color={netProfit >= 0 ? '#15803d' : '#b91c1c'}
              />
            </div>
          </div>
        ) : (
          <div className="kpi-card kpi-card--neutral">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-[var(--color-muted)]">Miamala ya Mauzo</span>
                <p className="text-sm font-semibold font-mono text-[var(--color-text)] mt-1 tabular-nums flex items-center gap-1.5 flex-wrap">
                  <span>
                    {orders.length}{' '}
                    <span className="text-[10px] font-normal text-[var(--color-muted)]">Invoices</span>
                  </span>
                  <TrendBadge pct={invoiceTrend} />
                </p>
                <p className="text-[10px] text-[var(--color-muted)] mt-1">Invoices zilizolipwa</p>
              </div>
              <MiniSparkline values={weekSeries.map((d) => d.invoices)} color="#78716c" />
            </div>
          </div>
        )}

        {currentUser.role === 'Admin' ? (
          <div className="kpi-card kpi-card--warn">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-[var(--color-muted)]">Gharama (Expenses)</span>
                {totalExpenses === 0 ? (
                  <p id="stat-total-expenses" className="text-sm font-semibold mt-1 text-[var(--color-muted)]">
                    Hakuna gharama bado
                  </p>
                ) : (
                  <p id="stat-total-expenses" className="text-sm font-semibold font-mono text-[var(--color-text)] mt-1 tabular-nums flex items-center gap-1.5 flex-wrap">
                    <span>
                      {totalExpenses.toLocaleString()}{' '}
                      <span className="text-[10px] font-normal text-[var(--color-muted)]">{settings.currency}</span>
                    </span>
                    <TrendBadge pct={expenseTrend} />
                  </p>
                )}
                <p className="text-[10px] text-[var(--color-muted)] mt-1">Matumizi ya duka mwezi huu</p>
              </div>
              <MiniSparkline values={weekSeries.map((d) => d.gharama)} color="#D97706" />
            </div>
          </div>
        ) : (
          <div className="kpi-card kpi-card--neutral">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-[var(--color-muted)]">Jumla ya Bidhaa</span>
                <p className="text-sm font-semibold font-mono text-[var(--color-text)] mt-1 tabular-nums">
                  {totalStockItems.toLocaleString()}{' '}
                  <span className="text-[10px] font-normal text-[var(--color-muted)]">Pcs</span>
                </p>
                <p className="text-[10px] text-[var(--color-muted)] mt-1">Stoo yote kwa ujumla</p>
              </div>
              <MiniSparkline
                values={weekSeries.map((d) => d.mauzo)}
                color="#78716c"
              />
            </div>
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
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-[var(--color-muted)]">Stoki ya Chini</span>
              <p id="stat-low-stock" className={`text-sm font-semibold font-mono mt-1 tabular-nums flex items-center gap-1.5 flex-wrap ${lowStockCount > 0 ? 'text-[var(--color-alert)]' : 'text-[var(--color-text)]'}`}>
                <span>
                  {lowStockCount}{' '}
                  <span className="text-[10px] font-normal text-[var(--color-muted)]">Bidhaa</span>
                </span>
                <TrendBadge pct={stockTrend} />
              </p>
              <p className={`text-[10px] mt-1 ${lowStockCount > 0 ? 'text-[var(--color-alert)]' : 'text-[var(--color-ok)]'}`}>
                {lowStockCount > 0 ? 'Ongeza bidhaa mara moja' : 'Stoko ipo ya kutosha'}
              </p>
            </div>
            <MiniSparkline
              values={weekSeries.map((_, i) => (lowStockCount > 0 ? Math.max(0, lowStockCount - (6 - i) * 0) : 0))}
              color={lowStockCount > 0 ? '#b91c1c' : '#15803d'}
            />
          </div>
        </div>
      </div>

      {/* Bar + donut + stock watch */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-2 panel panel--accent p-3.5" style={{ ['--accent' as string]: '#D97706' }}>
          <div className="flex items-center justify-between mb-3 pt-0.5">
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text)]">Grafu ya Mauzo na Faida ya Wiki Hii</h4>
              <p className="text-[10px] text-[var(--color-muted)] mt-0.5">Muhtasari wa kipato na faida kwa siku 7 zilizopita</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-medium text-[var(--color-muted)]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#D97706] rounded-[2px]" />
                Mauzo
              </span>
              {currentUser.role === 'Admin' && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#15803d] rounded-[2px]" />
                  Faida
                </span>
              )}
            </div>
          </div>
          
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }} barGap={3} barCategoryGap="26%">
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#c4b8a8" strokeOpacity={0.45} />
                <XAxis dataKey="name" stroke="#78716c" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#78716c"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tickFormatter={(v: number) => formatCompact(v)}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(217, 119, 6, 0.08)' }}
                  formatter={(value: number | undefined, name: string | undefined) => [
                    formatTzs(Number(value ?? 0)),
                    name ?? '',
                  ]}
                />
                <Bar dataKey="Mauzo (Sales)" fill="#D97706" radius={[6, 6, 0, 0]} maxBarSize={30} />
                {currentUser.role === 'Admin' && (
                  <Bar dataKey="Faida (Profit)" fill="#15803d" radius={[6, 6, 0, 0]} maxBarSize={30} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel panel--accent p-3.5 flex flex-col" style={{ ['--accent' as string]: '#D97706' }}>
          <h4 className="text-xs font-semibold text-[var(--color-text)] mb-1 pt-0.5">Aina ya Mauzo</h4>
          <p className="text-[10px] text-[var(--color-muted)] mb-3">Jumla dhidi ya Rejareja</p>
          <div className="relative h-44 w-full">
            {salesMixData.length === 0 ? (
              <div className="empty-banner h-full items-center justify-center">
                <span>Hakuna mauzo ya kuchora.</span>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesMixData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {salesMixData.map((entry, index) => (
                        <Cell key={`mix-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number | undefined, name: string | undefined) => {
                        const v = Number(value ?? 0);
                        const pct = mixTotal > 0 ? Math.round((v / mixTotal) * 100) : 0;
                        return [`${formatTzs(v)} (${pct}%)`, name ?? ''];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold font-mono text-[var(--color-text)] tabular-nums">
                    {dominantPct}%
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="space-y-2 text-[10px] font-semibold mt-4 pt-1">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[var(--color-muted)]">
                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: DONUT_COLORS.wholesale }} />
                Jumla
              </span>
              <span className="font-mono text-[var(--color-text)] tabular-nums">
                {wholesaleSales.toLocaleString()}
                {mixTotal > 0 && (
                  <span className="text-[var(--color-muted)] font-sans font-medium ml-1">
                    ({Math.round((wholesaleSales / mixTotal) * 100)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[var(--color-muted)]">
                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: DONUT_COLORS.retail }} />
                Rejareja
              </span>
              <span className="font-mono text-[var(--color-text)] tabular-nums">
                {retailSales.toLocaleString()}
                {mixTotal > 0 && (
                  <span className="text-[var(--color-muted)] font-sans font-medium ml-1">
                    ({Math.round((retailSales / mixTotal) * 100)}%)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div
          className="panel panel--accent p-3.5 flex flex-col"
          style={{ ['--accent' as string]: lowStockCount > 0 ? '#b91c1c' : '#15803d' }}
        >
          <div className="flex items-center justify-between mb-2 pt-0.5">
            <h4 className="text-xs font-semibold text-[var(--color-text)]">Hali ya Bidhaa (Stock Watch)</h4>
            {lowStockCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[var(--color-alert)] text-[var(--color-alert)] bg-[#fef2f2]">
                <span className="hatari-pulse" aria-hidden />
                Hatari
              </span>
            )}
          </div>
          <div className={`space-y-1.5 flex-1 ${lowStockProducts.length > 3 ? 'stock-watch-scroll' : ''}`}>
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
                    className="px-2 py-1.5 border border-[var(--color-border)] rounded-xl flex items-center justify-between gap-2"
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
              className="mt-2 w-full bg-[#1c1917] hover:bg-[#0c0a09] text-[#fbbf24] border border-[#44403c] font-semibold text-xs py-1.5 rounded-xl transition-all flex items-center justify-center gap-1"
            >
              <span>Ongeza Mzigo Stooni</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="panel panel--accent p-3.5" style={{ ['--accent' as string]: '#78716c' }}>
        <div className="flex items-center justify-between mb-2.5 pt-0.5">
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

        <div className="overflow-x-auto rounded-xl">
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
            <tbody className="text-xs">
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
                  <tr key={order.id} className="dash-table-row border-b border-[var(--color-border)] last:border-0">
                    <td className="py-2 px-2 font-mono font-semibold text-[var(--color-brand)]">
                      <span className="inline-flex items-center gap-1">
                        {order.orderNumber}
                        {order.source_type === 'external_sourced' && (
                          <span className="px-1 py-0.5 rounded-full text-[8px] font-bold bg-[var(--color-alert)] text-[#faf8f4]">
                            NJE
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-medium text-[var(--color-text)]">
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <span className="customer-avatar" style={{ background: avatarHue(order.customerName) }}>
                          {initials(order.customerName)}
                        </span>
                        <span className="truncate">{order.customerName}</span>
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${
                        order.salesType === 'Wholesale' 
                          ? 'border-[#c4b8a8] text-[#57534e] bg-[#f5f1ea]' 
                          : 'border-[#fdba74] text-[#9a3412] bg-[#fff7ed]'
                      }`}>
                        {order.salesType === 'Wholesale' ? 'Jumla' : 'Rejareja'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-[var(--color-muted)]">{order.paymentMethod}</td>
                    <td className="py-2 px-2 text-right font-semibold font-mono text-[var(--color-text)]">
                      {order.totalAmount.toLocaleString()} {settings.currency}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={
                          order.paymentStatus === 'Paid'
                            ? 'status-pill status-pill--paid'
                            : order.paymentStatus === 'Partial'
                              ? 'status-pill status-pill--pending'
                              : 'status-pill status-pill--overdue'
                        }
                      >
                        {order.paymentStatus === 'Paid' ? 'Imelipwa' : order.paymentStatus === 'Partial' ? 'Nusu' : 'Mkopo'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right text-[var(--color-muted)] font-mono text-[11px]">{order.date}</td>
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
