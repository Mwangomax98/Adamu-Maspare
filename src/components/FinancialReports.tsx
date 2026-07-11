import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Award, TrendingDown, ClipboardList, RefreshCw, Layers, CalendarRange } from 'lucide-react';

interface FinancialReportsProps {
  initialTab?: 'sales' | 'profit_loss' | 'stock_movement';
}

export const FinancialReports: React.FC<FinancialReportsProps> = ({ initialTab = 'sales' }) => {
  const { orders, expenses, stockMovements, settings } = useApp();
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'profit_loss' | 'stock_movement'>(initialTab);

  React.useEffect(() => {
    setActiveReportTab(initialTab);
  }, [initialTab]);
  
  // Sales Report Sub-tabs
  const [salesTimeframe, setSalesTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // --- 1. SALES REPORT CALCULATIONS ---
  const getSalesChartData = () => {
    const dataMap: { [key: string]: number } = {};
    const labels: string[] = [];

    if (salesTimeframe === 'daily') {
      // Last 24 hours / days
      for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dataMap[key] = 0;
        labels.push(key);
      }
    } else if (salesTimeframe === 'weekly') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dataMap[key] = 0;
        labels.push(key);
      }
    } else {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dataMap[key] = 0;
        labels.push(key);
      }
    }

    // Accumulate
    orders.forEach(order => {
      const orderDate = order.date.split(' ')[0];
      if (dataMap[orderDate] !== undefined) {
        dataMap[orderDate] += order.totalAmount;
      }
    });

    return labels.map(lbl => {
      // format date label to be more readable
      const parts = lbl.split('-');
      const formattedLabel = `${parts[2]}/${parts[1]}`;
      return {
        Tarehe: formattedLabel,
        'Mauzo (Sales)': dataMap[lbl]
      };
    });
  };

  const salesChartData = getSalesChartData();
  const totalSalesSum = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  // --- 2. PROFIT & LOSS CALCULATIONS ---
  const totalRevenue = totalSalesSum;
  
  // COGS
  const totalCOGS = orders.reduce((sum, o) => {
    const orderCOGS = o.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0);
    return sum + orderCOGS;
  }, 0);

  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

  // Pie chart data for P&L breakdown
  const plPieData = [
    { name: 'Cost of Goods (COGS)', value: totalCOGS, color: '#f59e0b' },
    { name: 'Expenses (Matumizi)', value: totalExpenses, color: '#f43f5e' },
    { name: 'Net Profit (Faida)', value: Math.max(0, netProfit), color: '#10b981' }
  ];

  return (
    <div id="financial-reports" className="space-y-6 font-sans">
      
      {/* Tab Selectors */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-1.5 shrink-0">
        <button
          id="report-tab-sales"
          onClick={() => setActiveReportTab('sales')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase transition-all ${
            activeReportTab === 'sales'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/15'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Ripoti za Mauzo</span>
        </button>

        <button
          id="report-tab-pl"
          onClick={() => setActiveReportTab('profit_loss')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase transition-all ${
            activeReportTab === 'profit_loss'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/15'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Faida na Hasara (P&L)</span>
        </button>

        <button
          id="report-tab-movement"
          onClick={() => setActiveReportTab('stock_movement')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase transition-all ${
            activeReportTab === 'stock_movement'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/15'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Miondoko ya Stock (Audit)</span>
        </button>
      </div>

      {/* RENDER ACTIVE TAB BODY */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        
        {/* TAB 1: SALES REPORTS */}
        {activeReportTab === 'sales' && (
          <div className="space-y-6">
            
            {/* Header timeframe filter */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-base font-bold uppercase text-slate-800">Uchambuzi na Ripoti ya Mauzo</h3>
                <p className="text-xs text-slate-500 mt-1">Angalia mauzo yako ya siku, ya wiki au mwezi mzima.</p>
              </div>

              {/* Timeframe picker */}
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1 self-start">
                {[
                  { id: 'daily', label: 'Siku 5 zilizopita' },
                  { id: 'weekly', label: 'Wiki Hii' },
                  { id: 'monthly', label: 'Mwezi Huu' }
                ].map(tf => (
                  <button
                    key={tf.id}
                    id={`sales-tf-${tf.id}`}
                    onClick={() => setSalesTimeframe(tf.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      salesTimeframe === tf.id
                        ? 'bg-white text-teal-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sales Chart using Recharts Bar Chart */}
            <div className="h-80 w-full bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="Tarehe" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="Mauzo (Sales)" fill="#0d9488" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sales invoices list table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Orodha ya Ankara zote</h4>
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="min-w-full text-left text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                      <th className="py-3 px-4">Ankara #</th>
                      <th className="py-3 px-4">Mteja</th>
                      <th className="py-3 px-4 text-right">Kiasi Halisi</th>
                      <th className="py-3 px-4 text-center">Njia ya Malipo</th>
                      <th className="py-3 px-4 text-center">Hali ya Malipo</th>
                      <th className="py-3 px-4 text-right">Tarehe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-600">#{o.orderNumber}</td>
                        <td className="py-3.5 px-4 text-slate-800">{o.customerName}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800 font-mono">
                          {o.totalAmount.toLocaleString()} TZS
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500">{o.paymentMethod}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            o.paymentStatus === 'Paid' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {o.paymentStatus === 'Paid' ? 'Imelipwa' : 'Partial / Mkopo'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400 font-mono">{o.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: PROFIT & LOSS STATEMENT */}
        {activeReportTab === 'profit_loss' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-base font-bold uppercase text-slate-800">Muhtasari wa Faida na Hasara (P&L Statement)</h3>
              <p className="text-xs text-slate-500 mt-1">Kukokotoa mapato ya jumla, gharama za bidhaa (COGS), matumizi na kupata faida halisi.</p>
            </div>

            {/* P&L Breakdown grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              
              {/* Financial sheet calculation list */}
              <div className="space-y-4 font-semibold text-sm">
                
                {/* Revenue */}
                <div className="p-4 bg-teal-50/50 border border-teal-100/60 rounded-2xl flex justify-between items-center text-teal-900">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">MAPATO YA MAUZO (REVENUE)</p>
                    <h4 className="text-xl font-black font-mono mt-1">+{totalRevenue.toLocaleString()} TZS</h4>
                  </div>
                  <TrendingUp className="h-6 w-6 text-teal-600 shrink-0" />
                </div>

                {/* Cost of Goods Sold */}
                <div className="p-4 bg-amber-50/50 border border-amber-100/60 rounded-2xl flex justify-between items-center text-amber-900">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">GHARAMA YA BIDHAA (COGS)</p>
                    <h4 className="text-xl font-black font-mono mt-1">-{totalCOGS.toLocaleString()} TZS</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Thamani ya ununuzi wa mzigo uliouzwa</p>
                  </div>
                  <Layers className="h-6 w-6 text-amber-600 shrink-0" />
                </div>

                {/* Gross Profit */}
                <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-slate-700">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">FAIDA YA KWANZA (GROSS PROFIT)</p>
                    <h4 className="text-lg font-extrabold font-mono mt-1">={grossProfit.toLocaleString()} TZS</h4>
                  </div>
                </div>

                {/* Operational Expenses */}
                <div className="p-4 bg-rose-50/50 border border-rose-100/60 rounded-2xl flex justify-between items-center text-rose-900">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">GHARAMA ZA UENDESHAJI (EXPENSES)</p>
                    <h4 className="text-xl font-black font-mono mt-1">-{totalExpenses.toLocaleString()} TZS</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Luku, pango, usafiri, n.k.</p>
                  </div>
                  <TrendingDown className="h-6 w-6 text-rose-600 shrink-0" />
                </div>

                {/* Net Profit */}
                <div className={`p-5 rounded-2xl flex justify-between items-center text-white shadow-lg ${
                  netProfit >= 0 
                    ? 'bg-emerald-600 shadow-emerald-600/10' 
                    : 'bg-rose-600 shadow-rose-600/10'
                }`}>
                  <div>
                    <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">FAIDA HALISI (NET PROFIT)</p>
                    <h4 id="pl-net-profit" className="text-2xl font-black font-mono mt-1">{netProfit.toLocaleString()} TZS</h4>
                    <p className="text-[10px] text-emerald-100/80 font-medium mt-1">
                      Kiwango cha Faida (Profit Margin): {profitMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>

              </div>

              {/* Pie Chart of allocations */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 text-center">Mgao wa Matumizi na Thamani</h4>
                <div className="h-60 w-full max-w-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={plPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {plPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => value.toLocaleString() + ' TZS'} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legends */}
                <div className="space-y-1.5 text-[11px] font-bold mt-4">
                  {plPieData.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-600">{item.name}:</span>
                      <span className="text-slate-800 font-mono">{item.value.toLocaleString()} TZS</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: STOCK MOVEMENTS LOG */}
        {activeReportTab === 'stock_movement' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold uppercase text-slate-800">Miondoko na Kumbukumbu ya Stock (Stock Movements)</h3>
              <p className="text-xs text-slate-500 mt-1">Kumbukumbu ya kila harakati ya stoo: bidhaa kuingia, kutoka, uhamisho, au upatanisho.</p>
            </div>

            {/* Logs list table */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
              <table className="min-w-full text-left text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                    <th className="py-3 px-4">Tarehe & Saa</th>
                    <th className="py-3 px-4">Bidhaa</th>
                    <th className="py-3 px-4 text-center">Aina ya Log</th>
                    <th className="py-3 px-4 text-center">Idadi (Qty)</th>
                    <th className="py-3 px-4">Kutoka (Source)</th>
                    <th className="py-3 px-4 font-mono">Kwenda (Dest)</th>
                    <th className="py-3 px-4 font-mono">Rejeo (Reference)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {stockMovements.map(m => {
                    let typeBadge = 'bg-slate-100 text-slate-600';
                    if (m.type === 'Stock In') typeBadge = 'bg-emerald-100 text-emerald-700';
                    if (m.type === 'Stock Out') typeBadge = 'bg-rose-100 text-rose-700';
                    if (m.type === 'Transfer') typeBadge = 'bg-teal-100 text-teal-700';
                    if (m.type === 'Adjustment') typeBadge = 'bg-amber-100 text-amber-700';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 text-slate-400 font-mono">{m.date}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{m.productName}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${typeBadge}`}>
                            {m.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold font-mono">
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity} Pcs
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 truncate max-w-[120px]">{m.source}</td>
                        <td className="py-3.5 px-4 text-slate-500 truncate max-w-[120px]">{m.destination}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{m.reference}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
